import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Bookings from './pages/Bookings';
import Login from './pages/Login';
import Placeholder from './pages/Placeholder';

function Soon() {
  const { section = '' } = useParams();
  return <Placeholder title={section.charAt(0).toUpperCase() + section.slice(1)} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/app/:section" element={<Soon />} />
      <Route path="/dashboard" element={<Navigate to="/bookings" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<Placeholder title="Reset Password" />} />
      <Route path="/register" element={<Placeholder title="List Your Property" />} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}
