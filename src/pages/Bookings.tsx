import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
  CalendarIcon, CheckInIcon, CheckOutIcon, ClockIcon, CloseIcon, DownloadIcon, FilterIcon,
  PhoneIcon, SearchIcon, UsersIcon, XCircleIcon,
} from '../components/Icons';
import { BOOKINGS, demoBookings, STATUSES, type Booking, type BookingStatus } from '../data/bookings';
import '../styles/bookings.css';

type Tab = 'All' | BookingStatus;
const TABS: Tab[] = ['All', ...STATUSES];

interface Filters { from: string; to: string; duration: string; payment: string; status: string }
const NO_FILTERS: Filters = { from: '', to: '', duration: 'all', payment: 'all', status: 'all' };

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${pad(h)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'am' : 'pm'}`;
};
const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
const pillClass = (s: BookingStatus) => 'pill pill--' + s.toLowerCase().replace(/\s+/g, '-');

function timeLeft(b: Booking, now: number) {
  if (b.status !== 'Pending Approval' || !b.requestExpiresAt) return null;
  const sec = Math.max(0, Math.floor((new Date(b.requestExpiresAt).getTime() - now) / 1000));
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}

function toCsv(rows: Booking[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Booking ID', 'Code', 'Guest', 'Phone', 'Check-in', 'Check-out', 'Duration (h)', 'Source', 'Amount', 'Payment', 'Status'];
  const body = rows.map((b) => ['#' + b.id, b.code, b.guest, b.phone, b.checkIn.replace('T', ' '), b.checkOut?.replace('T', ' ') ?? '', b.durationHours, b.source, b.amount, b.payment, b.status].map(esc).join(','));
  return [head.map(esc).join(','), ...body].join('\n');
}

export default function Bookings() {
  const [params] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>(() => (params.get('demo') ? [...demoBookings(), ...BOOKINGS] : BOOKINGS));
  const [autoAccept, setAutoAccept] = useState(false);
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);

  // tick once a second only while a request timer is running
  const hasTimer = bookings.some((b) => b.status === 'Pending Approval' && b.requestExpiresAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!hasTimer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasTimer]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const today = new Date();
  const todayKey = dayKey(today);
  const todayLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const count = (s: BookingStatus) => bookings.filter((b) => b.status === s).length;
  const activeFilters = (Object.keys(NO_FILTERS) as (keyof Filters)[]).filter((k) => filters[k] !== NO_FILTERS[k]).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const digits = q.replace(/\D/g, '');
    return bookings.filter((b) => {
      const day = b.checkIn.slice(0, 10);
      if (tab !== 'All' && b.status !== tab) return false;
      if (filters.status !== 'all' && b.status !== filters.status) return false;
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      if (filters.duration !== 'all' && String(b.durationHours) !== filters.duration) return false;
      if (filters.payment !== 'all' && b.payment !== filters.payment) return false;
      if (q && !(b.id.includes(q) || b.code.toLowerCase().includes(q) || b.guest.toLowerCase().includes(q) || (digits && b.phone.includes(digits)))) return false;
      return true;
    });
  }, [bookings, tab, query, filters]);

  const setStatusOf = (id: string, status: BookingStatus) =>
    setBookings((all) => all.map((b) => (b.id === id ? { ...b, status, requestExpiresAt: null } : b)));

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `bookings-${todayKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: 'Total', value: bookings.length, sub: 'This period', icon: <CalendarIcon /> },
    { label: 'Pending', value: count('Pending Approval'), sub: 'Needs your action', icon: <ClockIcon />, accent: true },
    { label: 'Check-ins', value: bookings.filter((b) => b.checkIn.slice(0, 10) === todayKey && b.status !== 'Cancelled').length, sub: todayLabel, icon: <CheckInIcon /> },
    { label: 'Check-outs', value: bookings.filter((b) => b.checkOut?.slice(0, 10) === todayKey && b.status !== 'Cancelled').length, sub: todayLabel, icon: <CheckOutIcon /> },
    { label: 'Active guests', value: count('Checked In'), sub: 'In-house now', icon: <UsersIcon /> },
    { label: 'Cancelled', value: count('Cancelled'), sub: 'This period', icon: <XCircleIcon /> },
  ];

  const openSheet = () => { setDraft(filters); setSheet(true); };
  const apply = () => { setFilters(draft); setSheet(false); };
  const reset = () => { setDraft(NO_FILTERS); setFilters(NO_FILTERS); setSheet(false); };

  return (
    <div className="app">
      <main className="bk">
        <header className="bk__bar">
          <div>
            <h1>Bookings</h1>
            <p>Approve requests, check guests in and out</p>
          </div>
          <button type="button" className="icon-btn" onClick={exportCsv} aria-label="Export CSV">
            <DownloadIcon />
          </button>
        </header>

        <section className="stats" aria-label="Summary">
          {stats.map((s) => (
            <div key={s.label} className={`stat${s.accent ? ' stat--accent' : ''}`}>
              <div className="stat__label">{s.icon}{s.label}</div>
              <div className="stat__value">{s.value}</div>
              <div className="stat__sub">{s.sub}</div>
            </div>
          ))}
        </section>

        <section className="approval">
          <div>
            <h2>{autoAccept ? 'Auto approval' : 'Manual approval'}</h2>
            <p>{autoAccept ? 'New requests are confirmed automatically.' : 'Accept each request before its timer runs out.'}</p>
          </div>
          <label className="switch">
            <input type="checkbox" role="switch" checked={autoAccept} onChange={(e) => setAutoAccept(e.target.checked)} aria-label="Auto-accept bookings" />
            <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
          </label>
        </section>

        <div className="search">
          <label className="search__box">
            <SearchIcon />
            <input
              type="search" placeholder="Booking ID, guest or phone" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search bookings"
            />
          </label>
          <button type="button" className="icon-btn icon-btn--filter" onClick={openSheet} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`}>
            <FilterIcon />
            {activeFilters > 0 && <span className="badge">{activeFilters}</span>}
          </button>
        </div>

        <nav className="chips" role="tablist" aria-label="Booking status">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`chip${tab === t ? ' is-active' : ''}`} onClick={() => setTab(t)}>
              {t}<span className="chip__count">{t === 'All' ? bookings.length : count(t)}</span>
            </button>
          ))}
        </nav>

        <p className="result-count"><b>{rows.length}</b> {rows.length === 1 ? 'booking matches' : 'bookings match'} the current filters</p>

        <ul className="cards">
          {rows.length === 0 && (
            <li className="empty">
              <SearchIcon size={28} />
              <strong>No bookings found</strong>
              <span>Try a different search or clear the filters.</span>
              {(activeFilters > 0 || query || tab !== 'All') && (
                <button type="button" className="abtn-clear" onClick={() => { setQuery(''); setTab('All'); setFilters(NO_FILTERS); }}>Clear all</button>
              )}
            </li>
          )}
          {rows.map((b) => {
            const left = timeLeft(b, now);
            return (
              <li key={b.id} className="card-b">
                <div className="card-b__top">
                  <span className="avatar">{b.guest[0]?.toUpperCase()}</span>
                  <div className="card-b__who">
                    <strong>{b.guest}</strong>
                    <small>#{b.id} · {b.code}</small>
                  </div>
                  <span className={pillClass(b.status)}>{b.status}</span>
                </div>

                <dl className="card-b__grid">
                  <div><dt>Check-in</dt><dd>{fmtTime(b.checkIn)}</dd><small>{fmtDate(b.checkIn)}</small></div>
                  <div><dt>Duration</dt><dd>{b.durationHours} Hours</dd><small>{b.checkOut ? `Out ${fmtTime(b.checkOut)}` : 'Check-out —'}</small></div>
                  <div><dt>Amount</dt><dd>{inr(b.amount)}</dd><small className={`pay pay--${b.payment}`}>{b.payment}</small></div>
                </dl>

                <div className="card-b__meta">
                  <span>{b.source}</span>
                  <span>Extension: <b>{b.extension}</b></span>
                  <a href={`tel:${b.phone}`} className="call" aria-label={`Call ${b.guest}`}><PhoneIcon size={16} />{b.phone}</a>
                </div>

                {left && <div className="timer-bar"><ClockIcon size={16} /> Respond within <b>{left}</b></div>}

                {b.status === 'Pending Approval' && (
                  <div className="actions">
                    <button type="button" className="abtn abtn--ghost" onClick={() => setStatusOf(b.id, 'Cancelled')}>Decline</button>
                    <button type="button" className="abtn abtn--lime" onClick={() => setStatusOf(b.id, 'Confirmed')}>Accept</button>
                  </div>
                )}
                {b.status === 'Confirmed' && (
                  <div className="actions"><button type="button" className="abtn abtn--dark" onClick={() => setStatusOf(b.id, 'Checked In')}>Check in guest</button></div>
                )}
                {b.status === 'Checked In' && (
                  <div className="actions"><button type="button" className="abtn abtn--dark" onClick={() => setStatusOf(b.id, 'Checked Out')}>Check out guest</button></div>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      <BottomNav />

      {sheet && (
        <div className="sheet-wrap">
          <button type="button" className="sheet-scrim" aria-label="Close filters" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="sheet__grab" aria-hidden="true" />
            <header className="sheet__head">
              <h2>Filters</h2>
              <button type="button" className="icon-btn icon-btn--sm" onClick={() => setSheet(false)} aria-label="Close"><CloseIcon /></button>
            </header>

            <div className="sheet__body">
              <fieldset>
                <legend>Check-in date</legend>
                <div className="dates">
                  <label>From<input type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></label>
                  <label>To<input type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Duration</legend>
                <div className="opts">
                  {[['all', 'All'], ['3', '3 Hours'], ['6', '6 Hours'], ['12', '12 Hours']].map(([v, l]) => (
                    <button key={v} type="button" aria-pressed={draft.duration === v} className={`opt${draft.duration === v ? ' is-on' : ''}`} onClick={() => setDraft({ ...draft, duration: v })}>{l}</button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Payment status</legend>
                <div className="opts">
                  {[['all', 'All'], ['paid', 'Paid'], ['pending', 'Pending'], ['refunded', 'Refunded'], ['failed', 'Failed']].map(([v, l]) => (
                    <button key={v} type="button" aria-pressed={draft.payment === v} className={`opt${draft.payment === v ? ' is-on' : ''}`} onClick={() => setDraft({ ...draft, payment: v })}>{l}</button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Booking status</legend>
                <div className="opts">
                  {['all', ...STATUSES].map((v) => (
                    <button key={v} type="button" aria-pressed={draft.status === v} className={`opt${draft.status === v ? ' is-on' : ''}`} onClick={() => setDraft({ ...draft, status: v })}>{v === 'all' ? 'All' : v}</button>
                  ))}
                </div>
              </fieldset>
            </div>

            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={reset}>Reset</button>
              <button type="button" className="abtn abtn--lime" onClick={apply}>Show results</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
