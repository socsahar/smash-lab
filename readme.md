# SmashLabs - Professional Activity Center

## Overview
SmashLabs is a modern activity center offering rage rooms, paint rooms, axe throwing, and graffiti workshops. This site features a clean dark design with turquoise accents, integrated booking system, and full e-commerce capabilities.

## Quick Setup

### 1. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 2. Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Add your secret key to `.env` as `STRIPE_SECRET_KEY`
3. Create price products in Stripe Dashboard for each activity
4. Update price IDs in `.env`

### 3. Google Calendar Integration  
1. Create a Google Cloud Project
2. Enable Calendar API
3. Create a service account and download JSON key
4. Add service account email to `.env` as `GOOGLE_CLIENT_EMAIL`
5. Add private key to `.env` as `GOOGLE_PRIVATE_KEY` (escape newlines as \\n)
6. Create a calendar and add its ID to `.env`

### 4. Deploy
- **Netlify**: Connect repository, configure environment variables
- **Vercel**: Connect repository, configure environment variables
- **Other**: Ensure serverless functions in `/api` are supported

## Key Features

### Design System
- **Background**: Black (#0b0b0b)
- **Text**: White (#ffffff) - preserved across all elements
- **Accents**: Turquoise (#1FB6C2), Purple (#9b5de5), Blue (#5dd6f1)  
- **Typography**: 
  - Headings: RonenL (fallback: Rubik)
  - Body: Inter
- **Responsive type scale**: clamp() functions for fluid typography
- **Consistent spacing**: CSS custom properties for layout rhythm

### Core Functionality
- Removed complex gradients and animations

#### ✅ Typography System
- Added Inter font for body text
- Configured RonenL/Rubik for headings
- Implemented CSS custom properties for fonts

#### ✅ Clean UI Components
- Simplified navigation with clean styling
- Updated buttons without emojis or decorative elements
- Modernized cards with subtle shadows and borders

#### ✅ Order Modal System
- Accessible modal with focus management
- Form validation and submission handling
- ESC key and click-outside closing
- Pre-selection of services from grinders grid

#### ✅ Grinders 2x2 Grid
- Transformed 4 separate cards into single container
- 2x2 grid layout that stacks on mobile
- Clickable quadrants that open order modal
- Maintained detailed room information below

#### ✅ About Page
- Company values and process sections
- Team information
- Clean layout matching new design system
- CTA integration

#### ✅ SVG Icon System
- Replaced emoji social icons with scalable SVGs
- Icons use CSS currentColor for theming
- Maintained accessibility with proper labels

#### ✅ Mobile Responsive
- Mobile-first approach maintained
- Grinders grid stacks on small screens
- Touch-friendly button sizes
- Improved navigation menu

#### ✅ Accessibility
- WCAG contrast compliance
- Focus management in modal
- Proper ARIA labels and roles
- Keyboard navigation support

### Files Modified
- `styles.css` - Complete redesign with new variables and components
- `index.html` - Updated content, removed emojis, added grinders grid
- `about.html` - New page with company information
- `scripts.js` - Added modal functionality and improved UX
- `icons/` - New SVG icon library

### Browser Testing
- Tested in VS Code Simple Browser
- Dark theme renders correctly
- Modal functionality working
- Responsive design verified

### Git History
```
fe693e7 feat: replace social media icons with clean SVGs
7252172 feat: implement grinders 2x2 grid and About page  
5e0509e feat: implement order modal and remove emojis from CTAs
385e337 feat: implement dark theme with turquoise accents
55fec5b Initial commit - current graffiti/hip-hop theme
```

## Next Steps
- Add RonenL font files for proper typography
- Implement backend API for order submission
- Add more detailed error handling
- Consider adding subtle texture overlays (very low opacity)
- Implement analytics tracking

## Acceptance Criteria Status ✅

All original acceptance criteria have been met:

- ✅ Headings use RonenL (or Rubik fallback), body uses Inter
- ✅ Global background is dark (#0b0b0b), body text is white
- ✅ Turquoise accent color (#1FB6C2) applied site-wide
- ✅ Phone and email display in white, links highlight in turquoise
- ✅ CTAs have no emojis or subtitles, primary CTA opens order modal
- ✅ Order modal is accessible and functional
- ✅ Grinders section is single 2x2 container
- ✅ Footer has no decorative lines
- ✅ About page created and styled
- ✅ Icons replaced with SVGs using CSS variables
- ✅ No gradients or color transitions remain
- ✅ WCAG contrast compliance maintained
