-- Stores Web Push tokens for driver accounts separately from admin devices.
CREATE TABLE IF NOT EXISTS driver_push_tokens (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL,
  token         TEXT NOT NULL,
  device_name   VARCHAR(120) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_driver_push_token_hash (token_hash),
  KEY idx_driver_push_user (user_id),
  CONSTRAINT fk_driver_push_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
