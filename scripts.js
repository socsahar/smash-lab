// Main JavaScript for Rage Room Website

// Order Modal Functions
function openOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Trap focus within modal
        trapFocus(modal);
    }
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function setService(serviceValue) {
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
        serviceSelect.value = serviceValue;
    }
}

function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        } else if (e.key === 'Escape') {
            closeOrderModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('orderModal');
        if (modal && event.target === modal) {
            closeOrderModal();
        }
    });
    
    // DISABLED - Order form now handled by order.js
    // Handle order form submission
    /*
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(orderForm);
            const data = Object.fromEntries(formData);
            
            // Validate required fields
            if (!data.name || !data.phone || !data.service) {
                alert('אנא מלא את כל השדות הנדרשים');
                return;
            }
            
            // Here you would normally send to a server
            console.log('Order data:', data);
            
            // Show success message
        if (window.customModal) {
            window.customModal.success('ההזמנה נשלחה בהצלחה! נחזור אליך בהקדם', 'תודה! 🎉');
        } else {
            alert('ההזמנה נשלחה בהצלחה! נחזור אליך בהקדם');
        }
            // Reset form and close modal
            orderForm.reset();
            closeOrderModal();
        });
    }
    */
});

function initializeWebsite() {
    setupMobileNavigation();
    setupScrollAnimations();
    // setupFormHandling(); // DISABLED - Now handled by order.js
    setupPageSpecificAnimations();
    setupGraffitiEffects();
    setupOwnerAccess();
}

// Mobile Navigation Toggle
function setupMobileNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all elements with fade-in class
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Spray paint animation on scroll
    document.querySelectorAll('.spray-animate').forEach(el => {
        observer.observe(el);
    });
}

// Form Handling - DISABLED (Now handled by order.js)
/*
function setupFormHandling() {
    const forms = document.querySelectorAll('.booking-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Validate form
            if (validateBookingForm(data)) {
                // Show success message
                showBookingSuccess();
                
                // Reset form after delay
                setTimeout(() => {
                    form.reset();
                }, 2000);
            } else {
                showBookingError();
            }
        });
    });
}
*/

/*
function validateBookingForm(data) {
    // Basic validation
    const required = ['name', 'phone', 'date', 'time'];
    for (let field of required) {
        if (!data[field] || data[field].trim() === '') {
            showBookingError(`השדה "${getFieldLabel(field)}" הוא חובה`);
            return false;
        }
    }
    
    // Name validation (Hebrew characters)
    const nameRegex = /^[א-ת\s]{2,50}$/;
    if (!nameRegex.test(data.name)) {
        showBookingError('השם חייב להכיל אותיות בעברית בלבד (2-50 תווים)');
        return false;
    }
    
    // Phone validation (Israeli format)
    const phoneRegex = /^0[5-9]\d{8}$/;
    const cleanPhone = data.phone.replace(/[-\s]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        showBookingError('מספר הטלפון חייב להיות בפורמט ישראלי תקין (050-1234567)');
        return false;
    }
    
    // Email validation (if provided)
    if (data.email && data.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showBookingError('כתובת האימייל לא תקינה');
            return false;
        }
    }
    
    // Date validation (not in the past)
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showBookingError('לא ניתן לבחור תאריך בעבר');
        return false;
    }
    
    // Date validation (not too far in future - 3 months)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    if (selectedDate > maxDate) {
        showBookingError('ניתן להזמין עד 3 חודשים מראש');
        return false;
    }
    
    return true;
}
*/

function getFieldLabel(field) {
    const labels = {
        'name': 'שם מלא',
        'phone': 'טלפון',
        'email': 'אימייל',
        'date': 'תאריך',
        'time': 'שעה',
        'package': 'חבילה',
        'participants': 'מספר משתתפים'
    };
    return labels[field] || field;
}

function showBookingSuccess() {
    // Generate booking ID and get form data
    const bookingId = 'BK' + Date.now().toString().slice(-6);
    
    // Get the last form that was submitted
    const forms = document.querySelectorAll('.booking-form');
    let formData = {};
    
    forms.forEach(form => {
        const data = new FormData(form);
        if (data.get('name')) {
            formData = Object.fromEntries(data);
        }
    });
    
    // Add room type and metadata
    formData.id = bookingId;
    formData.room = getRoomTypeFromPage();
    formData.timestamp = new Date().toISOString();
    formData.status = 'pending';
    
    // Create and show success popup with booking details
    const popup = createPopup(`
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
            <h3 style="margin-bottom: 1rem; color: #000;">ההזמנה נקלטה בהצלחה!</h3>
            <p style="margin-bottom: 1rem; color: #000;">מספר הזמנה: <strong>${bookingId}</strong></p>
            <p style="color: #000;">נחזור אליכם בתוך 15 דקות לאישור הזמנה</p>
            <div style="margin-top: 1rem;">
                <small style="color: #333;">שמרו את מספר ההזמנה לעדכונים</small>
            </div>
        </div>
    `, 'success');
    
    document.body.appendChild(popup);
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (popup.parentNode) popup.remove();
    }, 5000);
    
    // Save complete booking to localStorage
    saveCompleteBookingToStorage(formData);
    
    // Show additional confirmation
    setTimeout(() => {
        const confirmPopup = createPopup('📱 תקבלו SMS אישור בקרוב', 'info');
        document.body.appendChild(confirmPopup);
        setTimeout(() => confirmPopup.remove(), 2500);
    }, 2000);
}

