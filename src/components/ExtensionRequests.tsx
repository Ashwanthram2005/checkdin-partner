import { useEffect, useState } from 'react';
import { approveExtension, getExtensions, rejectExtension, type Booking } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { fmtTime, inr, mmss } from '../lib/format';
import { AlertIcon, CheckCircleIcon, ClockIcon, CloseIcon } from './Icons';

const WINDOW_SECONDS = 5 * 60; // guests ask, the hotel has 5 minutes to answer
const REASONS = ['No room available', 'Next guest arriving', 'Room needs cleaning', 'Other'];

const secondsLeft = (b: Booking, now: number) =>
  b.extension?.requestedAt ? Math.max(0, WINDOW_SECONDS - Math.floor((now - b.extension.requestedAt.getTime()) / 1000)) : 0;

/** Guests asking to stay longer. Used on Home and the Extensions screen. */
export default function ExtensionRequests({ onChanged, showHistory = false }: { onChanged?: () => void; showHistory?: boolean }) {
  const { can } = useAuth();
  const allowed = can('bookings');
  const { data, error, loading, reload } = useApi(getExtensions);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(reload, 30000); // the portal re-checks every 30s too
    return () => { clearInterval(t); clearInterval(poll); };
  }, [reload]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [msg]);

  const all = data ?? [];
  const pending = all.filter((b) => b.extension?.status === 'Requested' && secondsLeft(b, now) > 0);
  const history = all.filter((b) => !pending.includes(b));

  async function approve(b: Booking) {
    setBusy(b.id);
    try {
      await approveExtension(b.id);
      setMsg({ ok: true, text: `Extension approved for ${b.guest}.` });
      reload(); onChanged?.();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  }

  async function reject() {
    if (!rejecting) return;
    const text = reason === 'Other' ? note.trim() : reason;
    if (!text) { setMsg({ ok: false, text: 'Please give the guest a reason.' }); return; }
    setBusy(rejecting.id);
    try {
      await rejectExtension(rejecting.id, text);
      setMsg({ ok: true, text: `Extension declined for ${rejecting.guest}.` });
      setRejecting(null); setNote(''); setReason(REASONS[0]);
      reload(); onChanged?.();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  }

  return (
    <section className="panel ext" aria-label="Stay extension requests">
      <div className="panel__head">
        <div>
          <h2>Extension requests</h2>
          <p>Guests asking to stay longer. Answer within 5 minutes.</p>
        </div>
        {pending.length > 0 && <span className="count-badge">{pending.length}</span>}
      </div>

      {msg && <div className={msg.ok ? 'notice notice--ok' : 'alert'} role="status">{msg.ok ? <CheckCircleIcon size={18} /> : <AlertIcon />} {msg.text}</div>}
      {error && !data && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      {loading && !data && <p className="muted-note">Loading…</p>}

      {data && pending.length === 0 && <p className="muted-note">No extension requests right now.</p>}

      <ul className="ext__list">
        {pending.map((b) => {
          const left = secondsLeft(b, now);
          const e = b.extension!;
          return (
            <li key={b.id} className="ext__item">
              <div className="ext__top">
                <strong>{b.guest}</strong>
                <span className={`ext__timer${left < 60 ? ' is-low' : ''}`}><ClockIcon size={14} /> {mmss(left)}</span>
              </div>
              <p className="ext__line">
                +{e.extraHours} {e.extraHours === 1 ? 'hour' : 'hours'} · {inr(e.amount)} extra
                {b.checkOut && e.newCheckOut ? ` · check-out ${fmtTime(b.checkOut)} → ${fmtTime(e.newCheckOut)}` : ''}
              </p>
              <p className="ext__ref">#{b.reference}</p>
              {allowed ? (
                <div className="actions">
                  <button type="button" className="abtn abtn--ghost" disabled={busy === b.id} onClick={() => setRejecting(b)}>Decline</button>
                  <button type="button" className="abtn abtn--lime" disabled={busy === b.id} onClick={() => approve(b)}>{busy === b.id ? 'Please wait…' : 'Approve'}</button>
                </div>
              ) : <p className="muted-note">Your role can’t answer extension requests.</p>}
            </li>
          );
        })}
      </ul>

      {showHistory && history.length > 0 && (
        <>
          <h3 className="ext__sub">Earlier requests</h3>
          <ul className="ext__list">
            {history.map((b) => (
              <li key={b.id} className="ext__item ext__item--past">
                <div className="ext__top"><strong>{b.guest}</strong><span className={`pill pill--ext-${b.extension!.status.toLowerCase()}`}>{b.extension!.status}</span></div>
                <p className="ext__line">+{b.extension!.extraHours}h · {inr(b.extension!.amount)}{b.extension!.rejectionReason ? ` · ${b.extension!.rejectionReason}` : ''}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {rejecting && (
        <div className="sheet-wrap">
          <button type="button" className="sheet-scrim" aria-label="Cancel" onClick={() => setRejecting(null)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Decline extension">
            <div className="sheet__grab" aria-hidden="true" />
            <header className="sheet__head"><h2>Decline extension</h2>
              <button type="button" className="icon-btn icon-btn--sm" onClick={() => setRejecting(null)} aria-label="Close"><CloseIcon /></button>
            </header>
            <div className="sheet__body">
              <p className="muted-note">Tell {rejecting.guest} why — they’ll see this reason.</p>
              <div className="opts">
                {REASONS.map((r) => <button key={r} type="button" aria-pressed={reason === r} className={`opt${reason === r ? ' is-on' : ''}`} onClick={() => setReason(r)}>{r}</button>)}
              </div>
              {reason === 'Other' && <input className="plain-input" placeholder="Write a short reason" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} aria-label="Reason" />}
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={() => setRejecting(null)}>Cancel</button>
              <button type="button" className="abtn abtn--dark" disabled={busy === rejecting.id} onClick={reject}>{busy === rejecting.id ? 'Please wait…' : 'Decline'}</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
