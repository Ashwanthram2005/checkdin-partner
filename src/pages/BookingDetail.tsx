import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import CheckInSheet from '../components/CheckInSheet';
import SubPage from '../components/SubPage';
import { AlertIcon, ClockIcon, InfoIcon, MessageIcon, PhoneIcon } from '../components/Icons';
import { getBookings, type Booking } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { fmtDate, fmtTime, inr, initials } from '../lib/format';
import { PLATFORM_FEE, PLATFORM_FEE_TEXT, stayNet } from '../lib/fees';
import '../styles/detail.css';

const when = (d: Date | null) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—');
const pill = (s: string) => 'pill pill--' + s.toLowerCase().replace(/\s+/g, '-');

function Row({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return <div className={`drow${strong ? ' drow--strong' : ''}`}><dt>{label}</dt><dd>{children}</dd></div>;
}

function timeline(b: Booking) {
  const ev: { at: Date; text: string }[] = [];
  if (b.createdAt) ev.push({ at: b.createdAt, text: 'Booking made' });
  if (b.checkedInAt) ev.push({ at: b.checkedInAt, text: 'Guest checked in' });
  const e = b.extension;
  if (e?.requestedAt) ev.push({ at: e.requestedAt, text: `Asked to stay ${e.extraHours} more ${e.extraHours === 1 ? 'hour' : 'hours'}` });
  if (e?.respondedAt) ev.push({ at: e.respondedAt, text: `Extension ${e.status.toLowerCase()}` });
  if (b.checkedOutAt) ev.push({ at: b.checkedOutAt, text: 'Guest checked out' });
  return ev.sort((a, c) => a.at.getTime() - c.at.getTime());
}

export default function BookingDetail() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { data, error, loading, reload } = useApi(getBookings);
  const [checkIn, setCheckIn] = useState(false);

  const b = (data ?? []).find((x) => x.id === id || x.reference === id) ?? null;
  const canCheckIn = can('checkin') || can('bookings');

  if (loading && !data) return <SubPage title="Booking" subtitle="Loading…"><p className="muted-note">Loading the booking…</p></SubPage>;
  if (error && !data) return <SubPage title="Booking"><div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div></SubPage>;
  if (!b) return <SubPage title="Booking"><div className="empty"><strong>Booking not found</strong><span>It may have been removed. <Link to="/bookings" className="link-btn">Back to bookings</Link></span></div></SubPage>;

  const ready = b.status === 'Confirmed' || b.status === 'Upcoming';
  const e = b.extension;
  const owesAtHotel = b.paymentStatus.toLowerCase() !== 'paid' && b.payAtHotel > 0;
  const events = timeline(b);
  const counts = b.status !== 'Cancelled' && b.status !== 'Expired' && b.status !== 'No show';
  const extEarn = e?.status === 'Approved' ? e.amount : 0;

  return (
    <SubPage title={b.guest} subtitle={`#${b.reference}`}>
      <section className="panel dhead" aria-label="Summary">
        <div className="dhead__top">
          <span className="avatar avatar--lg" aria-hidden="true">{initials(b.guest)}</span>
          <div className="dhead__who"><strong>{b.guest}</strong><span className={pill(b.status)}>{b.status}</span></div>
          <div className="dhead__amt"><strong>{inr(b.amount)}</strong><small className={`pay pay--${b.paymentStatus.toLowerCase()}`}>{b.paymentStatus || '—'}</small></div>
        </div>
        <div className="actions">
          <a className="abtn abtn--dark dbtn" href={b.phone ? `tel:${b.phone}` : undefined} aria-disabled={!b.phone}><PhoneIcon size={18} /> Call</a>
          {b.status !== 'Cancelled' && b.status !== 'Expired' && <Link className="abtn abtn--ghost dbtn" to={`/messages/${encodeURIComponent(b.id)}`}><MessageIcon size={18} /> Message</Link>}
        </div>
        {ready && canCheckIn && <button type="button" className="abtn abtn--lime dwide" onClick={() => setCheckIn(true)}>Check in guest</button>}
      </section>

      <section className="panel" aria-label="Stay">
        <h2>Stay</h2>
        <dl className="dl">
          <Row label="Check-in">{when(b.checkIn)}</Row>
          <Row label="Check-out">{when(b.checkOut)}</Row>
          <Row label="Stay length">{b.stayLabel}{b.nights ? ` · ${b.nights} ${b.nights === 1 ? 'night' : 'nights'}` : ''}</Row>
          <Row label="Guests">{b.guests}</Row>
          <Row label="Rooms">{b.rooms}</Row>
          {b.checkedInAt && <Row label="Checked in at">{when(b.checkedInAt)}</Row>}
          {b.checkedOutAt && <Row label="Checked out at">{when(b.checkedOutAt)}</Row>}
        </dl>
      </section>

      <section className="panel" aria-label="Guest">
        <h2>Guest</h2>
        <dl className="dl">
          <Row label="Name">{b.guest}</Row>
          <Row label="Phone">{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : '—'}</Row>
        </dl>
      </section>

      <section className="panel" aria-label="Payment">
        <h2>Payment</h2>
        <dl className="dl">
          <Row label="Slot price (without GST)">{inr(b.base)}</Row>
          {b.discount > 0 && <Row label="Discount">−{inr(b.discount)}</Row>}
          <Row label={`GST${b.taxRate ? ` (${b.taxRate}%)` : ''}`}>{b.tax ? inr(b.tax) : '—'}</Row>
          {b.guestFee > 0 && <Row label="Guest service fee">{inr(b.guestFee)}</Row>}
          <Row label="Total" strong>{inr(b.amount)}</Row>
          <Row label="Paid">{inr(b.paid)}{b.payMode ? ` · ${b.payMode}` : ''}</Row>
          {owesAtHotel && <Row label="To collect at the hotel">{inr(b.payAtHotel)}</Row>}
          <Row label="Payment status"><span className={`pay pay--${b.paymentStatus.toLowerCase()}`}>{b.paymentStatus || '—'}</span></Row>
        </dl>
</section>

      {counts && b.base > 0 && (
        <section className="panel" aria-label="Your earnings">
          <h2>Your earnings</h2>
          <dl className="dl">
            <Row label="Slot price">{inr(b.base)}</Row>
            <Row label={`Platform fee (${PLATFORM_FEE_TEXT})`}>−{inr(PLATFORM_FEE)}</Row>
            {extEarn > 0 && <Row label="Extension (no platform fee)">+{inr(extEarn)}</Row>}
            <Row label="You earn" strong>{inr(stayNet(b.base) + extEarn)}</Row>
          </dl>
          <p className="note"><InfoIcon /><span>An estimate. Final amounts are confirmed when the payout is settled.</span></p>
        </section>
      )}

      {e && (
        <section className="panel" aria-label="Extension">
          <h2>Extension</h2>
          <dl className="dl">
            <Row label="Status"><span className={`pill pill--ext-${e.status.toLowerCase()}`}>{e.status}</span></Row>
            <Row label="Extra time">+{e.extraHours} {e.extraHours === 1 ? 'hour' : 'hours'}</Row>
            <Row label="Extra charge">{inr(e.amount)} · no platform fee</Row>
            {e.newCheckOut && <Row label="New check-out">{when(e.newCheckOut)}</Row>}
            {e.requestedAt && <Row label="Requested">{when(e.requestedAt)}</Row>}
            {e.respondedAt && <Row label="Answered">{when(e.respondedAt)}</Row>}
            {e.paymentStatus && <Row label="Extension payment">{e.paymentStatus}{e.paidTotal ? ` · ${inr(e.paidTotal)} paid` : ''}</Row>}
            {e.rejectionReason && <Row label="Reason given">{e.rejectionReason}</Row>}
          </dl>
          {e.status === 'Requested' && <Link to="/extensions" className="abtn abtn--lime dwide"><ClockIcon size={18} /> Answer this request</Link>}
        </section>
      )}

      {events.length > 0 && (
        <section className="panel" aria-label="Timeline">
          <h2>Timeline</h2>
          <ol className="tl">{events.map((x, i) => <li key={i}><span className="tl__dot" aria-hidden="true" /><span><strong>{x.text}</strong><small>{when(x.at)}</small></span></li>)}</ol>
        </section>
      )}

      <p className="muted-note dref">Booking ID {b.id}</p>

      {checkIn && <CheckInSheet booking={b} onClose={() => setCheckIn(false)} onDone={() => { setCheckIn(false); reload(); }} />}
    </SubPage>
  );
}
