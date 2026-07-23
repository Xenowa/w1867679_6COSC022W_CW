CREATE TABLE IF NOT EXISTS admin_email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminUserId INT NOT NULL,
  tokenHash VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME DEFAULT NULL,
  CONSTRAINT fk_admin_email_verifications_admin_user FOREIGN KEY (adminUserId) REFERENCES admin_users(id) ON DELETE CASCADE,
  -- token lookup on verify-email
  INDEX idx_admin_email_verifications_tokenHash (tokenHash)
) ENGINE=InnoDB;
