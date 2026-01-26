-- Meet-ups Table Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- MEETUPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS meetups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Lagos',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_url TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meetups_date ON meetups(event_date);
CREATE INDEX IF NOT EXISTS idx_meetups_year_month ON meetups(year, month);
CREATE INDEX IF NOT EXISTS idx_meetups_published ON meetups(is_published);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_meetups_updated_at ON meetups;
CREATE TRIGGER trigger_meetups_updated_at
BEFORE UPDATE ON meetups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- Published meetups are viewable by authenticated users only
CREATE POLICY "Published meetups are viewable by authenticated users"
ON meetups FOR SELECT
USING (
  is_published = true AND auth.uid() IS NOT NULL
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Only super_admin can insert meetups
CREATE POLICY "Only super_admin can insert meetups"
ON meetups FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Only super_admin can update meetups
CREATE POLICY "Only super_admin can update meetups"
ON meetups FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Only super_admin can delete meetups
CREATE POLICY "Only super_admin can delete meetups"
ON meetups FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- ============================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================

-- INSERT INTO meetups (title, description, venue_name, address, city, latitude, longitude, google_maps_url, event_date, end_time, month, year, is_published)
-- VALUES (
--   'January Book Club Meet-up',
--   'Join us for our first meet-up of the year! We''ll be discussing our January fiction read and enjoying refreshments.',
--   'Bogobiri House',
--   '9 Maitama Sule Street, Ikoyi',
--   'Lagos',
--   6.4541,
--   3.4347,
--   'https://maps.google.com/?q=Bogobiri+House+Ikoyi+Lagos',
--   '2026-02-01 15:00:00+01',
--   '2026-02-01 18:00:00+01',
--   1,
--   2026,
--   true
-- );
