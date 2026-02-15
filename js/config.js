/**
 * Client-side Configuration
 * Loads environment variables for browser-side code
 * 
 * NOTE: These values are exposed to the client, so only include public keys
 * Never expose secret keys like STRIPE_SECRET_KEY here!
 */

window.ENV_CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://aquhidjcuxkhkwosfvgf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdWhpZGpjdXhraGt3b3NmdmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODk5MjgsImV4cCI6MjA4NDg2NTkyOH0.qyUyRWFn6cpLL43ZgmLdJwfkq6UfAK_weNdb7Oclnps',
    
    // EmailJS Configuration (for waiver forms)
    EMAILJS_PUBLIC_KEY: 'UNGQBc2Ff0Rb-Gu5U',
    EMAILJS_SERVICE_ID: 'service_gdfmy4r',
    EMAILJS_TEMPLATE_ID: 'template_wqck29a',
    
    // Email recipient
    EMAIL_TO: 'Smashlab.nahariya@gmail.com',
    
    // Stripe Public Key (safe to expose)
    STRIPE_PUBLISHABLE_KEY: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE',
    
    // App URLs
    APP_URL: window.location.origin,
    
    // Feature flags
    ENABLE_EMAIL_VERIFICATION: true,
    ENABLE_STRIPE_PAYMENTS: true
};

// Freeze the config to prevent modifications
Object.freeze(window.ENV_CONFIG);
