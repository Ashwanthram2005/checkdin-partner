import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';
import {
  AlertIcon, ArrowLeft, ArrowRight, EyeIcon, EyeOffIcon, HotelIdIcon, LockIcon, MailIcon,
  ShieldIcon, UserIcon,
} from '../components/Icons';
import { findHotel, loginAsUser, type Lookup } from '../data/partnerApi';

const SUPPORT_NUMBER = '1800 313 2200';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOTEL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,19}$/;

type Method = 'email' | 'hotel';

const METHODS: Record<Method, { tab: string; label: string; placeholder: string; empty: string; invalid: string }> = {
  email: { tab: 'Email', label: 'Email address', placeholder: 'you@property.com', empty: 'Enter your registered email', invalid: 'Enter a valid email address' },
  hotel: { tab: 'Hotel ID', label: 'Hotel ID', placeholder: 'e.g. CHK-EMPIRE-017', empty: 'Enter your Hotel ID', invalid: 'Hotel ID can have letters, numbers, - and _ only' },
};
const USER_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,29}$/;

export default function Login() {
  const [method, setMethod] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [hotelName, setHotelName] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const [idError, setIdError] = useState<string>();
  const [userError, setUserError] = useState<string>();
  const [pwError, setPwError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const m = METHODS[method];
  const step = hotelName ? 2 : 1;

  function switchMethod(next: Method) {
    if (next === method) return;
    setMethod(next);
    setIdentifier('');
    setIdError(undefined);
    setFormError(undefined);
  }

  function startOver() {
    setHotelName(null);
    setUserId('');
    setPassword('');
    setUserError(undefined);
    setPwError(undefined);
    setFormError(undefined);
  }

  /** Step 1: identify the property. */
  async function onContinue(e: FormEvent) {
    e.preventDefault();
    const value = identifier.trim();
    const bad = !value ? m.empty : (method === 'email' ? !EMAIL_RE.test(value) : !HOTEL_ID_RE.test(value)) ? m.invalid : undefined;
    setIdError(bad);
    setFormError(undefined);
    if (bad) return;

    setLoading(true);
    try {
      const lookup: Lookup = method === 'email' ? { email: value } : { hotelId: value };
      const res = await findHotel(lookup);
      setHotelName(res.hotelName);
    } catch {
      setFormError('We couldn’t find that property. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  }

  /** Step 2: log in with User ID + password. */
  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const uBad = !userId.trim() ? 'Enter your User ID' : !USER_ID_RE.test(userId.trim()) ? 'User ID can have letters, numbers, . - and _ only' : undefined;
    const pBad = !password ? 'Enter your password' : password.length < 4 ? 'Password is too short' : undefined;
    setUserError(uBad);
    setPwError(pBad);
    if (uBad || pBad) return;

    setLoading(true);
    try {
      await loginAsUser(userId.trim(), password);
      // TODO: store the token + user.role_id, then navigate('/dashboard').
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page login">
      {step === 1 ? (
        <Link to="/" className="back" aria-label="Back to welcome"><ArrowLeft /></Link>
      ) : (
        <button type="button" className="back" onClick={startOver} aria-label="Back to property lookup"><ArrowLeft /></button>
      )}

      <Brand />

      <header className="login__intro">
        <p className="steps" aria-label={`Step ${step} of 2`}>
          <span className="steps__dot is-on" /><span className={`steps__dot${step === 2 ? ' is-on' : ''}`} />
        </p>
        <h1>{step === 1 ? 'Welcome back' : 'Enter your User ID'}</h1>
        <p>
          {step === 1
            ? 'Find your property with your email or Hotel ID.'
            : 'Log in with your own User ID and password. What you can access depends on your role.'}
        </p>
      </header>

      {step === 1 && (
        <form className="card card--dark login__card" onSubmit={onContinue} noValidate>
          <div className="segmented" role="tablist" aria-label="Find property by">
            {(Object.keys(METHODS) as Method[]).map((key) => (
              <button
                key={key} type="button" role="tab" aria-selected={method === key}
                className={`segmented__btn${method === key ? ' is-active' : ''}`}
                onClick={() => switchMethod(key)}
              >
                {key === 'email' ? <MailIcon size={18} /> : <HotelIdIcon size={18} />}
                {METHODS[key].tab}
              </button>
            ))}
          </div>

          {formError && <div className="alert" role="alert"><AlertIcon /> {formError}</div>}

          <div className={`field${idError ? ' field--error' : ''}`}>
            <label htmlFor="id">{m.label}</label>
            <div className="field__box">
              {method === 'email' ? <MailIcon /> : <HotelIdIcon />}
              <input
                id="id" key={method}
                type={method === 'email' ? 'email' : 'text'}
                inputMode={method === 'email' ? 'email' : 'text'}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                autoComplete={method === 'email' ? 'email' : 'off'}
                placeholder={m.placeholder}
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setIdError(undefined); setFormError(undefined); }}
                aria-invalid={!!idError}
                aria-describedby={idError ? 'id-err' : undefined}
              />
            </div>
            {idError && <p className="field__error" id="id-err">{idError}</p>}
          </div>

          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? <span className="spinner" aria-label="Searching" /> : <>Continue <ArrowRight /></>}
          </button>

          <p className="secure"><ShieldIcon /> Secure partner login</p>
        </form>
      )}

      {step === 2 && hotelName && (
        <form className="card card--dark login__card" onSubmit={onLogin} noValidate>
          <div className="hotel-chip">
            <span className="hotel-chip__icon"><HotelIdIcon size={18} /></span>
            <span className="hotel-chip__text">
              <strong>{hotelName}</strong>
              <small>{identifier.trim()}</small>
            </span>
            <button type="button" className="link-lime" onClick={startOver}>Change</button>
          </div>

          {formError && <div className="alert" role="alert"><AlertIcon /> {formError}</div>}

          <div className={`field${userError ? ' field--error' : ''}`}>
            <label htmlFor="userId">User ID</label>
            <div className="field__box">
              <UserIcon />
              <input
                id="userId" type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                autoComplete="username" placeholder="e.g. pu1" value={userId}
                onChange={(e) => { setUserId(e.target.value); setUserError(undefined); setFormError(undefined); }}
                aria-invalid={!!userError} aria-describedby={userError ? 'user-err' : undefined}
              />
            </div>
            {userError && <p className="field__error" id="user-err">{userError}</p>}
          </div>

          <div className={`field${pwError ? ' field--error' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="field__box">
              <LockIcon />
              <input
                id="password" type={show ? 'text' : 'password'} autoComplete="current-password"
                placeholder="Enter your password" value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(undefined); setFormError(undefined); }}
                aria-invalid={!!pwError} aria-describedby={pwError ? 'pw-err' : undefined}
              />
              <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {pwError && <p className="field__error" id="pw-err">{pwError}</p>}
          </div>

          <div className="login__row">
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="check__box" aria-hidden="true" />
              Keep me logged in
            </label>
            <Link to="/forgot-password" className="link-lime">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? <span className="spinner" aria-label="Logging in" /> : <>Login to Dashboard <ArrowRight /></>}
          </button>

          <p className="secure"><ShieldIcon /> Secure partner login</p>
        </form>
      )}

      {step === 1 && (
        <Link to="/register" className="card card--outline card--compact">
          <div className="card__body">
            <h2>New to Checkdin?</h2>
            <p>List your property and start getting bookings.</p>
          </div>
          <span className="card__chevron"><ArrowRight /></span>
        </Link>
      )}

      <footer className="welcome__help">
        Need help? Call partner support on{' '}
        <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>{SUPPORT_NUMBER}</a>,
        available 24&nbsp;×&nbsp;7.
      </footer>
    </main>
  );
}
