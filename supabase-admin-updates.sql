-- ============================================
-- Update Bookings Table for Admin Features
-- ============================================
-- Run this SQL in Supabase SQL Editor to add new columns

-- Add customer notes column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_notes TEXT DEFAULT '';

-- Add payment tracking columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

-- Add admin notes column (separate from customer notes)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';

-- Add last modified tracking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- Create index for payment status
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
