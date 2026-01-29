# Supabase Setup Guide

## Step 1: Create Supabase Account

1. Go to [Supabase](https://supabase.com/)
2. Sign up with your email or GitHub
3. Verify your email

## Step 2: Create New Project

1. Click "New Project"
2. Choose your organization (or create new one: "SmashLabs")
3. Fill in details:
   - Name: `smashlabs-booking`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to Israel (EU Central or Middle East)
4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

## Step 3: Create Bookings Table

1. Go to "Table Editor" in left sidebar
2. Click "Create a new table"
3. Click "New table"
4. Name: `bookings`
5. Add these columns:

### Columns Configuration:

| Column Name | Type | Default Value | Extra Settings |
|-------------|------|---------------|----------------|
| id | uuid | gen_random_uuid() | Primary Key, Auto |
| created_at | timestamptz | now() | Auto |
| package_id | text | - | Required |
| package_name | text | - | Required |
| customer_name | text | - | Required |
| customer_email | text | - | Required |
| customer_phone | text | - | Required |
| booking_date | date | - | Required |
| booking_time | text | - | Required |
| booking_datetime | timestamptz | - | Required (calculated) |
| duration_minutes | int4 | - | Required |
| end_datetime | timestamptz | - | Required (calculated) |
| order_id | text | - | Optional |
| google_event_id | text | - | Optional |
| status | text | 'confirmed' | Required |
| price | numeric | - | Optional |

6. Click "Save"

## Step 4: Create Index for Fast Queries

1. Go to "SQL Editor" in left sidebar
2. Click "New query"
3. Paste this SQL:

```sql
-- Create index for fast availability queries
CREATE INDEX idx_bookings_package_date ON bookings(package_id, booking_date);
CREATE INDEX idx_bookings_datetime_range ON bookings(booking_datetime, end_datetime);

-- Create function to check availability
CREATE OR REPLACE FUNCTION check_availability(
  p_package_id TEXT,
  p_date DATE
)
RETURNS TABLE(
  booking_time TEXT,
  booking_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.booking_time,
    b.booking_datetime,
    b.end_datetime
  FROM bookings b
  WHERE b.package_id = p_package_id
    AND b.booking_date = p_date
    AND b.status = 'confirmed'
  ORDER BY b.booking_datetime;
END;
$$ LANGUAGE plpgsql;
```

4. Click "Run" (or press Ctrl+Enter)

## Step 5: Get API Credentials

1. Go to "Settings" → "API" in left sidebar
2. Copy these values (you'll need them for .env):
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API Key (anon public)**: `eyJhbGc...` (long token)
   - **Project API Key (service_role)**: `eyJhbGc...` (different token - use this for server)

## Step 6: Enable Row Level Security (RLS)

1. Go back to "Table Editor"
2. Click on `bookings` table
3. Click the shield icon or go to "Policies"
4. Click "New Policy"
5. Choose "Create a policy from scratch"
6. Name: `Enable read access for all users`
7. Policy command: `SELECT`
8. Target roles: `public`
9. USING expression: `true`
10. Click "Create policy"

11. Create another policy:
12. Name: `Enable insert for service role only`
13. Policy command: `INSERT`
14. Target roles: `service_role`
15. WITH CHECK expression: `true`
16. Click "Create policy"

## Done! ✅

You now have:
- Supabase project created
- `bookings` table with proper schema
- Indexes for fast queries
- API credentials
- RLS policies configured

Next: Update .env file with credentials
