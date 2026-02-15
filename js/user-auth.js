/**
 * Simple User Authentication - Login/Logout Toggle
 * Changes the navigation Login link to Logout when user is logged in
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUserAuth);
    } else {
        initUserAuth();
    }

    function initUserAuth() {
        updateLoginLink();
    }

    function updateLoginLink() {
        const currentUser = getCurrentUser();
        const isAdmin = isAdminLoggedIn();

        // Find the login link in the navigation
        const navLinks = document.querySelectorAll('.nav-links a');
        let loginLink = null;

        navLinks.forEach(link => {
            if (link.getAttribute('href') === 'login.html' || link.textContent.includes('התחברות') || link.textContent.includes('התנתק')) {
                loginLink = link;
            }
        });

        if (!loginLink) {
            console.error('Login link not found in navigation');
            return;
        }

        // Get the parent li element
        const loginLi = loginLink.closest('li');

        if (currentUser || isAdmin) {
            // User is logged in - change to logout
            const userName = isAdmin ? 'מנהל' : currentUser.name;
            loginLink.textContent = 'יציאה';
            loginLink.href = '#';
            loginLink.style.color = '#4ade80'; // Green color to indicate logged in
            loginLink.title = `מחובר כ: ${userName}`; // Show username on hover

            // Make the li smaller
            if (loginLi) {
                loginLi.style.marginRight = '0';
            }

            loginLink.onclick = function(e) {
                e.preventDefault();
                logout();
            };
        } else {
            // User is not logged in - show login
            loginLink.textContent = 'התחברות';
            loginLink.href = 'login.html';
            loginLink.style.color = '';
            loginLink.title = '';

            if (loginLi) {
                loginLi.style.marginRight = '';
            }

            loginLink.onclick = null;
        }
    }

    function getCurrentUser() {
        try {
            // Check sessionStorage first (secure, per-session), then localStorage (fallback)
            let userJson = sessionStorage.getItem('smashlabs_current_user') || localStorage.getItem('smashlabs_current_user');
            const user = userJson ? JSON.parse(userJson) : null;
            return user;
        } catch (e) {
            console.error('Error getting current user:', e);
            return null;
        }
    }

    function isAdminLoggedIn() {
        // Check both storages and user data for admin status
        const isAdminSession = sessionStorage.getItem('smashlabs_admin_logged_in') === 'true';
        const isAdminLocal = localStorage.getItem('smashlabs_admin_logged_in') === 'true';
        const currentUser = getCurrentUser();
        const isAdminUser = currentUser && currentUser.is_admin === true;
        
        const isAdmin = isAdminSession || isAdminLocal || isAdminUser;
        return isAdmin;
    }

    function logout() {
        // Confirm logout
        const doLogout = async () => {
            const confirmed = window.customModal ? 
                await window.customModal.confirm('האם אתה בטוח שברצונך להתנתק?', 'התנתקות') :
                confirm('האם אתה בטוח שברצונך להתנתק?');
            
            if (confirmed) {
                // Clear all user data from both session and persistent storage
                sessionStorage.removeItem('smashlabs_current_user');
                sessionStorage.removeItem('smashlabs_admin_token');
                sessionStorage.removeItem('smashlabs_admin_logged_in');
                sessionStorage.removeItem('pending_registration_user');
                localStorage.removeItem('smashlabs_current_user');
                localStorage.removeItem('smashlabs_admin_logged_in');
                localStorage.removeItem('pending_verification_email');
                localStorage.removeItem('smashlabs_users');

                // Redirect to home page
                window.location.href = 'index.html';
            }
        };
        
        doLogout();
    }

    // Listen for login/logout events from other scripts
    window.addEventListener('storage', function(e) {
        if (e.key === 'smashlabs_current_user' || e.key === 'smashlabs_admin_logged_in') {
            updateLoginLink();
        }
    });

    // Expose functions globally if needed
    window.UserAuth = {
        getCurrentUser: getCurrentUser,
        isAdminLoggedIn: isAdminLoggedIn,
        logout: logout,
        refresh: function() {
            updateLoginLink();
        }
    };

})();