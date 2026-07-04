CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_type TEXT,
  actor_id TEXT,
  actor_name TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_partner ON affiliate_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_created_at ON affiliate_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_read ON affiliate_notifications(read);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_admin_notifications ON admin_notifications;
CREATE POLICY service_role_admin_notifications ON admin_notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_affiliate_notifications ON affiliate_notifications;
CREATE POLICY service_role_affiliate_notifications ON affiliate_notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
