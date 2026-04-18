const BASE_URL = "https://jc-website.onrender.com";
// ADMIN PROTECTION
(async () => {
  const userId = sessionStorage.getItem("userId");

  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-admin`, {
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

  const adminTabs = document.querySelectorAll(".adminTab");
  const ordersSection = document.getElementById("ordersSection");
  const productsSection = document.getElementById("productsSection");

  adminTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      adminTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const archivedSection = document.getElementById("archivedSection");

      // Hide ALL sections first
      ordersSection.style.display = "none";
      archivedSection.style.display = "none";
      productsSection.style.display = "none";
      shippingSection.style.display = "none";

      // Show the one that was clicked
      if (tab.dataset.tab === "orders") {
        ordersSection.style.display = "block";
      } else if (tab.dataset.tab === "archived") {
        archivedSection.style.display = "block";
        loadArchivedOrders();
      } else if (tab.dataset.tab === "products") {
        productsSection.style.display = "block";
      } else if (tab.dataset.tab === "shipping") {
        shippingSection.style.display = "block";
        fetchShippingOptions();
      }
    });
  });
  
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
      const res = await fetch(`${BASE_URL}/api/orders/all`);
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
          ${order.paymentStatus === "refund_initiated" ? `<p><strong>Refund pending</strong></p>` : ""}
          ${order.order_refunded_at ? `<p><strong>Refunded:</strong> ${formatDateTime(order.order_refunded_at)}</p>` : ""}
        </div>

        <div class="orderCardRight">
          <span class="statusBadge ${order.status}">${order.status}</span>
          <span class="statusBadge ${order.paymentStatus === "refund_initiated" ? "refund-pending" : order.paymentStatus}">${order.paymentStatus === "refund_initiated" ? "Refund pending" : order.paymentStatus}</span>

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
            <button class="archiveBtn" data-id="${order._id}" title="Archive order"
              style="padding:8px 12px; background:#f5f5f5; color:#777; border:1px solid #ddd; border-radius:6px; font-size:12px; cursor:pointer;">
              <i class="fa-solid fa-box-archive"></i>
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

      // Archive button
      const archiveBtn = card.querySelector(".archiveBtn");
      archiveBtn.addEventListener("click", async () => {
        if (!confirm("Archive this order? It will be moved out of the main dashboard.")) return;
        try {
          const res = await fetch(`${BASE_URL}/api/orders/${order._id}/archive`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
          });
          const data = await res.json();
          if (data.success) {
            showToast("success", "Order archived!");
            allOrders = allOrders.filter(o => o._id !== order._id);
            renderOrders(allOrders);
          }
        } catch (err) {
          console.error("Archive error:", err);
        }
      });
      ordersContainer.appendChild(card);
    });
  }

  // -----------------------------
  // UPDATE ORDER STATUS
  // -----------------------------
  async function updateOrderStatus(orderId, status) {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        return true;
      } else {
        showToast("error", "Failed to update order status.");
        return false;
      }
    } catch (err) {
      console.error("Update status error:", err);
      showToast("error", "Server error.");
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
        <p><strong>Payment:</strong> ${order.paymentStatus === "refund_initiated" ? "Refund pending" : order.paymentStatus}</p>
        <p><strong>Order placed:</strong> ${formatDateTime(order.order_created_at)}</p>
        ${order.order_shipped_at ? `<p><strong>Shipped:</strong> ${formatDateTime(order.order_shipped_at)}</p>` : ""}
        ${order.order_delivered_at ? `<p><strong>Delivered:</strong> ${formatDateTime(order.order_delivered_at)}</p>` : ""}
        ${order.status === "cancelled" ? `<p><strong>Cancelled:</strong> ${formatDateTime(order.updatedAt)}</p>` : ""}
        ${order.paymentStatus === "refund_initiated" ? `<p><strong>Refund status:</strong> Pending (5-10 business days)</p>` : ""}
        ${order.order_refunded_at ? `<p><strong>Refunded:</strong> ${formatDateTime(order.order_refunded_at)}</p>` : ""}
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

  // -----------------------------
  // ARCHIVED ORDERS
  // -----------------------------
  async function loadArchivedOrders() {
    const archivedContainer = document.getElementById("archivedContainer");
    const archivedCount = document.getElementById("archivedCount");

    try {
      archivedContainer.innerHTML = `<p class="loadingMsg">Loading archived orders...</p>`;
      const res = await fetch(`${BASE_URL}/api/orders/archived`);
      const data = await res.json();

      if (!data.success || data.orders.length === 0) {
        archivedContainer.innerHTML = `<p class="noOrders">No archived orders found.</p>`;
        archivedCount.textContent = "0 orders";
        return;
      }

      archivedCount.textContent = `${data.orders.length} ${data.orders.length === 1 ? "order" : "orders"}`;
      archivedContainer.innerHTML = "";

      data.orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "orderCard";

        card.innerHTML = `
          <div class="orderCardLeft">
            <h3>Tracking ID: ${order.trackingId}</h3>
            <p><strong>Customer:</strong> ${order.deliveryDetails?.firstName || ""} ${order.deliveryDetails?.lastName || ""}</p>
            <p><strong>Phone:</strong> ${order.deliveryDetails?.phone || "N/A"}</p>
            <p><strong>Total:</strong> ₦${order.total?.toLocaleString()}</p>
            <p><strong>Order placed:</strong> ${formatDateTime(order.order_created_at)}</p>
            <p><strong>Archived:</strong> ${formatDateTime(order.order_archived_at)}</p>
          </div>
          <div class="orderCardRight">
            <span class="statusBadge ${order.status}">${order.status}</span>
            <span class="statusBadge ${order.paymentStatus === "refund_initiated" ? "refund-pending" : order.paymentStatus}">
              ${order.paymentStatus === "refund_initiated" ? "Refund pending" : order.paymentStatus}
            </span>
            <div class="orderCardActions">
              <button class="viewBtn unarchiveBtn" data-id="${order._id}">
                <i class="fa-solid fa-box-open"></i> Unarchive
              </button>
              <button class="viewBtn" data-id="${order._id}" style="background:#555;">
                <i class="fa-solid fa-eye"></i> View
              </button>
            </div>
          </div>
        `;

        // Unarchive button
        card.querySelector(".unarchiveBtn").addEventListener("click", async () => {
          if (!confirm("Move this order back to active orders?")) return;
          try {
            const res = await fetch(`${BASE_URL}/api/orders/${order._id}/unarchive`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.success) {
              showToast("success", "Order unarchived successfully!");
              loadArchivedOrders();
              fetchOrders();
            }
          } catch (err) {
            console.error("Unarchive error:", err);
          }
        });

        // View button
        card.querySelector(".viewBtn:not(.unarchiveBtn)").addEventListener("click", () => {
          showOrderModal(order);
        });

        archivedContainer.appendChild(card);
      });

    } catch (err) {
      console.error("Load archived orders error:", err);
      archivedContainer.innerHTML = `<p class="noOrders">Failed to load archived orders.</p>`;
    }
  }
  // -----------------------------
  // PRODUCT MANAGEMENT
  // -----------------------------
  const addProductBtn = document.getElementById("addProductBtn");
  const addProductForm = document.getElementById("addProductForm");
  const cancelAddProductBtn = document.getElementById("cancelAddProductBtn");
  const saveNewProductBtn = document.getElementById("saveNewProductBtn");
  const adminProductsList = document.getElementById("adminProductsList");

  let allProducts = [];

  // Load all products
  async function fetchProducts() {
    try {
      const res = await fetch(`${BASE_URL}/api/products`);
      const data = await res.json();
      if (data.success) {
        allProducts = data.products;
        populatePageSelector("newProductPage");
        filterAndRenderProducts();
      }
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  }

  // Render product cards
  function renderProducts(products) {
    adminProductsList.innerHTML = "";

    if (products.length === 0) {
      adminProductsList.innerHTML = `<p class="noOrders">No products found.</p>`;
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "adminProductCard";
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}"
          onerror="this.src='https://via.placeholder.com/260x140?text=No+Image'">
        <h4>${product.name}</h4>
        <p class="productPrice">₦${product.price.toLocaleString()}</p>
        <p class="productPage">${product.page}</p>
        ${product.hasVariants ? `
          <p style="font-size:11px; color: hsl(357,45%,69%); font-weight:bold;">
            Has variants (${product.variantType}) — ${product.variants?.length || 0} options
          </p>
        ` : ""}

        <button class="stockToggleBtn ${product.inStock !== false ? "inStock" : "outOfStock"}"
          data-id="${product._id}" data-stock="${product.inStock !== false}">
          ${product.inStock !== false ? "✓ In Stock" : "✗ Out of Stock"}
        </button>

        <div class="adminProductCardActions">
          <button class="editProductBtn" data-id="${product._id}">Edit</button>
          <button class="deleteProductBtn" data-id="${product._id}">Delete</button>
        </div>
      `;

      // Toggle stock
      const stockBtn = card.querySelector(".stockToggleBtn");
      stockBtn.addEventListener("click", async () => {
        const currentStock = stockBtn.dataset.stock === "true";
        const newStock = !currentStock;

        const confirmMsg = newStock
          ? `Mark "${product.name}" as IN STOCK?`
          : `Mark "${product.name}" as OUT OF STOCK?`;
        if (!confirm(confirmMsg)) return;

        try {
          const res = await fetch(`${BASE_URL}/api/products/${product._id}/stock`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inStock: newStock })
          });
          const data = await res.json();
          if (data.success) {
            product.inStock = newStock;
            stockBtn.dataset.stock = newStock;
            stockBtn.textContent = newStock ? "✓ In Stock" : "✗ Out of Stock";
            stockBtn.className = `stockToggleBtn ${newStock ? "inStock" : "outOfStock"}`;
          }
        } catch (err) {
          console.error("Toggle stock error:", err);
        }
      });

      // Edit product — open modal

      const editBtn = card.querySelector(".editProductBtn");
      editBtn.addEventListener("click", () => {
        openEditModal(product);
      });

      // Delete product
      const deleteBtn = card.querySelector(".deleteProductBtn");
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

        try {
          const res = await fetch(`${BASE_URL}/api/products/${product._id}`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (data.success) {
            alert("Product deleted!");
            fetchProducts();
          } else {
            alert(data.message || "Failed to delete product.");
          }
        } catch (err) {
          console.error("Delete product error:", err);
        }
      });

      adminProductsList.appendChild(card);
    });
  }

  // Show/hide add product form
  addProductBtn.addEventListener("click", () => {
    addProductForm.style.display =
      addProductForm.style.display === "none" ? "block" : "none";
  });

  cancelAddProductBtn.addEventListener("click", () => {
    addProductForm.style.display = "none";
  });

  // Image preview for add form
  document.getElementById("newProductImageFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById("newProductImagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });

  // VARIANTS
  const hasVariantsCheckbox = document.getElementById("hasVariants");
  const variantsSection = document.getElementById("variantsSection");
  const variantsList = document.getElementById("variantsList");
  const addVariantBtn = document.getElementById("addVariantBtn");

  hasVariantsCheckbox.addEventListener("change", () => {
    variantsSection.style.display = hasVariantsCheckbox.checked ? "block" : "none";
  });

  function addVariantRow(label = "", price = "") {
    const row = document.createElement("div");
    row.className = "variantRow";
    row.innerHTML = `
      <input type="text" placeholder="Label (e.g. 12pcs, Red, Small)" value="${label}" class="variantLabel">
      <input type="number" placeholder="Price (₦)" value="${price}" class="variantPrice">
      <button type="button" class="removeVariantBtn">✕</button>
    `;
    row.querySelector(".removeVariantBtn").addEventListener("click", () => row.remove());
    variantsList.appendChild(row);
  }

  addVariantBtn.addEventListener("click", () => addVariantRow());

  function getVariants() {
    const rows = variantsList.querySelectorAll(".variantRow");
    const variants = [];
    rows.forEach(row => {
      const label = row.querySelector(".variantLabel").value.trim();
      const price = Number(row.querySelector(".variantPrice").value);
      if (label && price) variants.push({ label, price });
    });
    return variants;
  }
  // Save new product
  saveNewProductBtn.addEventListener("click", async () => {
    const name = document.getElementById("newProductName").value.trim();
    const price = Number(document.getElementById("newProductPrice").value);
    const page = document.getElementById("newProductPage").value;
    const fileInput = document.getElementById("newProductImageFile");
    const hasVariants = document.getElementById("hasVariants").checked;
    const variantType = document.getElementById("variantType").value;
    const variants = hasVariants ? getVariants() : [];
    const description = document.getElementById("newProductDescription").value.trim();

    if (!name || !price || !page) return alert("Please fill in all fields.");
    if (!fileInput.files[0]) return alert("Please select an image.");
    if (hasVariants && variants.length === 0) return alert("Please add at least one variant.");

    const imageUrls = await uploadMultipleImages(fileInput.files, "uploadStatus");
    if (!imageUrls || imageUrls.length === 0) return alert("Image upload failed. Please try again.");

    try {
      const res = await fetch(`${BASE_URL}/api/products/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image: imageUrls[0],
          images: imageUrls,
          price,
          page,
          hasVariants,
          variantType: hasVariants ? variantType : null,
          variants,
          description
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Product added successfully!");
        addProductForm.style.display = "none";
        document.getElementById("newProductName").value = "";
        document.getElementById("newProductImageFile").value = "";
        document.getElementById("newProductImagePreview").style.display = "none";
        document.getElementById("newProductPrice").value = "";
        document.getElementById("uploadStatus").textContent = "";
        document.getElementById("hasVariants").checked = false;
        document.getElementById("newProductDescription").value = "";
        variantsSection.style.display = "none";
        variantsList.innerHTML = "";
        fetchProducts();
      } else {
        alert(data.message || "Failed to add product.");
      }
    } catch (err) {
      console.error("Add product error:", err);
    }
  });

  // -----------------------------
  // EDIT PRODUCT MODAL
  // -----------------------------
  const editProductModal = document.getElementById("editProductModal");
  const closeEditProductModal = document.getElementById("closeEditProductModal");
  const cancelEditProductBtn = document.getElementById("cancelEditProductBtn");
  const saveEditProductBtn = document.getElementById("saveEditProductBtn");
  const editProductHasVariants = document.getElementById("editProductHasVariants");
  const editProductVariantsSection = document.getElementById("editProductVariantsSection");
  const editProductAddVariantBtn = document.getElementById("editProductAddVariantBtn");
  const editProductVariantsList = document.getElementById("editProductVariantsList");

  function openEditModal(product) {
    // Populate fields
    document.getElementById("editProductId").value = product._id;
    document.getElementById("editProductName").value = product.name;
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductImage").value = product.image;
    document.getElementById("editProductImageFile").value = "";
    document.getElementById("editProductUploadStatus").textContent = "";

    // Image preview
    const preview = document.getElementById("editProductPreview");
    preview.src = product.image;

    // Variants
    document.getElementById("editProductDescription").value = product.description || "";
    editProductHasVariants.checked = product.hasVariants || false;
    editProductVariantsSection.style.display = product.hasVariants ? "block" : "none";
    document.getElementById("editProductVariantType").value = product.variantType || "size";

    // Populate existing variants
    editProductVariantsList.innerHTML = "";
    (product.variants || []).forEach(v => {
      addEditVariantRow(v.label, v.price);
    });

    // Show modal
    editProductModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // Close modal
  closeEditProductModal.addEventListener("click", () => {
    editProductModal.style.display = "none";
    document.body.style.overflow = "auto";
  });

  cancelEditProductBtn.addEventListener("click", () => {
    editProductModal.style.display = "none";
    document.body.style.overflow = "auto";
  });

  editProductModal.addEventListener("click", (e) => {
    if (e.target === editProductModal) {
      editProductModal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });

  // Has variants toggle
  editProductHasVariants.addEventListener("change", () => {
    editProductVariantsSection.style.display = editProductHasVariants.checked ? "block" : "none";
  });

  // Add variant row
  function addEditVariantRow(label = "", price = "") {
    const row = document.createElement("div");
    row.className = "variantRow";
    row.innerHTML = `
      <input type="text" placeholder="Label (e.g. 12pcs, Red)" value="${label}" class="variantLabel">
      <input type="number" placeholder="Price (₦)" value="${price}" class="variantPrice">
      <button type="button" class="removeVariantBtn">✕</button>
    `;
    row.querySelector(".removeVariantBtn").addEventListener("click", () => row.remove());
    editProductVariantsList.appendChild(row);
  }

  editProductAddVariantBtn.addEventListener("click", () => addEditVariantRow());

  // Image preview
  document.getElementById("editProductImageFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById("editProductPreview").src = URL.createObjectURL(file);
  });

  // Save edit
  saveEditProductBtn.addEventListener("click", async () => {
    const productId = document.getElementById("editProductId").value;
    const name = document.getElementById("editProductName").value.trim();
    const price = Number(document.getElementById("editProductPrice").value);
    const hasVariants = editProductHasVariants.checked;
    const variantType = document.getElementById("editProductVariantType").value;
    const fileInput = document.getElementById("editProductImageFile");
    const description = document.getElementById("editProductDescription").value.trim();

    if (!name || !price) return alert("Name and price are required.");

    // Get variants
    const variantRows = editProductVariantsList.querySelectorAll(".variantRow");
    const variants = [];
    variantRows.forEach(row => {
      const label = row.querySelector(".variantLabel").value.trim();
      const vPrice = Number(row.querySelector(".variantPrice").value);
      if (label && vPrice) variants.push({ label, price: vPrice });
    });

    if (hasVariants && variants.length === 0) return alert("Please add at least one variant.");

    let image = document.getElementById("editProductImage").value;
    let images = [];

    if (fileInput.files.length > 0) {
      const uploaded = await uploadMultipleImages(fileInput.files, "editProductUploadStatus");
      if (!uploaded) return alert("Image upload failed. Please try again.");
      image = uploaded[0];
      images = uploaded;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, image, images, price,
          hasVariants,
          variantType: hasVariants ? variantType : null,
          variants: hasVariants ? variants : [],
          description
        })
      });
      const data = await res.json();
      if (data.success) {
        editProductModal.style.display = "none";
        document.body.style.overflow = "auto";
        fetchProducts();
      } else {
        alert(data.message || "Failed to update product.");
      }
    } catch (err) {
      console.error("Edit product error:", err);
    }
  });
  // -----------------------------
  // PRODUCT SEARCH AND FILTER
  // -----------------------------
  const productSearchInput = document.getElementById("productSearchInput");
  const productFilterBtns = document.querySelectorAll(".productFilterBtn");
  let currentProductFilter = "all";

  productSearchInput.addEventListener("input", () => {
    filterAndRenderProducts();
  });

  productFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      productFilterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentProductFilter = btn.dataset.filter;
      filterAndRenderProducts();
    });
  });

  function filterAndRenderProducts() {
    const searchTerm = productSearchInput.value.toLowerCase().trim();

    let filtered = allProducts;

    // Apply stock filter
    if (currentProductFilter === "inStock") {
      filtered = filtered.filter(p => p.inStock !== false);
    } else if (currentProductFilter === "outOfStock") {
      filtered = filtered.filter(p => p.inStock === false);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm)
      );
    }

    renderProducts(filtered);
  }

  // Populate page selector dynamically
  function populatePageSelector(selectId, currentValue = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const totalProducts = allProducts.length;
    const productsPerPage = 8;
    const totalPages = Math.max(Math.ceil(totalProducts / productsPerPage) + 1, 5);

    select.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const option = document.createElement("option");
      if (i === 1) {
        option.value = "mainWebsitePage.html";
        option.textContent = "Page 1 (Home)";
      } else {
        option.value = `shop.html`;
        option.textContent = `Page ${i} (Shop)`;
      }
      if (currentValue && option.value === currentValue) {
        option.selected = true;
      }
      select.appendChild(option);
    }
  }

  async function uploadMultipleImages(files, statusElId) {
    console.log("Files being sent:", Array.from(files).map(f => f.name));
    const statusEl = document.getElementById(statusElId);
    if (statusEl) statusEl.textContent = "Uploading images...";

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("images", file));

    try {
      const res = await fetch(`${BASE_URL}/api/products/upload-images`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (statusEl) statusEl.textContent = `${data.imageUrls.length} image(s) uploaded ✅`;
        return data.imageUrls;
      } else {
        if (statusEl) statusEl.textContent = "Upload failed";
        return null;
      }
    } catch (err) {
      console.error("Multi-upload error:", err);
      if (statusEl) statusEl.textContent = "Upload failed";
      return null;
    }
  }
  // Upload image to Cloudinary
  async function uploadImage(file, statusElId) {
    const statusEl = document.getElementById(statusElId);
    if (statusEl) statusEl.textContent = "Uploading...";

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${BASE_URL}/api/products/upload-image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (statusEl) statusEl.textContent = "Image uploaded ✅";
        return data.imageUrl;
      } else {
        if (statusEl) statusEl.textContent = "Upload failed";
        return null;
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (statusEl) statusEl.textContent = "Upload failed";
      return null;
    }
  }
  // Initial load
  fetchProducts();

  // ─────────────────────────────────────────
  // SHIPPING MANAGEMENT
  // ─────────────────────────────────────────
  const shippingSection = document.getElementById("shippingSection");
  const addShippingBtn = document.getElementById("addShippingBtn");
  const addShippingForm = document.getElementById("addShippingForm");
  const cancelAddShippingBtn = document.getElementById("cancelAddShippingBtn");
  const saveNewShippingBtn = document.getElementById("saveNewShippingBtn");
  const shippingOptionsList = document.getElementById("shippingOptionsList");

  let allShippingOptions = [];

  async function fetchShippingOptions() {
    try {
      const res = await fetch(`${BASE_URL}/api/shipping/all`);
      const data = await res.json();
      if (data.success) {
        allShippingOptions = data.options;
        renderShippingOptions();
      }
    } catch (err) {
      console.error("Fetch shipping options error:", err);
    }
  }

  function renderShippingOptions() {
    shippingOptionsList.innerHTML = "";

    if (allShippingOptions.length === 0) {
      shippingOptionsList.innerHTML = `<p class="noOrders">No shipping options yet. Add one above.</p>`;
      return;
    }

    allShippingOptions.forEach(opt => {
      const card = document.createElement("div");
      card.className = "orderCard";
      card.style.flexDirection = "column";
      card.style.alignItems = "stretch";
      card.style.gap = "10px";

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
          <div style="flex:1;">
            <p style="font-weight:bold; font-size:14px; margin-bottom:4px;">${opt.name}</p>
            <p style="font-size:12px; color:#666; margin-bottom:4px;">${opt.desc || "No description"}</p>
            <p style="font-size:13px; font-weight:600; color:#222;">₦${opt.price.toLocaleString()}</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span class="statusBadge ${opt.isActive ? "delivered" : "cancelled"}" style="cursor:pointer;" 
              data-id="${opt._id}" data-active="${opt.isActive}">
              ${opt.isActive ? "Active" : "Inactive"}
            </span>
            <button class="editShippingBtn viewBtn" data-id="${opt._id}" 
              style="background:#e8f0fe; color:#1a56db;">Edit</button>
            <button class="deleteShippingBtn viewBtn" data-id="${opt._id}" 
              style="background:#fce8e8; color:#c0392b;">Delete</button>
          </div>
        </div>

        <!-- inline edit form (hidden by default) -->
        <div class="editShippingForm" id="editForm-${opt._id}" style="display:none; flex-direction:column; gap:8px; margin-top:8px; border-top:1px solid #eee; padding-top:12px;">
          <input type="text" class="editShippingName" value="${opt.name}" 
            style="padding:8px 12px; border:1px solid #ddd; border-radius:8px; font-size:13px;">
          <textarea class="editShippingDesc" rows="3"
            style="padding:8px 12px; border:1px solid #ddd; border-radius:8px; font-size:13px; resize:vertical;">${opt.desc || ""}</textarea>
          <input type="number" class="editShippingPrice" value="${opt.price}" 
            style="padding:8px 12px; border:1px solid #ddd; border-radius:8px; font-size:13px;">
          <div style="display:flex; gap:8px;">
            <button class="saveShippingEditBtn saveProductBtn" data-id="${opt._id}">Save</button>
            <button class="cancelShippingEditBtn cancelProductBtn" data-id="${opt._id}">Cancel</button>
          </div>
        </div>
      `;

      // Toggle active/inactive
      card.querySelector(".statusBadge").addEventListener("click", async (e) => {
        const isActive = e.target.dataset.active === "true";
        try {
          const res = await fetch(`${BASE_URL}/api/shipping/${opt._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...opt, isActive: !isActive })
          });
          const data = await res.json();
          if (data.success) {
            fetchShippingOptions();
            showToast("success", `Option marked as ${!isActive ? "active" : "inactive"}`);
          }
        } catch (err) {
          console.error("Toggle shipping error:", err);
        }
      });

      // Open edit form
      card.querySelector(".editShippingBtn").addEventListener("click", () => {
        const form = document.getElementById(`editForm-${opt._id}`);
        form.style.display = form.style.display === "none" ? "flex" : "none";
      });

      // Save edit
      card.querySelector(".saveShippingEditBtn").addEventListener("click", async () => {
        const form = document.getElementById(`editForm-${opt._id}`);
        const name = form.querySelector(".editShippingName").value.trim();
        const desc = form.querySelector(".editShippingDesc").value.trim();
        const price = Number(form.querySelector(".editShippingPrice").value);

        if (!name || price == null) return showToast("error", "Name and price are required.");

        try {
          const res = await fetch(`${BASE_URL}/api/shipping/${opt._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, desc, price, isActive: opt.isActive })
          });
          const data = await res.json();
          if (data.success) {
            showToast("success", "Shipping option updated!");
            fetchShippingOptions();
          }
        } catch (err) {
          console.error("Edit shipping error:", err);
        }
      });

      // Cancel edit
      card.querySelector(".cancelShippingEditBtn").addEventListener("click", () => {
        document.getElementById(`editForm-${opt._id}`).style.display = "none";
      });

      // Delete
      card.querySelector(".deleteShippingBtn").addEventListener("click", async () => {
        if (!confirm(`Delete "${opt.name}"?`)) return;
        try {
          const res = await fetch(`${BASE_URL}/api/shipping/${opt._id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast("success", "Shipping option deleted!");
            fetchShippingOptions();
          }
        } catch (err) {
          console.error("Delete shipping error:", err);
        }
      });

      shippingOptionsList.appendChild(card);
    });
  }

  addShippingBtn.addEventListener("click", () => {
    addShippingForm.style.display = addShippingForm.style.display === "none" ? "block" : "none";
  });

  cancelAddShippingBtn.addEventListener("click", () => {
    addShippingForm.style.display = "none";
  });

  saveNewShippingBtn.addEventListener("click", async () => {
    const name = document.getElementById("newShippingName").value.trim();
    const desc = document.getElementById("newShippingDesc").value.trim();
    const price = Number(document.getElementById("newShippingPrice").value);

    if (!name || price == null || document.getElementById("newShippingPrice").value === "") {
      return showToast("error", "Name and price are required.");
    }

    try {
      const res = await fetch(`${BASE_URL}/api/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc, price })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Shipping option added!");
        addShippingForm.style.display = "none";
        document.getElementById("newShippingName").value = "";
        document.getElementById("newShippingDesc").value = "";
        document.getElementById("newShippingPrice").value = "";
        fetchShippingOptions();
      }
    } catch (err) {
      console.error("Add shipping error:", err);
    }
  });
});