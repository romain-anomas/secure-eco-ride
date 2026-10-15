-- Retains assignment and reassignment audit without modifying existing bookings.
CREATE TABLE booking_assignment_history (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  previous_driver_id INT UNSIGNED NULL,
  driver_id INT UNSIGNED NULL,
  assigned_by INT UNSIGNED NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignment_booking (booking_id, assigned_at),
  KEY idx_assignment_driver (driver_id, assigned_at),
  CONSTRAINT fk_assignment_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_old_driver FOREIGN KEY (previous_driver_id) REFERENCES drivers (id) ON DELETE SET NULL,
  CONSTRAINT fk_assignment_driver FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE SET NULL,
  CONSTRAINT fk_assignment_user FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;
