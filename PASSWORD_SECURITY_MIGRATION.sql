-- ⚠️ IMPORTANT: Password Security Migration
-- This script documents the migration from plain text to bcrypt hashed passwords

-- NOTE: All existing passwords in the database are stored as PLAIN TEXT
-- This is a CRITICAL SECURITY VULNERABILITY that has been fixed.

-- ═══════════════════════════════════════════════════════════════════════
-- WHAT HAS BEEN FIXED:
-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Registration now hashes passwords with bcrypt (10 salt rounds)
-- ✅ Login now verifies passwords using bcrypt.compare()
-- ✅ Admin login supports bcrypt verification
-- ✅ Passwords are NEVER sent to the client
-- ✅ Password comparison happens SERVER-SIDE ONLY

-- ═══════════════════════════════════════════════════════════════════════
-- EXISTING USERS - ACTION REQUIRED:
-- ═══════════════════════════════════════════════════════════════════════
-- All users with plain text passwords CANNOT login anymore!
-- They need to be handled in one of two ways:

-- OPTION 1: Delete all existing users (they can re-register)
-- Use this if you're in development/testing phase:
/*
DELETE FROM users WHERE password_hash NOT LIKE '$2b$%';
*/

-- OPTION 2: Manually reset passwords for specific users
-- You'll need to generate bcrypt hashes for new passwords
-- Example using Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('newPassword123', 10);
-- console.log(hash);

-- Then update the user:
/*
UPDATE users 
SET password_hash = '$2b$10$GENERATED_HASH_HERE'
WHERE email = 'user@example.com';
*/

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY PASSWORD SECURITY:
-- ═══════════════════════════════════════════════════════════════════════
-- Check which users have plain text passwords (unsafe):
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN password_hash LIKE '$2b$%' THEN '✅ Bcrypt (Secure)'
        WHEN password_hash LIKE '$2a$%' THEN '✅ Bcrypt (Secure)'
        ELSE '❌ Plain Text (UNSAFE!)'
    END as password_status,
    verified,
    is_admin,
    created_at
FROM users
ORDER BY 
    CASE 
        WHEN password_hash LIKE '$2b$%' THEN 1
        WHEN password_hash LIKE '$2a$%' THEN 1
        ELSE 2
    END,
    created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- RECOMMENDED ACTION FOR DEVELOPMENT:
-- ═══════════════════════════════════════════════════════════════════════
-- Delete all users and start fresh with secure passwords:
-- DELETE FROM users;

-- Then users can re-register through the website with bcrypt-hashed passwords

-- ═══════════════════════════════════════════════════════════════════════
-- FOR ADMIN USER:
-- ═══════════════════════════════════════════════════════════════════════
-- The admin user 'idan@smashlab.com' uses hardcoded credentials in server.js
-- These still work without bcrypt (for convenience in development)
-- In PRODUCTION, remove hardcoded credentials and use bcrypt-hashed password

-- Example: Create admin with bcrypt password
-- First, generate hash in Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('YourSecureAdminPassword', 10);
-- Then insert:
/*
INSERT INTO users (name, email, password_hash, verified, is_admin)
VALUES (
    'Admin User',
    'admin@smashlab.com',
    '$2b$10$YOUR_GENERATED_HASH_HERE',
    true,
    true
);
*/

-- ═══════════════════════════════════════════════════════════════════════
-- TESTING THE FIX:
-- ═══════════════════════════════════════════════════════════════════════
-- 1. Register a new user through the website
-- 2. Check their password_hash - should start with '$2b$10$'
-- 3. Try logging in - should work correctly
-- 4. Check database - password_hash should NEVER be readable

-- Run this query to test:
SELECT 
    email,
    substring(password_hash, 1, 10) as hash_prefix,
    length(password_hash) as hash_length
FROM users
LIMIT 5;

-- Bcrypt hashes should:
-- - Start with '$2b$10$' or '$2a$10$'
-- - Be exactly 60 characters long
-- - Look like random characters

-- ═══════════════════════════════════════════════════════════════════════
-- SECURITY CHECKLIST:
-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Passwords hashed with bcrypt (10 salt rounds)
-- ✅ Password verification on server-side only
-- ✅ Passwords never sent to client
-- ✅ Login endpoint uses bcrypt.compare()
-- ✅ Registration endpoint uses bcrypt.hash()
-- ⚠️ TODO: Add rate limiting to prevent brute force
-- ⚠️ TODO: Add account lockout after failed attempts
-- ⚠️ TODO: Implement password strength requirements
-- ⚠️ TODO: Add password reset functionality
