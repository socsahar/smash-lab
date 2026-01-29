-- ============================================
-- Add User ID and Waiver Fields to Orders Table
-- ============================================
-- This migration adds support for linking orders to user accounts
-- and storing waiver data with orders

-- Add user_id column to link orders to users table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for faster user order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Add waiver fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS waiver_data JSONB,
ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS waiver_signature TEXT,
ADD COLUMN IF NOT EXISTS waiver_saved BOOLEAN DEFAULT false;

-- Add index for waiver lookups
CREATE INDEX IF NOT EXISTS idx_orders_waiver_saved ON orders(waiver_saved) WHERE waiver_saved = true;

-- Add account_created_during_order flag
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS account_created_during_order BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON COLUMN orders.user_id IS 'Links order to user account (NULL for guest orders)';
COMMENT ON COLUMN orders.waiver_data IS 'JSON data of signed waiver form';
COMMENT ON COLUMN orders.waiver_signed_at IS 'Timestamp when waiver was signed';
COMMENT ON COLUMN orders.waiver_signature IS 'Digital signature or consent confirmation';
COMMENT ON COLUMN orders.waiver_saved IS 'Flag indicating if waiver is saved to user account for reuse';
COMMENT ON COLUMN orders.account_created_during_order IS 'Flag indicating if user account was created during this order';

-- Add users table waiver reference (stored waiver for future orders)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS saved_waiver_data JSONB,
ADD COLUMN IF NOT EXISTS saved_waiver_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.saved_waiver_data IS 'Saved waiver data for reuse in future orders (read-only in admin)';
COMMENT ON COLUMN users.saved_waiver_date IS 'Date when waiver was last saved';

-- Select to verify changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('user_id', 'waiver_data', 'waiver_signed_at', 'waiver_signature', 'waiver_saved', 'account_created_during_order')
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('saved_waiver_data', 'saved_waiver_date')
ORDER BY ordinal_position;
