export type SlotHours = 3 | 6 | 12;
export const SLOTS: SlotHours[] = [3, 6, 12];

export interface RoomType {
  id: string;
  name: string;
  rooms: number;
  rates: Record<SlotHours, number>; // base price per stay, in ₹, before GST
}

export interface Adjustments {
  weekendOn: boolean;
  weekendPct: number;   // surcharge on Fri–Sun
  lastMinuteOn: boolean;
  lastMinutePct: number; // discount for same-day bookings
}

export interface PricingState {
  rooms: RoomType[];
  adjustments: Adjustments;
}

/** Platform numbers (backend `settings` table: tax_rate, commission_rate, min_booking_amount). */
export const GST_PCT = 18;
export const COMMISSION_PCT = 15;
export const MIN_RATE = 100;

/** MOCK DATA — replace with the real pricing API. */
export const INITIAL_PRICING: PricingState = {
  rooms: [
    { id: 'std', name: 'Standard', rooms: 12, rates: { 3: 600, 6: 900, 12: 1400 } },
    { id: 'dlx', name: 'Deluxe', rooms: 8, rates: { 3: 800, 6: 1200, 12: 1900 } },
    { id: 'ste', name: 'Suite', rooms: 3, rates: { 3: 1200, 6: 1800, 12: 2800 } },
  ],
  adjustments: { weekendOn: true, weekendPct: 15, lastMinuteOn: false, lastMinutePct: 10 },
};

export const guestPays = (rate: number) => Math.round(rate * (1 + GST_PCT / 100));
export const youEarn = (rate: number) => Math.round(rate * (1 - COMMISSION_PCT / 100));
export const withPct = (rate: number, pct: number) => Math.round(rate * (1 + pct / 100));

/** Returns a message per slot when a rate is not allowed. */
export function rateErrors(rates: Record<SlotHours, number>): Partial<Record<SlotHours, string>> {
  const e: Partial<Record<SlotHours, string>> = {};
  for (const h of SLOTS) if (!(rates[h] >= MIN_RATE)) e[h] = `Minimum rate is ₹${MIN_RATE}`;
  if (!e[6] && rates[6] < rates[3]) e[6] = 'Should be at least the 3-hour rate';
  if (!e[12] && rates[12] < rates[6]) e[12] = 'Should be at least the 6-hour rate';
  return e;
}
