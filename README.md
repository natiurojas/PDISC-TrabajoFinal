# Pelipop

Plataforma de catalogo y streaming de peliculas con panel de administracion.
Monorepo con **React + Vite + Tailwind CSS v4** en el cliente y **Node + Express + SQLite**
en el servidor, escrito en TypeScript de punta a punta.

## Caracteristicas

- **Catalogo publico** con busqueda, filtros por genero, año y puntaje, orden y paginacion.
- **Detalle de pelicula** con reparto, generos, sinopsis y titulos similares.
- **Reproductor de video** propio (progreso, volumen, pantalla completa, atajos de teclado)
  que consume el endpoint de streaming con soporte de `Range` (206) para salto/seek.
- **Autenticacion** con JWT y contrasenas cifradas con bcrypt.
- **Permisos por rol**: `admin`, `editor` y `user`.
- **Panel de administracion**: metricas, CRUD de peliculas, gestion de generos y de usuarios.
- **Tema** con la paleta de Pelipop (`#162530`, `#02adca`, `#27404f`, `#00cac3`).

## Requisitos

- Node.js >= 20.11 (probado con Node 22).
- npm (usa npm workspaces).

## Puesta en marcha

```powershell
npm install
npm run db:reset      # crea la base de datos y siembra generos, usuarios y peliculas demo
npm run dev:server    # API en http://localhost:4000
npm run dev:client    # interfaz en http://localhost:5173 (proxy /api -> :4000)
```

Abre http://localhost:5173. El cliente de desarrollo hace proxy de `/api` al servidor,
asi que no hace falta configurar nada mas.

> El script `npm run dev` lanza ambos workspaces en serie y puede quedarse "colgado" en el
> servidor; para trabajar usa `dev:server` y `dev:client` en dos terminales.

## Cuentas demo

| Rol    | Correo                | Contrasena    |
| ------ | --------------------- | ------------- |
| admin  | `admin@pelipop.dev`   | `admin12345`  |
| editor | `editor@pelipop.dev`  | `editor12345` |
| user   | `cliente@pelipop.dev` | `cliente12345`|

El registro publico siempre crea cuentas con rol `user`.

## Scripts

Ejecutados desde la raiz:

| Comando                 | Descripcion                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| `npm run dev:server`    | Servidor en modo watch (`tsx watch`).                              |
| `npm run dev:client`    | Vite dev server con HMR.                                           |
| `npm run build`         | Compila servidor (`server/dist`) y cliente (`client/dist`).        |
| `npm start`             | Arranca el servidor compilado; sirve `client/dist` si existe.      |
| `npm run typecheck`     | Chequeo de tipos en ambos workspaces.                              |
| `npm run db:reset`      | Recrea y siembra la base de datos.                                 |

## Produccion

```powershell
npm run build
$env:NODE_ENV='production'
$env:JWT_SECRET='<secreto-largo-y-aleatorio>'
npm start
```

Con `NODE_ENV=production` el servidor obliga a definir `JWT_SECRET` (sin el, aborta al
arrancar) y sirve el SPA compilado desde `client/dist` con fallback a `index.html`.

## Variables de entorno

| Variable                 | Por defecto             | Descripcion                                                        |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| `PORT`                   | `4000`                  | Puerto del servidor.                                               |
| `HOST`                   | `0.0.0.0`               | Interfaz de escucha.                                               |
| `DATABASE_FILE`          | `data/pelipop.db`       | Ruta del archivo SQLite.                                           |
| `VIDEOS_DIR`             | `data/videos`           | Carpeta con `.mp4` locales servidos como fuente `local`.           |
| `CORS_ORIGINS`           | `http://localhost:5173` | Origenes permitidos, separados por coma.                           |
| `JWT_SECRET`             | (solo dev)              | Clave para firmar JWT. **Obligatoria en produccion.**              |
| `JWT_EXPIRES_IN_SECONDS` | `86400`                 | Vida del token (24 h).                                             |
| `REQUEST_TIMEOUT_MS`     | `20000`                 | Timeout de peticiones a fuentes de video remotas.                  |

## API

### Publica

- `GET /api/health`
- `GET /api/facets` — años y generos disponibles con conteos.
- `GET /api/genres`
- `GET /api/movies` — `search`, `genre[]`, `year`, `minScore`, `featured`, `sort`
  (`popularity|score|year|title|runtime`), `order`, `page`, `limit`.
- `GET /api/movies/:idOrSlug`
- `GET /api/movies/:idOrSlug/similar`
- `GET|HEAD /api/movies/:idOrSlug/stream` — streaming con soporte de `Range`.

### Autenticacion

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/auth/me` · `POST /api/auth/change-password`

### Administracion (segun permisos)

- `GET /api/admin/stats` — `admin:stats`
- `POST|PUT|DELETE /api/admin/movies[/:idOrSlug]` y `PATCH .../featured` — `movies:write`
- `POST /api/admin/genres` · `DELETE /api/admin/genres/:id` — `genres:write`
- `GET|POST /api/admin/users` · `PATCH|DELETE /api/admin/users/:id` — `users:read` / `users:write`

## Roles y permisos

| Permiso        | admin | editor | user |
| -------------- | :---: | :----: | :--: |
| `admin:stats`  |  si   |   no   |  no  |
| `movies:read`  |  si   |   si   |  si  |
| `movies:write` |  si   |   si   |  no  |
| `genres:write` |  si   |   si   |  no  |
| `users:read`   |  si   |   no   |  no  |
| `users:write`  |  si   |   no   |  no  |

El sistema impide eliminar o desactivar al ultimo administrador activo.

## Estructura

```
Pelipop/
  server/          API Express + SQLite (better-sqlite3)
    src/
      auth/        JWT, bcrypt y matriz de permisos
      db/          esquema, repositorios, migraciones y seed
      routes/      catalog, movies, auth, admin
      services/    streaming (proxy con Range) y validacion de entrada
      middleware/  auth, errores, helpers
  client/          SPA React + Vite + Tailwind
    src/
      auth/        contexto de sesion y guardas de ruta
      components/  layout, tarjetas, reproductor, filtros, UI
      pages/       home, catalogo, detalle, auth, cuenta y admin/
      lib/         cliente API tipado, formatos y roles
  data/            pelipop.db y videos/ (ignorados por git)
```

## Notas

- Los clips de video sembrados apuntan a fuentes publicas de prueba
  (`test-videos.co.uk` y los ejemplos CC0 de MDN). Para usar tu propio contenido, coloca
  los `.mp4` en `data/videos` y registra la pelicula con `videoSource: "local"` y
  `videoUrl` igual al nombre del archivo.
- La base de datos y la carpeta de videos viven en `data/` (fuera de `dist/`) para
  sobrevivir a los builds.
