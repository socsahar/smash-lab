-- ============================================
-- SmashLabs Bookings Table Setup
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/_/sql

-- Step 1: Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Package information
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    
    -- Customer information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Booking details
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    booking_datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    
    -- Order tracking
    order_id TEXT,
    google_event_id TEXT,
    status TEXT DEFAULT 'confirmed' NOT NULL,
    price NUMERIC,
    
    -- Constraints
    CHECK (status IN ('confirmed', 'cancelled', 'completed'))
);

-- Step 2: Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bookings_package_date 
    ON bookings(package_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_datetime_range 
    ON bookings(booking_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_email 
    ON bookings(customer_email);

-- Step 3: Create function to check availability
CREATE OR REPLACE FUNCTION check_availability(
    p_package_id TEXT,
    p_date DATE
)
RETURNS TABLE(
    booking_time TEXT,
    booking_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.booking_time,
        b.booking_datetime,
        b.end_datetime,
        b.duration_minutes
    FROM bookings b
    WHERE b.package_id = p_package_id
        AND b.booking_date = p_date
        AND b.status = 'confirmed'
    ORDER BY b.booking_datetime;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies

-- Allow anyone to read bookings (for availability checking)
CREATE POLICY "Enable read access for all users"
    ON bookings
    FOR SELECT
    USING (true);

-- Only service role can insert bookings (server-side only)
CREATE POLICY "Enable insert for service role only"
    ON bookings
    FOR INSERT
    WITH CHECK (true);

-- Only service role can update bookings
CREATE POLICY "Enable update for service role only"
    ON bookings
    FOR UPDATE
    USING (true);

-- Only service role can delete bookings
CREATE POLICY "Enable delete for service role only"
    ON bookings
    FOR DELETE
    USING (true);

-- Step 6: Grant permissions
GRANT ALL ON bookings TO service_role;
GRANT SELECT ON bookings TO anon;
GRANT SELECT ON bookings TO authenticated;

-- Done! Run this query to verify table was created:
-- SELECT * FROM bookings LIMIT 1;
