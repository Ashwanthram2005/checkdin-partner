# Guest app: chat with the hotel

Adds a chat screen to the guest app (`cust`) so guests can message the hotel, and the hotel's replies reach them.

## What it adds (4 files)
* `cust/src/api/messages.ts`: fetch / send / mark-read for a booking's chat; reports "not available" if the server has no chat yet.
* `cust/src/pages/Chat.tsx`: the chat screen at `/bookings/:id/chat`. Bubbles, quick questions, retry on failed send,
  refreshes every 8 s, marks the hotel's messages read.
* `cust/src/pages/Bookings.tsx`: a **Message hotel** button on ongoing bookings, with a count of unread hotel messages.
* `cust/src/App.tsx`: the route.

Chat is open for ongoing bookings; completed bookings are read-only; cancelled ones are closed.

## Apply it
From the root of the `checkdin` repository:

```bash
git apply docs/guest-app-chat/guest-app-chat.patch      # (copy the .patch file there first)
cd cust && npm install && npm run build
```

It adds no new type errors (the 18 existing "unused React" warnings are unchanged).

## It needs the server part
The guest app calls `/api/customer/bookings/:id/messages` (GET, POST) and `.../messages/read` (POST).
Add the patch in `docs/backend-messaging/` first. Until then the chat screen says chat isn't available yet and links to Support.

Note: the server patch reads bookings from `customer_bookings`. That is the table your repo uses for both the guest's and the
hotel's view of a booking, so one booking ID connects the guest's chat and the hotel's chat. Check the live database uses the same.
