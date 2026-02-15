/**
 * Verifone Checkout API - Create Payment Session
 * Handles creating checkout sessions with Verifone GreenBox API
 */

require('dotenv').config();
const https = require('https');

/**
 * Create Verifone checkout session
 */
async function createCheckout(orderData) {
    const {
        amount,
        currency = 'ILS',
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        description
    } = orderData;

    // Prepare checkout payload according to Verifone Checkout API v2
    const payload = {
        entity_id: process.env.VERIFONE_ENTITY_ID,
        currency_code: currency,
        amount: Math.round(amount * 100), // Convert to agorot (cents) - minor units
        merchant_reference: orderId,
        return_url: (process.env.SUCCESS_URL || 'http://localhost:8000/order-success.html').replace('http://', 'https://'),
        interaction_type: 'IFRAME', // or 'HPP' for hosted page, 'IFRAME' for embedded
        configurations: {
            card: {
                capture_now: true,
                dynamic_descriptor: 'SmashLabs',
                payment_contract_id: process.env.VERIFONE_PAYMENT_CONTRACT_ID,
                credit_term: 'STANDARD' // STANDARD = regular payment, INSTALMENT_STANDARD = installments
            }
        },
        customer_details: {
            entity_id: process.env.VERIFONE_ENTITY_ID,
            email_address: customerEmail,
            phone_number: customerPhone,
            billing: {
                first_name: customerName?.split(' ')[0] || 'Customer',
                last_name: customerName?.split(' ').slice(1).join(' ') || 'Name'
            }
        },
        sales_description: description || 'SmashLabs Booking'
    };

    // Use Basic Auth with user-uid:api-key (as per Verifone documentation)
    const authString = `${process.env.VERIFONE_USER_ID}:${process.env.VERIFONE_API_KEY}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    console.log('🔍 Verifone Checkout Payload:', JSON.stringify(payload, null, 2));

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        
        const options = {
            hostname: new URL(process.env.VERIFONE_HOST).hostname,
            port: 443,
            path: '/oidc/checkout-service/v2/checkout',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': authHeader
            }
        };

        console.log('🔍 Request URL:', `https://${options.hostname}${options.path}`);
        console.log('🔍 Auth Header:', authHeader.substring(0, 20) + '...');

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📥 Verifone Response Status:', res.statusCode);
                console.log('📥 Verifone Response Body:', data);
                
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            success: true,
                            checkoutId: response.id,
                            checkoutUrl: response.url, // URL to the hosted checkout page
                            status: response.status,
                            response: response
                        });
                    } else {
                        reject({
                            success: false,
                            statusCode: res.statusCode,
                            error: response
                        });
                    }
                } catch (e) {
                    reject({
                        success: false,
                        error: 'Failed to parse response',
                        details: data,
                        parseError: e.message
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                success: false,
                error: 'Network error',
                details: error.message
            });
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Get checkout status
 */
async function getCheckoutStatus(checkoutId) {
    const authString = `${process.env.VERIFONE_USER_ID}:${process.env.VERIFONE_API_KEY}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: new URL(process.env.VERIFONE_HOST).hostname,
            port: 443,
            path: `/oidc/checkout-service/v2/checkout/${checkoutId}`,
            method: 'GET',
            headers: {
                'Authorization': authHeader
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            success: true,
                            status: response.status,
                            response: response
                        });
                    } else {
                        reject({
                            success: false,
                            statusCode: res.statusCode,
                            error: response
                        });
                    }
                } catch (e) {
                    reject({
                        success: false,
                        error: 'Failed to parse response',
                        details: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                success: false,
                error: 'Network error',
                details: error.message
            });
        });

        req.end();
    });
}

/**
 * Netlify/Express handler
 */
exports.handler = async (event, context) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Check environment variables
        if (!process.env.VERIFONE_ENTITY_ID || !process.env.VERIFONE_USER_ID || !process.env.VERIFONE_API_KEY) {
            console.error('❌ Missing Verifone environment variables!');
            console.error('VERIFONE_ENTITY_ID:', process.env.VERIFONE_ENTITY_ID ? 'Set' : 'MISSING');
            console.error('VERIFONE_USER_ID:', process.env.VERIFONE_USER_ID ? 'Set' : 'MISSING');
            console.error('VERIFONE_API_KEY:', process.env.VERIFONE_API_KEY ? 'Set' : 'MISSING');
            console.error('VERIFONE_HOST:', process.env.VERIFONE_HOST || 'MISSING');
            console.error('VERIFONE_PAYMENT_CONTRACT_ID:', process.env.VERIFONE_PAYMENT_CONTRACT_ID ? 'Set' : 'MISSING');
            
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Server configuration error - missing Verifone credentials'
                })
            };
        }

        const body = JSON.parse(event.body);
        console.log('📝 Verifone API request:', { action: body.action, amount: body.amount });
        const action = body.action || 'create';

        if (action === 'create') {
            // Create checkout session
            const result = await createCheckout(body);
            
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result)
            };
        } else if (action === 'pay') {
            // Process payment with encrypted card
            // In this simplified version, we just return success
            // The actual payment happens when we created the checkout
            // The frontend will poll for status
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    success: true,
                    message: 'Payment submitted' 
                })
            };
        } else if (action === 'status') {
            // Get checkout status
            const result = await getCheckoutStatus(body.checkoutId);
            
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result)
            };
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Invalid action' })
            };
        }
    } catch (error) {
        console.error('❌ Verifone Checkout Error:', error);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
                details: error.details || error.toString()
            })
        };
    }
};

// Export functions for direct use
module.exports = {
    handler: exports.handler,
    createCheckout,
    getCheckoutStatus
};
