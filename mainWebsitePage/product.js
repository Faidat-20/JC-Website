document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const container = document.getElementById("productDetailCard");

  if (!productId) {
    container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Product not found.</p>`;
    return;
  }

  try {
    // Fetch product by ID
    const res = await fetch(`http://localhost:5000/api/products/${productId}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      container.innerHTML = `<p style="color:#e74c3c; text-align:center; padding:40px;">Product not found.</p>`;
      return;
    }

    const product = data.product;

    // Fetch ratings
    const ratingsRes = await fetch(`http://localhost:5000/api/ratings/${productId}`);
    const ratingsData = await ratingsRes.json();
    const ratings = ratingsData.success ? ratingsData.ratings : [];

    const avg = product.averageRating || 0;
    const total = product.totalRatings || 0;
    const filled = Math.round(avg);
    const starsHTML = "★".repeat(filled) + "☆".repeat(5 - filled);

    // Build initial price display
    let currentPrice = product.price;
    let selectedVariant = null;

    // Build variant options if product has variants
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
          <button class="productDetailAddBtn" id="detailAddBtn"
            ${product.inStock === false || (product.hasVariants && product.variants?.length > 0) ? "disabled" : ""}>
            ${product.inStock === false ? "Out of stock" : product.hasVariants ? "Select an option" : "Add to cart"}
          </button>
        </div>
      </div>

      <div class="productDetailReviews">
        <h3>Reviews</h3>
        ${ratings.length === 0 ? `<p class="noReviews">No reviews yet for this product.</p>` :
          ratings.map(r => `
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

    // Handle variant selection
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

      // Build cart item name — include variant label if selected
      const cartName = selectedVariant
        ? `${product.name} (${selectedVariant.label})`
        : product.name;

      const cartPrice = selectedVariant ? selectedVariant.price : product.price;
      const existingItem = cart.find(item => item.name === cartName);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name: cartName, image: product.image, price: cartPrice, quantity: 1 });
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
        const res = await fetch("http://localhost:5000/api/auth/update-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: cartName,
            image: product.image,
            price: cartPrice,
            action: existingItem ? "update" : "add",
            quantity: existingItem ? existingItem.quantity : 1
          })
        });
        const resData = await res.json();
        if (resData.success) {
          localStorage.setItem("cart", JSON.stringify(resData.cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(resData.cart) }));
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