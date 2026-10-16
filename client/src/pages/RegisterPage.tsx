import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell, Field, FormError, SubmitButton, useAuthForm } from '../components/auth';
import { CheckIcon } from '../components/icons';

const RULES = [
  { test: (value: string) => value.length >= 8, label: 'Al menos 8 caracteres' },
  { test: (value: string) => /[A-Za-z]/.test(value), label: 'Incluye una letra' },
  { test: (value: string) => /\d/.test(value), label: 'Incluye un numero' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { busy, error, run } = useAuthForm();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (displayName.trim().length < 2) {
      setLocalError('Escribe tu nombre (al menos 2 caracteres).');
      return;
    }
    if (RULES.some((rule) => !rule.test(password))) {
      setLocalError('La contrasena no cumple los requisitos de seguridad.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Las contrasenas no coinciden.');
      return;
    }

    void run(async () => {
      await register(displayName.trim(), email.trim(), password);
      navigate('/', { replace: true });
    });
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Las cuentas nuevas se crean con permisos de solo lectura."
      footer={
        <>
          Ya tienes cuenta?{' '}
          <Link to="/login" className="link font-semibold">
            Inicia sesion
          </Link>
        </>
      }
    >
      <FormError message={localError ?? error} />

      <form onSubmit={onSubmit} noValidate>
        <Field
          id="displayName"
          label="Nombre"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Como quieres que te llamemos"
          autoComplete="name"
          disabled={busy}
        />

        <Field
          id="email"
          label="Correo electronico"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="tu@correo.com"
          autoComplete="email"
          disabled={busy}
        />

        <Field
          id="password"
          label="Contrasena"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={busy}
        />

        <ul className="mb-4 space-y-1">
          {RULES.map((rule) => {
            const passed = rule.test(password);
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-2 text-xs ${passed ? 'text-mint-300' : 'text-cloud-400'}`}
              >
                <CheckIcon width={14} height={14} className={passed ? 'opacity-100' : 'opacity-40'} />
                {rule.label}
              </li>
            );
          })}
        </ul>

        <Field
          id="confirm"
          label="Repite la contrasena"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={busy}
        />

        <SubmitButton busy={busy}>Crear mi cuenta</SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-cloud-400">
        Las contrasenas se almacenan cifradas con bcrypt. Nunca guardamos texto plano.
      </p>
    </AuthShell>
  );
}
