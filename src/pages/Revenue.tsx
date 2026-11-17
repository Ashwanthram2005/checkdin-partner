import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { ArrowUpIcon, BankIcon, ChartBarIcon, ChevronDown, InfoIcon, TableIcon } from '../components/Icons';
import { PLATFORM_FEE_TOTAL } from '../data/pricing';
import { BANK, addDays, payouts, range, sum, type DayStat, type Payout } from '../data/revenue';
import '../styles/bookings.css';
import '../styles/revenue.css';

type Period = '7' | '30' | 'month';
const PERIODS: { id: Period; label: string }[] = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
];

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtDay = (key: string, o: Intl.DateTimeFormatOptions) => new Date(key + 'T00:00').toLocaleDateString('en-GB', o);
const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Smallest "clean" ceiling whose quarter steps are round numbers. */
function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const m = [1, 1.2, 1.6, 2, 3, 4, 6, 8, 10].find((x) => x >= n) ?? 10;
  return m * p;
}
const tickLabel = (v: number, compact: boolean) =>
  compact && v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : v.toLocaleString('en-IN');

export default function Revenue() {
  const [period, setPeriod] = useState<Period>('7');
  const [active, setActive] = useState(-1); // index into days; -1 = latest
  const [asTable, setAsTable] = useState(false);

  const today = useMemo(() => new Date(), []);
  const { days, prevNet, count } = useMemo(() => {
    const n = period === '7' ? 7 : period === '30' ? 30 : today.getDate();
    const from = addDays(today, -(n - 1));
    return {
      days: range(from, today),
      prevNet: sum(range(addDays(from, -n), addDays(from, -1))).net,
      count: n,
    };
  }, [period, today]);

  useEffect(() => setActive(-1), [period]);

  const totals = useMemo(() => sum(days), [days]);
  const idx = active < 0 ? days.length - 1 : active;
  const sel = days[idx];
  const delta = prevNet > 0 ? Math.round(((totals.net - prevNet) / prevNet) * 100) : null;

  const yMax = niceMax(Math.max(...days.map((d) => d.net)));
  const ticks = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);
  const compact = yMax >= 10000;

  const shares = [
    { key: 'net', name: 'You keep', note: 'Net earnings', value: totals.net, strong: true },
    { key: 'gst', name: 'GST collected', note: 'Passed on to the government', value: totals.gst, strong: false },
    { key: 'fee', name: 'Platform fee', note: `${inr(PLATFORM_FEE_TOTAL)} × ${totals.bookings} bookings`, value: totals.fee, strong: false },
  ].sort((a, b) => b.value - a.value);

  const plist = useMemo(() => payouts(today), [today]);
  const upcoming = [...plist].reverse().find((p) => p.status !== 'Paid');
  const weekStart = addDays(today, -((today.getDay() + 6) % 7));
  const accruing = useMemo(() => sum(range(weekStart, today)), [weekStart, today]);

  function onKey(e: React.KeyboardEvent) {
    const move = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -999 : e.key === 'End' ? 999 : 0;
    if (!move) return;
    e.preventDefault();
    const next = Math.min(days.length - 1, Math.max(0, idx + move));
    setActive(next);
    (e.currentTarget.querySelectorAll('button')[next] as HTMLElement | undefined)?.focus();
  }

  return (
    <div className="app">
      <main className="bk rv">
        <header className="bk__bar">
          <div>
            <h1>Revenue</h1>
            <p>Earnings after the platform fee</p>
          </div>
        </header>

        <nav className="chips" role="tablist" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={period === p.id} className={`chip${period === p.id ? ' is-active' : ''}`} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>

        <section className="hero" aria-label="Net earnings">
          <p className="hero__label">Net earnings</p>
          <p className="hero__value">{inr(totals.net)}</p>
          <p className="hero__meta">
            {delta !== null && (
              <span className={`delta delta--${delta >= 0 ? 'up' : 'down'}`}>
                <ArrowUpIcon size={14} />{delta >= 0 ? 'Up' : 'Down'} {Math.abs(delta)}%
              </span>
            )}
            <span>vs previous {count} days</span>
          </p>
          <p className="hero__sub">{totals.bookings} bookings · {fmtDate(days[0] ? new Date(days[0].date + 'T00:00') : today)} – {fmtDate(today)}</p>
        </section>

        <section className="panel" aria-label="Daily earnings">
          <div className="panel__head">
            <div>
              <h2>Daily earnings</h2>
              <p>Net of the platform fee</p>
            </div>
            <button type="button" className="mini-btn" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
              {asTable ? <ChartBarIcon /> : <TableIcon />}{asTable ? 'Chart' : 'Table'}
            </button>
          </div>

          {!asTable ? (
            <>
              <div className="readout" aria-live="polite">
                <strong>{inr(sel.net)}</strong>
                <span>{fmtDay(sel.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {sel.bookings} bookings</span>
              </div>

              <div className="plot">
                <div className="plot__y" aria-hidden="true">
                  {ticks.map((t) => <span key={t} style={{ bottom: `${(t / yMax) * 100}%` }}>{tickLabel(t, compact)}</span>)}
                </div>
                <div className="plot__area">
                  {ticks.map((t) => <i key={t} className="plot__grid" style={{ bottom: `${(t / yMax) * 100}%` }} aria-hidden="true" />)}
                  <div className="plot__bars" role="group" aria-label="Net earnings per day. Use the left and right arrow keys to move between days." onKeyDown={onKey}>
                    {days.map((d: DayStat, i) => (
                      <button
                        key={d.date} type="button" className={`col${i === idx ? ' is-active' : ''}`}
                        tabIndex={i === idx ? 0 : -1}
                        aria-label={`${fmtDay(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}: ${inr(d.net)} from ${d.bookings} bookings`}
                        aria-pressed={i === idx}
                        onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                        onClick={() => setActive(i)}
                        onFocus={() => setActive(i)}
                      >
                        <span className="bar" style={{ height: `${Math.max(1.5, (d.net / yMax) * 100)}%` }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="plot__x" aria-hidden="true">
                {days.map((d, i) => {
                  const show = days.length <= 7 ? true : (days.length - 1 - i) % 5 === 0;
                  return <span key={d.date}>{show ? (days.length <= 7 ? fmtDay(d.date, { weekday: 'short' }) : fmtDay(d.date, { day: 'numeric' })) : ''}</span>;
                })}
              </div>
            </>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Date</th><th className="r">Bookings</th><th className="r">Net earnings</th></tr></thead>
                <tbody>
                  {[...days].reverse().map((d) => (
                    <tr key={d.date}><td>{fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td className="r">{d.bookings}</td><td className="r">{inr(d.net)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td>Total</td><td className="r">{totals.bookings}</td><td className="r">{inr(totals.net)}</td></tr></tfoot>
              </table>
            </div>
          )}
        </section>

        <section className="panel" aria-label="Where guest payments go">
          <div className="panel__head">
            <div>
              <h2>Where guest payments go</h2>
              <p>Guests paid {inr(totals.guestPaid)} in total</p>
            </div>
          </div>
          <ul className="shares">
            {shares.map((s) => (
              <li key={s.key}>
                <div className="share__row">
                  <span className="share__name"><strong>{s.name}</strong><small>{s.note}</small></span>
                  <span className="share__amt"><strong>{inr(s.value)}</strong><small>{Math.round((s.value / totals.guestPaid) * 100)}%</small></span>
                </div>
                <div className="meter" role="img" aria-label={`${s.name}: ${Math.round((s.value / totals.guestPaid) * 100)}% of guest payments`}>
                  <span className={`meter__fill${s.strong ? ' is-strong' : ''}`} style={{ width: `${(s.value / totals.guestPaid) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="note"><InfoIcon /> No commission. Checkdin charges ₹79 + 18% GST per booking.</p>
        </section>

        <h2 className="section-title">Payouts</h2>

        <section className="payout-next" aria-label="Next payout">
          <div className="payout-next__top">
            <span className="bank-ico"><BankIcon /></span>
            <div>
              <p className="payout-next__label">Next payout</p>
              <p className="payout-next__date">{upcoming ? upcoming.payoutDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}</p>
            </div>
          </div>
          <p className="payout-next__amt">{upcoming ? inr(upcoming.totals.net) : '₹0'}</p>
          <p className="payout-next__sub">
            {upcoming ? `For ${fmtDate(upcoming.from)} – ${fmtDate(upcoming.to)} · ${upcoming.totals.bookings} bookings` : 'Nothing scheduled'}
          </p>
          <div className="payout-next__foot">
            <span>To {BANK.name} ••{BANK.last4}</span>
            <span>This week so far: <b>{inr(accruing.net)}</b></span>
          </div>
        </section>

        <ul className="plist">
          {plist.map((p: Payout) => (
            <li key={p.id}>
              <details>
                <summary>
                  <span className="plist__main">
                    <strong>{fmtDate(p.from)} – {fmtDate(p.to)}</strong>
                    <small>{p.status === 'Paid' ? 'Paid' : p.status === 'Processing' ? 'Processing today' : 'Pays'} {fmtDate(p.payoutDate)}</small>
                  </span>
                  <span className="plist__amt"><strong>{inr(p.totals.net)}</strong><span className={`pill pill--${p.status.toLowerCase()}`}>{p.status}</span></span>
                  <ChevronDown size={18} />
                </summary>
                <dl className="plist__detail">
                  <div><dt>Bookings</dt><dd>{p.totals.bookings}</dd></div>
                  <div><dt>Slot revenue</dt><dd>{inr(p.totals.slotRevenue)}</dd></div>
                  <div><dt>Platform fee</dt><dd>−{inr(p.totals.fee)}</dd></div>
                  <div className="total"><dt>Net payout</dt><dd>{inr(p.totals.net)}</dd></div>
                  {p.utr && <div><dt>Bank reference</dt><dd className="mono">{p.utr}</dd></div>}
                </dl>
              </details>
            </li>
          ))}
        </ul>
        <p className="note"><InfoIcon /> Earnings from Monday to Sunday are paid out the following Wednesday.</p>
      </main>
      <BottomNav />
    </div>
  );
}
