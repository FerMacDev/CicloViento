import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function AppLayout() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">Ciclo<span>Viento</span></Link>
        <nav aria-label="Navegación principal">
          {isAuthenticated && user ? (
            <button className="session-logout" type="button" onClick={handleLogout}>
              Abandonar sesión
            </button>
          ) : (
            <Link to="/login">Iniciar sesión</Link>
          )}
        </nav>
      </header>
      <main><Outlet /></main>
    </div>
  );
}
