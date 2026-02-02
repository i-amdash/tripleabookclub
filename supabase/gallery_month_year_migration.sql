-- Add month and year columns to gallery table
-- Run this migration in your Supabase SQL Editor

-- Add month column (1-12)
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS month INTEGER;

-- Add year column
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS year INTEGER;

-- Set default values for existing records based on created_at
UPDATE gallery 
SET 
  month = EXTRACT(MONTH FROM created_at)::INTEGER,
  year = EXTRACT(YEAR FROM created_at)::INTEGER
WHERE month IS NULL OR year IS NULL;

-- Make month and year NOT NULL after populating existing data
ALTER TABLE gallery ALTER COLUMN month SET NOT NULL;
ALTER TABLE gallery ALTER COLUMN year SET NOT NULL;

-- Add constraints to ensure valid month values (1-12)
ALTER TABLE gallery ADD CONSTRAINT gallery_month_check CHECK (month >= 1 AND month <= 12);

-- Add an index for faster grouping queries
CREATE INDEX IF NOT EXISTS idx_gallery_month_year ON gallery(year DESC, month DESC);
