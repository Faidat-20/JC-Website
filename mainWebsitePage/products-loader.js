document.addEventListener("DOMContentLoaded", async () => {

  const productList = document.querySelector(".productList");
  if (!productList) return;

  // Get current page name e.g. "mainWebsitePage.html"
  const currentPage = window.location.pathname.split("/").pop();

  try {
    // Fetch products for this page from MongoDB
    const res = await fetch(`http://localhost:5000/api/products/page/${currentPage}`);
    const data = await res.json();

    if (!data.success || data.products.length === 0) {
      productList.innerHTML = `<p style="color: #999; font-size: 14px;">No products found.</p>`;
      return;
    }

    // Clear any existing content
    productList.innerHTML = "";

    // Build each product card
    data.products.forEach(product => {
      const avg = product.averageRating || 0;
      const total = product.totalRatings || 0;

      // Build star display
      const filled = Math.round(avg);
      const starsHTML = "★".repeat(filled) + "☆".repeat(5 - filled);
      const ratingText = total === 0
        ? "No ratings yet"
        : `${avg.toFixed(1)} (${total} ${total === 1 ? "review" : "reviews"})`;

      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h2>${product.name}</h2>
        <div class="productRating" data-id="${product._id}" data-name="${product.name}">
          <span class="stars">${starsHTML}</span>
          <span class="ratingCount">${ratingText}</span>
        </div>
        <div class="price">₦${product.price.toLocaleString()}</div>
        <button class="addToCart ${product.inStock === false ? 'outOfStock' : ''}" 
          ${product.inStock === false ? 'disabled' : ''}>
          ${product.inStock === false ? 'Out of stock' : 'Add to Cart'}
        </button>
      `;

      // Click on rating to show reviews modal
      const ratingDiv = div.querySelector(".productRating");
      ratingDiv.style.cursor = "pointer";
      ratingDiv.title = "Click to see reviews";
      ratingDiv.addEventListener("click", () => {
        showReviewsModal(product);
      });

      productList.appendChild(div);
    });

    // Re-attach addToCart event listeners after products load
    reattachCartListeners();

  } catch (err) {
    console.error("Load products error:", err);
    productList.innerHTML = `<p style="color: #e74c3c; font-size: 14px;">Failed to load products. Make sure your server is running.</p>`;
  }
});

// ─────────────────────────────────────────
// REATTACH CART LISTENERS
// ─────────────────────────────────────────
// This is needed because addToCart buttons are created dynamically
// so the event listeners in mainWebsitePage.js won't catch them
function reattachCartListeners() {
  const userId = sessionStorage.getItem("userId");

  const addToCartButtons = document.querySelectorAll(".addToCart");

  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
      if (!userId) return showToast("error", "Please log in to add items to cart.");

      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const itemCard = button.closest(".item");
      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceText = itemCard.querySelector(".price").textContent;
      const price = Number(priceText.replace(/[₦,]/g, ""));
      const existingItem = cart.find(item => item.name === name);
      const addCartMessage = document.querySelector(".addCartMessage");

      if (existingItem) {
        existingItem.quantity++;
        if (addCartMessage) addCartMessage.textContent = "Product quantity updated in cart!";
      } else {
        cart.push({ name, image, price, quantity: 1 });
        if (addCartMessage) addCartMessage.textContent = "Added to cart!";
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

      // Show message
      if (addCartMessage) {
        addCartMessage.classList.add("show");
        setTimeout(() => addCartMessage.classList.remove("show"), 1200);
      }

      // Sync with backend
      try {
        const res = await fetch("http://localhost:5000/api/auth/update-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name,
            image,
            price,
            action: existingItem ? "update" : "add",
            quantity: existingItem ? existingItem.quantity : 1
          })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("cart", JSON.stringify(data.cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(data.cart) }));
        }
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    });
  });
}

// ─────────────────────────────────────────
// REVIEWS MODAL
// ─────────────────────────────────────────
async function showReviewsModal(product) {
  // Remove existing modal if any
  const existing = document.getElementById("reviewsModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "reviewsModal";
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
      <button id="closeReviewsModal" style="position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 22px; cursor: pointer; color: #999;">&times;</button>
      <h3 style="margin: 0 0 4px; font-size: 16px;">${product.name}</h3>
      <p style="font-size: 13px; color: #888; margin: 0 0 16px;">
        ${product.averageRating && product.totalRatings
          ? `Average: ${product.averageRating.toFixed(1)} ★ (${product.totalRatings} ${product.totalRatings === 1 ? "review" : "reviews"})`
          : "No ratings yet"}
      </p>
      <div id="reviewsList">
        <p style="color: #999; font-size: 13px;">Loading reviews...</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  // Close on X button click
  document.getElementById("closeReviewsModal").addEventListener("click", () => {
    modal.remove();
    document.body.style.overflow = "auto";
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
      document.body.style.overflow = "auto";
    }
  });

  // Fetch reviews
  try {
    const res = await fetch(`http://localhost:5000/api/ratings/${product._id}`);
    const data = await res.json();
    const reviewsList = document.getElementById("reviewsList");

    if (!data.success || data.ratings.length === 0) {
      reviewsList.innerHTML = `<p style="color: #999; font-size: 13px;">No reviews yet for this product.</p>`;
      return;
    }

    reviewsList.innerHTML = data.ratings.map(r => `
        <div style="border-bottom: 1px solid #f0f0f0; padding: 12px 0;">

            <!-- Top row: Username + Date -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 12px; font-weight: bold; color: #333;">
                ${r.username || "Anonymous"}
            </span>

            <span style="font-size: 12px; color: #aaa;">
                ${new Date(r.rating_created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric"
                })}
            </span>
            </div>

            <!-- Stars BELOW username -->
            <div style="margin-bottom: 6px; color: hsl(357, 45%, 69%); font-size: 14px;">
            ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
            </div>

            <!-- Review -->
            ${r.review ? `
            <p style="font-size: 13px; color: #555; margin: 0; font-style: italic;">
                "${r.review}"
            </p>
            ` : ""}

        </div>
    `).join("");
  } catch (err) {
    console.error("Load reviews error:", err);
    document.getElementById("reviewsList").innerHTML =
      `<p style="color: #e74c3c; font-size: 13px;">Failed to load reviews.</p>`;
  }
}