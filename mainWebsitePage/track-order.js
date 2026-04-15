document.addEventListener("DOMContentLoaded", async () => {

  const BASE_URL = "https://jc-website.onrender.com";
  const trackBtn = document.getElementById("trackBtn");
  const trackingInput = document.getElementById("trackingInput");
  const trackResult = document.getElementById("trackResult");
  const trackError = document.getElementById("trackError");
  const myOrdersSection = document.getElementById("myOrdersSection");
  const myOrdersList = document.getElementById("myOrdersList");
  const markReceivedSection = document.getElementById("markReceivedSection");
  const markReceivedBtn = document.getElementById("markReceivedBtn");

  const userId = sessionStorage.getItem("userId");

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

  // ─────────────────────────────────────────
  // LOAD USER'S OWN ORDERS (if logged in)
  // ─────────────────────────────────────────
  if (userId) {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/user/${userId}`);
      const data = await res.json();

      if (data.success && data.orders.length > 0) {
        myOrdersSection.style.display = "block";

        data.orders.forEach(order => {
          const date = formatDateTime(order.order_created_at);

          const item = document.createElement("div");
          item.className = "myOrderItem";
          let listDisplayStatus = order.status;
          if (order.status === "cancelled") {
            if (order.paymentStatus === "refunded") listDisplayStatus = "refunded";
            else if (order.paymentStatus === "refund_initiated") listDisplayStatus = "refund pending";
          }
          item.innerHTML = `
            <div>
              <h4>${order.trackingId}</h4>
              <p>${date} · ₦${order.total?.toLocaleString()}</p>
            </div>
            <span class="statusBadge ${listDisplayStatus.replace(" ", "-")}">${listDisplayStatus}</span>
          `;

          item.addEventListener("click", () => {
            trackResult.style.display = "none";
            showSpinner();
            setTimeout(() => {
              hideSpinner();
              displayOrder(order, true); // always owner from My Orders list
            }, 800);
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
    if (!trackingId) return showToast("error", "Please enter a tracking ID.");

    trackResult.style.display = "none";
    trackError.style.display = "none";
    showSpinner();
    try {
      const res = await fetch(`${BASE_URL}/api/orders/track/${trackingId}?userId=${userId || ""}`);
      const data = await res.json();

      if (data.success) {
        setTimeout(() => {
          hideSpinner();
          displayOrder(data.order, data.isOwner !== false);
        }, 800);
      } else {
        setTimeout(() => {
          hideSpinner();
          showToast("error", "Order not found. Please check your tracking ID and try again.");
        }, 800);
      }
      } catch (err) {
        console.error("Track order error:", err);
        setTimeout(() => {
          hideSpinner();
          showToast("error", "Server error. Please try again.");
        }, 800);
      }
  });

  trackingInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") trackBtn.click();
  });

  // ─────────────────────────────────────────
  // DISPLAY ORDER DETAILS
  // ─────────────────────────────────────────
  function displayOrder(order, isOwner = true) {
    trackError.style.display = "none";
    trackResult.style.display = "block";

    document.getElementById("resultTrackingId").textContent = order.trackingId;
    document.getElementById("resultOrderId").textContent = order._id;
    document.getElementById("viewConfirmationBtn").href = `order-success.html?orderId=${order._id}`;

    const statusBadge = document.getElementById("resultStatus");
    let displayStatus = order.status;
    if (order.status === "cancelled") {
      if (order.paymentStatus === "refunded") displayStatus = "refunded";
      else if (order.paymentStatus === "refund_initiated") displayStatus = "refund pending";
    }
    statusBadge.textContent = displayStatus;
    statusBadge.className = `statusBadge ${displayStatus.replace(" ", "-")}`;

    updateProgress(order);

    // Non-owners only see status and timeline — no personal details
    if (!isOwner) {
      document.getElementById("trackName").textContent = "—";
      document.getElementById("trackPhone").textContent = "—";
      document.getElementById("trackAddress").textContent = "—";
      document.getElementById("trackShipping").textContent = "—";
      document.getElementById("trackItems").innerHTML = `
        <p style="font-size:13px; color:#999;">
          Item details are only visible to the order owner.
        </p>`;
      document.getElementById("trackSubtotal").textContent = "—";
      document.getElementById("trackShippingFee").textContent = "—";
      document.getElementById("trackTotal").textContent = "—";
      document.getElementById("viewConfirmationBtn").style.display = "none";
      markReceivedSection.style.display = "none";
      document.getElementById("ratingsSection").style.display = "none";
      renderCancelSection({ status: "" }); // pass fake order so cancel section doesn't show
    } else {
      document.getElementById("trackName").textContent =
        `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`;
      document.getElementById("trackPhone").textContent = order.deliveryDetails.phone;
      const d = order.deliveryDetails;
      document.getElementById("trackAddress").innerHTML = `
        ${d.address}<br>
        ${[d.state, d.country].filter(part => part && part.trim() !== "").join(", ")}
      `;
      document.getElementById("trackShipping").textContent =
        order.shippingOption ? order.shippingOption.name : "Not specified";
    }

    document.getElementById("timeOrdered").textContent = formatDateTime(order.order_created_at);

    const shippedRow = document.getElementById("timeShippedRow");
    const deliveredRow = document.getElementById("timeDeliveredRow");
    const cancelledRow = document.getElementById("timeCancelledRow");

    if (order.status === "cancelled") {
      cancelledRow.style.display = "flex";
      document.getElementById("timeCancelled").textContent = formatDateTime(order.updatedAt);
    } else {
      cancelledRow.style.display = "none";
    }

    const refundedRow = document.getElementById("timeRefundedRow");
    if (order.order_refunded_at) {
      refundedRow.style.display = "flex";
      document.getElementById("timeRefunded").textContent = formatDateTime(order.order_refunded_at);
    } else {
      refundedRow.style.display = "none";
    }

    if (order.order_shipped_at) {
      shippedRow.style.display = "flex";
      document.getElementById("timeShipped").textContent = formatDateTime(order.order_shipped_at);
    } else {
      shippedRow.style.display = "none";
    }

    if (order.order_delivered_at) {
      deliveredRow.style.display = "flex";
      document.getElementById("timeDelivered").textContent = formatDateTime(order.order_delivered_at);
    } else {
      deliveredRow.style.display = "none";
    }

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

    document.getElementById("trackSubtotal").textContent =
      `₦${order.subtotal ? order.subtotal.toLocaleString() : order.total.toLocaleString()}`;
    document.getElementById("trackShippingFee").textContent =
      `₦${order.shippingFee.toLocaleString()}`;
    document.getElementById("trackTotal").textContent =
      `₦${order.total.toLocaleString()}`;

    // Mark as received (shipped orders only)
    if (order.status === "shipped") {
      markReceivedSection.style.display = "block";
      markReceivedBtn.onclick = () => markAsReceived(order._id);
    } else {
      markReceivedSection.style.display = "none";
    }

    // ─────────────────────────────────────────
    // CANCEL ORDER BUTTON (user-facing)
    // ─────────────────────────────────────────
    renderCancelSection(order);

    // Ratings (delivered only)
    const ratingsSection = document.getElementById("ratingsSection");
    if (order.status === "delivered") {
      showRatingsForm(order);
    } else {
      ratingsSection.style.display = "none";
    }

    trackResult.scrollIntoView({ behavior: "smooth" });
  }

  // ─────────────────────────────────────────
  // RENDER CANCEL SECTION
  // ─────────────────────────────────────────
  function renderCancelSection(order) {
    // Remove existing cancel section if any
    const existing = document.getElementById("cancelOrderSection");
    if (existing) existing.remove();

    // Only show if this order belongs to the logged-in user AND it can still be cancelled
    const isMine = userId && String(order.userId) === String(userId);
    const isCancellable = order.status === "pending" && order.paymentStatus === "paid";

    if (!isMine || !isCancellable) return;

    const cancelSection = document.createElement("div");
    cancelSection.id = "cancelOrderSection";
    cancelSection.className = "trackSection";
    cancelSection.style.cssText = `
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
    `;

    cancelSection.innerHTML = `
      <h3 style="font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#999; margin-bottom:8px;">Cancel order</h3>
      <p style="font-size:13px; color:#666; margin-bottom:12px;">
        Changed your mind? You can cancel this order while it hasn't been shipped yet.
        A full refund of <strong>₦${order.total.toLocaleString()}</strong> will be initiated automatically.
      </p>
      <button id="cancelOrderBtn" style="
        padding: 10px 22px;
        background: #fff;
        color: #c0392b;
        border: 1.5px solid #c0392b;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      ">Cancel my order</button>
    `;

    // Insert before the order summary section (last trackSection)
    const trackDetails = document.querySelector(".trackDetails");
    trackDetails.appendChild(cancelSection);

    const cancelBtn = document.getElementById("cancelOrderBtn");

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#c0392b";
      cancelBtn.style.color = "#fff";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#fff";
      cancelBtn.style.color = "#c0392b";
    });

    cancelBtn.addEventListener("click", () => cancelOrder(order));
  }

  // ─────────────────────────────────────────
  // CANCEL ORDER
  // ─────────────────────────────────────────
  async function cancelOrder(order) {
    // Confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to cancel order ${order.trackingId}?\n\n` +
      `A full refund of ₦${order.total.toLocaleString()} will be initiated to your original payment method. ` +
      `Refunds typically take 5–10 business days.`
    );
    if (!confirmed) return;

    const cancelBtn = document.getElementById("cancelOrderBtn");
    if (cancelBtn) {
      cancelBtn.disabled = true;
      cancelBtn.textContent = "Cancelling...";
      cancelBtn.style.opacity = "0.6";
    }

    showSpinner();

    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", requestingUserId: userId })
      });
      const data = await res.json();

      setTimeout(() => hideSpinner(), 400);

      if (data.success) {
        showToast("success", "Order cancelled. A refund has been initiated.");

        // Update status badge
        const statusBadge = document.getElementById("resultStatus");
        statusBadge.textContent = "cancelled";
        statusBadge.className = "statusBadge cancelled";

        // Update progress bar
        updateProgress(data.order);

        // Remove cancel section
        const cancelSection = document.getElementById("cancelOrderSection");
        if (cancelSection) cancelSection.remove();

        // Show cancelled timestamp
        const cancelledRow = document.getElementById("timeCancelledRow");
        if (cancelledRow) {
          cancelledRow.style.display = "flex";
          document.getElementById("timeCancelled").textContent = formatDateTime(new Date().toISOString());
        }

        // Hide mark as received
        markReceivedSection.style.display = "none";

        // Refresh the "My orders" list
        refreshMyOrders();

      } else {
        if (cancelBtn) {
          cancelBtn.disabled = false;
          cancelBtn.textContent = "Cancel my order";
          cancelBtn.style.opacity = "1";
        }
        showToast("error", data.message || "Failed to cancel order. Please try again.");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      setTimeout(() => hideSpinner(), 400);
      if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.textContent = "Cancel my order";
        cancelBtn.style.opacity = "1";
      }
      showToast("error", "Server error. Please try again.");
    }
  }

  // ─────────────────────────────────────────
  // REFRESH MY ORDERS LIST
  // ─────────────────────────────────────────
  async function refreshMyOrders() {
    if (!userId || !myOrdersList) return;
    try {
      const res = await fetch(`${BASE_URL}/api/orders/user/${userId}`);
      const data = await res.json();
      if (data.success) {
        myOrdersList.innerHTML = "";
        data.orders.forEach(order => {
          const date = formatDateTime(order.order_created_at);
          const item = document.createElement("div");
          item.className = "myOrderItem";
          let listDisplayStatus = order.status;
          if (order.status === "cancelled") {
            if (order.paymentStatus === "refunded") listDisplayStatus = "refunded";
            else if (order.paymentStatus === "refund_initiated") listDisplayStatus = "refund pending";
          }
          item.innerHTML = `
            <div>
              <h4>${order.trackingId}</h4>
              <p>${date} · ₦${order.total?.toLocaleString()}</p>
            </div>
            <span class="statusBadge ${listDisplayStatus.replace(" ", "-")}">${listDisplayStatus}</span>
          `;
          item.addEventListener("click", () => {
            trackResult.style.display = "none";
            showSpinner();
            setTimeout(() => { hideSpinner(); displayOrder(order); }, 800);
          });
          myOrdersList.appendChild(item);
        });
      }
    } catch (err) {
      console.error("Refresh orders error:", err);
    }
  }

  // ─────────────────────────────────────────
  // UPDATE PROGRESS BAR
  // ─────────────────────────────────────────
  function updateProgress(order) {
    const progressContainer = document.getElementById("trackProgress");
    progressContainer.innerHTML = "";

    let steps = [];

    if (order.status === "cancelled") {
      if (order.paymentStatus === "refunded") {
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Payment confirmed", state: "done" },
          { label: "Cancelled", state: "done", color: "red" },
          { label: "Refunded", state: "active", color: "green" }
        ];
      } else if (order.paymentStatus === "refund_initiated") {
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Payment confirmed", state: "done" },
          { label: "Cancelled", state: "done", color: "red" },
          { label: "Refund pending", state: "active", color: "orange" }
        ];
      } else if (order.paymentStatus === "paid") {
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Payment confirmed", state: "done" },
          { label: "Cancelled", state: "active", color: "red" },
          { label: "Refunded", state: "inactive" }
        ];
      } else {
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Cancelled", state: "active", color: "red" }
        ];
      }
    } else {
      steps = [
        { label: "Order placed", state: "done" },
        { label: "Payment confirmed", state: order.paymentStatus === "paid" ? "done" : "inactive" },
        { label: "Shipped", state: order.status === "shipped" || order.status === "delivered" ? "done" : "inactive" },
        { label: "Delivered", state: order.status === "delivered" ? "active" : "inactive" }
      ];

      if (order.status === "delivered") {
        steps[3].state = "active";
        steps[2].state = "done";
      } else if (order.status === "shipped") {
        steps[2].state = "active";
      } else if (order.paymentStatus === "paid") {
        steps[1].state = "active";
      } else {
        steps[0].state = "active";
      }
    }

    steps.forEach((step, index) => {
      const stepEl = document.createElement("div");
      stepEl.className = "trackStep";
      if (step.state === "done") stepEl.classList.add("done");
      if (step.state === "active") stepEl.classList.add("active");
      if (step.color === "red") stepEl.classList.add("cancelled-step");
      if (step.color === "green") stepEl.classList.add("refunded-step");
      if (step.color === "orange") stepEl.classList.add("refund-pending-step");

      stepEl.innerHTML = `
        <div class="trackStepDot"></div>
        <p>${step.label}</p>
      `;
      progressContainer.appendChild(stepEl);

      if (index < steps.length - 1) {
        const line = document.createElement("div");
        line.className = "trackLine";
        if (step.state === "done") line.classList.add("done");
        progressContainer.appendChild(line);
      }
    });
  }

  // ─────────────────────────────────────────
  // MARK AS RECEIVED
  // ─────────────────────────────────────────
  async function markAsReceived(orderId) {
    if (!confirm("Confirm that you have received your order?")) return;

    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" })
      });
      const data = await res.json();

      if (data.success) {
        showToast("success", "Thank you for confirming! We hope you enjoy your order.");
        markReceivedSection.style.display = "none";

        const statusBadge = document.getElementById("resultStatus");
        statusBadge.textContent = "delivered";
        statusBadge.className = "statusBadge delivered";

        updateProgress({ ...data.order, paymentStatus: "paid" });
        showRatingsForm(data.order);
      } else {
        showToast("error", "Failed to update order. Please try again.");
      }
    } catch (err) {
      console.error("Mark as received error:", err);
      showToast("error", "Server error. Please try again.");
    }
  }

  // ─────────────────────────────────────────
  // SHOW RATINGS FORM
  // ─────────────────────────────────────────
  async function showRatingsForm(order) {
    let username = "Anonymous";
    if (userId) {
      try {
        const userRes = await fetch(`${BASE_URL}/api/auth/userdata/${userId}`);
        const userData = await userRes.json();
        if (userData.success && userData.username) username = userData.username;
      } catch (err) {
        console.error("Get username error:", err);
      }
    }

    const ratingsSection = document.getElementById("ratingsSection");
    const ratingsList = document.getElementById("ratingsList");
    const submitRatingsBtn = document.getElementById("submitRatingsBtn");

    ratingsSection.style.display = "block";
    ratingsList.innerHTML = "";
    submitRatingsBtn.style.display = "none";

    const existingThankYou = ratingsSection.querySelector(".thankYouMsg");
    if (existingThankYou) existingThankYou.remove();

    const ratings = {};
    let unratedCount = 0;

    for (const item of order.items) {
      // Strip variant label from name e.g. "Baloon (white)" → "Baloon"
      const cleanName = item.name.replace(/\s*\(.*?\)\s*$/, "").trim();
      const productRes = await fetch(`${BASE_URL}/api/products/byname/${encodeURIComponent(cleanName)}`);
      const productData = await productRes.json();
      if (!productData.success) continue;

      const product = productData.product;

      const checkRes = await fetch(`${BASE_URL}/api/ratings/check/${order._id}/${product._id}/${userId}`);
      const checkData = await checkRes.json();

      const div = document.createElement("div");
      div.className = "ratingItem";

      if (checkData.alreadyRated) {
        const existingRes = await fetch(`${BASE_URL}/api/ratings/get/${order._id}/${product._id}/${userId}`);
        const existingData = await existingRes.json();
        const existingRating = existingData.rating;

        const starsHTML = [1, 2, 3, 4, 5].map(i => `
          <span class="star ${i <= existingRating.rating ? "selected" : ""}" style="cursor: default;">&#9733;</span>
        `).join("");

        div.innerHTML = `
          <div class="ratingItemHeader">
            <img src="${item.image}" alt="${item.name}">
            <p>${item.name}</p>
          </div>
          <p class="alreadyRated">✓ Already rated</p>
          <div class="starRow" style="pointer-events: none;">${starsHTML}</div>
          ${existingRating.review ? `<div class="existingReview"><p>"${existingRating.review}"</p></div>` : ""}
        `;
      } else {
        unratedCount++;
        div.innerHTML = `
          <div class="ratingItemHeader">
            <img src="${item.image}" alt="${item.name}">
            <p>${item.name}</p>
          </div>
          <div class="starRow" data-product-id="${product._id}">
            <span class="star" data-value="1">&#9733;</span>
            <span class="star" data-value="2">&#9733;</span>
            <span class="star" data-value="3">&#9733;</span>
            <span class="star" data-value="4">&#9733;</span>
            <span class="star" data-value="5">&#9733;</span>
          </div>
          <textarea class="ratingReview" placeholder="Write a review (optional)" data-product-id="${product._id}"></textarea>
        `;

        const starRow = div.querySelector(".starRow");
        const stars = starRow.querySelectorAll(".star");

        stars.forEach(star => {
          star.addEventListener("mouseover", () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => s.classList.toggle("hovered", parseInt(s.dataset.value) <= val));
          });
          star.addEventListener("mouseout", () => stars.forEach(s => s.classList.remove("hovered")));
          star.addEventListener("click", () => {
            const val = parseInt(star.dataset.value);
            ratings[product._id] = ratings[product._id] || {};
            ratings[product._id].rating = val;
            stars.forEach(s => s.classList.toggle("selected", parseInt(s.dataset.value) <= val));
          });
        });

        const textarea = div.querySelector(".ratingReview");
        textarea.addEventListener("input", () => {
          ratings[product._id] = ratings[product._id] || {};
          ratings[product._id].review = textarea.value;
        });

        ratings[product._id] = { productId: product._id, rating: 0, review: "" };
      }

      ratingsList.appendChild(div);
    }

    if (unratedCount === 0) {
      const thankYou = document.createElement("p");
      thankYou.className = "thankYouMsg";
      thankYou.style.cssText = "text-align:center; color:#4CAF50; font-weight:bold; font-size:14px; margin-top:12px;";
      thankYou.textContent = "✓ Thank you for your ratings!";
      ratingsSection.appendChild(thankYou);
    } else {
      submitRatingsBtn.style.display = "block";
    }

    submitRatingsBtn.onclick = async () => {
      let submitted = 0, skipped = 0;
      for (const productId in ratings) {
        const r = ratings[productId];
        if (!r.rating || r.rating === 0) { skipped++; continue; }
        try {
          const res = await fetch(`${BASE_URL}/api/ratings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, orderId: order._id, userId, username, rating: r.rating, review: r.review || "" })
          });
          const data = await res.json();
          if (data.success) submitted++;
        } catch (err) {
          console.error("Submit rating error:", err);
        }
      }

      if (submitted === 0 && skipped > 0) {
        showToast("error", "Please select at least one star rating before submitting.");
        return;
      }

      showToast("success", `Thank you! ${submitted} rating${submitted !== 1 ? "s" : ""} submitted successfully.`);
      submitRatingsBtn.style.display = "none";
      const thankYou = document.createElement("p");
      thankYou.className = "thankYouMsg";
      thankYou.style.cssText = "text-align:center; color:#4CAF50; font-weight:bold; font-size:14px; margin-top:12px;";
      thankYou.textContent = "✓ Thank you for your ratings!";
      ratingsSection.appendChild(thankYou);
      setTimeout(() => showRatingsForm(order), 1000);
    };
  }

});