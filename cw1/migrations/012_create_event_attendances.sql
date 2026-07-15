CREATE TABLE IF NOT EXISTS event_attendances (
  attendanceId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  eventName VARCHAR(255) NOT NULL,
  attendedOn DATETIME NOT NULL,
  CONSTRAINT fk_event_attendances_profile FOREIGN KEY (userId) REFERENCES profiles(userId) ON DELETE CASCADE
) ENGINE=InnoDB;
