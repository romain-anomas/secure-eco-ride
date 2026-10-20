-- Secure Eco Ride — MySQL 8.0.19+ schema
-- Run:  mysql -u root -p < database/schema.sql
-- (or use `npm run db:init` inside /server, which substitutes DB_NAME from .env)

CREATE DATABASE IF NOT EXISTS secure_eco_ride
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE secure_eco_ride;

-- ---------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN','STAFF','DRIVER') NOT NULL DEFAULT 'STAFF',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------ customers
-- phone is stored in international digits without "+" (e.g. 250793157373)
CREATE TABLE IF NOT EXISTS customers (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  email      VARCHAR(190) NULL,
  notes      TEXT NULL,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_phone (phone)
) ENGINE=InnoDB;

-- ------------------------------------------------------------- vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(120) NOT NULL,
  model        VARCHAR(120) NULL,
  plate_number VARCHAR(30)  NULL,
  category     VARCHAR(60)  NOT NULL DEFAULT 'Sedan',
  capacity     TINYINT UNSIGNED NOT NULL DEFAULT 4,
  status       ENUM('AVAILABLE','BUSY','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  image_url    VARCHAR(500) NULL,
  description  TEXT NULL,
  features     JSON NULL,
  is_public    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicles_plate (plate_number),
  KEY idx_vehicles_status (status),
  KEY idx_vehicles_public (is_public, category)
) ENGINE=InnoDB;

-- -------------------------------------------------------------- drivers
CREATE TABLE IF NOT EXISTS drivers (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(120) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  license_number VARCHAR(60)  NULL,
  status         ENUM('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
  vehicle_id     INT UNSIGNED NULL,
  user_id        INT UNSIGNED NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_drivers_status (status),
  KEY idx_drivers_vehicle (vehicle_id),
  UNIQUE KEY uq_drivers_user_id (user_id),
  CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_drivers_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------- services
CREATE TABLE IF NOT EXISTS services (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140) NOT NULL,
  description TEXT NULL,
  icon        VARCHAR(40) NOT NULL DEFAULT 'car',
  sort_order  INT NOT NULL DEFAULT 0,
  is_bookable TINYINT(1) NOT NULL DEFAULT 1,   -- selectable in the booking form
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_slug (slug)
) ENGINE=InnoDB;

-- ------------------------------------------------------------- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference         VARCHAR(20)  NOT NULL,              -- SER-2026-00001
  request_key       CHAR(36) NULL,
  customer_id       INT UNSIGNED NOT NULL,
  service_id        INT UNSIGNED NULL,
  service_name      VARCHAR(120) NOT NULL,              -- snapshot, survives service edits
  pickup_location   VARCHAR(255) NOT NULL,
  destination       VARCHAR(255) NOT NULL,
  pickup_latitude   DECIMAL(10,7) NULL,
  pickup_longitude  DECIMAL(10,7) NULL,
  destination_latitude  DECIMAL(10,7) NULL,
  destination_longitude DECIMAL(10,7) NULL,
  pickup_date       DATE NOT NULL,
  pickup_time       TIME NOT NULL,
  passengers        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  vehicle_type      VARCHAR(60) NULL,
  notes             TEXT NULL,
  flight_number     VARCHAR(30) NULL,
  airport_direction ENUM('ARRIVAL','DEPARTURE') NULL,
  airport_name      VARCHAR(120) NULL,
  luggage_count     TINYINT UNSIGNED NULL,
  status            ENUM('PENDING','CONFIRMED','ASSIGNED','DRIVER_ON_WAY','PICKED_UP','COMPLETED','CANCELLED')
                    NOT NULL DEFAULT 'PENDING',
  driver_id         INT UNSIGNED NULL,
  vehicle_id        INT UNSIGNED NULL,
  quoted_price      DECIMAL(12,2) NULL,
  admin_notes       TEXT NULL,
  seen_by_admin     TINYINT(1) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_reference (reference),
  UNIQUE KEY uq_bookings_request_key (request_key),
  KEY idx_bookings_customer (customer_id),
  KEY idx_bookings_status (status),
  KEY idx_bookings_date (pickup_date, pickup_time),
  KEY idx_bookings_pickup_coords (pickup_latitude, pickup_longitude),
  KEY idx_bookings_driver (driver_id),
  KEY idx_bookings_vehicle (vehicle_id),
  KEY idx_bookings_created (created_at),
  KEY idx_bookings_seen (seen_by_admin),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT fk_bookings_service  FOREIGN KEY (service_id)  REFERENCES services (id)  ON DELETE SET NULL,
  CONSTRAINT fk_bookings_driver   FOREIGN KEY (driver_id)   REFERENCES drivers (id)   ON DELETE SET NULL,
  CONSTRAINT fk_bookings_vehicle  FOREIGN KEY (vehicle_id)  REFERENCES vehicles (id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- Race-safe yearly counter used to build SER-YYYY-00001
CREATE TABLE IF NOT EXISTS booking_counters (
  year        SMALLINT UNSIGNED NOT NULL,
  last_number INT UNSIGNED NOT NULL,
  PRIMARY KEY (year)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_status_history (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id  INT UNSIGNED NOT NULL,
  from_status VARCHAR(20) NULL,
  to_status   VARCHAR(20) NOT NULL,
  changed_by  INT UNSIGNED NULL,
  note        VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_history_booking (booking_id),
  CONSTRAINT fk_history_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user    FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_assignment_history (
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

-- --------------------------------------------------------- testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(120) NOT NULL,
  customer_photo_url VARCHAR(500) NULL,
  text          TEXT NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL DEFAULT 5,
  status        ENUM('PENDING','APPROVED','HIDDEN') NOT NULL DEFAULT 'PENDING',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_testimonials_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------- contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type       ENUM('GENERAL','CORPORATE') NOT NULL DEFAULT 'GENERAL',
  name       VARCHAR(120) NOT NULL,
  company    VARCHAR(160) NULL,
  phone      VARCHAR(20)  NULL,
  email      VARCHAR(190) NULL,
  message    TEXT NOT NULL,
  status     ENUM('NEW','READ','REPLIED') NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_status (status, created_at)
) ENGINE=InnoDB;

-- -------------------------------------------------------------- pricing
CREATE TABLE IF NOT EXISTS pricing (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id      INT UNSIGNED NULL,
  name            VARCHAR(120) NOT NULL,
  base_price      DECIMAL(12,2) NULL,
  price_per_km    DECIMAL(12,2) NULL,
  minimum_price   DECIMAL(12,2) NULL,
  additional_fees DECIMAL(12,2) NULL,
  currency        VARCHAR(8) NOT NULL DEFAULT 'RWF',
  notes           VARCHAR(255) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pricing_service (service_id),
  CONSTRAINT fk_pricing_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------- whatsapp_logs
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id          INT UNSIGNED NULL,
  contact_id          INT UNSIGNED NULL,
  reference           VARCHAR(20) NULL,
  recipient           VARCHAR(30) NOT NULL,            -- +250793157373
  message             TEXT NOT NULL,
  payload             JSON NULL,                       -- template info, used for retries
  status              ENUM('SENT','FAILED','SKIPPED') NOT NULL,
  provider_message_id VARCHAR(120) NULL,
  error               TEXT NULL,
  attempts            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wa_booking (booking_id),
  KEY idx_wa_status (status, created_at),
  CONSTRAINT fk_wa_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
  CONSTRAINT fk_wa_contact FOREIGN KEY (contact_id) REFERENCES contact_messages (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------- settings
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(80) NOT NULL,
  value       TEXT NULL,                                -- JSON encoded
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

-- -------------------------------------------- Firebase admin device tokens
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
