import {
  INITIAL_PRICING, PLATFORM_FEE_TOTAL, SLOTS, guestPays, withPct, type SlotHours,
} from './pricing';

export interface DayStat {
  date: string;        // yyyy-mm-dd
  bookings: number;
  slotRevenue: number; // sum of slot prices, before GST
  guestPaid: number;   // slot price + GST, what guests were charged
  gst: number;         // GST collected from guests (passed on to the government)
  fee: number;         // Checkdin platform fee (₹79 + 18% GST) × bookings
  net: number;         // what the property keeps = slotRevenue − fee
}

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Small seeded generator so the sample numbers are stable for a given day.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedOf = (key: string) => [...key].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

const WEIGHTS: Record<SlotHours, number> = { 3: 0.35, 6: 0.3, 9: 0.15, 12: 0.2 };

/**
 * MOCK DATA — one day of earnings, built from the pricing rules in ./pricing.ts
 * (weekend uplift, GST slab, ₹93 platform fee). Replace with the real earnings API.
 */
export function dayStat(d: Date): DayStat {
  const key = dayKey(d);
  const rand = mulberry32(seedOf(key));
  const weekend = [0, 5, 6].includes(d.getDay()); // Fri, Sat, Sun
  const { rates, adjustments } = INITIAL_PRICING;
  const bookings = 5 + Math.floor(rand() * 8) + (weekend ? 3 : 0);

  let slotRevenue = 0, guestPaid = 0;
  for (let i = 0; i < bookings; i++) {
    let r = rand(), slot: SlotHours = 12;
    for (const h of SLOTS) { if ((r -= WEIGHTS[h]) < 0) { slot = h; break; } }
    const price = weekend && adjustments.weekendOn ? withPct(rates[slot], adjustments.weekendPct) : rates[slot];
    slotRevenue += price;
    guestPaid += guestPays(price);
  }
  const fee = bookings * PLATFORM_FEE_TOTAL;
  return { date: key, bookings, slotRevenue, guestPaid, gst: guestPaid - slotRevenue, fee, net: slotRevenue - fee };
}

export function range(from: Date, to: Date): DayStat[] {
  const out: DayStat[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(dayStat(d));
  return out;
}

export interface Totals { bookings: number; slotRevenue: number; guestPaid: number; gst: number; fee: number; net: number }
export const sum = (days: DayStat[]): Totals =>
  days.reduce((t, d) => ({
    bookings: t.bookings + d.bookings, slotRevenue: t.slotRevenue + d.slotRevenue, guestPaid: t.guestPaid + d.guestPaid,
    gst: t.gst + d.gst, fee: t.fee + d.fee, net: t.net + d.net,
  }), { bookings: 0, slotRevenue: 0, guestPaid: 0, gst: 0, fee: 0, net: 0 });

export type PayoutStatus = 'Paid' | 'Processing' | 'Scheduled';
export interface Payout {
  id: string;
  from: Date;
  to: Date;
  payoutDate: Date;
  status: PayoutStatus;
  utr: string | null;
  totals: Totals;
}

/** Weekly settlement: Monday–Sunday earnings are paid out the following Wednesday. MOCK. */
export function payouts(today: Date, weeks = 4): Payout[] {
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const out: Payout[] = [];
  for (let k = 1; k <= weeks; k++) {
    const from = addDays(monday, -7 * k);
    const to = addDays(from, 6);
    const payoutDate = addDays(to, 3);
    const t = dayKey(today), p = dayKey(payoutDate);
    const status: PayoutStatus = p > t ? 'Scheduled' : p === t ? 'Processing' : 'Paid';
    out.push({
      id: `PO-${dayKey(from).replace(/-/g, '')}`, from, to, payoutDate, status,
      utr: status === 'Paid' ? `UTR${Math.abs(seedOf(dayKey(from))).toString().padStart(12, '0').slice(0, 12)}` : null,
      totals: sum(range(from, to)),
    });
  }
  return out;
}

/** MOCK bank account shown on the payout card. */
export const BANK = { name: 'HDFC Bank', last4: '4821' };
