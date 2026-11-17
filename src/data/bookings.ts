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
  durationHours: 3 | 6 | 9 | 12;
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

/**
 * Extra sample bookings so every state can be reviewed: open /bookings?demo=1
 * Remove once the real API is connected.
 */
export const demoBookings = (): Booking[] => {
  const t = new Date();
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + days, h, m);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(h)}:${p(m)}`;
  };
  return [
    { id: 'a91d37e20b14', code: 'CHK2468', guest: 'Priya Nair', phone: '9876501234', checkIn: at(0, 20), checkOut: at(0, 23), durationHours: 3, source: 'Checkdin App', amount: 920, payment: 'pending', status: 'Pending Approval', extension: 'None', requestExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString() },
    { id: 'c40b8e1f7a92', code: 'CHK2466', guest: 'Rahul Verma', phone: '9123456780', checkIn: at(0, 18, 30), checkOut: at(1, 0, 30), durationHours: 6, source: 'Walk-in', amount: 1450, payment: 'paid', status: 'Confirmed', extension: 'None', requestExpiresAt: null },
    { id: 'e27f6a03d5c1', code: 'CHK2459', guest: 'Meena Das', phone: '9988776655', checkIn: at(0, 13), checkOut: at(0, 19), durationHours: 6, source: 'Checkdin App', amount: 1380, payment: 'paid', status: 'Checked In', extension: '+1 hr', requestExpiresAt: null },
    { id: 'b58c92d14e07', code: 'CHK2441', guest: 'Arjun Rao', phone: '9090909090', checkIn: at(-2, 9), checkOut: at(-2, 21), durationHours: 12, source: 'Checkdin App', amount: 2100, payment: 'paid', status: 'Checked Out', extension: 'None', requestExpiresAt: null },
  ];
};
