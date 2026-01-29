// @ts-nocheck
// Admin Bookings - Bookings Management
// This module handles the bookings table with search, filter, edit, and cancel

(function() {
    'use strict';
    
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : '';

    let allBookings = [];
    let filteredBookings = [];
    let currentFilters = {
        search: '',
        packageId: 'all',
        status: 'all',
        paymentStatus: 'all',
        dateFrom: '',
        dateTo: ''
    };

// Load bookings
async function loadBookings() {
    console.log('Loading bookings...');
    const bookingsSection = document.getElementById('bookings-section');
    
    try {
        bookingsSection.innerHTML = '<div class="loading">טוען הזמנות</div>';
        
        // Fetch all bookings
        const response = await fetch(`${API_BASE}/api/calendar/bookings`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
            const data = await response.json();
        // Extract bookings array from response object
        allBookings = Array.isArray(data) ? data : (data.bookings || []);
        console.log('Bookings loaded:', allBookings.length);
        
        // Apply filters and render
        applyFilters();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsSection.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <h3>שגיאה בטעינת ההזמנות</h3>
                <p>${error.message}</p>
                <button onclick="loadBookings()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b00; border: none; border-radius: 6px; color: white; cursor: pointer;">
                    נסה שוב
                </button>
            </div>
        `;
    }
}

// Render bookings UI
function renderBookings() {
    const bookingsSection = document.getElementById('bookings-section');
    
    const html = `
        <h2 class="section-title">📋 ניהול הזמנות</h2>
        
        <!-- Filters -->
        <div class="bookings-filters">
            <div class="filter-row">
                <input type="text" 
                       id="searchInput" 
                       class="filter-input" 
                       placeholder="חפש לפי שם, אימייל או טלפון..."
                       value="${currentFilters.search}"
                       oninput="handleSearchInput(this.value)">
                
                <select id="packageFilter" class="filter-select" onchange="handlePackageFilter(this.value)">
                    <option value="all">כל החבילות</option>
                    <option value="rage">חדרי זעם</option>
                    <option value="axes">זריקת גרזנים</option>
                    <option value="paint">חדר צבע</option>
                    <option value="combo">קומבו</option>
                </select>
                
                <select id="statusFilter" class="filter-select" onchange="handleStatusFilter(this.value)">
                    <option value="all">כל הסטטוסים</option>
                    <option value="confirmed">מאושר</option>
                    <option value="completed">הושלם</option>
                    <option value="cancelled">בוטל</option>
                </select>
                
                <select id="paymentFilter" class="filter-select" onchange="handlePaymentFilter(this.value)">
                    <option value="all">כל התשלומים</option>
                    <option value="paid">שולם</option>
                    <option value="pending">ממתין</option>
                    <option value="refunded">הוחזר</option>
                    <option value="failed">נכשל</option>
                </select>
            </div>
            
            <div class="filter-row">
                <label class="date-filter">
                    מתאריך:
                    <input type="date" 
                           id="dateFrom" 
                           class="filter-input date-input"
                           value="${currentFilters.dateFrom}"
                           onchange="handleDateFilter('from', this.value)">
                </label>
                
                <label class="date-filter">
                    עד תאריך:
                    <input type="date" 
                           id="dateTo" 
                           class="filter-input date-input"
                           value="${currentFilters.dateTo}"
                           onchange="handleDateFilter('to', this.value)">
                </label>
                
                <button class="btn btn-secondary" onclick="clearFilters()">נקה מסננים</button>
            </div>
        </div>
        
        <!-- Results Count -->
        <div class="results-count">
            מציג ${filteredBookings.length} מתוך ${allBookings.length} הזמנות
        </div>
        
        <!-- Bookings Table -->
        <div class="bookings-table-wrapper">
            ${filteredBookings.length > 0 ? `
                <table class="bookings-table">
                    <thead>
                        <tr>
                            <th>פעולות</th>
                            <th>תשלום</th>
                            <th>סטטוס</th>
                            <th>טלפון</th>
                            <th>אימייל</th>
                            <th>שם</th>
                            <th>חבילה</th>
                            <th>שעה</th>
                            <th>תאריך</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredBookings.map(booking => `
                            <tr class="booking-row">
                                <td>
                                    <button class="btn-action edit" onclick="openEditModal('${booking.id}')" title="ערוך">✏️</button>
                                    <button class="btn-action delete" onclick="confirmCancelBooking('${booking.id}')" title="בטל">🗑️</button>
                                </td>
                                <td>
                                    <span class="payment-badge ${booking.payment_status}">
                                        ${getPaymentStatusText(booking.payment_status)}
                                    </span>
                                    ${booking.payment_amount ? `<br><small>₪${booking.payment_amount}</small>` : ''}
                                </td>
                                <td>
                                    <span class="status-badge ${booking.status}">
                                        ${getStatusText(booking.status)}
                                    </span>
                                </td>
                                <td>${booking.customer_phone}</td>
                                <td>${booking.customer_email}</td>
                                <td><strong>${booking.customer_name}</strong></td>
                                <td class="${getPackageClass(booking.package_id)}">
                                    ${getPackageDisplayName(booking.package_id)}
                                </td>
                                <td>${booking.booking_time || booking.time || 'N/A'}</td>
                                <td>${formatDate(booking.booking_date || booking.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-results">
                    <p>לא נמצאו הזמנות תואמות</p>
                </div>
            `}
        </div>
    `;
    
    bookingsSection.innerHTML = html;
}

// Filter Functions

function applyFilters() {
    filteredBookings = allBookings.filter(booking => {
        // Search filter
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const matchesSearch = 
                booking.customer_name.toLowerCase().includes(searchLower) ||
                booking.customer_email.toLowerCase().includes(searchLower) ||
                booking.customer_phone.includes(searchLower);
            if (!matchesSearch) return false;
        }
        
        // Package filter
        if (currentFilters.packageId !== 'all') {
            if (!booking.package_id.includes(currentFilters.packageId)) return false;
        }
        
        // Status filter
        if (currentFilters.status !== 'all') {
            if (booking.status !== currentFilters.status) return false;
        }
        
        // Payment status filter
        if (currentFilters.paymentStatus !== 'all') {
            if (booking.payment_status !== currentFilters.paymentStatus) return false;
        }
        
        // Date range filter
        if (currentFilters.dateFrom) {
            const bookingDate = booking.booking_date || booking.date;
            if (bookingDate < currentFilters.dateFrom) return false;
        }
        if (currentFilters.dateTo) {
            const bookingDate = booking.booking_date || booking.date;
            if (bookingDate > currentFilters.dateTo) return false;
        }
        
        return true;
    });
    
    // Render after filtering
    renderBookings();
}

function handleSearchInput(value) {
    currentFilters.search = value;
    applyFilters();
    renderBookings();
}

function handlePackageFilter(value) {
    currentFilters.packageId = value;
    applyFilters();
    renderBookings();
}

function handleStatusFilter(value) {
    currentFilters.status = value;
    applyFilters();
    renderBookings();
}

function handlePaymentFilter(value) {
    currentFilters.paymentStatus = value;
    applyFilters();
    renderBookings();
}

function handleDateFilter(type, value) {
    if (type === 'from') {
        currentFilters.dateFrom = value;
    } else {
        currentFilters.dateTo = value;
    }
    applyFilters();
    renderBookings();
}

function clearFilters() {
    currentFilters = {
        search: '',
        packageId: 'all',
        status: 'all',
        paymentStatus: 'all',
        dateFrom: '',
        dateTo: ''
    };
    applyFilters();
    renderBookings();
}

// Edit Booking

async function openEditModal(bookingId) {
    try {
        console.log('📝 openEditModal called with bookingId:', bookingId);
        
        const response = await fetch(`${API_BASE}/api/calendar/bookings/${bookingId}`);
        if (!response.ok) throw new Error('Failed to fetch booking');
        
        const booking = await response.json();
        
        console.log('📦 Booking data received:', booking);
        
        // Close view modal if open
        const viewModal = document.getElementById('viewModal');
        if (viewModal) {
            viewModal.classList.remove('active');
        }
        
        // Populate form
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
        
        console.log('✅ Form fields populated');
        
        // Show modal
        document.getElementById('editModal').classList.add('active');
        
    } catch (error) {
        console.error('Error opening edit modal:', error);
        alert('שגיאה בטעינת פרטי ההזמנה');
    }
}

// Handle edit form submission
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editBookingForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bookingId = document.getElementById('editBookingId').value;
            const updateData = {
                customer_name: document.getElementById('editCustomerName').value,
                customer_email: document.getElementById('editCustomerEmail').value,
                customer_phone: document.getElementById('editCustomerPhone').value,
                date: document.getElementById('editBookingDate').value,
                time: document.getElementById('editBookingTime').value,
                status: document.getElementById('editStatus').value,
                payment_status: document.getElementById('editPaymentStatus').value,
                payment_method: document.getElementById('editPaymentMethod').value || null,
                payment_amount: parseFloat(document.getElementById('editPaymentAmount').value) || null,
                payment_transaction_id: document.getElementById('editPaymentTransactionId').value || null,
                admin_notes: document.getElementById('editAdminNotes').value || null
            };
            
            try {
                const response = await fetch(`${API_BASE}/api/calendar/bookings/${bookingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) throw new Error('Failed to update booking');
                
                alert('ההזמנה עודכנה בהצלחה!');
                closeEditModal();
                loadBookings(); // Reload bookings
                
            } catch (error) {
                console.error('Error updating booking:', error);
                alert('שגיאה בעדכון ההזמנה');
            }
        });
    }
});

// Cancel Booking

function confirmCancelBooking(bookingId) {
    if (confirm('האם אתה בטוח שברצונך לבטל הזמנה זו? פעולה זו תמחק את ההזמנה מהמערכת ומלוח השנה של גוגל.')) {
        cancelBooking(bookingId);
    }
}

async function cancelBooking(bookingId) {
    try {
        const response = await fetch(`${API_BASE}/api/calendar/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to cancel booking');
        
        alert('ההזמנה בוטלה בהצלחה!');
        loadBookings(); // Reload bookings
        
    } catch (error) {
        console.error('Error canceling booking:', error);
        alert('שגיאה בביטול ההזמנה');
    }
}

// Helper Functions (reuse from admin-dashboard.js)

function getPackageDisplayName(packageId) {
    if (!packageId) return 'לא צוין';
    
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
    
    // If exact match found, return it
    if (packageNames[packageId]) return packageNames[packageId];
    
    // Otherwise, return the packageId as-is
    return packageId;
}

function getPackageClass(packageId) {
    if (packageId.includes('rage')) return 'rage-room';
    if (packageId.includes('axes')) return 'throwing-axes';
    if (packageId.includes('paint')) return 'paint-room';
    if (packageId.includes('combo')) return 'combo';
    return '';
}

function getStatusText(status) {
    if (!status) return 'לא ידוע';
    const statusTexts = {
        'confirmed': 'מאושר',
        'completed': 'הושלם',
        'cancelled': 'בוטל',
        'pending': 'ממתין'
    };
    return statusTexts[status] || status;
}

function getPaymentStatusText(status) {
    if (!status) return 'לא ידוע';
    const paymentStatusTexts = {
        'paid': 'שולם',
        'pending': 'ממתין',
        'refunded': 'הוחזר',
        'failed': 'נכשל'
    };
    return paymentStatusTexts[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('he-IL', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

    // Make functions globally accessible
    window.loadBookings = loadBookings;
    window.handleSearchInput = handleSearchInput;
    window.handlePackageFilter = handlePackageFilter;
    window.handleStatusFilter = handleStatusFilter;
    window.handlePaymentFilter = handlePaymentFilter;
    window.handleDateFilter = handleDateFilter;
    window.clearFilters = clearFilters;
    window.openEditModal = openEditModal;
    window.confirmCancelBooking = confirmCancelBooking;
    
})();
