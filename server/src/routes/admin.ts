import { Router } from 'express';
import { isRole, type Role } from '../auth/permissions.js';
import { createGenre, deleteGenre } from '../db/genresRepo.js';
import {
  catalogStats,
  createMovie,
  deleteMovie,
  findMovieByIdOrSlug,
  updateMovie,
} from '../db/moviesRepo.js';
import {
  countUsersByRole,
  createUser,
  deleteUser,
  emailExists,
  findUserById,
  listUsers,
  updateUser,
  usersByRole,
  type User,
} from '../db/usersRepo.js';
import { ApiError } from '../lib/errors.js';
import {
  asBody,
  optionalBoolean,
  optionalString,
  requireBoolean,
  requireEmail,
  requirePassword,
  requireString,
} from '../lib/validate.js';
import { currentUser, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import { parseMovieInput } from '../services/movieInput.js';

export const adminRouter = Router();

/** Protege la cuenta: nunca queremos quedarnos sin administradores activos. */
function assertKeepsAnAdmin(target: User, nextRole?: Role, nextActive?: boolean): void {
  const stopsBeingAdmin = target.role === 'admin' && nextRole !== undefined && nextRole !== 'admin';
  const getsDisabled = target.role === 'admin' && nextActive === false;

  if ((stopsBeingAdmin || getsDisabled) && countUsersByRole('admin') <= 1) {
    throw new ApiError(
      409,
      'last_admin',
      'No puedes retirar el acceso al ultimo administrador del sistema',
    );
  }
}

function resolveMovie(idOrSlug: string) {
  const movie = findMovieByIdOrSlug(idOrSlug);
  if (!movie) throw ApiError.notFound(`No existe la pelicula "${idOrSlug}"`);
  return movie;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

adminRouter.get(
  '/stats',
  requirePermission('admin:stats'),
  asyncHandler(async (_req, res) => {
    const catalog = catalogStats();
    const byRole = usersByRole();
    const totalUsers = byRole.reduce((sum, entry) => sum + entry.total, 0);

    res.json({
      ...catalog,
      users: {
        total: totalUsers,
        byRole: byRole.map((entry) => ({ role: entry.role, total: entry.total })),
      },
    });
  }),
);

/* ------------------------------------------------------------------ */
/* Peliculas                                                           */
/* ------------------------------------------------------------------ */

adminRouter.post(
  '/movies',
  requirePermission('movies:write'),
  asyncHandler(async (req, res) => {
    const input = parseMovieInput(req.body);
    res.status(201).json(createMovie(input));
  }),
);

adminRouter.put(
  '/movies/:idOrSlug',
  requirePermission('movies:write'),
  asyncHandler(async (req, res) => {
    const movie = resolveMovie(req.params.idOrSlug);
    const input = parseMovieInput(req.body);
    const updated = updateMovie(movie.id, input);
    if (!updated) throw ApiError.notFound(`No existe la pelicula "${req.params.idOrSlug}"`);
    res.json(updated);
  }),
);

adminRouter.patch(
  '/movies/:idOrSlug/featured',
  requirePermission('movies:write'),
  asyncHandler(async (req, res) => {
    const movie = resolveMovie(req.params.idOrSlug);
    const body = asBody(req.body);
    const featured = requireBoolean(body.featured, 'featured');

    const updated = updateMovie(movie.id, {
      slug: movie.slug,
      title: movie.title,
      originalTitle: movie.originalTitle,
      tagline: movie.tagline,
      synopsis: movie.synopsis,
      releaseDate: movie.releaseDate,
      releaseYear: movie.releaseYear,
      runtimeMinutes: movie.runtimeMinutes,
      ageRating: movie.ageRating,
      score: movie.score,
      popularity: movie.popularity,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      videoSource: movie.videoSource,
      videoUrl: movie.videoUrl,
      trailerUrl: movie.trailerUrl,
      featured,
      genres: movie.genres.map((genre) => genre.slug),
    });

    res.json(updated);
  }),
);

adminRouter.delete(
  '/movies/:idOrSlug',
  requirePermission('movies:write'),
  asyncHandler(async (req, res) => {
    const movie = resolveMovie(req.params.idOrSlug);
    deleteMovie(movie.id);
    res.json({ ok: true, message: `Pelicula "${movie.title}" eliminada`, id: movie.id });
  }),
);

/* ------------------------------------------------------------------ */
/* Generos                                                             */
/* ------------------------------------------------------------------ */

adminRouter.post(
  '/genres',
  requirePermission('genres:write'),
  asyncHandler(async (req, res) => {
    const body = asBody(req.body);
    const name = requireString(body.name, 'name', 2, 60);
    res.status(201).json(createGenre(name));
  }),
);

adminRouter.delete(
  '/genres/:id',
  requirePermission('genres:write'),
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw ApiError.badRequest('Id de genero invalido');
    if (!deleteGenre(id)) throw ApiError.notFound('No existe ese genero');
    res.json({ ok: true, id });
  }),
);

