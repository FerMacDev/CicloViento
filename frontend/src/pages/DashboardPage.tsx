import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() { logout(); navigate('/login', { replace: true }); }

  return <section className="dashboard"><p className="eyebrow">TU PUNTO DE PARTIDA</p><h1>Bienvenido, {user?.firstName}</h1><article className="route-card"><h2>Planifica tu ruta</h2><p>Guarda tus preferencias de salida antes de que incorporemos el recorrido real.</p><Link className="button button-primary" to="/plan-route">Planificar ruta</Link></article><button className="button button-secondary" onClick={handleLogout}>Cerrar sesión</button></section>;
}
