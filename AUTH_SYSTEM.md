# Authentication System - SmashLabs

## Overview
The SmashLabs authentication system supports two types of users:
- **Admins**: Full access to admin dashboard, booking management, calendar
- **Customers**: Regular users who can make bookings and view their orders

## User Types

### 1. Admin Users
- Access to `admin.html` dashboard
- Can view/edit/cancel all bookings
- Access to calendar management
- Payment tracking and management
- View analytics and statistics

**Admin Credentials (Development):**
- Email: `idan@smashlab.com`
- Password: `smash123`

### 2. Regular Customers
- Register via `/login.html` (registration form)
- Email verification required
- Can make bookings through the website
- View their own orders (future feature)

## Authentication Flow

### Admin Login Flow
1. User enters credentials in `login.html`
2. System tries admin login first via `/api/admin/login`
3. If successful:
   - Stores admin token in `sessionStorage` and `localStorage`
   - Sets `smashlabs_admin_logged_in = 'true'` in both storages
   - Stores user data with `is_admin: true` flag
   - Redirects to `admin.html`
4. If not admin, falls through to regular customer login

### Customer Login Flow
1. If admin login fails, proceed with regular login
2. Query Supabase `users` table by email
3. Verify password (plain text comparison - needs bcrypt in production)
4. Check if user is verified (email verification)
5. If verified:
   - Store user data in `sessionStorage` (secure, per-tab)
   - Redirect to home page or previous page
6. If not verified:
   - Show verification form
   - Request verification code

## Storage Strategy

### sessionStorage (Primary - Secure)
- `smashlabs_current_user`: User object with name, email, is_admin flag
- `smashlabs_admin_token`: Admin session token
- `smashlabs_admin_logged_in`: 'true' for admin sessions
- Clears on tab/window close (more secure)

### localStorage (Fallback - Persistent)
- `smashlabs_current_user`: Same user object (for compatibility)
- `smashlabs_admin_logged_in`: 'true' for admin sessions
- Persists across browser sessions
- Used as fallback when sessionStorage is cleared

## Database Schema

### Users Table (Supabase)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_expires_at TIMESTAMP,
  is_admin BOOLEAN DEFAULT false,  -- NEW: Admin flag
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
```

## Admin Access Control

### Server-Side (server.js)
```javascript
// Admin login endpoint
POST /api/admin/login
- Checks hardcoded credentials first
- Falls back to Supabase is_admin flag
- Returns admin token and user data
```

### Client-Side (admin.html)
```javascript
function checkAuth() {
  // Check multiple sources for admin status:
  1. sessionStorage.smashlabs_admin_logged_in
  2. localStorage.smashlabs_admin_logged_in
  3. currentUser.is_admin === true
  
  // If not admin -> redirect to login
}
```

### Navigation Link (user-auth.js)
```javascript
// Changes "Login" to "Logout" when authenticated
// Shows user name on hover
// Green color for logged-in state
```

## Setup Instructions

### 1. Update Supabase Users Table
Run the SQL migration:
```bash
# In Supabase SQL Editor, run:
# supabase-users-admin-update.sql
```

This adds:
- `is_admin` column (boolean, default false)
- Index for faster admin lookups
- Sets specific user as admin

### 2. Create Admin User
Option A: Use hardcoded credentials (dev only)
- Email: `idan@smashlab.com`
- Password: `smash123`

Option B: Set existing user as admin in Supabase:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

### 3. Environment Variables
Add to `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 4. Start Server
```bash
node server.js
```

## Security Considerations

### Current Implementation (Development)
⚠️ **NOT PRODUCTION READY**
- Passwords stored as plain text
- Hardcoded admin credentials in code
- No rate limiting on login attempts
- No session timeout

### Production Requirements
✅ **Must Implement:**
1. **Password Hashing**: Use bcrypt for all passwords
2. **Environment Variables**: Store admin credentials in `.env`
3. **JWT Tokens**: Proper token-based authentication
4. **Rate Limiting**: Prevent brute force attacks
5. **HTTPS Only**: Enforce secure connections
6. **Session Timeout**: Auto-logout after inactivity
7. **CSRF Protection**: Token-based form submissions
8. **SQL Injection Prevention**: Use parameterized queries (already done with Supabase)

## Testing

### Test Admin Login
1. Go to `http://localhost:8000/login.html`
2. Enter admin credentials:
   - Email: `idan@smashlab.com`
   - Password: `smash123`
3. Should redirect to `admin.html`
4. Check browser console for auth logs

### Test Customer Registration
1. Go to `http://localhost:8000/login.html`
2. Click "Register" tab
3. Fill in customer details
4. Submit form
5. Check email for verification code
6. Enter code to verify account

### Test Logout
1. Click "Logout" in navigation (when logged in)
2. Should clear all storage
3. Redirect to home page
4. Navigation should show "Login" again

## Troubleshooting

### Issue: Admin login redirects back to login
**Solution:** Check browser console for auth errors. Verify:
- Server is running (`node server.js`)
- Admin credentials are correct
- No JavaScript errors in console

### Issue: "Access denied" on admin.html
**Solution:** 
- Check `localStorage.getItem('smashlabs_admin_logged_in')` in console
- Should be `'true'`
- If not, login again as admin

### Issue: Customer can't verify email
**Solution:**
- Check Supabase `users` table for verification code
- Ensure email service is configured (EmailJS)
- Check spam folder

## API Endpoints

### Authentication
- `POST /api/register` - Register new customer
- `POST /api/login` - Customer login
- `POST /api/admin/login` - Admin login
- `POST /api/send-verification` - Send verification email

### Admin Only
- `GET /api/calendar/stats` - Dashboard statistics
- `PUT /api/calendar/bookings/:id` - Update booking
- `DELETE /api/calendar/bookings/:id` - Cancel booking

### Public
- `GET /api/calendar/check-availability` - Check time slots
- `POST /api/calendar/create-booking` - Create booking

## Future Enhancements

### Planned Features
- [ ] Role-based permissions (super admin, manager, staff)
- [ ] Customer dashboard for viewing their bookings
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, Facebook login)
- [ ] Admin activity logs
- [ ] Session management dashboard
- [ ] IP-based security rules

### Customer Features
- [ ] View booking history
- [ ] Edit upcoming bookings
- [ ] Cancel bookings
- [ ] Loyalty points/rewards
- [ ] Saved payment methods
- [ ] Profile management

## Files Modified

### Authentication Core
- `js/login.js` - Login/registration logic
- `js/user-auth.js` - Navigation auth state
- `admin.html` - Admin dashboard with auth check
- `server.js` - Admin login endpoint

### Database
- `supabase-users-admin-update.sql` - Add is_admin column

### Documentation
- `AUTH_SYSTEM.md` - This file
