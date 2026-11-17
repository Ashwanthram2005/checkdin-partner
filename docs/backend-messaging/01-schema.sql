-- In-app guest messaging: one row per message, tied to a booking.
CREATE TABLE IF NOT EXISTS booking_messages (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('partner', 'guest')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking ON booking_messages (booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_booking_messages_hotel ON booking_messages (hotel_id, created_at);
