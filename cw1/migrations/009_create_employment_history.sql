CREATE TABLE IF NOT EXISTS employment_history (
  employmentId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  industrySector VARCHAR(255) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  startedAt DATETIME NOT NULL,
  endedAt DATETIME DEFAULT NULL,
  CONSTRAINT fk_employment_history_profile FOREIGN KEY (userId) REFERENCES profiles(userId) ON DELETE CASCADE,
  INDEX idx_employment_history_industrySector (industrySector),
  INDEX idx_employment_history_location (location)
) ENGINE=InnoDB;