/* ------------------------------------------------------------------ */
/* Usuarios                                                            */
/* ------------------------------------------------------------------ */

function resolveUser(idParam: string): User {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) throw ApiError.badRequest('Id de usuario invalido');

  const user = findUserById(id);
  if (!user) throw ApiError.notFound('No existe ese usuario');
  return user;
}

adminRouter.get(
  '/users',
  requirePermission('users:read'),
  asyncHandler(async (req, res) => {
    const roleParam = typeof req.query.role === 'string' ? req.query.role : undefined;
    if (roleParam && !isRole(roleParam)) {
      throw ApiError.badRequest('Rol invalido en el filtro');
    }

    const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);

    res.json(
      listUsers({
        ...(typeof req.query.search === 'string' && req.query.search
          ? { search: req.query.search }
          : {}),
        ...(roleParam ? { role: roleParam } : {}),
        page,
        limit,
      }),
    );
  }),
);

adminRouter.post(
  '/users',
  requirePermission('users:write'),
  asyncHandler(async (req, res) => {
    const body = asBody(req.body);
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    const displayName = requireString(body.displayName, 'displayName', 2, 80);

    if (emailExists(email)) {
      throw new ApiError(409, 'email_taken', 'Ya existe una cuenta con ese correo');
    }

    const role: Role = isRole(body.role) ? body.role : 'user';
    const created = await createUser({ email, password, displayName, role });

    res.status(201).json(created);
  }),
);

adminRouter.patch(
  '/users/:id',
  requirePermission('users:write'),
  asyncHandler(async (req, res) => {
    const target = resolveUser(req.params.id);
    const actor = currentUser(req);
    const body = asBody(req.body);

    const displayName = optionalString(body.displayName, 'displayName', 2, 80);
    const role = isRole(body.role) ? body.role : undefined;
    const isActive = optionalBoolean(body.isActive, 'isActive');

    if (role === undefined && isActive === undefined && displayName === undefined) {
      throw ApiError.badRequest('No hay cambios que aplicar');
    }

    if (target.id === actor.id) {
      if (role !== undefined && role !== target.role) {
        throw ApiError.badRequest('No puedes cambiar tu propio rol');
      }
      if (isActive === false) {
        throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
      }
    }

    assertKeepsAnAdmin(target, role, isActive);

    const updated = updateUser(target.id, {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });

    if (!updated) throw ApiError.notFound('No existe ese usuario');
    res.json(updated);
  }),
);

adminRouter.delete(
  '/users/:id',
  requirePermission('users:write'),
  asyncHandler(async (req, res) => {
    const target = resolveUser(req.params.id);
    const actor = currentUser(req);

    if (target.id === actor.id) {
      throw ApiError.badRequest('No puedes eliminar tu propia cuenta');
    }

    if (target.role === 'admin' && countUsersByRole('admin') <= 1) {
      throw new ApiError(409, 'last_admin', 'No puedes eliminar al ultimo administrador');
    }

    deleteUser(target.id);
    res.json({ ok: true, id: target.id, message: `Usuario "${target.email}" eliminado` });
  }),
);