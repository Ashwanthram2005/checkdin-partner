import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const ALLOWED = ['/activate', '/reset-password'];

/** On the phone, links from the activation / reset emails open the matching screen in the app. */
export default function DeepLinks() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    const open = (url: string) => {
      try {
        const u = new URL(url);
        if (u.hostname.endsWith('checkdin.in') && ALLOWED.some((p) => u.pathname.startsWith(p))) navigate(`${u.pathname}${u.search}`, { replace: true });
      } catch { /* ignore a link we can't read */ }
    };
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const launch = await App.getLaunchUrl();
        if (launch?.url) open(launch.url);
        const h = await App.addListener('appUrlOpen', (e) => open(e.url));
        remove = () => void h.remove();
      } catch { /* the plugin isn't available */ }
    })();
    return () => remove?.();
  }, [navigate]);
  return null;
}
