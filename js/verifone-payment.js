/**
 * Verifone Payment Integration
 * Handles credit card payment processing with Verifone.js
 */

(function() {
    'use strict';

    // Verifone configuration - PRODUCTION
    const VERIFONE_CONFIG = {
        entityId: '88537de0-ce98-4659-9944-b8ec39e87b34',
        apiHost: 'https://emea.gsc.verifone.cloud',
        publicKeyAlias: 'K1571'
    };

    class VerifonePayment {
        constructor() {
            this.verifoneInstance = null;
            this.checkoutId = null;
            this.isProcessing = false;
        }

        /**
         * Initialize Verifone.js
         */
        async init() {
            // Wait for Verifone.js to load
            if (typeof verifone === 'undefined') {
                console.error('Verifone.js not loaded');
                return false;
            }

            try {
                // Initialize Verifone instance
                this.verifoneInstance = verifone({
                    entityId: VERIFONE_CONFIG.entityId
                });

                console.log('✅ Verifone.js initialized');
                return true;
            } catch (error) {
                console.error('❌ Error initializing Verifone:', error);
                return false;
            }
        }

        /**
         * Encrypt card data using Verifone.js
         */
        async encryptCard(cardData) {
            if (!this.verifoneInstance) {
                throw new Error('Verifone not initialized');
            }

            try {
                const encrypted = await this.verifoneInstance.encrypt({
                    card_number: cardData.number,
                    cvv: cardData.cvv,
                    expiry_month: cardData.expiryMonth,
                    expiry_year: cardData.expiryYear
                });

                return encrypted;
            } catch (error) {
                console.error('❌ Card encryption error:', error);
                throw new Error('Failed to encrypt card data');
            }
        }

        /**
         * Create checkout session on backend
         */
        async createCheckoutSession(orderData) {
            try {
                const response = await fetch('/api/verifone-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'create',
                        amount: orderData.amount,
                        currency: 'ILS',
                        orderId: orderData.orderId,
                        customerName: orderData.customerName,
                        customerEmail: orderData.customerEmail,
                        customerPhone: orderData.customerPhone,
                        description: orderData.description,
                        lineItems: orderData.lineItems
                    })
                });

                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create checkout session');
                }

                this.checkoutId = result.checkoutId;
                return result;

            } catch (error) {
                console.error('❌ Checkout session creation error:', error);
                throw error;
            }
        }

        /**
         * Process payment with checkout (hosted payment page)
         * @param {Object} cardData - Not used (Verifone handles card input)
         * @param {Object} orderData - Order details
         * @param {HTMLElement} [inlineContainer] - If provided, render inline instead of modal
         */
        async processPayment(cardData, orderData, inlineContainer) {
            if (this.isProcessing) {
                throw new Error('Payment already in progress');
            }

            this.isProcessing = true;

            try {
                // Step 1: Create checkout session
                console.log('📝 Creating checkout session...');
                const checkoutResult = await this.createCheckoutSession(orderData);
                
                if (!checkoutResult.success) {
                    throw new Error('Failed to create checkout session');
                }

                console.log('✅ Checkout session created:', checkoutResult.checkoutId);
                console.log('🔗 Checkout URL:', checkoutResult.checkoutUrl);

                // Step 2: Load the checkout
                const checkoutUrl = checkoutResult.checkoutUrl || checkoutResult.response.url;
                
                if (inlineContainer) {
                    // Inline mode: render directly into the provided container
                    this.loadCheckoutInline(checkoutUrl, checkoutResult.checkoutId, inlineContainer);
                } else {
                    // Modal mode: open overlay
                    this.loadCheckoutIframe(checkoutUrl, checkoutResult.checkoutId);
                }

                return {
                    success: true,
                    checkoutId: checkoutResult.checkoutId,
                    loading: true
                };

            } catch (error) {
                this.isProcessing = false;
                console.error('❌ Payment processing error:', error);
                throw error;
            }
        }

        /**
         * Load Verifone checkout inline (embedded on the page, no modal)
         */
        loadCheckoutInline(checkoutUrl, checkoutId, container) {
            // Clear the container
            container.innerHTML = '';

            // Add styles for the inline checkout
            if (!document.getElementById('verifone-inline-styles')) {
                const style = document.createElement('style');
                style.id = 'verifone-inline-styles';
                style.textContent = `
                    @keyframes vf-spin { to { transform: rotate(360deg); } }
                    #verifone-inline-checkout iframe {
                        width: 100% !important;
                        height: 100% !important;
                        min-height: 450px;
                        border: none !important;
                        display: block;
                    }
                    #verifone-inline-checkout > div {
                        width: 100% !important;
                        height: 100% !important;
                    }
                `;
                document.head.appendChild(style);
            }

            // Loading indicator
            const loading = document.createElement('div');
            loading.id = 'verifone-inline-loading';
            loading.style.cssText = 'text-align: center; padding: 3rem 1rem; color: #333;';
            loading.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 1rem;">🔒</div>
                <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">טוען טופס תשלום מאובטח...</p>
                <p style="font-size: 0.9rem; color: #666;">Powered by Verifone</p>
                <div style="margin-top: 1rem;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #ff6b00; border-radius: 50%; animation: vf-spin 0.8s linear infinite; margin: 0 auto;"></div>
                </div>
            `;
            container.appendChild(loading);

            // Create inner container for Verifone script
            const checkoutDiv = document.createElement('div');
            checkoutDiv.id = 'verifone-checkout';
            checkoutDiv.style.cssText = 'width: 100%; min-height: 450px; position: relative;';
            container.appendChild(checkoutDiv);

            // Load the Verifone loader.js
            const script = document.createElement('script');
            script.src = checkoutUrl;
            script.async = true;

            script.onload = () => {
                console.log('✅ Verifone loader.js loaded inline');
                const loadingEl = document.getElementById('verifone-inline-loading');
                if (loadingEl) loadingEl.style.display = 'none';
            };

            script.onerror = () => {
                console.error('❌ Failed to load Verifone checkout script');
                const loadingEl = document.getElementById('verifone-inline-loading');
                if (loadingEl) {
                    loadingEl.innerHTML = `
                        <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                        <p style="font-size: 1.1rem; font-weight: bold; color: #d32f2f;">שגיאה בטעינת טופס התשלום</p>
                        <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">אנא נסה שוב מאוחר יותר</p>
                    `;
                }
                this.isProcessing = false;
                // Re-enable pay button
                const payBtn = document.getElementById('pay-button');
                if (payBtn) {
                    payBtn.textContent = 'המשך לתשלום';
                    payBtn.disabled = false;
                    payBtn.style.display = '';
                }
            };

            checkoutDiv.appendChild(script);

            // Listen for postMessage events from Verifone
            this._messageHandler = (event) => {
                console.log('📨 Received postMessage:', event.data);
                const data = event.data;
                if (!data) return;

                const isCompleted = 
                    (data.event === 'CHECKOUT_COMPLETED') ||
                    (data.event === 'checkout_completed') ||
                    (data.type === 'CHECKOUT_COMPLETED') ||
                    (data.status === 'COMPLETED') ||
                    (data.event === 'payment_completed') ||
                    (data.event === 'PAYMENT_SUCCESS') ||
                    (typeof data === 'string' && data.includes('COMPLETED'));

                const isFailed =
                    (data.event === 'CHECKOUT_FAILED') ||
                    (data.event === 'checkout_failed') ||
                    (data.event === 'PAYMENT_FAILED') ||
                    (data.status === 'FAILED');

                const isCancelled =
                    (data.event === 'CHECKOUT_CANCELLED') ||
                    (data.event === 'checkout_cancelled');

                if (isCompleted) {
                    console.log('✅ Payment completed via Verifone!');
                    window.removeEventListener('message', this._messageHandler);
                    this.isProcessing = false;
                    window.location.href = '/order-success.html?checkoutId=' + checkoutId;
                } else if (isFailed) {
                    console.error('❌ Payment failed:', data);
                    window.removeEventListener('message', this._messageHandler);
                    this.isProcessing = false;
                    container.innerHTML = '';
                    container.style.display = 'none';

                    if (window.customModal) {
                        window.customModal.error('התשלום נכשל. אנא נסה שוב.', 'שגיאה בתשלום');
                    } else {
                        alert('התשלום נכשל. אנא נסה שוב.');
                    }

                    const payBtn = document.getElementById('pay-button');
                    if (payBtn) {
                        payBtn.textContent = 'המשך לתשלום';
                        payBtn.disabled = false;
                        payBtn.style.display = '';
                    }
                } else if (isCancelled) {
                    console.log('⚠️ Payment cancelled by user');
                    window.removeEventListener('message', this._messageHandler);
                    this.isProcessing = false;
                    container.innerHTML = '';
                    container.style.display = 'none';

                    const payBtn = document.getElementById('pay-button');
                    if (payBtn) {
                        payBtn.textContent = 'המשך לתשלום';
                        payBtn.disabled = false;
                        payBtn.style.display = '';
                    }
                }
            };

            window.addEventListener('message', this._messageHandler);
            console.log('📺 Verifone checkout loading inline...');
        }

        /**
         * Load Verifone checkout using the loader.js script (modal overlay mode)
         * The URL from Verifone is a JS loader, not an HTML page
         */
        loadCheckoutIframe(checkoutUrl, checkoutId) {
            // Create overlay container
            const overlay = document.createElement('div');
            overlay.id = 'verifone-checkout-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Create wrapper for the checkout widget
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                background: white;
                border-radius: 12px;
                width: 95%;
                max-width: 550px;
                min-height: 500px;
                height: 80vh;
                max-height: 700px;
                position: relative;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                padding: 0;
            `;

            // Create close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.setAttribute('aria-label', 'סגור חלון תשלום');
            closeBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #ccc;
                font-size: 16px;
                cursor: pointer;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            `;
            closeBtn.onmouseover = () => closeBtn.style.background = '#e0e0e0';
            closeBtn.onmouseout = () => closeBtn.style.background = '#f5f5f5';
            closeBtn.onclick = () => {
                overlay.remove();
                this.isProcessing = false;
                // Re-enable pay button
                const payBtn = document.querySelector('#payment-form button[type="submit"]');
                if (payBtn) {
                    payBtn.textContent = 'המשך לתשלום';
                    payBtn.disabled = false;
                }
            };

            // Create loading indicator
            const loading = document.createElement('div');
            loading.id = 'verifone-loading';
            loading.style.cssText = `
                text-align: center;
                padding: 3rem 1rem;
                color: #333;
            `;
            loading.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 1rem;">🔒</div>
                <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">טוען טופס תשלום מאובטח...</p>
                <p style="font-size: 0.9rem; color: #666;">Powered by Verifone</p>
                <div style="margin-top: 1rem;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #ff6b00; border-radius: 50%; animation: vf-spin 0.8s linear infinite; margin: 0 auto;"></div>
                </div>
            `;

            // Add spin animation and iframe sizing styles
            const style = document.createElement('style');
            style.textContent = `
                @keyframes vf-spin { to { transform: rotate(360deg); } }
                #verifone-checkout iframe {
                    width: 100% !important;
                    height: 100% !important;
                    min-height: 450px;
                    border: none !important;
                    display: block;
                }
                #verifone-checkout > div {
                    width: 100% !important;
                    height: 100% !important;
                }
            `;
            document.head.appendChild(style);

            // Create the container where Verifone will render its form
            const checkoutContainer = document.createElement('div');
            checkoutContainer.id = 'verifone-checkout';
            checkoutContainer.style.cssText = `
                flex: 1;
                width: 100%;
                min-height: 0;
                overflow: hidden;
                position: relative;
            `;

            // Assemble elements
            wrapper.appendChild(closeBtn);
            wrapper.appendChild(loading);
            wrapper.appendChild(checkoutContainer);
            overlay.appendChild(wrapper);
            document.body.appendChild(overlay);

            // Load the Verifone loader.js as a script tag
            const script = document.createElement('script');
            script.src = checkoutUrl;
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Verifone loader.js loaded successfully');
                // Hide loading indicator once the script loads
                const loadingEl = document.getElementById('verifone-loading');
                if (loadingEl) loadingEl.style.display = 'none';
            };

            script.onerror = () => {
                console.error('❌ Failed to load Verifone checkout script');
                const loadingEl = document.getElementById('verifone-loading');
                if (loadingEl) {
                    loadingEl.innerHTML = `
                        <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                        <p style="font-size: 1.1rem; font-weight: bold; color: #d32f2f;">שגיאה בטעינת טופס התשלום</p>
                        <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">אנא נסה שוב מאוחר יותר</p>
                        <button onclick="document.getElementById('verifone-checkout-overlay').remove()" 
                                style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #ff6b00; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                            סגור
                        </button>
                    `;
                }
                this.isProcessing = false;
            };

            // Append the script to the checkout container
            checkoutContainer.appendChild(script);

            // Listen for messages from the Verifone checkout
            this._messageHandler = (event) => {
                console.log('📨 Received postMessage:', event.data);
                
                // Verifone sends various events through postMessage
                const data = event.data;
                
                if (!data) return;
                
                // Check for completion events (Verifone may use different event names)
                const isCompleted = 
                    (data.event === 'CHECKOUT_COMPLETED') ||
                    (data.event === 'checkout_completed') ||
                    (data.type === 'CHECKOUT_COMPLETED') ||
                    (data.status === 'COMPLETED') ||
                    (data.event === 'payment_completed') ||
                    (data.event === 'PAYMENT_SUCCESS') ||
                    (typeof data === 'string' && data.includes('COMPLETED'));
                
                const isFailed =
                    (data.event === 'CHECKOUT_FAILED') ||
                    (data.event === 'checkout_failed') ||
                    (data.event === 'PAYMENT_FAILED') ||
                    (data.status === 'FAILED');
                
                const isCancelled =
                    (data.event === 'CHECKOUT_CANCELLED') ||
                    (data.event === 'checkout_cancelled');

                if (isCompleted) {
                    console.log('✅ Payment completed via Verifone!');
                    overlay.remove();
                    window.removeEventListener('message', this._messageHandler);
                    this.isProcessing = false;
                    
                    // Redirect to success page
                    window.location.href = '/order-success.html?checkoutId=' + checkoutId;
                } else if (isFailed) {
                    console.error('❌ Payment failed:', data);
                    overlay.remove();
                    window.removeEventListener('message', this._messageHandler);
                    this.isProcessing = false;
                    
                    if (window.customModal) {
                        window.customModal.error('התשלום נכשל. אנא נסה שוב.', 'שגיאה בתשלום');
                    } else {
                        alert('התשלום נכשל. אנא נסה שוב.');
                    }
                    
                    // Re-enable pay button
                    const payBtn = document.querySelector('#payment-form button[type="submit"]');
                    if (payBtn) {
                        payBtn.textContent = 'המשך לתשלום';
                        payBtn.disabled = false;
                    }
                } else if (isCancelled) {
                    console.log('⚠️ Payment cancelled by user');
                    overlay.remove();
                    window.removeEventListener('message', this._messageHandler);
                    this.isProcessing = false;
                    
                    const payBtn = document.querySelector('#payment-form button[type="submit"]');
                    if (payBtn) {
                        payBtn.textContent = 'המשך לתשלום';
                        payBtn.disabled = false;
                    }
                }
            };

            window.addEventListener('message', this._messageHandler);

            // Also check for redirect-based completion (return_url)
            // Verifone redirects to return_url after payment - the success page handles this
            
            console.log('📺 Verifone checkout widget loading...');
        }

        /**
         * Check payment status
         */
        async checkPaymentStatus(checkoutId) {
            try {
                const response = await fetch('/api/verifone-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'status',
                        checkoutId: checkoutId
                    })
                });

                const result = await response.json();
                return result;

            } catch (error) {
                console.error('❌ Status check error:', error);
                throw error;
            }
        }

        /**
         * Save booking to Supabase after successful payment
         */
        async saveBookingToDatabase(orderData, paymentResult) {
            try {
                // Initialize Supabase
                const supabaseUrl = 'https://aquhidjcuxkhkwosfvgf.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdWhpZGpjdXhraGt3b3NmdmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODk5MjgsImV4cCI6MjA4NDg2NTkyOH0.qyUyRWFn6cpLL43ZgmLdJwfkq6UfAK_weNdb7Oclnps';
                
                const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

                // Prepare booking data
                const bookingData = {
                    package_id: orderData.packageId || orderData.service,
                    package_name: orderData.packageName || orderData.serviceName,
                    customer_name: orderData.customerName,
                    customer_email: orderData.customerEmail,
                    customer_phone: orderData.customerPhone,
                    booking_date: orderData.date,
                    booking_time: orderData.time,
                    booking_datetime: new Date(`${orderData.date}T${orderData.time}`).toISOString(),
                    duration_minutes: orderData.duration || 60,
                    end_datetime: new Date(new Date(`${orderData.date}T${orderData.time}`).getTime() + (orderData.duration || 60) * 60000).toISOString(),
                    order_id: orderData.orderId,
                    status: 'confirmed',
                    price: orderData.amount,
                    payment_status: 'paid',
                    payment_method: 'credit_card',
                    payment_transaction_id: paymentResult.transactionId,
                    payment_date: new Date().toISOString()
                };

                // Insert booking
                const { data, error } = await supabase
                    .from('bookings')
                    .insert([bookingData])
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Error saving booking:', error);
                    throw error;
                }

                console.log('✅ Booking saved to database:', data);
                return data;

            } catch (error) {
                console.error('❌ Database save error:', error);
                throw error;
            }
        }
    }

    // Expose globally
    window.VerifonePayment = VerifonePayment;

    // Auto-initialize
    document.addEventListener('DOMContentLoaded', function() {
        window.verifonePayment = new VerifonePayment();
    });

})();
