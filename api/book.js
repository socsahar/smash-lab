// Google Calendar Booking API
// This is a serverless function for creating calendar events

import { google } from 'googleapis';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, startISO, endISO, timeZone, notes } = req.body;

        // Validate required fields
        if (!name || !email || !startISO || !endISO || !timeZone) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email, startISO, endISO, timeZone' 
            });
        }

        // Initialize Google Auth with service account
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        // Create calendar instance
        const calendar = google.calendar({ version: 'v3', auth });

        // Create calendar event
        const event = {
            summary: `SmashLabs Booking: ${name}`,
            description: `Booking via SmashLabs website\n\nCustomer: ${name}\nEmail: ${email}\n\nNotes: ${notes || 'No additional notes'}`,
            start: {
                dateTime: startISO,
                timeZone: timeZone,
            },
            end: {
                dateTime: endISO,
                timeZone: timeZone,
            },
            attendees: [
                { email: email }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 24 hours before
                    { method: 'popup', minutes: 30 }, // 30 minutes before
                ],
            },
            location: 'SmashLabs, רחוב הגרפיטי 15, תל אביב',
            status: 'confirmed'
        };

        // Insert event into calendar
        const { data } = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: event,
        });

        return res.status(200).json({
            ok: true,
            eventId: data.id,
            htmlLink: data.htmlLink,
            startTime: data.start.dateTime,
            endTime: data.end.dateTime
        });

    } catch (error) {
        console.error('Google Calendar API error:', error);
        return res.status(500).json({
            ok: false,
            error: 'Failed to create calendar event',
            message: error.message
        });
    }
}

// Setup instructions:
/*
1. Create a Google Cloud Project
2. Enable Google Calendar API
3. Create a Service Account
4. Generate and download service account key
5. Share the target calendar with the service account email
6. Set environment variables:
   - GOOGLE_CLIENT_EMAIL: service account email
   - GOOGLE_PRIVATE_KEY: private key from service account JSON (keep \n as \\n)
   - GOOGLE_CALENDAR_ID: the calendar ID to create events in
*/
