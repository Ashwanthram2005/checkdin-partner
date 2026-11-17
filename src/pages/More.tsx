import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
  AlertIcon, BankIcon, FileTextIcon, BellIcon, CameraIcon, CalendarIcon, CheckCircleIcon, ClockIcon, MessageIcon, ReportIcon, StarIcon, CheckOutIcon, ChevronRightSm, CloseIcon, EyeIcon, EyeOffIcon, HelpIcon, HotelIdIcon,
  LockIcon, PhoneIcon, ShieldIcon, UserIcon,
} from '../components/Icons';
import { changePassword, getPropertySettings, updatePropertySettings } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { SUPPORT_NUMBER } from '../config';
import { initials } from '../lib/format';
import '../styles/bookings.css';
import '../styles/more.css';

const VERSION = '0.4.0';
const PORTAL = 'https://partner.checkdin.in';

const MANAGE = [
  { to: '/extensions', label: 'Extensions', hint: 'Guests asking to stay longer', icon: <ClockIcon /> },
  { to: '/availability', label: 'Availability', hint: 'Rooms offered to Checkdin, day by day', icon: <CalendarIcon /> },
  { to: '/reviews', label: 'Reviews', hint: 'Read and reply to guest feedback', icon: <StarIcon size={20} /> },
  { to: '/messages', label: 'Messages', hint: 'Chat with your guests in the app', icon: <MessageIcon /> },
  { to: '/notifications', label: 'Notifications', hint: 'Bookings, check-ins and requests', icon: <BellIcon /> },
  { to: '/reports', label: 'Reports & forecast', hint: 'Revenue, stay lengths, guests', icon: <ReportIcon /> },
  { to: '/property', label: 'Photos & amenities', hint: 'What guests see on your listing', icon: <CameraIcon /> },
];

