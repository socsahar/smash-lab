// Global enhancements for accessibility and clean design
(function() {
    'use strict';
    
    // Remove emojis from h1, h2, h3 headers only (preserve elsewhere)
    function stripHeaderEmojis() {
        const emojiRegex = /[\p{Extended_Pictographic}\uFE0F]/gu;
        document.querySelectorAll('h1, h2, h3').forEach(header => {
            header.textContent = header.textContent.replace(emojiRegex, '').trim();
        });
    }
    
    // Initialize accessibility features
    function initAccessibility() {
        const accessibilityBtn = document.getElementById('accessibility-btn');
        if (accessibilityBtn) {
            accessibilityBtn.addEventListener('click', function() {
                document.body.classList.toggle('high-contrast');
                this.setAttribute('aria-pressed', 
                    document.body.classList.contains('high-contrast') ? 'true' : 'false'
                );
            });
        }
        
        // Ensure all interactive elements are keyboard accessible
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.tabIndex === -1) {
                element.tabIndex = 0;
            }
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            stripHeaderEmojis();
            initAccessibility();
        });
    } else {
        stripHeaderEmojis();
        initAccessibility();
    }
})();
