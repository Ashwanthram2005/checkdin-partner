import { NavLink } from 'react-router-dom';
import { BookingsIcon, ChartIcon, HomeIcon, MoreIcon, TagIcon } from './Icons';

const ITEMS = [
  { to: '/app/home', label: 'Home', icon: <HomeIcon /> },
  { to: '/bookings', label: 'Bookings', icon: <BookingsIcon /> },
  { to: '/pricing', label: 'Pricing', icon: <TagIcon /> },
  { to: '/revenue', label: 'Revenue', icon: <ChartIcon /> },
  { to: '/more', label: 'More', icon: <MoreIcon /> },
];

export default function BottomNav() {
  return (
    <nav className="bnav" aria-label="Main">
      {ITEMS.map((i) => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => `bnav__item${isActive ? ' is-active' : ''}`}>
          <span className="bnav__icon">{i.icon}</span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
