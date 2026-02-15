/**
 * Verifone Webhook Handler
 * Receives payment confirmation callbacks from Verifone
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * Process webhook notification
 */
async function processWebhook(webhookData) {
    console.log('📩 Received Verifone webhook:', JSON.stringify(webhookData, null, 2));

    const {
        id: checkoutId,
        status,
        merchant_order_id: orderId,
        amount,
        currency,
        customer,
        payment_method
    } = webhookData;

    // Only process successful payments
    if (status !== 'COMPLETED' && status !== 'AUTHORIZED') {
        console.log(`⚠️ Ignoring webhook with status: ${status}`);
        return {
            success: true,
            message: 'Webhook received but not processed (status not completed)'
        };
    }

    try {
        // Find the booking by order_id
        const { data: existingBooking, error: findError } = await supabase
            .from('bookings')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (findError || !existingBooking) {
            console.error('❌ Booking not found for order:', orderId);
            return {
                success: false,
                error: 'Booking not found'
            };
        }

        // Update booking with payment information
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_status: 'paid',
                payment_method: 'credit_card',
                payment_transaction_id: checkoutId,
                payment_date: new Date().toISOString(),
                price: amount / 100, // Convert from agorot to shekels
                status: 'confirmed'
            })
            .eq('id', existingBooking.id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error updating booking:', updateError);
            return {
                success: false,
                error: 'Failed to update booking',
                details: updateError
            };
        }

        console.log('✅ Booking updated successfully:', updatedBooking);

        // TODO: Send confirmation email to customer
        // You can add email sending logic here using Resend

        return {
            success: true,
            message: 'Payment processed successfully',
            bookingId: updatedBooking.id
        };

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Netlify/Express handler
 */
exports.handler = async (event, context) => {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const webhookData = JSON.parse(event.body);
        
        // Process the webhook
        const result = await processWebhook(webhookData);

        return {
            statusCode: result.success ? 200 : 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

module.exports = {
    handler: exports.handler,
    processWebhook
};
