// Order form handling - Saves to Supabase and localStorage
async function handleOrderSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const quantity = formData.get('quantity');
    const date = formData.get('date');
    const time = formData.get('time');
    const notes = formData.get('notes');
    const createAccount = formData.get('create_account') === 'on';
    const password = formData.get('register_password');

    // Validate required fields
    if (!name || !email || !phone || !quantity || !date || !time) {
        if (window.customModal) {
            window.customModal.error('אנא מלא את כל השדות הנדרשים', 'שדות חסרים');
        } else {
            alert('אנא מלא את כל השדות הנדרשים');
        }
        return;
    }

    // Validate password if account creation is requested
    if (createAccount && password) {
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            if (window.customModal) {
                window.customModal.error('הסיסמה אינה עומדת בכל הדרישות. אנא בדוק את התנאים למטה.', 'סיסמה לא תקינה');
            } else {
                alert('הסיסמה חייבת לכלול: לפחות 8 תווים, אות גדולה, אות קטנה, מספר ותו מיוחד');
            }
            return;
        }
    } else if (createAccount && !password) {
        if (window.customModal) {
            window.customModal.error('אנא הזן סיסמה ליצירת חשבון', 'סיסמה חסרה');
        } else {
            alert('אנא הזן סיסמה ליצירת חשבון');
        }
        return;
    }

    // Get existing order data (includes package selection)
    const existingOrder = JSON.parse(localStorage.getItem('currentOrder') || '{}');

    // Create order object, merging with existing data to preserve package selection
    const orderData = {
        ...existingOrder, // Preserve service, packageName, price, roomType from select-package
        name,
        email,
        phone,
        participants: quantity, // Save as 'participants' for package filtering
        quantity, // Keep for backward compatibility
        date,
        time,
        notes,
        createAccount, // Flag to create account AFTER payment
        accountPassword: password || null, // Store password to create account after payment
        timestamp: new Date().toISOString()
    };

    // Generate temporary order ID for tracking
    orderData.orderId = `TEMP-${Date.now()}`;

    // Store order in localStorage for the waiver page and payment
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    localStorage.setItem('smashlabs_order', JSON.stringify(orderData)); // For select-package compatibility

    // Show confirmation
    const confirmMessage = `הזמנה נשמרה בהצלחה!\n\n<strong>מספר הזמנה:</strong> ${orderData.orderId}\n<strong>תאריך:</strong> ${date}\n<strong>שעה:</strong> ${time}\n\nמעביר לכתב ויתור...`;

    let hasContinued = false;
    const continueToWaiver = () => {
        if (hasContinued) return;
        hasContinued = true;
        window.location.href = 'waiver.html';
    };

    if (window.customModal) {
        // Clicking "מעולה!" moves the user forward to the waiver step (not back).
        window.customModal.success(confirmMessage, 'הזמנה נשמרה! 🎉', false)
            .then(continueToWaiver);
        // Fallback: auto-continue after 5 seconds if the user doesn't click.
        setTimeout(continueToWaiver, 5000);
    } else {
        alert(`הזמנה נשמרה!\nמספר הזמנה: ${orderData.orderId}\nתאריך: ${date}\nשעה: ${time}\nמעביר לכתב ויתור...`);
        // The alert blocks until dismissed, so continue immediately afterwards.
        continueToWaiver();
    }
}

