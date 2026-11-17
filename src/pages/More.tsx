import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
  BankIcon, BellIcon, CheckOutIcon, ChevronRightSm, FileTextIcon, HelpIcon, HotelIdIcon, PhoneIcon,
  ShieldIcon, UserIcon, UsersIcon, VolumeIcon,
} from '../components/Icons';
import { useSession } from '../auth/session';
import { can } from '../data/roles';
import '../styles/bookings.css';
import '../styles/more.css';

const SUPPORT_NUMBER = '1800 313 2200';
const VERSION = '0.1.0';

interface Row { to: string; label: string; hint: string; icon: ReactNode; permission?: string }

const PROPERTY_ROWS: Row[] = [
  { to: '/app/hotel-details', label: 'Hotel details', hint: 'Name, address, photos and amenities', icon: <HotelIdIcon /> },
  { to: '/app/staff', label: 'Staff & roles', hint: 'Add users and choose what they can access', icon: <UsersIcon />, permission: 'staff' },
  { to: '/app/bank', label: 'Bank account & KYC', hint: 'Payout account, PAN and GST', icon: <BankIcon />, permission: 'finance' },
];

const HELP_ROWS: Row[] = [
  { to: '/app/help', label: 'Help centre', hint: 'Guides and answers to common questions', icon: <HelpIcon /> },
  { to: '/app/terms', label: 'Terms & policies', hint: 'Partner agreement, privacy and cancellation', icon: <FileTextIcon /> },
];

type Prefs = { requests: boolean; reminders: boolean; payouts: boolean; sound: boolean };
const DEFAULT_PREFS: Prefs = { requests: true, reminders: true, payouts: true, sound: true };
const STORE = 'checkdin.partner.prefs';

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS; // storage can be blocked (private mode, etc.)
  }
}

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

export default function More() {
  const navigate = useNavigate();
  const session = useSession();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  const allowed = (r: Row) => !r.permission || can(session.role, r.permission);
  const property = PROPERTY_ROWS.filter(allowed);
  const hidden = PROPERTY_ROWS.length - property.length;
  const toggle = (k: keyof Prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  function logout() {
    // TODO: clear the stored token and user, then return to the start.
    setConfirm(false);
    navigate('/');
  }

  const toggles: { key: keyof Prefs; label: string; hint: string; icon: ReactNode }[] = [
    { key: 'requests', label: 'New booking requests', hint: 'Alert me as soon as a guest asks to book', icon: <BellIcon /> },
    { key: 'sound', label: 'Alert sound', hint: 'Play a sound for new requests', icon: <VolumeIcon /> },
    { key: 'reminders', label: 'Check-in reminders', hint: 'Remind me before a guest arrives', icon: <BellIcon /> },
    { key: 'payouts', label: 'Payout updates', hint: 'Tell me when money is on its way', icon: <BankIcon /> },
  ];

  return (
    <div className="app">
      <main className="bk mo">
        <header className="bk__bar">
          <div>
            <h1>More</h1>
            <p>Your account and settings</p>
          </div>
        </header>

        <section className="profile" aria-label="Your account">
          <span className="profile__avatar" aria-hidden="true">{initials(session.name)}</span>
          <div className="profile__text">
            <strong>{session.name}</strong>
            <span className="role-pill">{session.role.name}</span>
          </div>
          <dl className="profile__hotel">
            <div><dt>Property</dt><dd>{session.hotelName}</dd></div>
            <div><dt>Hotel ID</dt><dd>{session.hotelId}</dd></div>
            <div><dt>User ID</dt><dd>{session.userId}</dd></div>
          </dl>
          <p className="profile__access"><ShieldIcon size={16} /> {session.role.description}</p>
        </section>

        <h2 className="group">Property</h2>
        <ul className="list">
          {property.map((r) => <RowLink key={r.to} row={r} />)}
        </ul>
        {hidden > 0 && (
          <p className="locked"><ShieldIcon size={16} /> {hidden} {hidden === 1 ? 'option is' : 'options are'} hidden for the {session.role.name} role. Ask the owner if you need access.</p>
        )}

        <h2 className="group">Notifications</h2>
        <ul className="list">
          {toggles.map((t) => (
            <li key={t.key} className="row">
              <span className="row__icon">{t.icon}</span>
              <span className="row__text"><strong>{t.label}</strong><small>{t.hint}</small></span>
              <label className="switch">
                <input type="checkbox" role="switch" checked={prefs[t.key]} onChange={() => toggle(t.key)} aria-label={t.label} />
                <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
              </label>
            </li>
          ))}
        </ul>

        <h2 className="group">Help</h2>
        <a className="support" href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>
          <span className="support__icon"><PhoneIcon /></span>
          <span className="support__text"><strong>Call partner support</strong><small>{SUPPORT_NUMBER} · available 24 × 7</small></span>
          <ChevronRightSm />
        </a>
        <ul className="list">
          {HELP_ROWS.map((r) => <RowLink key={r.to} row={r} />)}
        </ul>

        <button type="button" className="logout" onClick={() => setConfirm(true)}>
          <CheckOutIcon /> Log out
        </button>
        <p className="version">Checkdin Partner · v{VERSION}</p>
      </main>

      <BottomNav />

      {confirm && (
        <div className="sheet-wrap">
          <button type="button" className="sheet-scrim" aria-label="Cancel" onClick={() => setConfirm(false)} />
          <div className="sheet dialog" role="alertdialog" aria-modal="true" aria-labelledby="lo-title" aria-describedby="lo-desc">
            <div className="sheet__grab" aria-hidden="true" />
            <div className="dialog__body">
              <span className="dialog__icon"><UserIcon /></span>
              <h2 id="lo-title">Log out of Checkdin?</h2>
              <p id="lo-desc">You’ll need your {session.hotelId} User ID and password to log back in.</p>
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={() => setConfirm(false)}>Stay logged in</button>
              <button type="button" className="abtn abtn--dark" onClick={logout}>Log out</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function RowLink({ row }: { row: Row }) {
  return (
    <li>
      <Link to={row.to} className="row row--link">
        <span className="row__icon">{row.icon}</span>
        <span className="row__text"><strong>{row.label}</strong><small>{row.hint}</small></span>
        <ChevronRightSm />
      </Link>
    </li>
  );
}
