import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { ChangePasswordRoute, ProtectedRoute } from './components/ProtectedRoute';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PlanRoutePage } from './pages/PlanRoutePage';

function App() {
  return <Routes><Route element={<AppLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ChangePasswordRoute />}><Route path="/change-password" element={<ChangePasswordPage />} /></Route>
    <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/plan-route" element={<PlanRoutePage />} /></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes>;
}

export default App;
