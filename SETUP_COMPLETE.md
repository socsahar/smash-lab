# Complete Setup Instructions

## 🚀 Quick Start Guide

Follow these steps in order to complete the calendar booking system setup:

### Step 1: Follow Setup Guides

1. **Google Calendar API Setup**
   - Open `CALENDAR_SETUP.md` and follow all 6 steps
   - Download the service account JSON credentials
   - Save as `google-calendar-credentials.json` in project root
   - Share calendar with service account email

2. **Supabase Database Setup**
   - Open `SUPABASE_SETUP.md` and follow all 6 steps
   - Create `bookings` table with proper schema
   - Get API credentials (URL, anon key, service_role key)

### Step 2: Update Environment Variables

Open `.env` file and update these values:

```env
# Supabase (from Step 2 of SUPABASE_SETUP.md)
SUPABASE_SERVICE_KEY=<paste your service_role key here>

# Google Calendar (from Step 4 of CALENDAR_SETUP.md)
# Copy the ENTIRE contents of google-calendar-credentials.json as ONE LINE
GOOGLE_CALENDAR_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
```

### Step 3: Install Required Packages

The project already has `googleapis` and `@supabase/supabase-js` in package.json.

Run this command to ensure all packages are installed:

```bash
npm install
```

### Step 4: Add to .gitignore

Make sure these files are in your `.gitignore`:

```
google-calendar-credentials.json
.env
```

### Step 5: Test the Server

Start your server:

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════╗
║            SmashLabs Server Running! 🚀           ║
╚════════════════════════════════════════════════════╝

🌐 Server running at: http://localhost:8000
```

### Step 6: Test Booking Flow

1. Go to `http://localhost:8000/select-package.html`
2. Select a package
3. Fill in order details (name, email, phone, date, time)
4. Complete waiver form
5. Complete payment
6. Check order success page - booking should be created automatically

### Step 7: Verify Calendar Integration

1. Log in to Google Calendar as `smashlab.nahariya@gmail.com`
2. You should see the booking event with:
   - Customer name
   - Package details
   - Correct date and time
   - Duration

### Step 8: Test Availability Checking

1. Go back to order page
2. Select a date
3. Choose a time slot
4. Complete booking
5. Go back to order page
6. Select the same date
7. The time slot you booked should now show "(תפוס)" and be disabled

---

## 📋 API Endpoints

The calendar system exposes these endpoints:

- **GET** `/api/calendar/check-availability?packageId=XXX&date=YYYY-MM-DD`
  - Returns occupied time slots for a specific package and date

- **POST** `/api/calendar/create-booking`
  - Creates a booking in Google Calendar and Supabase
  - Body: `{ packageId, packageName, customerName, customerEmail, customerPhone, bookingDate, bookingTime, durationMinutes, price }`

- **GET** `/api/calendar/bookings?date=YYYY-MM-DD`
  - Returns all bookings for a specific date (admin view)

- **DELETE** `/api/calendar/bookings/:bookingId`
  - Cancels a booking (removes from calendar and marks as cancelled)

---

## 🔧 Troubleshooting

### Calendar events not creating
- Check that `GOOGLE_CALENDAR_CREDENTIALS` is a valid JSON string in `.env`
- Verify service account email has "Make changes to events" permission
- Check server logs for specific error messages

### Availability checking not working
- Verify `SUPABASE_SERVICE_KEY` is set correctly
- Check that bookings table exists in Supabase
- Look at browser console for API errors

### "Package ID not found" errors
- The package ID is stored as `service` in localStorage
- Check that packages.json has matching IDs

---

## ✅ What's Implemented

1. ✅ Google Calendar API integration
2. ✅ Supabase database for fast queries
3. ✅ Real-time availability checking on order page
4. ✅ Automatic booking creation after payment
5. ✅ Package-specific time slot management
6. ✅ Overlap handling based on package duration
7. ✅ Calendar event with customer details
8. ✅ Booking cancellation support

---

## 📞 Support

If you encounter issues:
1. Check the error messages in server logs
2. Verify all environment variables are set
3. Test API endpoints directly with Postman/curl
4. Check Supabase dashboard for database entries
5. Check Google Calendar for created events
