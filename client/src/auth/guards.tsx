import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { PageLoader } from '../components/ui';
import { ShieldIcon } from '../components/icons';
import type { Permission } from '../types';

export function RequireAuth({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: Permission;
}) {
  const { status, can } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Comprobando tu sesion" />;

  if (status === 'anonymous') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (permission && !can(permission)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <ShieldIcon className="text-brand-400" width={44} height={44} />
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="text-sm text-cloud-300">
          Tu cuenta no tiene el permiso <code className="text-mint-300">{permission}</code> necesario
          para ver esta seccion.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <>{children}</>;
}