// Initialize order form when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.querySelector('#order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    } else {
        console.error('Order form not found!');
    }

    // Add real-time validation for name field
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('input', function(e) {
            // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
            this.value = this.value.replace(/[^a-zA-Zא-ת\s'\-]/g, '');
        });
    }

    // Add real-time validation for phone field
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove any non-digit characters
            this.value = this.value.replace(/[^0-9]/g, '');
            // Limit to 10 digits
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    }

    // Auto-fill name and email if user is logged in
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('smashlabs_current_user') || '{}');
        if (currentUser.name && currentUser.email) {
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const createAccountCheckbox = document.getElementById('create-account');
            const passwordContainer = document.getElementById('password-field-container');
            const hasAccountCheckbox = document.getElementById('has-account');
            const hasAccountSection = hasAccountCheckbox ? hasAccountCheckbox.closest('.form-group') : null;

            if (nameInput && !nameInput.value) {
                nameInput.value = currentUser.name;
            }
            if (emailInput && !emailInput.value) {
                emailInput.value = currentUser.email;
            }

            // Hide both account sections if user is already logged in
            if (createAccountCheckbox && passwordContainer) {
                const accountSection = createAccountCheckbox.closest('.form-group');
                if (accountSection) {
                    accountSection.style.display = 'none';
                }
            }
            if (hasAccountSection) {
                hasAccountSection.style.display = 'none';
            }

            // Try to load saved waiver
            if (window.orderDB && window.orderDB.getUserSavedWaiver) {
                window.orderDB.getUserSavedWaiver(currentUser.id).then(waiver => {
                    if (waiver && waiver.saved_waiver_data) {
                        localStorage.setItem('smashlabs_saved_waiver', JSON.stringify(waiver.saved_waiver_data));
                        localStorage.setItem('smashlabs_waiver_date', waiver.saved_waiver_date);
                    }
                }).catch(err => {});
            }
        }
    } catch (error) {
        // Silent error
    }

    // Toggle "has account" login fields
    const hasAccountCheckbox = document.getElementById('has-account');
    const loginFieldsContainer = document.getElementById('login-fields-container');
    const loadAccountBtn = document.getElementById('load-account-btn');
    const loginStatus = document.getElementById('login-status');

    if (hasAccountCheckbox && loginFieldsContainer) {
        hasAccountCheckbox.addEventListener('change', function() {
            if (this.checked) {
                loginFieldsContainer.style.display = 'block';
            } else {
                loginFieldsContainer.style.display = 'none';
                if (loginStatus) loginStatus.textContent = '';
            }
        });
    }

    // Handle "Load my details" button
    if (loadAccountBtn) {
        loadAccountBtn.addEventListener('click', async function() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                if (loginStatus) {
                    loginStatus.style.color = '#ff6b6b';
                    loginStatus.textContent = 'אנא הזן אימייל וסיסמה';
                }
                return;
            }

            // Show loading
            this.disabled = true;
            this.textContent = 'טוען...';
            if (loginStatus) {
                loginStatus.style.color = '#1fb6c2';
                loginStatus.textContent = 'מתחבר...';
            }

            try {
                // Login via customer endpoint
                const response = await fetch('/api/customer/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.user) {
                    // Success - store user session
                    const userWithoutPassword = {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        is_admin: data.user.is_admin || false,
                        loginTime: Date.now()
                    };
                    sessionStorage.setItem('smashlabs_current_user', JSON.stringify(userWithoutPassword));

                    // Fill form with user data
                    document.getElementById('name').value = data.user.name;
                    document.getElementById('email').value = data.user.email;
                    if (data.user.phone && document.getElementById('phone')) {
                        document.getElementById('phone').value = data.user.phone;
                    }

                    // Try to load saved waiver
                    if (window.orderDB && window.orderDB.getUserSavedWaiver) {
                        const waiver = await window.orderDB.getUserSavedWaiver(data.user.id);
                        if (waiver && waiver.saved_waiver_data) {
                            localStorage.setItem('smashlabs_saved_waiver', JSON.stringify(waiver.saved_waiver_data));
                            localStorage.setItem('smashlabs_waiver_date', waiver.saved_waiver_date);

                            if (loginStatus) {
                                loginStatus.style.color = '#22c55e';
                                loginStatus.textContent = '✅ פרטים וכתב ויתור נטענו בהצלחה!';
                            }
                        } else {
                            if (loginStatus) {
                                loginStatus.style.color = '#22c55e';
                                loginStatus.textContent = '✅ פרטים נטענו (לא נמצא כתב ויתור שמור)';
                            }
                        }
                    }

                    // Hide login section and account creation section
                    const hasAccountSection = hasAccountCheckbox.closest('.form-group');
                    const createAccountEl = document.getElementById('create-account');
                    const createAccountSection = createAccountEl && createAccountEl.closest('.form-group');
                    if (hasAccountSection) hasAccountSection.style.display = 'none';
                    if (createAccountSection) createAccountSection.style.display = 'none';

                } else {
                    // Login failed
                    if (loginStatus) {
                        loginStatus.style.color = '#ff6b6b';
                        loginStatus.textContent = data.error || 'שגיאה בהתחברות';
                    }
                    this.disabled = false;
                    this.textContent = 'טען את הפרטים שלי';
                }
            } catch (error) {
                console.error('Login error:', error);
                if (loginStatus) {
                    loginStatus.style.color = '#ff6b6b';
                    loginStatus.textContent = 'שגיאה בהתחברות';
                }
                this.disabled = false;
                this.textContent = 'טען את הפרטים שלי';
            }
        });
    }

    // Toggle password field visibility when checkbox is checked
    const createAccountCheckbox = document.getElementById('create-account');
    const passwordContainer = document.getElementById('password-field-container');
    const passwordInput = document.getElementById('register-password');

    if (createAccountCheckbox && passwordContainer && passwordInput) {
        createAccountCheckbox.addEventListener('change', function() {
            if (this.checked) {
                passwordContainer.style.display = 'block';
                passwordInput.setAttribute('required', 'required');
            } else {
                passwordContainer.style.display = 'none';
                passwordInput.removeAttribute('required');
                passwordInput.value = '';
                // Reset validation UI
                resetPasswordValidation();
            }
        });

        // Add password validation on input
        passwordInput.addEventListener('input', function() {
            validateOrderPassword(this.value);
        });
    }

    // Password validation function for order form
    function validateOrderPassword(password) {
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Update UI for each requirement
        updateRequirement('order-req-length', hasLength);
        updateRequirement('order-req-uppercase', hasUppercase);
        updateRequirement('order-req-lowercase', hasLowercase);
        updateRequirement('order-req-number', hasNumber);
        updateRequirement('order-req-special', hasSpecial);

        return hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }

    function updateRequirement(elementId, isValid) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isValid) {
                element.style.color = '#4caf50';
                element.textContent = element.textContent.replace('✗', '✓');
            } else {
                element.style.color = '#f44336';
                element.textContent = element.textContent.replace('✓', '✗');
            }
        }
    }

    function resetPasswordValidation() {
        const requirements = ['order-req-length', 'order-req-uppercase', 'order-req-lowercase', 'order-req-number', 'order-req-special'];
        requirements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.color = '#f44336';
                element.textContent = element.textContent.replace('✓', '✗');
            }
        });
    }

    // Remove header emojis as requested
    try {
        const rx = /[\p{Extended_Pictographic}\uFE0F]/gu;
        document.querySelectorAll('h1, h2, h3').forEach(h => {
            h.textContent = h.textContent.replace(rx, '').trim();
        });
    } catch (e) {
        // Silent error
    }
});