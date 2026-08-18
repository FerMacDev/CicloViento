import { Link, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">Ciclo<span>Viento</span></Link>
        <nav aria-label="Navegación principal"><Link to="/login">Iniciar sesión</Link></nav>
      </header>
      <main><Outlet /></main>
    </div>
  );
}
