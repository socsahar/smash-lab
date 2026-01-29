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

        // Create the WhatsApp button with tooltip
        widget.innerHTML = `
            <a href="#" class="whatsapp-button" role="button" aria-label="צור קשר בוואטסאפ">
                <div class="whatsapp-tooltip">${WHATSAPP_CONFIG.tooltipText}</div>
                <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
            </a>
        `;

        // Add click handler
        const button = widget.querySelector('.whatsapp-button');
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openWhatsAppChat();
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
        // Log to console for debugging
        console.log('WhatsApp Widget Event:', eventName, data);

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
            .whatsapp-tooltip {
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