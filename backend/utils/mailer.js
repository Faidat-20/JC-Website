const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────
// SEND CUSTOMER ORDER CONFIRMATION EMAIL
// ─────────────────────────────────────────
async function sendOrderConfirmationEmail(order) {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join("");

  const mailOptions = {
    from: `"Jikes Cosmetics" <${process.env.EMAIL_USER}>`,
    to: order.deliveryDetails.email,
    subject: `Order Confirmed — ${order.trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        
        <div style="background: #e08c3a; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your order is confirmed!</h2>
          <p>Hi ${order.deliveryDetails.firstName}, thank you for your order. We will process it shortly.</p>

          <div style="background: #fff8f0; border: 1.5px dashed #e08c3a; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Your tracking ID</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #e08c3a;">${order.trackingId}</p>
          </div>

          <h3>Delivery details</h3>
          <p style="margin: 4px 0;">${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}</p>
          <p style="margin: 4px 0;">${order.deliveryDetails.phone}</p>
          <p style="margin: 4px 0;">${order.deliveryDetails.address}, ${order.deliveryDetails.city}, ${order.deliveryDetails.state}</p>

          <h3 style="margin-top: 24px;">Shipping option</h3>
          <p style="margin: 4px 0;">${order.shippingOption ? order.shippingOption.name : "Not specified"}</p>

          <h3 style="margin-top: 24px;">Items ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="margin-top: 16px; border-top: 2px solid #eee; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Subtotal</span>
              <span>₦${order.subtotal ? order.subtotal.toLocaleString() : order.total.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Shipping</span>
              <span>₦${order.shippingFee.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
              <span>Total</span>
              <span>₦${order.total.toLocaleString()}</span>
            </div>
          </div>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            If you have any questions, reply to this email or contact us on Instagram.
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © 2026 Jikes Cosmetics. All rights reserved.
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Customer confirmation email sent to ${order.deliveryDetails.email} ✅`);
}

// ─────────────────────────────────────────
// SEND OWNER NEW ORDER ALERT EMAIL
// ─────────────────────────────────────────
async function sendOwnerNotificationEmail(order) {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join("");

  const mailOptions = {
    from: `"Jikes Cosmetics Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New Order Received — ${order.trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

        <div style="background: #333; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Order Alert</h1>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #e08c3a;">Order ${order.trackingId}</h2>
          <p>A new order has been placed and payment confirmed.</p>

          <h3>Customer details</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${order.deliveryDetails.phone}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${order.deliveryDetails.email}</p>
          <p style="margin: 4px 0;"><strong>Address:</strong> ${order.deliveryDetails.address}, ${order.deliveryDetails.city}, ${order.deliveryDetails.state}</p>

          <h3 style="margin-top: 24px;">Shipping option</h3>
          <p style="margin: 4px 0;">${order.shippingOption ? order.shippingOption.name : "Not specified"}</p>

          <h3 style="margin-top: 24px;">Items ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="margin-top: 16px; border-top: 2px solid #eee; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
              <span>Total received</span>
              <span>₦${order.total.toLocaleString()}</span>
            </div>
          </div>

          <div style="margin-top: 24px; background: #fff8f0; border-left: 4px solid #e08c3a; padding: 12px;">
            <p style="margin: 0; font-weight: bold;">Action required</p>
            <p style="margin: 4px 0; font-size: 13px;">Log in to your admin dashboard to process this order.</p>
          </div>
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Owner notification email sent ✅`);
}

// ─────────────────────────────────────────
// SEND SHIPPED NOTIFICATION EMAIL TO CUSTOMER
// ─────────────────────────────────────────
async function sendShippedNotificationEmail(order) {
  const mailOptions = {
    from: `"Jikes Cosmetics" <${process.env.EMAIL_USER}>`,
    to: order.deliveryDetails.email,
    subject: `Your order has been shipped — ${order.trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        
        <div style="background: #e08c3a; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your order is on its way!</h2>
          <p>Hi ${order.deliveryDetails.firstName}, great news — your order has been shipped and is on its way to you.</p>

          <div style="background: #fff8f0; border: 1.5px dashed #e08c3a; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Your tracking ID</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #e08c3a;">${order.trackingId}</p>
          </div>

          <h3>Delivery details</h3>
          <p style="margin: 4px 0;">${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}</p>
          <p style="margin: 4px 0;">${order.deliveryDetails.phone}</p>
          <p style="margin: 4px 0;">${order.deliveryDetails.address}, ${order.deliveryDetails.city}, ${order.deliveryDetails.state}</p>

          <h3 style="margin-top: 24px;">Shipping option</h3>
          <p style="margin: 4px 0;">${order.shippingOption ? order.shippingOption.name : "Not specified"}</p>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            If you have any questions, reply to this email or contact us on Instagram.
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © 2026 Jikes Cosmetics. All rights reserved.
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Shipped notification email sent to ${order.deliveryDetails.email} ✅`);
}

module.exports = { sendOrderConfirmationEmail, sendOwnerNotificationEmail, sendShippedNotificationEmail  };