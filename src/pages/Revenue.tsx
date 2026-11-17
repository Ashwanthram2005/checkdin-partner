import { useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import PayoutRequest from '../components/PayoutRequest';
import { AlertIcon, ArrowUpIcon, BankIcon, ChartBarIcon, InfoIcon, TableIcon } from '../components/Icons';
import { getBookings, getPayouts, getPropertySettings } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { addDays, fmtDate, fmtDayMonth, inr } from '../lib/format';
import { dayStats, niceMax, sum, tickLabel } from '../lib/stats';
import { PLATFORM_FEE_TEXT, stayNet } from '../lib/fees';
import '../styles/bookings.css';
import '../styles/revenue.css';

type Period = '7' | '30' | 'month';
const PERIODS: { id: Period; label: string }[] = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
];

export default function Revenue() {
  const { session, role } = useAuth();
  const [payoutOpen, setPayoutOpen] = useState(false);
  const isOwner = role?.id === 'prole1';
  const books = useApi(getBookings);
  const payouts = useApi(getPayouts);
  const settings = useApi(() => getPropertySettings(session?.hotelId ?? ''), [session?.hotelId]);
  const [period, setPeriod] = useState<Period>('7');
  const [active, setActive] = useState(-1);
  const [asTable, setAsTable] = useState(false);

  const today = useMemo(() => new Date(), []);
  const { days, prevNet, count } = useMemo(() => {
    const n = period === '7' ? 7 : period === '30' ? 30 : today.getDate();
    const from = addDays(today, -(n - 1));
    const all = books.data ?? [];
    return { days: dayStats(all, from, today), prevNet: sum(dayStats(all, addDays(from, -n), addDays(from, -1))).net, count: n };
  }, [books.data, period, today]);

  const totals = useMemo(() => sum(days), [days]);
  const idx = active < 0 ? days.length - 1 : Math.min(active, days.length - 1);
  const sel = days[idx];
  const delta = prevNet > 0 ? Math.round(((totals.net - prevNet) / prevNet) * 100) : null;
  const yMax = niceMax(Math.max(...days.map((d) => d.net)));
  const ticks = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);

  const upcoming = (books.data ?? []).filter((b) => (b.status === 'Confirmed' || b.status === 'Upcoming') && b.checkIn && b.checkIn >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const upcomingNet = upcoming.reduce((t, b) => t + stayNet(b.base), 0);

  // where the slot price (with GST) goes. Extension charges carry no platform fee and are kept in full.
  const whole = totals.net + totals.fee + totals.tax;
  const shares = [
    { key: 'net', name: 'You keep', note: totals.ext > 0 ? `Includes ${inr(totals.ext)} from extensions` : 'Slot price minus platform fee', value: totals.net, strong: true },
    { key: 'gst', name: 'GST collected', note: 'Passed on to the government', value: totals.tax, strong: false },
    { key: 'fee', name: 'Platform fee', note: `${PLATFORM_FEE_TEXT} × ${totals.bookings} ${totals.bookings === 1 ? 'stay' : 'stays'}`, value: totals.fee, strong: false },
  ].sort((a, b) => b.value - a.value);

  const bank = settings.data?.banking;
  const bankReady = !!bank && bank.status.toLowerCase() !== 'pending' && !!bank.accountLast4;

  function onKey(e: React.KeyboardEvent) {
    const move = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -999 : e.key === 'End' ? 999 : 0;
    if (!move) return;
    e.preventDefault();
    const next = Math.min(days.length - 1, Math.max(0, idx + move));
    setActive(next);
    (e.currentTarget.querySelectorAll('button')[next] as HTMLElement | undefined)?.focus();
  }
  const empty = !!books.data && totals.bookings === 0;

  return (
    <div className="app">
      <main className="bk rv">
        <header className="bk__bar"><div><h1>Revenue</h1><p>Earnings after the platform fee</p></div></header>

        {(books.error || payouts.error) && <div className="alert" role="alert"><AlertIcon /> {books.error ?? payouts.error} <button type="button" className="link-btn" onClick={() => { books.reload(); payouts.reload(); }}>Retry</button></div>}

        <nav className="chips" role="tablist" aria-label="Period">
          {PERIODS.map((p) => <button key={p.id} type="button" role="tab" aria-selected={period === p.id} className={`chip${period === p.id ? ' is-active' : ''}`} onClick={() => { setPeriod(p.id); setActive(-1); }}>{p.label}</button>)}
        </nav>

        <section className="hero" aria-label="Net earnings">
          <p className="hero__label">Net earnings</p>
          <p className="hero__value">{books.loading && !books.data ? '…' : inr(totals.net)}</p>
          <p className="hero__meta">
            {delta !== null && <span className={`delta delta--${delta >= 0 ? 'up' : 'down'}`}><ArrowUpIcon size={14} />{delta >= 0 ? 'Up' : 'Down'} {Math.abs(delta)}%</span>}
            <span>{delta !== null ? `vs previous ${count} days` : 'From stays that checked in or finished'}</span>
          </p>
          <p className="hero__sub">{totals.bookings} {totals.bookings === 1 ? 'stay' : 'stays'} · {fmtDayMonth(new Date(days[0].date + 'T00:00'))} – {fmtDayMonth(today)}{upcoming.length > 0 ? ` · ${inr(upcomingNet)} more booked ahead` : ''}</p>
        </section>

        <section className="panel" aria-label="Daily earnings">
          <div className="panel__head">
            <div><h2>Daily earnings</h2><p>Net of the platform fee</p></div>
            <button type="button" className="mini-btn" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? <ChartBarIcon /> : <TableIcon />}{asTable ? 'Chart' : 'Table'}</button>
          </div>

          {empty ? <p className="muted-note">No earnings in this period yet. Stays that check in or finish will appear here.</p> : !asTable ? (
            <>
              <div className="readout" aria-live="polite">
                <strong>{inr(sel.net)}</strong>
                <span>{fmtDate(new Date(sel.date + 'T00:00'))} · {sel.bookings} {sel.bookings === 1 ? 'stay' : 'stays'}</span>
              </div>
              <div className="plot">
                <div className="plot__y" aria-hidden="true">{ticks.map((t) => <span key={t} style={{ bottom: `${(t / yMax) * 100}%` }}>{tickLabel(t, yMax >= 10000)}</span>)}</div>
                <div className="plot__area">
                  {ticks.map((t) => <i key={t} className="plot__grid" style={{ bottom: `${(t / yMax) * 100}%` }} aria-hidden="true" />)}
                  <div className="plot__bars" role="group" aria-label="Net earnings per day. Use the left and right arrow keys to move between days." onKeyDown={onKey}>
                    {days.map((d, i) => (
                      <button key={d.date} type="button" className={`col${i === idx ? ' is-active' : ''}`} tabIndex={i === idx ? 0 : -1}
                        aria-label={`${new Date(d.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}: ${inr(d.net)} from ${d.bookings} stays`}
                        aria-pressed={i === idx} onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)} onClick={() => setActive(i)} onFocus={() => setActive(i)}>
                        <span className="bar" style={{ height: `${Math.max(d.net > 0 ? 1.5 : 0, (d.net / yMax) * 100)}%` }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="plot__x" aria-hidden="true">
                {days.map((d, i) => {
                  const show = days.length <= 7 ? true : (days.length - 1 - i) % 5 === 0;
                  const dt = new Date(d.date + 'T00:00');
                  return <span key={d.date}>{show ? (days.length <= 7 ? dt.toLocaleDateString('en-GB', { weekday: 'short' }) : dt.getDate()) : ''}</span>;
                })}
              </div>
            </>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Date</th><th className="r">Stays</th><th className="r">Net</th></tr></thead>
                <tbody>{[...days].reverse().map((d) => <tr key={d.date}><td>{fmtDate(new Date(d.date + 'T00:00'))}</td><td className="r">{d.bookings}</td><td className="r">{inr(d.net)}</td></tr>)}</tbody>
                <tfoot><tr><td>Total</td><td className="r">{totals.bookings}</td><td className="r">{inr(totals.net)}</td></tr></tfoot>
              </table>
            </div>
          )}
        </section>

        {!empty && whole > 0 && (
          <section className="panel" aria-label="Where guest payments go">
            <div className="panel__head"><div><h2>Where the money goes</h2><p>{inr(whole)} in total, with GST</p></div></div>
            <ul className="shares">
              {shares.map((s) => (
                <li key={s.key}>
                  <div className="share__row">
                    <span className="share__name"><strong>{s.name}</strong><small>{s.note}</small></span>
                    <span className="share__amt"><strong>{inr(s.value)}</strong><small>{Math.round((s.value / whole) * 100)}%</small></span>
                  </div>
                  <div className="meter" role="img" aria-label={`${s.name}: ${Math.round((s.value / whole) * 100)}% of guest payments`}>
                    <span className={`meter__fill${s.strong ? ' is-strong' : ''}`} style={{ width: `${Math.min(100, (s.value / whole) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="note"><InfoIcon /><span>Estimates from your bookings. The platform fee is {PLATFORM_FEE_TEXT} per stay; extension charges carry no platform fee. Final amounts are confirmed when a payout is settled.</span></p>
          </section>
        )}

        <h2 className="section-title">Payouts</h2>

        <section className="payout-next" aria-label="Bank account">
          <div className="payout-next__top">
            <span className="bank-ico"><BankIcon /></span>
            <div>
              <p className="payout-next__label">Payout account</p>
              <p className="payout-next__date">{settings.loading && !settings.data ? 'Checking…' : bankReady ? `${bank!.bankName} ••${bank!.accountLast4}` : 'Bank account not verified yet'}</p>
            </div>
          </div>
          <p className="payout-next__sub">
            {bankReady ? `Status: ${bank!.status}` : 'Add and verify your bank details on the partner portal (partner.checkdin.in → Settings) so payouts can reach you.'}
          </p>
          {bank && <div className="payout-next__foot"><span>PAN: <b>{bank.panStatus || '—'}</b></span><span>GST: <b>{bank.gstStatus || '—'}</b></span></div>}
          {isOwner && bankReady && <button type="button" className="abtn abtn--dark payout-btn" onClick={() => setPayoutOpen(true)}>Request payout</button>}
          {!isOwner && <p className="payout-next__sub">Only the property owner can request a payout.</p>}
        </section>

        {payouts.loading && !payouts.data && <p className="muted-note">Loading payouts…</p>}
        {payouts.data && payouts.data.length === 0 && <p className="muted-note">No payouts yet. They appear here once your first stays are settled.</p>}
        <ul className="plist">
          {(payouts.data ?? []).map((p) => (
            <li key={p.id}>
              <div className="plist__row">
                <span className="plist__main"><strong>{p.label}</strong><small>{p.date ? fmtDate(p.date) : ''}{p.reference ? ` · ${p.reference}` : ''}</small></span>
                <span className="plist__amt"><strong>{inr(p.amount)}</strong>{p.status && <span className={`pill pill--${p.status.toLowerCase().replace(/\s+/g, '-')}`}>{p.status}</span>}</span>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
      {payoutOpen && bank && <PayoutRequest account={`${bank.bankName} ••${bank.accountLast4}`} onClose={() => setPayoutOpen(false)} onDone={() => { setPayoutOpen(false); payouts.reload(); }} />}
    </div>
  );
}
