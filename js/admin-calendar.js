// @ts-nocheck
// Admin Calendar - Calendar Views
// This module handles month/week/day calendar views with booking visualization

(function() {
        'use strict';

        const API_BASE = window.location.hostname === 'localhost' ?
            'http://localhost:8000' :
            '';

        let currentDate = new Date();
        let currentView = 'month'; // 'month', 'week', or 'day'
        let calendarBookings = [];
        let calendarEvents = [];

        // Load calendar
        async function loadCalendar() {
            const calendarSection = document.getElementById('calendar-section');

            try {
                calendarSection.innerHTML = '<div class="loading">טוען לוח שנה</div>';

                // Fetch bookings for current month
                await fetchCalendarBookings();

                // Render calendar
                renderCalendar();

            } catch (error) {
                console.error('Error loading calendar:', error);
                calendarSection.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <h3>שגיאה בטעינת לוח השנה</h3>
                <p>${error.message}</p>
                <button onclick="loadCalendar()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b00; border: none; border-radius: 6px; color: white; cursor: pointer;">
                    נסה שוב
                </button>
            </div>
        `;
            }
        }

        // Fetch bookings for date range
        async function fetchCalendarBookings() {
            const startDate = getStartOfMonth(currentDate);
            const endDate = getEndOfMonth(currentDate);

            const response = await fetch(
                `${API_BASE}/api/calendar/bookings?startDate=${startDate}&endDate=${endDate}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Extract bookings array from response object and normalize field names
            const rawBookings = Array.isArray(data) ? data : (data.bookings || []);

            // Normalize booking data to ensure consistent field names
            calendarBookings = rawBookings.map(booking => ({
                ...booking,
                date: booking.booking_date || booking.date,
                time: booking.booking_time || booking.time,
                package_id: booking.package_id || booking.packageId,
                customer_name: booking.customer_name || booking.customerName
            }));

            // Also load "large events" so they show on the calendar even if the
            // bookings mirror failed (events are stored separately from bookings).
            try {
                let evList = [];
                const evRes = await fetch(`${API_BASE}/api/events`);
                if (evRes.ok) {
                    const evData = await evRes.json();
                    evList = Array.isArray(evData) ? evData : (evData.events || []);
                }
                if (!evList || !evList.length) {
                    try { evList = JSON.parse(localStorage.getItem('smashlabs_events') || '[]'); } catch (e) { evList = []; }
                }
                calendarEvents = (evList || [])
                    .filter(ev => ev && ev.datetime)
                    .map(ev => {
                        const dtStr = String(ev.datetime);
                        return {
                            id: ev.id,
                            date: dtStr.split('T')[0],
                            time: dtStr.indexOf('T') !== -1 ? dtStr.split('T')[1].slice(0, 5) : '',
                            title: ev.title || 'אירוע',
                            participants: ev.participants || 0,
                            signedCount: Array.isArray(ev.signatures) ? ev.signatures.length : (ev.signedCount || 0),
                            status: ev.status || 'active'
                        };
                    });
            } catch (e) {
                console.warn('Failed to load events for calendar:', e);
                calendarEvents = [];
            }
        }

        // Render calendar UI
        function renderCalendar() {
            const calendarSection = document.getElementById('calendar-section');

            const html = `
        <div class="calendar-header">
            <div class="calendar-controls">
                <div class="view-controls">
                    <button class="view-btn ${currentView === 'day' ? 'active' : ''}" onclick="switchView('day')">יום</button>
                    <button class="view-btn ${currentView === 'week' ? 'active' : ''}" onclick="switchView('week')">שבוע</button>
                    <button class="view-btn ${currentView === 'month' ? 'active' : ''}" onclick="switchView('month')">חודש</button>
                </div>
                
                <div class="date-navigation">
                    <button class="nav-btn" onclick="navigateDate('prev')">◀</button>
                    <h3 class="current-date-label">${getCurrentDateLabel()}</h3>
                    <button class="nav-btn" onclick="navigateDate('next')">▶</button>
                    <button class="nav-btn today-btn" onclick="goToToday()">היום</button>
                    <input type="month" class="nav-month-jump"
                           value="${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}"
                           onchange="jumpToMonth(this.value)"
                           title="קפוץ לחודש / שנה" aria-label="קפוץ לחודש ושנה"
                           style="background:#1a1a1a;color:#fff;border:1px solid rgba(255,107,0,0.4);border-radius:6px;padding:6px 10px;font-family:inherit;cursor:pointer;">
                    <button class="nav-btn add-booking-btn" onclick="openNewBookingFromHeader()"
                            title="הוספת אירוע / הזמנה" aria-label="הוספת אירוע חדש"
                            style="background:#ff6b00;color:#fff;border:none;font-weight:700;">➕ אירוע חדש</button>
                </div>
            </div>
        </div>
        
        <div class="calendar-legend">
            <span class="legend-item rage-room">חדר זעם</span>
            <span class="legend-item throwing-axes">זריקת גרזנים</span>
            <span class="legend-item paint-room">חדר צבע</span>
            <span class="legend-item combo">קומבו</span>
        </div>
        
        <div class="calendar-container">
            ${renderCalendarView()}
        </div>
    `;

            calendarSection.innerHTML = html;
        }

        // Render different calendar views
        function renderCalendarView() {
            switch (currentView) {
                case 'day':
                    return renderDayView();
                case 'week':
                    return renderWeekView();
                case 'month':
                default:
                    return renderMonthView();
            }
        }

        // Render month view
        function renderMonthView() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

            let html = '<div class="calendar-grid month-view">';

            // Day headers
            days.forEach(day => {
                html += `<div class="calendar-day-header">${day}</div>`;
            });

            // Empty cells before first day
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += '<div class="calendar-day empty"></div>';
            }

            // Days of month
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayBookings = calendarBookings.filter(b => {
                    const bookingDate = b.date;
                    const match = bookingDate === dateStr;
                    if (day === 1) {
                        console.log(`🔍 Checking day ${day}:`, {
                            dateStr,
                            bookingDate,
                            match,
                            booking: b
                        });
                    }
                    return match;
                });

                const isToday = isDateToday(dateStr);
                const dayEvents = calendarEvents.filter(ev => ev.date === dateStr);

                html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="selectDate('${dateStr}')">
                <div class="day-number">${day}</div>
                <div class="day-bookings">
                    ${dayEvents.map(ev => `
                        <div class="calendar-booking event-booking"
                             onclick="event.stopPropagation(); viewEventFromCalendar('${ev.id}')"
                             title="אירוע: ${ev.title}">
                            🎉 ${ev.time ? ev.time + ' ' : ''}${ev.title}
                        </div>
                    `).join('')}
                    ${dayBookings.slice(0, 3).map(booking => `
                        <div class="calendar-booking ${getPackageClass(booking.package_id)}" 
                             onclick="event.stopPropagation(); viewBookingDetails('${booking.id}')"
                             title="${booking.time} - ${getPackageDisplayName(booking.package_id)}">
                            ${booking.time} - ${booking.customer_name}
                        </div>
                    `).join('')}
                    ${dayBookings.length > 3 ? `<div class="more-bookings">+${dayBookings.length - 3} נוספים</div>` : ''}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Render week view
function renderWeekView() {
    const weekStart = getStartOfWeek(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }
    
    let html = '<div class="calendar-grid week-view">';
    
    days.forEach(day => {
        const dateStr = formatDateISO(day);
        const dayBookings = calendarBookings.filter(b => b.date === dateStr);
        const dayEvents = calendarEvents.filter(ev => ev.date === dateStr);
        const isToday = isDateToday(dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="selectDate('${dateStr}')">
                <div class="day-header">
                    <div class="day-name">${getDayName(day)}</div>
                    <div class="day-number">${day.getDate()}</div>
                </div>
                <div class="day-bookings">
                    ${dayEvents.map(ev => `
                        <div class="calendar-booking event-booking"
                             onclick="event.stopPropagation(); viewEventFromCalendar('${ev.id}')"
                             title="אירוע: ${ev.title}">
                            🎉 ${ev.time ? ev.time + ' ' : ''}${ev.title}
                        </div>
                    `).join('')}
                    ${dayBookings.map(booking => `
                        <div class="calendar-booking ${getPackageClass(booking.package_id)}" 
                             onclick="event.stopPropagation(); viewBookingDetails('${booking.id}')"
                             title="${getPackageDisplayName(booking.package_id)}">
                            <div class="booking-time">${booking.time}</div>
                            <div class="booking-customer">${booking.customer_name}</div>
                            <div class="booking-package-short">${getPackageShortName(booking.package_id)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Render day view
function renderDayView() {
    const dateStr = formatDateISO(currentDate);
    // Compare only the YYYY-MM-DD part in case a date arrives as a full datetime string.
    const sameDay = (d) => String(d || '').slice(0, 10) === dateStr;
    const dayBookings = calendarBookings.filter(b => sameDay(b.date));
    const dayEvents = calendarEvents.filter(ev => sameDay(ev.date));

    // Robustly pull the hour out of "13:20", "13:20:00" or even an ISO datetime.
    const getHour = (t) => {
        const m = String(t || '').match(/(\d{1,2}):(\d{2})/);
        return m ? parseInt(m[1], 10) : NaN;
    };

    // Group by hour
    const minHour = 9, maxHour = 22;
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour); // 9:00 - 22:00

    // Clamp out-of-range / unparseable times into the nearest edge slot so nothing is ever hidden.
    const bucketHour = (t) => {
        const h = getHour(t);
        if (isNaN(h)) return minHour;
        return Math.min(maxHour, Math.max(minHour, h));
    };

    let html = '<div class="day-view">';

    hours.forEach(hour => {
        const hourBookings = dayBookings.filter(b => bucketHour(b.time) === hour);
        const hourEvents = dayEvents.filter(ev => bucketHour(ev.time) === hour);
        const hasItems = hourBookings.length > 0 || hourEvents.length > 0;
        
        html += `
            <div class="hour-slot">
                <div class="hour-label">${hour}:00</div>
                <div class="hour-bookings">
                    ${hourEvents.map(ev => `
                        <div class="calendar-booking event-booking" 
                             onclick="viewEventFromCalendar('${ev.id}')" title="אירוע">
                            <div class="booking-time">🎉 ${ev.time || ''}</div>
                            <div class="booking-package">${ev.title}</div>
                            ${ev.participants ? `<div class="booking-customer">👥 ${ev.signedCount || 0}/${ev.participants}</div>` : ''}
                        </div>
                    `).join('')}
                    ${hourBookings.map(booking => `
                        <div class="calendar-booking ${getPackageClass(booking.package_id)}" 
                             onclick="viewBookingDetails('${booking.id}')">
                            <div class="booking-time">${booking.time}</div>
                            <div class="booking-package">${getPackageDisplayName(booking.package_id)}</div>
                            <div class="booking-customer">👤 ${booking.customer_name}</div>
                            <div class="booking-phone">📞 ${booking.customer_phone}</div>
                            <div class="booking-badges">
                                <span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span>
                                <span class="payment-badge ${booking.payment_status}">${getPaymentStatusText(booking.payment_status)}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${hasItems ? '' : '<div class="empty-hour">ללא הזמנות</div>'}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Helper Functions

function getCurrentDateLabel() {
    switch (currentView) {
        case 'day':
            return currentDate.toLocaleDateString('he-IL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        case 'week':
            const weekStart = getStartOfWeek(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`;
        case 'month':
        default:
            return currentDate.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
    }
}

function switchView(view) {
    currentView = view;
    renderCalendar();
}

async function navigateDate(direction) {
    const multiplier = direction === 'next' ? 1 : -1;
    
    switch (currentView) {
        case 'day':
            currentDate.setDate(currentDate.getDate() + multiplier);
            break;
        case 'week':
            currentDate.setDate(currentDate.getDate() + (7 * multiplier));
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + multiplier);
            break;
    }
    
    await fetchCalendarBookings();
    renderCalendar();
}

async function goToToday() {
    currentDate = new Date();
    await fetchCalendarBookings();
    renderCalendar();
}

// Jump straight to a specific month/year (from the month picker in the header)
async function jumpToMonth(value) {
    if (!value) return;
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return;
    currentDate = new Date(year, month - 1, 1);
    currentView = 'month';
    await fetchCalendarBookings();
    renderCalendar();
}

async function selectDate(dateStr) {
    // Clicking a day navigates to that day's day view (no longer opens the add modal)
    const parts = (dateStr || '').split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }
    currentView = 'day';
    await fetchCalendarBookings();
    renderCalendar();
}

// Open the "add event / booking" modal from the header button, defaulting to the date in view
function openNewBookingFromHeader() {
    if (typeof openCreateBookingModal === 'function') {
        openCreateBookingModal(formatDateISO(currentDate));
    }
}

function getStartOfMonth(date) {
    const d = new Date(date);
    return formatDateISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getEndOfMonth(date) {
    const d = new Date(date);
    return formatDateISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function formatDateISO(date) {
    // Use LOCAL date parts (not toISOString, which shifts to UTC and can land on the
    // previous day in timezones ahead of UTC like Israel) so day lookups match booking dates.
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isDateToday(dateStr) {
    const today = new Date();
    return dateStr === formatDateISO(today);
}

function getDayName(date) {
    const days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return days[date.getDay()];
}

function getPackageShortName(packageId) {
    if (packageId.includes('rage')) return 'זעם';
    if (packageId.includes('axes')) return 'גרזנים';
    if (packageId.includes('paint')) return 'צבע';
    if (packageId.includes('combo')) return 'קומבו';
    return packageId;
}

// Reuse helper functions from admin-dashboard.js
function getPackageDisplayName(packageId) {
    const packageNames = {
        'solo-rage-basic': 'חדר זעם - בסיסי',
        'solo-rage-standard': 'חדר זעם - סטנדרט',
        'solo-rage-premium': 'חדר זעם - פרימיום',
        'solo-rage-extreme': 'חדר זעם - מוגזם',
        'duo-rage-basic': 'חדר זעם זוגי - בסיסי',
        'duo-rage-standard': 'חדר זעם זוגי - סטנדרט',
        'duo-rage-premium': 'חדר זעם זוגי - פרימיום',
        'duo-rage-extreme': 'חדר זעם זוגי - מוגזם',
        'group-rage-basic': 'חדר זעם קבוצתי - בסיסי',
        'group-rage-standard': 'חדר זעם קבוצתי - סטנדרט',
        'group-rage-premium': 'חדר זעם קבוצתי - פרימיום',
        'group-rage-extreme': 'חדר זעם קבוצתי - מוגזם',
        'solo-paint-basic': 'חדר צבע - בסיסי',
        'solo-paint-standard': 'חדר צבע - סטנדרט',
        'solo-paint-premium': 'חדר צבע - פרימיום',
        'solo-paint-extreme': 'חדר צבע - מוגזם',
        'duo-paint-basic': 'חדר צבע זוגי - בסיסי',
        'duo-paint-standard': 'חדר צבע זוגי - סטנדרט',
        'duo-paint-premium': 'חדר צבע זוגי - פרימיום',
        'duo-paint-extreme': 'חדר צבע זוגי - מוגזם',
        'group-paint-basic': 'חדר צבע קבוצתי - בסיסי',
        'group-paint-standard': 'חדר צבע קבוצתי - סטנדרט',
        'group-paint-premium': 'חדר צבע קבוצתי - פרימיום',
        'group-paint-extreme': 'חדר צבע קבוצתי - מוגזם',
        'solo-axes-basic': 'זריקת גרזנים - בסיסי',
        'solo-axes-standard': 'זריקת גרזנים - סטנדרט',
        'solo-axes-premium': 'זריקת גרזנים - פרימיום',
        'solo-axes-extreme': 'זריקת גרזנים - מוגזם',
        'duo-axes-basic': 'זריקת גרזנים זוגי - בסיסי',
        'duo-axes-standard': 'זריקת גרזנים זוגי - סטנדרט',
        'duo-axes-premium': 'זריקת גרזנים זוגי - פרימיום',
        'duo-axes-extreme': 'זריקת גרזנים זוגי - מוגזם',
        'group-axes-basic': 'זריקת גרזנים קבוצתי - בסיסי',
        'group-axes-standard': 'זריקת גרזנים קבוצתי - סטנדרט',
        'group-axes-premium': 'זריקת גרזנים קבוצתי - פרימיום',
        'group-axes-extreme': 'זריקת גרזנים קבוצתי - מוגזם',
        'solo-combo-basic': 'משולב - בסיסי',
        'solo-combo-standard': 'משולב - סטנדרט',
        'solo-combo-premium': 'משולב - פרימיום',
        'solo-combo-extreme': 'משולב - מוגזם',
        'duo-combo-basic': 'משולב זוגי - בסיסי',
        'duo-combo-standard': 'משולב זוגי - סטנדרט',
        'duo-combo-premium': 'משולב זוגי - פרימיום',
        'duo-combo-extreme': 'משולב זוגי - מוגזם',
        'group-combo-basic': 'משולב קבוצתי - בסיסי',
        'group-combo-standard': 'משולב קבוצתי - סטנדרט',
        'group-combo-premium': 'משולב קבוצתי - פרימיום',
        'group-combo-extreme': 'משולב קבוצתי - מוגזם'
    };
    return packageNames[packageId] || packageId;
}

function getPackageClass(packageId) {
    if (packageId.includes('rage')) return 'rage-room';
    if (packageId.includes('axes')) return 'throwing-axes';
    if (packageId.includes('paint')) return 'paint-room';
    if (packageId.includes('combo')) return 'combo';
    return '';
}

function getStatusText(status) {
    const statusTexts = {
        'confirmed': 'מאושר',
        'completed': 'הושלם',
        'cancelled': 'בוטל',
        'pending': 'ממתין'
    };
    return statusTexts[status] || status;
}

function getPaymentStatusText(status) {
    const paymentStatusTexts = {
        'paid': 'שולם',
        'pending': 'ממתין',
        'refunded': 'הוחזר',
        'failed': 'נכשל'
    };
    return paymentStatusTexts[status] || status;
}

    function viewEventFromCalendar(id) {
        try { sessionStorage.setItem('smashlabs_focus_event', id || ''); } catch (e) {}
        if (typeof switchTab === 'function') {
            switchTab('events');
        } else {
            window.location.hash = 'events';
        }
    }

    // Make functions globally accessible
    window.loadCalendar = loadCalendar;
    window.switchView = switchView;
    window.navigateDate = navigateDate;
    window.goToToday = goToToday;
    window.jumpToMonth = jumpToMonth;
    window.selectDate = selectDate;
    window.openNewBookingFromHeader = openNewBookingFromHeader;
    window.viewEventFromCalendar = viewEventFromCalendar;
    
})();