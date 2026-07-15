CREATE TABLE IF NOT EXISTS email_verifications (
  emailId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  tokenHash VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME DEFAULT NULL,
  CONSTRAINT fk_email_verifications_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  -- token lookup on verify-email
  INDEX idx_email_verifications_tokenHash (tokenHash)
) ENGINE=InnoDB;
