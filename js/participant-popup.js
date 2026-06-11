// Participant selection popup — intercepts all links to select-package.html
(function() {
    // Inject popup HTML + CSS once
    function injectPopup() {
        if (document.getElementById('participant-popup-overlay')) return;

        const css = document.createElement('style');
        css.textContent = `
      #participant-popup-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.75);
        z-index: 999999;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      #participant-popup-overlay.active {
        display: flex;
      }
      #participant-popup {
        background: #1a1a1a;
        border: 2px solid #ff6b00;
        border-radius: 20px;
        padding: 2.5rem 2rem 2rem;
        max-width: 480px;
        width: 90%;
        text-align: center;
        position: relative;
        animation: ppSlideIn 0.3s ease;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      }
      @keyframes ppSlideIn {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #participant-popup .pp-close {
        position: absolute;
        top: 12px;
        left: 12px;
        background: none;
        border: none;
        color: #999;
        font-size: 1.5rem;
        cursor: pointer;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }
      #participant-popup .pp-close:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }
      #participant-popup h2 {
        color: #ff6b00;
        font-size: 1.6rem;
        margin: 0 0 0.5rem;
        font-weight: 700;
      }
      #participant-popup .pp-subtitle {
        color: #aaa;
        font-size: 0.95rem;
        margin: 0 0 1.5rem;
      }
      .pp-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .pp-option {
        background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
        border: 2px solid #333;
        border-radius: 14px;
        padding: 1.25rem 0.75rem;
        cursor: pointer;
        transition: all 0.25s ease;
        text-align: center;
        min-height: 44px;
      }
      .pp-option:hover,
      .pp-option:focus-visible {
        border-color: #ff6b00;
        background: linear-gradient(135deg, #2d2218 0%, #1a1a1a 100%);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(255,107,0,0.2);
      }
      .pp-option:active {
        transform: translateY(0);
      }
      .pp-option .pp-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
      }
      .pp-option .pp-label {
        color: #fff;
        font-size: 1.05rem;
        font-weight: 600;
        display: block;
        margin-bottom: 0.25rem;
      }
      .pp-option .pp-desc {
        color: #999;
        font-size: 0.8rem;
        display: block;
      }
      @media (max-width: 400px) {
        #participant-popup {
          padding: 2rem 1.25rem 1.5rem;
        }
        .pp-options {
          grid-template-columns: 1fr;
        }
        #participant-popup h2 {
          font-size: 1.3rem;
        }
      }
    `;
        document.head.appendChild(css);

        const overlay = document.createElement('div');
        overlay.id = 'participant-popup-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'בחירת מספר משתתפים');
        overlay.innerHTML = `
      <div id="participant-popup">
        <button class="pp-close" aria-label="סגור">✕</button>
        <h2>כמה אתם מגיעים?</h2>
        <p class="pp-subtitle">בחרו כדי שנציג את המחירים הנכונים</p>
        <div class="pp-options">
          <button class="pp-option" data-participants="1" aria-label="מגיע לבד - אדם אחד">
            <span class="pp-icon">🧑</span>
            <span class="pp-label">מגיע לבד</span>
            <span class="pp-desc">אדם אחד</span>
          </button>
          <button class="pp-option" data-participants="2" aria-label="מגיע בזוג - 2 אנשים">
            <span class="pp-icon">👫</span>
            <span class="pp-label">מגיע בזוג</span>
            <span class="pp-desc">2 אנשים</span>
          </button>
          <button class="pp-option" data-participants="3" aria-label="שלישיה - 3 אנשים">
            <span class="pp-icon">👨‍👩‍👧‍👦</span>
            <span class="pp-label">שלישיה</span>
            <span class="pp-desc">3 אנשים</span>
          </button>
          <button class="pp-option" data-participants="4" aria-label="רבעיה ומעלה - 4 אנשים ומעלה">
            <span class="pp-icon">🎉</span>
            <span class="pp-label">רבעיה ומעלה</span>
            <span class="pp-desc">4 אנשים ומעלה</span>
          </button>
        </div>
      </div>
    `;
        document.body.appendChild(overlay);

        // Close on overlay background click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closePopup();
        });

        // Close button
        overlay.querySelector('.pp-close').addEventListener('click', closePopup);

        // Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) closePopup();
        });

        // Option clicks
        overlay.querySelectorAll('.pp-option').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var count = parseInt(btn.getAttribute('data-participants'));
                saveAndRedirect(count);
            });
        });
    }

    function openPopup() {
        injectPopup();
        var overlay = document.getElementById('participant-popup-overlay');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus first option
        var firstOpt = overlay.querySelector('.pp-option');
        if (firstOpt) firstOpt.focus();
    }

    function closePopup() {
        var overlay = document.getElementById('participant-popup-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function saveAndRedirect(participants) {
        // Save to smashlabs_order (used by select-package.html to filter)
        var orderData = {};
        try {
            orderData = JSON.parse(localStorage.getItem('smashlabs_order') || '{}');
        } catch (e) { orderData = {}; }
        orderData.participants = participants;
        localStorage.setItem('smashlabs_order', JSON.stringify(orderData));

        // Also save to currentOrder
        var currentOrder = {};
        try {
            currentOrder = JSON.parse(localStorage.getItem('currentOrder') || '{}');
        } catch (e) { currentOrder = {}; }
        currentOrder.participants = participants;
        currentOrder.quantity = participants;
        localStorage.setItem('currentOrder', JSON.stringify(currentOrder));

        closePopup();
        window.location.href = 'select-package.html';
    }

    // Intercept all links/buttons pointing to select-package.html
    function interceptLinks() {
        document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href*="select-package"], button[onclick*="select-package"]');
            if (!link) return;

            // Don't intercept if we're already ON select-package.html
            if (window.location.pathname.indexOf('select-package') !== -1) return;

            e.preventDefault();
            e.stopPropagation();
            openPopup();
        }, true);
    }

    // Also intercept the nav link in the header
    // (header-inject.js creates it dynamically, so we use event delegation above)

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', interceptLinks);
    } else {
        interceptLinks();
    }

    // Expose for programmatic use
    window.openParticipantPopup = openPopup;
})();