function getRoomTypeFromPage() {
    const pathname = window.location.pathname;
    if (pathname.includes('paint-room')) return 'חדר צבע';
    if (pathname.includes('rage-room')) return 'חדר זעם';
    if (pathname.includes('throwing-axes')) return 'זריקת גרזנים';
    if (pathname.includes('graffiti-center')) return 'מרכז גרפיטי';
    return 'כללי';
}

function saveCompleteBookingToStorage(bookingData) {
    try {
        const bookings = JSON.parse(localStorage.getItem('rageRoomBookings') || '[]');
        bookings.push(bookingData);
        localStorage.setItem('rageRoomBookings', JSON.stringify(bookings));
        
        // Update statistics
        const stats = JSON.parse(localStorage.getItem('rageRoomStats') || '{"total": 0, "successful": 0, "failed": 0}');
        stats.total++;
        stats.successful++;
        localStorage.setItem('rageRoomStats', JSON.stringify(stats));
        
        console.log('Complete booking saved:', bookingData);
    } catch (error) {
        console.log('Could not save to localStorage:', error);
    }
}

function showBookingError(message = 'אנא בדקו שכל השדות מולאו נכון') {
    const popup = createPopup(`
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3 style="margin-bottom: 1rem;">שגיאה בהזמנה</h3>
            <p style="margin-bottom: 1rem;">${message}</p>
            <p style="font-size: 0.9rem;">או התקשרו: <strong>050-442-9195</strong></p>
        </div>
    `, 'error');
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 4000);
}

function saveBookingToStorage(bookingId) {
    try {
        const bookings = JSON.parse(localStorage.getItem('rageRoomBookings') || '[]');
        const newBooking = {
            id: bookingId,
            timestamp: new Date().toISOString(),
            page: getCurrentPage()
        };
        bookings.push(newBooking);
        localStorage.setItem('rageRoomBookings', JSON.stringify(bookings));
        
        // Update statistics
        const stats = JSON.parse(localStorage.getItem('rageRoomStats') || '{"total": 0, "successful": 0, "failed": 0}');
        stats.total++;
        stats.successful++;
        localStorage.setItem('rageRoomStats', JSON.stringify(stats));
    } catch (error) {
        console.log('Could not save to localStorage:', error);
    }
}

function createPopup(message, type) {
    const popup = document.createElement('div');
    popup.className = `popup popup-${type}`;
    
    // Enhanced popup styles based on type
    const colors = {
        'success': 'var(--neon-green)',
        'error': 'var(--neon-pink)', 
        'info': 'var(--neon-blue)',
        'warning': 'var(--neon-orange)'
    };
    
    const textColor = type === 'success' ? '#000' : '#fff';
    
    popup.innerHTML = `
        <div class="popup-content">
            ${message}
        </div>
        <button class="popup-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Enhanced popup styles
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${colors[type] || 'var(--neon-blue)'};
        color: ${textColor};
        padding: 2rem;
        border-radius: 0;
        border: 4px solid #000;
        box-shadow: 
            0 0 0 2px ${colors[type] || 'var(--neon-blue)'},
            15px 15px 0 0 rgba(0, 0, 0, 0.4);
        z-index: 9999;
        text-align: center;
        font-weight: bold;
        font-family: 'Rubik', sans-serif;
        max-width: 400px;
        min-width: 300px;
        animation: streetPopup 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        transform-origin: center center;
    `;
    
    // Add close button styles
    const closeBtn = popup.querySelector('.popup-close');
    closeBtn.style.cssText = `
        position: absolute;
        top: -10px;
        right: -10px;
        background: #000;
        color: ${colors[type] || 'var(--neon-blue)'};
        border: 2px solid ${colors[type] || 'var(--neon-blue)'};
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2rem;
        font-weight: bold;
        transition: all 0.3s ease;
    `;
    
    // Add hover effect to close button
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = colors[type] || 'var(--neon-blue)';
        closeBtn.style.color = '#000';
        closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = '#000';
        closeBtn.style.color = colors[type] || 'var(--neon-blue)';
        closeBtn.style.transform = 'scale(1) rotate(0deg)';
    });
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
        animation: backdropFade 0.3s ease-out;
    `;
    
    // Close on backdrop click
    backdrop.addEventListener('click', () => {
        popup.remove();
        backdrop.remove();
    });
    
    // Insert backdrop first
    document.body.appendChild(backdrop);
    
    // Auto-remove backdrop when popup is removed
    const originalRemove = popup.remove;
    popup.remove = function() {
        backdrop.remove();
        originalRemove.call(this);
    };
    
    return popup;
}

// Page-Specific Animations
function setupPageSpecificAnimations() {
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'paint-room':
            setupPaintRoomAnimations();
            break;
        case 'rage-room':
            setupRageRoomAnimations();
            break;
        case 'throwing-axes':
            setupAxesRoomAnimations();
            break;
        case 'graffiti-center':
            setupGraffitiCenterAnimations();
            break;
        default:
            setupHomePageAnimations();
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().split('.')[0];
    return page === '' || page === 'index' ? 'home' : page;
}

function setupHomePageAnimations() {
    // Hero text animation sequence
    const heroElements = document.querySelectorAll('.hero-content > *');
    heroElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.3}s`;
    });
    
    // Floating action button animation
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        setInterval(() => {
            ctaButton.style.animation = 'none';
            setTimeout(() => {
                ctaButton.style.animation = 'pulse 2s ease-in-out infinite';
            }, 10);
        }, 10000);
    }
}

