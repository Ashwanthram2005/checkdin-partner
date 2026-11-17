# Routes to add

In `backend/routes/partner/index.js` (inside `partnerRoutes`), add:

```js
const messageController = require("../../controllers/message");
// …
fastify.get("/api/partner/messages", messageController.partnerConversations);
fastify.get("/api/partner/bookings/:id/messages", messageController.partnerThread);
fastify.post("/api/partner/bookings/:id/messages", messageController.partnerSend);
fastify.post("/api/partner/bookings/:id/messages/read", messageController.partnerRead);
```

In `backend/routes/customer.js`, add:

```js
const messageController = require("../controllers/message");
// …
fastify.get("/api/customer/bookings/:id/messages", messageController.guestThread);
fastify.post("/api/customer/bookings/:id/messages", messageController.guestSend);
fastify.post("/api/customer/bookings/:id/messages/read", messageController.guestRead);
```

Fastify matches the more specific `/bookings/:id/messages` before the existing generic
`/api/partner/bookings/:id/:action`, so the existing booking actions are not affected.

Run `01-schema.sql` against the database, copy the two files to `backend/models/message.js` and
`backend/controllers/message.js`, and restart the server.
