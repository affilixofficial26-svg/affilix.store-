CREATE TABLE IF NOT EXISTS system_email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  text_body TEXT NOT NULL,
  html_body TEXT,
  category TEXT NOT NULL DEFAULT 'system',
  provider TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_system_email_outbox_status ON system_email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_system_email_outbox_category ON system_email_outbox(category);
CREATE INDEX IF NOT EXISTS idx_system_email_outbox_created_at ON system_email_outbox(created_at);

ALTER TABLE system_email_outbox ENABLE ROW LEVEL SECURITY;