function setupPaintRoomAnimations() {
    // Paint splash on scroll
    const paintElements = document.querySelectorAll('.paint-splash');
    paintElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            createPaintSplash(el);
        });
    });
    
    // Color palette animation
    const colors = ['var(--neon-pink)', 'var(--neon-green)', 'var(--neon-blue)', 'var(--neon-orange)'];
    let colorIndex = 0;
    
    setInterval(() => {
        const paintElements = document.querySelectorAll('.paint-effect');
        paintElements.forEach(el => {
            el.style.borderColor = colors[colorIndex];
        });
        colorIndex = (colorIndex + 1) % colors.length;
    }, 2000);
}

function createPaintSplash(element) {
    const splash = document.createElement('div');
    splash.className = 'paint-splash-effect';
    splash.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, var(--neon-pink) 0%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
        animation: splashGrow 0.8s ease-out forwards;
    `;
    
    element.style.position = 'relative';
    element.appendChild(splash);
    
    setTimeout(() => {
        splash.remove();
    }, 800);
}

function setupRageRoomAnimations() {
    // Shaking effect for rage elements
    const rageElements = document.querySelectorAll('.rage-element');
    rageElements.forEach(el => {
        el.addEventListener('click', () => {
            el.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                el.style.animation = '';
            }, 500);
        });
    });
    
    // Breaking glass effect
    const glassElements = document.querySelectorAll('.glass-effect');
    glassElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            createGlassShatter(el);
        });
    });
}

function createGlassShatter(element) {
    const shards = [];
    for (let i = 0; i < 8; i++) {
        const shard = document.createElement('div');
        shard.className = 'glass-shard';
        shard.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: rgba(255, 255, 255, 0.8);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: shardFly${i} 1s ease-out forwards;
        `;
        
        element.style.position = 'relative';
        element.appendChild(shard);
        shards.push(shard);
        
        // Create unique animation for each shard
        const angle = (360 / 8) * i;
        const distance = 50 + Math.random() * 30;
        shard.style.setProperty('--angle', `${angle}deg`);
        shard.style.setProperty('--distance', `${distance}px`);
    }
    
    setTimeout(() => {
        shards.forEach(shard => shard.remove());
    }, 1000);
}

function setupAxesRoomAnimations() {
    // Axe throwing animation
    const axeElements = document.querySelectorAll('.axe-element');
    axeElements.forEach(el => {
        el.addEventListener('click', () => {
            el.style.animation = 'axeThrow 1s ease-in-out';
            setTimeout(() => {
                el.style.animation = '';
            }, 1000);
        });
    });
    
    // Target wobble effect
    const targets = document.querySelectorAll('.target');
    targets.forEach(target => {
        setInterval(() => {
            target.style.animation = 'targetWobble 2s ease-in-out';
            setTimeout(() => {
                target.style.animation = '';
            }, 2000);
        }, 5000);
    });
}

function setupGraffitiCenterAnimations() {
    // Background color change on scroll
    const graffitiSection = document.querySelector('.graffiti-bg-change');
    if (graffitiSection) {
        window.addEventListener('scroll', () => {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            if (scrollPercent > 0.3) {
                graffitiSection.classList.add('scrolled');
            } else {
                graffitiSection.classList.remove('scrolled');
            }
        });
    }
    
    // Spray can animation
    const sprayCans = document.querySelectorAll('.spray-can');
    sprayCans.forEach(can => {
        can.addEventListener('mouseenter', () => {
            createSprayEffect(can);
        });
    });
}

