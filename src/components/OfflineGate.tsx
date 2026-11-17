import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Brand from './Brand';
import { CheckCircleIcon, RefreshIcon, WifiOffIcon } from './Icons';
import { REFRESH_EVENT } from '../api/useApi';
import { SUPPORT_NUMBER } from '../config';
import { useNetwork } from '../lib/network';

/**
 * Full-screen "no connection" view. It sits on top of the app (so nothing you were typing is lost)
 * and goes away by itself the moment the connection is back.
 */
export default function OfflineGate() {
  const { deviceOffline, serverDown, check } = useNetwork();
  const { pathname } = useLocation();
  const [checking, setChecking] = useState(false);
  const [stillDown, setStillDown] = useState(false);
  const [back, setBack] = useState(false);
  const wasDown = useRef(false);

  const down = (deviceOffline || serverDown) && pathname !== '/';

  // came back: refresh every list and say so
  useEffect(() => {
    if (down) { wasDown.current = true; return; }
    if (wasDown.current) {
      wasDown.current = false;
      window.dispatchEvent(new Event(REFRESH_EVENT));
      setBack(true);
      const t = setTimeout(() => setBack(false), 2600);
      return () => clearTimeout(t);
    }
  }, [down]);

  // keep trying quietly while this screen is up
  useEffect(() => {
    if (!down) return;
    const t = setInterval(() => { void check(); }, 10000);
    return () => clearInterval(t);
  }, [down, check]);

  async function retry() {
    setChecking(true); setStillDown(false);
    const ok = await check();
    setChecking(false);
    if (!ok) setStillDown(true);
  }

  if (down) {
    return (
      <div className="offline" role="alertdialog" aria-modal="true" aria-labelledby="off-title" aria-describedby="off-text">
        <Brand />
        <div className="offline__art" aria-hidden="true"><WifiOffIcon size={44} /></div>
        <h1 id="off-title">{deviceOffline ? 'You’re offline' : 'Can’t reach Checkdin'}</h1>
        <p id="off-text">
          {deviceOffline
            ? 'Check your Wi-Fi or mobile data, then try again. We’ll reconnect by ourselves as soon as you’re back online.'
            : 'Checkdin isn’t answering right now. This is usually brief. Nothing was lost, and we’ll keep trying.'}
        </p>
        {stillDown && <p className="offline__still" role="status">Still no connection. Please try again in a moment.</p>}
        <button type="button" className="btn btn--lime offline__btn" onClick={retry} disabled={checking}>
          {checking ? <><span className="spinner" aria-hidden="true" /> Checking…</> : <><RefreshIcon size={20} /> Try again</>}
        </button>
        <a className="offline__call" href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>Need help? Call {SUPPORT_NUMBER}</a>
      </div>
    );
  }

  return back ? <div className="toast" role="status"><CheckCircleIcon /> Back online</div> : null;
}
