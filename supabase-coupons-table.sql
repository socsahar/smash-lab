-- ============================================
-- SmashLabs Coupons Table Setup
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/_/sql

-- Step 1: Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Coupon information
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'percentage' or 'fixed'
    discount NUMERIC NOT NULL,
    
    -- Validity
    expiry_date DATE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    
    -- Usage limits
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0 NOT NULL,
    min_purchase NUMERIC DEFAULT 0 NOT NULL,
    
    -- Details
    description TEXT,
    
    -- Audit trail
    created_by TEXT NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by TEXT,
    
    -- Constraints
    CHECK (type IN ('percentage', 'fixed')),
    CHECK (status IN ('active', 'revoked', 'deleted')),
    CHECK (discount > 0),
    CHECK (used_count >= 0),
    CHECK (min_purchase >= 0)
);

-- Step 2: Create coupon_usage table to track each usage
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Foreign keys
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    
    -- Usage details
    customer_email TEXT NOT NULL,
    order_amount NUMERIC NOT NULL,
    discount_amount NUMERIC NOT NULL,
    
    -- Additional tracking
    order_id TEXT,
    used_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Step 3: Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_coupons_code 
    ON coupons(code);

CREATE INDEX IF NOT EXISTS idx_coupons_status 
    ON coupons(status);

CREATE INDEX IF NOT EXISTS idx_coupons_expiry 
    ON coupons(expiry_date);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id 
    ON coupon_usage(coupon_id);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer_email 
    ON coupon_usage(customer_email);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies for coupons table
-- Allow public read access to all coupons (admin authentication handled in app)
CREATE POLICY "Public can read coupons"
    ON coupons FOR SELECT
    USING (true);

-- Allow public to insert coupons (admin authentication handled in app)
CREATE POLICY "Public can insert coupons"
    ON coupons FOR INSERT
    WITH CHECK (true);

-- Allow public to update coupons (admin authentication handled in app)
CREATE POLICY "Public can update coupons"
    ON coupons FOR UPDATE
    USING (true);

-- Step 6: Create policies for coupon_usage table
-- Allow public to insert usage records (when applying coupons)
CREATE POLICY "Public can insert usage records"
    ON coupon_usage FOR INSERT
    WITH CHECK (true);

-- Allow public to read usage records (admin authentication handled in app)
CREATE POLICY "Public can read usage records"
    ON coupon_usage FOR SELECT
    USING (true);

-- Step 7: Create function to automatically increment used_count
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to auto-increment used_count on new usage
CREATE TRIGGER trigger_increment_coupon_usage
    AFTER INSERT ON coupon_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_usage();

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the setup:

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('coupons', 'coupon_usage');

-- Check if indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('coupons', 'coupon_usage');

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('coupons', 'coupon_usage');

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- Uncomment to insert sample coupons:
-- Note: max_uses defaults to 1 if not specified

-- INSERT INTO coupons (code, type, discount, expiry_date, description, created_by, max_uses, min_purchase)
-- VALUES 
--     ('WELCOME10', 'percentage', 10, '2026-12-31', 'Welcome discount - 10% off', 'admin', 100, 0),
--     ('SUMMER50', 'fixed', 50, '2026-08-31', 'Summer special - ₪50 off', 'admin', 50, 200),
--     ('VIP20', 'percentage', 20, '2026-12-31', 'VIP customer discount', 'admin', NULL, 300);
