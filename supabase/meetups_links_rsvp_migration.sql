-- Meetup custom links + RSVP migration
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- CUSTOM LINK FIELDS ON MEETUPS
-- ============================================

ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS external_url_label TEXT;

-- ============================================
-- RSVP TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS meetup_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meetup_id UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (meetup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meetup_rsvps_meetup_id ON meetup_rsvps(meetup_id);
CREATE INDEX IF NOT EXISTS idx_meetup_rsvps_user_id ON meetup_rsvps(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE meetup_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetup RSVPs are viewable by authenticated users"
ON meetup_rsvps FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own meetup RSVPs"
ON meetup_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetup RSVPs"
ON meetup_rsvps FOR DELETE
USING (auth.uid() = user_id);
