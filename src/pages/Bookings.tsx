import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import CheckInSheet from '../components/CheckInSheet';
import {
  AlertIcon, ClockIcon, CloseIcon, DownloadIcon, FilterIcon, PhoneIcon, SearchIcon,
} from '../components/Icons';
import { getBookings, type Booking, type BookingStatus } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { dayKey, fmtDate, fmtTime, initials, inr } from '../lib/format';
import '../styles/bookings.css';

type Tab = 'All' | BookingStatus;
const TABS: Tab[] = ['All', 'Upcoming', 'Confirmed', 'Checked in', 'Completed', 'Cancelled'];
const EXTRA_TABS: BookingStatus[] = ['Expired', 'No show'];

interface Filters { from: string; to: string; stay: string; payment: string }
const NO_FILTERS: Filters = { from: '', to: '', stay: 'all', payment: 'all' };

const pillClass = (s: BookingStatus) => 'pill pill--' + s.toLowerCase().replace(/\s+/g, '-');

function toCsv(rows: Booking[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Reference', 'Guest', 'Phone', 'Check-in', 'Stay', 'Amount', 'Payment', 'Status'];
  const body = rows.map((b) => [b.reference, b.guest, b.phone, b.checkIn ? `${dayKey(b.checkIn)} ${fmtTime(b.checkIn)}` : '', b.stayLabel, b.amount, b.paymentStatus, b.status].map(esc).join(','));
  return [head.map(esc).join(','), ...body].join('\n');
}

export default function Bookings() {
  const { can } = useAuth();
  const { data, error, loading, reload } = useApi(getBookings);
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [checkIn, setCheckIn] = useState<Booking | null>(null);

  const all = useMemo(() => [...(data ?? [])].sort((a, b) => (b.checkIn?.getTime() ?? 0) - (a.checkIn?.getTime() ?? 0)), [data]);
  const count = (s: BookingStatus) => all.filter((b) => b.status === s).length;
  const tabs: Tab[] = [...TABS, ...EXTRA_TABS.filter((s) => count(s) > 0)];
  const activeFilters = (Object.keys(NO_FILTERS) as (keyof Filters)[]).filter((k) => filters[k] !== NO_FILTERS[k]).length;
  const stayOptions = useMemo(() => [...new Set(all.map((b) => b.stayLabel))].filter((s) => s !== '—'), [all]);
  const payOptions = useMemo(() => [...new Set(all.map((b) => b.paymentStatus).filter(Boolean))], [all]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const digits = q.replace(/\D/g, '');
    return all.filter((b) => {
      const day = b.checkIn ? dayKey(b.checkIn) : '';
      if (tab !== 'All' && b.status !== tab) return false;
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      if (filters.stay !== 'all' && b.stayLabel !== filters.stay) return false;
      if (filters.payment !== 'all' && b.paymentStatus !== filters.payment) return false;
      if (q && !(b.reference.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.guest.toLowerCase().includes(q) || (digits && b.phone.includes(digits)))) return false;
      return true;
    });
  }, [all, tab, query, filters]);

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `bookings-${dayKey(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const apply = () => { setFilters(draft); setSheet(false); };
  const reset = () => { setDraft(NO_FILTERS); setFilters(NO_FILTERS); setSheet(false); };
  const canCheckIn = can('checkin') || can('bookings');

  return (
    <div className="app">
      <main className="bk">
        <header className="bk__bar">
          <div>
            <h1>Bookings</h1>
            <p>{loading && !data ? 'Loading…' : `${all.length} ${all.length === 1 ? 'booking' : 'bookings'} in total`}</p>
          </div>
          <button type="button" className="icon-btn" onClick={exportCsv} aria-label="Export CSV" disabled={!rows.length}><DownloadIcon /></button>
        </header>

        {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}

        <div className="search">
          <label className="search__box">
            <SearchIcon />
            <input type="search" placeholder="Reference, guest or phone" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search bookings" />
          </label>
          <button type="button" className="icon-btn icon-btn--filter" onClick={() => { setDraft(filters); setSheet(true); }} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`}>
            <FilterIcon />{activeFilters > 0 && <span className="badge">{activeFilters}</span>}
          </button>
        </div>

        <nav className="chips" role="tablist" aria-label="Booking status">
          {tabs.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`chip${tab === t ? ' is-active' : ''}`} onClick={() => setTab(t)}>
              {t}<span className="chip__count">{t === 'All' ? all.length : count(t)}</span>
            </button>
          ))}
        </nav>

        <p className="result-count"><b>{rows.length}</b> {rows.length === 1 ? 'booking matches' : 'bookings match'} the current filters</p>

        <ul className="cards">
          {loading && !data && <li className="empty"><span className="spinner spinner--dark" aria-hidden="true" /><strong>Loading bookings…</strong></li>}
          {data && rows.length === 0 && (
            <li className="empty">
              <SearchIcon size={28} />
              <strong>{all.length === 0 ? 'No bookings yet' : 'No bookings found'}</strong>
              <span>{all.length === 0 ? 'New bookings from guests will show up here.' : 'Try a different search or clear the filters.'}</span>
              {all.length > 0 && (activeFilters > 0 || query || tab !== 'All') && (
                <button type="button" className="abtn-clear" onClick={() => { setQuery(''); setTab('All'); setFilters(NO_FILTERS); }}>Clear all</button>
              )}
            </li>
          )}
          {rows.map((b) => {
            const ext = b.extension;
            const ready = b.status === 'Confirmed' || b.status === 'Upcoming';
            return (
              <li key={b.id} className="card-b">
                <div className="card-b__top">
                  <span className="avatar">{initials(b.guest)}</span>
                  <div className="card-b__who"><strong>{b.guest}</strong><small>#{b.reference}</small></div>
                  <span className={pillClass(b.status)}>{b.status}</span>
                </div>

                <dl className="card-b__grid">
                  <div><dt>Check-in</dt><dd>{b.checkIn ? fmtTime(b.checkIn) : '—'}</dd><small>{b.checkIn ? fmtDate(b.checkIn) : ''}</small></div>
                  <div><dt>Stay</dt><dd>{b.stayLabel}</dd><small>{b.checkOut ? `Out ${fmtTime(b.checkOut)}` : `${b.guests} ${b.guests === 1 ? 'guest' : 'guests'}`}</small></div>
                  <div><dt>Amount</dt><dd>{inr(b.amount)}</dd><small className={`pay pay--${b.paymentStatus.toLowerCase()}`}>{b.paymentStatus || '—'}</small></div>
                </dl>

                <div className="card-b__meta">
                  {b.platformFee > 0 && <span>Platform fee <b>{inr(b.platformFee)}</b></span>}
                  {b.tax > 0 && <span>GST <b>{inr(b.tax)}</b></span>}
                  {b.phone && <a href={`tel:${b.phone}`} className="call" aria-label={`Call ${b.guest}`}><PhoneIcon size={16} />{b.phone}</a>}
                </div>

                {ext && (
                  <div className="timer-bar"><ClockIcon size={16} /> Extension {ext.status.toLowerCase()}: +{ext.extraHours}h · {inr(ext.amount)}</div>
                )}

                {ready && canCheckIn && (
                  <div className="actions"><button type="button" className="abtn abtn--dark" onClick={() => setCheckIn(b)}>Check in guest</button></div>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      <BottomNav />

      {checkIn && <CheckInSheet booking={checkIn} onClose={() => setCheckIn(null)} onDone={() => { setCheckIn(null); reload(); }} />}

      {sheet && (
        <div className="sheet-wrap">
          <button type="button" className="sheet-scrim" aria-label="Close filters" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="sheet__grab" aria-hidden="true" />
            <header className="sheet__head"><h2>Filters</h2>
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
                <legend>Stay length</legend>
                <div className="opts">
                  {['all', ...stayOptions].map((v) => <button key={v} type="button" aria-pressed={draft.stay === v} className={`opt${draft.stay === v ? ' is-on' : ''}`} onClick={() => setDraft({ ...draft, stay: v })}>{v === 'all' ? 'All' : v}</button>)}
                </div>
              </fieldset>
              <fieldset>
                <legend>Payment status</legend>
                <div className="opts">
                  {['all', ...payOptions].map((v) => <button key={v} type="button" aria-pressed={draft.payment === v} className={`opt${draft.payment === v ? ' is-on' : ''}`} onClick={() => setDraft({ ...draft, payment: v })}>{v === 'all' ? 'All' : v}</button>)}
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
