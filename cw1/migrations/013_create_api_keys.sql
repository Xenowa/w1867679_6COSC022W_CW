CREATE TABLE IF NOT EXISTS api_keys (
  keyId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  keyHash VARCHAR(255) NOT NULL,
  label VARCHAR(255) DEFAULT NULL,
  scopes JSON NOT NULL,
  revokedAt DATETIME DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_api_keys_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  -- Bearer token lookup on every authenticated API request
  UNIQUE INDEX idx_api_keys_keyHash (keyHash)
) ENGINE=InnoDB;
