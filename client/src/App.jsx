import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './redux/slices/authSlice';
import { onSessionExpired } from './lib/authEvents';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import DashboardLayout from './components/DashboardLayout';
import PlansPage from './pages/PlansPage';
import NetworkPage from './pages/NetworkPage';
import KycPage from './pages/KycPage';
import NotFoundPage from './pages/NotFoundPage';
import DonatePage from './pages/DonatePage';
import HelpPage from './pages/HelpPage';
import ProfilePage from './pages/ProfilePage';

// Protects routes that require login + optionally a specific role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      dispatch(logout());
      navigate('/login', { replace: true });
    });
    return unsubscribe;
  }, [dispatch, navigate]);

  return (
    <Routes>
      {/* Admin routes: no user dashboard layout/sidebar */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Global Layout Wrapper for devotee portal */}
      <Route element={<DashboardLayout />}>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/dashboard/support" element={<HelpPage />} />

        {/* ===== USER DASHBOARD ROUTES ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="kyc" element={<KycPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Root redirect */}
        <Route
          path="/"
          element={
            token && user
              ? user.role === 'ADMIN'
                ? <Navigate to="/admin" replace />
                : <Navigate to="/dashboard" replace />
              : <Navigate to="/donate" replace />
          }
        />

        {/* Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;