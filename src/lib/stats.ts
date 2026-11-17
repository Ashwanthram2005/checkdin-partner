import type { Booking } from '../api/partner';
import { addDays, dayKey } from './format';

/** Stays that have actually happened count as earnings. */
export const EARNED = new Set(['Checked in', 'Completed']);

export interface Day { date: string; label: string; bookings: number; base: number; fee: number; tax: number; paid: number; net: number }
export interface Totals { bookings: number; base: number; fee: number; tax: number; paid: number; net: number }

/** One row per calendar day from `from` to `to`, from stays that checked in or finished. */
export function dayStats(bookings: Booking[], from: Date, to: Date): Day[] {
  const days: Day[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push({ date: dayKey(d), label: '', bookings: 0, base: 0, fee: 0, tax: 0, paid: 0, net: 0 });
  const idx = new Map(days.map((d, i) => [d.date, i]));
  for (const b of bookings) {
    if (!b.checkIn || !EARNED.has(b.status)) continue;
    const i = idx.get(dayKey(b.checkIn));
    if (i === undefined) continue;
    const d = days[i];
    d.bookings += 1; d.base += b.base; d.fee += b.platformFee; d.tax += b.tax; d.paid += b.amount;
    d.net += b.base - b.platformFee;
  }
  return days;
}

export const sum = (days: Day[]): Totals =>
  days.reduce((t, d) => ({ bookings: t.bookings + d.bookings, base: t.base + d.base, fee: t.fee + d.fee, tax: t.tax + d.tax, paid: t.paid + d.paid, net: t.net + d.net }), { bookings: 0, base: 0, fee: 0, tax: 0, paid: 0, net: 0 });

export function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 1.2, 1.6, 2, 3, 4, 6, 8, 10].find((x) => x >= v / p) ?? 10) * p;
}
export const tickLabel = (v: number, compact: boolean) => (compact && v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : v.toLocaleString('en-IN'));

export type Confidence = 'none' | 'low' | 'medium' | 'high';

export interface Forecast {
  earnedSoFar: number;       // this month, from stays already done
  bookedAhead: number;       // net of confirmed stays still to come this month
  expectedRest: number;      // trend for the remaining days
  expectedTotal: number;
  avgPerDay: number;
  daysLeft: number;
  confidence: Confidence;
  stays30: number;
}

/**
 * A simple, honest projection for the rest of this month: what has been earned,
 * plus stays already booked, plus the recent daily average for the days that have no bookings yet.
 */
export function forecastMonth(bookings: Booking[], today: Date): Forecast {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const todayKey = dayKey(today);
  const earnedSoFar = sum(dayStats(bookings, monthStart, today)).net;

  const last14 = sum(dayStats(bookings, addDays(today, -13), today));
  const stays30 = sum(dayStats(bookings, addDays(today, -29), today)).bookings;
  const avgPerDay = last14.net / 14;

  const future = bookings.filter((b) => b.checkIn && dayKey(b.checkIn) > todayKey && dayKey(b.checkIn) <= dayKey(monthEnd) && (b.status === 'Confirmed' || b.status === 'Upcoming'));
  const bookedAhead = future.reduce((t, b) => t + b.base - b.platformFee, 0);
  const daysLeft = Math.max(0, monthEnd.getDate() - today.getDate());
  const bookedDays = new Set(future.map((b) => dayKey(b.checkIn!))).size;
  const expectedRest = Math.max(0, daysLeft - bookedDays) * avgPerDay;

  const confidence: Confidence = stays30 < 3 ? 'none' : stays30 < 10 ? 'low' : stays30 < 30 ? 'medium' : 'high';
  return { earnedSoFar, bookedAhead, expectedRest, expectedTotal: earnedSoFar + bookedAhead + expectedRest, avgPerDay, daysLeft, confidence, stays30 };
}
