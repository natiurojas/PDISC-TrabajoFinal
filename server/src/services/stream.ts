import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { config } from '../config.js';
import type { Movie } from '../db/types.js';
import { ApiError } from '../lib/errors.js';

export interface ByteRange {
  start: number;
  end: number;
}

export interface StreamTarget {
  status: number;
  headers: Record<string, string>;
  body: Readable | null;
}

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
};

/** Devuelve el rango pedido, 'invalid' si no es satisfacible, o null si no hay Range. */
export function parseRange(header: string | undefined, size: number): ByteRange | 'invalid' | null {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return 'invalid';

  const [, rawStart = '', rawEnd = ''] = match;
  if (rawStart === '' && rawEnd === '') return 'invalid';

  let start: number;
  let end: number;

  if (rawStart === '') {
    // bytes=-500 -> ultimos 500 bytes
    const suffixLength = Number.parseInt(rawEnd, 10);
    if (suffixLength <= 0) return 'invalid';
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number.parseInt(rawStart, 10);
    end = rawEnd === '' ? size - 1 : Number.parseInt(rawEnd, 10);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
    return 'invalid';
  }

  return { start, end: Math.min(end, size - 1) };
}

function mimeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function resolveLocalFile(videoUrl: string): string {
  const relative = decodeURIComponent(videoUrl).replace(/^[/\\]+/, '');
  const root = path.resolve(config.videosDir);
  const absolute = path.resolve(root, relative);

  // Impide escapar de la carpeta de videos (path traversal).
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw ApiError.badRequest('Ruta de video no permitida');
  }

  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    throw ApiError.notFound(`No existe el archivo de video "${relative}"`);
  }

  return absolute;
}

function assertRemoteUrl(videoUrl: string): URL {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    throw ApiError.badRequest(`URL de video invalida: ${videoUrl}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw ApiError.badRequest('Solo se admiten videos http/https');
  }

  return url;
}

function localStream(movie: Movie, rangeHeader: string | undefined, head: boolean): StreamTarget {
  const filePath = resolveLocalFile(movie.videoUrl);
  const { size } = fs.statSync(filePath);
  const contentType = mimeFor(filePath);

  if (size === 0) throw ApiError.notFound('El archivo de video esta vacio');

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  };

  const range = parseRange(rangeHeader, size);

  if (range === 'invalid') {
    headers['Content-Range'] = `bytes */${size}`;
    return { status: 416, headers, body: null };
  }

  if (range) {
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${size}`;
    headers['Content-Length'] = String(range.end - range.start + 1);
    return {
      status: 206,
      headers,
      body: head ? null : fs.createReadStream(filePath, { start: range.start, end: range.end }),
    };
  }

  headers['Content-Length'] = String(size);
  return { status: 200, headers, body: head ? null : fs.createReadStream(filePath) };
}

async function remoteStream(
  movie: Movie,
  rangeHeader: string | undefined,
  head: boolean,
): Promise<StreamTarget> {
  const url = assertRemoteUrl(movie.videoUrl);

  const upstream = await fetch(url, {
    method: head ? 'HEAD' : 'GET',
    headers: rangeHeader ? { Range: rangeHeader } : {},
    signal: AbortSignal.timeout(config.requestTimeoutMs),
    redirect: 'follow',
  });

  if (!upstream.ok && upstream.status !== 206) {
    throw new ApiError(
      502,
      'upstream_error',
      `El origen del video respondio ${upstream.status}`,
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': upstream.headers.get('content-type') ?? 'video/mp4',
    'Accept-Ranges': upstream.headers.get('accept-ranges') ?? 'bytes',
    'Cache-Control': 'private, max-age=3600',
  };

  for (const header of ['content-length', 'content-range', 'last-modified', 'etag']) {
    const value = upstream.headers.get(header);
    if (value) headers[header === 'etag' ? 'ETag' : header.charAt(0).toUpperCase() + header.slice(1)] = value;
  }

  const body =
    head || !upstream.body
      ? null
      : (Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]) as Readable);

  return { status: upstream.status === 206 ? 206 : 200, headers, body };
}

export async function openStream(
  movie: Movie,
  rangeHeader: string | undefined,
  head = false,
): Promise<StreamTarget> {
  return movie.videoSource === 'local'
    ? localStream(movie, rangeHeader, head)
    : remoteStream(movie, rangeHeader, head);
}