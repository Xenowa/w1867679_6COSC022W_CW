CREATE TABLE IF NOT EXISTS admin_password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  tokenHash VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME DEFAULT NULL,
  CONSTRAINT fk_admin_password_resets_admin_user FOREIGN KEY (userId) REFERENCES admin_users(id) ON DELETE CASCADE,
  -- token lookup on reset-password
  INDEX idx_admin_password_resets_tokenHash (tokenHash)
) ENGINE=InnoDB;
