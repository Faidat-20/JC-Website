// ADMIN PROTECTION
(async () => {
  const userId = sessionStorage.getItem("userId");

  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/check-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();

    if (data.success) {
      // Admin verified — show the page
      document.documentElement.style.display = "";
    } else {
      // Not an admin — redirect immediately
      window.location.href = "mainWebsitePage.html";
    }
  } catch (err) {
    console.error("Admin check error:", err);
    window.location.href = "mainWebsitePage.html";
  }
})();

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
  // ALLOWED STATUS OPTIONS
  // -----------------------------
  function getAllowedOptions(currentStatus, paymentStatus) {
    switch (currentStatus) {
      case "pending":
        if (paymentStatus !== "paid") {
          // not paid yet — can only cancel
          return [
            { value: "pending", label: "Pending" },
            { value: "cancelled", label: "Cancelled" }
          ];
        }
        // paid — can ship or cancel
        return [
          { value: "pending", label: "Pending" },
          { value: "shipped", label: "Shipped" },
          { value: "cancelled", label: "Cancelled" }
        ];
      case "shipped":
        return [
          { value: "shipped", label: "Shipped" },
          { value: "delivered", label: "Delivered" }
        ];
      case "delivered":
        return [{ value: "delivered", label: "Delivered" }];
      case "cancelled":
        return [{ value: "cancelled", label: "Cancelled" }];
      default:
        return [{ value: currentStatus, label: currentStatus }];
    }
  }

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

    const filtered = currentFilter === "all"
      ? orders
      : orders.filter(order => order.status === currentFilter);

    orderCount.textContent = `${filtered.length} ${filtered.length === 1 ? "order" : "orders"}`;

    if (filtered.length === 0) {
      ordersContainer.innerHTML = `<p class="noOrders">No ${currentFilter === "all" ? "" : currentFilter} orders found.</p>`;
      return;
    }

    filtered.forEach(order => {
      const card = document.createElement("div");
      card.className = "orderCard";

      const date = formatDateTime(order.order_created_at);

      const isLocked = order.status === "delivered" || order.status === "cancelled";
      const allowedOptions = getAllowedOptions(order.status, order.paymentStatus);

      card.innerHTML = `
        <div class="orderCardLeft">
          <h3>Tracking ID: ${order.trackingId}</h3>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Customer:</strong> ${order.deliveryDetails?.firstName || ""} ${order.deliveryDetails?.lastName || ""}</p>
          <p><strong>Phone:</strong> ${order.deliveryDetails?.phone || "N/A"}</p>
          <p><strong>Total:</strong> ₦${order.total?.toLocaleString()}</p>
          <p><strong>Order placed:</strong> ${date}</p>
          ${order.order_shipped_at ? `<p><strong>Shipped:</strong> ${formatDateTime(order.order_shipped_at)}</p>` : ""}
          ${order.order_delivered_at ? `<p><strong>Delivered:</strong> ${formatDateTime(order.order_delivered_at)}</p>` : ""}
          ${order.status === "cancelled" ? `<p><strong>Cancelled:</strong> ${formatDateTime(order.updatedAt)}</p>` : ""}
        </div>

        <div class="orderCardRight">
          <span class="statusBadge ${order.status}">${order.status}</span>
          <span class="statusBadge ${order.paymentStatus}">${order.paymentStatus}</span>

          <div class="orderCardActions">
            <select class="statusSelect" data-id="${order._id}" ${isLocked ? "disabled" : ""}>
              ${allowedOptions.map(opt => `
                <option value="${opt.value}" ${order.status === opt.value ? "selected" : ""}>
                  ${opt.label}
                </option>
              `).join("")}
            </select>

            <button class="viewBtn" data-id="${order._id}">
              <i class="fa-solid fa-eye"></i> View
            </button>
          </div>
        </div>
      `;

      // UPDATE STATUS
      const statusSelect = card.querySelector(".statusSelect");
      if (!isLocked) {
        statusSelect.addEventListener("change", async () => {
          const newStatus = statusSelect.value;
          const success = await updateOrderStatus(order._id, newStatus);
          if (success) {
            order.status = newStatus;
            renderOrders(allOrders);
          }
        });
      }

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
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Payment:</strong> ${order.paymentStatus}</p>
        <p><strong>Order placed:</strong> ${formatDateTime(order.order_created_at)}</p>
        ${order.order_shipped_at ? `<p><strong>Shipped:</strong> ${formatDateTime(order.order_shipped_at)}</p>` : ""}
        ${order.order_delivered_at ? `<p><strong>Delivered:</strong> ${formatDateTime(order.order_delivered_at)}</p>` : ""}
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
      showSpinner();
      setTimeout(() => {
        renderOrders(allOrders);
        hideSpinner();
      }, 800);
    });
  });

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  fetchOrders();
});