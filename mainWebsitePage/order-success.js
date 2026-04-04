document.addEventListener("DOMContentLoaded", async () => {

  function formatDateTime(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  if (!orderId) {
    document.querySelector(".success-wrapper").innerHTML = 
      "<p>Order not found. Please contact support.</p>";
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/orders/${orderId}`);
    const data = await res.json();

    if (!data.success) {
      document.querySelector(".success-wrapper").innerHTML =
        "<p>Could not load order details. Please contact support.</p>";
      return;
    }

    const order = data.order;

    // Check payment status before showing confirmation
    if (order.paymentStatus !== "paid") {
      document.querySelector(".success-wrapper").innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2 style="color: #e74c3c;">Payment not confirmed!</h2>
          <p style="color: #777; margin: 12px 0;">Your order has not been paid for yet. If you completed payment please wait a moment and refresh.</p>
          <a href="mainWebsitePage.html" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: hsl(357, 45%, 69%); color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Continue shopping</a>
        </div>
      `;
      return;
    }

    // 3. Display tracking ID
    document.getElementById("trackingId").textContent = order.trackingId;
    // Display order timeline
    document.getElementById("timeOrdered").textContent = formatDateTime(order.order_created_at);

    // 4. Display delivery details
    document.getElementById("customerName").textContent =
      `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`;
    document.getElementById("customerPhone").textContent = order.deliveryDetails.phone;
    const d = order.deliveryDetails;
    document.getElementById("customerAddress").innerHTML = `
      ${d.address}<br>
      ${[d.state, d.country].filter(part => part && part.trim() !== "").join(", ")}
    `;

    // 5. Display shipping option name
    document.getElementById("shippingOption").textContent =
      order.shippingOption ? order.shippingOption.name : "Not specified";

    // 6. Display items
    const itemsContainer = document.getElementById("orderItems");
    order.items.forEach(item => {
      const div = document.createElement("div");
      div.className = "order-item";
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="order-item-details">
          <p>${item.name} × ${item.quantity}</p>
          <p class="item-price">₦${(item.price * item.quantity).toLocaleString()}</p>
        </div>
      `;
      itemsContainer.appendChild(div);
    });

    // 7. Display order summary
    document.getElementById("subtotal").textContent =
      `₦${order.subtotal ? order.subtotal.toLocaleString() : order.total.toLocaleString()}`;
    document.getElementById("shippingFee").textContent =
      `₦${order.shippingFee.toLocaleString()}`;
    document.getElementById("total").textContent =
      `₦${order.total.toLocaleString()}`;

    // AFTER
    // 8. Only clear cart if this is the first visit (cart still has items)
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    if (existingCart.length > 0) {
      localStorage.removeItem("cart");
      localStorage.removeItem("deliveryDetails");
      localStorage.removeItem("selectedShipping");

      // Clear cart from backend
      const userId = sessionStorage.getItem("userId");
      if (userId) {
        await fetch("http://localhost:5000/api/auth/clear-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });
      }
    }

  } catch (err) {  // ← this closes the main try block correctly
    console.error("Order success page error:", err);
  }

});