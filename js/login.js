/**
 * Simple Login and Registration Handler
 * Now using Supabase cloud database
 */

// Wait for Supabase to load
window.addEventListener('supabase-loaded', function() {
    initializeLogin();
});

// Also try to initialize immediately if already loaded
if (window.userDB) {
    initializeLogin();
}

function initializeLogin() {
    console.log('Login.js loaded with Supabase!');

    // Check if user is already logged in
    const currentUser = window.UserAuth ? window.UserAuth.getCurrentUser() : null;
    if (currentUser) {
        // User is already logged in - show logout option
        console.log('User already logged in:', currentUser.email);
        showAlreadyLoggedIn(currentUser);
        return;
    }

    /* REQUIRES_SERVER_ENV: Admin credentials must be validated server-side only.
       Client-side hardcoded credentials are a CRITICAL security vulnerability.
       Use /api/login endpoint with proper server-side credential verification. */

    // Get elements
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const verificationFormContainer = document.getElementById('verification-form-container');
    const adminPanelContainer = document.getElementById('admin-panel-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const verificationForm = document.getElementById('verification-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const resendCodeLink = document.getElementById('resend-code');
    const registerPassword = document.getElementById('register-password');
    const registerPasswordConfirm = document.getElementById('register-password-confirm');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const loginErrorMessage = document.getElementById('login-error-message');
    const loginSuccessMessage = document.getElementById('login-success-message');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const verificationErrorMessage = document.getElementById('verification-error-message');
    const verificationSuccessMessage = document.getElementById('verification-success-message');

    // Password requirements elements
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    // Toggle to register form
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Switching to register form');
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
            hideMessages();
        });
    }

    // Toggle to login form
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Switching to login form');
            registerFormContainer.style.display = 'none';
            loginFormContainer.style.display = 'block';
            hideMessages();
        });
    }

    // Password validation
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            checkPassword(this.value);
        });
    }

    function checkPassword(password) {
        // Check each requirement
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Update UI
        if (reqLength) {
            reqLength.className = hasLength ? 'valid' : 'invalid';
        }
        if (reqUppercase) {
            reqUppercase.className = hasUppercase ? 'valid' : 'invalid';
        }
        if (reqLowercase) {
            reqLowercase.className = hasLowercase ? 'valid' : 'invalid';
        }
        if (reqNumber) {
            reqNumber.className = hasNumber ? 'valid' : 'invalid';
        }
        if (reqSpecial) {
            reqSpecial.className = hasSpecial ? 'valid' : 'invalid';
        }

        return hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }

    // LOGIN FORM SUBMIT
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Login form submitted!');
            hideMessages();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            console.log('Login attempt:', { email, passwordLength: password.length });

            if (!email || !password) {
                showError('אנא מלא את כל השדות.', true);
                return;
            }

            // REQUIRES_SERVER_SESSION: Try admin login via server API first
            fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                .then(response => {
                    if (response.ok) {
                        return response.json().then(adminData => {
                            // Store admin session in both storages for compatibility
                            const adminUser = {
                                id: adminData.user.email,
                                name: adminData.user.name,
                                email: adminData.user.email,
                                is_admin: true,
                                loginTime: Date.now()
                            };
                            
                            sessionStorage.setItem('smashlabs_admin_token', adminData.token || '');
                            sessionStorage.setItem('smashlabs_admin_logged_in', 'true');
                            sessionStorage.setItem('smashlabs_current_user', JSON.stringify(adminUser));
                            
                            localStorage.setItem('smashlabs_admin_logged_in', 'true');
                            localStorage.setItem('smashlabs_current_user', JSON.stringify(adminUser));
                            
                            console.log('Admin login successful!', adminUser);
                            showSuccess('התחברת בהצלחה כמנהל! מעביר ללוח הבקרה...', true);
                            
                            setTimeout(() => {
                                window.location.href = 'admin.html';
                            }, 1000);
                        });
                    }
                    // Not admin or endpoint error - fall through to regular user login
                    return proceedWithRegularLogin();
                })
                .catch(error => {
                    console.log('Admin endpoint unavailable:', error.message);
                    // Fall through to regular user login
                    proceedWithRegularLogin();
                });

            async function proceedWithRegularLogin() {
                try {
                    // Use server-side endpoint for secure password verification with bcrypt
                    const response = await fetch('/api/customer/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        // Handle specific error codes
                        if (data.code === 'NOT_VERIFIED') {
                            showError('המייל טרם אומת. אנא בדוק את תיבת המייל שלך.', true);
                            localStorage.setItem('pending_verification_email', email);
                            setTimeout(() => {
                                loginFormContainer.style.display = 'none';
                                verificationFormContainer.style.display = 'block';
                                hideMessages();
                            }, 2000);
                        } else {
                            showError('המייל או הסיסמה שגויים.', true);
                        }
                        return;
                    }
                    
                    // Success - store user data
                    const userWithoutPassword = {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        is_admin: data.user.is_admin || false,
                        loginTime: Date.now()
                    };
                    sessionStorage.setItem('smashlabs_current_user', JSON.stringify(userWithoutPassword));
                    
                    // Check if user is admin - redirect to dashboard
                    if (data.user.is_admin) {
                        showSuccess('התחברת בהצלחה! מעביר ללוח הבקרה...', true);
                        setTimeout(() => {
                            window.location.href = 'admin.html';
                        }, 1500);
                    } else {
                        showSuccess('התחברת בהצלחה! מעביר לעמוד הראשי...', true);
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showError('שגיאה בהתחברות. נסה שוב.', true);
                }
            }
        });
    }

    // REGISTER FORM SUBMIT
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Register form submitted!');
            hideMessages();

            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;

            console.log('Form data:', { name, email, passwordLength: password.length });

            // Validate fields
            if (!name || !email || !password || !confirmPassword) {
                showError('אנא מלא את כל השדות.');
                return;
            }

            // Check password strength
            if (!checkPassword(password)) {
                showError('הסיסמה אינה עומדת בדרישות.');
                return;
            }

            // Check passwords match
            if (password !== confirmPassword) {
                showError('הסיסמאות אינן תואמות.');
                return;
            }

            // Get existing users
            const users = JSON.parse(localStorage.getItem('smashlabs_users') || '[]');

            // Check if email exists
            if (users.some(u => u.email === email)) {
                showError('המייל כבר רשום במערכת.');
                return;
            }

            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const codeExpiry = new Date(Date.now() + (10 * 60 * 1000)).toISOString(); // 10 minutes

            // Create user via server endpoint (password will be hashed with bcrypt)
            showSuccess('יוצר משתמש...');
            
            fetch('/api/customer/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password, // Will be hashed server-side with bcrypt
                    verificationCode: verificationCode,
                    codeExpiry: codeExpiry
                })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    showError(data.error || 'שגיאה ביצירת המשתמש');
                    return;
                }
                
                console.log('User created:', data.user);
                localStorage.setItem('pending_verification_email', email);

            // Send verification email
            showSuccess('שולח קוד אימות למייל...');

            fetch('/api/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        name: name,
                        verificationCode: verificationCode
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Verification email sent successfully');
                        showSuccess('קוד אימות נשלח למייל שלך!');
                        // Show verification form
                        setTimeout(() => {
                            registerFormContainer.style.display = 'none';
                            document.getElementById('verification-form-container').style.display = 'block';
                        }, 1500);
                    } else {
                        showError('שגיאה בשליחת המייל. נסה שוב.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError('שגיאה בשליחת המייל. נסה שוב.');
                });
            })
            .catch(error => {
                console.error('Error creating user:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    stack: error.stack
                });
                
                if (error.message && error.message.includes('duplicate')) {
                    showError('המייל כבר רשום במערכת.');
                } else if (error.message) {
                    showError('שגיאה: ' + error.message);
                } else {
                    showError('שגיאה ביצירת המשתמש. נסה שוב.');
                }
            });
        });
    }

    // Show error message
    function showError(message, isLoginForm = false) {
        console.log('Error:', message);
        const msgElement = isLoginForm ? loginErrorMessage : errorMessage;
        if (msgElement) {
            msgElement.textContent = message;
            msgElement.style.display = 'block';
        }
        // Hide success messages
        if (isLoginForm && loginSuccessMessage) {
            loginSuccessMessage.style.display = 'none';
        } else if (!isLoginForm && successMessage) {
            successMessage.style.display = 'none';
        }
    }

    // Show success message
    function showSuccess(message, isLoginForm = false) {
        console.log('Success:', message);
        const msgElement = isLoginForm ? loginSuccessMessage : successMessage;
        if (msgElement) {
            msgElement.textContent = message;
            msgElement.style.display = 'block';
        }
        // Hide error messages
        if (isLoginForm && loginErrorMessage) {
            loginErrorMessage.style.display = 'none';
        } else if (!isLoginForm && errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    // Hide all messages
    function hideMessages() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        if (successMessage) {
            successMessage.style.display = 'none';
        }
        if (loginErrorMessage) {
            loginErrorMessage.style.display = 'none';
        }
        if (loginSuccessMessage) {
            loginSuccessMessage.style.display = 'none';
        }
        if (verificationErrorMessage) {
            verificationErrorMessage.style.display = 'none';
        }
        if (verificationSuccessMessage) {
            verificationSuccessMessage.style.display = 'none';
        }
    }

    // VERIFICATION FORM SUBMIT
    if (verificationForm) {
        verificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            hideMessages();

            const code = document.getElementById('verification-code').value.trim();
            const pendingEmail = localStorage.getItem('pending_verification_email');

            if (!code || !pendingEmail) {
                showVerificationError('שגיאה בתהליך האימות.');
                return;
            }

            try {
                // Get user from Supabase
                const user = await window.userDB.findByEmail(pendingEmail);

                if (!user) {
                    showVerificationError('משתמש לא נמצא.');
                    return;
                }

                // Check if code expired
                if (Date.now() > user.code_expiry) {
                    showVerificationError('הקוד פג תוקף. אנא בקש קוד חדש.');
                    return;
                }

                // Verify code
                if (user.verification_code !== code) {
                    showVerificationError('קוד שגוי. אנא נסה שוב.');
                    return;
                }

                // Mark user as verified
                await window.userDB.verifyUser(pendingEmail);
                localStorage.removeItem('pending_verification_email');

                showVerificationSuccess('המייל אומת בהצלחה! מעביר לדף התחברות...');

                setTimeout(function() {
                    verificationFormContainer.style.display = 'none';
                    loginFormContainer.style.display = 'block';
                    hideMessages();
                }, 2000);
            } catch (error) {
                console.error('Verification error:', error);
                showVerificationError('שגיאה באימות. נסה שוב.');
            }
        });
    }

    // Resend verification code
    if (resendCodeLink) {
        resendCodeLink.addEventListener('click', function(e) {
            e.preventDefault();
            const pendingEmail = localStorage.getItem('pending_verification_email');

            if (!pendingEmail) {
                showVerificationError('לא נמצא מייל בהמתנה לאימות.');
                return;
            }

            // Get users
            const users = JSON.parse(localStorage.getItem('smashlabs_users') || '[]');
            const userIndex = users.findIndex(u => u.email === pendingEmail);

            if (userIndex === -1) {
                showVerificationError('משתמש לא נמצא.');
                return;
            }

            // Generate new code
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            const newExpiry = Date.now() + (10 * 60 * 1000);

            users[userIndex].verificationCode = newCode;
            users[userIndex].codeExpiry = newExpiry;
            localStorage.setItem('smashlabs_users', JSON.stringify(users));

            // Send new email
            showVerificationSuccess('שולח קוד חדש...');

            fetch('/api/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: pendingEmail,
                        name: users[userIndex].name,
                        verificationCode: newCode
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showVerificationSuccess('קוד חדש נשלח למייל שלך!');
                    } else {
                        showVerificationError('שגיאה בשליחת המייל.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showVerificationError('שגיאה בשליחת המייל.');
                });
        });
    }

    function showVerificationError(message) {
        if (verificationErrorMessage) {
            verificationErrorMessage.textContent = message;
            verificationErrorMessage.style.display = 'block';
        }
        if (verificationSuccessMessage) {
            verificationSuccessMessage.style.display = 'none';
        }
    }

    function showVerificationSuccess(message) {
        if (verificationSuccessMessage) {
            verificationSuccessMessage.textContent = message;
            verificationSuccessMessage.style.display = 'block';
        }
        if (verificationErrorMessage) {
            verificationErrorMessage.style.display = 'none';
        }
    }

    // Show Admin Panel
    function showAdminPanel() {
        if (loginFormContainer) loginFormContainer.style.display = 'none';
        if (registerFormContainer) registerFormContainer.style.display = 'none';
        if (adminPanelContainer) {
            adminPanelContainer.style.display = 'block';
            loadUserList();
        }
    }

    // Load users into admin panel
    function loadUserList() {
        const userListElement = document.getElementById('user-list');
        if (!userListElement) return;

        const users = JSON.parse(localStorage.getItem('smashlabs_users') || '[]');

        if (users.length === 0) {
            userListElement.innerHTML = '<div class="no-users">אין משתמשים רשומים עדיין</div>';
            return;
        }

        userListElement.innerHTML = users.map((user, index) => `
            <div class="user-item" data-index="${index}">
                <div>
                    <div class="user-email">${user.email}</div>
                    <div class="user-date">שם: ${user.name} | נרשם: ${new Date(user.registeredAt).toLocaleDateString('he-IL')}</div>
                </div>
                <button class="delete-user-btn" onclick="deleteUser(${index})">מחק</button>
            </div>
        `).join('');
    }

    // Delete user function - make it global
    window.deleteUser = function(index) {
        if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;

        const users = JSON.parse(localStorage.getItem('smashlabs_users') || '[]');
        users.splice(index, 1);
        localStorage.setItem('smashlabs_users', JSON.stringify(users));
        loadUserList();
    };

    // Admin logout
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            if (adminPanelContainer) adminPanelContainer.style.display = 'none';
            if (loginFormContainer) loginFormContainer.style.display = 'block';
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        });
    }

    console.log('Login.js initialization complete!');
}

