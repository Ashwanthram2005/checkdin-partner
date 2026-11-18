import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import room from '../assets/welcome-room.jpg';
import hotel from '../assets/welcome-hotel.jpg';
import mark from '../assets/logo-mark.png';
import wordmarkWhite from '../assets/logo-wordmark-white.png';
import { ArrowRight, BedIcon, BoltIcon, CalendarIcon, ChartBarIcon, CloseIcon, ExternalIcon, HeadsetIcon, MenuIcon, PhoneIcon, ShieldIcon } from '../components/Icons';
import { SUPPORT_NUMBER } from '../config';
import '../styles/welcome.css';

const ONBOARDING = 'https://checkdin-onboard.web.app';
const TEL = `tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`;

/** A small clipboard-with-tick illustration for the "new partner" card. */
function ClipboardArt() {
  return (
    <svg viewBox="0 0 160 150" className="wl-art" role="img" aria-label="Checklist" focusable="false">
      <defs>
        <linearGradient id="wl-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a5a24" /><stop offset="1" stopColor="#1d3a1c" /></linearGradient>
        <linearGradient id="wl-g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4f7a2c" /><stop offset="1" stopColor="#2a4a22" /></linearGradient>
      </defs>
      <rect x="6" y="52" width="86" height="86" rx="20" fill="url(#wl-g1)" opacity=".85" />
      <rect x="26" y="18" width="116" height="118" rx="22" fill="url(#wl-g2)" opacity=".85" />
      <g transform="rotate(9 80 78)">
        <rect x="44" y="26" width="76" height="98" rx="12" fill="#fff" />
        <rect x="68" y="16" width="28" height="18" rx="9" fill="#d0f047" />
        <rect x="56" y="48" width="48" height="6" rx="3" fill="#d0f047" />
        <rect x="56" y="64" width="40" height="6" rx="3" fill="#d0f047" />
        <rect x="56" y="80" width="26" height="6" rx="3" fill="#d0f047" />
      </g>
      <circle cx="116" cy="112" r="24" fill="#d0f047" />
      <path d="M104 112l8 8 14-16" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Welcome() {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <main className="wl">
      <section className="wl-hero" style={{ backgroundImage: `linear-gradient(90deg, #0b100d 0%, rgba(11,16,13,.92) 22%, rgba(11,16,13,.5) 52%, rgba(11,16,13,0) 80%), linear-gradient(0deg, rgba(11,16,13,.55), rgba(11,16,13,0) 38%), url(${room})` }}>
        <header className="wl-top">
          <div className="wl-brand" role="img" aria-label="Checkdin Partner">
            <img src={mark} alt="" width={40} height={39} />
            <img src={wordmarkWhite} alt="" height={22} />
            <span className="wl-pill">Partner</span>
          </div>
          <button type="button" className="wl-menu" aria-label="Open menu" aria-haspopup="dialog" onClick={() => setMenu(true)}><MenuIcon /></button>
        </header>

        <h1 className="wl-title">Become a<br />Checkdin Partner</h1>
        <p className="wl-sub">List your property, manage bookings, and earn more with short-stay demand.</p>

        <ul className="wl-feats">
          <li><CalendarIcon size={26} /><span>More Bookings</span></li>
          <li><ChartBarIcon size={26} /><span>Better Revenue</span></li>
          <li><BoltIcon size={26} /><span>Quick Onboarding</span></li>
        </ul>
      </section>

      <div className="wl-body">
        <section className="wl-card wl-card--login" aria-labelledby="wl-login">
          <img className="wl-card__img" src={hotel} alt="" width={96} height={96} />
          <div className="wl-card__text">
            <span className="wl-tag">EXISTING PARTNER</span>
            <h2 id="wl-login">Login to Your Dashboard</h2>
            <p>Manage your property, bookings, pricing, availability and payouts.</p>
            <Link to="/login" className="wl-btn wl-btn--dark">Login to Dashboard <ArrowRight size={20} /></Link>
          </div>
        </section>

        <section className="wl-card wl-card--new" aria-labelledby="wl-new">
          <ClipboardArt />
          <div className="wl-card__text">
            <span className="wl-tag">NEW PARTNER</span>
            <h2 id="wl-new">List Your Property on Checkdin</h2>
            <p>Join our hotel network and start receiving short-stay bookings in just a few steps.</p>
            <a href={ONBOARDING} target="_blank" rel="noreferrer" className="wl-btn wl-btn--lime">Get Started – Onboarding Portal <ExternalIcon size={20} /></a>
          </div>
        </section>

        <ul className="wl-trust" aria-label="Why Checkdin">
          <li><span className="wl-trust__icon"><BedIcon /></span><span>3 / 6 / 9 / 12 Hour Booking Slots</span></li>
          <li><span className="wl-trust__icon"><ShieldIcon size={24} /></span><span>Trusted &amp; Secure Platform</span></li>
          <li><a href={TEL} aria-label={`Dedicated partner support, call ${SUPPORT_NUMBER}`}><span className="wl-trust__icon"><HeadsetIcon /></span><span>Dedicated Partner Support</span></a></li>
        </ul>
      </div>

      {menu && (
        <div className="sheet-wrap">
          <button type="button" className="sheet-scrim" aria-label="Close menu" onClick={() => setMenu(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="sheet__grab" aria-hidden="true" />
            <header className="sheet__head"><h2>Menu</h2><button type="button" className="icon-btn icon-btn--sm" onClick={() => setMenu(false)} aria-label="Close"><CloseIcon /></button></header>
            <ul className="wl-menu-list">
              <li><Link to="/login" onClick={() => setMenu(false)}>Login to Dashboard <ArrowRight size={18} /></Link></li>
              <li><a href={ONBOARDING} target="_blank" rel="noreferrer">Become a partner (onboarding portal) <ExternalIcon size={18} /></a></li>
              <li><Link to="/activate" onClick={() => setMenu(false)}>Activate your account <ArrowRight size={18} /></Link></li>
              <li><a href={TEL}><span>Call partner support · {SUPPORT_NUMBER}</span> <PhoneIcon size={18} /></a></li>
            </ul>
            <p className="wl-menu-note">Partner support is available 24 × 7.</p>
          </div>
        </div>
      )}
    </main>
  );
}
