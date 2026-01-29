// Inject canonical header markup and set active nav link
(function(){
  const headerHTML = `
    <header role="banner">
      <div class="header-inner">
        <button class="hamburger" aria-label="תפריט" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <a class="logo" href="index.html">SmashLabs</a>
        <nav aria-label="Primary" class="site-nav">
          <ul class="nav-links">
            <li><a href="index.html">בית</a></li>
            <li><a href="about.html">אודות</a></li>
            <li><a href="paint-room.html">חדר צבע</a></li>
            <li><a href="rage-room.html">חדר זעם</a></li>
            <li><a href="throwing-axes.html">זריקת גרזנים</a></li>
            <li><a href="graffiti-center.html">מרכז גרפיטי</a></li>
            <li><a href="birthday.html">יום הולדת</a></li>
            <li><a href="rent-lab.html">השכרת מעבדה</a></li>
            <li><a href="select-package.html">הזמנה</a></li>
            <li id="admin-panel-link" style="display: none;"><a href="admin.html">פאנל ניהול</a></li>
            <li><a href="login.html">התחברות</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <div id="debug-panel" style="position:fixed;top:60px;left:10px;background:rgba(0,0,0,0.9);color:#0f0;padding:10px;font-size:11px;z-index:9999999;max-width:300px;font-family:monospace;display:none;"></div>
  `;

  window.debugHamburger = function(btn) {
    const panel = document.getElementById('debug-panel');
    const navLinks = document.querySelector('.nav-links');
    
    // Toggle classes
    btn.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Show debug panel
    panel.style.display = 'block';
    
    // Get computed styles
    const navStyle = window.getComputedStyle(navLinks);
    
    const debugInfo = `
🍔 HAMBURGER DEBUG 🍔
Time: ${new Date().toLocaleTimeString()}
Screen: ${window.innerWidth}x${window.innerHeight}

CLASSES:
- Hamburger: ${btn.className}
- NavLinks: ${navLinks.className}

COMPUTED STYLES:
- display: ${navStyle.display}
- position: ${navStyle.position}
- transform: ${navStyle.transform}
- z-index: ${navStyle.zIndex}
- top: ${navStyle.top}
- left: ${navStyle.left}
- width: ${navStyle.width}
- height: ${navStyle.height}
- background: ${navStyle.backgroundColor}
- visibility: ${navStyle.visibility}
- opacity: ${navStyle.opacity}

ELEMENT INFO:
- offsetWidth: ${navLinks.offsetWidth}
- offsetHeight: ${navLinks.offsetHeight}
- clientWidth: ${navLinks.clientWidth}
- clientHeight: ${navLinks.clientHeight}
    `.trim();
    
    panel.textContent = debugInfo;
    console.log(debugInfo);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      panel.style.display = 'none';
    }, 10000);
  };


  function inject() {
    const placeholder = document.getElementById('site-header');
    if (placeholder) {
      placeholder.innerHTML = headerHTML;
      // set active link
      const path = location.pathname.split('/').pop() || 'index.html';
      const links = placeholder.querySelectorAll('.nav-links a');
      links.forEach(a=>{
        const href = a.getAttribute('href');
        if (href === path) a.setAttribute('aria-current','page');
        else a.removeAttribute('aria-current');
      });
      
      // Check if user is admin and show admin panel link
      checkAdminStatus();
      
      // Setup hamburger menu after header is injected
      setTimeout(setupHamburger, 100);
    }
  }

  function checkAdminStatus() {
    // Check if admin is logged in via sessionStorage or localStorage
    const isAdminSession = sessionStorage.getItem('smashlabs_admin_logged_in') === 'true';
    const isAdminLocal = localStorage.getItem('smashlabs_admin_logged_in') === 'true';
    
    // Check current user data
    const currentUserSession = sessionStorage.getItem('smashlabs_current_user');
    const currentUserLocal = localStorage.getItem('smashlabs_current_user');
    const currentUser = JSON.parse(currentUserSession || currentUserLocal || '{}');
    
    const isAdmin = isAdminSession || isAdminLocal || currentUser.is_admin === true;
    
    console.log('Header - Admin check:', { isAdminSession, isAdminLocal, currentUser, isAdmin });
    
    if (isAdmin) {
      // Show admin panel link
      const adminLink = document.getElementById('admin-panel-link');
      if (adminLink) {
        adminLink.style.display = 'block';
        console.log('✅ Admin panel link shown');
      }
    }
  }

  function setupHamburger() {
    console.log('=== HAMBURGER DEBUG START ===');
    console.log('Window width:', window.innerWidth);
    console.log('Screen width:', screen.width);
    
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    console.log('Hamburger element:', hamburger);
    console.log('NavLinks element:', navLinks);
    
    if (!hamburger || !navLinks) {
      console.error('❌ Elements not found!');
      console.log('All .hamburger:', document.querySelectorAll('.hamburger'));
      console.log('All .nav-links:', document.querySelectorAll('.nav-links'));
      return;
    }
    
    console.log('✅ Elements found!');
    console.log('Hamburger computed display:', window.getComputedStyle(hamburger).display);
    console.log('NavLinks computed display:', window.getComputedStyle(navLinks).display);
    
    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🍔 HAMBURGER CLICKED!');
      console.log('Before toggle - hamburger classes:', this.className);
      console.log('Before toggle - navLinks classes:', navLinks.className);
      
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
      
      console.log('After toggle - hamburger classes:', this.className);
      console.log('After toggle - navLinks classes:', navLinks.className);
      console.log('NavLinks display after toggle:', window.getComputedStyle(navLinks).display);
      console.log('NavLinks visibility after toggle:', window.getComputedStyle(navLinks).visibility);
      console.log('NavLinks opacity after toggle:', window.getComputedStyle(navLinks).opacity);
      
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    
    console.log('✅ Event listener attached');
    console.log('=== HAMBURGER DEBUG END ===');
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        console.log('Link clicked, closing menu');
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        console.log('Escape pressed, closing menu');
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
