// @ts-nocheck
// Admin Dashboard - Stats and Overview
// This module handles the main dashboard view with statistics and metrics

(function() {
    'use strict';
    
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : '';

// Load dashboard data
async function loadDashboard() {
    console.log('Loading dashboard...');
    const dashboardSection = document.getElementById('dashboard-section');
    
    try {
        dashboardSection.innerHTML = '<div class="loading">טוען נתונים</div>';
        
        // Fetch dashboard stats from API
        const response = await fetch(`${API_BASE}/api/calendar/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        console.log('Dashboard stats:', stats);
        
        // Render dashboard
        renderDashboard(stats);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        dashboardSection.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <h3>שגיאה בטעינת הנתונים</h3>
                <p>${error.message}</p>
                <button onclick="loadDashboard()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b00; border: none; border-radius: 6px; color: white; cursor: pointer;">
                    נסה שוב
                </button>
            </div>
        `;
    }
}

// Render dashboard UI
function renderDashboard(stats) {
    const dashboardSection = document.getElementById('dashboard-section');
    
    const html = `
        <h2 class="section-title">📊 סקירה כללית</h2>
        
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${stats.today.count}</div>
                <div class="stat-label">הזמנות היום</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">${stats.week.count}</div>
                <div class="stat-label">הזמנות השבוע</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">${stats.month.count}</div>
                <div class="stat-label">הזמנות החודש</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value">₪${stats.month.revenue.toLocaleString()}</div>
                <div class="stat-label">הכנסות החודש</div>
            </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="revenue-section">
            <h3 class="subsection-title">💰 סטטוס תשלומים</h3>
            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-value">₪${stats.month.paidRevenue.toLocaleString()}</div>
                    <div class="stat-label">שולם</div>
                </div>
                
                <div class="stat-card warning">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-value">₪${stats.month.pendingRevenue.toLocaleString()}</div>
                    <div class="stat-label">ממתין לתשלום</div>
                </div>
                
                <div class="stat-card info">
                    <div class="stat-icon">💳</div>
                    <div class="stat-value">${stats.payments.pending}</div>
                    <div class="stat-label">תשלומים ממתינים</div>
                </div>
            </div>
        </div>

        <!-- Popular Package -->
        ${stats.mostPopularPackage ? `
            <div class="popular-package">
                <h3 class="subsection-title">🏆 החבילה הפופולרית ביותר</h3>
                <div class="package-card">
                    <div class="package-name">${getPackageDisplayName(stats.mostPopularPackage.package_id)}</div>
                    <div class="package-count">${stats.mostPopularPackage.count} הזמנות החודש</div>
                </div>
            </div>
        ` : ''}

        <!-- Today's Bookings -->
        ${stats.today.bookings && stats.today.bookings.length > 0 ? `
            <div class="today-bookings">
                <h3 class="subsection-title">📅 הזמנות היום</h3>
                <div class="bookings-list">
                    ${stats.today.bookings.map(booking => `
                        <div class="booking-card ${getPackageClass(booking.package_id)}">
                            <div class="booking-time">${booking.time}</div>
                            <div class="booking-package">${getPackageDisplayName(booking.package_id)}</div>
                            <div class="booking-customer">${booking.customer_name}</div>
                            <div class="booking-status">
                                <span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span>
                                <span class="payment-badge ${booking.payment_status}">${getPaymentStatusText(booking.payment_status)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : `
            <div class="no-bookings">
                <p>אין הזמנות מתוכננות להיום</p>
            </div>
        `}

        <!-- Upcoming Bookings -->
        ${stats.upcoming && stats.upcoming.length > 0 ? `
            <div class="upcoming-bookings">
                <h3 class="subsection-title">🔜 הזמנות קרובות (5 הבאות)</h3>
                <div class="bookings-table-wrapper">
                    <table class="bookings-table">
                        <thead>
                            <tr>
                                <th>תאריך</th>
                                <th>שעה</th>
                                <th>חבילה</th>
                                <th>לקוח</th>
                                <th>טלפון</th>
                                <th>סטטוס</th>
                                <th>תשלום</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.upcoming.map(booking => `
                                <tr onclick="viewBookingDetails('${booking.id}')" style="cursor: pointer;">
                                    <td>${formatDate(booking.date)}</td>
                                    <td>${booking.time}</td>
                                    <td class="${getPackageClass(booking.package_id)}">${getPackageDisplayName(booking.package_id)}</td>
                                    <td>${booking.customer_name}</td>
                                    <td>${booking.customer_phone}</td>
                                    <td><span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span></td>
                                    <td><span class="payment-badge ${booking.payment_status}">${getPaymentStatusText(booking.payment_status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}
    `;
    
    dashboardSection.innerHTML = html;
}

// Helper Functions

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

function formatDate(dateString) {
    if (!dateString) return 'לא זמין';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'תאריך לא תקין';
        return date.toLocaleDateString('he-IL', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    } catch (e) {
        return 'תאריך לא תקין';
    }
}

// View booking details (opens modal)
async function viewBookingDetails(bookingId) {
    try {
        const response = await fetch(`${API_BASE}/api/calendar/bookings/${bookingId}`);
        if (!response.ok) throw new Error('Failed to fetch booking details');
        
        const booking = await response.json();
        
        const modal = document.getElementById('viewModal');
        const content = document.getElementById('viewModalContent');
        
        content.innerHTML = `
            <div class="booking-details">
                <div class="detail-section">
                    <h3>פרטי לקוח</h3>
                    <p><strong>שם:</strong> ${booking.customer_name}</p>
                    <p><strong>אימייל:</strong> ${booking.customer_email}</p>
                    <p><strong>טלפון:</strong> ${booking.customer_phone}</p>
                </div>
                
                <div class="detail-section">
                    <h3>פרטי הזמנה</h3>
                    <p><strong>חבילה:</strong> ${getPackageDisplayName(booking.package_id)}</p>
                    <p><strong>תאריך:</strong> ${formatDate(booking.booking_date || booking.date)}</p>
                    <p><strong>שעה:</strong> ${booking.booking_time || booking.time}</p>
                    <p><strong>משך:</strong> ${booking.duration_minutes || booking.duration || 60} דקות</p>
                    <p><strong>סטטוס:</strong> <span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span></p>
                </div>
                
                <div class="detail-section">
                    <h3>פרטי תשלום</h3>
                    <p><strong>סכום:</strong> ₪${booking.price || booking.payment_amount || 0}</p>
                    <p><strong>סטטוס:</strong> <span class="payment-badge ${booking.payment_status}">${getPaymentStatusText(booking.payment_status)}</span></p>
                    ${booking.payment_method ? `<p><strong>אמצעי תשלום:</strong> ${booking.payment_method}</p>` : ''}
                    ${booking.payment_date ? `<p><strong>תאריך תשלום:</strong> ${formatDate(booking.payment_date)}</p>` : ''}
                </div>
                
                ${booking.customer_notes ? `
                    <div class="detail-section">
                        <h3>הערות לקוח</h3>
                        <p>${booking.customer_notes}</p>
                    </div>
                ` : ''}
                
                ${booking.admin_notes ? `
                    <div class="detail-section">
                        <h3>הערות מנהל</h3>
                        <p>${booking.admin_notes}</p>
                    </div>
                ` : ''}
                
                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="window.openEditModal('${booking.id}')">
                        ערוך הזמנה
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Error fetching booking details:', error);
        alert('שגיאה בטעינת פרטי ההזמנה');
    }
}

// Open edit modal with pre-filled data
async function openEditModal(bookingId) {
    try {
        console.log('📝 openEditModal called with bookingId:', bookingId);
        
        // Close view modal first
        const viewModal = document.getElementById('viewModal');
        if (viewModal) {
            viewModal.classList.remove('active');
        }
        
        const response = await fetch(`${API_BASE}/api/calendar/bookings/${bookingId}`);
        if (!response.ok) throw new Error('Failed to fetch booking details');
        
        const booking = await response.json();
        
        console.log('📝 Opening edit modal with booking:', booking);
        
        // Fill form fields
        document.getElementById('editBookingId').value = booking.id;
        document.getElementById('editCustomerName').value = booking.customer_name || '';
        document.getElementById('editCustomerEmail').value = booking.customer_email || '';
        document.getElementById('editCustomerPhone').value = booking.customer_phone || '';
        document.getElementById('editBookingDate').value = booking.booking_date || booking.date || '';
        document.getElementById('editBookingTime').value = booking.booking_time || booking.time || '';
        document.getElementById('editStatus').value = booking.status || 'confirmed';
        document.getElementById('editPaymentStatus').value = booking.payment_status || 'pending';
        document.getElementById('editPaymentMethod').value = booking.payment_method || '';
        document.getElementById('editPaymentAmount').value = booking.price || booking.payment_amount || '';
        document.getElementById('editPaymentTransactionId').value = booking.payment_transaction_id || '';
        document.getElementById('editCustomerNotes').value = booking.customer_notes || '';
        document.getElementById('editAdminNotes').value = booking.admin_notes || '';
        
        console.log('✅ Form fields filled');
        
        // Open modal
        document.getElementById('editModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading booking for edit:', error);
        alert('שגיאה בטעינת נתוני ההזמנה');
    }
}

    // Make functions globally accessible
    window.loadDashboard = loadDashboard;
    window.viewBookingDetails = viewBookingDetails;
    window.openEditModal = openEditModal;
    
})();
