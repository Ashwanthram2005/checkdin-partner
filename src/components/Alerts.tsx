import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { getBookings, getConversations, getExtensions } from '../api/partner';
import { REFRESH_EVENT } from '../api/useApi';
import { BellIcon, CloseIcon } from './Icons';
import { inr } from '../lib/format';

interface Banner { id: string; title: string; body: string; link: string }
const POLL_MS = 30_000;

async function nativeNotify(id: number, title: string, body: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({ notifications: [{ id, title, body, channelId: 'requests', schedule: { at: new Date(Date.now() + 300) } }] });
  } catch { /* notifications may be switched off, the in-app banner still shows */ }
}

/**
 * Alerts for new extension requests and bookings, while the app is open.
 * (True push alerts when the app is closed need support on the server; see docs.)
 */
export default function Alerts() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.requestPermissions();
        await LocalNotifications.createChannel({ id: 'requests', name: 'New requests and bookings', description: 'Extension requests and new bookings', importance: 5, vibration: true, visibility: 1 });
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    let stop = false;
    async function poll() {
      if (document.visibilityState === 'hidden') return;
      try {
        const [ext, books, chats] = await Promise.all([getExtensions(), getBookings(), getConversations().catch(() => ({ available: false, items: [] }))]);
        const now = Date.now();
        const found: Banner[] = [];
        for (const b of ext) {
          const e = b.extension;
          if (e?.status === 'Requested' && e.requestedAt && now - e.requestedAt.getTime() < 5 * 60_000) {
            found.push({ id: `x-${b.id}-${e.requestedAt.getTime()}`, title: 'Extension request', body: `${b.guest} wants +${e.extraHours}h (${inr(e.amount)}). Answer within 5 minutes.`, link: '/extensions' });
          }
        }
        for (const b of books) {
          if (b.createdAt && now - b.createdAt.getTime() < 10 * 60_000 && b.status !== 'Cancelled' && b.status !== 'Expired') {
            found.push({ id: `b-${b.id}`, title: 'New booking', body: `${b.guest} booked ${b.stayLabel} (${inr(b.amount)}).`, link: '/bookings' });
          }
        }
        for (const c of chats.items) {
          if (c.unread > 0 && c.lastFrom === 'guest' && c.lastAt) {
            const who = books.find((b) => b.id === c.bookingId)?.guest ?? 'A guest';
            found.push({ id: `m-${c.bookingId}-${c.lastAt.getTime()}`, title: `New message from ${who}`, body: c.last.slice(0, 90), link: `/messages/${encodeURIComponent(c.bookingId)}` });
          }
        }
        if (stop) return;
        if (known.current === null) { known.current = new Set(found.map((f) => f.id)); return; } // first look: don't alert for old things
        const fresh = found.filter((f) => !known.current!.has(f.id));
        fresh.forEach((f) => known.current!.add(f.id));
        if (fresh.length) {
          const f = fresh[0];
          setBanner(f);
          window.dispatchEvent(new Event(REFRESH_EVENT));
          try { navigator.vibrate?.([250, 120, 250]); } catch { /* ignore */ }
          void nativeNotify(Math.floor(Math.random() * 2_000_000), f.title, f.body);
        }
      } catch { /* a missed poll is fine, the next one retries */ }
    }
    void poll();
    const t = setInterval(poll, POLL_MS);
    const vis = () => document.visibilityState === 'visible' && void poll();
    document.addEventListener('visibilitychange', vis);
    return () => { stop = true; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 12_000);
    return () => clearTimeout(t);
  }, [banner]);

  if (!banner) return null;
  return (
    <div className="alert-banner" role="alert" aria-live="assertive">
      <span className="alert-banner__icon"><BellIcon /></span>
      <Link to={banner.link} className="alert-banner__text" onClick={() => setBanner(null)}><strong>{banner.title}</strong><small>{banner.body}</small></Link>
      <button type="button" className="icon-btn icon-btn--sm" onClick={() => setBanner(null)} aria-label="Dismiss"><CloseIcon /></button>
    </div>
  );
}
