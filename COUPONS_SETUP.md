# Coupons System Setup Guide

## Overview
The SmashLabs coupon system allows administrators to create, manage, and track discount coupons stored in Supabase database.

## 🗄️ Database Setup

### Step 1: Create Coupons Tables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (aquhidjcuxkhkwosfvgf)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `supabase-coupons-table.sql`
6. Click "Run" to execute the SQL

This will create:
- **`coupons` table**: Stores all coupon information
- **`coupon_usage` table**: Tracks each time a coupon is used
- **Indexes**: For fast queries on code, status, and expiry date
- **RLS Policies**: Security rules for data access
- **Trigger**: Auto-increments `used_count` when coupon is used

### Step 2: Verify Tables

Run this query in SQL Editor to verify:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('coupons', 'coupon_usage');
```

You should see both tables listed.

### Step 3: Test with Sample Data (Optional)

To test the system, insert a sample coupon:
```sql
INSERT INTO coupons (code, type, discount, expiry_date, description, created_by, max_uses, min_purchase)
VALUES 
    ('TEST10', 'percentage', 10, '2026-12-31', 'Test coupon - 10% off', 'admin', 100, 0);
```

---

## 🎟️ Admin Panel - Creating Coupons

### Accessing the Coupons Tab

1. Log in to admin panel: `https://yourdomain.com/admin.html`
2. Click on "🎟️ קופונים" (Coupons) tab

### Creating a New Coupon

Fill in the form with:
- **Coupon Code**: Alphanumeric code (e.g., SUMMER2026)
- **Discount Type**: 
  - Percentage (%) 
  - Fixed Amount (₪)
- **Discount Value**: The amount or percentage
- **Expiration Date**: When the coupon expires
- **Usage Limit** (optional): Max number of times it can be used
- **Minimum Purchase** (optional): Minimum order amount required
- **Description** (optional): Internal notes

### Managing Coupons

#### Statistics Dashboard
Shows real-time metrics:
- Total coupons
- Active coupons
- Used coupons  
- Expired coupons

#### Filter Coupons
Quick filters:
- All
- Active
- Used
- Expired
- Revoked

