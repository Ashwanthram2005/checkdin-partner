import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { ArrowLeft } from './Icons';
import '../styles/bookings.css';
import '../styles/home.css';

/** Frame for the screens opened from the More menu: back button, title and the bottom bar. */
export default function SubPage({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const navigate = useNavigate();
  return (
    <div className="app">
      <main className={`bk home ${className}`}>
        <header className="bk__bar sub__bar">
          <button type="button" className="icon-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/more'))} aria-label="Back"><ArrowLeft /></button>
          <div className="sub__title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          {action}
        </header>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
