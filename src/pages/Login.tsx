import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import {
  AlertIcon, ArrowLeft, ArrowRight, ChevronRightSm, EyeIcon, EyeOffIcon, HotelIdIcon, LockIcon, MailIcon, ShieldIcon,
} from '../components/Icons';
import {
  loginWithEmail, loginWithHotelId, lookupByEmail, lookupByHotelId, type AccountUser,
} from '../api/partner';
import { useAuth } from '../auth/AuthContext';
import { SUPPORT_NUMBER } from '../config';
import { initials } from '../lib/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOTEL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/;

type Method = 'email' | 'hotel';
type Step = 'lookup' | 'account' | 'password';

const METHODS: Record<Method, { tab: string; label: string; placeholder: string; empty: string; invalid: string; hint: string }> = {
  email: { tab: 'Gmail', label: 'Gmail address', placeholder: 'you@gmail.com', empty: 'Enter your Gmail address', invalid: 'Enter a valid email address', hint: 'Enter the Gmail address linked to your property account.' },
  hotel: { tab: 'Hotel ID', label: 'Hotel ID', placeholder: 'e.g. CHK-ONB-6200', empty: 'Enter your Hotel ID', invalid: 'Hotel ID can have letters, numbers, - and _ only', hint: 'Enter the Hotel ID issued to your property.' },
};

