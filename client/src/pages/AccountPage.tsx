import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, errorMessage } from '../lib/api';
import { formatDateTime, initials } from '../lib/format';
import { Alert, Spinner } from '../components/ui';
import { CalendarIcon, LockIcon, ShieldIcon, UserIcon } from '../components/icons';

export function AccountPage() {
  const { user, can } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  if (!user) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (newPassword !== confirm) {
      setResult({ tone: 'error', message: 'Las contrasenas nuevas no coinciden.' });
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const response = await api.auth.changePassword(currentPassword, newPassword);
      setResult({ tone: 'success', message: response.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (error) {
      setResult({ tone: 'error', message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Mi cuenta</h1>
      <p className="mt-1 text-sm text-cloud-400">Gestiona tus datos de acceso.</p>

      <section className="card mt-8 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 text-lg font-bold text-ink-950">
            {initials(user.displayName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.displayName}</p>
            <p className="truncate text-sm text-cloud-400">{user.email}</p>
          </div>
          <span className="badge-brand ml-auto">{user.role}</span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-ink-700 bg-ink-950/40 p-4">
            <dt className="flex items-center gap-2 text-xs text-cloud-400 uppercase">
              <CalendarIcon width={14} height={14} /> Alta en Pelipop
            </dt>
            <dd className="mt-1 text-sm text-cloud-100">{formatDateTime(user.createdAt)}</dd>
          </div>

          <div className="rounded-lg border border-ink-700 bg-ink-950/40 p-4">
            <dt className="flex items-center gap-2 text-xs text-cloud-400 uppercase">
              <ShieldIcon width={14} height={14} /> Permisos
            </dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {user.permissions.map((permission) => (
                <span key={permission} className="badge font-mono text-[11px]">
                  {permission}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        {can('movies:write') && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-500/5 p-4">
            <p className="text-sm text-brand-100">
              Tienes permisos de edicion sobre el catalogo.
            </p>
            <Link to="/admin" className="btn-primary btn-sm">
              Abrir panel
            </Link>
          </div>
        )}
      </section>

      <section className="card mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <LockIcon width={18} height={18} className="text-brand-400" /> Cambiar contrasena
        </h2>
        <p className="mt-1 text-sm text-cloud-400">
          Tu contrasena se guarda con hash bcrypt y sal aleatoria. Nadie puede leerla, ni siquiera
          el administrador.
        </p>

        {result && (
          <div className="mt-5">
            <Alert tone={result.tone}>{result.message}</Alert>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="current" className="label">
              Contrasena actual
            </label>
            <input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="next" className="label">
              Nueva contrasena
            </label>
            <input
              id="next"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="repeat" className="label">
              Repite la nueva
            </label>
            <input
              id="repeat"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
              className="input"
            />
          </div>

          <div className="sm:col-span-3">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? <Spinner label="Guardando" /> : 'Actualizar contrasena'}
            </button>
          </div>
        </form>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <UserIcon width={18} height={18} className="text-brand-400" /> Sobre los permisos
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-cloud-300">
          <li>
            <span className="badge-brand mr-2">user</span> consulta el catalogo y reproduce
            peliculas.
          </li>
          <li>
            <span className="badge-brand mr-2">editor</span> ademas crea, edita y borra peliculas.
          </li>
          <li>
            <span className="badge-brand mr-2">admin</span> gestiona usuarios, generos y ve las
            metricas del dashboard.
          </li>
        </ul>
      </section>
    </div>
  );
}
