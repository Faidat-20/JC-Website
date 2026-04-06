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
      const res = await fetch(`http://localhost:5000/api/orders/user/${userId}`);
      const data = await res.json();

      if (data.success && data.orders.length > 0) {
        myOrdersSection.style.display = "block";

        data.orders.forEach(order => {
          const date = formatDateTime(order.order_created_at);

          const item = document.createElement("div");
          item.className = "myOrderItem";
          const listDisplayStatus = (order.status === "cancelled" && (order.paymentStatus === "paid" || order.paymentStatus === "refunded")) ? "refunded" : order.status;
          item.innerHTML = `
            <div>
              <h4>${order.trackingId}</h4>
              <p>${date} · ₦${order.total?.toLocaleString()}</p>
            </div>
            <span class="statusBadge ${order.status}">${listDisplayStatus}</span>
          `;

          item.addEventListener("click", () => {
            trackResult.style.display = "none";
            showSpinner();
            setTimeout(() => {
              hideSpinner();
              displayOrder(order);
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
      const res = await fetch(`http://localhost:5000/api/orders/track/${trackingId}`);
      const data = await res.json();

      if (data.success) {
        setTimeout(() => {
          hideSpinner();
          displayOrder(data.order);
        }, 800);
      } else {
        hideSpinner();
        trackError.style.display = "block";
      }
    } catch (err) {
      console.error("Track order error:", err);
      hideSpinner();
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
    // Link to order confirmation page
    document.getElementById("viewConfirmationBtn").href = `order-success.html?orderId=${order._id}`;
    const statusBadge = document.getElementById("resultStatus");
    const displayStatus = (order.status === "cancelled" && (order.paymentStatus === "paid" || order.paymentStatus === "refunded")) ? "refunded" : order.status;
    statusBadge.textContent = displayStatus;
    statusBadge.className = `statusBadge ${displayStatus}`;

    // Progress steps
    updateProgress(order);

    // Delivery details
    document.getElementById("trackName").textContent =
      `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`;
    document.getElementById("trackPhone").textContent = order.deliveryDetails.phone;
    const d = order.deliveryDetails;
    document.getElementById("trackAddress").innerHTML = `
      ${d.address}<br>
      ${[d.state, d.country].filter(part => part && part.trim() !== "").join(", ")}
    `;

    // Shipping option
    document.getElementById("trackShipping").textContent =
      order.shippingOption ? order.shippingOption.name : "Not specified";

    // Order timeline
    document.getElementById("timeOrdered").textContent = formatDateTime(order.order_created_at);

    const shippedRow = document.getElementById("timeShippedRow");
    const deliveredRow = document.getElementById("timeDeliveredRow");

    // Add this after the deliveredRow block
    const cancelledRow = document.getElementById("timeCancelledRow");
    if (order.status === "cancelled") {
      cancelledRow.style.display = "flex";
      document.getElementById("timeCancelled").textContent = formatDateTime(order.updatedAt);
    } else {
      cancelledRow.style.display = "none";
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

    // Show ratings form if already delivered
    const ratingsSection = document.getElementById("ratingsSection");

    // Only show ratings for delivered orders
    if (order.status === "delivered") {
      showRatingsForm(order);
    } else {
      ratingsSection.style.display = "none"; // 🔥 THIS IS WHAT YOU WERE MISSING
    }
    // Scroll to result
    trackResult.scrollIntoView({ behavior: "smooth" });
  }

  // ─────────────────────────────────────────
  // UPDATE PROGRESS BAR
  // ─────────────────────────────────────────
  // AFTER
  function updateProgress(order) {
    const progressContainer = document.getElementById("trackProgress");
    progressContainer.innerHTML = "";

    // Build steps based on order status
    let steps = [];

    if (order.status === "cancelled") {
      if (order.paymentStatus === "refunded") {
        // Paid, cancelled and refunded
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Payment confirmed", state: "done" },
          { label: "Cancelled", state: "done", color: "red" },
          { label: "Refunded", state: "active", color: "green" }
        ];
      } else if (order.paymentStatus === "paid") {
        // Paid, cancelled but refund pending
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Payment confirmed", state: "done" },
          { label: "Cancelled", state: "active", color: "red" },
          { label: "Refunded", state: "inactive" }
        ];
      } else {
        // Not paid, cancelled
        steps = [
          { label: "Order placed", state: "done" },
          { label: "Cancelled", state: "active", color: "red" }
        ];
      }
    } else {
      // Normal flow
      steps = [
        { label: "Order placed", state: "done" },
        { label: "Payment confirmed", state: order.paymentStatus === "paid" ? "done" : "inactive" },
        { label: "Shipped", state: order.status === "shipped" || order.status === "delivered" ? "done" : order.paymentStatus === "paid" ? "inactive" : "inactive" },
        { label: "Delivered", state: order.status === "delivered" ? "active" : "inactive" }
      ];

      // Fix active step
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

    // Build the HTML
    steps.forEach((step, index) => {
      // Add step dot
      const stepEl = document.createElement("div");
      stepEl.className = "trackStep";

      if (step.state === "done") stepEl.classList.add("done");
      if (step.state === "active") stepEl.classList.add("active");
      if (step.color === "red") stepEl.classList.add("cancelled-step");
      if (step.color === "green") stepEl.classList.add("refunded-step");

      stepEl.innerHTML = `
        <div class="trackStepDot"></div>
        <p>${step.label}</p>
      `;
      progressContainer.appendChild(stepEl);

      // Add line between steps
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
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" })
      });
      const data = await res.json();

      if (data.success) {
        showToast("success", "Thank you for confirming! We hope you enjoy your order.");
        markReceivedSection.style.display = "none";

        // Update status badge
        const statusBadge = document.getElementById("resultStatus");
        statusBadge.textContent = "delivered";
        statusBadge.className = "statusBadge delivered";

        // Update progress bar
        updateProgress({ ...data.order, paymentStatus: "paid" });

        // Show ratings form
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

    // Get username from backend
    let username = "Anonymous";
    if (userId) {
      try {
        const userRes = await fetch(`http://localhost:5000/api/auth/userdata/${userId}`);
        const userData = await userRes.json();
        if (userData.success && userData.username) {
          username = userData.username;
        }
      } catch (err) {
        console.error("Get username error:", err);
      }
    }
    const ratingsSection = document.getElementById("ratingsSection");
    const ratingsList = document.getElementById("ratingsList");
    const submitRatingsBtn = document.getElementById("submitRatingsBtn");

    ratingsSection.style.display = "block";
    ratingsList.innerHTML = "";

    // Hide submit button and remove any existing thank you message
    submitRatingsBtn.style.display = "none";
    const existingThankYou = ratingsSection.querySelector(".thankYouMsg");
    if (existingThankYou) existingThankYou.remove();

    const ratings = {};
    let unratedCount = 0;

    for (const item of order.items) {
      // Get product from DB by name
      const productRes = await fetch(`http://localhost:5000/api/products/byname/${encodeURIComponent(item.name)}`);
      const productData = await productRes.json();

      if (!productData.success) continue;

      const product = productData.product;

      // Check if already rated
      const checkRes = await fetch(`http://localhost:5000/api/ratings/check/${order._id}/${product._id}/${userId}`);
      const checkData = await checkRes.json();

      const div = document.createElement("div");
      div.className = "ratingItem";

      if (checkData.alreadyRated) {
        // Fetch the existing rating to display it
        const existingRes = await fetch(`http://localhost:5000/api/ratings/get/${order._id}/${product._id}/${userId}`);
        const existingData = await existingRes.json();
        const existingRating = existingData.rating;

        // Build filled stars based on their rating
        const starsHTML = [1, 2, 3, 4, 5].map(i => `
          <span class="star ${i <= existingRating.rating ? "selected" : ""}" style="cursor: default;">&#9733;</span>
        `).join("");

        div.innerHTML = `
          <div class="ratingItemHeader">
            <img src="${item.image}" alt="${item.name}">
            <p>${item.name}</p>
          </div>
          <p class="alreadyRated">✓ Already rated</p>
          <div class="starRow" style="pointer-events: none;">
            ${starsHTML}
          </div>
          ${existingRating.review ? `
            <div class="existingReview">
              <p>"${existingRating.review}"</p>
            </div>
          ` : ""}
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

        // Star hover and click interactions
        const starRow = div.querySelector(".starRow");
        const stars = starRow.querySelectorAll(".star");

        stars.forEach(star => {
          star.addEventListener("mouseover", () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => {
              s.classList.toggle("hovered", parseInt(s.dataset.value) <= val);
            });
          });

          star.addEventListener("mouseout", () => {
            stars.forEach(s => s.classList.remove("hovered"));
          });

          star.addEventListener("click", () => {
            const val = parseInt(star.dataset.value);
            ratings[product._id] = ratings[product._id] || {};
            ratings[product._id].rating = val;
            stars.forEach(s => {
              s.classList.toggle("selected", parseInt(s.dataset.value) <= val);
            });
          });
        });

        // Capture review text
        const textarea = div.querySelector(".ratingReview");
        textarea.addEventListener("input", () => {
          ratings[product._id] = ratings[product._id] || {};
          ratings[product._id].review = textarea.value;
        });

        ratings[product._id] = { productId: product._id, rating: 0, review: "" };
      }

      ratingsList.appendChild(div);
    }

    // If all products already rated show thank you, otherwise show submit button
    if (unratedCount === 0) {
      const thankYou = document.createElement("p");
      thankYou.className = "thankYouMsg";
      thankYou.style.cssText = "text-align: center; color: #4CAF50; font-weight: bold; font-size: 14px; margin-top: 12px;";
      thankYou.textContent = "✓ Thank you for your ratings!";
      ratingsSection.appendChild(thankYou);
    } else {
      submitRatingsBtn.style.display = "block";
    }

    // Submit all ratings
    submitRatingsBtn.onclick = async () => {
      let submitted = 0;
      let skipped = 0;

      for (const productId in ratings) {
        const r = ratings[productId];
        if (!r.rating || r.rating === 0) {
          skipped++;
          continue;
        }

        try {
          const res = await fetch("http://localhost:5000/api/ratings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              orderId: order._id,
              userId,
              username,
              rating: r.rating,
              review: r.review || ""
            })
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

      // Hide submit button and show thank you message permanently
      submitRatingsBtn.style.display = "none";
      const thankYou = document.createElement("p");
      thankYou.className = "thankYouMsg";
      thankYou.style.cssText = "text-align: center; color: #4CAF50; font-weight: bold; font-size: 14px; margin-top: 12px;";
      thankYou.textContent = "✓ Thank you for your ratings!";
      ratingsSection.appendChild(thankYou);

      // Reload the ratings form after 1 second to show filled stars
      setTimeout(() => {
        showRatingsForm(order);
      }, 1000);
    };
  }

});