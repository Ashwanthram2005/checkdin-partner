import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { AlertIcon, ArrowLeft, ArrowRight, CheckCircleIcon, MailIcon } from '../components/Icons';
import { forgotPassword } from '../api/partner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!EMAIL_RE.test(v)) { setError('Enter a valid email address.'); return; }
    setError(undefined); setLoading(true);
    try { await forgotPassword(v); setSent(true); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <main className="page login">
      <button type="button" className="back" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft /></button>
      <Brand />
      <header className="login__intro">
        <h1>Reset password</h1>
        <p>We’ll email a reset link to the Gmail address linked to your property account.</p>
      </header>

      {sent ? (
        <section className="card card--dark login__card" role="status">
          <div className="dialog__body" style={{ color: '#fff' }}>
            <span className="dialog__icon"><CheckCircleIcon /></span>
            <h2 style={{ color: '#fff' }}>Check your inbox</h2>
            <p style={{ color: '#d4d4d4' }}>If an account exists for <b>{email.trim()}</b>, a reset link is on its way.</p>
          </div>
          <Link to="/login" className="btn btn--lime">Back to login</Link>
        </section>
      ) : (
        <form className="card card--dark login__card" onSubmit={onSubmit} noValidate>
          {error && <div className="alert" role="alert"><AlertIcon /> {error}</div>}
          <div className={`field${error ? ' field--error' : ''}`}>
            <label htmlFor="fp">Gmail address</label>
            <div className="field__box">
              <MailIcon />
              <input id="fp" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@gmail.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(undefined); }} />
            </div>
          </div>
          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? <span className="spinner" aria-label="Sending" /> : <>Send reset link <ArrowRight /></>}
          </button>
        </form>
      )}
    </main>
  );
}
