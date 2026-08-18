import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isRestoring, user } = useAuth();
  if (isRestoring) return <div className="page-status">Comprobando tu sesión…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}

export function ChangePasswordRoute() {
  const { isAuthenticated, isRestoring, user } = useAuth();
  if (isRestoring) return <div className="page-status">Comprobando tu sesión…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.mustChangePassword) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
