CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id INT UNSIGNED NOT NULL,
  jti VARCHAR(100) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_sessions_jti (jti),
  UNIQUE KEY uk_auth_sessions_token_hash (token_hash),
  KEY idx_auth_sessions_admin_id (admin_id),
  KEY idx_auth_sessions_expires_at (expires_at),
  KEY idx_auth_sessions_revoked_at (revoked_at),
  CONSTRAINT fk_auth_sessions_admin FOREIGN KEY (admin_id) REFERENCES admin (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
