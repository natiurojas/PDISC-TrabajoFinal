import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from './ui';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(2,173,202,0.18),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(0,202,195,0.14),transparent_40%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card bg-ink-800/70 p-7 shadow-2xl">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-cloud-400">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <div className="mt-6 border-t border-ink-700 pt-5 text-center text-sm text-cloud-400">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!message || dismissed === message) return null;

  return (
    <div className="mb-4" onClick={() => setDismissed(message)}>
      <Alert tone="error">{message}</Alert>
    </div>
  );
}

export function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  disabled = false,
  hint,
  children,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="input"
        />
        {children}
      </div>
      {hint && <p className="mt-1.5 text-xs text-cloud-400">{hint}</p>}
    </div>
  );
}

export function SubmitButton({
  busy,
  children,
  className = 'btn-primary w-full',
}: {
  busy: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="submit" className={className} disabled={busy}>
      {busy ? 'Procesando...' : children}
    </button>
  );
}

export function useAuthForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'No se ha podido completar la operacion',
      );
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run, setError };
}

export { Link as AuthLink };
export type { FormEvent };
