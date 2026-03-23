-- Newsletter subscribers table for website opt-ins
-- Run this in Supabase SQL Editor after the base migration.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'website_footer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
ON newsletter_subscribers(email);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_is_active
ON newsletter_subscribers(is_active);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only super_admin can read newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Only super_admin can read newsletter subscribers"
ON newsletter_subscribers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Only super_admin can manage newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Only super_admin can manage newsletter subscribers"
ON newsletter_subscribers FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP TRIGGER IF EXISTS trigger_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER trigger_newsletter_subscribers_updated_at
BEFORE UPDATE ON newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
