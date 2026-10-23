import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Movie } from '../../types';
import { formatTime } from '../../lib/format';
import {
  AlertIcon,
  ExpandIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  SpinnerIcon,
  VolumeIcon,
} from '../icons';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ movie, src }: { movie: Movie; src?: string | null }) {
  const source = src ?? movie.streamUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    if (video.paused) {
      void video.play().catch(() => setFailed(true));
    } else {
      video.pause();
    }
  }, [failed]);

  function startPlayback() {
    setStarted(true);
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {
      /* el navegador puede exigir otro gesto; el usuario puede pulsar play de nuevo */
    });
  }

  function seekTo(value: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = value;
    setCurrent(value);
  }

  function changeVolume(value: number) {
    const video = videoRef.current;
    setVolume(value);
    setMuted(value === 0);
    if (video) {
      video.volume = value;
      video.muted = value === 0;
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
  }

  function changeSpeed(value: number) {
    const video = videoRef.current;
    setSpeed(value);
    if (video) video.playbackRate = value;
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      /* fullscreen puede estar bloqueado por el navegador */
    }
  }

  // Sincroniza el estado de pantalla completa con el navegador.
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Atajos de teclado utiles incluso cuando el foco no esta en el video.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      switch (event.key) {
        case ' ':
        case 'k':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          seekTo(Math.min(current + 10, duration || current + 10));
          break;
        case 'ArrowLeft':
          seekTo(Math.max(current - 10, 0));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          void toggleFullscreen();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, duration, togglePlay]);

  function revealControls() {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 3000);
  }

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  if (failed) {
    return (
      <div className="card flex aspect-video flex-col items-center justify-center gap-3 border-red-500/30 bg-red-500/5 p-8 text-center">
        <AlertIcon className="text-red-300" width={36} height={36} />
        <h3 className="text-lg font-semibold">No se ha podido cargar el video</h3>
        <p className="max-w-md text-sm text-cloud-300">
          Es posible que la fuente externa no este disponible ahora mismo o que no admita streaming
          parcial. Puedes copiar tu propio archivo en <code className="text-mint-300">data/videos</code>{' '}
          y editar la pelicula desde el panel de administracion con la opcion "archivo local".
        </p>
        <Link to={`/pelicula/${movie.slug}`} className="btn-ghost mt-2">
          Volver a la ficha
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="card group relative aspect-video overflow-hidden bg-black select-none"
      onMouseMove={revealControls}
      onMouseLeave={() => setControlsVisible(false)}
      onDoubleClick={() => void toggleFullscreen()}
    >
      <video
        ref={videoRef}
        src={source}
        poster={movie.backdropUrl ?? undefined}
        preload="metadata"
        playsInline
        className="h-full w-full bg-black"
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          revealControls();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onError={() => setFailed(true)}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
          event.currentTarget.volume = volume;
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrent(video.currentTime);

          const ranges = video.buffered;
          if (ranges.length > 0) {
            setBuffered(ranges.end(ranges.length - 1));
          }
        }}
        onEnded={() => setPlaying(false)}
      />

      {/* Capa de arranque con poster y boton grande */}
      {!started && (
        <button
          type="button"
          onClick={startPlayback}
          aria-label={`Reproducir ${movie.title}`}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-ink-950/90 via-ink-950/50 to-ink-950/70 transition hover:from-ink-950/80"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-500 text-ink-950 shadow-2xl shadow-brand-500/40 transition group-hover:scale-105">
            <PlayIcon width={34} height={34} className="ml-1" />
          </span>
          <span className="mt-4 text-sm font-semibold text-cloud-200">
            Reproducir · {formatTime(duration || (movie.runtimeMinutes ?? 0) * 60)}
          </span>
        </button>
      )}

      {buffering && started && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <SpinnerIcon className="animate-spin text-brand-400" width={40} height={40} />
        </div>
      )}

      {/* Controles */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/95 to-transparent px-3 pt-10 pb-3 transition-opacity duration-200 ${
          controlsVisible || !playing ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="relative mb-2 h-1.5 w-full rounded-full bg-cloud-400/25">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-cloud-400/40"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-mint-500"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            aria-label="Posicion del video"
            onChange={(event) => seekTo(Number(event.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-3 text-cloud-100">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            className="rounded-md p-1.5 transition hover:bg-ink-700/70"
          >
            {playing ? <PauseIcon width={20} height={20} /> : <PlayIcon width={20} height={20} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              className="rounded-md p-1.5 transition hover:bg-ink-700/70"
            >
              {muted || volume === 0 ? (
                <MuteIcon width={18} height={18} />
              ) : (
                <VolumeIcon width={18} height={18} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volumen"
              onChange={(event) => changeVolume(Number(event.target.value))}
              className="hidden h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-cloud-400/30 sm:block"
            />
          </div>

          <span className="text-xs tabular-nums text-cloud-300">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <select
              value={speed}
              onChange={(event) => changeSpeed(Number(event.target.value))}
              aria-label="Velocidad de reproduccion"
              className="rounded-md border border-ink-600 bg-ink-950/80 px-2 py-1 text-xs text-cloud-200 outline-none"
            >
              {SPEEDS.map((value) => (
                <option key={value} value={value}>
                  {value}x
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="rounded-md p-1.5 transition hover:bg-ink-700/70"
            >
              <ExpandIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
