# Checkdin Partner app: what the partner portal needs, and what is built

Source: the live partner portal (partner.checkdin.in) and the API it calls
(`/api/auth/*`, `/api/partner/*` on the Checkdin backend). Findings from reading the portal.

## Sign-in (3 steps)
1. Gmail address **or** Hotel ID → `POST /api/auth/email/partner/users` / `POST /api/auth/login/partner {hotelId}`
2. Choose the account (user) linked to it
3. Password → `POST /api/auth/email/partner/login` / `POST /api/auth/login/partner {hotelId,userId,userPassword}`
   Returns `{ token, user }`. The token goes in `Authorization: Bearer …`. `GET /api/auth/me`, roles in `GET /api/partner/roles`.

## Built in the app (v0.2)
| Screen | API |
|---|---|
| Home (command center): live/paused status, today's numbers, extension requests, arrivals | `dashboard`, `bookings`, `extensions`, `properties/{id}/settings` |
| Bookings: list, search, filters, check-in with the guest's 6-digit code | `bookings`, `bookings/{id}/checkin/send-otp`, `bookings/{id}/checkin` |
| Extensions: approve / decline within the 5-minute window | `extensions`, `bookings/{id}/extension/approve`, `…/reject {reason}` |
| Pricing: 3/6/9/12 h slots, full-day, extra hour, weekend %, GST slabs, dynamic rules | `pricing` (GET/PUT), `pricing-rules` (GET/PUT) |
| Revenue & payouts (earnings worked out from bookings; payouts list; bank status) | `bookings`, `payouts`, `properties/{id}/settings` |
| More: pause bookings, auto-accept, change password, support, logout | `properties/{id}/settings` (PUT), `auth/partner/change-password` |

## Not built yet (exists in the portal)
Availability calendar, Reviews (reply), Guest messaging, Notifications, Reports, Forecasting,
Promotions, Occupancy / customer insights / cancellations / AI assistant / performance score,
Property experience (photos, amenities), Rules & policies, Audit log, Properties switcher,
payout requests (needs an OTP challenge), and push notifications for new requests.

## Notes
* The portal's Accept / Reject / Check-out on a booking are not saved to the server today (local only),
  so the app does not offer them. Check-in (with code) and extension approve/decline are real.
* GST on the slot price (the portal's slabs): up to ₹1,000 exempt, ₹1,001–7,500 5%, above ₹7,500 18%.
  The partner enters the price without GST.
