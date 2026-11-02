import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { I18nProvider } from './lib/i18n';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, Spinner } from './components/ui';
import { PhoneFrame, TabBar } from './components/AppShell';

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Sos from './pages/Sos';
import Emergency from './pages/Emergency';
import RequestStatus from './pages/RequestStatus';
import BusTracking from './pages/BusTracking';
import Profile from './pages/Profile';
import ProviderPanel from './pages/ProviderPanel';
import Admin from './pages/Admin';

/** Routes that keep the bottom tab bar. Pushed screens hide it. */
const TABBED = ['/', '/emergency', '/bus', '/profile'];

/** Requires a signed-in user; otherwise sends them to the welcome screen. */
function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

/** The first screen a signed-in user reaches. */
function Landing() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner size={24} />
      </div>
    );
  }

  // Opening the app when already signed in goes straight to the two choices.
  return user ? <Home /> : <Navigate to="/welcome" replace />;
}

function Shell() {
  const location = useLocation();
  const showTabs = TABBED.includes(location.pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="app-body">
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Landing />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route
            path="/emergency/request/:id"
            element={
              <Protected>
                <RequestStatus />
              </Protected>
            }
          />
          <Route path="/bus" element={<BusTracking />} />
          <Route path="/sos" element={<Sos />} />
          <Route path="/profile" element={<Profile />} />

          <Route
            path="/provider"
            element={
              <Protected roles={['provider', 'volunteer', 'admin']}>
                <ProviderPanel />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected roles={['admin']}>
                <Admin />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showTabs && <TabBar />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PhoneFrame>
                <Shell />
              </PhoneFrame>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
