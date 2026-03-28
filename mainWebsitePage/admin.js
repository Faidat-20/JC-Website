document.addEventListener("DOMContentLoaded", async () => {

  const ordersContainer = document.getElementById("ordersContainer");
  const orderCount = document.getElementById("orderCount");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBody = document.getElementById("modalBody");
  const closeModal = document.getElementById("closeModal");
  const filterBtns = document.querySelectorAll(".filterBtn");

  let allOrders = [];
  let currentFilter = "all";

  // -----------------------------
  // FETCH ALL ORDERS
  // -----------------------------
  async function fetchOrders() {
    try {
      const res = await fetch("http://localhost:5000/api/orders/all");
      const data = await res.json();
      if (data.success) {
        allOrders = data.orders;
        renderOrders(allOrders);
      } else {
        ordersContainer.innerHTML = `<p class="noOrders">Failed to load orders.</p>`;
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      ordersContainer.innerHTML = `<p class="noOrders">Server error. Make sure your backend is running.</p>`;
    }
  }

  // -----------------------------
  // RENDER ORDERS
  // -----------------------------
  function renderOrders(orders) {
    ordersContainer.innerHTML = "";

    // filter orders
    const filtered = currentFilter === "all"
      ? orders
      : orders.filter(order => order.status === currentFilter);

    // update order count
    orderCount.textContent = `${filtered.length} ${filtered.length === 1 ? "order" : "orders"}`;

    if (filtered.length === 0) {
      ordersContainer.innerHTML = `<p class="noOrders">No ${currentFilter === "all" ? "" : currentFilter} orders found.</p>`;
      return;
    }

    filtered.forEach(order => {
      const card = document.createElement("div");
      card.className = "orderCard";

      const date = new Date(order.order_created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      });

      card.innerHTML = `
        <div class="orderCardLeft">
          <h3>Tracking ID: ${order.trackingId}</h3>
          <p><strong>Customer:</strong> ${order.deliveryDetails?.firstName || ""} ${order.deliveryDetails?.lastName || ""}</p>
          <p><strong>Phone:</strong> ${order.deliveryDetails?.phone || "N/A"}</p>
          <p><strong>Total:</strong> ₦${order.total?.toLocaleString()}</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>

        <div class="orderCardRight">
          <span class="statusBadge ${order.status}">${order.status}</span>

          <div class="orderCardActions">
            <select class="statusSelect" data-id="${order._id}">
              <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
              <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
              <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
              <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
            </select>

            <button class="viewBtn" data-id="${order._id}">
              <i class="fa-solid fa-eye"></i> View
            </button>
          </div>
        </div>
      `;

      // UPDATE STATUS
      const statusSelect = card.querySelector(".statusSelect");
      statusSelect.addEventListener("change", async () => {
        const newStatus = statusSelect.value;
        const success = await updateOrderStatus(order._id, newStatus);
        if (success) {
          order.status = newStatus;
          renderOrders(allOrders);
        }
      });

      // VIEW ORDER DETAILS
      const viewBtn = card.querySelector(".viewBtn");
      viewBtn.addEventListener("click", () => {
        showOrderModal(order);
      });

      ordersContainer.appendChild(card);
    });
  }

  // -----------------------------
  // UPDATE ORDER STATUS
  // -----------------------------
  async function updateOrderStatus(orderId, status) {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        return true;
      } else {
        alert("Failed to update order status.");
        return false;
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("Server error.");
      return false;
    }
  }

  // -----------------------------
  // SHOW ORDER MODAL
  // -----------------------------
  function showOrderModal(order) {
    const date = new Date(order.order_created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric"
    });

    modalBody.innerHTML = `
      <div class="modalSection">
        <h3>Order Info</h3>
        <p><strong>Tracking ID:</strong> ${order.trackingId}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Date:</strong> ${date}</p>
      </div>

      <div class="modalSection">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${order.deliveryDetails?.firstName || ""} ${order.deliveryDetails?.lastName || ""}</p>
        <p><strong>Phone:</strong> ${order.deliveryDetails?.phone || "N/A"}</p>
        <p><strong>Email:</strong> ${order.deliveryDetails?.email || "N/A"}</p>
        <p><strong>Address:</strong> ${order.deliveryDetails?.address || "N/A"}</p>
        <p><strong>State:</strong> ${order.deliveryDetails?.state || "N/A"}</p>
        <p><strong>Country:</strong> ${order.deliveryDetails?.country || "N/A"}</p>
      </div>

      <div class="modalSection">
        <h3>Items Ordered</h3>
        ${order.items.map(item => `
          <div class="modalOrderItem">
            <img src="${item.image}" alt="${item.name}">
            <div>
              <p><strong>${item.name}</strong></p>
              <p>₦${item.price?.toLocaleString()} × ${item.quantity}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="modalSection">
        <h3>Payment Summary</h3>
        <p><strong>Subtotal:</strong> ₦${order.subtotal?.toLocaleString()}</p>
        <p><strong>Shipping:</strong> ₦${order.shippingFee?.toLocaleString()} (${order.shippingOption?.name || "N/A"})</p>
        <p><strong>Total:</strong> ₦${order.total?.toLocaleString()}</p>
      </div>
    `;

    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // -----------------------------
  // CLOSE MODAL
  // -----------------------------
  closeModal.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  });

  // -----------------------------
  // FILTER BUTTONS
  // -----------------------------
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.status;
      renderOrders(allOrders);
    });
  });

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  fetchOrders();
});