function createSprayEffect(element) {
    const spray = document.createElement('div');
    spray.className = 'spray-effect';
    spray.style.cssText = `
        position: absolute;
        top: 0;
        left: 50%;
        width: 20px;
        height: 60px;
        background: linear-gradient(to bottom, var(--neon-green), transparent);
        transform: translateX(-50%);
        opacity: 0.8;
        animation: sprayUp 1s ease-out forwards;
    `;
    
    element.style.position = 'relative';
    element.appendChild(spray);
    
    setTimeout(() => {
        spray.remove();
    }, 1000);
}

// Graffiti Effects
function setupGraffitiEffects() {
    // Remove dynamic graffiti text color cycling on hover to prevent breaking gradient
    // Add spray paint particles
    createSprayParticles();
}

function createSprayParticles() {
    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'spray-particle';
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: var(--neon-pink);
            border-radius: 50%;
            top: ${Math.random() * 100}vh;
            left: ${Math.random() * 100}vw;
            opacity: 0.6;
            z-index: -1;
            animation: particleFloat 3s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 3000);
    }, 2000);
}

// Additional CSS Animations (added via JavaScript)
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes splashGrow {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes axeThrow {
        0% { transform: rotate(0deg) translateY(0); }
        50% { transform: rotate(180deg) translateY(-20px); }
        100% { transform: rotate(360deg) translateY(0); }
    }
    
    @keyframes targetWobble {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(1deg); }
        75% { transform: rotate(-1deg); }
    }
    
    @keyframes sprayUp {
        0% { 
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 0.8;
        }
        100% { 
            transform: translateX(-50%) translateY(-30px) scale(1.5);
            opacity: 0;
        }
    }
    
    @keyframes particleFloat {
        0% { 
            transform: translateY(0) scale(1);
            opacity: 0.6;
        }
        100% { 
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
        }
    }
    
    @keyframes streetPopup {
        0% {
            transform: translate(-50%, -50%) scale(0.3) rotate(-15deg);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
        }
    }
    
    @keyframes backdropFade {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
    
    @keyframes graffitiBounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) rotate(0deg);
        }
        40% {
            transform: translateY(-30px) rotate(-5deg);
        }
        60% {
            transform: translateY(-15px) rotate(3deg);
        }
    }
    
    @keyframes streetGlow {
        0%, 100% {
            filter: drop-shadow(0 0 5px currentColor);
        }
        50% {
            filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 30px currentColor);
        }
    }
    
    @keyframes ownerPulse {
        0%, 100% {
            transform: scale(1);
            box-shadow: 8px 8px 0 rgba(0,0,0,0.3);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 12px 12px 0 rgba(0,0,0,0.4);
        }
    }
`;
document.head.appendChild(style);

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization for scroll events
const debouncedScroll = debounce(() => {
    // Handle scroll-based animations
}, 10);

window.addEventListener('scroll', debouncedScroll);

// Owner Access System
function setupOwnerAccess() {
    let ownerModeKeys = [];
    
    document.addEventListener('keydown', function(e) {
        if (e.key) {
            ownerModeKeys.push(e.key.toLowerCase());
            if (ownerModeKeys.length > 10) ownerModeKeys.shift();
            
            // Secret combination: "admin123"
            if (ownerModeKeys.join('').includes('admin123')) {
                showOwnerAccessButton();
                ownerModeKeys = [];
            }
        }
    });
}

function showOwnerAccessButton() {
    // Remove existing button if any
    const existingBtn = document.querySelector('.owner-access-btn');
    if (existingBtn) existingBtn.remove();
    
    const ownerLink = document.createElement('div');
    ownerLink.className = 'owner-access-btn';
    ownerLink.innerHTML = `
        <div style="
            position: fixed; 
            top: 20px; 
            left: 20px; 
            background: linear-gradient(45deg, var(--neon-pink), var(--neon-purple));
            color: white; 
            padding: 15px 25px; 
            border: 3px solid #000;
            border-radius: 0;
            box-shadow: 8px 8px 0 rgba(0,0,0,0.3);
            z-index: 9999;
            cursor: pointer;
            font-weight: bold;
            animation: ownerPulse 2s infinite;
            font-family: 'Rubik', sans-serif;
            text-transform: uppercase;
            letter-spacing: 2px;
        ">
            🔑 כניסה לבעלים
        </div>
    `;
    
    ownerLink.onclick = () => {
        window.open('owner-dashboard.html', '_blank');
        ownerLink.remove();
    };
    
    document.body.appendChild(ownerLink);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (ownerLink.parentNode) ownerLink.remove();
    }, 10000);
}
