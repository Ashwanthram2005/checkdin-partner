# In-app guest messaging

The app has a built-in chat (Messages). It needs these endpoints on the server. Until they exist the app
shows "In-app chat isn't switched on yet" and offers WhatsApp / SMS instead, so nothing breaks.

## What the partner app calls
| Call | Purpose | Response |
|---|---|---|
| `GET /api/partner/messages` | conversations (one per booking) | `{ data: [{ booking_id, last_message, last_sender, last_at, unread }] }` |
| `GET /api/partner/bookings/:id/messages` | one chat | `{ data: [{ id, sender: 'partner'\|'guest', body, created_at, read_at }] }` |
| `POST /api/partner/bookings/:id/messages` `{ body }` | send (max 1000 characters) | `{ ok: true }` |
| `POST /api/partner/bookings/:id/messages/read` | mark the guest's messages read | `{ ok: true }` |

A missing endpoint (404/501) turns chat off in the app; any other error is shown to the user.

## What still has to be built for it to work end to end
1. **Server**: the patch in `docs/backend-messaging/` (table, model, controller, routes). Written against this
   repo's conventions, **not yet run against a database**, so test it first.
2. **Guest app (`cust`)**: done as a patch, see `docs/guest-app-chat/` (chat screen, "Message hotel" button with unread count).
3. **Push alerts** (optional, see APP_REQUIREMENTS.md): so the hotel and the guest are told when the app is closed.
   The partner app already polls while it is open (chat every 8 s, conversation list every 15 s) and shows a banner.
