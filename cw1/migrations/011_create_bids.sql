CREATE TABLE IF NOT EXISTS bids (
  bidId INT AUTO_INCREMENT PRIMARY KEY,
  bidSlotId INT NOT NULL,
  userId INT NOT NULL,
  amount DECIMAL(7, 2) NOT NULL,
  status ENUM('active', 'cancelled', 'won', 'lost') NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- bid history should survive slot/profile changes
  CONSTRAINT fk_bids_slot FOREIGN KEY (bidSlotId) REFERENCES bid_slots(bidSlotId),
  CONSTRAINT fk_bids_profile FOREIGN KEY (userId) REFERENCES profiles(userId),
  -- highest active bid per slot is the winner, earliest createdAt as a tiebreak
  INDEX idx_bids_slot_status_amount_created (bidSlotId, status, amount, createdAt),
  -- "one active bid per profile per slot" + update/cancel own-bid lookups
  INDEX idx_bids_user_slot (userId, bidSlotId)
) ENGINE=InnoDB;
