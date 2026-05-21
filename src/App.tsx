import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { syncTabs } from './store/useStore';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ScreensManager from './pages/admin/ScreensManager';
import MediaLibrary from './pages/admin/MediaLibrary';
import TVClient from './pages/tv/TVClient';
import TVLogin from './pages/tv/TVLogin';

export default function App() {
  useEffect(() => {
    // Start cross-tab synchronization listener (Simulating WebSocket)
    syncTabs();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="screens" element={<ScreensManager />} />
          <Route path="media" element={<MediaLibrary />} />
        </Route>
        <Route path="/login-tv" element={<TVLogin />} />
        <Route path="/tv/client/:id" element={<TVClient />} />
        <Route path="/tv/:id" element={<TVClient />} /> {/* Fallback for older links */}
      </Routes>
    </HashRouter>
  );
}

