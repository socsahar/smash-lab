-- Add is_admin column to users table
-- Run this in Supabase SQL Editor

-- Add is_admin column (defaults to false for regular customers)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create an index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Set specific user as admin (replace with your admin email)
UPDATE users 
SET is_admin = true 
WHERE email = 'idan@smashlab.com';

-- Verify the changes
SELECT id, name, email, is_admin, verified, created_at 
FROM users 
ORDER BY is_admin DESC, created_at DESC;
