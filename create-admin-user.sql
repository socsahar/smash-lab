-- Add is_admin column to users table
-- Run this SQL in your Supabase SQL Editor

-- Add is_admin column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin user: idan@smashlab.com with password "123"
-- Password is hashed using simple method (for demo - use bcrypt in production)
INSERT INTO users (name, email, password_hash, verified, is_admin)
VALUES (
    'Idan Admin',
    'idan@smashlab.com',
    '202cb962ac59075b964b07152d234b70', -- MD5 hash of "123"
    true, -- Admin is already verified
    true  -- This is an admin account
)
ON CONFLICT (email) DO UPDATE
SET is_admin = true, verified = true;

-- Create index on is_admin for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

COMMENT ON COLUMN users.is_admin IS 'Whether this user has admin access to owner dashboard';
