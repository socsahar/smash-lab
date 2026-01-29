// Admin Header Bar - Add to owner-dashboard.html just after <body> tag

const adminHeaderHTML = `
<div class="admin-header-bar">
    <div class="admin-info">
        <strong>🔐 לוח בקרה</strong> | <span id="admin-name">מנהל</span>
    </div>
    <button class="logout-btn" onclick="logoutAdmin()">🚪 יציאה</button>
</div>
`;

// Insert admin header at the start of body
document.body.insertAdjacentHTML('afterbegin', adminHeaderHTML);

// Update admin name from session
const currentUser = sessionStorage.getItem('smashlabs_current_user');
if (currentUser) {
    try {
        const user = JSON.parse(currentUser);
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = user.name || user.email;
        }
    } catch (e) {
        console.error('Error updating admin name:', e);
    }
}

// Logout function
window.logoutAdmin = function() {
    if (confirm('האם אתה בטוח שברצונך לצאת?')) {
        sessionStorage.clear();
        localStorage.removeItem('smashlabs_current_user');
        alert('יצאת בהצלחה מלוח הבקרה');
        window.location.href = 'login.html';
    }
};
