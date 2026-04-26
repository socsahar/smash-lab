// Inject canonical header markup and set active nav link
(function(){
  // Auto-inject navbar.css if not already present
  if (!document.querySelector('link[href*="navbar.css"]')) {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    // Detect if we're in a subfolder (e.g. pages/)
    const depth = location.pathname.split('/').filter(Boolean).length;
    const isSubfolder = document.querySelector('script[src*="../js/header-inject"]');
    cssLink.href = isSubfolder ? '../css/navbar.css' : 'css/navbar.css';
    document.head.appendChild(cssLink);
  }

  const headerHTML = `
    <div class="mobile-overlay"></div>
    <header role="banner">
      <div class="header-inner">
        <button class="hamburger" aria-label="תפריט" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <a class="logo" href="index.html">SmashLabs</a>
        <nav aria-label="Primary" class="site-nav">
          <ul class="nav-links">
            <li><a href="index.html">בית</a></li>
            <li><a href="about.html">אודות</a></li>
            <li><a href="paint-room.html">חדר צבע</a></li>
            <li><a href="rage-room.html">חדר זעם</a></li>
            <li><a href="throwing-axes.html">הטלת גרזנים</a></li>
            <li><a href="graffiti-center.html">מרכז גרפיטי</a></li>
            <li><a href="birthday.html">יום הולדת</a></li>
            <li><a href="rent-lab.html">השכרת הסמאש</a></li>
            <li><a href="select-package.html">הזמנה</a></li>
            <li id="admin-panel-link" style="display: none;"><a href="admin.html">פאנל ניהול</a></li>
            <li><a href="login.html">התחברות</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;

  function inject() {
    const placeholder = document.getElementById('site-header');
    if (placeholder) {
      placeholder.innerHTML = headerHTML;
      
      // Set active link
      const path = location.pathname.split('/').pop() || 'index.html';
      const links = placeholder.querySelectorAll('.nav-links a');
      links.forEach(a => {
        const href = a.getAttribute('href');
        if (href === path) a.setAttribute('aria-current','page');
        else a.removeAttribute('aria-current');
      });
      
      // Check if user is admin and show admin panel link
      checkAdminStatus();
      
      // Setup mobile menu
      initMobileMenu();
    }
  }

  function checkAdminStatus() {
    const isAdminSession = sessionStorage.getItem('smashlabs_admin_logged_in') === 'true';
    const isAdminLocal = localStorage.getItem('smashlabs_admin_logged_in') === 'true';
    const currentUserSession = sessionStorage.getItem('smashlabs_current_user');
    const currentUserLocal = localStorage.getItem('smashlabs_current_user');
    const currentUser = JSON.parse(currentUserSession || currentUserLocal || '{}');
    const isAdmin = isAdminSession || isAdminLocal || currentUser.is_admin === true;
    
    if (isAdmin) {
      const adminLink = document.getElementById('admin-panel-link');
      if (adminLink) adminLink.style.display = 'block';
    }
  }

  function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (!hamburger || !navLinks || !overlay) {
      return;
    }

    let savedScrollY = 0;
    
    // iOS-safe body scroll lock
    function lockBody() {
      savedScrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + savedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    }
    
    function unlockBody() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }

    function openMenu() {
      navLinks.classList.add('menu-open');
      overlay.classList.add('show');
      hamburger.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      navLinks.setAttribute('aria-hidden', 'false');
      lockBody();
      trapFocus();
    }

    function closeMenu() {
      navLinks.classList.remove('menu-open');
      overlay.classList.remove('show');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.setAttribute('aria-hidden', 'true');
      unlockBody();
      hamburger.focus();
    }
    
    // Toggle menu function
    function toggleMenu() {
      const isOpen = navLinks.classList.contains('menu-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    // Focus trapping inside open menu
    function trapFocus() {
      const focusables = navLinks.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusables.length > 0) {
        focusables[0].focus();
      }
      navLinks.addEventListener('keydown', function onTab(e) {
        if (e.key !== 'Tab') return;
        if (!navLinks.classList.contains('menu-open')) {
          navLinks.removeEventListener('keydown', onTab);
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    }

    // Swipe-to-close gesture
    let touchStartX = 0;
    let touchStartY = 0;
    navLinks.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    navLinks.addEventListener('touchend', function(e) {
      if (!navLinks.classList.contains('menu-open')) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Swipe right (for RTL sites, this closes the menu) — also handle left swipe
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)) {
        closeMenu();
      }
    }, { passive: true });
    
    // Hamburger click
    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    
    // Overlay click - close menu
    overlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navLinks.classList.contains('menu-open')) {
        closeMenu();
      }
    });

    // Close menu on resize to desktop width
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && navLinks.classList.contains('menu-open')) {
        closeMenu();
      }
    });

    // Set initial aria-hidden
    navLinks.setAttribute('aria-hidden', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // Load participant popup script (intercepts select-package links)
  var ppScript = document.createElement('script');
  ppScript.src = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace('header-inject.js', 'participant-popup.js')
    : 'js/participant-popup.js';
  document.head.appendChild(ppScript);
})();
