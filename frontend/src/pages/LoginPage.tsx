import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '../services/api-client';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) { setError('Introduce tu email y contraseña.'); return; }
    setError(''); setIsSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      setPassword('');
      navigate(user.mustChangePassword ? '/change-password' : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError && requestError.status === 401 ? 'Email o contraseña incorrectos.' : 'No se ha podido iniciar sesión. Inténtalo de nuevo.');
    } finally { setIsSubmitting(false); }
  }

  return <section className="form-card"><p className="eyebrow">VUELVE A RODAR</p><h1>Inicia sesión</h1><form onSubmit={handleSubmit} noValidate>
    <label htmlFor="login-email">Email</label><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
    <label htmlFor="login-password">Contraseña</label><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
  </form><p className="form-footer">¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link></p></section>;
}
