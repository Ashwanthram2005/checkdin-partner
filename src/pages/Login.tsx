import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';
import {
  AlertIcon, ArrowLeft, ArrowRight, EyeIcon, EyeOffIcon, HotelIdIcon, LockIcon, MailIcon,
  ShieldIcon,
} from '../components/Icons';
import { findHotelUsers, loginAsUser, type HotelUser, type Lookup } from '../data/partnerApi';
import { ROLES } from '../data/roles';

const SUPPORT_NUMBER = '1800 313 2200';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOTEL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,19}$/;

type Method = 'email' | 'hotel';

const METHODS: Record<Method, { tab: string; label: string; placeholder: string; empty: string; invalid: string }> = {
  email: { tab: 'Email', label: 'Email address', placeholder: 'you@property.com', empty: 'Enter your registered email', invalid: 'Enter a valid email address' },
  hotel: { tab: 'Hotel ID', label: 'Hotel ID', placeholder: 'e.g. CHK-EMPIRE-017', empty: 'Enter your Hotel ID', invalid: 'Hotel ID can have letters, numbers, - and _ only' },
};

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

export default function Login() {
  const [method, setMethod] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [hotel, setHotel] = useState<{ name: string; users: HotelUser[] } | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const [idError, setIdError] = useState<string>();
  const [pwError, setPwError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const m = METHODS[method];
  const step = hotel ? 2 : 1;
  const selected = hotel?.users.find((u) => u.id === userId);

  function switchMethod(next: Method) {
    if (next === method) return;
    setMethod(next);
    setIdentifier('');
    setIdError(undefined);
    setFormError(undefined);
  }

  function startOver() {
    setHotel(null);
    setUserId(null);
    setPassword('');
    setPwError(undefined);
    setFormError(undefined);
  }

  /** Step 1: identify the hotel, then show its users. */
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
      const res = await findHotelUsers(lookup);
      if (!res.users.length) {
        setFormError('No active users found for this property. Contact partner support.');
        return;
      }
      setHotel({ name: res.hotelName, users: res.users });
    } catch {
      setFormError('We couldn’t find that property. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  }

  /** Step 2: log in as the chosen user. */
  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    if (!userId) return setFormError('Select who is logging in');
    const bad = !password ? 'Enter your password' : password.length < 4 ? 'Password is too short' : undefined;
    setPwError(bad);
    if (bad) return;

    setLoading(true);
    try {
      await loginAsUser(userId, password);
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
        <h1>{step === 1 ? 'Welcome back' : 'Who’s logging in?'}</h1>
        <p>
          {step === 1
            ? 'Find your property with your email or Hotel ID.'
            : 'Choose your profile and enter your password. What you can access depends on your role.'}
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

      {step === 2 && hotel && (
        <form className="card card--dark login__card" onSubmit={onLogin} noValidate>
          <div className="hotel-chip">
            <span className="hotel-chip__icon"><HotelIdIcon size={18} /></span>
            <span className="hotel-chip__text">
              <strong>{hotel.name}</strong>
              <small>{identifier.trim()}</small>
            </span>
            <button type="button" className="link-lime" onClick={startOver}>Change</button>
          </div>

          {formError && <div className="alert" role="alert"><AlertIcon /> {formError}</div>}

          <div role="radiogroup" aria-label="Select user" className="users">
            {hotel.users.map((u) => {
              const role = ROLES[u.role_id];
              const on = u.id === userId;
              return (
                <button
                  key={u.id} type="button" role="radio" aria-checked={on}
                  className={`user${on ? ' is-selected' : ''}`}
                  onClick={() => { setUserId(u.id); setFormError(undefined); }}
                >
                  <span className="user__avatar">{initials(u.name)}</span>
                  <span className="user__info">
                    <strong>{u.name}</strong>
                    <small>{role.name}</small>
                  </span>
                  <span className={`user__level user__level--${role.level.toLowerCase()}`}>{role.level} access</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <p className="role-note">
              <ShieldIcon size={16} />
              <span>
                <b>{ROLES[selected.role_id].name}:</b> {ROLES[selected.role_id].description}
              </span>
            </p>
          )}

          <div className={`field${pwError ? ' field--error' : ''}`}>
            <label htmlFor="password">{selected ? `Password for ${selected.name.split(' ')[0]}` : 'Password'}</label>
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
