import { useMemo, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, DownloadIcon, InfoIcon } from '../components/Icons';
import { getBookings, type Booking, type BookingStatus } from '../api/partner';
import { useApi } from '../api/useApi';
import { addDays, dayKey, fmtDate, inr } from '../lib/format';
import { dayStats, forecastMonth, sum } from '../lib/stats';
import { PLATFORM_FEE_TEXT } from '../lib/fees';
import '../styles/revenue.css';

type Period = '7' | '30' | '90';
type View = 'revenue' | 'bookings' | 'durations' | 'guests' | 'forecast';
const VIEWS: { id: View; label: string }[] = [
  { id: 'revenue', label: 'Revenue' }, { id: 'bookings', label: 'Bookings' }, { id: 'durations', label: 'Stay lengths' }, { id: 'guests', label: 'Guests' }, { id: 'forecast', label: 'Forecast' },
];
const PERIODS: { id: Period; label: string }[] = [{ id: '7', label: 'Last 7 days' }, { id: '30', label: 'Last 30 days' }, { id: '90', label: 'Last 90 days' }];
const STATUSES: BookingStatus[] = ['Upcoming', 'Confirmed', 'Checked in', 'Completed', 'Cancelled', 'Expired', 'No show'];

const download = (name: string, headers: string[], rows: (string | number)[][]) => {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

const CONF_TEXT = {
  none: 'Not enough data yet. Once a few stays are done, this will fill in.',
  low: 'Low confidence: based on very few stays. Treat it as a rough guide.',
  medium: 'Medium confidence: based on your recent stays.',
  high: 'Good confidence: based on a month of steady stays.',
} as const;

export default function Reports() {
  const { data, error, loading, reload } = useApi(getBookings);
  const [view, setView] = useState<View>('revenue');
  const [period, setPeriod] = useState<Period>('30');
  const today = useMemo(() => new Date(), []);
  const n = Number(period);
  const from = addDays(today, -(n - 1));
  const all = data ?? [];

  const inRange = useMemo(() => all.filter((b) => b.checkIn && dayKey(b.checkIn) >= dayKey(from) && dayKey(b.checkIn) <= dayKey(today)), [all, from, today]);
  const days = useMemo(() => dayStats(all, from, today), [all, from, today]);
  const totals = sum(days);

  const byStatus = STATUSES.map((s) => ({ status: s, count: inRange.filter((b) => b.status === s).length })).filter((r) => r.count > 0);
  const durations = useMemo(() => {
    const m = new Map<string, { bookings: number; revenue: number }>();
    for (const b of inRange.filter((x) => x.status === 'Checked in' || x.status === 'Completed')) {
      const r = m.get(b.stayLabel) ?? { bookings: 0, revenue: 0 };
      r.bookings += 1; r.revenue += b.base; m.set(b.stayLabel, r);
    }
    const total = [...m.values()].reduce((t, r) => t + r.bookings, 0);
    return [...m.entries()].map(([label, r]) => ({ label, ...r, share: total ? Math.round((r.bookings / total) * 100) : 0 })).sort((a, b) => b.bookings - a.bookings);
  }, [inRange]);

  const guests = useMemo(() => {
    const m = new Map<string, { name: string; stays: number; spent: number }>();
    for (const b of all.filter((x: Booking) => (x.status === 'Checked in' || x.status === 'Completed') && x.phone)) {
      const r = m.get(b.phone) ?? { name: b.guest, stays: 0, spent: 0 };
      r.stays += 1; r.spent += b.amount; m.set(b.phone, r);
    }
    const list = [...m.values()].sort((a, b) => b.spent - a.spent);
    return { list, repeat: list.filter((g) => g.stays > 1).length, total: list.length };
  }, [all]);

  const fc = useMemo(() => forecastMonth(all, today), [all, today]);

  function exportCsv() {
    const stamp = dayKey(today);
    if (view === 'revenue') download(`revenue-${stamp}.csv`, ['Date', 'Stays', 'Base price', 'Platform fee', 'GST collected', 'Extension revenue', 'Net'], days.map((d) => [d.date, d.bookings, d.base, Math.round(d.fee * 100) / 100, d.tax, d.ext, Math.round(d.net * 100) / 100]));
    if (view === 'bookings') download(`bookings-${stamp}.csv`, ['Reference', 'Guest', 'Check-in', 'Stay', 'Amount', 'Status'], inRange.map((b) => [b.reference, b.guest, b.checkIn ? dayKey(b.checkIn) : '', b.stayLabel, b.amount, b.status]));
    if (view === 'durations') download(`stay-lengths-${stamp}.csv`, ['Stay', 'Bookings', 'Revenue', 'Share %'], durations.map((d) => [d.label, d.bookings, d.revenue, d.share]));
    if (view === 'guests') download(`guests-${stamp}.csv`, ['Guest', 'Stays', 'Spent'], guests.list.map((g) => [g.name, g.stays, g.spent]));
    if (view === 'forecast') download(`forecast-${stamp}.csv`, ['Item', 'Amount'], [['Earned so far', fc.earnedSoFar], ['Booked ahead', fc.bookedAhead], ['Expected rest', Math.round(fc.expectedRest)], ['Expected month total', Math.round(fc.expectedTotal)]]);
  }

  return (
    <SubPage title="Reports" subtitle="Worked out from your bookings" action={<button type="button" className="icon-btn" onClick={exportCsv} aria-label="Export CSV" disabled={!data}><DownloadIcon /></button>}>
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}

      <nav className="chips" role="tablist" aria-label="Report">
        {VIEWS.map((v) => <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={`chip${view === v.id ? ' is-active' : ''}`} onClick={() => setView(v.id)}>{v.label}</button>)}
      </nav>
      {view !== 'forecast' && view !== 'guests' && (
        <nav className="chips" role="tablist" aria-label="Period">
          {PERIODS.map((p) => <button key={p.id} type="button" role="tab" aria-selected={period === p.id} className={`chip${period === p.id ? ' is-active' : ''}`} onClick={() => setPeriod(p.id)}>{p.label}</button>)}
        </nav>
      )}
      {loading && !data && <p className="muted-note">Loading…</p>}

      {data && view === 'revenue' && (
        <section className="panel">
          <div className="panel__head"><div><h2>Revenue</h2><p>{fmtDate(from)} – {fmtDate(today)}</p></div></div>
          <dl className="kv">
            <div><dt>Net earnings</dt><dd className="big">{inr(totals.net)}</dd></div>
            <div><dt>Stays</dt><dd>{totals.bookings}</dd></div>
            <div><dt>Slot revenue (base)</dt><dd>{inr(totals.base)}</dd></div>
            <div><dt>Platform fee</dt><dd>−{inr(totals.fee)}</dd></div>
            <div><dt>GST collected</dt><dd>{inr(totals.tax)}</dd></div>
            <div><dt>Extension revenue</dt><dd>{inr(totals.ext)}</dd></div>
          </dl>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Date</th><th className="r">Stays</th><th className="r">Net</th></tr></thead>
            <tbody>{[...days].reverse().filter((d) => d.bookings > 0).map((d) => <tr key={d.date}><td>{fmtDate(new Date(d.date + 'T00:00'))}</td><td className="r">{d.bookings}</td><td className="r">{inr(d.net)}</td></tr>)}</tbody></table></div>
          {totals.bookings === 0 && <p className="muted-note">No completed stays in this period yet.</p>}
          <p className="note"><InfoIcon /><span>Platform fee: {PLATFORM_FEE_TEXT} per stay. Extension charges carry no platform fee.</span></p>
        </section>
      )}

      {data && view === 'bookings' && (
        <section className="panel">
          <div className="panel__head"><div><h2>Bookings</h2><p>{inRange.length} in this period</p></div></div>
          {byStatus.length === 0 ? <p className="muted-note">No bookings in this period.</p> : (
            <ul className="shares">{byStatus.map((r) => (
              <li key={r.status}><div className="share__row"><span className="share__name"><strong>{r.status}</strong></span><span className="share__amt"><strong>{r.count}</strong><small>{Math.round((r.count / inRange.length) * 100)}%</small></span></div>
                <div className="meter" role="img" aria-label={`${r.status}: ${r.count} of ${inRange.length}`}><span className={`meter__fill${r.status === 'Completed' || r.status === 'Checked in' ? ' is-strong' : ''}`} style={{ width: `${(r.count / inRange.length) * 100}%` }} /></div></li>
            ))}</ul>
          )}
        </section>
      )}

      {data && view === 'durations' && (
        <section className="panel">
          <div className="panel__head"><div><h2>Stay lengths</h2><p>Which slots earn the most (finished stays)</p></div></div>
          {durations.length === 0 ? <p className="muted-note">No finished stays in this period yet.</p> : (
            <ul className="shares">{durations.map((d) => (
              <li key={d.label}><div className="share__row"><span className="share__name"><strong>{d.label}</strong><small>{d.bookings} {d.bookings === 1 ? 'stay' : 'stays'}</small></span><span className="share__amt"><strong>{inr(d.revenue)}</strong><small>{d.share}% of stays</small></span></div>
                <div className="meter" role="img" aria-label={`${d.label}: ${d.share}% of stays`}><span className="meter__fill is-strong" style={{ width: `${d.share}%` }} /></div></li>
            ))}</ul>
          )}
        </section>
      )}

      {data && view === 'guests' && (
        <section className="panel">
          <div className="panel__head"><div><h2>Guests</h2><p>From all finished stays</p></div></div>
          <dl className="kv"><div><dt>Guests</dt><dd className="big">{guests.total}</dd></div><div><dt>Came back</dt><dd>{guests.repeat}</dd></div></dl>
          {guests.list.length === 0 ? <p className="muted-note">No finished stays yet.</p> : (
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Guest</th><th className="r">Stays</th><th className="r">Spent</th></tr></thead>
              <tbody>{guests.list.slice(0, 20).map((g, i) => <tr key={i}><td>{g.name}</td><td className="r">{g.stays}</td><td className="r">{inr(g.spent)}</td></tr>)}</tbody></table></div>
          )}
        </section>
      )}

      {data && view === 'forecast' && (
        <section className="panel">
          <div className="panel__head"><div><h2>This month’s forecast</h2><p>{fc.daysLeft} {fc.daysLeft === 1 ? 'day' : 'days'} left</p></div></div>
          <p className="hero__value fc__value">{fc.confidence === 'none' ? '—' : inr(fc.expectedTotal)}</p>
          <p className="muted-note">{fc.confidence === 'none' ? 'Expected net earnings this month' : 'Expected net earnings this month (estimate)'}</p>
          <dl className="kv">
            <div><dt>Earned so far</dt><dd>{inr(fc.earnedSoFar)}</dd></div>
            <div><dt>Already booked ahead</dt><dd>{inr(fc.bookedAhead)}</dd></div>
            <div><dt>Expected from the rest</dt><dd>{fc.confidence === 'none' ? '—' : inr(fc.expectedRest)}</dd></div>
            <div><dt>Recent daily average</dt><dd>{inr(fc.avgPerDay)}</dd></div>
          </dl>
          <p className="note"><InfoIcon /><span>{CONF_TEXT[fc.confidence]} It adds what you’ve earned, stays already booked, and your last 14 days’ average for days with no bookings.</span></p>
        </section>
      )}
    </SubPage>
  );
}
