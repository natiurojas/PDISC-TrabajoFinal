import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-28 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="text-2xl font-bold">Esta pagina no esta en el catalogo</h1>
      <p className="text-sm text-cloud-300">
        La direccion que buscas no existe o ha cambiado de sitio.
      </p>
      <div className="mt-2 flex gap-3">
        <Link to="/" className="btn-primary">
          Ir al inicio
        </Link>
        <Link to="/catalogo" className="btn-ghost">
          Ver catalogo
        </Link>
      </div>
    </div>
  );
}
