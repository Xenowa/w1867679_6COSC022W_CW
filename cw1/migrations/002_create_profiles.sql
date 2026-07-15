CREATE TABLE IF NOT EXISTS profiles (
  userId INT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  bio VARCHAR(255) DEFAULT NULL,
  linkedinUrl VARCHAR(255) DEFAULT NULL,
  profileImage VARCHAR(255) DEFAULT NULL,
  appearanceCount INT NOT NULL DEFAULT 0,
  isAlumniOfDay BOOLEAN NOT NULL DEFAULT FALSE,
  monthlyExtraSlot BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_profiles_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  
  -- Index was put to speed up the query search time
  INDEX idx_profiles_isAlumniOfDay (isAlumniOfDay)
) ENGINE=InnoDB;
