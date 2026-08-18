import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, apiClient } from '../services/api-client';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !emailPattern.test(form.email)) {
      setError('Completa nombre, apellidos y un email válido.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await apiClient.register({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() });
      setIsComplete(true);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        setError('Ya existe una cuenta con este email.');
      } else if (requestError instanceof ApiError && requestError.status === 503) {
        setError('No ha sido posible completar el registro por un problema temporal de email. Inténtalo más tarde.');
      } else {
        setError('No se ha podido crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return <section className="form-card success-card"><h1>Cuenta creada correctamente</h1><p>Hemos enviado una contraseña temporal a tu correo electrónico.</p><Link className="button button-primary" to="/login">Ir a iniciar sesión</Link></section>;
  }

  return <section className="form-card"><p className="eyebrow">PRIMERA ETAPA</p><h1>Crea tu cuenta</h1><p>Recibirás una contraseña temporal por email.</p><form onSubmit={handleSubmit} noValidate>
    <label htmlFor="firstName">Nombre</label><input id="firstName" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} autoComplete="given-name" required />
    <label htmlFor="lastName">Apellidos</label><input id="lastName" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} autoComplete="family-name" required />
    <label htmlFor="email">Email</label><input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</button>
  </form><p className="form-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p></section>;
}
