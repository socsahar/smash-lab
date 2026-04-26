# SmashLabs Website

A modern dark-themed website for SmashLabs with integrated order flow, booking system, and payment processing.

## Features

- 🎨 **Dark Theme Design** - Clean, professional dark interface with turquoise accents
- 🛒 **Order Flow** - Dedicated order page with Stripe Checkout integration
- 📅 **Booking System** - Google Calendar integration for appointment scheduling
- 💳 **Stripe Payments** - Secure payment processing with minimal code implementation
- ♿ **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- 📱 **Responsive Design** - Mobile-first approach with consistent styling across devices

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see Configuration section)
4. Deploy to Netlify/Vercel or run locally

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Google Calendar Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

### Stripe Setup

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys**: From Dashboard > Developers > API Keys
3. **Create Products**: In Dashboard > Products, create products for each service:
   - Paint Room (חדר צבע)
   - Rage Room (חדר זעם) 
   - Throwing Axes (זריקת גרזנים)
   - Graffiti Center (מרכז גרפיטי)
4. **Update Price IDs**: Replace the placeholder Price IDs in `/js/order.js`:

```javascript
const priceMap = {
    'paint-room': 'price_YOUR_PAINT_ROOM_PRICE_ID',
    'rage-room': 'price_YOUR_RAGE_ROOM_PRICE_ID',
    'throwing-axes': 'price_YOUR_THROWING_AXES_PRICE_ID',
    'graffiti-center': 'price_YOUR_GRAFFITI_CENTER_PRICE_ID'
};
```

### Google Calendar Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google Calendar API**:
   - Navigate to APIs & Services > Library
   - Search for "Google Calendar API" and enable it

3. **Create Service Account**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file

4. **Extract Credentials**:
   - From the downloaded JSON file, copy `client_email` and `private_key`
   - Set these in your environment variables

5. **Share Calendar**:
   - Open Google Calendar
   - Create a new calendar or use existing one
   - Go to calendar settings > Share with specific people
   - Add the service account email with "Make changes to events" permission
   - Copy the Calendar ID from calendar settings

## File Structure

```
├── index.html              # Home page with Order Now button
├── order.html              # Canonical order page  
├── booking.html            # Booking/appointment page
├── order-success.html      # Order completion page
├── about.html              # About page
├── styles.css              # Main stylesheet with dark theme
├── js/
│   ├── order.js           # Order form handling
│   └── booking.js         # Booking form handling
├── api/
│   ├── create-checkout-session.js  # Stripe integration
│   └── book.js            # Google Calendar integration
├── icons/                 # SVG icons
├── _redirects            # Netlify redirect rules
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## Deployment

### Netlify

1. Connect your repository to Netlify
2. Set environment variables in Site Settings > Environment Variables
3. Deploy - redirects will be automatically configured

### Vercel

1. Connect your repository to Vercel
2. Set environment variables in Project Settings
3. Deploy - redirects configured via vercel.json

### Manual/Traditional Hosting

For Apache, add to `.htaccess`:

```apache
# Redirect old order paths
RewriteEngine On
RewriteRule ^order\.html$ /order [R=301,L]
RewriteRule ^buy$ /order [R=301,L]
RewriteRule ^checkout$ /order [R=301,L]
RewriteRule ^shop/order$ /order [R=301,L]
```

## Development

Run locally with Python:
```bash
python -m http.server 8000
```

Or with Node.js:
```bash
npx serve .
```

## Design System

### Colors
- Background: `#0b0b0b` (--bg)
- Text: `#ffffff` (--text)  
- Accent: `#1FB6C2` (--accent)
- Muted: `#bfc7c9` (--muted)

### Typography
- Headings: RonenL (fallback: Rubik)
- Body: Inter
- Consistent scale with clamp() for responsive sizing

### Accessibility Features
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Focus indicators
- Screen reader compatibility
- Skip links (except on paint-room.html as requested)
- Prefers-reduced-motion support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions, contact: Smashlab.nahariya@gmail.com
