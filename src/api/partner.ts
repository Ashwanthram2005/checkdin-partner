import { api, unwrap } from './client';

const enc = encodeURIComponent;
const num = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const date = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

/* ───────────── auth ───────────── */

export interface AccountUser {
  id: string;
  name: string;
  role_id: string;
  active?: boolean;
  hotel_id?: string;
  hotel_name?: string;
}
export interface LoginResult {
  token: string;
  user: { id: string; name: string; hotel_id: string; role_id: string; email?: string };
}

export const lookupByEmail = (email: string) =>
  api<{ users: AccountUser[] }>('/api/auth/email/partner/users', { method: 'POST', body: { email }, auth: false });
export const lookupByHotelId = (hotelId: string) =>
  api<{ users: AccountUser[] }>('/api/auth/login/partner', { method: 'POST', body: { hotelId }, auth: false });
export const loginWithEmail = (email: string, userId: string, password: string) =>
  api<LoginResult>('/api/auth/email/partner/login', { method: 'POST', body: { email, user_id: userId, password }, auth: false });
export const loginWithHotelId = (hotelId: string, userId: string, password: string) =>
  api<LoginResult>('/api/auth/login/partner', { method: 'POST', body: { hotelId, userId, userPassword: password }, auth: false });
export const forgotPassword = (email: string) =>
  api<unknown>('/api/auth/partner/forgot-password', { method: 'POST', body: { email }, auth: false });
export const changePassword = (currentPassword: string, newPassword: string, confirmPassword: string) =>
  api<unknown>('/api/auth/partner/change-password', { method: 'POST', body: { currentPassword, newPassword, confirmPassword } });

export interface Me { id: string; name: string; hotel_id: string; role_id: string; phone?: string; email?: string }
export const getMe = () => api<Me>('/api/auth/me');

export interface Property { id: string; name: string; city: string; status: string }
export const getProperties = async () => unwrap<Property>(await api('/api/partner/properties'));

export interface Role { id: string; name: string; level: string; description: string; permissions: string[] }
export const getRoles = async () => unwrap<Role>(await api('/api/partner/roles'));

/* ───────────── bookings ───────────── */

export type BookingStatus = 'Upcoming' | 'Confirmed' | 'Checked in' | 'Completed' | 'Cancelled' | 'Expired' | 'No show';

/** Same grouping the partner portal uses for the raw server status. */
export function mapStatus(raw: unknown): BookingStatus {
  const t = String(raw ?? '').toLowerCase();
  if (t.includes('cancel') || t.includes('reject')) return 'Cancelled';
  if (t.includes('expired')) return 'Expired';
  if (t.includes('no_show') || t.includes('no-show') || t.includes('no show')) return 'No show';
  if (t.includes('checked_out') || t.includes('checked out') || t === 'completed') return 'Completed';
  if (t.includes('checked_in') || t.includes('checked in')) return 'Checked in';
  if (t.includes('confirmed')) return 'Confirmed';
  return 'Upcoming';
}

export type ExtensionStatus = 'Requested' | 'Approved' | 'Rejected' | 'Expired';
export interface BookingExtension {
  status: ExtensionStatus;
  extraHours: number;
  amount: number;
  requestedAt: Date | null;
  newCheckOut: Date | null;
  rejectionReason: string | null;
  respondedAt: Date | null;
  paymentStatus: string;
  paidTotal: number;
  hoursTotal: number;
}

export interface Booking {
  id: string;
  reference: string;
  guest: string;
  phone: string;
  guests: number;
  rooms: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hours: number | null;
  stayLabel: string;
  status: BookingStatus;
  rawStatus: string;
  amount: number;       // total the guest paid or owes
  base: number;         // price without GST
  tax: number;
  taxRate: number;
  platformFee: number;
  payAtHotel: number;
  payNow: number;
  paid: number;
  discount: number;
  stayType: string;
  nights: number | null;
  paymentStatus: string;
  payMode: string;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  createdAt: Date | null;
  extension: BookingExtension | null;
}

type Raw = Record<string, unknown>;

