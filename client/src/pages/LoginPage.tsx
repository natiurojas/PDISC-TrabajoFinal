import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  AuthLink,
  AuthShell,
  Field,
  FormError,
  SubmitButton,
  useAuthForm,
} from '../components/auth';

const DEMO_ACCOUNTS = [
  { role: 'admin', email: 'admin@pelipop.dev', password: 'admin12345' },
  { role: 'editor', email: 'editor@pelipop.dev', password: 'editor12345' },
  { role: 'user', email: 'cliente@pelipop.dev', password: 'cliente12345' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { busy, error, run } = useAuthForm();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const next = searchParams.get('next') ?? '/';

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await login(email.trim(), password);
      navigate(next.startsWith('/') ? next : '/', { replace: true });
    });
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <AuthShell
      title="Iniciar sesion"
      subtitle="Accede para gestionar el catalogo o tu cuenta."
      footer={
        <>
          No tienes cuenta?{' '}
          <Link to="/registro" className="link font-semibold">
            Registrate gratis
          </Link>
        </>
      }
    >
      <FormError message={error} />

      <form onSubmit={onSubmit} noValidate>
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
          autoComplete="current-password"
          disabled={busy}
        />

        <SubmitButton busy={busy}>Entrar</SubmitButton>
      </form>

      <div className="mt-6 rounded-lg border border-ink-700 bg-ink-950/40 p-4">
        <p className="text-xs font-semibold tracking-wide text-cloud-300 uppercase">
          Cuentas de demostracion
        </p>
        <div className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account.email, account.password)}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-ink-700 px-3 py-2 text-left text-xs transition hover:border-brand-500/60 hover:bg-ink-800/60"
            >
              <span>
                <span className="badge-brand mr-2">{account.role}</span>
                <span className="text-cloud-300">{account.email}</span>
              </span>
              <span className="text-cloud-400">usar</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-cloud-400">
        <AuthLink to="/catalogo" className="link">
          Explorar el catalogo sin cuenta
        </AuthLink>
      </p>
    </AuthShell>
  );
}
