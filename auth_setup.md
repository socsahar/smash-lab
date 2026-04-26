# Authentication System Setup Guide

## Overview
Your SmashLabs website now has a complete authentication system with:
- **bcrypt password hashing** (better than SHA256 for passwords)
- SQLite database for user storage
- Email verification
- JWT token-based authentication
- Password reset functionality

## Installation Steps

### 1. Install Dependencies
```powershell
npm install
```

This will install:
- `bcryptjs` - Secure password hashing with salt (10 rounds)
- `better-sqlite3` - Fast SQLite database
- `jsonwebtoken` - JWT tokens for authentication
- `nodemailer` - Email sending
- `express` - Web server
- `cors` - Cross-origin resource sharing

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```
JWT_SECRET=your_super_secret_key_here_change_this
SITE_URL=http://localhost:8000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=Smashlab.nahariya@gmail.com
```

**Important:** For Gmail, you need to create an App Password:
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use that password in EMAIL_PASSWORD

### 3. Database Structure
The system automatically creates a SQLite database at `data/users.db` with this structure:

```sql
users table:
- id (INTEGER, PRIMARY KEY)
- name (TEXT)
- email (TEXT, UNIQUE)
- password_hash (TEXT) -- bcrypt hashed password
- verified (INTEGER) -- 0 or 1
- verification_code (TEXT)
- reset_token (TEXT)
- reset_token_expiry (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### 4. Security Features

#### Password Hashing
- Uses **bcrypt** with 10 salt rounds
- bcrypt is specifically designed for password hashing
- Includes automatic salting
- Resistant to brute-force attacks
- Much better than SHA256 for passwords

#### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

#### JWT Tokens
- Tokens expire after 7 days
- Include user ID, email, and name
- Stored in localStorage on client side

### 5. API Endpoints

All endpoints are available at `/.netlify/functions/auth/`

#### POST /register
Register a new user
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification link.",
  "userId": 1
}
```

#### POST /login
Login user
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "verified": true
  }
}
```

#### POST /verify
Verify email with code
```json
{
  "code": "abc123def456..."
}
```

#### POST /forgot-password
Request password reset
```json
{
  "email": "user@example.com"
}
```

#### POST /reset-password
Reset password with token
```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass123!"
}
```

### 6. Running the Server

For development with Netlify Functions:
```powershell
npm run dev
```

For simple local server:
```powershell
npm start
```

### 7. How It Works

1. **Registration:**
   - User fills registration form
   - Password is validated for strength
   - Password is hashed with bcrypt (10 rounds)
   - User saved to database with `verified=0`
   - Verification email sent with unique code
   - User receives email and clicks link

2. **Email Verification:**
   - User clicks link or enters code
   - System verifies code and sets `verified=1`
   - User can now login

3. **Login:**
   - User enters email and password
   - System retrieves user from database
   - bcrypt compares entered password with stored hash
   - If match and verified, JWT token is generated
   - Token is returned and stored in localStorage
   - User is redirected to main page

4. **Password Reset:**
   - User requests password reset
   - System generates reset token (valid 1 hour)
   - Reset email sent with link
   - User enters new password
   - New password is hashed with bcrypt
   - Password updated in database

### 8. Testing

You can test the system locally:
1. Register a new account
2. Check console logs for verification code
3. Use the code to verify (or build verification page)
4. Login with your credentials
5. Check localStorage for the JWT token

### 9. Production Deployment

For production:
1. Use strong JWT_SECRET (at least 32 random characters)
2. Set up real email server credentials
3. Enable HTTPS
4. Set NODE_ENV=production
5. Consider moving to PostgreSQL for better scalability
6. Add rate limiting to prevent brute force attacks

### 10. Why bcrypt instead of SHA256?

- **bcrypt** is specifically designed for password hashing
- Includes automatic salting
- Adjustable work factor (cost)
- Slow by design (prevents brute force)
- Industry standard for password storage

- **SHA256** is designed for checksums, not passwords
- Fast (bad for passwords - easy to brute force)
- No built-in salting
- Not designed for password security

## Files Created

1. `api/auth.js` - Main authentication API
2. `js/login.js` - Updated frontend code
3. `package.json` - Updated with new dependencies
4. `netlify.toml` - Netlify configuration
5. `AUTH_SETUP.md` - This guide

## Next Steps

1. Run `npm install`
2. Create `.env` file with your settings
3. Test registration and login
4. Build email verification page (verify.html)
5. Build password reset page (reset-password.html)
6. Add user dashboard
7. Add "Logout" functionality
