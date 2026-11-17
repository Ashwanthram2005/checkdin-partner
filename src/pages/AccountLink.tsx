import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Brand from '../components/Brand';
import { AlertIcon, ArrowRight, CheckCircleIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/Icons';
import { activateAccount, activationStatus, resetPassword, resetStatus, type LinkStatus } from '../api/partner';
import { SUPPORT_NUMBER } from '../config';
import { tokenFrom } from '../lib/linkToken';

type Mode = 'activate' | 'reset';

const COPY = {
  activate: { title: 'Activate your account', intro: 'Set a password to start using Checkdin.', button: 'Activate account', busy: 'Activating…', done: 'Account activated', doneText: 'You can now sign in with your new password.' },
  reset: { title: 'Choose a new password', intro: 'Pick a password you haven’t used before.', button: 'Change password', busy: 'Saving…', done: 'Password changed', doneText: 'Sign in with your new password.' },
} as const;

const BAD: Record<Exclude<LinkStatus, 'valid' | 'unknown'>, { title: string; text: string }> = {
  used: { title: 'This link was already used', text: 'If this was you, just sign in. Otherwise ask for a new link.' },
  expired: { title: 'This link has expired', text: 'Ask for a new one: use “Forgot password” on the sign-in screen, or call support.' },
  invalid: { title: 'This link isn’t valid', text: 'Check you copied the whole link from the email, or ask for a new one.' },
};

/** The page that opens from the email link. Used for both activating an account and resetting a password. */
export default function AccountLink({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const c = COPY[mode];
  const [token, setToken] = useState(() => tokenFrom(params.get('token') ?? ''));
  const [paste, setPaste] = useState('');
  const [status, setStatus] = useState<LinkStatus | 'checking' | 'none'>(token ? 'checking' : 'none');

  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('none'); return; }
    let live = true;
    setStatus('checking');
    (mode === 'activate' ? activationStatus(token).then((r) => r.status) : resetStatus(token)).then((s) => { if (live) setStatus(s); });
    return () => { live = false; };
  }, [token, mode]);

  function useCode(e: FormEvent) {
    e.preventDefault();
    const t = tokenFrom(paste);
    if (!t) { setError('Paste the link or code from your email.'); return; }
    setError(null); setToken(t);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError('Password must be at least 8 characters.');
    if (mode === 'reset' && (!/[A-Za-z]/.test(pw) || !/\d/.test(pw))) return setError('Password must contain at least one letter and one number.');
    if (pw !== pw2) return setError('Passwords do not match.');
    setBusy(true);
    try {
      if (mode === 'activate') {
        const r = await activateAccount(token, pw, name.trim() || undefined);
        if (r && (r as { alreadyActivated?: boolean }).alreadyActivated) { setStatus('used'); return; }
      } else await resetPassword(token, pw, pw2);
      setPw(''); setPw2(''); setDone(true);
    } catch (err) { setError((err as Error).message || 'Something went wrong. Try the link again.'); }
    finally { setBusy(false); }
  }

  const bad = status === 'used' || status === 'expired' || status === 'invalid';

  return (
    <main className="page login">
      <Brand />
      <header className="login__intro"><h1>{done ? c.done : bad ? BAD[status].title : c.title}</h1><p>{done ? c.doneText : bad ? BAD[status].text : c.intro}</p></header>

      {done && (
        <section className="card card--dark login__card" role="status">
          <div className="dialog__body" style={{ color: '#fff' }}><span className="dialog__icon"><CheckCircleIcon /></span></div>
          <button type="button" className="btn btn--lime" onClick={() => navigate('/login', { replace: true })}>Go to sign in <ArrowRight /></button>
        </section>
      )}

      {!done && bad && (
        <section className="card card--dark login__card">
          <button type="button" className="btn btn--lime" onClick={() => navigate('/login', { replace: true })}>Go to sign in <ArrowRight /></button>
          {status !== 'used' && <Link to="/forgot-password" className="link-lime" style={{ textAlign: 'center' }}>Send me a new link</Link>}
        </section>
      )}

      {!done && status === 'none' && (
        <form className="card card--dark login__card" onSubmit={useCode} noValidate>
          {error && <div className="alert" role="alert"><AlertIcon /> {error}</div>}
          <div className="field">
            <label htmlFor="code">Link or code from your email</label>
            <div className="field__box"><LockIcon /><input id="code" value={paste} placeholder="Paste it here" autoCapitalize="none" spellCheck={false} onChange={(e) => { setPaste(e.target.value); setError(null); }} /></div>
          </div>
          <button type="submit" className="btn btn--lime">Continue <ArrowRight /></button>
          <p className="slow" style={{ color: '#9a9a93' }}>Tapping the button in the email normally opens this screen for you.</p>
        </form>
      )}

      {!done && status === 'checking' && <section className="card card--dark login__card"><p className="slow"><span className="spinner" aria-hidden="true" /> Checking your link…</p></section>}

      {!done && (status === 'valid' || status === 'unknown') && (
        <form className="card card--dark login__card" onSubmit={submit} noValidate>
          {status === 'unknown' && <p className="slow">We couldn’t check the link just now. You can still try.</p>}
          {error && <div className="alert" role="alert"><AlertIcon /> {error}</div>}
          {mode === 'activate' && (
            <div className="field">
              <label htmlFor="nm">Your name <small style={{ color: '#9a9a93', fontWeight: 400 }}>(optional)</small></label>
              <div className="field__box"><UserIcon /><input id="nm" value={name} autoComplete="name" placeholder="e.g. Kishore Kumar" onChange={(e) => setName(e.target.value)} /></div>
            </div>
          )}
          <div className="field">
            <label htmlFor="np">New password</label>
            <div className="field__box">
              <LockIcon /><input id="np" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={pw} onChange={(e) => { setPw(e.target.value); setError(null); }} />
              <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="np2">Confirm password</label>
            <div className="field__box"><LockIcon /><input id="np2" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Type it again" value={pw2} onChange={(e) => { setPw2(e.target.value); setError(null); }} /></div>
          </div>
          <button type="submit" className="btn btn--lime" disabled={busy}>{busy ? <><span className="spinner" aria-hidden="true" /> {c.busy}</> : <>{c.button} <ArrowRight /></>}</button>
        </form>
      )}

      <footer className="welcome__help">Need help? Call <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>{SUPPORT_NUMBER}</a>, available 24&nbsp;×&nbsp;7.</footer>
    </main>
  );
}
