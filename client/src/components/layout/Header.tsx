import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { initials } from '../../lib/format';
import {
  ChevronDownIcon,
  CloseIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from '../icons';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 text-ink-950 shadow-lg shadow-brand-500/20">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M8.5 5.5v13l10-6.5z" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        Peli<span className="text-brand-400">pop</span>
      </span>
    </Link>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-ink-700/70 text-brand-300' : 'text-cloud-300 hover:bg-ink-700/40 hover:text-cloud-100'
  }`;

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    }

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/catalogo?search=${encodeURIComponent(term)}` : '/catalogo');
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className={navLinkClass}>
            Catalogo
          </NavLink>
          {user && (
            <NavLink to="/cuenta" className={navLinkClass}>
              Mi cuenta
            </NavLink>
          )}
        </nav>

        <form onSubmit={onSearchSubmit} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cloud-400"
              width={16}
              height={16}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar peliculas..."
              aria-label="Buscar peliculas"
              className="input pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800/50 py-1.5 pr-2 pl-1.5 transition hover:border-brand-500"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-mint-500 text-xs font-bold text-ink-950">
                  {initials(user.displayName)}
                </span>
                <span className="hidden text-sm font-medium sm:block">{user.displayName}</span>
                <ChevronDownIcon width={14} height={14} className="text-cloud-400" />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="card absolute right-0 mt-2 w-60 overflow-hidden bg-ink-800 p-1.5 shadow-2xl"
                >
                  <div className="border-b border-ink-700 px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user.displayName}</p>
                    <p className="truncate text-xs text-cloud-400">{user.email}</p>
                    <span className="badge-brand mt-2">{user.role}</span>
                  </div>

                  {(user.permissions.includes('movies:write') ||
                    user.permissions.includes('admin:stats')) && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-cloud-200 transition hover:bg-ink-700/60"
                    >
                      <DashboardIcon width={16} height={16} /> Panel de administracion
                    </Link>
                  )}

                  <Link
                    to="/cuenta"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-cloud-200 transition hover:bg-ink-700/60"
                  >
                    <UserIcon width={16} height={16} /> Mi cuenta
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                  >
                    <LogoutIcon width={16} height={16} /> Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost btn-sm">
                <ShieldIcon width={15} height={15} /> Iniciar sesion
              </Link>
              <Link to="/registro" className="btn-primary btn-sm">
                Crear cuenta
              </Link>
            </div>
          )}

          <button
            type="button"
            className="btn-ghost btn-sm md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon width={18} height={18} /> : <MenuIcon width={18} height={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-ink-700 bg-ink-900 px-4 py-3 md:hidden">
          <form onSubmit={onSearchSubmit} className="mb-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar peliculas..."
              aria-label="Buscar peliculas"
              className="input"
            />
          </form>

          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Catalogo
            </NavLink>
            {user && (
              <NavLink to="/cuenta" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Mi cuenta
              </NavLink>
            )}
            {!user && (
              <div className="mt-2 flex gap-2">
                <Link
                  to="/login"
                  className="btn-ghost flex-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/registro"
                  className="btn-primary flex-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
