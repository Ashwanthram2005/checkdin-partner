import type { Booking } from '../api/partner';
import { fmtTime } from './format';

export const TEMPLATES = [
  { id: 'welcome', label: 'Welcome', text: 'Hi {guest}, welcome to {hotel}! We’re ready for your stay. Let us know if you need anything.' },
  { id: 'arrival', label: 'Arrival', text: 'Hi {guest}, your {stay} stay at {hotel} starts at {time}. Please carry a valid ID. See you soon!' },
  { id: 'checkout', label: 'Check-out', text: 'Hi {guest}, a gentle reminder that your check-out from {hotel} is at {out}. Thank you for staying with us.' },
  { id: 'thanks', label: 'Thank you', text: 'Hi {guest}, thank you for staying at {hotel}. We’d love your review on the Checkdin app. It really helps!' },
] as const;

/** Fill {guest}, {hotel}, {stay}, {time}, {out} for one booking. */
export function fillTemplate(text: string, b: Booking, hotel: string) {
  return text
    .replace(/\{guest\}/g, b.guest.split(' ')[0] || 'there')
    .replace(/\{hotel\}/g, hotel)
    .replace(/\{stay\}/g, b.stayLabel.toLowerCase())
    .replace(/\{time\}/g, b.checkIn ? fmtTime(b.checkIn) : 'your booked time')
    .replace(/\{out\}/g, b.checkOut ? fmtTime(b.checkOut) : 'your booked time');
}

/** Indian numbers are stored without the country code. */
export const intlPhone = (phone: string) => { const d = phone.replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d; };