export function mapBooking(r: Raw): Booking {
  const pb = (r.price_breakdown ?? {}) as Raw;
  const checkIn = date(r.check_in) ?? date(r.date);
  const hours = Number.isFinite(Number(r.duration)) && Number(r.duration) > 0 ? Number(r.duration) : null;
  const fullday = r.stay_type === 'fullday';
  const checkOut = date(r.check_out) ?? (checkIn && hours ? new Date(checkIn.getTime() + hours * 3600_000) : null);
  const amount = num(r.amount, num(pb.total));
  const extStatus = r.extension_status ? (String(r.extension_status) as ExtensionStatus) : null;
  return {
    id: String(r.id ?? r.reference ?? ''),
    reference: String(r.reference ?? r.id ?? ''),
    guest: String(r.guest_name ?? r.customer_name ?? 'Guest'),
    phone: String(r.guest_phone ?? r.customer_phone ?? ''),
    guests: num(r.guests, 1),
    rooms: num(r.rooms, 1),
    checkIn,
    checkOut,
    hours,
    stayLabel: fullday ? 'Full day' : hours ? `${hours} Hours` : '—',
    status: mapStatus(r.status),
    rawStatus: String(r.status ?? ''),
    amount,
    base: num(pb.base, num(pb.unitPrice, amount)),
    tax: num(pb.tax),
    taxRate: num(pb.taxRate),
    platformFee: num(pb.platformFee, num(pb.serviceFee)),
    payAtHotel: num(pb.payAtHotel),
    payNow: num(pb.payNow),
    paid: num(r.paid_amount, num(pb.paidNow)),
    discount: num(pb.discount),
    stayType: String(r.stay_type ?? 'hourly'),
    nights: r.nights ? num(r.nights) : null,
    paymentStatus: String(r.payment_status ?? ''),
    payMode: String(r.pay_mode ?? ''),
    checkedInAt: date(r.check_in_time),
    checkedOutAt: date(r.check_out_time),
    createdAt: date(r.created_at),
    extension: extStatus
      ? {
          status: extStatus,
          extraHours: num(r.extension_extra_hours, 1),
          amount: num(r.extension_amount),
          requestedAt: date(r.extension_requested_at),
          newCheckOut: date(r.extension_check_out),
          rejectionReason: r.extension_rejection_reason ? String(r.extension_rejection_reason) : null,
          respondedAt: date(r.extension_responded_at),
          paymentStatus: String(r.extension_payment_status ?? ''),
          paidTotal: num(r.extension_paid_total),
          hoursTotal: num(r.extension_hours_total),
        }
      : null,
  };
}

export const getBookings = async () => unwrap<Raw>(await api('/api/partner/bookings')).map(mapBooking);
export const getExtensions = async () =>
  unwrap<Raw>(await api('/api/partner/extensions')).map(mapBooking).filter((b) => b.extension);

export interface OtpResult { otpSent?: boolean; destination?: string; resendIn?: number; message?: string }
export const sendCheckInOtp = (id: string) =>
  api<OtpResult>(`/api/partner/bookings/${enc(id)}/checkin/send-otp`, { method: 'POST', body: { purpose: 'checkin' } });
export const checkInBooking = (id: string, otp: string) =>
  api<{ ok?: boolean }>(`/api/partner/bookings/${enc(id)}/checkin`, { method: 'POST', body: { purpose: 'checkin', otp } });
export const approveExtension = (id: string) =>
  api<unknown>(`/api/partner/bookings/${enc(id)}/extension/approve`, { method: 'POST', body: {} });
export const rejectExtension = (id: string, reason: string) =>
  api<unknown>(`/api/partner/bookings/${enc(id)}/extension/reject`, { method: 'POST', body: { reason } });

/* ───────────── dashboard ───────────── */

export interface Dashboard {
  total_bookings: number; active_bookings: number; total_revenue: number; today_bookings: number;
  rooms_available: number; avg_rating: number; pending_reviews: number; open_tickets: number;
}
export const getDashboard = async (): Promise<Dashboard> => {
  const d = await api<Raw>('/api/partner/dashboard');
  return {
    total_bookings: num(d.total_bookings), active_bookings: num(d.active_bookings), total_revenue: num(d.total_revenue),
    today_bookings: num(d.today_bookings), rooms_available: num(d.rooms_available), avg_rating: num(d.avg_rating),
    pending_reviews: num(d.pending_reviews), open_tickets: num(d.open_tickets),
  };
};

/* ───────────── pricing ───────────── */

export type SlotKey = '3h' | '6h' | '9h' | '12h';
export const SLOT_KEYS: SlotKey[] = ['3h', '6h', '9h', '12h'];
export const SLOT_LABEL: Record<SlotKey, string> = { '3h': '3 Hours', '6h': '6 Hours', '9h': 'Overnight (9 Hours)', '12h': '12 Hours' };

