document.addEventListener("DOMContentLoaded", async () => {

  const BASE_URL = "http://localhost:5000";
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const productSlug = params.get("name");
  const container = document.getElementById("productDetailCard");

  if (!productId && !productSlug) {
    container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Product not found.</p>`;
    return;
  }

  try {
    // Use id if available, otherwise fall back to slug
    const url = productId
      ? `${BASE_URL}/api/products/id/${productId}`
      : `${BASE_URL}/api/products/slug/${encodeURIComponent(productSlug)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.product) {
      container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Product not found.</p>`;
      return;
    }

    const product = data.product;
    document.title = `${product.name} — Jikes Cosmetics`;

    const ratingsRes = await fetch(`${BASE_URL}/api/ratings/${product._id}`);
    const ratingsData = await ratingsRes.json();
    const ratings = ratingsData.success ? ratingsData.ratings : [];

    const avg = product.averageRating || 0;
    const total = product.totalRatings || 0;
    const filled = Math.round(avg);
    const starsHTML = "★".repeat(filled) + "☆".repeat(5 - filled);

    let currentPrice = product.price;
    let selectedVariant = null;
    let quantity = 1;
    let qtyDisplay;
    let detailAddBtn;
    let syncController = null;

    const variantHTML = product.hasVariants && product.variants?.length > 0 ? `
      <div class="variantSection">
        <p class="variantLabel">${product.variantType || "Option"}:</p>
        <select class="variantSelect" id="variantSelect">
          <option value="">-- Select ${product.variantType || "option"} --</option>
          ${product.variants.map((v, i) => `
            <option value="${i}" data-price="${v.price}" ${v.inStock === false ? "disabled" : ""}>
              ${v.label} ${v.inStock === false ? "(Out of stock)" : ""}
            </option>
          `).join("")}
        </select>
      </div>
    ` : "";

    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(product.name);

    container.innerHTML = `
      <div class="productDetailTop">
        <img src="${product.image}" alt="${product.name}" class="productDetailImage">
        <div class="productDetailInfo">
          <h1 class="productDetailName">${product.name}</h1>
          <p class="productDetailPrice" id="detailPrice">₦${currentPrice.toLocaleString()}</p>
          <div class="productDetailRating">
            <span class="stars">${starsHTML}</span>
            <span>${total > 0 ? `${avg.toFixed(1)} (${total} ${total === 1 ? "review" : "reviews"})` : "No ratings yet"}</span>
          </div>
          <p class="productDetailStock ${product.inStock !== false ? "inStock" : "outOfStock"}">
            ${product.inStock !== false ? "✓ Available" : "✗ Out of stock"}
          </p>
          ${variantHTML}
          <div class="quantitySection">
            <p class="quantityLabel">Quantity:</p>
            <div class="quantityControl">
              <button class="qtyBtn" id="qtyMinus">−</button>
              <span class="qtyDisplay" id="qtyDisplay">1</span>
              <button class="qtyBtn" id="qtyPlus">+</button>
            </div>
          </div>
          <button class="productDetailAddBtn" id="detailAddBtn"
            ${product.inStock === false || (product.hasVariants && product.variants?.length > 0) ? "disabled" : ""}>
            ${product.inStock === false ? "Out of stock" : product.hasVariants ? "Select an option" : "Add to cart"}
          </button>
          <div class="productDetailShare">
            <p class="shareLabel">Share this product:</p>
            <div class="shareButtons">
              <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" target="_blank" class="shareBtn shareX">
                <i class="fa-brands fa-x-twitter"></i>
              </a>
              <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" class="shareBtn shareFb">
                <i class="fa-brands fa-facebook-f"></i>
              </a>
              <a href="https://wa.me/?text=${shareTitle}%20${shareUrl}" target="_blank" class="shareBtn shareWa">
                <i class="fa-brands fa-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="productDetailDescription">
        <h3>Product Details</h3>
        <p>${product.description && product.description.trim() !== ""
          ? product.description
          : `Explore our <strong>${product.name}</strong> from Jikes Cosmetics. ${product.hasVariants
              ? `Available in ${product.variants.length} ${product.variantType} options. Select your preferred ${product.variantType} above and add to cart.`
              : `Add to cart and enjoy fast delivery across Nigeria.`}`
        }</p>
      </div>

      <div class="productDetailReviews">
        <h3>Reviews</h3>
        ${ratings.length === 0
          ? `<p class="noReviews">No reviews yet for this product.</p>`
          : ratings.map(r => `
            <div class="reviewItem">
              <div class="reviewItemTop">
                <span class="username">${r.username || "Anonymous"}</span>
                <span class="reviewDate">${new Date(r.rating_created_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric"
                })}</span>
              </div>
              <div class="reviewStars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
              ${r.review ? `<p class="reviewText">"${r.review}"</p>` : ""}
            </div>
          `).join("")
        }
      </div>
    `;

    qtyDisplay = document.getElementById("qtyDisplay");
    detailAddBtn = document.getElementById("detailAddBtn");

    // ─────────────────────────────────────────
    // RESET ADD TO CART BUTTON
    // ─────────────────────────────────────────
    function resetAddToCartBtn() {
      if (syncController) {
        syncController.abort();
        syncController = null;
      }
      quantity = 1;
      if (qtyDisplay) qtyDisplay.textContent = "1";
      if (detailAddBtn) {
        detailAddBtn.textContent = product.hasVariants ? "Select an option" : "Add to cart";
        detailAddBtn.style.background = "";
        detailAddBtn.disabled = product.hasVariants && !selectedVariant;
      }
    }

    // ─────────────────────────────────────────
    // ATTACH QUANTITY SYNC LISTENERS
    // ─────────────────────────────────────────
    function attachQuantitySyncListeners(cartName, cartPrice) {
      const userId = sessionStorage.getItem("userId");

      // Abort previous listeners
      if (syncController) syncController.abort();
      syncController = new AbortController();
      const signal = syncController.signal;

      document.getElementById("qtyPlus").addEventListener("click", async () => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItem = cart.find(item => item.name === cartName);
        if (!existingItem) return;

        existingItem.quantity++;
        quantity = existingItem.quantity;
        qtyDisplay.textContent = quantity;

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

        const addCartMessage = document.querySelector(".addCartMessage");
        if (addCartMessage) {
          addCartMessage.textContent = "Product quantity updated in cart!";
          addCartMessage.classList.add("show");
          setTimeout(() => addCartMessage.classList.remove("show"), 1200);
        }

        if (userId) {
          try {
            const syncRes = await fetch(`${BASE_URL}/api/auth/update-cart`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, name: cartName, image: product.image, price: cartPrice, action: "add", quantity })
            });
            const syncData = await syncRes.json();
            if (syncData.success) {
              localStorage.setItem("cart", JSON.stringify(syncData.cart));
              window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(syncData.cart) }));
            }
          } catch (err) { console.error("Cart sync error:", err); }
        }
      }, { signal });

      document.getElementById("qtyMinus").addEventListener("click", async () => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItem = cart.find(item => item.name === cartName);
        if (!existingItem) return;

        const addCartMessage = document.querySelector(".addCartMessage");

        if (existingItem.quantity > 1) {
          existingItem.quantity--;
          quantity = existingItem.quantity;
          qtyDisplay.textContent = quantity;

          localStorage.setItem("cart", JSON.stringify(cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

          if (addCartMessage) {
            addCartMessage.textContent = "Product quantity updated in cart!";
            addCartMessage.classList.add("show");
            setTimeout(() => addCartMessage.classList.remove("show"), 1200);
          }

          if (userId) {
            try {
              const syncRes = await fetch(`${BASE_URL}/api/auth/update-cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, name: cartName, image: product.image, price: cartPrice, action: "add", quantity })
              });
              const syncData = await syncRes.json();
              if (syncData.success) {
                localStorage.setItem("cart", JSON.stringify(syncData.cart));
                window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(syncData.cart) }));
              }
            } catch (err) { console.error("Cart sync error:", err); }
          }

        } else {
          // Remove from cart
          const index = cart.findIndex(item => item.name === cartName);
          cart.splice(index, 1);

          localStorage.setItem("cart", JSON.stringify(cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

          if (addCartMessage) {
            addCartMessage.textContent = "Product removed from cart!";
            addCartMessage.classList.add("show");
            setTimeout(() => addCartMessage.classList.remove("show"), 1200);
          }

          resetAddToCartBtn();
          
          if (userId) {
            try {
              await fetch(`${BASE_URL}/api/auth/update-cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, name: cartName, image: product.image, price: cartPrice, action: "remove", quantity: 0 })
              });
            } catch (err) { console.error("Cart sync error:", err); }
          }
        }
      }, { signal });
    }

    // ─────────────────────────────────────────
    // BASIC QTY BEFORE ADDING TO CART
    // ─────────────────────────────────────────
    document.getElementById("qtyMinus").addEventListener("click", () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const cartName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name;
      const existingItem = cart.find(item => item.name === cartName);
      if (existingItem) return; // handled by syncListeners
      if (quantity > 1) {
        quantity--;
        qtyDisplay.textContent = quantity;
      }
    });

    document.getElementById("qtyPlus").addEventListener("click", () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const cartName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name;
      const existingItem = cart.find(item => item.name === cartName);
      if (existingItem) return; // handled by syncListeners
      quantity++;
      qtyDisplay.textContent = quantity;
    });

    // ─────────────────────────────────────────
    // ADD TO CART BUTTON
    // ─────────────────────────────────────────
    detailAddBtn.addEventListener("click", async () => {
      const userId = sessionStorage.getItem("userId");

      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const cartName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name;
      const cartPrice = selectedVariant ? selectedVariant.price : product.price;
      const existingItem = cart.find(item => item.name === cartName);

      if (!existingItem) {
        cart.push({ name: cartName, image: product.image, price: cartPrice, quantity });
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

        const addCartMessage = document.querySelector(".addCartMessage");
        if (addCartMessage) {
          addCartMessage.textContent = "Added to cart!";
          addCartMessage.classList.add("show");
          setTimeout(() => addCartMessage.classList.remove("show"), 1200);
        }

        detailAddBtn.textContent = "Added ✓";
        detailAddBtn.style.background = "#4CAF50";
        
        if (userId) {
          try {
            const syncRes = await fetch(`${BASE_URL}/api/auth/update-cart`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, name: cartName, image: product.image, price: cartPrice, action: "add", quantity })
            });
            const syncData = await syncRes.json();
            if (syncData.success) {
              localStorage.setItem("cart", JSON.stringify(syncData.cart));
              window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(syncData.cart) }));
            }
          } catch (err) { console.error("Cart sync error:", err); }
        }

        attachQuantitySyncListeners(cartName, cartPrice);
      }
    });

    // ─────────────────────────────────────────
    // STORAGE LISTENER — CART OVERLAY CHANGES
    // ─────────────────────────────────────────
    window.addEventListener("storage", (event) => {
      if (event.key !== "cart") return;

      const updatedCart = JSON.parse(event.newValue) || [];
      const cartName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name;
      const existingItem = updatedCart.find(item => item.name === cartName);

      if (existingItem) {
        quantity = existingItem.quantity;
        if (qtyDisplay) qtyDisplay.textContent = quantity;
        if (detailAddBtn) {
          detailAddBtn.textContent = "Added ✓";
          detailAddBtn.style.background = "#4CAF50";
        }
      } else {
        // Item removed from cart overlay — reset everything
        resetAddToCartBtn();
        // If a variant was selected, re-enable the button
        if (selectedVariant) {
          detailAddBtn.disabled = false;
          detailAddBtn.textContent = "Add to cart";
        }
      }
    });

    // ─────────────────────────────────────────
    // CHECK CART ON PAGE LOAD
    // ─────────────────────────────────────────
    const initialCart = JSON.parse(localStorage.getItem("cart")) || [];
    const initialCartName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name;
    const initialItem = initialCart.find(item => item.name === initialCartName);
    if (initialItem) {
      quantity = initialItem.quantity;
      if (qtyDisplay) qtyDisplay.textContent = quantity;
      if (detailAddBtn) {
        detailAddBtn.textContent = "Added ✓";
        detailAddBtn.style.background = "#4CAF50";
      }
      attachQuantitySyncListeners(initialCartName, initialItem.price);
    }

    // ─────────────────────────────────────────
    // VARIANT SELECTION
    // ─────────────────────────────────────────
    if (product.hasVariants && product.variants?.length > 0) {
      const variantSelect = document.getElementById("variantSelect");
      const detailPrice = document.getElementById("detailPrice");

      variantSelect.addEventListener("change", () => {
        const selectedIndex = variantSelect.value;

        if (selectedIndex === "") {
          selectedVariant = null;
          detailPrice.textContent = `₦${product.price.toLocaleString()}`;
          detailAddBtn.disabled = true;
          detailAddBtn.textContent = "Select an option";
          resetAddToCartBtn();
          return;
        }

        selectedVariant = product.variants[parseInt(selectedIndex)];
        currentPrice = selectedVariant.price;
        detailPrice.textContent = `₦${currentPrice.toLocaleString()}`;

        // Check if this variant is already in cart
        const variantCartName = `${product.name} (${selectedVariant.label})`;
        const variantCart = JSON.parse(localStorage.getItem("cart")) || [];
        const variantItem = variantCart.find(item => item.name === variantCartName);

        if (variantItem) {
          quantity = variantItem.quantity;
          if (qtyDisplay) qtyDisplay.textContent = quantity;
          detailAddBtn.textContent = "Added ✓";
          detailAddBtn.style.background = "#4CAF50";
          detailAddBtn.disabled = false;
          attachQuantitySyncListeners(variantCartName, selectedVariant.price);
        } else {
          resetAddToCartBtn();
          detailAddBtn.disabled = false;
          detailAddBtn.textContent = "Add to cart";
          detailAddBtn.style.background = "";
        }
      });
    }

  } catch (err) {
    console.error("Product detail error:", err);
    container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Failed to load product.</p>`;
  }

  // ─────────────────────────────────────────
  // BACK BUTTON
  // ─────────────────────────────────────────
  document.getElementById("backBtn").addEventListener("click", (e) => {
    e.preventDefault();
    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.location.href = "mainWebsitePage.html";
    }
  });

});