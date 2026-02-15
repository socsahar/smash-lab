# Environment Configuration Setup Guide

## Overview
All sensitive credentials and API keys have been moved to environment variables and a central configuration file. No more hardcoded secrets in your code!

## Files Created/Modified

### ✅ New Files
1. **`.env`** - Your actual environment variables (NEVER commit this!)
2. **`.env.example`** - Template for sharing with team
3. **`.gitignore`** - Protects sensitive files from git
4. **`js/config.js`** - Client-side configuration loader

### 📝 Modified Files
- `js/supabase-client.js` - Now uses ENV_CONFIG
- `waiver.html` - Uses ENV_CONFIG for EmailJS
- `justwaiver.html` - Uses ENV_CONFIG for EmailJS
- `admin.html` - Loads config.js
- `login.html` - Loads config.js
- `owner-dashboard.html` - Loads config.js
- `order.html` - Loads config.js

## Setup Instructions

### Step 1: Configure EmailJS (for waiver forms)
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Sign up/login with your email
3. Add Email Service:
   - Click "Add New Service"
   - Select Gmail
   - Connect `Smashlab.nahariya@gmail.com`
   - Note your **Service ID**
4. Create Email Template:
   - Click "Email Templates" → "Create New Template"
   - Template content should include these variables:
     ```
     Form Type: {{form_type}}
     Full Name: {{full_name}}
     ID Number: {{id_number}}
     Address: {{address}}
     Phone: {{phone}}
     Email: {{email}}
     Signature: {{signature}}
     Date: {{signature_date}}
     Time: {{signature_time}}
     Waiver Agreed: {{waiver_agreed}}
     Emergency Contact: {{emergency_contact}}
     Signed At: {{signed_at}}
     
     For waiver.html also include:
     Order ID: {{order_id}}
     Service: {{service_name}}
     Quantity: {{quantity}}
     Order Date: {{order_date}}
     ```
   - Note your **Template ID**
5. Get Public Key:
   - Go to "Account" → "General"
   - Copy your **Public Key**

### Step 2: Update Configuration Files

#### Option A: Update `js/config.js` (Recommended for testing)
```javascript
EMAILJS_PUBLIC_KEY: 'your_actual_public_key',
EMAILJS_SERVICE_ID: 'your_actual_service_id',
EMAILJS_TEMPLATE_ID: 'your_actual_template_id',
```

#### Option B: Update `.env` (For production)
```bash
EMAILJS_PUBLIC_KEY=your_actual_public_key
EMAILJS_SERVICE_ID=your_actual_service_id
EMAILJS_TEMPLATE_ID=your_actual_template_id
```

### Step 3: Configure Stripe (for payments)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers → API Keys
3. Update in `js/config.js`:
   ```javascript
   STRIPE_PUBLISHABLE_KEY: 'pk_test_your_key_here',
   ```
4. Update in `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

### Step 4: Configure Resend (for verification emails)
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create API Key
3. Update in `.env`:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

### Step 5: Security Keys
Generate strong random strings for:
```bash
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret-key
```

You can generate these using:
```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

## Environment Variables Reference

### 🔑 Already Configured
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_ANON_KEY` - Your Supabase public key
- ✅ `EMAIL_TO` - Waiver recipient email (Smashlab.nahariya@gmail.com)

### ⚠️ Need Your Keys
- ❌ `EMAILJS_PUBLIC_KEY` - From EmailJS dashboard
- ❌ `EMAILJS_SERVICE_ID` - From EmailJS dashboard
- ❌ `EMAILJS_TEMPLATE_ID` - From EmailJS dashboard
- ❌ `STRIPE_SECRET_KEY` - From Stripe dashboard (backend only)
- ❌ `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- ❌ `RESEND_API_KEY` - From Resend dashboard
- ❌ `JWT_SECRET` - Generate random string
- ❌ `SESSION_SECRET` - Generate random string

## Testing

### Test Waiver Email Sending
1. Open `waiver.html` or `justwaiver.html`
2. Fill out the form
3. Submit
4. Check `Smashlab.nahariya@gmail.com` inbox

### Test Configuration Loading
Open browser console (F12) and type:
```javascript
console.log(window.ENV_CONFIG);
```

You should see your configuration object.

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to git (already in .gitignore)
- Only public keys go in `js/config.js` (client-side)
- Secret keys stay in `.env` (server-side only)
- `js/config.js` is exposed to browsers - no secrets there!

## Troubleshooting

### EmailJS not working?
- Check browser console for errors
- Verify `js/config.js` is loaded before EmailJS scripts
- Confirm keys are correct in `js/config.js`

### Supabase connection failed?
- Check that `js/config.js` loads before `js/supabase-client.js`
- Verify URL and key are correct

### Configuration not loading?
- Open browser console
- Check for `window.ENV_CONFIG` object
- Look for JavaScript errors

## What Was Changed?

### Before (Hardcoded ❌)
```javascript
const SUPABASE_URL = 'https://aquhidjcuxkhkwosfvgf.supabase.co';
emailjs.init({ publicKey: "YOUR_PUBLIC_KEY" });
to_email: 'Smashlab.nahariya@gmail.com',
```

### After (Environment Variables ✅)
```javascript
const SUPABASE_URL = window.ENV_CONFIG.SUPABASE_URL;
emailjs.init({ publicKey: window.ENV_CONFIG.EMAILJS_PUBLIC_KEY });
to_email: window.ENV_CONFIG.EMAIL_TO,
```

## Next Steps
1. Update `js/config.js` with your EmailJS credentials
2. Test waiver form submission
3. Configure Stripe for payments
4. Update production `.env` on your server
