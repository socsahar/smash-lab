/**
 * GDPR/CCPA Compliant Cookie Management System
 * SmashLabs - Cookie Manager
 */

class CookieManager {
    constructor() {
        this.cookieCategories = {
            essential: {
                name: 'עוגיות חיוניות',
                description: 'עוגיות הדרושות לתפקוד תקין של האתר',
                required: true,
                enabled: true
            },
            analytics: {
                name: 'עוגיות אנליטיקה',
                description: 'עוגיות המסייעות לנו להבין כיצד משתמשים באתר',
                required: false,
                enabled: false
            },
            marketing: {
                name: 'עוגיות שיווקיות',
                description: 'עוגיות לפרסום ושיווק ממוקד',
                required: false,
                enabled: false
            },
            functional: {
                name: 'עוגיות פונקציונליות',
                description: 'עוגיות לשיפור חוויית המשתמש',
                required: false,
                enabled: false
            }
        };

        this.consentKey = 'smashlabs_cookie_consent';
        this.preferencesKey = 'smashlabs_cookie_preferences';

        this.init();
    }

    init() {
        this.loadPreferences();

        // Check if user has already given consent
        if (!this.hasConsent()) {
            this.showConsentBanner();
        } else {
            this.enableApprovedCookies();
        }

        this.bindEvents();
    }

    hasConsent() {
        return localStorage.getItem(this.consentKey) !== null;
    }

