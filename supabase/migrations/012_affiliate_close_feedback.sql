ALTER TABLE affiliate_partners
  ADD COLUMN IF NOT EXISTS close_reason TEXT,
  ADD COLUMN IF NOT EXISTS close_feedback TEXT;
