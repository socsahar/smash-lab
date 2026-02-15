-- Create orders table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- STEP 1: Add admin support to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin user: idan@smashlab.com with password "123"
INSERT INTO users (name, email, password_hash, verified, is_admin)
VALUES (
    'Idan Admin',
    'idan@smashlab.com',
    '123', -- Plain text password (matches login.js comparison)
    true, -- Admin is already verified
    true  -- This is an admin account
)
ON CONFLICT (email) DO UPDATE
SET is_admin = true, verified = true, password_hash = '123';

-- STEP 2: Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public select orders" ON orders;
DROP POLICY IF EXISTS "Allow public update orders" ON orders;

-- Allow anyone to insert orders (for new bookings)
CREATE POLICY "Allow public insert orders"
ON orders FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read orders (for admin panel)
CREATE POLICY "Allow public select orders"
ON orders FOR SELECT
TO public
USING (true);

-- Allow anyone to update orders (for status changes in admin)
CREATE POLICY "Allow public update orders"
ON orders FOR UPDATE
TO public
USING (true);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on date for calendar integration
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);

COMMENT ON TABLE orders IS 'Customer orders from SmashLabs order flow - connects to admin panel and Google Calendar';
COMMENT ON COLUMN orders.id IS 'Unique order ID (auto-generated)';
COMMENT ON COLUMN orders.name IS 'Customer full name';
COMMENT ON COLUMN orders.email IS 'Customer email';
COMMENT ON COLUMN orders.phone IS 'Customer phone number';
COMMENT ON COLUMN orders.service IS 'Type of service (rage-room, paint-room, etc.)';
COMMENT ON COLUMN orders.quantity IS 'Number of participants';
COMMENT ON COLUMN orders.date IS 'Preferred date for booking';
COMMENT ON COLUMN orders.time IS 'Preferred time in 15-minute intervals (HH:MM format)';
COMMENT ON COLUMN orders.notes IS 'Additional notes or special requests';
COMMENT ON COLUMN orders.status IS 'Order status: pending, confirmed, cancelled';
COMMENT ON COLUMN orders.created_at IS 'Timestamp when order was created';
