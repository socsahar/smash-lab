# Guest Registration During Order - Feature Documentation

## Overview
Users who are not logged in can now create an account during the order process to save their waiver for future orders and track their order history.

## User Flow

### 1. Order Form (order.html)
- **New Section Added**: "Create Account" checkbox with password field
- **Location**: Between "Notes" field and "Submit" button
- **Visibility**: 
  - Shows for guest users (not logged in)
  - Hidden for logged-in users (auto-fills name/email)

### 2. Account Creation Option
```
┌─────────────────────────────────────────────────────┐
│ ☑ צור חשבון כדי לשמור את הויתור שלך להזמנות עתידיות  │
│                                                     │
│ 💡 שמור זמן: כתב הויתור שלך יישמר בחשבון ולא      │
│    תצטרך למלא אותו שוב בהזמנות הבאות                │
│                                                     │
│ [Password Field - Shows when checked]               │
│ בחר סיסמה לחשבון: _____________ (min 8 chars)      │
└─────────────────────────────────────────────────────┘
```

### 3. Order Submission Logic (js/order.js)
**When checkbox is checked:**
1. Validates password (minimum 8 characters)
2. Calls `/api/customer/register` endpoint
3. Creates user account with bcrypt hashed password
4. Auto-logs in the user (stores session)
5. Links order to user_id in database
6. Continues with order process

**Error Handling:**
- If email already exists: Shows info message, continues order as guest
- If registration fails: Logs error, continues order anyway
- Order never fails due to account creation issues

## Database Changes

### Orders Table (add-waiver-and-user-to-orders.sql)
```sql
-- New columns added:
user_id BIGINT                          -- Links to users(id), NULL for guests
waiver_data JSONB                       -- Complete waiver form data
waiver_signed_at TIMESTAMP              -- When waiver was signed
waiver_signature TEXT                   -- Digital signature
waiver_saved BOOLEAN DEFAULT false      -- Flag if waiver is saved
account_created_during_order BOOLEAN    -- Tracks account creation
```

### Users Table
```sql
-- New columns added:
saved_waiver_data JSONB                 -- Saved waiver for reuse
saved_waiver_date TIMESTAMP             -- Last waiver save date
```

## API Functions (js/supabase-client.js)

### saveWaiverToOrder(orderId, waiverData, signature)
```javascript
// Saves waiver to order
// If order has user_id, also saves to user account
await window.orderDB.saveWaiverToOrder(123, waiverFormData, 'signature');
```

### getUserSavedWaiver(userId)
```javascript
// Retrieves saved waiver for logged-in user
const waiver = await window.orderDB.getUserSavedWaiver(userId);
if (waiver.saved_waiver_data) {
    // Pre-fill waiver form
}
```

## Benefits

### For Users:
✅ **Time Saving**: Waiver filled once, reused forever
✅ **Order Tracking**: View all orders in account dashboard
✅ **Easy Access**: No need to save confirmation emails
✅ **Optional**: Can still order as guest if preferred

### For Admin:
✅ **Customer Database**: Build registered user base
✅ **Order History**: Link orders to specific customers
✅ **Waiver Management**: View saved waivers (read-only)
✅ **Better Analytics**: Track repeat customers

## Admin Panel Features (Future)

### View User's Saved Waiver
- Navigate to Users section
- Click on user to view details
- See saved waiver data (read-only)
- View date when waiver was saved

### View Order with Linked User
- Orders table shows user_id
- Click to see linked user account
- Flag shows if account was created during order

## Security Features

✅ **Bcrypt Password Hashing**: 10 salt rounds
✅ **Auto-Verification**: Users verified immediately (dev mode)
✅ **Session Management**: Secure sessionStorage
✅ **Server-Side Validation**: All password ops on server
✅ **Error Handling**: Graceful fallback to guest orders

## Testing Checklist

- [ ] Run migration: `add-waiver-and-user-to-orders.sql` in Supabase
- [ ] Guest user sees "Create Account" option
- [ ] Password field shows/hides on checkbox toggle
- [ ] Password validation (8 chars minimum) works
- [ ] Account created successfully during order
- [ ] User auto-logged in after registration
- [ ] Order linked to user_id in database
- [ ] Logged-in users don't see registration option
- [ ] Email already exists: Shows message, order continues
- [ ] Registration fails: Order continues as guest

## Future Enhancements

1. **Customer Dashboard**
   - View all orders
   - Track order status
   - Update saved waiver

2. **Email Notifications**
   - Order confirmation
   - Reminder before appointment
   - Special offers for registered users

3. **Waiver Pre-fill**
   - Auto-fill waiver form if saved waiver exists
   - Ask user to confirm/update details
   - Option to use new waiver

4. **Admin Features**
   - Search orders by user
   - Export user waivers
   - View customer statistics

## Files Modified

### HTML
- `order.html` - Added account registration section

### JavaScript
- `js/order.js` - Account creation logic, form validation
- `js/supabase-client.js` - Waiver save functions

### SQL
- `add-waiver-and-user-to-orders.sql` - Database migration

### Server
- Uses existing `/api/customer/register` endpoint
- No server changes needed

## Notes

- **Privacy**: Waivers stored encrypted in database
- **GDPR**: Users can request waiver deletion
- **Backup**: Waivers also saved per-order (redundancy)
- **Admin Access**: Read-only view of waivers (no edit)
