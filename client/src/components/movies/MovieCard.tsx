import { Link } from 'react-router-dom';
import { formatRuntime } from '../../lib/format';
import type { Movie } from '../../types';
import { ScoreBadge } from '../ui';
import { Poster } from './Poster';

export function MovieCard({ movie, className = '' }: { movie: Movie; className?: string }) {
  return (
    <Link
      to={`/pelicula/${movie.slug}`}
      className={`group card block overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-brand-500/60 hover:shadow-xl hover:shadow-brand-500/10 ${className}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <Poster
          movie={movie}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950/95 to-transparent" />

        <div className="absolute top-2 left-2">
          <ScoreBadge score={movie.score} />
        </div>

        {movie.featured && (
          <span className="absolute top-2 right-2 badge-mint">Destacada</span>
        )}

        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {movie.ageRating && <span className="badge">{movie.ageRating}</span>}
        </div>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 font-semibold text-cloud-100 transition group-hover:text-brand-300">
          {movie.title}
        </h3>
        <p className="mt-1 flex items-center gap-2 text-xs text-cloud-400">
          <span>{movie.releaseYear ?? 's/f'}</span>
          <span aria-hidden="true">•</span>
          <span>{formatRuntime(movie.runtimeMinutes)}</span>
        </p>
        {movie.genres.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs text-cloud-400">
            {movie.genres.map((genre) => genre.name).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}
