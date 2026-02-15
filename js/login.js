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

// Wait for bcrypt to load
document.addEventListener('DOMContentLoaded', function() {
    // Check if bcrypt is loaded
    const checkBcrypt = setInterval(() => {
        if (typeof bcrypt !== 'undefined') {
            clearInterval(checkBcrypt);
            if (window.userDB) {
                initializeLogin();
            }
        }
    }, 100);
});

function initializeLogin() {
    // Check if user is already logged in
    const currentUser = window.UserAuth ? window.UserAuth.getCurrentUser() : null;
    if (currentUser) {
        // User is already logged in - show logout option
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
    
    // Hide all messages helper function
    function hideMessages() {
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
        if (loginErrorMessage) loginErrorMessage.style.display = 'none';
        if (loginSuccessMessage) loginSuccessMessage.style.display = 'none';
        if (verificationErrorMessage) verificationErrorMessage.style.display = 'none';
        if (verificationSuccessMessage) verificationSuccessMessage.style.display = 'none';
    }
    
    // Clear any stale login messages from previous session
    hideMessages();

    // Toggle to register form
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
            hideMessages();
        });
    }

    // Toggle to login form
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginFormContainer.style.display = 'block';
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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideMessages();
            
            // Clear any previous error states
            loginForm.classList.remove('error');

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showError('אנא מלא את כל השדות.', true);
                return;
            }

            try {
                showSuccess('מתחבר...', true);
                
                // Check if bcrypt is loaded
                if (typeof bcrypt === 'undefined') {
                    showError('טוען מערכת אבטחה, נסה שוב...', true);
                    setTimeout(() => location.reload(), 1000);
                    return;
                }
                
                // Get user from Supabase
                const user = await window.userDB.findByEmail(email);
                
                if (!user) {
                    showError('המייל או הסיסמה שגויים.', true);
                    return;
                }
                
                // Check if user is verified
                if (!user.verified) {
                    showError('המייל טרם אומת. אנא בדוק את תיבת המייל שלך.', true);
                    localStorage.setItem('pending_verification_email', email);
                    setTimeout(() => {
                        loginFormContainer.style.display = 'none';
                        verificationFormContainer.style.display = 'block';
                        hideMessages();
                    }, 2000);
                    return;
                }
                
                // Verify password using bcrypt
                const isPasswordValid = await bcrypt.compare(password, user.password_hash);
                
                if (!isPasswordValid) {
                    showError('המייל או הסיסמה שגויים.', true);
                    return;
                }
                
                // Success - store user data
                const userWithoutPassword = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    is_admin: user.is_admin || false,
                    loginTime: Date.now()
                };
                
                // Store in both session and local storage
                sessionStorage.setItem('smashlabs_current_user', JSON.stringify(userWithoutPassword));
                localStorage.setItem('smashlabs_current_user', JSON.stringify(userWithoutPassword));
                
                // If admin, also set admin flags
                if (user.is_admin) {
                    sessionStorage.setItem('smashlabs_admin_logged_in', 'true');
                    localStorage.setItem('smashlabs_admin_logged_in', 'true');
                }
                
                // Check if user is admin - redirect to dashboard
                if (user.is_admin) {
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
        });
    }

    // REGISTER FORM SUBMIT
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideMessages();

            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;

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
            const codeExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes in milliseconds

            // Create user directly in Supabase
            showSuccess('יוצר משתמש...');
            
            (async () => {
                try {
                    // Hash password using bcrypt (10 rounds)
                    showSuccess('מצפין סיסמה...');
                    const passwordHash = await bcrypt.hash(password, 10);
                    
                    console.log('Bcrypt hash generated:', passwordHash);
                    // Create user in Supabase
                    const userData = await window.userDB.createUser({
                        name: name,
                        email: email,
                        passwordHash: passwordHash,
                        verified: false,
                        verificationCode: verificationCode,
                        codeExpiry: codeExpiry
                    });
                    
                    localStorage.setItem('pending_verification_email', email);

                    // Send verification email
                    showSuccess('שולח קוד אימות למייל...');

                    const emailResponse = await fetch('/api/send-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: email,
                            name: name,
                            verificationCode: verificationCode
                        })
                    });
                    
                    const emailData = await emailResponse.json();
                    
                    if (emailData.success) {
                        showSuccess('קוד אימות נשלח למייל שלך!');
                        // Show verification form
                        setTimeout(() => {
                            registerFormContainer.style.display = 'none';
                            document.getElementById('verification-form-container').style.display = 'block';
                        }, 1500);
                    } else {
                        showError('שגיאה בשליחת המייל. נסה שוב.');
                    }
                } catch (error) {
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
                }
            })();
        });
    }

    // Show error message
    function showError(message, isLoginForm = false) {
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

                // Check if code expired (code_expiry is stored as timestamp in milliseconds)
                const expiryTime = typeof user.code_expiry === 'string' ? new Date(user.code_expiry).getTime() : user.code_expiry;
                if (Date.now() > expiryTime) {
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
                
                // Auto-login the user
                const userWithoutPassword = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    is_admin: user.is_admin || false,
                    loginTime: Date.now()
                };
                
                // Store in both session and local storage
                sessionStorage.setItem('smashlabs_current_user', JSON.stringify(userWithoutPassword));
                localStorage.setItem('smashlabs_current_user', JSON.stringify(userWithoutPassword));
                
                // Clean up
                localStorage.removeItem('pending_verification_email');

                showVerificationSuccess('המייל אומת בהצלחה! מתחבר אוטומטית...');

                setTimeout(function() {
                    // Redirect based on user type
                    if (user.is_admin) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1500);
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

            // Get user from Supabase
            (async () => {
                try {
                    const user = await window.userDB.findByEmail(pendingEmail);

                    if (!user) {
                        showVerificationError('משתמש לא נמצא.');
                        return;
                    }

                    // Generate new code
                    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                    const newExpiry = Date.now() + (10 * 60 * 1000);

                    // Update user with new code
                    await window.userDB.updateUser(pendingEmail, {
                        verification_code: newCode,
                        code_expiry: newExpiry
                    });

                    // Send new email
                    showVerificationSuccess('שולח קוד חדש...');

                    const response = await fetch('/api/send-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: pendingEmail,
                            name: user.name,
                            verificationCode: newCode
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showVerificationSuccess('קוד חדש נשלח למייל שלך!');
                    } else {
                        showVerificationError('שגיאה בשליחת המייל.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showVerificationError('שגיאה בשליחת המייל.');
                }
            })();
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
