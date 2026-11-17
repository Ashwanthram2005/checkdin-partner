// Save as backend/controllers/message.js
const { authFromRequest } = require("../lib/auth");
const { requirePartner } = require("../middleware/partnerAuth");
const messages = require("../models/message");

const fail = (reply, e) => reply.code(e.status || 500).send({ error: e.message || "Something went wrong" });

/* ───── partner (hotel) side ───── */

// GET /api/partner/messages  → list of conversations
async function partnerConversations(request, reply) {
  try {
    const hid = await requirePartner(request, reply);
    if (!hid) return reply.sent;
    const items = await messages.conversationsForHotel(hid);
    return { data: items, total: items.length };
  } catch (e) { return fail(reply, e); }
}

async function ownBooking(request, reply, hid) {
  const booking = await messages.findBooking(request.params.id);
  // a hotel can only see and write to its OWN bookings
  if (!booking || booking.hotel_id !== hid) { reply.code(404).send({ error: "Booking not found" }); return null; }
  return booking;
}

// GET /api/partner/bookings/:id/messages
async function partnerThread(request, reply) {
  try {
    const hid = await requirePartner(request, reply);
    if (!hid) return reply.sent;
    const booking = await ownBooking(request, reply, hid);
    if (!booking) return reply.sent;
    const items = await messages.listThread(booking.id);
    return { data: items, total: items.length };
  } catch (e) { return fail(reply, e); }
}

// POST /api/partner/bookings/:id/messages   { body }
async function partnerSend(request, reply) {
  try {
    const hid = await requirePartner(request, reply);
    if (!hid) return reply.sent;
    const booking = await ownBooking(request, reply, hid);
    if (!booking) return reply.sent;
    if (["cancelled", "rejected", "expired"].includes(String(booking.status).toLowerCase())) return reply.code(409).send({ error: "This booking is closed" });
    const id = await messages.add(booking, "partner", (request.body || {}).body);
    return { ok: true, id };
  } catch (e) { return fail(reply, e); }
}

// POST /api/partner/bookings/:id/messages/read
async function partnerRead(request, reply) {
  try {
    const hid = await requirePartner(request, reply);
    if (!hid) return reply.sent;
    const booking = await ownBooking(request, reply, hid);
    if (!booking) return reply.sent;
    await messages.markRead(booking.id, "partner");
    return { ok: true };
  } catch (e) { return fail(reply, e); }
}

/* ───── guest (customer app) side ───── */

async function guestBooking(request, reply) {
  const info = authFromRequest(request);
  if (!info || info.user_type !== "customer") { reply.code(403).send({ error: "Sign in to continue" }); return null; }
  const booking = await messages.findBooking(request.params.id);
  if (!booking || booking.customer_id !== info.user_id) { reply.code(404).send({ error: "Booking not found" }); return null; }
  return booking;
}

// GET /api/customer/bookings/:id/messages
async function guestThread(request, reply) {
  try {
    const booking = await guestBooking(request, reply);
    if (!booking) return reply.sent;
    const items = await messages.listThread(booking.id);
    return { data: items, total: items.length };
  } catch (e) { return fail(reply, e); }
}

// POST /api/customer/bookings/:id/messages   { body }
async function guestSend(request, reply) {
  try {
    const booking = await guestBooking(request, reply);
    if (!booking) return reply.sent;
    const id = await messages.add(booking, "guest", (request.body || {}).body);
    // TODO: send the hotel a push notification here (see docs for push alerts)
    return { ok: true, id };
  } catch (e) { return fail(reply, e); }
}

// POST /api/customer/bookings/:id/messages/read
async function guestRead(request, reply) {
  try {
    const booking = await guestBooking(request, reply);
    if (!booking) return reply.sent;
    await messages.markRead(booking.id, "guest");
    return { ok: true };
  } catch (e) { return fail(reply, e); }
}

module.exports = { partnerConversations, partnerThread, partnerSend, partnerRead, guestThread, guestSend, guestRead };
