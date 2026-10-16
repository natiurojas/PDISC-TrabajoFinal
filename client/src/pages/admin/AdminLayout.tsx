import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { DashboardIcon, FilmIcon, UsersIcon } from '../../components/icons';

export function AdminLayout() {
  const { can, user } = useAuth();

  const items = [
    { to: '/admin', end: true, label: 'Dashboard', icon: DashboardIcon, permission: 'admin:stats' as const },
    {
      to: '/admin/peliculas',
      end: false,
      label: 'Peliculas',
      icon: FilmIcon,
      permission: 'movies:write' as const,
    },
    {
      to: '/admin/usuarios',
      end: false,
      label: 'Usuarios',
      icon: UsersIcon,
      permission: 'users:read' as const,
    },
  ].filter((item) => can(item.permission));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Panel de administracion</h1>
          <p className="mt-1 text-sm text-cloud-400">
            Sesion iniciada como <span className="text-cloud-200">{user?.email}</span>
          </p>
        </div>
        <span className="badge-mint">
          {user?.role}
        </span>
      </header>

      <nav className="scrollbar-none mt-6 flex gap-2 overflow-x-auto border-b border-ink-700 pb-px">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'border-brand-500 text-brand-300'
                    : 'border-transparent text-cloud-400 hover:text-cloud-100'
                }`
              }
            >
              <Icon width={17} height={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