export interface Pricing {
  base: Record<SlotKey, number>;
  active: Record<SlotKey, boolean>;
  extraHour: number;
  weekendSurcharge: number;
  fullDay: { price: number; active: boolean; checkIn: string; checkOut: string };
}

export async function getPricing(): Promise<Pricing> {
  const p = await api<Raw>('/api/partner/pricing');
  return {
    base: { '3h': num(p.price_3h), '6h': num(p.price_6h), '9h': num(p.price_9h), '12h': num(p.price_12h) },
    active: { '3h': p.active_3h !== false, '6h': p.active_6h !== false, '9h': p.active_9h !== false, '12h': p.active_12h !== false },
    extraHour: num(p.extra_hour),
    weekendSurcharge: num(p.weekend_surcharge),
    fullDay: {
      price: num(p.price_fullday), active: p.active_fullday !== false,
      checkIn: String(p.fullday_check_in ?? '12:00'), checkOut: String(p.fullday_check_out ?? '11:00'),
    },
  };
}
export const updatePricing = (p: Pricing) =>
  api<unknown>('/api/partner/pricing', {
    method: 'PUT',
    body: {
      price_3h: p.base['3h'], price_6h: p.base['6h'], price_9h: p.base['9h'], price_12h: p.base['12h'],
      extra_hour: p.extraHour, weekend_surcharge: p.weekendSurcharge,
      active_3h: p.active['3h'], active_6h: p.active['6h'], active_9h: p.active['9h'], active_12h: p.active['12h'],
      price_fullday: p.fullDay.price, active_fullday: p.fullDay.active,
      fullday_check_in: p.fullDay.checkIn, fullday_check_out: p.fullDay.checkOut,
    },
  });

export interface PricingRule { rule_id: string; group: string; label: string; window: string; adjustment: number; active: boolean }
export const getPricingRules = async (): Promise<PricingRule[]> =>
  unwrap<Raw>(await api('/api/partner/pricing-rules')).map((r) => ({
    rule_id: String(r.rule_id), group: String(r.rule_group ?? ''), label: String(r.label ?? ''),
    window: String(r.window_label ?? ''), adjustment: num(r.adjustment), active: !!r.active,
  }));
export const updatePricingRules = (rules: PricingRule[]) =>
  api<unknown>('/api/partner/pricing-rules', {
    method: 'PUT',
    body: { rules: rules.map((r) => ({ rule_id: r.rule_id, adjustment: r.adjustment, active: r.active })) },
  });

/* ───────────── property settings ───────────── */

export interface PropertySettings {
  propertyId: string;
  name: string;
  address: string;
  city: string;
  autoAcceptBookings: boolean;
  pauseBookings: boolean;
  description: string;
  amenities: string[];
  images: PhotoItem[];
  banking: { status: string; bankName: string; accountLast4: string; panStatus: string; gstStatus: string };
  account: { email: string; phone: string; partnerName: string; partnerStatus: string };
}
export interface PhotoItem { id: string; url: string; category: string; cover: boolean }
const toPhoto = (v: unknown, i: number): PhotoItem | null => {
  if (typeof v === 'string') return v ? { id: v, url: v, category: '', cover: i === 0 } : null;
  const o = (v ?? {}) as Raw;
  const url = String(o.url ?? o.src ?? o.dataUrl ?? o.image ?? '');
  if (!url) return null;
  return { id: String(o.id ?? o.photoId ?? url), url, category: String(o.category ?? ''), cover: !!(o.cover ?? o.isCover ?? o.is_cover) || (o.cover === undefined && i === 0) };
};
export const toPhotos = (v: unknown): PhotoItem[] => (Array.isArray(v) ? v : []).map(toPhoto).filter((x): x is PhotoItem => !!x);

export async function getPropertySettings(id: string): Promise<PropertySettings> {
  const s = await api<Raw>(`/api/partner/properties/${enc(id)}/settings`);
  const b = (s.banking ?? {}) as Raw;
  const a = (s.account ?? {}) as Raw;
  return {
    propertyId: String(s.propertyId ?? id), name: String(s.name ?? ''), address: String(s.address ?? ''), city: String(s.city ?? ''),
    autoAcceptBookings: !!s.autoAcceptBookings, pauseBookings: !!s.pauseBookings,
    description: String(s.description ?? ''),
    amenities: Array.isArray(s.amenities) ? (s.amenities as unknown[]).map(String) : [],
    images: toPhotos(s.images),
    banking: {
      status: String(b.status ?? ''), bankName: String(b.bankName ?? ''), accountLast4: String(b.accountLast4 ?? ''),
      panStatus: String(b.panStatus ?? ''), gstStatus: String(b.gstStatus ?? ''),
    },
    account: { email: String(a.email ?? ''), phone: String(a.phone ?? ''), partnerName: String(a.partnerName ?? ''), partnerStatus: String(a.partnerStatus ?? '') },
  };
}
export const updatePropertySettings = (id: string, patch: Partial<Pick<PropertySettings, 'autoAcceptBookings' | 'pauseBookings' | 'amenities' | 'description'>>) =>
  api<unknown>(`/api/partner/properties/${enc(id)}/settings`, { method: 'PUT', body: patch });

