import { Route, Routes } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Placeholder title="Partner Login" />} />
      <Route path="/register" element={<Placeholder title="List Your Property" />} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}
