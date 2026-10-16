import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-700/80 bg-ink-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold">
            Peli<span className="text-brand-400">pop</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-cloud-400">
            Catalogo de peliculas con streaming, cuentas de usuario y panel de administracion.
            Proyecto de demostracion construido con React, Express y SQLite.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-cloud-300 uppercase">Explorar</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/catalogo" className="text-cloud-400 transition hover:text-brand-300">
                Todo el catalogo
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo?sort=score"
                className="text-cloud-400 transition hover:text-brand-300"
              >
                Mejor valoradas
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo?featured=true"
                className="text-cloud-400 transition hover:text-brand-300"
              >
                Destacadas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-cloud-300 uppercase">Cuenta</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/login" className="text-cloud-400 transition hover:text-brand-300">
                Iniciar sesion
              </Link>
            </li>
            <li>
              <Link to="/registro" className="text-cloud-400 transition hover:text-brand-300">
                Crear cuenta
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-700/60 px-4 py-4 text-center text-xs text-cloud-400">
        Pelipop {new Date().getFullYear()} - Los videos del catalogo de demo son clips libres de
        Blender Foundation y MDN.
      </div>
    </footer>
  );
}
