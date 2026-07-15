CREATE TABLE IF NOT EXISTS bid_slots (
  bidSlotId INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL UNIQUE,
  winnerProfileId INT DEFAULT NULL,
  closedAt DATETIME DEFAULT NULL,
  -- a deleted profile must not silently remove historical slot records
  CONSTRAINT fk_bid_slots_winner FOREIGN KEY (winnerProfileId) REFERENCES profiles(userId)
) ENGINE=InnoDB;
