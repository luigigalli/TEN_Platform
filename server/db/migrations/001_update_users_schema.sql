-- Update users table schema
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS permissions text[],
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS reset_token text,
  ADD COLUMN IF NOT EXISTS reset_token_expiry timestamp,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
    "email": {
      "marketing": true,
      "security": true,
      "updates": true,
      "newsletter": true
    },
    "inApp": {
      "mentions": true,
      "replies": true,
      "directMessages": true,
      "systemUpdates": true
    }
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;
