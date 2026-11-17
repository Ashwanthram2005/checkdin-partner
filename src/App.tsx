import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/AuthContext';
import Bookings from './pages/Bookings';
import ExtensionsPage from './pages/ExtensionsPage';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import More from './pages/More';
import Pricing from './pages/Pricing';
import Revenue from './pages/Revenue';
import Welcome from './pages/Welcome';

const guard = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={guard(<Home />)} />
      <Route path="/bookings" element={guard(<Bookings />)} />
      <Route path="/extensions" element={guard(<ExtensionsPage />)} />
      <Route path="/pricing" element={guard(<Pricing />)} />
      <Route path="/revenue" element={guard(<Revenue />)} />
      <Route path="/more" element={guard(<More />)} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
