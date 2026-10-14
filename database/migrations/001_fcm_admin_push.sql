-- Adds Firebase Cloud Messaging token storage and per-booking/device idempotency.
CREATE TABLE IF NOT EXISTS admin_push_tokens (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL,
  token         TEXT NOT NULL,
  device_name   VARCHAR(120) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_push_token_hash (token_hash),
  KEY idx_admin_push_user (user_id),
  CONSTRAINT fk_admin_push_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_push_deliveries (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id    INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL,
  status        ENUM('SENDING','SENT','FAILED') NOT NULL DEFAULT 'SENDING',
  error_code    VARCHAR(100) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at       TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_booking_device (booking_id, token_hash),
  KEY idx_push_delivery_status (status, created_at),
  CONSTRAINT fk_push_delivery_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB;
