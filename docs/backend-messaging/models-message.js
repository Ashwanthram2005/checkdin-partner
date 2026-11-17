// Save as backend/models/message.js
const { dbFetch, dbFetchAll, dbExecute } = require("../lib/db");
const { genId, nowIso } = require("../lib/utils");

const MAX_LEN = 1000;

async function findBooking(id) {
  return dbFetch("SELECT id, hotel_id, customer_id, status FROM bookings WHERE id=$1", [id]);
}

async function listThread(bookingId) {
  return dbFetchAll("SELECT id, booking_id, sender, body, created_at, read_at FROM booking_messages WHERE booking_id=$1 ORDER BY created_at ASC LIMIT 500", [bookingId]);
}

async function add(booking, sender, body) {
  const text = String(body || "").trim();
  if (!text) throw { status: 400, message: "Message cannot be empty" };
  if (text.length > MAX_LEN) throw { status: 400, message: `Message is too long (max ${MAX_LEN} characters)` };
  const id = genId();
  await dbExecute(
    "INSERT INTO booking_messages (id, booking_id, hotel_id, sender, body, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, booking.id, booking.hotel_id, sender, text, nowIso()]
  );
  return id;
}

// mark the OTHER side's messages as read
async function markRead(bookingId, readerIs) {
  const from = readerIs === "partner" ? "guest" : "partner";
  await dbExecute("UPDATE booking_messages SET read_at=$1 WHERE booking_id=$2 AND sender=$3 AND read_at IS NULL", [nowIso(), bookingId, from]);
}

// one row per booking for a hotel: latest message + how many guest messages are unread
async function conversationsForHotel(hotelId) {
  return dbFetchAll(
    `SELECT m.booking_id,
            (SELECT body FROM booking_messages x WHERE x.booking_id = m.booking_id ORDER BY created_at DESC LIMIT 1) AS last_message,
            (SELECT sender FROM booking_messages x WHERE x.booking_id = m.booking_id ORDER BY created_at DESC LIMIT 1) AS last_sender,
            MAX(m.created_at) AS last_at,
            SUM(CASE WHEN m.sender='guest' AND m.read_at IS NULL THEN 1 ELSE 0 END)::int AS unread
       FROM booking_messages m
      WHERE m.hotel_id=$1
      GROUP BY m.booking_id
      ORDER BY MAX(m.created_at) DESC
      LIMIT 200`,
    [hotelId]
  );
}

module.exports = { findBooking, listThread, add, markRead, conversationsForHotel };
