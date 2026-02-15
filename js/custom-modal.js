/**
 * Custom Modal System for SmashLabs
 * Replaces browser alerts/confirms with styled modals
 */

class CustomModal {
    constructor() {
        this.createModalHTML();
        this.modal = document.getElementById('custom-modal');
        this.modalContainer = this.modal.querySelector('.modal-container');
        this.modalIcon = this.modal.querySelector('.modal-icon');
        this.modalTitle = this.modal.querySelector('.modal-title');
        this.modalBody = this.modal.querySelector('.modal-body');
        this.modalFooter = this.modal.querySelector('.modal-footer');
        this.setupEventListeners();
    }

    createModalHTML() {
        const modalHTML = `
            <div id="custom-modal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center;">
                            <span class="modal-icon">💥</span>
                            <h3 class="modal-title">הודעה</h3>
                        </div>
                        <button class="modal-close" aria-label="סגור">&times;</button>
                    </div>
                    <div class="modal-body">
                        הודעה
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button modal-button-primary">אישור</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setupEventListeners() {
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on X button
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    show(options = {}) {
        const {
            title = 'הודעה',
            message = '',
            icon = '💥',
            type = 'info', // info, success, error, warning
            buttons = [{ text: 'אישור', primary: true, action: () => this.close() }],
            showCloseButton = true
        } = options;

        // Set icon
        this.modalIcon.textContent = this.getIconForType(icon, type);

        // Set title
        this.modalTitle.textContent = title;

        // Set message
        this.modalBody.innerHTML = message;

        // Set type styling
        this.modalContainer.className = 'modal-container';
        if (type !== 'info') {
            this.modalContainer.classList.add(`modal-${type}`);
        }
        
        // Show/hide close button
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.style.display = showCloseButton ? 'block' : 'none';
        }

        // Create buttons
        this.modalFooter.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `modal-button ${btn.primary ? 'modal-button-primary' : 'modal-button-secondary'}`;
            button.textContent = btn.text;
            button.onclick = () => {
                if (btn.action) btn.action();
                else this.close();
            };
            this.modalFooter.appendChild(button);
        });

        // Show modal
        this.modal.classList.add('active');
        
        // Focus first button
        setTimeout(() => {
            const firstButton = this.modalFooter.querySelector('.modal-button');
            if (firstButton) firstButton.focus();
        }, 100);
    }

    close() {
        this.modal.classList.remove('active');
    }

    getIconForType(customIcon, type) {
        if (customIcon && customIcon !== '💥') return customIcon;
        
        const icons = {
            info: '💥',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    alert(message, title = 'הודעה') {
        return new Promise(resolve => {
            this.show({
                title,
                message,
                type: 'info',
                buttons: [{ 
                    text: 'אישור', 
                    primary: true, 
                    action: () => { 
                        this.close(); 
                        resolve(true); 
                    } 
                }]
            });
        });
    }

    success(message, title = 'הצלחה!', showCloseButton = true) {
        return new Promise(resolve => {
            this.show({
                title,
                message,
                type: 'success',
                icon: '✅',
                showCloseButton,
                buttons: [{ 
                    text: 'מעולה!', 
                    primary: true, 
                    action: () => { 
                        this.close(); 
                        resolve(true); 
                    } 
                }]
            });
        });
    }

    error(message, title = 'שגיאה') {
        return new Promise(resolve => {
            this.show({
                title,
                message,
                type: 'error',
                icon: '❌',
                buttons: [{ 
                    text: 'הבנתי', 
                    primary: true, 
                    action: () => { 
                        this.close(); 
                        resolve(true); 
                    } 
                }]
            });
        });
    }

    warning(message, title = 'אזהרה') {
        return new Promise(resolve => {
            this.show({
                title,
                message,
                type: 'warning',
                icon: '⚠️',
                buttons: [{ 
                    text: 'הבנתי', 
                    primary: true, 
                    action: () => { 
                        this.close(); 
                        resolve(true); 
                    } 
                }]
            });
        });
    }

    confirm(message, title = 'אישור') {
        return new Promise(resolve => {
            this.show({
                title,
                message,
                type: 'warning',
                icon: '❓',
                buttons: [
                    { 
                        text: 'אישור', 
                        primary: true, 
                        action: () => { 
                            this.close(); 
                            resolve(true); 
                        } 
                    },
                    { 
                        text: 'ביטול', 
                        primary: false, 
                        action: () => { 
                            this.close(); 
                            resolve(false); 
                        } 
                    }
                ]
            });
        });
    }
}

// Initialize modal when DOM is ready
let customModal;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        customModal = new CustomModal();
        window.customModal = customModal;
    });
} else {
    customModal = new CustomModal();
    window.customModal = customModal;
}

// Override native alert (optional - for backwards compatibility)
window.showModal = (message, title) => {
    if (window.customModal) {
        return window.customModal.alert(message, title);
    } else {
        alert(message);
        return Promise.resolve(true);
    }
};
