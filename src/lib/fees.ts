/**
 * Checkdin's platform fee, taken from the property's earnings.
 *  - ₹79 + 18% GST (= ₹93.22) for every stay booking
 *  - NO platform fee on extension (stay-longer) charges
 */
export const PLATFORM_FEE_BASE = 79;
export const PLATFORM_FEE_GST_PCT = 18;
export const PLATFORM_FEE_GST = Math.round(PLATFORM_FEE_BASE * PLATFORM_FEE_GST_PCT) / 100; // 14.22
export const PLATFORM_FEE = Math.round((PLATFORM_FEE_BASE + PLATFORM_FEE_GST) * 100) / 100;   // 93.22
export const PLATFORM_FEE_TEXT = `₹${PLATFORM_FEE_BASE} + ${PLATFORM_FEE_GST_PCT}% GST`;

/** What the property keeps from one stay, before any extension. */
export const stayNet = (base: number) => base - PLATFORM_FEE;
