# Google Calendar API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it: `SmashLabs Booking System`
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Create Service Account (for server-side access)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: `smashlabs-calendar-service`
4. Service account ID: `smashlabs-calendar-service`
5. Click "Create and Continue"
6. Skip optional steps, click "Done"

## Step 4: Generate Service Account Key

1. In Credentials page, find your service account
2. Click on it → Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - a JSON file will download
6. **IMPORTANT**: Save this file as `google-calendar-credentials.json` in your project root
7. Add to .gitignore: `google-calendar-credentials.json`

## Step 5: Share Calendar with Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. Sign in as `smashlab.nahariya@gmail.com`
3. Find "My calendars" in left sidebar
4. Click ⋮ next to your calendar → "Settings and sharing"
5. Scroll to "Share with specific people"
6. Click "Add people"
7. Enter the service account email (found in JSON file, looks like: `smashlabs-calendar-service@project-id.iam.gserviceaccount.com`)
8. Set permission: "Make changes to events"
9. Click "Send"

## Step 6: Get Calendar ID

1. Still in Calendar settings
2. Scroll down to "Integrate calendar"
3. Copy the "Calendar ID" (should be `smashlab.nahariya@gmail.com`)
4. Save this for .env file

## Done! ✅

You now have:
- Service account JSON credentials file
- Calendar ID
- API enabled

Next: Supabase setup
