CREATE TABLE IF NOT EXISTS diary_entries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entry_date CHAR(10) NOT NULL,
  title VARCHAR(160) NOT NULL DEFAULT '',
  content MEDIUMTEXT NOT NULL,
  mood VARCHAR(24) NULL,
  font VARCHAR(24) NULL,
  weather VARCHAR(24) NULL,
  temperature VARCHAR(24) NULL,
  wind VARCHAR(24) NULL,
  attachments JSON NULL,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  UNIQUE KEY uq_diary_entry_date (entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;