#### Actions on Coupons
- **📋 Copy**: Copy coupon code to clipboard
- **🚫 Revoke**: Deactivate coupon (can't be used but tracked)
- **🗑️ Delete**: Soft delete (hidden from list but kept in database)

---

## 💳 Payment Page - Applying Coupons

### Customer Flow

1. Customer fills order details
2. On payment page, sees "יש לך קוד קופון?" (Have a coupon code?)
3. Enters coupon code in input field
4. Clicks "החל" (Apply) button
5. System validates coupon in real-time from Supabase
6. If valid: Discount applied, total updated
7. If invalid: Error message shown

### Coupon Validation Rules

System checks:
- ✅ Coupon exists and not deleted
- ✅ Not revoked by admin
- ✅ Not expired
- ✅ Usage limit not exceeded
- ✅ Minimum purchase amount met

### Discount Calculation

**Percentage Discount:**
```
Discount = Order Total × (Discount % / 100)
Final Price = Order Total - Discount
```

**Fixed Discount:**
```
Discount = Fixed Amount
Final Price = Order Total - Discount (minimum ₪0)
```

### Usage Tracking

When payment is completed:
1. Usage record inserted into `coupon_usage` table
2. Database trigger auto-increments `used_count`
3. Stores: customer email, order amount, discount amount
4. Links to order ID for traceability

---

## 🔧 Technical Details

### Database Schema

**Coupons Table:**
```sql
coupons (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE,              -- Coupon code (uppercase)
    type TEXT,                     -- 'percentage' or 'fixed'
    discount NUMERIC,              -- Discount value
    expiry_date DATE,              -- Expiration date
    status TEXT,                   -- 'active', 'revoked', 'deleted'
    max_uses INTEGER,              -- Max usage limit (null = unlimited)
    used_count INTEGER,            -- Current usage count
    min_purchase NUMERIC,          -- Minimum order amount
    description TEXT,              -- Admin notes
    created_by TEXT,               -- Who created it
    created_at TIMESTAMPTZ,        -- Creation time
    revoked_at TIMESTAMPTZ,        -- When revoked
    revoked_by TEXT                -- Who revoked it
)
```

**Coupon Usage Table:**
```sql
coupon_usage (
    id UUID PRIMARY KEY,
    coupon_id UUID,                -- Foreign key to coupons
    customer_email TEXT,           -- Who used it
    order_amount NUMERIC,          -- Original order total
    discount_amount NUMERIC,       -- Discount applied
    order_id TEXT,                 -- Order reference
    used_at TIMESTAMPTZ            -- When used
)
```

### API Integration

**Admin Panel (admin.html):**
- Uses Supabase client with `SUPABASE_ANON_KEY`
- CRUD operations: Create, Read, Update, Delete
- Real-time data fetching
- Field names: snake_case (database format)

**Payment Page (payment.html):**
- Uses Supabase client for validation
- Reads from `coupons` table
- Inserts into `coupon_usage` table
- Async/await for database operations

### Security

**Row Level Security (RLS):**
- Public: Can read active coupons only
- Authenticated: Full access (admin users)
- Insert usage: Public (for customer orders)

**Data Validation:**
- Coupon codes: Alphanumeric only
- Discount type: Must be 'percentage' or 'fixed'
- Status: Must be 'active', 'revoked', or 'deleted'
- All amounts: Positive numbers only

---

## 🐛 Troubleshooting

### Issue: Coupons not loading in admin panel

**Solution:**
1. Check browser console for errors
2. Verify Supabase credentials in `js/config.js`
3. Confirm tables exist in Supabase SQL Editor
4. Check RLS policies are correctly set

### Issue: Coupon validation fails on payment page

**Solution:**
1. Open browser console to see error message
2. Verify Supabase client is loaded (`@supabase/supabase-js@2`)
3. Check `js/config.js` is loaded
4. Confirm coupon exists in database and is active

### Issue: Usage count not incrementing

**Solution:**
1. Verify trigger exists in Supabase:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_increment_coupon_usage';
   ```
2. Re-run the SQL from `supabase-coupons-table.sql` if missing
3. Check `coupon_usage` inserts are successful

### Issue: "שגיאה בחיבור למסד הנתונים" error

**Solution:**
1. Verify internet connection
2. Check Supabase project status
3. Confirm `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/config.js`
4. Verify Supabase CDN is accessible

---

## 📊 Analytics & Reports

### Admin Dashboard Metrics

Available in Coupons tab:
- Total number of coupons created
- Active coupons (usable right now)
- Number of coupons that have been used
- Expired coupons count

### Usage History

Query coupon usage in SQL Editor:
```sql
SELECT 
    c.code,
    cu.customer_email,
    cu.order_amount,
    cu.discount_amount,
    cu.used_at
FROM coupon_usage cu
JOIN coupons c ON c.id = cu.coupon_id
ORDER BY cu.used_at DESC
LIMIT 50;
```

### Revenue Impact

Calculate total discounts given:
```sql
SELECT 
    c.code,
    COUNT(*) as times_used,
    SUM(cu.discount_amount) as total_discount_given,
    SUM(cu.order_amount) as total_order_value
FROM coupon_usage cu
JOIN coupons c ON c.id = cu.coupon_id
GROUP BY c.code
ORDER BY total_discount_given DESC;
```

---

## 🚀 Best Practices

### Creating Effective Coupons

1. **Use Clear Codes**: Make them easy to type and remember
   - ✅ SUMMER2026, WELCOME10, VIP20
   - ❌ X7K9PQR2, a1b2c3d4

2. **Set Appropriate Limits**:
   - Usage limits for flash sales
   - Minimum purchase to protect margins
   - Reasonable expiration dates

3. **Track Performance**:
   - Monitor usage patterns
   - Compare revenue vs. discount given
   - Identify most effective campaigns

### Security Tips

1. **Don't share admin panel access**
2. **Revoke compromised coupons immediately**
3. **Use percentage discounts for smaller orders**
4. **Set maximum discount caps for high-value items**
5. **Monitor unusual usage patterns**

### Customer Communication

1. **Include expiration date in marketing**
2. **Clearly state minimum purchase requirements**
3. **Test coupons before launching campaigns**
4. **Provide clear error messages**
5. **Have customer support ready during campaigns**

---

## 📝 Maintenance

### Regular Tasks

**Weekly:**
- Review active coupons
- Check for expired coupons
- Monitor usage trends

**Monthly:**
- Archive old deleted coupons
- Analyze campaign performance
- Clean up unused coupons

**Before Major Campaigns:**
- Test coupon codes
- Verify database connection
- Check Supabase usage limits
- Prepare customer support

### Database Maintenance

Clean up old deleted coupons (older than 1 year):
```sql
DELETE FROM coupons 
WHERE status = 'deleted' 
AND created_at < NOW() - INTERVAL '1 year';
```

---

## 🆘 Support

For issues:
1. Check this guide first
2. Review browser console errors
3. Check Supabase dashboard for API errors
4. Verify database connection
5. Contact technical support with:
   - Error messages
   - Steps to reproduce
   - Browser and device info

---

## 📚 Additional Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript
- Row Level Security Guide: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated:** February 1, 2026  
**Version:** 1.0  
**System:** SmashLabs Coupon Management