export default function More() {
  const { session, role, property, can, signOut } = useAuth();
  const propertyId = session?.hotelId ?? '';
  const settings = useApi(() => getPropertySettings(propertyId), [propertyId]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const s = settings.data;
  const canEdit = can('bookings');

  async function toggle(key: 'pauseBookings', value: boolean) {
    setSaving(key); setError(null);
    try { await updatePropertySettings(propertyId, { [key]: value }); settings.reload(); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(null); }
  }

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  const bankOk = !!s && s.banking.status.toLowerCase() !== 'pending' && !!s.banking.accountLast4;

  return (
    <div className="app">
      <main className="bk mo">
        <header className="bk__bar"><div><h1>More</h1><p>Your account and settings</p></div></header>

        <section className="profile" aria-label="Your account">
          <span className="profile__avatar" aria-hidden="true">{initials(session?.name ?? '')}</span>
          <div className="profile__text">
            <strong>{session?.name}</strong>
            {role && <span className="role-pill">{role.name}</span>}
          </div>
          <dl className="profile__hotel">
            <div><dt>Property</dt><dd>{property?.name ?? s?.name ?? '—'}</dd></div>
            <div><dt>Hotel ID</dt><dd>{session?.hotelId}</dd></div>
            <div><dt>Status</dt><dd>{property?.status ?? '—'}</dd></div>
          </dl>
          {role && <p className="profile__access"><ShieldIcon size={16} /> {role.description}</p>}
        </section>

        {(error || settings.error) && <div className="alert" role="alert"><AlertIcon /> {error ?? settings.error} <button type="button" className="link-btn" onClick={() => { setError(null); settings.reload(); }}>Retry</button></div>}

        <h2 className="group">Manage</h2>
        <ul className="list manage">
          {MANAGE.map((m) => (
            <li key={m.to}><Link to={m.to} className="row row--link">
              <span className="row__icon">{m.icon}</span>
              <span className="row__text"><strong>{m.label}</strong><small>{m.hint}</small></span>
              <ChevronRightSm />
            </Link></li>
          ))}
        </ul>

        <h2 className="group">Status</h2>
        <ul className="list">
          <SwitchRow icon={<HotelIdIcon />} label={s?.pauseBookings ? 'Offline' : 'Online'} hint={s?.pauseBookings ? 'You’re offline. Guests can’t book your slots right now.' : 'You’re online. Guests can book your slots.'}
            checked={!!s && !s.pauseBookings} disabled={!s || !canEdit || saving === 'pauseBookings'} onChange={(v) => toggle('pauseBookings', !v)} />
        </ul>
        {!canEdit && <p className="locked"><ShieldIcon size={16} /> Your role can’t change your online status.</p>}

        <h2 className="group">Property</h2>
        <ul className="list">
          <li className="row">
            <span className="row__icon"><HotelIdIcon /></span>
            <span className="row__text"><strong>{s?.name ?? property?.name ?? 'Property'}</strong><small>{s?.address || s?.city || 'No address on file'}</small></span>
          </li>
        </ul>

        {can('finance') && (
          <>
            <h2 className="group">PAN, GST &amp; bank</h2>
            <ul className="list">
              <KycRow icon={<FileTextIcon />} label="PAN card" status={s?.banking.panStatus} />
              <KycRow icon={<FileTextIcon />} label="GST" status={s?.banking.gstStatus} />
              <KycRow icon={<BankIcon />} label="Bank account" status={s ? (bankOk ? 'Verified' : s.banking.status || 'Pending') : undefined}
                detail={s && bankOk ? `${s.banking.bankName} ••${s.banking.accountLast4}` : undefined} />
            </ul>
            <p className="locked"><LockIcon size={16} /><span>PAN, GST and bank details can only be changed on the Checkdin partner website, on a computer. Log in at <b>partner.checkdin.in</b> and open Settings.</span></p>
            <a className="abtn-clear more__site" href={PORTAL} target="_blank" rel="noreferrer">Open partner.checkdin.in</a>
          </>
        )}

        <h2 className="group">Security</h2>
        <ul className="list">
          <li><button type="button" className="row row--link row--btn" onClick={() => setPwOpen(true)}>
            <span className="row__icon"><LockIcon /></span>
            <span className="row__text"><strong>Change password</strong><small>Use at least 8 characters with a letter and a number</small></span>
            <ChevronRightSm />
          </button></li>
        </ul>

        <h2 className="group">Help</h2>
        <a className="support" href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>
          <span className="support__icon"><PhoneIcon /></span>
          <span className="support__text"><strong>Call partner support</strong><small>{SUPPORT_NUMBER} · available 24 × 7</small></span>
          <ChevronRightSm />
        </a>
        <ul className="list">
          <li><a className="row row--link" href={PORTAL} target="_blank" rel="noreferrer">
            <span className="row__icon"><HelpIcon /></span>
            <span className="row__text"><strong>Open the partner portal</strong><small>Change PAN, GST and bank details (on a computer)</small></span>
            <ChevronRightSm />
          </a></li>
        </ul>

        <button type="button" className="logout" onClick={() => setConfirm(true)}><CheckOutIcon /> Log out</button>
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
              <p id="lo-desc">You’ll need your password to log back in.</p>
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={() => setConfirm(false)}>Stay logged in</button>
              <button type="button" className="abtn abtn--dark" onClick={() => { setConfirm(false); signOut(); }}>Log out</button>
            </footer>
          </div>
        </div>
      )}

      {pwOpen && <PasswordSheet onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function KycRow({ icon, label, status, detail }: { icon: ReactNode; label: string; status?: string; detail?: string }) {
  const st = (status || '').toLowerCase();
  const tone = st === 'verified' || st === 'active' || st === 'approved' ? 'ok' : st ? 'wait' : 'none';
  return (
    <li className="row">
      <span className="row__icon">{icon}</span>
      <span className="row__text"><strong>{label}</strong><small>{detail ?? 'View only in the app'}</small></span>
      <span className={`kyc kyc--${tone}`}>{status || '—'}</span>
    </li>
  );
}

function SwitchRow({ icon, label, hint, checked, disabled, onChange }: { icon: ReactNode; label: string; hint: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="row">
      <span className="row__icon">{icon}</span>
      <span className="row__text"><strong>{label}</strong><small>{hint}</small></span>
      <label className="switch">
        <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
        <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
      </label>
    </li>
  );
}

function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!cur) return setError('Enter your current password.');
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return setError('New password must be at least 8 characters and include a letter and a number.');
    if (next !== conf) return setError('New passwords do not match.');
    setBusy(true); setError(null);
    try { await changePassword(cur, next, conf); setDone(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="sheet-wrap">
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Change password">
        <div className="sheet__grab" aria-hidden="true" />
        {done ? (
          <>
            <div className="dialog__body"><span className="dialog__icon"><CheckCircleIcon /></span><h2>Password updated</h2><p>Use your new password next time you sign in.</p></div>
            <footer className="sheet__foot"><button type="button" className="abtn abtn--lime" onClick={onClose}>Done</button></footer>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <header className="sheet__head"><h2>Change password</h2><button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close"><CloseIcon /></button></header>
            <div className="sheet__body">
              {error && <div className="alert alert--light" role="alert"><AlertIcon /> {error}</div>}
              {[['Current password', cur, setCur, 'current-password'], ['New password', next, setNext, 'new-password'], ['Confirm new password', conf, setConf, 'new-password']].map(([label, val, set, ac]) => (
                <label key={label as string} className="pw-field">{label as string}
                  <input type={show ? 'text' : 'password'} autoComplete={ac as string} value={val as string} onChange={(e) => { (set as (v: string) => void)(e.target.value); setError(null); }} />
                </label>
              ))}
              <button type="button" className="link-btn pw-show" onClick={() => setShow((v) => !v)}>{show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />} {show ? 'Hide' : 'Show'} passwords</button>
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="abtn abtn--lime" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
