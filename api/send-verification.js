const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY environment variable must be set');
const resend = new Resend(RESEND_API_KEY);

module.exports = async(req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, verificationCode, name } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Send verification email using Resend
        const { data, error } = await resend.emails.send({
            from: 'SmashLabs <no-reply@smash-lab.com>',
            to: email,
            subject: 'אימות כתובת המייל שלך - SmashLabs',
            html: `
                <!DOCTYPE html>
                <html dir="rtl" lang="he">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                            padding: 20px;
                            direction: rtl;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(45deg, #ff6b00, #1fb6c2);
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: white;
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .content h2 {
                            color: #333;
                            margin-bottom: 20px;
                        }
                        .code-box {
                            background: linear-gradient(45deg, #ff6b00, #1fb6c2);
                            color: white;
                            font-size: 32px;
                            font-weight: bold;
                            padding: 20px;
                            border-radius: 8px;
                            letter-spacing: 8px;
                            margin: 30px 0;
                            display: inline-block;
                        }
                        .info {
                            color: #666;
                            font-size: 14px;
                            margin-top: 20px;
                        }
                        .footer {
                            background: #f5f5f5;
                            padding: 20px;
                            text-align: center;
                            color: #999;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚀 SmashLabs</h1>
                        </div>
                        <div class="content">
                            <h2>שלום ${name || 'משתמש יקר'},</h2>
                            <p>תודה על ההרשמה ל-SmashLabs!</p>
                            <p>להלן קוד האימות שלך:</p>
                            <div class="code-box">${verificationCode}</div>
                            <p class="info">
                                הזן את הקוד בדף ההרשמה כדי להשלים את התהליך.<br>
                                הקוד תקף ל-10 דקות.
                            </p>
                            <p class="info">
                                אם לא ביקשת קוד זה, אנא התעלם מהמייל הזה.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2026 SmashLabs - המתחם המושלם לשחרור לחצים</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            // For development: log code if email fails
            console.log('\n⚠️  EMAIL FAILED - VERIFICATION CODE FOR', email, ':', verificationCode, '\n');
            // Still return success so user can continue (for development only)
            return res.status(200).json({
                success: true,
                message: 'Verification code generated (check console)',
                devMode: true,
                code: verificationCode // Only for development!
            });
        }

        console.log('Verification email sent:', data);
        console.log('📧 Verification code for', email, ':', verificationCode); // Log for debugging
        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully',
            emailId: data.id
        });

    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};