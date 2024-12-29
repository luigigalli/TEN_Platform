-- Update existing messages to have valid status
UPDATE messages SET status = 'sent' WHERE status NOT IN ('sent', 'delivered', 'read');

-- Update messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'expert_inquiry' CHECK (message_type IN ('expert_inquiry', 'trip_discussion', 'booking_support', 'admin_notice')),
  ADD COLUMN IF NOT EXISTS context_id INTEGER,
  ADD COLUMN IF NOT EXISTS context_type TEXT CHECK (context_type IN ('trip', 'booking', 'service')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'sent',
  ADD CONSTRAINT messages_status_check CHECK (status IN ('sent', 'delivered', 'read'));
