import { useMemo, useState } from 'react';
import {
  CalendarIcon, CheckInIcon, CheckOutIcon, ChevronDown, ClockIcon, DownloadIcon, SearchIcon,
  UsersIcon, XCircleIcon,
} from '../components/Icons';
import { BOOKINGS, STATUSES, type Booking, type BookingStatus } from '../data/bookings';
import '../styles/bookings.css';

type Tab = 'All Bookings' | BookingStatus;
const TABS: Tab[] = ['All Bookings', ...STATUSES];

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/^(\d):/, '0$1:');
const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

const statusClass = (s: BookingStatus) => 'pill pill--' + s.toLowerCase().replace(/\s+/g, '-');

function minutesLeft(b: Booking, now: number) {
  if (b.status !== 'Pending Approval' || !b.requestExpiresAt) return null;
  const ms = new Date(b.requestExpiresAt).getTime() - now;
  if (ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

function toCsv(rows: Booking[]) {
  const head = ['Booking ID', 'Code', 'Guest', 'Phone', 'Check-in', 'Check-out', 'Duration (h)', 'Source', 'Amount', 'Payment', 'Status'];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((b) => [
    '#' + b.id, b.code, b.guest, b.phone, b.checkIn.replace('T', ' '), b.checkOut?.replace('T', ' ') ?? '',
    b.durationHours, b.source, b.amount, b.payment, b.status,
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...body].join('\n');
}

export default function Bookings() {
  const [bookings] = useState<Booking[]>(BOOKINGS);
  const [autoAccept, setAutoAccept] = useState(false);
  const [tab, setTab] = useState<Tab>('All Bookings');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [guest, setGuest] = useState('');
  const [phone, setPhone] = useState('');
  const [duration, setDuration] = useState('all');
  const [payment, setPayment] = useState('all');
  const [status, setStatus] = useState('all');

  const now = Date.now();
  const today = new Date();
  const todayKey = dayKey(today);
  const todayLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const count = (s: BookingStatus) => bookings.filter((b) => b.status === s).length;

  const rows = useMemo(() => {
    const id = bookingId.trim().toLowerCase().replace(/^#/, '');
    const g = guest.trim().toLowerCase();
    const p = phone.replace(/\D/g, '');
    return bookings.filter((b) => {
      const day = b.checkIn.slice(0, 10);
      if (tab !== 'All Bookings' && b.status !== tab) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (id && !b.id.toLowerCase().includes(id) && !b.code.toLowerCase().includes(id)) return false;
      if (g && !b.guest.toLowerCase().includes(g)) return false;
      if (p && !b.phone.includes(p)) return false;
      if (duration !== 'all' && String(b.durationHours) !== duration) return false;
      if (payment !== 'all' && b.payment !== payment) return false;
      if (status !== 'all' && b.status !== status) return false;
      return true;
    });
  }, [bookings, tab, from, to, bookingId, guest, phone, duration, payment, status]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  function exportCsv() {
    const list = selected.size ? rows.filter((r) => selected.has(r.id)) : rows;
    const url = URL.createObjectURL(new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${todayKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: 'Total Bookings', value: bookings.length, sub: 'This period', icon: <CalendarIcon /> },
    { label: 'Pending Approval', value: count('Pending Approval'), sub: 'Needs your action', icon: <ClockIcon />, accent: true },
    { label: 'Today’s Check-ins', value: bookings.filter((b) => b.checkIn.slice(0, 10) === todayKey && b.status !== 'Cancelled').length, sub: todayLabel, icon: <CheckInIcon /> },
    { label: 'Today’s Check-outs', value: bookings.filter((b) => b.checkOut?.slice(0, 10) === todayKey && b.status !== 'Cancelled').length, sub: todayLabel, icon: <CheckOutIcon /> },
    { label: 'Active Guests', value: count('Checked In'), sub: 'In-house now', icon: <UsersIcon /> },
    { label: 'Cancelled', value: count('Cancelled'), sub: 'This period', icon: <XCircleIcon /> },
  ];

  return (
    <main className="bk">
      <header className="bk__head">
        <div>
          <h1>Bookings</h1>
          <p>Approve requests, run check-ins and check-outs, and manage guest details.</p>
        </div>
        <button type="button" className="bk__btn" onClick={exportCsv}>
          <DownloadIcon /> Export CSV
        </button>
      </header>

      <section className="bk__stats" aria-label="Summary">
        {stats.map((s) => (
          <div key={s.label} className={`stat${s.accent ? ' stat--accent' : ''}`}>
            <div className="stat__label">{s.icon}{s.label}</div>
            <div className="stat__value">{s.value}</div>
            <div className="stat__sub">{s.sub}</div>
          </div>
        ))}
      </section>

      <section className="bk__card approval">
        <div>
          <h2>{autoAccept ? 'Auto approval' : 'Manual approval'}</h2>
          <p>
            {autoAccept
              ? 'Auto-accept is on — new requests are confirmed automatically.'
              : 'Auto-accept is off — each request must be accepted before its timer runs out.'}
          </p>
        </div>
        <label className="switch">
          <span>Auto-accept bookings</span>
          <input type="checkbox" role="switch" checked={autoAccept} onChange={(e) => setAutoAccept(e.target.checked)} />
          <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
        </label>
      </section>

      <nav className="tabs" role="tablist" aria-label="Booking status">
        {TABS.map((t) => (
          <button
            key={t} type="button" role="tab" aria-selected={tab === t}
            className={`tabs__btn${tab === t ? ' is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            <span className="tabs__count">{t === 'All Bookings' ? bookings.length : count(t)}</span>
          </button>
        ))}
      </nav>

      <section className="bk__card filters" aria-label="Filters">
        <div className="filters__grid">
          <div className="f f--dates">
            <label htmlFor="from">Date range</label>
            <div className="f__range">
              <input id="from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
              <span>to</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            </div>
          </div>
          <div className="f">
            <label htmlFor="bid">Booking ID</label>
            <div className="f__input"><SearchIcon /><input id="bid" placeholder="CHK2451" value={bookingId} onChange={(e) => setBookingId(e.target.value)} /></div>
          </div>
          <div className="f">
            <label htmlFor="gn">Guest name</label>
            <div className="f__input"><SearchIcon /><input id="gn" placeholder="Search guest" value={guest} onChange={(e) => setGuest(e.target.value)} /></div>
          </div>
          <div className="f">
            <label htmlFor="ph">Phone number</label>
            <div className="f__input"><SearchIcon /><input id="ph" inputMode="tel" placeholder="Guest phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="f">
            <label htmlFor="du">Duration</label>
            <div className="f__select">
              <select id="du" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="all">All durations</option>
                <option value="3">3 Hours</option>
                <option value="6">6 Hours</option>
                <option value="12">12 Hours</option>
              </select>
              <ChevronDown />
            </div>
          </div>
          <div className="f">
            <label htmlFor="pa">Payment status</label>
            <div className="f__select">
              <select id="pa" value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option value="all">All payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown />
            </div>
          </div>
          <div className="f">
            <label htmlFor="st">Booking status</label>
            <div className="f__select">
              <select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown />
            </div>
          </div>
        </div>
        <p className="filters__count"><b>{rows.length}</b> {rows.length === 1 ? 'booking matches' : 'bookings match'} the current filters</p>
      </section>

      <section className="bk__card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="c-check">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all bookings" />
                </th>
                <th>Booking ID</th><th>Guest</th><th>Phone</th><th>Check-in</th><th>Check-out</th>
                <th>Duration</th><th>Source</th><th className="num">Amount</th><th>Payment</th>
                <th>Status</th><th>Extension</th><th>Time remaining</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={13} className="empty">No bookings match these filters.</td></tr>
              )}
              {rows.map((b) => {
                const left = minutesLeft(b, now);
                return (
                  <tr key={b.id} className={selected.has(b.id) ? 'is-selected' : ''}>
                    <td className="c-check">
                      <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleOne(b.id)} aria-label={`Select booking ${b.id}`} />
                    </td>
                    <td><strong className="mono">#{b.id}</strong><small>{b.code}</small></td>
                    <td>
                      <span className="guest"><span className="guest__avatar">{b.guest[0]?.toUpperCase()}</span>{b.guest}</span>
                    </td>
                    <td>{b.phone}</td>
                    <td><strong>{fmtTime(b.checkIn)}</strong><small>{fmtDate(b.checkIn)}</small></td>
                    <td>{b.checkOut ? <><strong>{fmtTime(b.checkOut)}</strong><small>{fmtDate(b.checkOut)}</small></> : <span className="muted">—</span>}</td>
                    <td>{b.durationHours} Hours</td>
                    <td>{b.source}</td>
                    <td className="num"><strong>{inr(b.amount)}</strong></td>
                    <td><span className={`pay pay--${b.payment}`}>{b.payment}</span></td>
                    <td><span className={statusClass(b.status)}>{b.status}</span></td>
                    <td className="muted">{b.extension}</td>
                    <td>{left ? <span className="timer">{left}</span> : <span className="muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
