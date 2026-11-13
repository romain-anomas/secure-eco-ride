CREATE TABLE IF NOT EXISTS gallery_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title         VARCHAR(120) NOT NULL,
  caption       TEXT NULL,
  media_type    ENUM('IMAGE','VIDEO') NOT NULL,
  media_url     VARCHAR(500) NOT NULL,
  is_published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_gallery_published_created (is_published, created_at)
) ENGINE=InnoDB;

INSERT INTO gallery_items (title, media_type, media_url, is_published)
SELECT 'Secure Eco Ride', 'IMAGE', '/gallery/secure-eco-ride.jpg', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE media_url = '/gallery/secure-eco-ride.jpg');
