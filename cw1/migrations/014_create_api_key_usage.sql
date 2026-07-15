CREATE TABLE IF NOT EXISTS api_key_usage (
  usageId INT AUTO_INCREMENT PRIMARY KEY,
  keyId INT NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  ipAddress VARCHAR(255) DEFAULT NULL,
  accessedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_api_key_usage_key FOREIGN KEY (keyId) REFERENCES api_keys(keyId) ON DELETE CASCADE,
  -- for time-range queries used in usage statistics (per report note)
  INDEX idx_api_key_usage_accessedAt (accessedAt)
) ENGINE=InnoDB;
