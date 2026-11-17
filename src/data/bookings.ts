export type BookingStatus =
  | 'Pending Approval' | 'Confirmed' | 'Checked In' | 'Checked Out'
  | 'Cancelled' | 'No Show' | 'Expired';

export const STATUSES: BookingStatus[] = [
  'Pending Approval', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show', 'Expired',
];

export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface Booking {
  id: string;
  code: string;
  guest: string;
  phone: string;
  checkIn: string;          // ISO local date-time
  checkOut: string | null;  // ISO local date-time, null until known
  durationHours: 3 | 6 | 12;
  source: string;
  amount: number;
  payment: PaymentStatus;
  status: BookingStatus;
  extension: string;        // e.g. "None", "+1 hr"
  requestExpiresAt: string | null; // only for Pending Approval: when the accept timer runs out
}

/**
 * MOCK DATA — replace with the real bookings API.
 * (Backend: `bookings` table in schema.sql.)
 */
export const BOOKINGS: Booking[] = [
  {
    id: 'bcf28cb450c8',
    code: 'CHK2451',
    guest: 'Ashwanth',
    phone: '6382184823',
    checkIn: '2026-11-11T19:30',
    checkOut: null,
    durationHours: 3,
    source: 'Checkdin App',
    amount: 848,
    payment: 'paid',
    status: 'Cancelled',
    extension: 'None',
    requestExpiresAt: null,
  },
];
