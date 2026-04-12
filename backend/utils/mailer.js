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
        
        <div style="background: hsl(357, 45%, 69%); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your order is confirmed!</h2>
          <p>Hi ${order.deliveryDetails.firstName}, thank you for your order. We will process it shortly.</p>

          <div style="background: #fff8f0; border: 1.5px dashed hsl(357, 45%, 69%); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Your tracking ID</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: hsl(357, 45%, 69%);">${order.trackingId}</p>
          </div>

          <h3>Delivery details</h3>
          <p style="margin: 4px 0;">${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}</p>
          <p style="margin: 4px 0;">${order.deliveryDetails.phone}</p>
          <p style="margin: 4px 0;">${[order.deliveryDetails.address, order.deliveryDetails.city, order.deliveryDetails.state].filter(part => part && part.trim() !== "").join(", ")}</p>

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
            If you have any questions, contact us:<br>
            <strong>Phone:</strong> ${process.env.CONTACT_PHONE || "09040472851"}<br>
            <strong>WhatsApp:</strong> <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "2349040472851"}" style="color: hsl(357, 45%, 69%);">Click here to chat</a>
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
          <h2 style="color: hsl(357, 45%, 69%);">Order ${order.trackingId}</h2>
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

          <div style="margin-top: 24px; background: #fff8f0; border-left: 4px solid hsl(357, 45%, 69%); padding: 12px;">
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
        
        <div style="background: hsl(357, 45%, 69%); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your order is on its way!</h2>
          <p>Hi ${order.deliveryDetails.firstName}, great news — your order has been shipped and is on its way to you.</p>

          <div style="background: #fff8f0; border: 1.5px dashed hsl(357, 45%, 69%); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Your tracking ID</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: hsl(357, 45%, 69%);">${order.trackingId}</p>
          </div>

          <h3>Delivery details</h3>
          <p style="margin: 4px 0;">${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}</p>
          <p style="margin: 4px 0;">${order.deliveryDetails.phone}</p>
          <p style="margin: 4px 0;">${[order.deliveryDetails.address, order.deliveryDetails.city, order.deliveryDetails.state].filter(part => part && part.trim() !== "").join(", ")}</p>

          <h3 style="margin-top: 24px;">Shipping option</h3>
          <p style="margin: 4px 0;">${order.shippingOption ? order.shippingOption.name : "Not specified"}</p>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            If you have any questions, contact us:<br>
            <strong>Phone:</strong> ${process.env.CONTACT_PHONE || "09040472851"}<br>
            <strong>WhatsApp:</strong> <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "2349040472851"}" style="color: hsl(357, 45%, 69%);">Click here to chat</a>
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
// ─────────────────────────────────────────
// SEND CANCELLATION + REFUND EMAIL TO CUSTOMER
// ─────────────────────────────────────────
async function sendCancellationEmail(order) {
  const mailOptions = {
    from: `"Jikes Cosmetics" <${process.env.EMAIL_USER}>`,
    to: order.deliveryDetails.email,
    subject: `Your order has been cancelled — ${order.trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

        <div style="background: hsl(357, 45%, 69%); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your order has been cancelled</h2>
          <p>Hi ${order.deliveryDetails.firstName}, we are sorry to inform you that your order has been cancelled.</p>

          <div style="background: #fff8f0; border: 1.5px dashed hsl(357, 45%, 69%); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Order tracking ID</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: hsl(357, 45%, 69%);">${order.trackingId}</p>
          </div>

          ${order.paymentStatus === "paid" ? `
            <div style="background: #fce8e8; border-left: 4px solid #c0392b; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #c0392b;">Refund information</p>
              <p style="margin: 0; font-size: 13px; color: #555;">A refund of <strong>₦${order.total.toLocaleString()}</strong> has been initiated automatically to your original payment method. Refunds typically take 5-10 business days to appear. If you have any questions please contact us:</p>
              <p style="margin: 10px 0 0; font-size: 13px;">
                <strong>Email:</strong> ${process.env.EMAIL_USER}<br>
                <strong>Phone:</strong> ${process.env.CONTACT_PHONE || "09040472851"}<br>
                <strong>WhatsApp:</strong> <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "2349040472851"}" style="color: #e08c3a;">Click here to chat</a>
              </p>
            </div>
          ` : ""}

          <h3 style="margin-top: 24px;">Order details</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}</p>
          <p style="margin: 4px 0;"><strong>Total paid:</strong> ₦${order.total.toLocaleString()}</p>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            We apologise for any inconvenience. Please contact us if you have any questions.
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © 2026 Jikes Cosmetics. All rights reserved.
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Cancellation email sent to ${order.deliveryDetails.email} ✅`);
}

