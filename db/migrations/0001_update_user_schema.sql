-- Rename full_name to first_name and add last_name
ALTER TABLE users 
  RENAME COLUMN full_name TO first_name;

ALTER TABLE users 
  ADD COLUMN last_name TEXT,
  ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have profile_completed = false
UPDATE users SET profile_completed = FALSE;
