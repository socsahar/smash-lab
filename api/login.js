/**
 * Login Function - Netlify Serverless Function
 * Handles user authentication with bcrypt password verification
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', '..', 'data', 'users.json');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable must be set');

// Read database
function readDB() {
    try {
        if (!fs.existsSync(dbPath)) {
            return { users: [] };
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
}

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

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Validate input
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email and password are required' })
            };
        }

        // Read database
        const db = readDB();

        // Get user from database
        const user = db.users.find(u => u.email === email);

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

        // Check if email is verified (skip for now in development)
        // if (!user.verified) {
        //   return {
        //     statusCode: 403,
        //     headers,
        //     body: JSON.stringify({ 
        //       error: 'Email not verified. Please check your email for verification link.',
        //       needsVerification: true
        //     })
        //   };
        // }

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
};