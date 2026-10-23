import { config } from '../config.js';
import { closeDb, getDb } from './index.js';
import { findOrCreateGenre } from './genresRepo.js';
import { createMovie } from './moviesRepo.js';
import { countPurchases, createPurchase } from './purchasesRepo.js';
import { GENRES, MOVIES, USERS, remoteUrlFor } from './seedData.js';
import { TRUNCATE_SQL } from './schema.js';
import { createUser, emailExists, findUserByEmail } from './usersRepo.js';

const reset = process.argv.includes('--reset');

function posterFor(slug: string): string {
  return `https://picsum.photos/seed/pelipop-${slug}/500/750`;
}

function backdropFor(slug: string): string {
  return `https://picsum.photos/seed/pelipop-${slug}-backdrop/1600/900`;
}

async function main(): Promise<void> {
  const db = getDb();

  if (reset) {
    db.exec(TRUNCATE_SQL);
    console.log('[pelipop] Catalogo y usuarios anteriores eliminados.');
  }

  // Generos
  const genreIds = new Map<string, number>();
  for (const genre of GENRES) {
    const row = findOrCreateGenre(genre.name, genre.slug);
    genreIds.set(row.slug, row.id);
  }
  console.log(`[pelipop] ${genreIds.size} generos listos.`);

  // Usuarios (las contrasenas se guardan con hash bcrypt)
  for (const user of USERS) {
    if (emailExists(user.email)) {
      console.log(`[pelipop] El usuario ${user.email} ya existia: se omite.`);
      continue;
    }
    await createUser({
      email: user.email,
      password: user.password,
      displayName: user.displayName,
      role: user.role,
    });
    console.log(`[pelipop] Usuario ${user.email} (${user.role}) creado.`);
  }

  // Peliculas
  let created = 0;
  for (const movie of MOVIES) {
    const existing = db.prepare('SELECT id FROM movies WHERE slug = ?').get(movie.slug);
    if (existing) continue;

    for (const slug of movie.genres) {
      if (!genreIds.has(slug)) {
        console.warn(`[pelipop] Genero desconocido "${slug}" en "${movie.title}" (se creara).`);
        genreIds.set(slug, findOrCreateGenre(slug, slug).id);
      }
    }

    createMovie({
      slug: movie.slug,
      title: movie.title,
      originalTitle: movie.originalTitle,
      tagline: movie.tagline,
      synopsis: movie.synopsis,
      releaseDate: movie.releaseDate,
      releaseYear: Number.parseInt(movie.releaseDate.slice(0, 4), 10),
      runtimeMinutes: movie.runtimeMinutes,
      ageRating: movie.ageRating,
      score: movie.score,
      popularity: movie.popularity,
      posterUrl: posterFor(movie.slug),
      backdropUrl: backdropFor(movie.slug),
      videoSource: 'remote',
      videoUrl: remoteUrlFor(movie.videoKey),
      trailerUrl: null,
      featured: movie.featured ?? false,
      genres: movie.genres,
    });
    created += 1;
  }

  const total = db.prepare('SELECT COUNT(*) AS total FROM movies').get() as { total: number };
  console.log(`[pelipop] ${created} peliculas nuevas. Total en catalogo: ${total.total}.`);

  // Compras de demostracion para que el historial y el dashboard no esten vacios.
  const cliente = findUserByEmail('cliente@pelipop.dev');
  if (cliente && countPurchases() === 0) {
    const rows = db
      .prepare('SELECT id, rent_price_cents, buy_price_cents FROM movies ORDER BY popularity DESC LIMIT 3')
      .all() as Array<{ id: number; rent_price_cents: number; buy_price_cents: number }>;

    if (rows[0]) {
      createPurchase({
        userId: cliente.id,
        movieId: rows[0].id,
        kind: 'rent',
        status: 'paid',
        amountCents: rows[0].rent_price_cents,
        method: 'card',
        cardLast4: '4242',
      });
    }
    if (rows[1]) {
      createPurchase({
        userId: cliente.id,
        movieId: rows[1].id,
        kind: 'buy',
        status: 'paid',
        amountCents: rows[1].buy_price_cents,
        method: 'card',
        cardLast4: '4242',
      });
    }
    console.log('[pelipop] Alquiler y compra de demostracion creados para cliente@pelipop.dev.');
  }

  console.log(`[pelipop] Base de datos: ${config.databaseFile}`);
  console.log('\nCuentas de demo:');
  for (const user of USERS) {
    console.log(`  ${user.role.padEnd(7)} ${user.email}  /  ${user.password}`);
  }

  closeDb();
}

main().catch((error: unknown) => {
  console.error('[pelipop] Error al sembrar la base de datos:', error);
  closeDb();
  process.exit(1);
});