/* ───────────── payouts ───────────── */

export interface Payout { id: string; label: string; amount: number; status: string; reference: string; date: Date | null }
export const getPayouts = async (): Promise<Payout[]> =>
  unwrap<Raw>(await api('/api/partner/payouts')).map((r, i) => ({
    id: String(r.id ?? i),
    label: String(r.period ?? r.reference ?? r.id ?? 'Payout'),
    amount: num(r.net ?? r.amount ?? r.net_amount),
    status: String(r.status ?? ''),
    reference: String(r.utr ?? r.reference ?? ''),
    date: date(r.paid_at ?? r.requested_at ?? r.created_at),
  }));

/* ───────────── photos ───────────── */

export const uploadPhoto = async (id: string, dataUrl: string, category?: string, name?: string) =>
  toPhotos(((await api<Raw>(`/api/partner/properties/${enc(id)}/photos`, { method: 'POST', body: { dataUrl, ...(category ? { category } : {}), ...(name ? { name } : {}) } })).images));
export const deletePhoto = async (id: string, photoId: string) =>
  toPhotos(((await api<Raw>(`/api/partner/properties/${enc(id)}/photos/${enc(photoId)}`, { method: 'DELETE' })).images));
export const setCoverPhoto = async (id: string, photoId: string) =>
  toPhotos(((await api<Raw>(`/api/partner/properties/${enc(id)}/photos/cover`, { method: 'POST', body: { photoId } })).images));

/* ───────────── reviews ───────────── */

export interface Review {
  id: string; guest: string; rating: number; title: string; body: string; createdAt: Date | null;
  response: string | null; repliedOn: Date | null; room: string; hours: number | null;
}
export const getReviews = async (): Promise<Review[]> =>
  unwrap<Raw>(await api('/api/partner/reviews')).map((r) => ({
    id: String(r.id), guest: String(r.customer_name ?? r.guest_name ?? 'Guest'), rating: num(r.rating),
    title: String(r.title ?? ''), body: String(r.body ?? r.comment ?? ''), createdAt: date(r.created_at),
    response: r.response ? String(r.response) : null, repliedOn: date(r.replied_on), room: String(r.room ?? ''),
    hours: r.duration ? num(r.duration) : null,
  }));
export const replyToReview = (id: string, reply: string) =>
  api<unknown>(`/api/partner/reviews/${enc(id)}/reply`, { method: 'POST', body: { reply } });

/* ───────────── availability ───────────── */

export interface DayAvailability { date: string; day: string; allocated: number; booked: number; blocked: number }
export const getAvailability = async (): Promise<DayAvailability[]> =>
  unwrap<Raw>(await api('/api/partner/availability')).map((r) => ({
    date: String(r.date ?? '').slice(0, 10), day: String(r.day ?? ''), allocated: num(r.allocated), booked: num(r.booked), blocked: num(r.blocked),
  }));
/** Only these three fields are ever sent. */
export const saveAvailability = (dateKey: string, v: { day: string; allocated: number; blocked: number }) =>
  api<unknown>(`/api/partner/availability/${dateKey}`, { method: 'PUT', body: { day: v.day, allocated: v.allocated, blocked: v.blocked } });

/* ───────────── payout request (owner, needs an OTP) ───────────── */

export const sendPayoutOtp = () =>
  api<{ destination?: string; resendIn?: number }>('/api/partner/otp/send', { method: 'POST', body: { purpose: 'payout' } });
export const verifyPayoutOtp = (code: string) =>
  api<{ challengeToken?: string }>('/api/partner/otp/verify', { method: 'POST', body: { purpose: 'payout', code } });
export const requestPayout = (challengeToken: string) =>
  api<unknown>('/api/partner/payouts/request', { method: 'POST', body: { challengeToken } });
