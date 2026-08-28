import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import Loader from './components/Loader';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import SubmitReport from './pages/SubmitReport';
import MyReports from './pages/MyReports';
import ReportDetails from './pages/ReportDetails';
import Dashboard from './pages/Dashboard';
import ReportsList from './pages/ReportsList';
import AdminReportDetails from './pages/AdminReportDetails';
import ForgotPassword from './pages/ForgotPassword';

// Layout component
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Route Guard component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage={true} message="Authenticating session..." />;
  }

  if (!user) {
    // Redirect to login page but save the original destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role not allowed, redirect appropriately
    const dest = user.role === 'admin' ? '/admin/dashboard' : '/my-reports';
    return <Navigate to={dest} replace />;
  }

  return children;
};

// Root index redirect based on auth status
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage={true} message="Loading platform..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'admin' 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/my-reports" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Pages */}
            <Route
              path="/login"
              element={
                <AppLayout>
                  <Login />
                </AppLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AppLayout>
                  <Register />
                </AppLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AppLayout>
                  <ForgotPassword />
                </AppLayout>
              }
            />

            {/* Citizen Protected Routes */}
            <Route
              path="/report/new"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <AppLayout>
                    <SubmitReport />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <AppLayout>
                    <MyReports />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reports/:id"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <AppLayout>
                    <ReportDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ReportsList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminReportDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback Root / Wildcard Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
