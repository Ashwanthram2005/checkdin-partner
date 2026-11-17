import { FormEvent, useEffect, useState } from 'react';
import { requestPayout, sendPayoutOtp, verifyPayoutOtp } from '../api/partner';
import { ApiError } from '../api/client';
import { AlertIcon, CheckCircleIcon, CloseIcon } from './Icons';

type Step = 'confirm' | 'code' | 'done';

/** Owner-only. A 6-digit code confirms the request, exactly like the partner portal. */
export default function PayoutRequest({ account, onClose, onDone }: { account: string; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<Step>('confirm');
  const [code, setCode] = useState('');
  const [dest, setDest] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function send() {
    setBusy(true); setError(null);
    try {
      const r = await sendPayoutOtp();
      setDest(r.destination ?? null); setWait(Math.max(0, r.resendIn ?? 30)); setStep('code');
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 429) { const m = /wait (\d+) seconds/i.exec(err.message); setWait(m ? Number(m[1]) : 30); setStep('code'); }
      else setError(err.message);
    } finally { setBusy(false); }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code.'); return; }
    setBusy(true); setError(null);
    try {
      const v = await verifyPayoutOtp(code);
      if (!v.challengeToken) { setError('Verification failed. Please try again.'); return; }
      await requestPayout(v.challengeToken);
      setStep('done');
    } catch (err) { setError((err as Error).message); setCode(''); }
    finally { setBusy(false); }
  }

  return (
    <div className="sheet-wrap">
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={step === 'done' ? onDone : onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Request payout">
        <div className="sheet__grab" aria-hidden="true" />
        {step === 'done' ? (
          <>
            <div className="dialog__body"><span className="dialog__icon"><CheckCircleIcon /></span><h2>Payout requested</h2><p>It will show as “On process” once Checkdin approves it, then reach {account}.</p></div>
            <footer className="sheet__foot"><button type="button" className="abtn abtn--lime" onClick={onDone}>Done</button></footer>
          </>
        ) : (
          <form onSubmit={confirm} noValidate>
            <header className="sheet__head"><h2>Request payout</h2><button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close"><CloseIcon /></button></header>
            <div className="sheet__body">
              {step === 'confirm' ? (
                <p className="muted-note">Checkdin will create a payout request for your settled earnings, to be paid to <b>{account}</b>. To keep your money safe, we’ll first send a 6-digit code to the registered owner contact.</p>
              ) : (
                <>
                  <p className="muted-note">A 6-digit code was sent{dest ? ` to ${dest}` : ' to the registered owner contact'}.</p>
                  <label className="otp-label" htmlFor="pcode">Confirmation code</label>
                  <input id="pcode" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="• • • • • •" value={code} autoFocus
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }} />
                  <button type="button" className="link-btn otp-resend" disabled={busy || wait > 0} onClick={send}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
                </>
              )}
              {error && <div className="alert alert--light" role="alert"><AlertIcon /> {error}</div>}
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={onClose}>Cancel</button>
              {step === 'confirm'
                ? <button type="button" className="abtn abtn--lime" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send code'}</button>
                : <button type="submit" className="abtn abtn--lime" disabled={busy || code.length !== 6}>{busy ? 'Requesting…' : 'Confirm request'}</button>}
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
