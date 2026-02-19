// Vercel Serverless Function: Check Availability
// Route: GET /api/calendar/check-availability?packageId=xxx&date=YYYY-MM-DD

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packageId, date } = req.query;

    if (!packageId || !date) {
      return res.status(400).json({
        error: 'Missing required parameters: packageId and date'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Query Supabase for confirmed bookings on this date for this package
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('booking_time, booking_datetime, end_datetime, duration_minutes')
      .eq('package_id', packageId)
      .eq('booking_date', date)
      .eq('status', 'confirmed')
      .order('booking_datetime', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to check availability' });
    }

    // Return occupied time slots
    const occupiedSlots = (bookings || []).map(booking => ({
      time: booking.booking_time,
      startTime: booking.booking_datetime,
      endTime: booking.end_datetime,
      duration: booking.duration_minutes
    }));

    return res.status(200).json({
      packageId,
      date,
      occupiedSlots,
      totalOccupied: occupiedSlots.length
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
