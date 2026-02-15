// Inject canonical header markup and set active nav link
(function(){
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
    
    // Toggle menu function
    function toggleMenu() {
      const isOpen = navLinks.classList.contains('menu-open');
      
      if (isOpen) {
        // Close menu
        navLinks.classList.remove('menu-open');
        overlay.classList.remove('show');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        // Open menu
        navLinks.classList.add('menu-open');
        overlay.classList.add('show');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    }
    
    // Hamburger click
    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    
    // Overlay click - close menu
    overlay.addEventListener('click', toggleMenu);
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', toggleMenu);
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navLinks.classList.contains('menu-open')) {
        toggleMenu();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
