import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../services/api-client';
import { useAuth } from '../hooks/useAuth';

function isValidPassword(value: string): boolean { return value.length >= 12 && /[A-Za-z]/.test(value) && /\d/.test(value); }

export function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmation) { setError('Completa todos los campos.'); return; }
    if (!isValidPassword(newPassword)) { setError('La nueva contraseña debe tener 12 caracteres, una letra y un número.'); return; }
    if (newPassword !== confirmation) { setError('La confirmación no coincide con la nueva contraseña.'); return; }
    if (newPassword === currentPassword) { setError('La nueva contraseña debe ser diferente de la actual.'); return; }
    setError(''); setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmation('');
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No se ha podido actualizar la contraseña.');
    } finally { setIsSubmitting(false); }
  }

  return <section className="form-card"><p className="eyebrow">SEGURIDAD DE LA CUENTA</p><h1>Actualiza tu contraseña</h1><p>Antes de continuar, establece una contraseña definitiva.</p><ul className="password-rules"><li>Mínimo 12 caracteres</li><li>Al menos una letra y un número</li><li>Diferente de la contraseña actual</li></ul><form onSubmit={handleSubmit} noValidate>
    <label htmlFor="current-password">Contraseña actual</label><input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
    <label htmlFor="new-password">Nueva contraseña</label><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required />
    <label htmlFor="confirm-password">Confirmar nueva contraseña</label><input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}</button>
  </form></section>;
}
