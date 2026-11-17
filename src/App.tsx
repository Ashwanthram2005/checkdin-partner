import { Navigate, Route, Routes } from 'react-router-dom';
import AccountLink from './pages/AccountLink';
import ActivityLog from './pages/ActivityLog';
import Alerts from './components/Alerts';
import DeepLinks from './components/DeepLinks';
import OfflineGate from './components/OfflineGate';
import { RequireAuth } from './auth/AuthContext';
import Availability from './pages/Availability';
import BookingDetail from './pages/BookingDetail';
import Bookings from './pages/Bookings';
import ExtensionsPage from './pages/ExtensionsPage';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import HotelDetails from './pages/HotelDetails';
import Home from './pages/Home';
import Login from './pages/Login';
import Messages from './pages/Messages';
import More from './pages/More';
import Notifications from './pages/Notifications';
import Pricing from './pages/Pricing';
import Properties from './pages/Properties';
import PropertyPhotos from './pages/PropertyPhotos';
import Reports from './pages/Reports';
import Revenue from './pages/Revenue';
import Support from './pages/Support';
import Team from './pages/Team';
import Reviews from './pages/Reviews';
import Welcome from './pages/Welcome';

const guard = (el: JSX.Element) => <RequireAuth><Alerts />{el}</RequireAuth>;

export default function App() {
  return (
    <>
    <DeepLinks />
    <OfflineGate />
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/activate" element={<AccountLink mode="activate" />} />
      <Route path="/reset-password" element={<AccountLink mode="reset" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={guard(<Home />)} />
      <Route path="/bookings" element={guard(<Bookings />)} />
      <Route path="/bookings/:id" element={guard(<BookingDetail />)} />
      <Route path="/extensions" element={guard(<ExtensionsPage />)} />
      <Route path="/pricing" element={guard(<Pricing />)} />
      <Route path="/revenue" element={guard(<Revenue />)} />
      <Route path="/availability" element={guard(<Availability />)} />
      <Route path="/reviews" element={guard(<Reviews />)} />
      <Route path="/messages" element={guard(<Messages />)} />
      <Route path="/messages/:bookingId" element={guard(<Chat />)} />
      <Route path="/guests" element={<Navigate to="/messages" replace />} />
      <Route path="/notifications" element={guard(<Notifications />)} />
      <Route path="/reports" element={guard(<Reports />)} />
      <Route path="/property" element={guard(<PropertyPhotos />)} />
      <Route path="/hotel" element={guard(<HotelDetails />)} />
      <Route path="/team" element={guard(<Team />)} />
      <Route path="/activity" element={guard(<ActivityLog />)} />
      <Route path="/support" element={guard(<Support />)} />
      <Route path="/properties" element={guard(<Properties />)} />
      <Route path="/more" element={guard(<More />)} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
