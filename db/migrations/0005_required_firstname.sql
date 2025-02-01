-- Make first_name column required in users table
UPDATE users SET first_name = username WHERE first_name IS NULL;
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
