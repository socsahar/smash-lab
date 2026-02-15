/**
 * Verifone Payment Integration
 * Handles credit card payment processing with Verifone.js
 */

(function() {
    'use strict';

    // Verifone configuration
    const VERIFONE_CONFIG = {
        entityId: '48a6cbc3-31f0-45f6-a5fd-5df65d848e51',
        apiHost: 'https://cst.test-gsc.vfims.com',
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
                        description: orderData.description
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
         * Process payment with checkout (hosted payment page in iframe)
         */
        async processPayment(cardData, orderData) {
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

                // Step 2: Load the checkout in an iframe
                const checkoutUrl = checkoutResult.checkoutUrl || checkoutResult.response.url;
                this.loadCheckoutIframe(checkoutUrl, checkoutResult.checkoutId);

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
         * Load Verifone checkout in an iframe
         */
        loadCheckoutIframe(checkoutUrl, checkoutId) {
            // Create iframe container
            const container = document.createElement('div');
            container.id = 'verifone-checkout-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Create iframe wrapper
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                background: white;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                height: 80%;
                max-height: 700px;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;

            // Create close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: -15px;
                right: -15px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: white;
                border: 2px solid #333;
                font-size: 20px;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            `;
            closeBtn.onclick = () => {
                container.remove();
                this.isProcessing = false;
            };

            // Create iframe
            const iframe = document.createElement('iframe');
            iframe.id = 'verifone-checkout-iframe';
            iframe.src = checkoutUrl;
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 8px;
            `;

            // Assemble elements
            wrapper.appendChild(closeBtn);
            wrapper.appendChild(iframe);
            container.appendChild(wrapper);
            document.body.appendChild(container);

            // Listen for messages from the iframe
            window.addEventListener('message', (event) => {
                if (event.data && event.data.event === 'CHECKOUT_COMPLETED') {
                    console.log('✅ Payment completed!');
                    container.remove();
                    this.isProcessing = false;
                    
                    // Redirect to success page
                    window.location.href = '/order-success.html?checkoutId=' + checkoutId;
                }
            });

            console.log('📺 Checkout iframe loaded');
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
