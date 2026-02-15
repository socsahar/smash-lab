/**
 * Simple Express Server for SmashLabs
 * Handles static files and authentication APIs
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve photos directory with proper MIME types
app.use('/photos', express.static(path.join(__dirname, 'photos'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.MOV') || filePath.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/quicktime');
    } else if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    }
  }
}));

// Set correct MIME types for JavaScript modules
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
  }
}));

// API Routes - Import the handlers
const registerHandler = require('./api/register').handler;
const loginHandler = require('./api/login').handler;
const sendVerificationHandler = require('./api/send-verification');
const calendarAPI = require('./api/calendar');

// Wrapper to convert Netlify function to Express middleware
function netlifyToExpress(handler) {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
      path: req.path
    };

    const context = {};
    
    try {
      const result = await handler(event, context);
      res.status(result.statusCode);
      
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      res.send(result.body);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Direct Express middleware for send-verification (not Netlify format)
app.post('/api/send-verification', sendVerificationHandler);

// Calendar API routes
app.get('/api/calendar/check-availability', calendarAPI.checkAvailability);
app.post('/api/calendar/create-booking', calendarAPI.createBooking);
app.get('/api/calendar/bookings', calendarAPI.getBookingsByDate);
app.get('/api/calendar/bookings/:bookingId', calendarAPI.getBookingById);
app.put('/api/calendar/bookings/:bookingId', calendarAPI.updateBooking);
app.delete('/api/calendar/bookings/:bookingId', calendarAPI.cancelBooking);
app.get('/api/calendar/stats', calendarAPI.getDashboardStats);

// Register routes
app.post('/api/register', netlifyToExpress(registerHandler));
app.post('/api/login', netlifyToExpress(loginHandler));

// Verifone payment routes
const verifoneCheckoutHandler = require('./api/verifone-checkout').handler;
const verifoneWebhookHandler = require('./api/verifone-webhook').handler;
app.post('/api/verifone-checkout', netlifyToExpress(verifoneCheckoutHandler));
app.post('/api/verifone-webhook', netlifyToExpress(verifoneWebhookHandler));

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');
  
  // Hardcoded admin credentials (primary method)
  const ADMIN_EMAIL = 'idan@smashlab.com';
  const ADMIN_PASSWORD = 'smash123'; // Change this in production!
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      token: 'admin-token-' + Date.now(),
      user: {
        email: email,
        name: 'Idan',
        is_admin: true
      }
    });
  } else {
    // Check if user exists in Supabase and has is_admin flag
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_admin', true)
        .single();
      
      if (user && await bcrypt.compare(password, user.password_hash)) {
        res.json({
          success: true,
          token: 'admin-token-' + Date.now(),
          user: {
            email: user.email,
            name: user.name,
            is_admin: true
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
      }
    } catch (err) {
      console.error('Supabase admin check failed:', err);
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  }
});

// Customer login endpoint with bcrypt verification
app.post('/api/customer/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if verified
    if (!user.verified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        code: 'NOT_VERIFIED',
        email: user.email
      });
    }
    
    // Success - return user without password
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin || false,
        verified: user.verified
      }
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer registration endpoint with bcrypt password hashing
app.post('/api/customer/register', async (req, res) => {
  const { name, email, password, verificationCode, codeExpiry } = req.body;
  const bcrypt = require('bcrypt');
  
  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user (unverified - requires email verification)
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name: name,
        email: email,
        password_hash: passwordHash,
        verified: false,
        is_admin: false
      }])
      .select()
      .single();
    
    if (error) {
      console.error('User creation error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified
      }
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║            SmashLabs Server Running! 🚀           ║
╚════════════════════════════════════════════════════╝

  🌐 Local:    http://localhost:${PORT}
  📝 Login:    http://localhost:${PORT}/login.html
  🏠 Home:     http://localhost:${PORT}/index.html

  API Endpoints:
  ✓ POST /api/register          - User registration
  ✓ POST /api/login             - User authentication
  ✓ POST /api/send-verification - Email verification

  Press Ctrl+C to stop the server
  `);
});

module.exports = app;
