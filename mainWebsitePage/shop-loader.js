document.addEventListener("DOMContentLoaded", async () => {

  const productList = document.getElementById("productList");
  const paginationDiv = document.getElementById("pagination");
  if (!productList) return;

  // Get page number from URL — e.g. shop.html?page=2
  const params = new URLSearchParams(window.location.search);
  const currentPage = parseInt(params.get("page")) || 1;

  await loadProducts(currentPage);

 async function loadProducts(page) {
  try {
    // Show skeleton cards while loading
    productList.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const skeleton = document.createElement("div");
      skeleton.className = "item skeletonCard";
      skeleton.innerHTML = `
        <div class="skeletonImg"></div>
        <div class="skeletonLine skeletonTitle"></div>
        <div class="skeletonLine skeletonStars"></div>
        <div class="skeletonLine skeletonPrice"></div>
        <div class="skeletonLine skeletonBtn"></div>
      `;
      productList.appendChild(skeleton);
    }
      const res = await fetch(`http://localhost:5000/api/products/paginate?page=${page}&limit=8`);
      const data = await res.json();

      if (!data.success || data.products.length === 0) {
        productList.innerHTML = `<p style="color:#999; font-size:14px;">No products found.</p>`;
        return;
      }

      productList.innerHTML = "";

      data.products.forEach(product => {
        const avg = product.averageRating || 0;
        const total = product.totalRatings || 0;
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
          ${product.hasVariants
            ? product.inStock === false
              ? `<button class="addToCart outOfStock" disabled>Out of stock</button>`
              : `<button class="addToCart viewOptions" onclick="window.location.href='product.html?name=${encodeURIComponent(product.name.replace(/\s+/g, '-'))}'">`
            : `<button class="addToCart ${product.inStock === false ? 'outOfStock' : ''}" 
                ${product.inStock === false ? 'disabled' : ''}>
                ${product.inStock === false ? 'Out of stock' : 'Add to Cart'}
              </button>`
          }
        `;

        const ratingDiv = div.querySelector(".productRating");
        ratingDiv.style.cursor = "pointer";
        ratingDiv.title = "Click to see reviews";
        ratingDiv.addEventListener("click", () => showReviewsModal(product));

        productList.appendChild(div);
      });

      reattachCartListeners();
      renderPagination(data.currentPage, data.totalPages);

    } catch (err) {
      console.error("Load products error:", err);
      productList.innerHTML = `
        <div style="text-align:center; padding:40px 0; color:#e74c3c;">
          <p style="font-size:14px; margin-bottom:8px;">Failed to load products.</p>
          <button onclick="location.reload()" style="
            padding:8px 20px; background:hsl(357,45%,69%); color:#fff;
            border:none; border-radius:8px; cursor:pointer; font-size:13px;
          ">Try again</button>
        </div>
      `;
    }
  }

  // ─────────────────────────────────────────
  // RENDER PAGINATION
  // ─────────────────────────────────────────
  function renderPagination(currentPage, totalPages) {
    paginationDiv.innerHTML = "";

    // Back button
    const backBtn = document.createElement("button");
    backBtn.className = "backwardBtn";
    backBtn.textContent = "←";
    backBtn.addEventListener("click", () => {
      showSpinner();
      setTimeout(() => {
        if (currentPage > 2) {
          window.location.href = `shop.html?page=${currentPage - 1}`;
        } else if (currentPage === 2) {
          window.location.href = "mainWebsitePage.html";
        }
      }, 600);
    });
      paginationDiv.appendChild(backBtn);

    // Page numbers
    const pagesDiv = document.createElement("div");
    pagesDiv.className = "pages";

    // Helper: create a page link
    function createPageLink(pageNum) {
      const pageLink = document.createElement("a");
      if (pageNum === 1) {
        pageLink.href = "mainWebsitePage.html";
      } else {
        pageLink.href = `shop.html?page=${pageNum}`;
      }
      pageLink.textContent = pageNum;
      if (pageNum === currentPage) pageLink.classList.add("active");
      pageLink.addEventListener("click", (e) => {
        e.preventDefault();
        showSpinner();
        setTimeout(() => {
          window.location.href = pageLink.href;
        }, 600);
      });
      return pageLink;
    }

    // Helper: create a "..." ellipsis element
    function createEllipsis() {
      const span = document.createElement("a");
      span.textContent = "...";
      span.style.pointerEvents = "none";
      span.style.color = "rgb(41, 39, 39);";
      span.style.cursor = "default";
      return span;
    }
    // Build the page numbers to show
    // Always show: first, last, current, and 1 page either side of current
    const pagesToShow = new Set();
    pagesToShow.add(1);
    pagesToShow.add(totalPages);
    pagesToShow.add(currentPage);
    if (currentPage - 1 >= 1) pagesToShow.add(currentPage - 1);
    if (currentPage + 1 <= totalPages) pagesToShow.add(currentPage + 1);

    const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

    // Render with ellipsis between gaps
    sortedPages.forEach((pageNum, index) => {
      // Add ellipsis if there's a gap
      if (index > 0 && pageNum - sortedPages[index - 1] > 1) {
        pagesDiv.appendChild(createEllipsis());
      }
      pagesDiv.appendChild(createPageLink(pageNum));
    });

    paginationDiv.appendChild(pagesDiv);

    // Forward button
    const forwardBtn = document.createElement("button");
    forwardBtn.className = "fowardBtn";
    forwardBtn.textContent = "→";
    forwardBtn.addEventListener("click", () => {
      showSpinner();
      setTimeout(() => {
        if (currentPage < totalPages) {
          window.location.href = `shop.html?page=${currentPage + 1}`;
        } else {
          window.location.href = "mainWebsitePage.html";
        }
      }, 600);
    });
    paginationDiv.appendChild(forwardBtn);
  }

  // ─────────────────────────────────────────
  // REATTACH CART LISTENERS
  // ─────────────────────────────────────────
  function reattachCartListeners() {
    const userId = sessionStorage.getItem("userId");
    
    document.querySelectorAll(".addToCart:not(.viewOptions)").forEach(button => {
      button.addEventListener("click", async () => {
        const itemCard = button.closest(".item");
        const name = itemCard.querySelector("h2").textContent;
        const image = itemCard.querySelector("img").src;
        const priceText = itemCard.querySelector(".price").textContent;
        const price = Number(priceText.replace(/[₦,]/g, ""));
        const addCartMessage = document.querySelector(".addCartMessage");

        if (!userId) {
          const cart = JSON.parse(localStorage.getItem("cart")) || [];
          const existingItem = cart.find(item => item.name === name);
          if (existingItem) {
            existingItem.quantity++;
            if (addCartMessage) addCartMessage.textContent = "Product quantity updated in cart!";
          } else {
            cart.push({ name, image, price, quantity: 1 });
            if (addCartMessage) addCartMessage.textContent = "Added to cart!";
          }
          localStorage.setItem("cart", JSON.stringify(cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
          if (addCartMessage) {
            addCartMessage.classList.add("show");
            setTimeout(() => addCartMessage.classList.remove("show"), 1200);
          }
          return;
        }

        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
          existingItem.quantity++;
          if (addCartMessage) addCartMessage.textContent = "Product quantity updated in cart!";
        } else {
          cart.push({ name, image, price, quantity: 1 });
          if (addCartMessage) addCartMessage.textContent = "Added to cart!";
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new StorageEvent("storage", {
          key: "cart",
          newValue: JSON.stringify(cart)
        }));

        if (addCartMessage) {
          addCartMessage.classList.add("show");
          setTimeout(() => addCartMessage.classList.remove("show"), 1200);
        }

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
            window.dispatchEvent(new StorageEvent("storage", {
              key: "cart",
              newValue: JSON.stringify(data.cart)
            }));
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

    document.getElementById("closeReviewsModal").addEventListener("click", () => {
      modal.remove();
      document.body.style.overflow = "auto";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        document.body.style.overflow = "auto";
      }
    });

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

});