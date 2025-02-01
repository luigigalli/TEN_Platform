-- Make first_name column nullable in users table
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
