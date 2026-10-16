import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout() {
  const location = useLocation();

  // Al cambiar de ruta volvemos arriba (salvo cuando solo cambian los filtros).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-ink-950"
      >
        Saltar al contenido
      </a>

      <Header />

      <main id="contenido" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
