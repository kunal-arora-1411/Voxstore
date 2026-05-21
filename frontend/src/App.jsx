import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Build from './pages/Build';
import Generating from './pages/Generating';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/auth'} replace />} />
      <Route path="/auth" element={token ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/build" element={<PrivateRoute><Build /></PrivateRoute>} />
      <Route path="/generating" element={<PrivateRoute><Generating /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