    loadPreferences() {
        const savedPreferences = localStorage.getItem(this.preferencesKey);
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            Object.keys(preferences).forEach(category => {
                if (this.cookieCategories[category]) {
                    this.cookieCategories[category].enabled = preferences[category];
                }
            });
        }
    }

    savePreferences() {
        const preferences = {};
        Object.keys(this.cookieCategories).forEach(category => {
            preferences[category] = this.cookieCategories[category].enabled;
        });

        localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
        localStorage.setItem(this.consentKey, new Date().toISOString());
    }

    showConsentBanner() {
        // Remove existing banner if any
        const existingBanner = document.getElementById('cookie-consent-banner');
        if (existingBanner) {
            existingBanner.remove();
        }

        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'הודעת עוגיות');
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <h3>הודעת עוגיות</h3>
                    <p>אנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה שלכם ולספק שירותים מותאמים אישית. אנא בחרו את העדפותיכם:</p>
                </div>
                <div class="cookie-banner-buttons">
                    <button type="button" class="cookie-btn cookie-btn-manage" onclick="cookieManager.showPreferences()">
                        ניהול העדפות
                    </button>
                    <button type="button" class="cookie-btn cookie-btn-reject" onclick="cookieManager.rejectAll()">
                        דחה הכל
                    </button>
                    <button type="button" class="cookie-btn cookie-btn-accept" onclick="cookieManager.acceptAll()">
                        קבל הכל
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Add overlay
        const overlay = document.createElement('div');
        overlay.className = 'cookie-banner-overlay';
        overlay.id = 'cookie-banner-overlay';
        overlay.onclick = () => this.hideBanner();
        document.body.appendChild(overlay);

        // Show banner with animation
        setTimeout(() => {
            banner.classList.add('show');
            overlay.classList.add('show');
        }, 100);
    }

    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        const overlay = document.getElementById('cookie-banner-overlay');

        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }

        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    acceptAll() {
        Object.keys(this.cookieCategories).forEach(category => {
            this.cookieCategories[category].enabled = true;
        });

        this.savePreferences();
        this.enableApprovedCookies();
        this.hideBanner();
        this.hidePreferences();

        this.showNotification('כל העוגיות אושרו בהצלחה', 'success');
    }

    rejectAll() {
        Object.keys(this.cookieCategories).forEach(category => {
            if (!this.cookieCategories[category].required) {
                this.cookieCategories[category].enabled = false;
            }
        });

        this.savePreferences();
        this.enableApprovedCookies();
        this.hideBanner();
        this.hidePreferences();

        this.showNotification('העוגיות הלא חיוניות נדחו', 'info');
    }

    showPreferences() {
        this.hideBanner();

        // Remove existing preferences modal if any
        const existingModal = document.getElementById('cookie-preferences-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'cookie-preferences-modal';
        modal.className = 'cookie-preferences-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'cookie-modal-title');

        let categoriesHtml = '';
        Object.keys(this.cookieCategories).forEach(categoryKey => {
            const category = this.cookieCategories[categoryKey];
            const isDisabled = category.required ? 'disabled' : '';
            const isChecked = category.enabled ? 'checked' : '';

            categoriesHtml += `
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <label class="cookie-toggle">
                            <input type="checkbox" 
                                   id="cookie-${categoryKey}" 
                                   ${isChecked} 
                                   ${isDisabled}
                                   onchange="cookieManager.toggleCategory('${categoryKey}', this.checked)">
                            <span class="cookie-toggle-slider"></span>
                            <span class="cookie-category-name">${category.name}</span>
                            ${category.required ? '<span class="cookie-required">(חובה)</span>' : ''}
                        </label>
                    </div>
                    <p class="cookie-category-description">${category.description}</p>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h2 id="cookie-modal-title">הגדרות עוגיות</h2>
                    <button type="button" class="cookie-modal-close" onclick="cookieManager.hidePreferences()">×</button>
                </div>
                <div class="cookie-modal-body">
                    <p>אנא בחרו אילו סוגי עוגיות אתם מאשרים. עוגיות חיוניות נדרשות לתפקוד תקין של האתר ואינן ניתנות לביטול.</p>
                    <div class="cookie-categories">
                        ${categoriesHtml}
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button type="button" class="cookie-btn cookie-btn-secondary" onclick="cookieManager.hidePreferences()">
                        ביטול
                    </button>
                    <button type="button" class="cookie-btn cookie-btn-primary" onclick="cookieManager.saveAndClose()">
                        שמור העדפות
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add overlay
        const overlay = document.createElement('div');
        overlay.className = 'cookie-modal-overlay';
        overlay.id = 'cookie-modal-overlay';
        overlay.onclick = () => this.hidePreferences();
        document.body.appendChild(overlay);

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
            overlay.classList.add('show');
        }, 100);

        // Store trigger element for focus restoration
        this.modalTriggerElement = document.activeElement;

        // Add Escape key handler for modal
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.hidePreferences();
            }
        };

        modal.addEventListener('keydown', handleEscapeKey);

        // Focus trap: find all focusable elements inside modal
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Move focus to first element in modal
            setTimeout(() => firstElement.focus(), 150);

            // Focus trap on Tab key
            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };

            modal.addEventListener('keydown', handleTabKey);
        }

        // Store references for cleanup
        this.currentModal = modal;
        this.currentOverlay = overlay;
        this.modalEscapeHandler = handleEscapeKey;
    }

    hidePreferences() {
        const modal = document.getElementById('cookie-preferences-modal');
        const overlay = document.getElementById('cookie-modal-overlay');

        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }

        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }

        // Restore focus to trigger element
        if (this.modalTriggerElement && this.modalTriggerElement.focus) {
            setTimeout(() => this.modalTriggerElement.focus(), 350);
        }
    }

    toggleCategory(categoryKey, enabled) {
        if (!this.cookieCategories[categoryKey].required) {
            this.cookieCategories[categoryKey].enabled = enabled;
        }
    }

    saveAndClose() {
        this.savePreferences();
        this.enableApprovedCookies();
        this.hidePreferences();

        this.showNotification('העדפות העוגיות נשמרו בהצלחה', 'success');
    }

    enableApprovedCookies() {
        // Analytics cookies
        if (this.cookieCategories.analytics.enabled) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        // Marketing cookies
        if (this.cookieCategories.marketing.enabled) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }

        // Functional cookies
        if (this.cookieCategories.functional.enabled) {
            this.enableFunctional();
        } else {
            this.disableFunctional();
        }
    }

    enableAnalytics() {
        // Enable Google Analytics, tracking scripts, etc.

        // Example: Load Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    disableAnalytics() {
        // Disable analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    }

    enableMarketing() {
        // Enable marketing/advertising cookies
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'granted'
            });
        }
    }

    disableMarketing() {
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'denied'
            });
        }
    }

    enableFunctional() {
        // Enable functional features that use cookies
    }

    disableFunctional() {
        // Disable functional features that use cookies
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.getElementById('cookie-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'cookie-notification';
        notification.className = `cookie-notification cookie-notification-${type}`;
        notification.innerHTML = `
            <span class="cookie-notification-message">${message}</span>
            <button type="button" class="cookie-notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    bindEvents() {
        // Listen for cookie preference button if it exists
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-cookie-preferences]')) {
                e.preventDefault();
                this.showPreferences();
            }
        });

        // Handle ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hidePreferences();
            }
        });
    }

    // Public method to reset all cookies and show banner again
    resetCookieConsent() {
        localStorage.removeItem(this.consentKey);
        localStorage.removeItem(this.preferencesKey);

        // Reset to default state
        Object.keys(this.cookieCategories).forEach(category => {
            if (!this.cookieCategories[category].required) {
                this.cookieCategories[category].enabled = false;
            }
        });

        this.showConsentBanner();
        this.showNotification('הגדרות העוגיות אופסו', 'info');
    }

    // Get current consent status
    getConsentStatus() {
        return {
            hasConsent: this.hasConsent(),
            preferences: {...this.cookieCategories }
        };
    }
}

// Initialize cookie manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cookieManager = new CookieManager();
});

// Expose reset function globally for admin use
window.resetCookieConsent = () => {
    if (window.cookieManager) {
        window.cookieManager.resetCookieConsent();
    }
};