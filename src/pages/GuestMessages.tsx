import { useMemo, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, InfoIcon, MessageIcon, PhoneIcon } from '../components/Icons';
import { getBookings, type Booking } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { addDays, dayKey, fmtTime, initials } from '../lib/format';

type Audience = 'inhouse' | 'today' | 'upcoming' | 'recent';
const AUDIENCES: { id: Audience; label: string }[] = [
  { id: 'inhouse', label: 'In the hotel' }, { id: 'today', label: 'Arriving today' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'recent', label: 'Recent guests' },
];

const TEMPLATES = [
  { id: 'welcome', label: 'Welcome', text: 'Hi {guest}, welcome to {hotel}! We’re ready for your stay. Let us know if you need anything.' },
  { id: 'arrival', label: 'Arrival', text: 'Hi {guest}, your {stay} stay at {hotel} starts at {time}. Please carry a valid ID. See you soon!' },
  { id: 'checkout', label: 'Check-out', text: 'Hi {guest}, a gentle reminder that your check-out from {hotel} is at {out}. Thank you for staying with us.' },
  { id: 'thanks', label: 'Thank you', text: 'Hi {guest}, thank you for staying at {hotel}. We’d love your review on the Checkdin app. It really helps!' },
  { id: 'custom', label: 'Write my own', text: '' },
];

/** Indian numbers are stored without the country code. */
const intl = (phone: string) => { const d = phone.replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d; };

export default function GuestMessages() {
  const { property } = useAuth();
  const { data, error, loading, reload } = useApi(getBookings);
  const [aud, setAud] = useState<Audience>('inhouse');
  const [tpl, setTpl] = useState('welcome');
  const [custom, setCustom] = useState('');

  const today = dayKey(new Date());
  const sevenAgo = dayKey(addDays(new Date(), -7));
  const list = useMemo(() => (data ?? []).filter((b) => {
    if (!b.phone) return false;
    const day = b.checkIn ? dayKey(b.checkIn) : '';
    const ready = b.status === 'Confirmed' || b.status === 'Upcoming';
    if (aud === 'inhouse') return b.status === 'Checked in';
    if (aud === 'today') return ready && day === today;
    if (aud === 'upcoming') return ready && day > today;
    return b.status === 'Completed' && day >= sevenAgo;
  }), [data, aud, today, sevenAgo]);

  const text = (b: Booking) => {
    const base = tpl === 'custom' ? custom : (TEMPLATES.find((t) => t.id === tpl)?.text ?? '');
    return base
      .replace(/\{guest\}/g, b.guest.split(' ')[0] || 'there')
      .replace(/\{hotel\}/g, property?.name ?? 'our hotel')
      .replace(/\{stay\}/g, b.stayLabel.toLowerCase())
      .replace(/\{time\}/g, b.checkIn ? fmtTime(b.checkIn) : 'your booked time')
      .replace(/\{out\}/g, b.checkOut ? fmtTime(b.checkOut) : 'your booked time');
  };

  return (
    <SubPage title="Guests" subtitle="Message guests from your own phone">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      <p className="pr__hint"><InfoIcon /> Messages open in WhatsApp or your SMS app, and are sent from your own number. Checkdin doesn’t send them for you.</p>

      <nav className="chips" role="tablist" aria-label="Who to message">
        {AUDIENCES.map((a) => <button key={a.id} type="button" role="tab" aria-selected={aud === a.id} className={`chip${aud === a.id ? ' is-active' : ''}`} onClick={() => setAud(a.id)}>{a.label}{aud === a.id && data && <span className="chip__count">{list.length}</span>}</button>)}
      </nav>

      <section className="panel" aria-label="Message">
        <div className="panel__head"><div><h2>Message</h2><p>Pick a template, or write your own.</p></div></div>
        <div className="opts">{TEMPLATES.map((t) => <button key={t.id} type="button" aria-pressed={tpl === t.id} className={`opt${tpl === t.id ? ' is-on' : ''}`} onClick={() => setTpl(t.id)}>{t.label}</button>)}</div>
        {tpl === 'custom' && <textarea className="textarea" value={custom} maxLength={500} onChange={(e) => setCustom(e.target.value)} placeholder="Hi {guest}, …" aria-label="Your message" />}
        {tpl !== 'custom' && <p className="msg-preview">{TEMPLATES.find((t) => t.id === tpl)?.text}</p>}
        <p className="char-count">{'{guest}'} is replaced with each guest’s first name.</p>
      </section>

      {loading && !data && <p className="muted-note">Loading guests…</p>}
      {data && list.length === 0 && <div className="empty"><MessageIcon size={28} /><strong>No guests here right now</strong><span>Guests in this group will show up with buttons to message or call them.</span></div>}

      <ul className="cards">
        {list.map((b) => {
          const msg = text(b);
          const ok = msg.trim().length > 0;
          return (
            <li key={b.id} className="card-b">
              <div className="card-b__top">
                <span className="avatar">{initials(b.guest)}</span>
                <div className="card-b__who"><strong>{b.guest}</strong><small>{b.stayLabel}{b.checkIn ? ` · ${fmtTime(b.checkIn)}` : ''} · {b.phone}</small></div>
              </div>
              <div className="actions">
                <a className={`abtn abtn--lime msg-btn${ok ? '' : ' is-off'}`} aria-disabled={!ok} href={ok ? `https://wa.me/${intl(b.phone)}?text=${encodeURIComponent(msg)}` : undefined} target="_blank" rel="noreferrer">WhatsApp</a>
                <a className={`abtn abtn--ghost msg-btn${ok ? '' : ' is-off'}`} aria-disabled={!ok} href={ok ? `sms:+${intl(b.phone)}?body=${encodeURIComponent(msg)}` : undefined}>SMS</a>
                <a className="abtn abtn--ghost msg-btn" href={`tel:${b.phone}`} aria-label={`Call ${b.guest}`}><PhoneIcon size={18} /></a>
              </div>
            </li>
          );
        })}
      </ul>
    </SubPage>
  );
}
