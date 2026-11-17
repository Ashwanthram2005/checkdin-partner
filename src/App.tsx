import { Navigate, Route, Routes } from 'react-router-dom';
import Alerts from './components/Alerts';
import { RequireAuth } from './auth/AuthContext';
import Availability from './pages/Availability';
import BookingDetail from './pages/BookingDetail';
import Bookings from './pages/Bookings';
import ExtensionsPage from './pages/ExtensionsPage';
import ForgotPassword from './pages/ForgotPassword';
import GuestMessages from './pages/GuestMessages';
import Home from './pages/Home';
import Login from './pages/Login';
import More from './pages/More';
import Notifications from './pages/Notifications';
import Pricing from './pages/Pricing';
import PropertyPhotos from './pages/PropertyPhotos';
import Reports from './pages/Reports';
import Revenue from './pages/Revenue';
import Reviews from './pages/Reviews';
import Welcome from './pages/Welcome';

const guard = (el: JSX.Element) => <RequireAuth><Alerts />{el}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={guard(<Home />)} />
      <Route path="/bookings" element={guard(<Bookings />)} />
      <Route path="/bookings/:id" element={guard(<BookingDetail />)} />
      <Route path="/extensions" element={guard(<ExtensionsPage />)} />
      <Route path="/pricing" element={guard(<Pricing />)} />
      <Route path="/revenue" element={guard(<Revenue />)} />
      <Route path="/availability" element={guard(<Availability />)} />
      <Route path="/reviews" element={guard(<Reviews />)} />
      <Route path="/guests" element={guard(<GuestMessages />)} />
      <Route path="/notifications" element={guard(<Notifications />)} />
      <Route path="/reports" element={guard(<Reports />)} />
      <Route path="/property" element={guard(<PropertyPhotos />)} />
      <Route path="/more" element={guard(<More />)} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
