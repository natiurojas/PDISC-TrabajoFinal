import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { useAsync, useDebounced } from '../../hooks/useAsync';
import { formatDateTime, initials } from '../../lib/format';
import { ConfirmDialog, ErrorState, Spinner } from '../../components/ui';
import { PlusIcon, SearchIcon, TrashIcon } from '../../components/icons';
import { ROLES } from '../../lib/roles';
import type { Role, User } from '../../types';

const ROLE_HINT: Record<Role, string> = {
  admin: 'Todo: catalogo, usuarios y metricas',
  editor: 'Edita el catalogo, sin acceso a usuarios',
  user: 'Solo consulta y reproduce',
};

export function AdminUsersPage() {
  const { user: currentUser, can } = useAuth();
  const canWrite = can('users:write');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | Role>('');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebounced(search, 350);

  const list = useAsync(
    () =>
      api.admin.users.list({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        page,
        limit: 20,
      }),
    [debouncedSearch, roleFilter, page],
  );

  async function applyChange(target: User, patch: { role?: Role; isActive?: boolean }) {
    setBusyId(target.id);
    setFeedback(null);
    try {
      const updated = await api.admin.users.update(target.id, patch);
      setFeedback({
        tone: 'success',
        message: `"${updated.email}" actualizado (rol ${updated.role}, ${updated.isActive ? 'activo' : 'inactivo'}).`,
      });
      list.reload();
    } catch (error) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      await api.admin.users.remove(pendingDelete.id);
      setFeedback({ tone: 'success', message: `Usuario "${pendingDelete.email}" eliminado.` });
      setPendingDelete(null);
      list.reload();
    } catch (error) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = list.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Usuarios</h2>
          <p className="text-sm text-cloud-400">
            Roles y estado de las cuentas. Las contrasenas se guardan con hash bcrypt.
          </p>
        </div>

        {canWrite && (
          <button type="button" className="btn-primary" onClick={() => setShowCreate((open) => !open)}>
            <PlusIcon width={16} height={16} /> {showCreate ? 'Cerrar' : 'Nuevo usuario'}
          </button>
        )}
      </div>

      {feedback && (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-mint-500/40 bg-mint-500/10 text-mint-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {feedback.message}
        </p>
      )}

      {showCreate && canWrite && (
        <CreateUserForm
          onCreated={(created) => {
            setShowCreate(false);
            setFeedback({ tone: 'success', message: `Usuario "${created.email}" creado.` });
            list.reload();
          }}
          onError={(message) => setFeedback({ tone: 'error', message })}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cloud-400"
            width={16}
            height={16}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar usuarios"
            className="input pl-9"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value as '' | Role);
            setPage(1);
          }}
          aria-label="Filtrar por rol"
          className="input sm:w-44"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {list.status === 'error' && list.error && (
        <ErrorState message={list.error} onRetry={list.reload} />
      )}

      {list.status === 'loading' && !list.data && <Spinner label="Cargando usuarios" />}

      {list.data && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-ink-950/50 text-xs tracking-wide text-cloud-400 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">Usuario</th>
                    <th scope="col" className="px-4 py-3">Rol</th>
                    <th scope="col" className="px-4 py-3">Estado</th>
                    <th scope="col" className="px-4 py-3">Alta</th>
                    {canWrite && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700">
                  {list.data.items.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    const busy = busyId === user.id;

                    return (
                      <tr key={user.id} className="transition hover:bg-ink-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-mint-500 text-xs font-bold text-ink-950">
                              {initials(user.displayName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {user.displayName}
                                {isSelf && <span className="badge-brand ml-2">tu</span>}
                              </p>
                              <p className="truncate text-xs text-cloud-400">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {canWrite && !isSelf ? (
                            <select
                              value={user.role}
                              disabled={busy}
                              onChange={(event) =>
                                void applyChange(user, { role: event.target.value as Role })
                              }
                              aria-label={`Rol de ${user.email}`}
                              className="input py-1.5"
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="badge">{user.role}</span>
                          )}
                          <p className="mt-1 text-xs text-cloud-400">{ROLE_HINT[user.role]}</p>
                        </td>

                        <td className="px-4 py-3">
                          <span className={user.isActive ? 'badge-mint' : 'badge'}>
                            {user.isActive ? 'activo' : 'inactivo'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-cloud-400">
                          {formatDateTime(user.createdAt)}
                        </td>

                        {canWrite && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="btn-ghost btn-sm"
                                disabled={busy || isSelf}
                                onClick={() => void applyChange(user, { isActive: !user.isActive })}
                              >
                                {user.isActive ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                type="button"
                                className="btn-danger btn-sm"
                                disabled={isSelf}
                                onClick={() => setPendingDelete(user)}
                                aria-label={`Eliminar ${user.email}`}
                              >
                                <TrashIcon width={14} height={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="text-sm text-cloud-300">
                Pagina {page} de {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar usuario"
        message={`Se eliminara la cuenta "${pendingDelete?.email ?? ''}" de forma permanente.`}
        confirmLabel="Eliminar cuenta"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function CreateUserForm({
  onCreated,
  onError,
}: {
  onCreated: (user: User) => void;
  onError: (message: string) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await api.admin.users.create({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        role,
      });
      onCreated(created);
    } catch (error) {
      onError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6">
      <h3 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Nuevo usuario</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="new-name" className="label">Nombre</label>
          <input
            id="new-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="input"
            required
            minLength={2}
          />
        </div>

        <div>
          <label htmlFor="new-email" className="label">Correo</label>
          <input
            id="new-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="new-password" className="label">Contrasena</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            required
            minLength={8}
            placeholder="Min. 8 con letra y numero"
          />
        </div>

        <div>
          <label htmlFor="new-role" className="label">Rol</label>
          <select
            id="new-role"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="input"
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
