import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SubPage from '../components/SubPage';
import { AlertIcon, ChevronRightSm, InfoIcon, MessageIcon, SearchIcon } from '../components/Icons';
import { getBookings, getConversations, type Booking } from '../api/partner';
import { useApi } from '../api/useApi';
import { addDays, dayKey, fmtTime, initials } from '../lib/format';
import '../styles/chat.css';

type Group = 'all' | 'inhouse' | 'today' | 'upcoming' | 'recent';
const GROUPS: { id: Group; label: string }[] = [
  { id: 'all', label: 'All chats' }, { id: 'inhouse', label: 'In the hotel' }, { id: 'today', label: 'Arriving today' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'recent', label: 'Recent' },
];

function ago(d: Date | null) {
  if (!d) return '';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return fmtTime(d);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const books = useApi(getBookings);
  const convos = useApi(getConversations);
  const [group, setGroup] = useState<Group>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setInterval(convos.reload, 15000);
    return () => clearInterval(t);
  }, [convos.reload]);

  const today = dayKey(new Date());
  const weekAgo = dayKey(addDays(new Date(), -7));
  const byBooking = useMemo(() => new Map((convos.data?.items ?? []).map((c) => [c.bookingId, c])), [convos.data]);

  const rows = useMemo(() => {
    const inGroup = (b: Booking) => {
      const day = b.checkIn ? dayKey(b.checkIn) : '';
      const ready = b.status === 'Confirmed' || b.status === 'Upcoming';
      if (group === 'inhouse') return b.status === 'Checked in';
      if (group === 'today') return ready && day === today;
      if (group === 'upcoming') return ready && day > today;
      if (group === 'recent') return b.status === 'Completed' && day >= weekAgo;
      return !!byBooking.get(b.id) || b.status === 'Checked in' || (ready && day >= today);
    };
    const term = q.trim().toLowerCase();
    return (books.data ?? [])
      .filter((b) => b.status !== 'Cancelled' && b.status !== 'Expired' && inGroup(b) && (!term || b.guest.toLowerCase().includes(term) || b.reference.toLowerCase().includes(term)))
      .map((b) => ({ b, c: byBooking.get(b.id) }))
      .sort((x, y) => (y.c?.unread ?? 0) - (x.c?.unread ?? 0) || (y.c?.lastAt?.getTime() ?? 0) - (x.c?.lastAt?.getTime() ?? 0) || (y.b.checkIn?.getTime() ?? 0) - (x.b.checkIn?.getTime() ?? 0));
  }, [books.data, byBooking, group, q, today, weekAgo]);

  const unavailable = convos.data && !convos.data.available;
  const unreadTotal = (convos.data?.items ?? []).reduce((t, c) => t + c.unread, 0);

  return (
    <SubPage title="Messages" subtitle={unreadTotal ? `${unreadTotal} unread` : 'Chat with your guests'}>
      {books.error && <div className="alert" role="alert"><AlertIcon /> {books.error} <button type="button" className="link-btn" onClick={books.reload}>Retry</button></div>}
      {unavailable && <p className="pr__hint"><InfoIcon /> In-app chat isn’t switched on for your server yet, so messages can’t be delivered. You can still open a guest to use WhatsApp or SMS.</p>}

      <label className="search__box chat-search"><SearchIcon /><input type="search" placeholder="Search guest or reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search chats" /></label>

      <nav className="chips" role="tablist" aria-label="Who">
        {GROUPS.map((g) => <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={`chip${group === g.id ? ' is-active' : ''}`} onClick={() => setGroup(g.id)}>{g.label}</button>)}
      </nav>

      {books.loading && !books.data && <p className="muted-note">Loading…</p>}
      {books.data && rows.length === 0 && <div className="empty"><MessageIcon size={28} /><strong>No guests here right now</strong><span>Guests with a current or upcoming stay show up here so you can message them.</span></div>}

      <ul className="chatlist">
        {rows.map(({ b, c }) => (
          <li key={b.id}>
            <Link to={`/messages/${encodeURIComponent(b.id)}`} className={`chatrow${c?.unread ? ' is-unread' : ''}`}>
              <span className="avatar">{initials(b.guest)}</span>
              <span className="chatrow__main">
                <strong>{b.guest}</strong>
                <small>{c?.last ? `${c.lastFrom === 'partner' ? 'You: ' : ''}${c.last}` : `${b.stayLabel}${b.checkIn ? ` · ${fmtTime(b.checkIn)}` : ''} · ${b.status}`}</small>
              </span>
              <span className="chatrow__meta">{c?.lastAt && <em>{ago(c.lastAt)}</em>}{c?.unread ? <span className="count-badge">{c.unread}</span> : <ChevronRightSm size={16} />}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SubPage>
  );
}
