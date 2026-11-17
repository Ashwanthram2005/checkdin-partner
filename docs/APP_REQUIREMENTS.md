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

## Added in v0.3
| Screen | Where it gets its data |
|---|---|
| Availability: rooms offered / blocked, next 14 days | `availability` (GET), `availability/{date}` (PUT, sends only `day`, `allocated`, `blocked`) |
| Reviews: list, filter, one reply per review | `reviews` (GET), `reviews/{id}/reply` (POST) |
| Photos & amenities: add, delete, set cover, amenity list | `properties/{id}/photos`, `…/photos/cover`, `properties/{id}/settings` (amenities) |
| Payout request (owner only, 6-digit code) | `otp/send`, `otp/verify`, `payouts/request` |
| Reports (revenue, bookings, stay lengths, guests) and this-month forecast | worked out in the app from `bookings` (the portal's own report pages use built-in sample data) |
| Notifications | built from `bookings`, `extensions`, `reviews` (the server has no notifications API) |
| Guests: message in-house / arriving / upcoming / recent guests | `bookings` + WhatsApp / SMS / call links on the phone (Checkdin does not send the messages) |
| Alerts for new extension requests and bookings | polls every 30 s **while the app is open**; in-app banner, vibration, local notification |

## Not built, and why
* **Promotions**: on the portal this is sample data only (creating a campaign saves nothing). The real
  discount tools are the dynamic pricing rules (low occupancy, festival, weekend...), which are in Pricing.
* **Push alerts when the app is closed**: needs the server to send them. See below.
* Occupancy, customer insights, cancellations, AI assistant, performance score, extension demand/revenue,
  rules & policies, audit log, property switcher: portal pages that use sample data, or are not needed on a phone yet.

## What the server needs for real push alerts
1. A Firebase project, and its `google-services.json` added to the Android app (plus `@capacitor/push-notifications`).
2. An endpoint to save a phone's push token, e.g. `POST /api/partner/devices { token, platform }`.
3. The server sending a push (Firebase Cloud Messaging) when a guest asks to extend, a booking arrives or is cancelled.
Until then the app alerts only while it is open.

## Backend issues found while reading the code (please review)
* `PUT /api/partner/availability/:date` (in `backend/models/dayAvailability.js`) builds its `UPDATE` from the
  keys of the request body. A request with a crafted key name could change or break the query (SQL injection).
  Allow only `day`, `allocated`, `booked`, `blocked`. The app only ever sends `day`, `allocated`, `blocked`.
* The portal's availability "Save" sends the word `today` instead of a date, so it saves nothing, and it hides the error.

## Changes in v0.4
* **Online / Offline** replaces auto-accept. One switch (Home and More): online = guests can book you; offline = they can't.
  (It still uses the server's `pauseBookings` setting.)
* **PAN, GST and bank** are view-only in the app, with status chips and a note that they can only be changed on the
  partner website on a computer.
* **In-app messaging** (Messages): chat with guests inside the app, quick templates, unread badges, new-message alerts.
  It needs the server endpoints in `docs/MESSAGING_API.md` (patch in `docs/backend-messaging/`) and a chat screen in the guest app.

## Changes in v0.5
* **Hotel details**: name, description, address, PIN, map link, contact phone/email and logo (same validation as the partner site).
  Legal name, PAN, GST and bank stay desktop-only.
* **Team**: staff list and what each role can do (view only; staff are added through Checkdin support).
* **Activity log** and **Support tickets**: read from `audit-log` and `support`.
* **Properties**: list of properties; "switch" signs out and opens sign-in on the Hotel ID tab (most data is scoped to the signed-in property).
* **Activate account / Reset password**: open from the email link (`/activate?token=…`, `/reset-password?token=…`) or by pasting the link;
  Android opens those partner.checkdin.in links in the app (not verified app links, so Android may ask which app to use).
* **Rules & policies is not built**: on the partner site its "Save" does not save anything (no server call), so there is nothing real to show.

## Platform fee (as told by the owner)
Checkdin's fee is **₹79 + 18% GST (₹93.22) per stay booking**, taken from the property's earnings.
**Extension (stay-longer) charges carry no platform fee.** `src/lib/fees.ts` holds the numbers; Revenue, Reports,
the forecast and the booking details screen all use it. (A booking made on 14 Nov recorded a ₹49 guest
service fee; the app shows that as "Guest service fee" and does not use it for earnings.)

## Notes
* The portal's Accept / Reject / Check-out on a booking are not saved to the server today (local only),
  so the app does not offer them. Check-in (with code) and extension approve/decline are real.
* GST on the slot price (the portal's slabs): up to ₹1,000 exempt, ₹1,001–7,500 5%, above ₹7,500 18%.
  The partner enters the price without GST.