const ROLE_NAME: Record<string, string> = { prole1: 'Owner', prole2: 'Manager', prole3: 'Receptionist', prole4: 'Housekeeping', prole5: 'Night Auditor' };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session } = useAuth();

  const [step, setStep] = useState<Step>('lookup');
  const [method, setMethod] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [accounts, setAccounts] = useState<AccountUser[]>([]);
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const m = METHODS[method];
  const stepNo = step === 'lookup' ? 1 : step === 'account' ? 2 : 3;

  // already signed in → go straight to the app
  useEffect(() => {
    if (session) navigate('/home', { replace: true });
  }, [session, navigate]);

  // the hosted server can need a moment to wake up; say so instead of looking frozen
  useEffect(() => {
    if (!loading) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  function switchMethod(next: Method) {
    if (next === method) return;
    setMethod(next); setIdentifier(''); setFieldError(undefined); setFormError(undefined);
  }

  function goBack() {
    setFormError(undefined); setFieldError(undefined);
    if (step === 'password') { setPassword(''); setStep(accounts.length > 1 ? 'account' : 'lookup'); }
    else if (step === 'account') { setStep('lookup'); setAccounts([]); setAccount(null); }
    else navigate('/');
  }

  function pickAccount(u: AccountUser) {
    setAccount(u); setPassword(''); setFormError(undefined); setStep('password');
  }

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    const value = identifier.trim();
    const bad = !value ? m.empty : (method === 'email' ? !EMAIL_RE.test(value) : !HOTEL_ID_RE.test(value)) ? m.invalid : undefined;
    setFieldError(bad); setFormError(undefined);
    if (bad) return;
    setLoading(true);
    try {
      const res = method === 'email' ? await lookupByEmail(value) : await lookupByHotelId(value);
      const users = (res.users ?? []).filter((u) => u.active !== false);
      if (!users.length) {
        setFormError(method === 'email'
          ? 'No active account found for this Gmail address. If your application was approved, activate your account from the email we sent you.'
          : 'No active accounts found for this Hotel ID. If your application was approved, activate your account from the email we sent you.');
        return;
      }
      setAccounts(users);
      if (users.length === 1) pickAccount(users[0]); else setStep('account');
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    if (!account) return;
    setFormError(undefined);
    if (!password) { setFieldError('Enter your password'); return; }
    setFieldError(undefined);
    setLoading(true);
    try {
      const value = identifier.trim();
      const res = method === 'email'
        ? await loginWithEmail(value, account.id, password)
        : await loginWithHotelId(value, account.id, password);
      signIn(res, method === 'email' ? value : undefined);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/home', { replace: true });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page login">
      <button type="button" className="back" onClick={goBack} aria-label="Back"><ArrowLeft /></button>

      <Brand />

      <header className="login__intro">
        <p className="steps" aria-label={`Step ${stepNo} of 3`}>
          {[1, 2, 3].map((n) => <span key={n} className={`steps__dot${n <= stepNo ? ' is-on' : ''}`} />)}
        </p>
        <h1>{step === 'lookup' ? 'Welcome back' : step === 'account' ? 'Select account' : 'Enter password'}</h1>
        <p>
          {step === 'lookup' && m.hint}
          {step === 'account' && 'Choose the property account you want to manage.'}
          {step === 'password' && `Enter the password for ${account?.name}.`}
        </p>
      </header>

      {step === 'lookup' && (
        <form className="card card--dark login__card" onSubmit={onLookup} noValidate>
          <div className="segmented" role="tablist" aria-label="Find property by">
            {(Object.keys(METHODS) as Method[]).map((key) => (
              <button key={key} type="button" role="tab" aria-selected={method === key} className={`segmented__btn${method === key ? ' is-active' : ''}`} onClick={() => switchMethod(key)}>
                {key === 'email' ? <MailIcon size={18} /> : <HotelIdIcon size={18} />}{METHODS[key].tab}
              </button>
            ))}
          </div>

          {formError && <div className="alert" role="alert"><AlertIcon /> {formError}</div>}

          <div className={`field${fieldError ? ' field--error' : ''}`}>
            <label htmlFor="id">{m.label}</label>
            <div className="field__box">
              {method === 'email' ? <MailIcon /> : <HotelIdIcon />}
              <input
                id="id" key={method} type={method === 'email' ? 'email' : 'text'} inputMode={method === 'email' ? 'email' : 'text'}
                autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete={method === 'email' ? 'email' : 'off'}
                placeholder={m.placeholder} value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setFieldError(undefined); setFormError(undefined); }}
                aria-invalid={!!fieldError} aria-describedby={fieldError ? 'id-err' : undefined}
              />
            </div>
            {fieldError && <p className="field__error" id="id-err">{fieldError}</p>}
          </div>

          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? <><span className="spinner" aria-hidden="true" /> Checking…</> : <>Continue <ArrowRight /></>}
          </button>
          {slow && <p className="slow">Waking up the server — the first request can take up to a minute.</p>}
          <p className="secure"><ShieldIcon /> Secure partner login</p>
        </form>
      )}

      {step === 'account' && (
        <section className="card card--dark login__card" aria-label="Accounts">
          <div role="list" className="accounts">
            {accounts.map((u) => (
              <button key={u.id} type="button" role="listitem" className="account" onClick={() => pickAccount(u)}>
                <span className="account__avatar">{initials(u.name)}</span>
                <span className="account__info">
                  <strong>{u.name}</strong>
                  <small>{ROLE_NAME[u.role_id] ?? 'Staff'}{u.hotel_name ? ` · ${u.hotel_name}` : ''}</small>
                </span>
                <ChevronRightSm />
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'password' && account && (
        <form className="card card--dark login__card" onSubmit={onLogin} noValidate>
          <div className="hotel-chip">
            <span className="account__avatar">{initials(account.name)}</span>
            <span className="hotel-chip__text">
              <strong>{account.name}</strong>
              <small>{ROLE_NAME[account.role_id] ?? 'Staff'}{account.hotel_name ? ` · ${account.hotel_name}` : ''}</small>
            </span>
          </div>

          {formError && <div className="alert" role="alert"><AlertIcon /> {formError}</div>}

          <div className={`field${fieldError ? ' field--error' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="field__box">
              <LockIcon />
              <input
                id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} autoFocus
                onChange={(e) => { setPassword(e.target.value); setFieldError(undefined); setFormError(undefined); }}
                aria-invalid={!!fieldError} aria-describedby={fieldError ? 'pw-err' : undefined}
              />
              <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldError && <p className="field__error" id="pw-err">{fieldError}</p>}
          </div>

          <div className="login__row">
            <span />
            <Link to="/forgot-password" className="link-lime">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? <><span className="spinner" aria-hidden="true" /> Signing in…</> : <>Sign in <ArrowRight /></>}
          </button>
          {slow && <p className="slow">Waking up the server — the first request can take up to a minute.</p>}
          <p className="secure"><ShieldIcon /> Secure partner login</p>
        </form>
      )}

      <footer className="welcome__help">
        New to Checkdin? Register through the onboarding portal — after approval you get an activation email.
        <br />Need help? Call <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>{SUPPORT_NUMBER}</a>, available 24&nbsp;×&nbsp;7.
      </footer>
    </main>
  );
}
