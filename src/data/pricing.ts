export type SlotHours = 3 | 6 | 9 | 12;
export const SLOTS: SlotHours[] = [3, 6, 9, 12];

export type Rates = Record<SlotHours, number>; // price per slot, in ₹, before GST

export interface Adjustments {
  weekendOn: boolean;
  weekendPct: number;    // surcharge on Fri–Sun
  lastMinuteOn: boolean;
  lastMinutePct: number; // discount for same-day bookings
}

export interface PricingState {
  rates: Rates;
  adjustments: Adjustments;
}

/** Platform numbers. There is no commission: Checkdin charges a flat fee per booking. */
export const GST_PCT = 18;
export const PLATFORM_FEE = 79;                                  // ₹ per booking, before GST
export const PLATFORM_FEE_GST = PLATFORM_FEE * (GST_PCT / 100);  // 14.22
export const PLATFORM_FEE_TOTAL = Math.round(PLATFORM_FEE + PLATFORM_FEE_GST); // ₹93
export const MIN_RATE = 100;

/** MOCK DATA — replace with the real pricing API. */
export const INITIAL_PRICING: PricingState = {
  rates: { 3: 600, 6: 900, 9: 1200, 12: 1400 },
  adjustments: { weekendOn: true, weekendPct: 15, lastMinuteOn: false, lastMinutePct: 10 },
};

export const guestPays = (rate: number) => Math.round(rate * (1 + GST_PCT / 100));
/** What the property keeps: the slot price minus the platform fee (₹79 + 18% GST). */
export const youEarn = (rate: number) => Math.max(0, rate - PLATFORM_FEE_TOTAL);
export const withPct = (rate: number, pct: number) => Math.round(rate * (1 + pct / 100));

/** A longer slot should never cost less than a shorter one. */
export function rateErrors(rates: Rates): Partial<Record<SlotHours, string>> {
  const e: Partial<Record<SlotHours, string>> = {};
  SLOTS.forEach((h, i) => {
    if (!(rates[h] >= MIN_RATE)) e[h] = `Minimum rate is ₹${MIN_RATE}`;
    else if (i > 0 && rates[h] < rates[SLOTS[i - 1]]) e[h] = `Should be at least the ${SLOTS[i - 1]}-hour rate`;
  });
  return e;
}
