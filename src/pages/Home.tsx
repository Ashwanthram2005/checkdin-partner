import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import BottomNav from '../components/BottomNav';
import ExtensionRequests from '../components/ExtensionRequests';
import { AlertIcon, BookingsIcon, CalendarIcon, CheckInIcon, ChevronRightSm, UsersIcon } from '../components/Icons';
import { getBookings, getDashboard, getPropertySettings, updatePropertySettings } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { dayKey, fmtTime, inr, initials } from '../lib/format';
import { useState } from 'react';
import '../styles/bookings.css';
import '../styles/home.css';

export default function Home() {
  const { session, property, can } = useAuth();
  const propertyId = session?.hotelId ?? '';
  const dash = useApi(getDashboard);
  const books = useApi(getBookings);
  const settings = useApi(() => getPropertySettings(propertyId), [propertyId]);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const today = dayKey(new Date());
  const arrivals = useMemo(
    () => (books.data ?? []).filter((b) => b.checkIn && dayKey(b.checkIn) === today && b.status !== 'Cancelled' && b.status !== 'Expired')
      .sort((a, b) => a.checkIn!.getTime() - b.checkIn!.getTime()),
    [books.data, today],
  );

  const paused = settings.data?.pauseBookings ?? false;
  const first = (session?.name ?? '').split(' ')[0];

  async function togglePause() {
    if (!settings.data) return;
    setToggling(true); setToggleError(null);
    try {
      await updatePropertySettings(propertyId, { pauseBookings: !paused });
      settings.reload();
    } catch (e) { setToggleError((e as Error).message); }
    finally { setToggling(false); }
  }

  const d = dash.data;
  const stats = [
    { label: 'Today’s bookings', value: d ? d.today_bookings : '—', icon: <CalendarIcon /> },
    { label: 'Guests in house', value: d ? d.active_bookings : '—', icon: <UsersIcon /> },
    { label: 'Total bookings', value: d ? d.total_bookings : '—', icon: <BookingsIcon /> },
    { label: 'Rating', value: d ? (d.avg_rating ? d.avg_rating.toFixed(1) : '—') : '—', icon: <CheckInIcon /> },
  ];

  return (
    <div className="app">
      <main className="bk home">
        <header className="bk__bar">
          <div>
            <h1>Hello{first ? `, ${first}` : ''}</h1>
            <p>{property?.name ?? 'Your property'}{property?.city ? ` · ${property.city}` : ''}</p>
          </div>
          <span className="avatar avatar--lg" aria-hidden="true">{initials(session?.name ?? '')}</span>
        </header>

        {(dash.error || books.error) && (
          <div className="alert" role="alert"><AlertIcon /> {dash.error ?? books.error} <button type="button" className="link-btn" onClick={() => { dash.reload(); books.reload(); settings.reload(); }}>Retry</button></div>
        )}

        <section className={`live${paused ? ' live--paused' : ''}`} aria-label="Booking status">
          <div className="live__text">
            <span className="live__dot" aria-hidden="true" />
            <div>
              <strong>{settings.loading && !settings.data ? 'Checking…' : paused ? 'Bookings paused' : 'Accepting new bookings'}</strong>
              <small>{paused ? 'Guests can’t book your slots right now.' : settings.data?.autoAcceptBookings ? 'Auto-accept is on.' : 'You approve each booking.'}</small>
            </div>
          </div>
          {can('bookings') && settings.data && (
            <label className="switch" title={paused ? 'Resume bookings' : 'Pause bookings'}>
              <input type="checkbox" role="switch" checked={!paused} disabled={toggling} onChange={togglePause} aria-label="Accepting new bookings" />
              <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
            </label>
          )}
        </section>
        {toggleError && <div className="alert" role="alert"><AlertIcon /> {toggleError}</div>}

        <section className="stats stats--grid" aria-label="Summary">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat__label">{s.icon}{s.label}</div>
              <div className="stat__value">{s.value}</div>
            </div>
          ))}
        </section>

        <ExtensionRequests />

        <section className="panel" aria-label="Today’s arrivals">
          <div className="panel__head">
            <div><h2>Today’s arrivals</h2><p>Guests booked to check in today</p></div>
            <Link to="/bookings" className="more-link">All bookings <ChevronRightSm size={16} /></Link>
          </div>
          {books.loading && !books.data && <p className="muted-note">Loading…</p>}
          {books.data && arrivals.length === 0 && <p className="muted-note">No arrivals today.</p>}
          <ul className="arrivals">
            {arrivals.map((b) => (
              <li key={b.id}>
                <span className="avatar">{initials(b.guest)}</span>
                <span className="arrivals__who"><strong>{b.guest}</strong><small>{b.stayLabel} · {inr(b.amount)}</small></span>
                <span className="arrivals__time"><strong>{fmtTime(b.checkIn!)}</strong><small>{b.status}</small></span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
