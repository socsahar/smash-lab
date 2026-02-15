/**
 * Standards-Based Accessibility System
 * WCAG 2.2 AA Compliant
 * Features: Font scaling, contrast, dark mode, dyslexia font, reading guide
 */

(function() {
    'use strict';

    // Utility functions for localStorage with error handling
    function setPref(key, value) {
        try {
            localStorage.setItem('a11y_' + key, value);
        } catch (e) {
            console.warn('Cannot save accessibility preference:', key);
        }
    }

    function getPref(key) {
        try {
            return localStorage.getItem('a11y_' + key);
        } catch (e) {
            console.warn('Cannot read accessibility preference:', key);
            return null;
        }
    }

    // Initialize accessibility system
    function initAccessibility() {
        // Create and inject the accessibility UI
        createAccessibilityUI();
        
        // Set up event listeners
        setupEventListeners();
        
        // Restore saved preferences
        restorePreferences();
        
        // Load OpenDyslexic font conditionally
        loadDyslexicFont();
        
        // Initialize reading guide
        initReadingGuide();
    }

    function createAccessibilityUI() {
        // Create trigger button
        const trigger = document.createElement('button');
        trigger.id = 'a11y-trigger';
        trigger.className = 'a11y-trigger';
        trigger.setAttribute('aria-label', 'הגדרות נגישות');
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', 'a11y-panel');
        trigger.innerHTML = '⚙️';
        
        // Create accessibility panel
        const panel = document.createElement('div');
        panel.id = 'a11y-panel';
        panel.className = 'a11y-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('aria-label', 'הגדרות נגישות');
        panel.setAttribute('tabindex', '-1');
        
        panel.innerHTML = `
            <div class="a11y-panel-header">
                <h2 class="a11y-panel-title">הגדרות נגישות</h2>
                <button class="a11y-panel-close" id="a11y-close" aria-label="סגור הגדרות נגישות">×</button>
            </div>
            
            <div class="a11y-controls">
                <!-- Font Size Controls -->
                <div class="a11y-control-group">
                    <p class="a11y-control-label">גודל טקסט</p>
                    <div class="a11y-font-size">
                        <button class="a11y-btn" id="a11y-font-decrease" aria-label="הקטן טקסט">A-</button>
                        <button class="a11y-btn" id="a11y-font-reset" aria-label="איפוס גודל טקסט">A</button>
                        <button class="a11y-btn" id="a11y-font-increase" aria-label="הגדל טקסט">A+</button>
                    </div>
                </div>
                
                <!-- Display Options -->
                <div class="a11y-control-group">
                    <p class="a11y-control-label">אפשרויות תצוגה</p>
                    <div class="a11y-control-buttons">
                        <button class="a11y-btn" id="a11y-high-contrast" aria-pressed="false">ניגודיות גבוהה</button>
                        <button class="a11y-btn" id="a11y-dark-mode" aria-pressed="false">מצב כהה</button>
                        <button class="a11y-btn" id="a11y-invert-colors" aria-pressed="false">הפוך צבעים</button>
                    </div>
                </div>
                
                <!-- Reading Aids -->
                <div class="a11y-control-group">
                    <p class="a11y-control-label">עזרי קריאה</p>
                    <div class="a11y-control-buttons">
                        <button class="a11y-btn" id="a11y-dyslexia-font" aria-pressed="false">גופן דיסלקסיה</button>
                        <button class="a11y-btn" id="a11y-reading-guide" aria-pressed="false">מדריך קריאה</button>
                    </div>
                </div>
                
                <!-- Reset Button -->
                <div class="a11y-control-group">
                    <button class="a11y-btn" id="a11y-reset-all" style="width: 100%; background: #dc3545; border-color: #dc3545; color: white;">איפוס כל ההגדרות</button>
                </div>
            </div>
        `;
        
        // Add reading guide line
        const guideLine = document.createElement('div');
        guideLine.className = 'a11y-reading-guide-line';
        guideLine.id = 'a11y-reading-guide-line';
        
        // Insert into DOM
        document.body.appendChild(trigger);
        document.body.appendChild(panel);
        document.body.appendChild(guideLine);
    }

    function setupEventListeners() {
        const trigger = document.getElementById('a11y-trigger');
        const panel = document.getElementById('a11y-panel');
        const closeBtn = document.getElementById('a11y-close');
        
        // Panel toggle
        trigger.addEventListener('click', openPanel);
        trigger.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPanel();
            }
        });
        
        // Close panel
        closeBtn.addEventListener('click', closePanel);
        closeBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closePanel();
            }
        });
        
        // Escape key to close panel
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') {
                closePanel();
            }
        });
        
        // Focus trap within panel
        panel.addEventListener('keydown', trapFocus);
        
        // Font size controls
        const fontDecrease = document.getElementById('a11y-font-decrease');
        const fontIncrease = document.getElementById('a11y-font-increase');
        const fontReset = document.getElementById('a11y-font-reset');
        
        if (fontDecrease) fontDecrease.addEventListener('click', () => adjustFontSize(-0.1));
        if (fontIncrease) fontIncrease.addEventListener('click', () => adjustFontSize(0.1));
        if (fontReset) fontReset.addEventListener('click', () => setFontSize(1));
        
        // Display toggles
        const highContrast = document.getElementById('a11y-high-contrast');
        const darkMode = document.getElementById('a11y-dark-mode');
        const invertColors = document.getElementById('a11y-invert-colors');
        const dyslexiaFont = document.getElementById('a11y-dyslexia-font');
        const readingGuide = document.getElementById('a11y-reading-guide');
        const resetAll = document.getElementById('a11y-reset-all');
        
        if (highContrast) highContrast.addEventListener('click', () => toggleFeature('high-contrast'));
        if (darkMode) darkMode.addEventListener('click', () => toggleFeature('dark-mode'));
        if (invertColors) invertColors.addEventListener('click', () => toggleFeature('invert-colors'));
        if (dyslexiaFont) dyslexiaFont.addEventListener('click', () => toggleFeature('dyslexia-font'));
        if (readingGuide) readingGuide.addEventListener('click', () => toggleFeature('reading-guide'));
        if (resetAll) resetAll.addEventListener('click', resetAllFeatures);
    }

    function openPanel() {
        const panel = document.getElementById('a11y-panel');
        panel.setAttribute('aria-hidden', 'false');
        panel.focus();
        
        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = 'פאנל הגדרות נגישות נפתח';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }

    function closePanel() {
        const panel = document.getElementById('a11y-panel');
        const trigger = document.getElementById('a11y-trigger');
        
        panel.setAttribute('aria-hidden', 'true');
        trigger.focus();
        
        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = 'פאנל הגדרות נגישות נסגר';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }

    function trapFocus(e) {
        if (e.key === 'Tab') {
            const panel = document.getElementById('a11y-panel');
            const focusableElements = panel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    // Font size management
    let currentFontScale = 1;

    function setFontSize(scale) {
        currentFontScale = Math.max(0.8, Math.min(2, scale));
        document.documentElement.style.fontSize = (currentFontScale * 100) + '%';
        setPref('font_scale', currentFontScale);
        
        // Update visual feedback
        updateFontSizeButtons();
        announceChange(`גודל הטקסט שונה ל-${Math.round(currentFontScale * 100)}%`);
    }

    function adjustFontSize(delta) {
        setFontSize(currentFontScale + delta);
    }

    function updateFontSizeButtons() {
        const decreaseBtn = document.getElementById('a11y-font-decrease');
        const increaseBtn = document.getElementById('a11y-font-increase');
        const resetBtn = document.getElementById('a11y-font-reset');
        
        decreaseBtn.disabled = currentFontScale <= 0.8;
        increaseBtn.disabled = currentFontScale >= 2;
        
        if (currentFontScale === 1) {
            resetBtn.classList.add('active');
        } else {
            resetBtn.classList.remove('active');
        }
    }

    // Feature toggles
    function toggleFeature(feature) {
        const className = 'a11y-' + feature;
        const button = document.getElementById('a11y-' + feature);
        const isActive = document.body.classList.toggle(className);
        
        // Update button state
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        
        // Save preference
        setPref(feature, isActive ? '1' : '0');
        
        // Handle special cases
        if (feature === 'dyslexia-font') {
            handleDyslexicFont(isActive);
        } else if (feature === 'reading-guide') {
            handleReadingGuide(isActive);
        }
        
        // Announce change
        const featureNames = {
            'high-contrast': 'ניגודיות גבוהה',
            'dark-mode': 'מצב כהה',
            'invert-colors': 'הפוך צבעים',
            'dyslexia-font': 'גופן דיסלקסיה',
            'reading-guide': 'מדריך קריאה'
        };
        
        const action = isActive ? 'הופעל' : 'בוטל';
        announceChange(`${featureNames[feature]} ${action}`);
    }

    function handleDyslexicFont(isActive) {
        const link = document.getElementById('a11y-dyslexic-font-link');
        if (isActive && link) {
            link.disabled = false;
        } else if (link) {
            link.disabled = true;
        }
    }

    function loadDyslexicFont() {
        // Only load if not already present
        if (!document.getElementById('a11y-dyslexic-font-link')) {
            const link = document.createElement('link');
            link.id = 'a11y-dyslexic-font-link';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css';
            link.disabled = true;
            document.head.appendChild(link);
        }
    }

    // Reading guide functionality
    function initReadingGuide() {
        document.addEventListener('mousemove', updateReadingGuide);
    }

    function updateReadingGuide(e) {
        if (!document.body.classList.contains('a11y-reading-guide')) return;
        
        const guideLine = document.getElementById('a11y-reading-guide-line');
        if (guideLine) {
            guideLine.style.top = e.clientY + 'px';
        }
    }

    function handleReadingGuide(isActive) {
        const guideLine = document.getElementById('a11y-reading-guide-line');
        if (guideLine) {
            guideLine.style.display = isActive ? 'block' : 'none';
        }
    }

    function resetAllFeatures() {
        // Confirm with user
        if (!confirm('האם אתה בטוח שברצונך לאפס את כל הגדרות הנגישות?')) {
            return;
        }
        
        // Reset font size
        setFontSize(1);
        
        // Remove all classes
        const classes = ['a11y-high-contrast', 'a11y-dark-mode', 'a11y-invert-colors', 'a11y-dyslexia-font', 'a11y-reading-guide'];
        classes.forEach(className => {
            document.body.classList.remove(className);
        });
        
        // Update all button states
        document.querySelectorAll('.a11y-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Clear localStorage
        const features = ['font_scale', 'high-contrast', 'dark-mode', 'invert-colors', 'dyslexia-font', 'reading-guide'];
        features.forEach(feature => {
            try {
                localStorage.removeItem('a11y_' + feature);
            } catch (e) {
                // Ignore errors
            }
        });
        
        // Reset special features
        handleDyslexicFont(false);
        handleReadingGuide(false);
        updateFontSizeButtons();
        
        announceChange('כל הגדרות הנגישות אופסו');
    }

    function restorePreferences() {
        // Restore font size
        const savedFontScale = getPref('font_scale');
        if (savedFontScale) {
            setFontSize(parseFloat(savedFontScale));
        }
        
        // Restore feature toggles
        const features = ['high-contrast', 'dark-mode', 'invert-colors', 'dyslexia-font', 'reading-guide'];
        features.forEach(feature => {
            if (getPref(feature) === '1') {
                toggleFeature(feature);
            }
        });
    }

    function announceChange(message) {
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }

})();
