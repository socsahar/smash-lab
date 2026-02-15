// Stripe Checkout Session Creation API
// This is a serverless function for Netlify/Vercel or Node.js Express route

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
    apiVersion: '2024-06-20' 
});

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { priceId, quantity = 1, successUrl, cancelUrl, customerEmail } = req.body;

        // Validate required fields
        if (!priceId) {
            return res.status(400).json({ error: 'Price ID is required' });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price: priceId,
                    quantity: parseInt(quantity)
                }
            ],
            success_url: successUrl || `${req.headers.origin}/order-success.html`,
            cancel_url: cancelUrl || `${req.headers.origin}/order.html`,
            customer_email: customerEmail || undefined,
            automatic_tax: { enabled: true },
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['IL', 'US', 'GB'] // Adjust based on your service areas
            },
            metadata: {
                source: 'smashlabs_website'
            }
        });

        return res.status(200).json({ 
            url: session.url,
            sessionId: session.id 
        });

    } catch (error) {
        console.error('Stripe error:', error);
        return res.status(500).json({ 
            error: 'Failed to create checkout session',
            message: error.message 
        });
    }
}

// For Express.js usage (alternative to serverless):
/*
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    // Use the same handler logic above
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
*/