// Function to show logout option when user is already logged in
function showAlreadyLoggedIn(user) {
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const verificationFormContainer = document.getElementById('verification-form-container');
    
    // Hide all forms
    if (loginFormContainer) loginFormContainer.style.display = 'none';
    if (registerFormContainer) registerFormContainer.style.display = 'none';
    if (verificationFormContainer) verificationFormContainer.style.display = 'none';
    
    // Create already logged in message
    const container = loginFormContainer || document.querySelector('.container');
    if (container) {
        const loggedInHTML = `
            <div style="text-align: center; padding: 3rem; max-width: 500px; margin: 0 auto;">
                <h2 class="section-title graffiti-text" style="color: #4ade80; margin-bottom: 2rem;">
                    ✅ מחובר בהצלחה
                </h2>
                <div style="background: #222; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">שלום, <strong>${user.name || user.email}</strong>!</p>
                    <p style="color: #888; margin-bottom: 0;">אתה כבר מחובר למערכת</p>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.href='index.html'" class="cta-button" style="background: #ff6b00;">
                        חזרה לדף הבית
                    </button>
                    <button onclick="window.UserAuth.logout()" class="cta-button" style="background: #ef4444;">
                        התנתק
                    </button>
                </div>
            </div>
        `;
        container.innerHTML = loggedInHTML;
        container.style.display = 'block';
    }
}
