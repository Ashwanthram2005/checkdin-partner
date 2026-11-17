import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';
import {
  AlertIcon, ArrowLeft, ArrowRight, EyeIcon, EyeOffIcon, HotelIdIcon, LockIcon, MailIcon,
  ShieldIcon,
} from '../components/Icons';

const SUPPORT_NUMBER = '1800 313 2200';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOTEL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,19}$/;

type Method = 'email' | 'hotel';
type Errors = { id?: string; password?: string; form?: string };

const METHODS: Record<Method, { tab: string; label: string; placeholder: string; empty: string; invalid: string }> = {
  email: {
    tab: 'Email',
    label: 'Email address',
    placeholder: 'you@property.com',
    empty: 'Enter your registered email',
    invalid: 'Enter a valid email address',
  },
  hotel: {
    tab: 'Hotel ID',
    label: 'Hotel ID',
    placeholder: 'e.g. h1',
    empty: 'Enter your Hotel ID',
    invalid: 'Hotel ID can have letters, numbers, - and _ only',
  },
};

function validate(method: Method, id: string, password: string): Errors {
  const errors: Errors = {};
  const value = id.trim();
  const m = METHODS[method];
  if (!value) errors.id = m.empty;
  else if (method === 'email' ? !EMAIL_RE.test(value) : !HOTEL_ID_RE.test(value)) errors.id = m.invalid;
  if (!password) errors.password = 'Enter your password';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  return errors;
}

export default function Login() {
  const [method, setMethod] = useState<Method>('email');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const m = METHODS[method];

  function switchMethod(next: Method) {
    if (next === method) return;
    setMethod(next);
    setId('');
    setErrors({});
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate(method, id, password);
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      // TODO: replace with the real partner auth API call.
      // Send { email, password } when method === 'email', or { hotelId, password } when 'hotel'.
      await new Promise((r) => setTimeout(r, 900));
      setErrors({ form: 'Login is not connected to the server yet.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page login">
      <Link to="/" className="back" aria-label="Back to welcome">
        <ArrowLeft />
      </Link>

      <Brand />

      <header className="login__intro">
        <h1>Welcome back</h1>
        <p>Log in to manage your bookings, pricing and payouts.</p>
      </header>

      <form className="card card--dark login__card" onSubmit={onSubmit} noValidate>
        <div className="segmented" role="tablist" aria-label="Login method">
          {(Object.keys(METHODS) as Method[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={method === key}
              className={`segmented__btn${method === key ? ' is-active' : ''}`}
              onClick={() => switchMethod(key)}
            >
              {key === 'email' ? <MailIcon size={18} /> : <HotelIdIcon size={18} />}
              {METHODS[key].tab}
            </button>
          ))}
        </div>

        {errors.form && (
          <div className="alert" role="alert">
            <AlertIcon /> {errors.form}
          </div>
        )}

        <div className={`field${errors.id ? ' field--error' : ''}`}>
          <label htmlFor="id">{m.label}</label>
          <div className="field__box">
            {method === 'email' ? <MailIcon /> : <HotelIdIcon />}
            <input
              id="id"
              key={method}
              type={method === 'email' ? 'email' : 'text'}
              inputMode={method === 'email' ? 'email' : 'text'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete={method === 'email' ? 'email' : 'username'}
              placeholder={m.placeholder}
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setErrors((x) => ({ ...x, id: undefined, form: undefined }));
              }}
              aria-invalid={!!errors.id}
              aria-describedby={errors.id ? 'id-err' : undefined}
            />
          </div>
          {errors.id && <p className="field__error" id="id-err">{errors.id}</p>}
        </div>

        <div className={`field${errors.password ? ' field--error' : ''}`}>
          <label htmlFor="password">Password</label>
          <div className="field__box">
            <LockIcon />
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((x) => ({ ...x, password: undefined, form: undefined }));
              }}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'pw-err' : undefined}
            />
            <button
              type="button"
              className="field__toggle"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="field__error" id="pw-err">{errors.password}</p>}
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

      <Link to="/register" className="card card--outline card--compact">
        <div className="card__body">
          <h2>New to Checkdin?</h2>
          <p>List your property and start getting bookings.</p>
        </div>
        <span className="card__chevron"><ArrowRight /></span>
      </Link>

      <footer className="welcome__help">
        Need help? Call partner support on{' '}
        <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>{SUPPORT_NUMBER}</a>,
        available 24&nbsp;×&nbsp;7.
      </footer>
    </main>
  );
}
