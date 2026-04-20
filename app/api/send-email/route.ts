import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { orderId, customerName, customerEmail, customerPhone, items, total, shippingAddress } = await req.json();

    // Validate required fields
    if (!customerEmail || !orderId || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format items for email
    const itemsList = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px;">${item.name}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${(item.price).toFixed(2)}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - MedAI</title>
        <style>
          body { font-family: 'Outfit', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; background-color: #faf9f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,163,129,0.12); }
          .header { background: #0fa381; padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-family: 'DM Serif Display', serif; }
          .content { padding: 30px; }
          .order-id { background: #e6f7f3; padding: 10px 15px; border-radius: 8px; display: inline-block; margin: 10px 0; font-family: monospace; font-weight: bold; color: #0a7860; }
          .section-title { font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #0fa381; border-bottom: 2px solid #e6f7f3; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f0ede7; padding: 12px 8px; text-align: left; font-weight: 600; }
          .total-row { background: #e6f7f3; font-weight: bold; }
          .footer { background: #f0ede7; padding: 20px; text-align: center; font-size: 12px; color: #4a4a6a; }
          .button { display: inline-block; background: #0fa381; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .track-link { color: #0fa381; text-decoration: none; }
        </style>
      </head>
      <body style="margin: 0; padding: 20px;">
        <div class="container">
          <div class="header">
            <h1>✨ MedAI Pharmacy</h1>
            <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">Your health, our priority</p>
          </div>
          
          <div class="content">
            <h2 style="margin-top: 0;">Hello ${customerName}! 👋</h2>
            <p>Thank you for shopping with <strong>MedAI</strong>. Your order has been confirmed and is being processed.</p>
            
            <div style="text-align: center;">
              <span class="order-id">Order #MED-${orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            
            <div class="section-title">📋 Order Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
                <tr class="total-row">
                  <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: bold;">₹${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title">🚚 Delivery Details</div>
            <p><strong>Shipping Address:</strong><br>${shippingAddress}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
            
            <div class="section-title">💊 What's Next?</div>
            <ol style="padding-left: 20px;">
              <li>Your order will be packed within 2 hours</li>
              <li>Medicines will be delivered within 45-90 minutes</li>
              <li>You'll receive an SMS when out for delivery</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" class="button">
                Track Your Order →
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>⚠️ <strong>Medical Disclaimer:</strong> These are OTC suggestions only. Always consult a healthcare professional for serious conditions.</p>
            <p>© 2026 MedAI Pharmacy. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" class="track-link">Privacy Policy</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" class="track-link">Terms of Service</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" class="track-link">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `MedAI Pharmacy <${process.env.RESEND_FROM_EMAIL || 'orders@medai.com'}>`,
      to: [customerEmail],
      subject: `Order Confirmed! #MED-${orderId.slice(0, 8).toUpperCase()}`,
      html: htmlContent,
      replyTo: process.env.RESEND_REPLY_TO || 'support@medai.com',
    });

    if (error) {
      console.error('Email sending error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also send SMS notification (optional)
    if (customerPhone && process.env.TWILIO_ACCOUNT_SID) {
      // Add SMS logic here if you have Twilio
      console.log(`SMS would be sent to ${customerPhone}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      emailId: data?.id 
    });
    
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}