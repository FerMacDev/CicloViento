import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() { logout(); navigate('/login', { replace: true }); }

  return <section className="dashboard"><p className="eyebrow">TU PUNTO DE PARTIDA</p><h1>Bienvenido, {user?.firstName}</h1><article className="route-card"><span>PRÓXIMAMENTE</span><h2>Planifica tu ruta</h2><p>Estamos preparando la forma de explorar recorridos de carretera teniendo en cuenta viento, distancia y desnivel.</p></article><button className="button button-secondary" onClick={handleLogout}>Cerrar sesión</button></section>;
}
