document.addEventListener("DOMContentLoaded", async () => {

  const trackBtn = document.getElementById("trackBtn");
  const trackingInput = document.getElementById("trackingInput");
  const trackResult = document.getElementById("trackResult");
  const trackError = document.getElementById("trackError");
  const myOrdersSection = document.getElementById("myOrdersSection");
  const myOrdersList = document.getElementById("myOrdersList");
  const markReceivedSection = document.getElementById("markReceivedSection");
  const markReceivedBtn = document.getElementById("markReceivedBtn");

  const userId = sessionStorage.getItem("userId");

  // ─────────────────────────────────────────
  // LOAD USER'S OWN ORDERS (if logged in)
  // ─────────────────────────────────────────
  if (userId) {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/user/${userId}`);
      const data = await res.json();

      if (data.success && data.orders.length > 0) {
        myOrdersSection.style.display = "block";

        data.orders.forEach(order => {
          const date = new Date(order.order_created_at).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
          });

          const item = document.createElement("div");
          item.className = "myOrderItem";
          item.innerHTML = `
            <div>
              <h4>${order.trackingId}</h4>
              <p>${date} · ₦${order.total?.toLocaleString()}</p>
            </div>
            <span class="statusBadge ${order.status}">${order.status}</span>
          `;

          item.addEventListener("click", () => {
            displayOrder(order);
          });

          myOrdersList.appendChild(item);
        });
      }
    } catch (err) {
      console.error("Load user orders error:", err);
    }
  }

  // ─────────────────────────────────────────
  // TRACK BY TRACKING ID
  // ─────────────────────────────────────────
  trackBtn.addEventListener("click", async () => {
    const trackingId = trackingInput.value.trim();
    if (!trackingId) return alert("Please enter a tracking ID.");

    trackResult.style.display = "none";
    trackError.style.display = "none";

    try {
      const res = await fetch(`http://localhost:5000/api/orders/track/${trackingId}`);
      const data = await res.json();

      if (data.success) {
        displayOrder(data.order);
      } else {
        trackError.style.display = "block";
      }
    } catch (err) {
      console.error("Track order error:", err);
      trackError.style.display = "block";
    }
  });

  // Also allow pressing Enter to search
  trackingInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") trackBtn.click();
  });

  // ─────────────────────────────────────────
  // DISPLAY ORDER DETAILS
  // ─────────────────────────────────────────
  function displayOrder(order) {
    trackError.style.display = "none";
    trackResult.style.display = "block";

    // Tracking ID and status badge
    document.getElementById("resultTrackingId").textContent = order.trackingId;
    document.getElementById("resultOrderId").textContent = order._id;
    const statusBadge = document.getElementById("resultStatus");
    statusBadge.textContent = order.status;
    statusBadge.className = `statusBadge ${order.status}`;

    // Progress steps
    updateProgress(order);

    // Delivery details
    document.getElementById("trackName").textContent =
      `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`;
    document.getElementById("trackPhone").textContent = order.deliveryDetails.phone;
    document.getElementById("trackAddress").textContent =
      `${order.deliveryDetails.address}, ${order.deliveryDetails.city}, ${order.deliveryDetails.state}`;

    // Shipping option
    document.getElementById("trackShipping").textContent =
      order.shippingOption ? order.shippingOption.name : "Not specified";

    // Items
    const trackItems = document.getElementById("trackItems");
    trackItems.innerHTML = "";
    order.items.forEach(item => {
      const div = document.createElement("div");
      div.className = "trackItem";
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div>
          <p>${item.name} × ${item.quantity}</p>
          <p class="itemPrice">₦${(item.price * item.quantity).toLocaleString()}</p>
        </div>
      `;
      trackItems.appendChild(div);
    });

    // Order summary
    document.getElementById("trackSubtotal").textContent =
      `₦${order.subtotal ? order.subtotal.toLocaleString() : order.total.toLocaleString()}`;
    document.getElementById("trackShippingFee").textContent =
      `₦${order.shippingFee.toLocaleString()}`;
    document.getElementById("trackTotal").textContent =
      `₦${order.total.toLocaleString()}`;

    // Show Mark as Received button only if shipped
    if (order.status === "shipped") {
      markReceivedSection.style.display = "block";
      markReceivedBtn.onclick = () => markAsReceived(order._id);
    } else {
      markReceivedSection.style.display = "none";
    }

    // Scroll to result
    trackResult.scrollIntoView({ behavior: "smooth" });
  }

  // ─────────────────────────────────────────
  // UPDATE PROGRESS BAR
  // ─────────────────────────────────────────
  function updateProgress(order) {
    const steps = ["pending", "paid", "shipped", "delivered"];
    const lines = [
      document.getElementById("line-1"),
      document.getElementById("line-2"),
      document.getElementById("line-3")
    ];

    // Determine current stage
    let currentStage = 0;
    if (order.paymentStatus === "paid") currentStage = 1;
    if (order.status === "shipped") currentStage = 2;
    if (order.status === "delivered") currentStage = 3;

    steps.forEach((step, index) => {
      const stepEl = document.getElementById(`step-${step}`);
      stepEl.classList.remove("active", "done");

      if (index < currentStage) {
        stepEl.classList.add("done");
      } else if (index === currentStage) {
        stepEl.classList.add("active");
      }
    });

    lines.forEach((line, index) => {
      line.classList.remove("done");
      if (index < currentStage) {
        line.classList.add("done");
      }
    });
  }

  // ─────────────────────────────────────────
  // MARK AS RECEIVED
  // ─────────────────────────────────────────
  async function markAsReceived(orderId) {
    if (!confirm("Confirm that you have received your order?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" })
      });
      const data = await res.json();

      if (data.success) {
        alert("Thank you for confirming! We hope you enjoy your order.");
        markReceivedSection.style.display = "none";

        // Update status badge
        const statusBadge = document.getElementById("resultStatus");
        statusBadge.textContent = "delivered";
        statusBadge.className = "statusBadge delivered";

        // Update progress bar
        updateProgress({ ...data.order, paymentStatus: "paid" });
      } else {
        alert("Failed to update order. Please try again.");
      }
    } catch (err) {
      console.error("Mark as received error:", err);
      alert("Server error. Please try again.");
    }
  }

});