// ─────────────────────────────────────────
// SEND REFUND PROCESSED EMAIL TO CUSTOMER
// ─────────────────────────────────────────
async function sendRefundProcessedEmail(order) {
  const mailOptions = {
    from: `"Jikes Cosmetics" <${process.env.EMAIL_USER}>`,
    to: order.deliveryDetails.email,
    subject: `Your refund has been processed — ${order.trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

        <div style="background: #4CAF50; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your refund has been processed</h2>
          <p>Hi ${order.deliveryDetails.firstName}, great news — your refund has been successfully processed and is on its way back to your account.</p>

          <div style="background: #e6f4ea; border: 1.5px dashed #4CAF50; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Refund amount</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #4CAF50;">₦${order.total.toLocaleString()}</p>
          </div>

          <p style="font-size: 13px; color: #555;">The refund should appear in your account within 1-3 business days depending on your bank.</p>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            If you have any questions, reply to this email or contact us on WhatsApp.
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © 2026 Jikes Cosmetics. All rights reserved.
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Refund processed email sent to ${order.deliveryDetails.email} ✅`);
}

// ─────────────────────────────────────────
// SEND ORDER DELIVERED EMAIL TO CUSTOMER
// ─────────────────────────────────────────
async function sendDeliveredEmail(order) {
  const mailOptions = {
    from: `"Jikes Cosmetics" <${process.env.EMAIL_USER}>`,
    to: order.deliveryDetails.email,
    subject: `Your order has been delivered — ${order.trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

        <div style="background: hsl(357, 45%, 69%); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Your order has been delivered! 🎉</h2>
          <p>Hi ${order.deliveryDetails.firstName}, your order has been marked as delivered. We hope you love your products!</p>

          <div style="background: #e6f4ea; border: 1.5px dashed #4CAF50; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 13px;">Order tracking ID</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #4CAF50;">${order.trackingId}</p>
          </div>

          <p style="font-size: 13px; color: #555;">We would love to hear your feedback! Visit your order tracking page to rate your products.</p>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            If you have any questions, contact us:<br>
            <strong>Email:</strong> ${process.env.EMAIL_USER}<br>
            <strong>Phone:</strong> ${process.env.CONTACT_PHONE || "09040472851"}<br>
            <strong>WhatsApp:</strong> <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "2349040472851"}" style="color: hsl(357, 45%, 69%);">Click here to chat</a>
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © 2026 Jikes Cosmetics. All rights reserved.
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Delivered email sent to ${order.deliveryDetails.email} ✅`);
}

// ─────────────────────────────────────────
// SEND WELCOME / SUBSCRIPTION EMAIL
// ─────────────────────────────────────────
async function sendWelcomeEmail(email, username) {
  const mailOptions = {
    from: `"Jikes Cosmetics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome to Jikes Cosmetics! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

        <div style="background: hsl(357, 45%, 69%); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Jikes Cosmetics</h1>
        </div>

        <div style="padding: 24px;">
          <h2>Welcome, ${username || "there"}! 🎉</h2>
          <p>Thank you for subscribing to Jikes Cosmetics. You are now part of our exclusive community!</p>

          <div style="background: #fff8f0; border: 1.5px dashed hsl(357, 45%, 69%); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #555;">You will be the first to know about:</p>
            <p style="margin: 8px 0 0; font-size: 15px; font-weight: bold; color: hsl(357, 45%, 69%);">Exclusive deals, new arrivals & special offers</p>
          </div>

          <p style="font-size: 13px; color: #555;">You can now log in with your email to shop, track orders and more.</p>

          <p style="margin-top: 24px; color: #777; font-size: 13px;">
            If you have any questions, contact us:<br>
            <strong>Phone:</strong> ${process.env.CONTACT_PHONE || "09040472851"}<br>
            <strong>WhatsApp:</strong> <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "2349040472851"}" style="color: hsl(357, 45%, 69%);">Click here to chat</a>
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © 2026 Jikes Cosmetics. All rights reserved.
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Welcome email sent to ${email} ✅`);
}

module.exports = { 
  sendOrderConfirmationEmail, 
  sendOwnerNotificationEmail, 
  sendShippedNotificationEmail, 
  sendCancellationEmail, 
  sendRefundProcessedEmail,
  sendDeliveredEmail ,
  sendWelcomeEmail 
};