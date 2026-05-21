-- White-label brand columns for profiles table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zqgxbhnoaqmzjknojdqq/sql/new

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS brand_logo_url text,
  ADD COLUMN IF NOT EXISTS brand_primary_color text,
  ADD COLUMN IF NOT EXISTS brand_domain text;

-- Unique index on brand_domain (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_brand_domain
  ON profiles(brand_domain)
  WHERE brand_domain IS NOT NULL;
