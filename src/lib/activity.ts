import { useCallback, useMemo, useState } from 'react';
import { getBookings, getExtensions, getReviews } from '../api/partner';
import { useApi } from '../api/useApi';
import { inr } from './format';

export type Priority = 'Critical' | 'High' | 'Normal';
export interface ActivityEvent {
  id: string;
  at: Date;
  title: string;
  detail: string;
  priority: Priority;
  link: string;
}

const SEEN = 'checkdin.partner.notifications.seen';
const readSeen = (): number => {
  try {
    const v = localStorage.getItem(SEEN);
    if (v) return Number(v);
    localStorage.setItem(SEEN, String(Date.now())); // first run: nothing counts as unread
    return Date.now();
  } catch { return Date.now(); }
};

/**
 * There is no notifications API, so this builds the feed from what the server does tell us:
 * new and cancelled bookings, check-ins, extension requests and reviews.
 */
export function useActivity() {
  const bookings = useApi(getBookings);
  const extensions = useApi(getExtensions);
  const reviews = useApi(getReviews);
  const [seen, setSeen] = useState(readSeen);

  const events = useMemo<ActivityEvent[]>(() => {
    const out: ActivityEvent[] = [];
    for (const b of bookings.data ?? []) {
      if (b.createdAt) {
        out.push(b.status === 'Cancelled'
          ? { id: `c-${b.id}`, at: b.createdAt, title: 'Booking cancelled', detail: `${b.guest} · ${b.stayLabel} · ${inr(b.amount)}`, priority: 'High', link: `/bookings/${b.id}` }
          : { id: `b-${b.id}`, at: b.createdAt, title: 'New booking', detail: `${b.guest} booked ${b.stayLabel} · ${inr(b.amount)}`, priority: 'Normal', link: `/bookings/${b.id}` });
      }
      if (b.checkedInAt) out.push({ id: `i-${b.id}`, at: b.checkedInAt, title: 'Guest checked in', detail: `${b.guest} · ${b.stayLabel}`, priority: 'Normal', link: `/bookings/${b.id}` });
    }
    for (const b of extensions.data ?? []) {
      const e = b.extension;
      if (!e?.requestedAt) continue;
      const live = e.status === 'Requested' && Date.now() - e.requestedAt.getTime() < 5 * 60_000;
      out.push({
        id: `x-${b.id}-${e.requestedAt.getTime()}`, at: e.requestedAt,
        title: live ? 'Extension request, answer now' : `Extension ${e.status.toLowerCase()}`,
        detail: `${b.guest} · +${e.extraHours}h · ${inr(e.amount)}`, priority: live ? 'Critical' : 'Normal', link: '/extensions',
      });
    }
    for (const r of reviews.data ?? []) {
      if (r.createdAt) out.push({ id: `r-${r.id}`, at: r.createdAt, title: `New ${r.rating}★ review`, detail: `${r.guest}${r.title ? ` · ${r.title}` : ''}`, priority: r.rating <= 3 ? 'High' : 'Normal', link: '/reviews' });
    }
    return out.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 60);
  }, [bookings.data, extensions.data, reviews.data]);

  const unread = events.filter((e) => e.at.getTime() > seen).length;
  const markAllRead = useCallback(() => {
    const now = Date.now();
    try { localStorage.setItem(SEEN, String(now)); } catch { /* ignore */ }
    setSeen(now);
  }, []);
  const reload = useCallback(() => { bookings.reload(); extensions.reload(); reviews.reload(); }, [bookings, extensions, reviews]);

  return {
    events, unread, seen, markAllRead, reload,
    loading: (bookings.loading && !bookings.data) || (extensions.loading && !extensions.data),
    error: bookings.error ?? null,
  };
}
