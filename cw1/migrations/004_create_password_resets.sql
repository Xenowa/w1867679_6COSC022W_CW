CREATE TABLE IF NOT EXISTS password_resets (
  passId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  tokenHash VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME DEFAULT NULL,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  -- token lookup on reset-password
  INDEX idx_password_resets_tokenHash (tokenHash)
) ENGINE=InnoDB;
