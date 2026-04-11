document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const productSlug = params.get("name");
  const container = document.getElementById("productDetailCard");

  if (!productSlug) {
    container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Product not found.</p>`;
    return;
  }

  try {
    // Fetch product by slug name
    const res = await fetch(`http://localhost:5000/api/products/slug/${encodeURIComponent(productSlug)}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Product not found.</p>`;
      return;
    }

    const product = data.product;

    // Update page title
    document.title = `${product.name} — Jikes Cosmetics`;

    // Fetch ratings
    const ratingsRes = await fetch(`http://localhost:5000/api/ratings/${product._id}`);
    const ratingsData = await ratingsRes.json();
    const ratings = ratingsData.success ? ratingsData.ratings : [];

    const avg = product.averageRating || 0;
    const total = product.totalRatings || 0;
    const filled = Math.round(avg);
    const starsHTML = "★".repeat(filled) + "☆".repeat(5 - filled);

    let currentPrice = product.price;
    let selectedVariant = null;
    let quantity = 1;

    // Build variant options
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

    // Share URL
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

    // Quantity controls
    const qtyDisplay = document.getElementById("qtyDisplay");
    document.getElementById("qtyMinus").addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        qtyDisplay.textContent = quantity;
      }
    });
    document.getElementById("qtyPlus").addEventListener("click", () => {
      quantity++;
      qtyDisplay.textContent = quantity;
    });

    // Variant selection
    if (product.hasVariants && product.variants?.length > 0) {
      const variantSelect = document.getElementById("variantSelect");
      const detailAddBtn = document.getElementById("detailAddBtn");
      const detailPrice = document.getElementById("detailPrice");

      variantSelect.addEventListener("change", () => {
        const selectedIndex = variantSelect.value;
        if (selectedIndex === "") {
          selectedVariant = null;
          detailPrice.textContent = `₦${product.price.toLocaleString()}`;
          detailAddBtn.disabled = true;
          detailAddBtn.textContent = "Select an option";
          return;
        }
        selectedVariant = product.variants[parseInt(selectedIndex)];
        currentPrice = selectedVariant.price;
        detailPrice.textContent = `₦${currentPrice.toLocaleString()}`;
        detailAddBtn.disabled = false;
        detailAddBtn.textContent = "Add to cart";
      });
    }

    // Add to cart
    const detailAddBtn = document.getElementById("detailAddBtn");
    detailAddBtn.addEventListener("click", async () => {
      const userId = sessionStorage.getItem("userId");
      if (!userId) return alert("Please log in to add items to cart.");

      const cart = JSON.parse(localStorage.getItem("cart")) || [];

      const cartName = selectedVariant
        ? `${product.name} (${selectedVariant.label})`
        : product.name;

      const cartPrice = selectedVariant ? selectedVariant.price : product.price;
      const existingItem = cart.find(item => item.name === cartName);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ name: cartName, image: product.image, price: cartPrice, quantity });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

      const addCartMessage = document.querySelector(".addCartMessage");
      if (addCartMessage) {
        addCartMessage.textContent = existingItem ? "Product quantity updated in cart!" : "Added to cart!";
        addCartMessage.classList.add("show");
        setTimeout(() => addCartMessage.classList.remove("show"), 1200);
      }

      // Sync with backend
      try {
        const syncRes = await fetch("http://localhost:5000/api/auth/update-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: cartName,
            image: product.image,
            price: cartPrice,
            action: existingItem ? "update" : "add",
            quantity: existingItem ? existingItem.quantity : quantity
          })
        });
        const syncData = await syncRes.json();
        if (syncData.success) {
          localStorage.setItem("cart", JSON.stringify(syncData.cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(syncData.cart) }));
        }
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    });

  } catch (err) {
    console.error("Product detail error:", err);
    container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Failed to load product.</p>`;
  }

});