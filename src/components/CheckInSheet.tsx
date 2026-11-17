import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { checkInBooking, sendCheckInOtp, type Booking } from '../api/partner';
import { ApiError } from '../api/client';
import { AlertIcon, CheckCircleIcon, CloseIcon } from './Icons';

/**
 * Check a guest in. The server sends a 6-digit code to the guest; the guest reads it out
 * (or shows it in their Checkdin app) and the hotel types it here.
 */
export default function CheckInSheet({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: () => void }) {
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [wait, setWait] = useState(0);
  const [done, setDone] = useState(false);
  const sentOnce = useRef(false);

  const send = useCallback(async (auto: boolean) => {
    setSending(true); setError(null);
    try {
      const r = await sendCheckInOtp(booking.id);
      setWait(Math.max(0, r.resendIn ?? 30));
      setInfo(r.otpSent
        ? `A 6-digit code was sent to the guest${r.destination ? ` (${r.destination})` : ''}.`
        : r.message || 'Ask the guest for the code shown in their Checkdin app.');
    } catch (e) {
      const err = e as ApiError;
      if (auto && err.status === 429) {
        const m = /wait (\d+) seconds/i.exec(err.message);
        setWait(m ? Number(m[1]) : 30);
        setInfo('A code was already sent a moment ago — ask the guest for it.');
      } else setError(err.message);
    } finally { setSending(false); }
  }, [booking.id]);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void send(true);
  }, [send]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, [wait]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit check-in code from the guest.'); return; }
    setVerifying(true); setError(null);
    try {
      const r = await checkInBooking(booking.id, code);
      if (r && r.ok === false) { setError('Verification failed. Please try again.'); return; }
      setDone(true);
    } catch (err) { setError((err as Error).message); setCode(''); }
    finally { setVerifying(false); }
  }

  return (
    <div className="sheet-wrap">
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={done ? onDone : onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Check in ${booking.guest}`}>
        <div className="sheet__grab" aria-hidden="true" />
        {done ? (
          <>
            <div className="dialog__body">
              <span className="dialog__icon"><CheckCircleIcon /></span>
              <h2>{booking.guest} is checked in</h2>
              <p>The stay has started. Have a great day!</p>
            </div>
            <footer className="sheet__foot"><button type="button" className="abtn abtn--lime" onClick={onDone}>Done</button></footer>
          </>
        ) : (
          <form onSubmit={verify} noValidate>
            <header className="sheet__head">
              <h2>Check in {booking.guest}</h2>
              <button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close"><CloseIcon /></button>
            </header>
            <div className="sheet__body">
              <p className="muted-note">{sending && !info ? 'Sending a code to the guest…' : info}</p>
              {error && <div className="alert" role="alert"><AlertIcon /> {error}</div>}
              <label className="otp-label" htmlFor="otp">Check-in code</label>
              <input
                id="otp" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="• • • • • •"
                value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }} autoFocus
              />
              <button type="button" className="link-btn otp-resend" disabled={sending || wait > 0} onClick={() => send(false)}>
                {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
              </button>
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="abtn abtn--lime" disabled={verifying || code.length !== 6}>{verifying ? 'Checking…' : 'Check in'}</button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
