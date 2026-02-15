# User Authentication Integration Guide

## Overview
The login/authentication system has been fully integrated across all pages of the SmashLabs website. Users can now log in, register, and manage their accounts from any page on the site.

## What Was Added

### 1. **CSS Styles** (`css/user-auth.css`)
- Responsive user authentication widget styles
- User avatar display with initials
- Dropdown menu for logged-in users
- Login/Register buttons for guest users
- Admin badge for admin users
- Mobile-responsive design

### 2. **JavaScript** (`js/user-auth.js`)
- Automatic user state detection (logged in/out)
- Dynamic widget rendering based on user status
- Dropdown menu functionality
- Logout functionality with confirmation
- Storage event listening for cross-tab synchronization
- Admin detection and special handling

### 3. **Integration Across All Pages**
The following files were updated to include the user authentication widget:
- `index.html` - Home page
- `about.html` - About page
- `rage-room.html` - Rage room page
- `paint-room.html` - Paint room page
- `throwing-axes.html` - Throwing axes page
- `graffiti-center.html` - Graffiti center page
- `birthday.html` - Birthday party page
- `rent-lab.html` - Lab rental page
- `order.html` - Order page
- `booking.html` - Booking page
- `waiver.html` - Waiver page
- `disclaimer.html` - Disclaimer page
- `cookie-settings.html` - Cookie settings page
- `accessibility.html` - Accessibility page

## Features

### For Guest Users (Not Logged In)
- **Login Button**: Redirects to login page
- **Register Button**: Redirects to login page with register form (#register hash)
- Visible on all pages in the header

### For Logged-In Users
- **User Avatar**: Shows user initials in a colored circle
- **User Name**: Displays the user's name
- **Dropdown Menu** with options:
  - "ההזמנות שלי" (My Orders) - Links to order page
  - "הזמנה חדשה" (New Booking) - Links to booking page
  - "התנתק" (Logout) - Logs out the user

### For Admin Users
- **Admin Badge**: Golden "מנהל" (Admin) badge
- **Special Dropdown** with:
  - "לוח בקרה" (Dashboard) - Links to admin panel
  - "הזמנה חדשה" (New Booking)
  - "התנתק" (Logout)

## How It Works

### 1. Widget Injection
When any page loads, the `user-auth.js` script:
1. Waits for DOM to be ready
2. Creates the user authentication widget
3. Injects it into the header before the hamburger menu
4. Updates the widget based on current user state

### 2. User State Detection
The script checks localStorage for:
- `smashlabs_current_user` - Regular user data
- `smashlabs_admin_logged_in` - Admin login flag

### 3. Dynamic Rendering
Based on the user state, the widget displays:
- Login/Register buttons (if not logged in)
- User info with dropdown menu (if logged in)
- Admin badge and special menu (if admin)

### 4. Logout Functionality
When a user clicks logout:
1. Confirmation dialog appears
2. User data is cleared from localStorage
3. User is redirected to the home page
4. Widget automatically updates on all open tabs

## Responsive Design

### Desktop (> 768px)
- Full user name displayed
- Widget positioned on the left side of header
- Dropdown menu appears below the toggle button

### Mobile (≤ 768px)
- User name hidden (only avatar shown)
- Widget centered below main navigation
- Dropdown positioned appropriately for mobile

## Cross-Tab Synchronization
The widget listens for localStorage changes, so:
- Logging in on one tab updates all open tabs
- Logging out on one tab logs out all tabs
- Real-time synchronization across all pages

## Global API
The script exposes a global `UserAuth` object with:
```javascript
window.UserAuth = {
    getCurrentUser()    // Returns current user object or null
    isAdminLoggedIn()   // Returns true if admin is logged in
    logout()            // Programmatically log out
    refresh()           // Refresh the widget display
}
```

## Updated Login Page
The login page (`login.html`) now supports:
- **Hash Navigation**: `login.html#register` automatically shows the register form
- **Improved UX**: Seamless switching between login and register forms

## Testing the Integration

### Test as Guest:
1. Open any page on the site
2. You should see "התחבר" and "הרשם" buttons in the header
3. Click either to go to the login page

### Test as Registered User:
1. Go to `login.html#register` and create an account
2. Verify your email (use the code sent)
3. Log in
4. Navigate to any page - you should see your avatar and name
5. Click the dropdown to see your options
6. Test logout functionality

### Test as Admin:
1. Log in with:
   - Email: `idan@smashlab.com`
   - Password: `1qaz@WSX1qaz@WSX`
2. You should see the golden "מנהל" badge
3. Dropdown shows admin dashboard option
4. Navigate between pages to verify persistence

## Files Modified

### New Files Created:
- `css/user-auth.css` - User authentication widget styles
- `js/user-auth.js` - User authentication widget logic
- `add-user-auth.ps1` - PowerShell script to add auth to all pages

### Modified Files:
- `js/login.js` - Added hash navigation support
- All HTML pages listed above - Added CSS and JS references

## Maintenance

### Adding to New Pages
For any new HTML page, add these two lines:

In the `<head>` section (after other CSS):
```html
<link rel="stylesheet" href="css/user-auth.css">
```

Before the closing `</body>` tag:
```html
<script src="js/user-auth.js"></script>
```

Or simply run the PowerShell script:
```powershell
.\add-user-auth.ps1
```

## Troubleshooting

### Widget Not Appearing
1. Check browser console for errors
2. Verify `user-auth.js` is loading
3. Check that header has class `header-inner`

### User State Not Persisting
1. Check browser localStorage
2. Verify `smashlabs_current_user` key exists
3. Check JSON format is valid

### Dropdown Not Working
1. Verify click event listeners are attached
2. Check for JavaScript errors
3. Ensure CSS for `.show` class is loaded

## Security Notes

- User data is stored in localStorage (client-side only)
- Admin credentials are checked in JavaScript (for demo purposes)
- For production, implement server-side authentication
- Consider adding JWT tokens for better security
- Implement session timeout for inactive users

## Next Steps

Consider implementing:
1. Server-side authentication API
2. Password reset functionality
3. User profile editing
4. Session management with expiration
5. Remember me functionality
6. Social login integration (Google, Facebook)

---

**Integration Complete!** The login system is now visible and functional across all pages of the SmashLabs website. 🎉
