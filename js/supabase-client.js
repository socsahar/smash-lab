/**
 * Supabase Client Configuration
 * Connects to cloud database for user authentication and data storage
 * Uses values from config.js (loaded from environment)
 */

// Get config from window.ENV_CONFIG (loaded by config.js)
const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || 'https://aquhidjcuxkhkwosfvgf.supabase.co';
const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdWhpZGpjdXhraGt3b3NmdmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODk5MjgsImV4cCI6MjA4NDg2NTkyOH0.qyUyRWFn6cpLL43ZgmLdJwfkq6UfAK_weNdb7Oclnps';

// Load Supabase from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
script.onerror = function(e) {
    console.error('❌ Failed to load Supabase from CDN:', e);
};
script.onload = function() {
    console.log('📦 Supabase library loaded from CDN');
    
    if (!window.supabase || !window.supabase.createClient) {
        console.error('❌ Supabase createClient not found!');
        return;
    }
    
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('🔗 Supabase client created');
    
    // Helper functions for user operations
    window.userDB = {
        // Register new user
        async createUser(userData) {
            const { data, error } = await window.supabase
                .from('users')
                .insert([{
                    name: userData.name,
                    email: userData.email,
                    password_hash: userData.passwordHash,
                    verified: userData.verified || false,
                    verification_code: userData.verificationCode,
                    code_expiry: userData.codeExpiry
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Find user by email
        async findByEmail(email) {
            const { data, error } = await window.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return data;
        },

        // Update user
        async updateUser(email, updates) {
            const { data, error } = await window.supabase
                .from('users')
                .update(updates)
                .eq('email', email)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Verify user email
        async verifyUser(email) {
            return await this.updateUser(email, {
                verified: true,
                verification_code: null,
                code_expiry: null
            });
        }
    };

    // Helper functions for order operations
    window.orderDB = {
        // Create new order
        async createOrder(orderData) {
            const { data, error } = await window.supabase
                .from('orders')
                .insert([{
                    name: orderData.name,
                    email: orderData.email,
                    phone: orderData.phone,
                    service: orderData.service || orderData.packageName || 'Not selected',
                    quantity: parseInt(orderData.quantity || orderData.participants || 1),
                    date: orderData.date,
                    time: orderData.time,
                    notes: orderData.notes || '',
                    status: 'pending',
                    user_id: orderData.userId || null,
                    account_created_during_order: orderData.accountCreated || false,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Get all orders (for admin panel)
        async getAllOrders() {
            const { data, error } = await window.supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },

        // Get order by ID
        async getOrder(id) {
            const { data, error } = await window.supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },

        // Update order status
        async updateOrderStatus(id, status) {
            const { data, error } = await window.supabase
                .from('orders')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Save waiver to order and optionally to user account
        async saveWaiverToOrder(orderId, waiverData, signature) {
            const updateData = {
                waiver_data: waiverData,
                waiver_signed_at: new Date().toISOString(),
                waiver_signature: signature,
                waiver_saved: true
            };

            const { data, error } = await window.supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;

            // If order has user_id, save waiver to user account for future use
            if (data.user_id) {
                await window.supabase
                    .from('users')
                    .update({
                        saved_waiver_data: waiverData,
                        saved_waiver_date: new Date().toISOString()
                    })
                    .eq('id', data.user_id);
            }

            return data;
        },

        // Get saved waiver for logged-in user
        async getUserSavedWaiver(userId) {
            const { data, error } = await window.supabase
                .from('users')
                .select('saved_waiver_data, saved_waiver_date')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        }
    };    
    console.log('✅ Supabase client initialized');
    window.dispatchEvent(new Event('supabase-loaded'));
};
document.head.appendChild(script);