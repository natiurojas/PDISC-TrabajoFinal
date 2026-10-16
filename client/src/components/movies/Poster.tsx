import { useState } from 'react';
import type { Movie } from '../../types';
import { FilmIcon } from '../icons';

/**
 * Poster con degradado de reserva: si la imagen no carga (offline o URL rota)
 * se muestra un marcador con el titulo en lugar de un hueco vacio.
 */
export function Poster({
  movie,
  className = '',
  sizes = '(max-width: 768px) 45vw, 220px',
}: {
  movie: Movie;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !movie.posterUrl || failed;

  if (showFallback) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-950 p-4 text-center ${className}`}
      >
        <FilmIcon className="text-brand-500/70" width={26} height={26} />
        <span className="line-clamp-3 text-sm font-semibold text-cloud-200">{movie.title}</span>
      </div>
    );
  }

  return (
    <img
      src={movie.posterUrl ?? ''}
      alt={`Poster de ${movie.title}`}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={() => setFailed(true)}
      className={`bg-ink-800 object-cover ${className}`}
    />
  );
}
