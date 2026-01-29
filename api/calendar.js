const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Google Calendar API
let calendar;
try {
  // Try to load from JSON file first, then fall back to env variable
  let credentials;
  const credentialsPath = path.join(__dirname, '..', 'google-calendar-credentials.json');
  
  if (fs.existsSync(credentialsPath)) {
    console.log('📄 Loading Google Calendar credentials from file...');
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  } else if (process.env.GOOGLE_CALENDAR_CREDENTIALS) {
    console.log('📄 Loading Google Calendar credentials from environment...');
    credentials = JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS);
  } else {
    console.warn('⚠️ No Google Calendar credentials found');
  }
  
  if (credentials) {
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );
    calendar = google.calendar({ version: 'v3', auth });
    console.log('✅ Google Calendar API initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Calendar:', error.message);
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'smashlab.nahariya@gmail.com';

/**
 * Check availability for a specific package on a specific date
 * @param {string} packageId - The package ID (e.g., 'solo-rage-basic')
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of occupied time slots
 */
async function checkAvailability(req, res) {
  try {
    const { packageId, date } = req.query;

    if (!packageId || !date) {
      return res.status(400).json({ 
        error: 'Missing required parameters: packageId and date' 
      });
    }

    // Query Supabase for bookings
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

    // Return occupied time slots with overlap information
    const occupiedSlots = bookings.map(booking => ({
      time: booking.booking_time,
      startTime: booking.booking_datetime,
      endTime: booking.end_datetime,
      duration: booking.duration_minutes
    }));

    res.json({
      packageId,
      date,
      occupiedSlots,
      totalOccupied: occupiedSlots.length
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create a calendar event and save to Supabase
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Created booking data
 */
async function createBooking(req, res) {
  try {
    const orderData = req.body;

    // Validate required fields
    const requiredFields = [
      'packageId', 'packageName', 'customerName', 'customerEmail', 
      'customerPhone', 'bookingDate', 'bookingTime', 'durationMinutes', 'price'
    ];
    
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Calculate datetime values
    const bookingDatetime = new Date(`${orderData.bookingDate}T${orderData.bookingTime}:00+02:00`);
    const endDatetime = new Date(bookingDatetime.getTime() + (orderData.durationMinutes * 60000));

    // Generate order ID if not provided
    const orderId = orderData.orderId || `ORD-${Date.now()}`;

    // Create Google Calendar event
    let googleEventId = null;
    if (calendar) {
      try {
        const event = {
          summary: `${orderData.packageName} - ${orderData.customerName}`,
          description: `
📦 Package: ${orderData.packageName} (${orderData.packageId})
👤 Customer: ${orderData.customerName}
📧 Email: ${orderData.customerEmail}
📱 Phone: ${orderData.customerPhone}
💰 Price: ₪${orderData.price}
🔖 Order ID: ${orderId}
⏱️ Duration: ${orderData.durationMinutes} minutes

Booked via SmashLabs Website
          `.trim(),
          start: {
            dateTime: bookingDatetime.toISOString(),
            timeZone: 'Asia/Jerusalem',
          },
          end: {
            dateTime: endDatetime.toISOString(),
            timeZone: 'Asia/Jerusalem',
          },
          colorId: '11', // Red color for visibility
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 60 },      // 1 hour before
            ],
          },
        };

        const response = await calendar.events.insert({
          calendarId: CALENDAR_ID,
          requestBody: event,
        });

        googleEventId = response.data.id;
        console.log('✅ Google Calendar event created:', googleEventId);
      } catch (calendarError) {
        console.error('⚠️ Google Calendar creation failed:', calendarError);
        // Continue with Supabase even if calendar fails
      }
    }

    // Save to Supabase
    const { data: booking, error: supabaseError } = await supabase
      .from('bookings')
      .insert([
        {
          package_id: orderData.packageId,
          package_name: orderData.packageName,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
          booking_date: orderData.bookingDate,
          booking_time: orderData.bookingTime,
          booking_datetime: bookingDatetime.toISOString(),
          duration_minutes: orderData.durationMinutes,
          end_datetime: endDatetime.toISOString(),
          order_id: orderId,
          google_event_id: googleEventId,
          status: 'confirmed',
          price: orderData.price,
        }
      ])
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase insert error:', supabaseError);
      
      // If Supabase fails but calendar succeeded, try to delete calendar event
      if (googleEventId && calendar) {
        try {
          await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: googleEventId,
          });
        } catch (deleteError) {
          console.error('Failed to rollback calendar event:', deleteError);
        }
      }
      
      return res.status(500).json({ error: 'Failed to save booking' });
    }

    console.log('✅ Booking saved to Supabase:', booking.id);

    res.json({
      success: true,
      booking: {
        id: booking.id,
        orderId: orderId,
        googleEventId: googleEventId,
        bookingDatetime: bookingDatetime.toISOString(),
        endDatetime: endDatetime.toISOString(),
      },
      message: 'Booking created successfully',
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a single booking by ID
 */
async function getBookingById(req, res) {
  try {
    const { bookingId } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all bookings for a specific date (admin view)
 */
async function getBookingsByDate(req, res) {
  try {
    const { date, startDate, endDate } = req.query;

    let query = supabase
      .from('bookings')
      .select('*')
      .order('booking_datetime', { ascending: true });

    // Filter by date range or single date
    if (startDate && endDate) {
      query = query.gte('booking_date', startDate).lte('booking_date', endDate);
    } else if (date) {
      query = query.eq('booking_date', date);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    console.log(`📅 Fetching bookings: ${startDate || date} to ${endDate || date}`);
    console.log(`📊 Found ${bookings?.length || 0} bookings`);
    if (bookings && bookings.length > 0) {
      console.log('📋 Sample booking:', bookings[0]);
    }

    res.json({
      date: date || `${startDate} to ${endDate}`,
      bookings,
      totalBookings: bookings.length,
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Cancel a booking (soft delete)
 */
async function cancelBooking(req, res) {
  try {
    const { bookingId } = req.params;

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Delete from Google Calendar
    if (booking.google_event_id && calendar) {
      try {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: booking.google_event_id,
        });
        console.log('✅ Google Calendar event deleted');
      } catch (calendarError) {
        console.error('⚠️ Failed to delete calendar event:', calendarError);
      }
    }

    // Update status in Supabase
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update a booking
 */
async function updateBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;

    // Get current booking
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Prepare update object
    const updates = {};
    
    // Customer details
    if (updateData.customerName) updates.customer_name = updateData.customerName;
    if (updateData.customerEmail) updates.customer_email = updateData.customerEmail;
    if (updateData.customerPhone) updates.customer_phone = updateData.customerPhone;
    
    // Booking details
    if (updateData.bookingDate) {
      updates.booking_date = updateData.bookingDate;
      // Recalculate datetime
      const time = updateData.bookingTime || currentBooking.booking_time;
      updates.booking_datetime = new Date(`${updateData.bookingDate}T${time}:00+02:00`).toISOString();
      updates.end_datetime = new Date(new Date(updates.booking_datetime).getTime() + (currentBooking.duration_minutes * 60000)).toISOString();
    }
    
    if (updateData.bookingTime) {
      updates.booking_time = updateData.bookingTime;
      const date = updateData.bookingDate || currentBooking.booking_date;
      updates.booking_datetime = new Date(`${date}T${updateData.bookingTime}:00+02:00`).toISOString();
      updates.end_datetime = new Date(new Date(updates.booking_datetime).getTime() + (currentBooking.duration_minutes * 60000)).toISOString();
    }
    
    // Notes
    if (updateData.customerNotes !== undefined) updates.customer_notes = updateData.customerNotes;
    if (updateData.adminNotes !== undefined) updates.admin_notes = updateData.adminNotes;
    
    // Payment tracking
    if (updateData.paymentStatus) updates.payment_status = updateData.paymentStatus;
    if (updateData.paymentMethod) updates.payment_method = updateData.paymentMethod;
    if (updateData.paymentAmount) updates.payment_amount = updateData.paymentAmount;
    if (updateData.paymentDate) updates.payment_date = updateData.paymentDate;
    if (updateData.paymentTransactionId) updates.payment_transaction_id = updateData.paymentTransactionId;
    
    // Status
    if (updateData.status) updates.status = updateData.status;
    
    // Admin tracking
    if (updateData.updatedBy) updates.updated_by = updateData.updatedBy;

    // Update Google Calendar if date/time changed
    if (calendar && currentBooking.google_event_id && (updates.booking_datetime || updates.end_datetime)) {
      try {
        const event = {
          summary: `${currentBooking.package_name} - ${updates.customer_name || currentBooking.customer_name}`,
          description: `
📦 Package: ${currentBooking.package_name} (${currentBooking.package_id})
👤 Customer: ${updates.customer_name || currentBooking.customer_name}
📧 Email: ${updates.customer_email || currentBooking.customer_email}
📱 Phone: ${updates.customer_phone || currentBooking.customer_phone}
💰 Price: ₪${currentBooking.price}
🔖 Order ID: ${currentBooking.order_id}
⏱️ Duration: ${currentBooking.duration_minutes} minutes
💳 Payment: ${updates.payment_status || currentBooking.payment_status || 'pending'}
📝 Notes: ${updates.admin_notes || currentBooking.admin_notes || 'None'}

Last Updated: ${new Date().toLocaleString('he-IL')}
          `.trim(),
          start: {
            dateTime: updates.booking_datetime || currentBooking.booking_datetime,
            timeZone: 'Asia/Jerusalem',
          },
          end: {
            dateTime: updates.end_datetime || currentBooking.end_datetime,
            timeZone: 'Asia/Jerusalem',
          },
          colorId: '11',
        };

        await calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: currentBooking.google_event_id,
          requestBody: event,
        });

        console.log('✅ Google Calendar event updated');
      } catch (calendarError) {
        console.error('⚠️ Failed to update calendar event:', calendarError);
      }
    }

    // Update in Supabase
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: 'Failed to update booking' });
    }

    res.json({
      success: true,
      booking: updatedBooking,
      message: 'Booking updated successfully',
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get dashboard statistics
 */
async function getDashboardStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Today's bookings
    const { data: todayBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', today)
      .in('status', ['confirmed', 'completed']);

    // This week's bookings
    const { data: weekBookings } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', thisWeekStart.toISOString().split('T')[0])
      .in('status', ['confirmed', 'completed']);

    // This month's bookings
    const { data: monthBookings } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', thisMonthStart.toISOString().split('T')[0])
      .in('status', ['confirmed', 'completed']);

    // Revenue calculations
    const monthRevenue = monthBookings?.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0) || 0;
    const paidRevenue = monthBookings?.filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (parseFloat(b.payment_amount || b.price) || 0), 0) || 0;

    // Most popular package
    const packageCounts = {};
    monthBookings?.forEach(b => {
      const packageId = b.package_id || b.package_name;
      packageCounts[packageId] = (packageCounts[packageId] || 0) + 1;
    });
    const mostPopularEntry = Object.entries(packageCounts)
      .sort((a, b) => b[1] - a[1])[0];
    const mostPopular = mostPopularEntry ? {
      package_id: mostPopularEntry[0],
      count: mostPopularEntry[1]
    } : null;

    // Upcoming bookings (next 5)
    const { data: upcomingBookingsRaw } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_datetime', new Date().toISOString())
      .in('status', ['confirmed', 'completed'])
      .order('booking_datetime', { ascending: true })
      .limit(5);
    
    // Map to consistent field names
    const upcomingBookings = upcomingBookingsRaw?.map(b => ({
      id: b.id,
      date: b.booking_date,
      time: b.booking_time,
      package_id: b.package_id,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      status: b.status,
      payment_status: b.payment_status
    })) || [];

    // Payment stats
    const { data: pendingPayments } = await supabase
      .from('bookings')
      .select('*')
      .eq('payment_status', 'pending')
      .in('status', ['confirmed', 'completed']);

    res.json({
      today: {
        count: todayBookings?.length || 0,
        bookings: todayBookings || [],
      },
      week: {
        count: weekBookings?.length || 0,
      },
      month: {
        count: monthBookings?.length || 0,
        revenue: monthRevenue,
        paidRevenue: paidRevenue,
        pendingRevenue: monthRevenue - paidRevenue,
      },
      mostPopularPackage: mostPopular,
      upcoming: upcomingBookings || [],
      payments: {
        pending: pendingPayments?.length || 0,
        pendingAmount: pendingPayments?.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0) || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  checkAvailability,
  createBooking,
  getBookingsByDate,
  getBookingById,
  cancelBooking,
  updateBooking,
  getDashboardStats,
};
