-- Link a driver profile to a restricted driver login account.
ALTER TABLE users
  MODIFY role ENUM('ADMIN','STAFF','DRIVER') NOT NULL DEFAULT 'STAFF';

ALTER TABLE drivers
  ADD COLUMN user_id INT UNSIGNED NULL AFTER vehicle_id,
  ADD UNIQUE KEY uq_drivers_user_id (user_id),
  ADD CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
