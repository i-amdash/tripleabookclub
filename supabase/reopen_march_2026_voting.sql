-- Reopen March 2026 voting portals
-- Run this in Supabase SQL Editor

INSERT INTO portal_status (month, year, category, nomination_open, voting_open)
VALUES
  (3, 2026, 'fiction', false, true),
  (3, 2026, 'non-fiction', false, true)
ON CONFLICT (month, year, category)
DO UPDATE SET
  nomination_open = EXCLUDED.nomination_open,
  voting_open = EXCLUDED.voting_open,
  updated_at = NOW();

-- Verify
SELECT month, year, category, nomination_open, voting_open
FROM portal_status
WHERE month = 3
  AND year = 2026
ORDER BY category;
