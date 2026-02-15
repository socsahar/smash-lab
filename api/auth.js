/**
 * Authentication API - Registration & Login with bcrypt password hashing
 * Uses JSON file database for user storage (LowDB)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Initialize database
const dbPath = path.join(__dirname, '..', 'data', 'users.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// Set default database structure
db.defaults({ users: [] }).write();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable must be set');

// Email configuration (configure with your SMTP settings)
const emailTransporter = nodemailer.createTransport({
    // For Gmail:
    // service: 'gmail',
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASSWORD
    // }

    // For testing (logs to console):
    streamTransport: true,
    newline: 'unix',
    buffer: true
});

/**
 * Register new user
 */
exports.handler = async(event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Parse the request
    const endpoint = event.path.split('/').pop();

    try {
        if (endpoint === 'register' && event.httpMethod === 'POST') {
            return await handleRegister(event, headers);
        } else if (endpoint === 'login' && event.httpMethod === 'POST') {
            return await handleLogin(event, headers);
        } else if (endpoint === 'verify' && event.httpMethod === 'POST') {
            return await handleVerify(event, headers);
        } else if (endpoint === 'forgot-password' && event.httpMethod === 'POST') {
            return await handleForgotPassword(event, headers);
        } else if (endpoint === 'reset-password' && event.httpMethod === 'POST') {
            return await handleResetPassword(event, headers);
        } else {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Endpoint not found' })
            };
        }
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};

/**
 * Handle user registration
 */
async function handleRegister(event, headers) {
    const { name, email, password } = JSON.parse(event.body);

    // Validate input
    if (!name || !email || !password) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'All fields are required' })
        };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid email format' })
        };
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
            })
        };
    }

    // Check if user already exists
    const existingUser = db.get('users').find({ email }).value();
    if (existingUser) {
        return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'Email already registered' })
        };
    }

    try {
        // Hash password with bcrypt (10 rounds of salting)
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification code
        const verificationCode = crypto.randomBytes(32).toString('hex');

        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            passwordHash,
            verified: false,
            verificationCode,
            resetToken: null,
            resetTokenExpiry: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Insert user into database
        db.get('users').push(newUser).write();

        // Send verification email
        await sendVerificationEmail(email, name, verificationCode);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Registration successful. Please check your email for verification link.',
                userId: newUser.id
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Registration failed', details: error.message })
        };
    }
}

/**
 * Handle user login
 */
async function handleLogin(event, headers) {
    const { email, password } = JSON.parse(event.body);

    // Validate input
    if (!email || !password) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email and password are required' })
        };
    }

    try {
        // Get user from database
        const user = db.get('users').find({ email }).value();

        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid email or password' })
            };
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid email or password' })
            };
        }

        // Check if email is verified
        if (!user.verified) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    error: 'Email not verified. Please check your email for verification link.',
                    needsVerification: true
                })
            };
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, name: user.name },
            JWT_SECRET, { expiresIn: '7d' }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    verified: user.verified
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Login failed', details: error.message })
        };
    }
}

/**
 * Handle email verification
 */
async function handleVerify(event, headers) {
    const { code } = JSON.parse(event.body);

    if (!code) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Verification code is required' })
        };
    }

    try {
        // Find user with verification code
        const user = db.get('users').find({ verificationCode: code }).value();

        if (!user) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Invalid verification code' })
            };
        }

        if (user.verified) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email already verified' })
            };
        }

        // Mark user as verified
        db.get('users')
            .find({ id: user.id })
            .assign({ verified: true, verificationCode: null, updatedAt: new Date().toISOString() })
            .write();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Email verified successfully. You can now login.'
            })
        };
    } catch (error) {
        console.error('Verification error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Verification failed', details: error.message })
        };
    }
}

/**
 * Handle forgot password request
 */
async function handleForgotPassword(event, headers) {
    const { email } = JSON.parse(event.body);

    if (!email) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email is required' })
        };
    }

    try {
        const user = db.get('users').find({ email }).value();

        if (!user) {
            // Don't reveal if email exists or not for security
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent.'
                })
            };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save reset token
        db.get('users')
            .find({ id: user.id })
            .assign({
                resetToken,
                resetTokenExpiry: resetTokenExpiry.toISOString(),
                updatedAt: new Date().toISOString()
            })
            .write();

        // Send reset email
        await sendPasswordResetEmail(email, user.name, resetToken);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'If the email exists, a password reset link has been sent.'
            })
        };
    } catch (error) {
        console.error('Forgot password error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Request failed', details: error.message })
        };
    }
}

/**
 * Handle password reset
 */
async function handleResetPassword(event, headers) {
    const { token, newPassword } = JSON.parse(event.body);

    if (!token || !newPassword) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Token and new password are required' })
        };
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
            })
        };
    }

    try {
        const user = db.get('users').find({ resetToken: token }).value();

        if (!user) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Invalid or expired reset token' })
            };
        }

        // Check if token is expired
        if (new Date(user.resetTokenExpiry) < new Date()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Reset token has expired' })
            };
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        db.get('users')
            .find({ id: user.id })
            .assign({
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
                updatedAt: new Date().toISOString()
            })
            .write();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Password reset successfully. You can now login with your new password.'
            })
        };
    } catch (error) {
        console.error('Reset password error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Password reset failed', details: error.message })
        };
    }
}

/**
 * Send verification email
 */
async function sendVerificationEmail(email, name, verificationCode) {
    const verificationUrl = `${process.env.SITE_URL || 'http://localhost:8000'}/verify.html?code=${verificationCode}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@smashlabs.co.il',
        to: email,
        subject: 'אימות כתובת מייל - SmashLabs',
        html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Heebo', Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          h1 { color: #ff6b00; }
          .button { background: linear-gradient(45deg, #ff6b00, #1fb6c2); color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .code { background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>שלום ${name}!</h1>
          <p>תודה שנרשמת ל-SmashLabs!</p>
          <p>כדי להשלים את ההרשמה, אנא אמת את כתובת המייל שלך:</p>
          <a href="${verificationUrl}" class="button">אמת מייל</a>
          <p>או העתק את הקוד הבא:</p>
          <div class="code">${verificationCode}</div>
          <p>הקישור תקף ל-24 שעות.</p>
          <p>אם לא ביקשת הרשמה זו, אנא התעלם מהמייל הזה.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">SmashLabs - המתחם המושלם לשחרור לחצים</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Verification email sent:', info);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.SITE_URL || 'http://localhost:8000'}/reset-password.html?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@smashlabs.co.il',
        to: email,
        subject: 'איפוס סיסמה - SmashLabs',
        html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Heebo', Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          h1 { color: #ff6b00; }
          .button { background: linear-gradient(45deg, #ff6b00, #1fb6c2); color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>שלום ${name}!</h1>
          <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
          <p>לחץ על הכפתור למטה כדי לאפס את הסיסמה:</p>
          <a href="${resetUrl}" class="button">אפס סיסמה</a>
          <p>הקישור תקף לשעה אחת.</p>
          <p>אם לא ביקשת איפוס סיסמה, אנא התעלם מהמייל הזה.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">SmashLabs - המתחם המושלם לשחרור לחצים</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}