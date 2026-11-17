/**
 * GST on the slot price, exactly as the partner portal applies it:
 *  up to ₹1,000        → exempt (0%)
 *  ₹1,001 – ₹7,500     → 5%
 *  above ₹7,500        → 18%
 * The partner enters the price WITHOUT GST; guests see it GST-inclusive.
 */
export const gstPctFor = (base: number) => (base <= 1000 ? 0 : base <= 7500 ? 5 : 18);
export const gstAmount = (base: number) => Math.round((base * gstPctFor(base)) / 100);
export const guestPays = (base: number) => base + gstAmount(base);
