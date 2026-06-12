/**
 * WhatsApp Widget JavaScript
 * Professional floating WhatsApp chat widget for SmashLabs
 */

(function() {
    'use strict';

    // Configuration
    const WHATSAPP_CONFIG = {
        phoneNumber: '9720504429195', // Your WhatsApp Business number
        defaultMessage: 'שלום! אני מעוניין/ת לקבל מידע על השירותים שלכם ב-SmashLabs',
        tooltipText: 'צרו קשר בוואטסאפ!',
        trackingEnabled: true
    };

    // Instagram configuration
    const INSTAGRAM_CONFIG = {
        profileUrl: 'https://www.instagram.com/smash_lab_nahariya?igsh=N2YxeW94ZnQ2ejNk', // Your Instagram profile URL
        tooltipText: 'עקבו אחרינו באינסטגרם!',
        trackingEnabled: true
    };

    // Order/Booking configuration
    const ORDER_CONFIG = {
        url: 'select-package.html',
        tooltipText: 'הזמן עכשיו!',
        trackingEnabled: true
    };

    // Create WhatsApp widget
    function createWhatsAppWidget() {
        // Check if widget already exists
        if (document.getElementById('whatsapp-widget')) {
            return;
        }

        // Create widget container
        const widget = document.createElement('div');
        widget.id = 'whatsapp-widget';
        widget.setAttribute('role', 'button');
        widget.setAttribute('tabindex', '0');
        widget.setAttribute('aria-label', 'פתח צ\'אט וואטסאפ');

        // Create the WhatsApp and Instagram buttons with tooltips
        widget.innerHTML = `
            <a href="${INSTAGRAM_CONFIG.profileUrl}" class="instagram-button" role="button" target="_blank" rel="noopener noreferrer" aria-label="עקבו אחרינו באינסטגרם (נפתח בחלון חדש)">
                <div class="whatsapp-tooltip instagram-tooltip">${INSTAGRAM_CONFIG.tooltipText}</div>
                <svg class="whatsapp-icon instagram-icon" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
            </a>
            <a href="#" class="whatsapp-button" role="button" aria-label="צור קשר בוואטסאפ (נפתח בחלון חדש)">
                <div class="whatsapp-tooltip">${WHATSAPP_CONFIG.tooltipText}</div>
                <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
            </a>
            <a href="${ORDER_CONFIG.url}" class="order-button" role="button" aria-label="הזמן עכשיו - מעבר לרכישת חבילה">
                <div class="whatsapp-tooltip order-tooltip">${ORDER_CONFIG.tooltipText}</div>
                <svg class="whatsapp-icon order-icon" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.11.9 2 2 2h16c1.1 0 2-.89 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54zM9.5 15.5h5v1h-5v-1zm0-3h5v1h-5v-1zm0-3h5v1h-5v-1z"/>
                </svg>
            </a>
        `;

        // Add click handler
        const button = widget.querySelector('.whatsapp-button');
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openWhatsAppChat();
        });

        // Track Instagram clicks
        const instagramButton = widget.querySelector('.instagram-button');
        instagramButton.addEventListener('click', function() {
            if (INSTAGRAM_CONFIG.trackingEnabled) {
                trackEvent('instagram_widget_clicked', {
                    page: window.location.pathname
                });
            }
        });

        // Track Order clicks
        const orderButton = widget.querySelector('.order-button');
        orderButton.addEventListener('click', function() {
            if (ORDER_CONFIG.trackingEnabled) {
                trackEvent('order_widget_clicked', {
                    page: window.location.pathname
                });
            }
        });

        // Add keyboard support
        widget.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWhatsAppChat();
            }
        });

        // Add to page
        document.body.appendChild(widget);

        // Adjust positioning based on Nagishli widget position
        adjustWhatsAppPosition();

        // Track widget load if enabled
        if (WHATSAPP_CONFIG.trackingEnabled) {
            trackEvent('whatsapp_widget_loaded');
        }
    }

    // Detect Nagishli position and adjust WhatsApp widget positioning to avoid collision
    function adjustWhatsAppPosition() {
        const widget = document.getElementById('whatsapp-widget');
        if (!widget) return;

        // Get Nagishli position from global var (set in HTML)
        const nagishliPos = typeof window.nl_pos !== 'undefined' ? window.nl_pos : 'BL';

        // Adjust WhatsApp position based on Nagishli location
        // Nagishli widget is ~50px, plus spacing
        switch (nagishliPos) {
            case 'BL': // Bottom-Left (default)
                // WhatsApp stays at bottom-right, no adjustment needed
                widget.style.bottom = '90px';
                widget.style.right = '20px';
                widget.style.left = 'auto';
                break;

            case 'BR': // Bottom-Right
                // Move WhatsApp to bottom-left to avoid collision
                widget.style.bottom = '90px';
                widget.style.left = '20px';
                widget.style.right = 'auto';
                break;

            case 'TL': // Top-Left
                // WhatsApp stays at bottom-right
                widget.style.bottom = '90px';
                widget.style.right = '20px';
                widget.style.left = 'auto';
                break;

            case 'TR': // Top-Right
                // WhatsApp stays at bottom-right (no collision)
                widget.style.bottom = '90px';
                widget.style.right = '20px';
                widget.style.left = 'auto';
                break;

            default:
                // Fallback to bottom-right
                widget.style.bottom = '90px';
                widget.style.right = '20px';
                widget.style.left = 'auto';
        }
    }

    // Open WhatsApp chat
    function openWhatsAppChat() {
        const message = getContextualMessage();
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_CONFIG.phoneNumber}?text=${encodedMessage}`;

        // Track click if enabled
        if (WHATSAPP_CONFIG.trackingEnabled) {
            trackEvent('whatsapp_widget_clicked', {
                page: window.location.pathname,
                message: message
            });
        }

        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    // Get contextual message based on current page
    function getContextualMessage() {
        const path = window.location.pathname.toLowerCase();
        const pageTitle = document.title;

        let contextMessage = WHATSAPP_CONFIG.defaultMessage;

        // Page-specific messages
        if (path.includes('paint-room') || path.includes('צבע')) {
            contextMessage = 'שלום! אני מעוניין/ת לקבל מידע על חדר הצבע ב-SmashLabs';
        } else if (path.includes('rage-room') || path.includes('זעם')) {
            contextMessage = 'שלום! אני מעוניין/ת לקבל מידע על חדר הזעם ב-SmashLabs';
        } else if (path.includes('throwing-axes') || path.includes('גרזנים')) {
            contextMessage = 'שלום! אני מעוניין/ת לקבל מידע על זריקת גרזנים ב-SmashLabs';
        } else if (path.includes('graffiti') || path.includes('גרפיטי')) {
            contextMessage = 'שלום! אני מעוניין/ת לקבל מידע על מרכז הגרפיטי ב-SmashLabs';
        } else if (path.includes('birthday') || path.includes('הולדת')) {
            contextMessage = 'שלום! אני מעוניין/ת לקבל מידע על חבילות יום הולדת ב-SmashLabs';
        } else if (path.includes('rent-lab') || path.includes('השכרת')) {
            contextMessage = 'שלום! אני מעוניין/ת לקבל מידע על השכרת מעבדה ב-SmashLabs';
        } else if (path.includes('booking') || path.includes('הזמנה')) {
            contextMessage = 'שלום! אני רוצה להזמין זמן ב-SmashLabs';
        }

        return contextMessage;
    }

    // Simple event tracking function
    function trackEvent(eventName, data = {}) {
        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'whatsapp_widget',
                event_label: data.page || window.location.pathname,
                value: 1
            });
        }

        // Send to Facebook Pixel if available
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Contact', {
                content_category: 'whatsapp_widget',
                content_name: eventName
            });
        }
    }

    // Initialize widget when DOM is ready
    function initWidget() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createWhatsAppWidget);
        } else {
            createWhatsAppWidget();
        }
    }

    // Add exception to nuclear-fix.css if needed
    function addWidgetException() {
        const style = document.createElement('style');
        style.textContent = `
            /* Exception for WhatsApp widget - it needs to position itself freely */
            #whatsapp-widget,
            #whatsapp-widget *,
            .whatsapp-button,
            .whatsapp-tooltip,
            .instagram-button,
            .instagram-tooltip,
            .order-button,
            .order-tooltip {
                max-width: none !important;
                width: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Start initialization
    addWidgetException();
    initWidget();

    // Expose global functions for advanced usage
    window.SmashLabsWhatsApp = {
        open: openWhatsAppChat,
        setMessage: function(message) {
            WHATSAPP_CONFIG.defaultMessage = message;
        },
        setPhone: function(phone) {
            WHATSAPP_CONFIG.phoneNumber = phone;
        },
        track: trackEvent
    };

})();