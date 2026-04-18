document.addEventListener("DOMContentLoaded", async () => {

  const BASE_URL = "https://jc-website.onrender.com";
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
        <div class="productImageGallery">
          <div class="galleryMainWrap">
            <button class="galleryArrow galleryArrowLeft" id="galleryPrev">&#8249;</button>
            <img src="${product.image}" alt="${product.name}" class="productDetailImage" id="galleryMainImg">
            <button class="galleryArrow galleryArrowRight" id="galleryNext">&#8250;</button>
            <button class="galleryExpandBtn" id="galleryExpandBtn" title="View fullscreen">
              <i class="fa-solid fa-expand"></i>
            </button>
          </div>
          <div class="galleryThumbnails" id="galleryThumbnails">
            ${(product.images && product.images.length > 0 ? product.images : [product.image]).map((img, i) => `
              <img src="${img}" alt="Image ${i + 1}" class="galleryThumb ${i === 0 ? 'active' : ''}" data-index="${i}">
            `).join("")}
          </div>
        </div>
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
    // IMAGE GALLERY
    // ─────────────────────────────────────────
    const galleryImages = product.images && product.images.length > 0
      ? product.images
      : [product.image];

    let currentImageIndex = 0;

    const mainImg = document.getElementById("galleryMainImg");
    const thumbs = document.querySelectorAll(".galleryThumb");
    const prevBtn = document.getElementById("galleryPrev");
    const nextBtn = document.getElementById("galleryNext");
    const expandBtn = document.getElementById("galleryExpandBtn");

    function setActiveImage(index) {
      currentImageIndex = index;
      mainImg.src = galleryImages[index];
      thumbs.forEach((t, i) => t.classList.toggle("active", i === index));
      prevBtn.style.opacity = galleryImages.length <= 1 ? "0" : "1";
      nextBtn.style.opacity = galleryImages.length <= 1 ? "0" : "1";
    }

    thumbs.forEach(thumb => {
      thumb.addEventListener("click", () => {
        setActiveImage(parseInt(thumb.dataset.index));
      });
    });

    prevBtn.addEventListener("click", () => {
      const newIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
      setActiveImage(newIndex);
    });

    nextBtn.addEventListener("click", () => {
      const newIndex = (currentImageIndex + 1) % galleryImages.length;
      setActiveImage(newIndex);
    });

    // Hide arrows if only one image
    if (galleryImages.length <= 1) {
      prevBtn.style.opacity = "0";
      nextBtn.style.opacity = "0";
      prevBtn.style.pointerEvents = "none";
      nextBtn.style.pointerEvents = "none";
    }

    // Fullscreen lightbox
    expandBtn.addEventListener("click", () => {
      const lightbox = document.createElement("div");
      lightbox.id = "galleryLightbox";
      lightbox.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.92);
        z-index: 99999; display: flex; align-items: center;
        justify-content: center; cursor: zoom-out;
      `;
      lightbox.innerHTML = `
        <button style="position:absolute; top:20px; right:24px; background:none; border:none;
          color:white; font-size:32px; cursor:pointer; z-index:10;">✕</button>
        <button id="lbPrev" style="position:absolute; left:20px; background:rgba(255,255,255,0.1);
          border:none; color:white; font-size:40px; cursor:pointer; padding:10px 16px;
          border-radius:50%; z-index:10;">&#8249;</button>
        <img src="${galleryImages[currentImageIndex]}" id="lbImg"
          style="max-width:90vw; max-height:90vh; object-fit:contain; border-radius:8px;">
        <button id="lbNext" style="position:absolute; right:20px; background:rgba(255,255,255,0.1);
          border:none; color:white; font-size:40px; cursor:pointer; padding:10px 16px;
          border-radius:50%; z-index:10;">&#8250;</button>
      `;

      document.body.appendChild(lightbox);
      document.body.style.overflow = "hidden";

      let lbIndex = currentImageIndex;
      const lbImg = lightbox.querySelector("#lbImg");
      const lbPrev = lightbox.querySelector("#lbPrev");
      const lbNext = lightbox.querySelector("#lbNext");

      if (galleryImages.length <= 1) {
        lbPrev.style.display = "none";
        lbNext.style.display = "none";
      }

      lbPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        lbIndex = (lbIndex - 1 + galleryImages.length) % galleryImages.length;
        lbImg.src = galleryImages[lbIndex];
      });

      lbNext.addEventListener("click", (e) => {
        e.stopPropagation();
        lbIndex = (lbIndex + 1) % galleryImages.length;
        lbImg.src = galleryImages[lbIndex];
      });

      const closeLightbox = () => {
        lightbox.remove();
        document.body.style.overflow = "auto";
      };

      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target.tagName === "IMG") closeLightbox();
      });
      lightbox.querySelector("button").addEventListener("click", closeLightbox);
    });
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