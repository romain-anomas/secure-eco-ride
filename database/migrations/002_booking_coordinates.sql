-- Add optional map coordinates; existing bookings remain valid with NULL values.
ALTER TABLE bookings
  ADD COLUMN request_key CHAR(36) NULL,
  ADD COLUMN pickup_latitude DECIMAL(10,7) NULL,
  ADD COLUMN pickup_longitude DECIMAL(10,7) NULL,
  ADD COLUMN destination_latitude DECIMAL(10,7) NULL,
  ADD COLUMN destination_longitude DECIMAL(10,7) NULL;

CREATE UNIQUE INDEX uq_bookings_request_key ON bookings (request_key);
CREATE INDEX idx_bookings_pickup_coords ON bookings (pickup_latitude, pickup_longitude);
