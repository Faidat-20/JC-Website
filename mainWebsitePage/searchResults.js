// -----------------------------
// CART OVERLAY MESSAGE SETUP
// -----------------------------
const cartOverlayMessage = document.getElementById("cartOverlayMessage");
let cartOverlayTimer;

function showCartOverlayMessage(message) {
  if (!cartOverlayMessage) return;
  clearTimeout(cartOverlayTimer);
  cartOverlayMessage.textContent = message;
  cartOverlayMessage.classList.add("show");
  cartOverlayTimer = setTimeout(() => {
    cartOverlayMessage.classList.remove("show");
  }, 1200);
}

function renderCart() {
  const cartCountElement = document.getElementById("cartCount");
  if (cartCountElement) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
  }
}

// -----------------------------
// CART SETUP
// -----------------------------
// let cart = [];
// const savedCart = localStorage.getItem("cart");
// if (savedCart) {
//   try {
//     cart = JSON.parse(savedCart);
//     if (!Array.isArray(cart)) cart = [];
//   } catch (err) {
//     cart = [];
//   }
// }

// -----------------------------
// PAGINATION SETTINGS
// -----------------------------
const resultsPerPage = 8;
let currentPageNumber = 1;

// -----------------------------
// GET SEARCH TERM FROM URL
// -----------------------------
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const searchTerm = getQueryParam("search")?.toLowerCase().trim() || "";
const resultsContainer = document.getElementById("searchResultsContainer");
const searchMessage = document.getElementById("searchMessage");

// -----------------------------
// MAIN RENDER FUNCTION
// -----------------------------
function renderSearchResults(products) {
  resultsContainer.innerHTML = "";

  if (products.length > 0 && searchMessage) {
    searchMessage.textContent = `Search results for "${searchTerm}"`;
  } else if (searchMessage) {
    searchMessage.textContent = "";
  }

  if (products.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = `No products found for "${searchTerm}"`;
    msg.style.textAlign = "center";
    msg.style.marginTop = "20px";
    msg.style.color = "#666";
    resultsContainer.appendChild(msg);
    return;
  }

  products.forEach(product => {
    const avg = product.averageRating || 0;
    const total = product.totalRatings || 0;
    const filled = Math.round(avg);
    const starsHTML = "★".repeat(filled) + "☆".repeat(5 - filled);
    const ratingText = total === 0
      ? "No ratings yet"
      : `${avg.toFixed(1)} (${total} ${total === 1 ? "review" : "reviews"})`;

    const productDiv = document.createElement("div");
    productDiv.className = "item";
    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h2>${product.name}</h2>
      <div class="productRating" data-id="${product._id}" data-name="${product.name}" style="cursor:pointer;" title="Click to see reviews">
        <span class="stars" style="color:#f5a623; font-size:14px; letter-spacing:2px;">${starsHTML}</span>
        <span class="ratingCount" style="font-size:12px; color:#999;">${ratingText}</span>
      </div>
      <div class="price">₦${product.price.toLocaleString()}</div>
      ${product.hasVariants
        ? `<button class="addToCart viewOptions" onclick="window.location.href='product.html?id=${product._id}'">
            View options
          </button>`
        : `<button class="addToCart ${product.inStock === false ? 'outOfStock' : ''}" 
            ${product.inStock === false ? 'disabled' : ''}>
            ${product.inStock === false ? 'Out of stock' : 'Add to Cart'}
          </button>`
      }
    `;

    // Click rating to show reviews
    const ratingDiv = productDiv.querySelector(".productRating");
    ratingDiv.addEventListener("click", () => showReviewsModal(product));

    resultsContainer.appendChild(productDiv);
  });

  // ADD TO CART
  const addToCartButtons = resultsContainer.querySelectorAll(".addToCart");
  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const userId = sessionStorage.getItem("userId");

      // Declare variables first so both guest and logged-in paths can use them
      const itemCard = button.closest(".item");
      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceAmount = itemCard.querySelector(".price").textContent;
      const price = Number(priceAmount.replace(/[₦,]/g, ""));
      const addCartMessage = document.querySelector(".addCartMessage");

      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingItem = cart.find(item => item.name === name);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name, image, price, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));

      if (addCartMessage) {
        addCartMessage.textContent = existingItem ? "Product quantity updated in cart!" : "Added to cart!";
        addCartMessage.classList.add("show");
        setTimeout(() => addCartMessage.classList.remove("show"), 1200);
      }

      // Skip backend sync for guests
      if (!userId) return;

      try {
        await fetch("http://localhost:5000/api/auth/update-cart", {
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
      } catch (err) {
        console.error("Cart backend sync error:", err);
      }
    });
  });
}

// -----------------------------
// REVIEWS MODAL
// -----------------------------
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

// -----------------------------
// PAGINATION LOGIC
// -----------------------------
function getPaginatedProducts(products, page, perPage) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return products.slice(start, end);
}

const paginationSection = document.createElement("section");
paginationSection.className = "paginationContainer";
const paginationDiv = document.createElement("div");
paginationDiv.className = "pagination";
paginationSection.appendChild(paginationDiv);
resultsContainer.after(paginationSection);

function renderPaginationControls(products, page) {
  paginationDiv.innerHTML = "";
  const totalPages = Math.ceil(products.length / resultsPerPage);
  if (totalPages <= 1) return;

  const backBtn = document.createElement("button");
  backBtn.textContent = "←";
  backBtn.className = "backwardBtn";
  backBtn.addEventListener("click", () => {
    if (currentPageNumber > 1) currentPageNumber--;
    else location.reload();
    renderSearchResultsWithPagination(products, currentPageNumber);
    window.scrollTo({ top: resultsContainer.offsetTop - 120, behavior: "smooth" });
  });
  paginationDiv.appendChild(backBtn);

  const pagesDiv = document.createElement("div");
  pagesDiv.className = "pages";
  for (let i = 1; i <= totalPages; i++) {
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.textContent = i;
    if (i === page) pageLink.classList.add("active");
    pageLink.addEventListener("click", (e) => {
      e.preventDefault();
      currentPageNumber = i;
      renderSearchResultsWithPagination(products, currentPageNumber);
      window.scrollTo({ top: resultsContainer.offsetTop - 120, behavior: "smooth" });
    });
    pagesDiv.appendChild(pageLink);
  }
  paginationDiv.appendChild(pagesDiv);

  const forwardBtn = document.createElement("button");
  forwardBtn.textContent = "→";
  forwardBtn.className = "fowardBtn";
  forwardBtn.addEventListener("click", () => {
    if (currentPageNumber < totalPages) currentPageNumber++;
    else currentPageNumber = 1;
    renderSearchResultsWithPagination(products, currentPageNumber);
    window.scrollTo({ top: resultsContainer.offsetTop - 120, behavior: "smooth" });
  });
  paginationDiv.appendChild(forwardBtn);
}

function renderSearchResultsWithPagination(products, page = 1) {
  const paginatedProducts = getPaginatedProducts(products, page, resultsPerPage);
  renderSearchResults(paginatedProducts);
  renderPaginationControls(products, page);
}

// -----------------------------
// GREETING TEXT
// -----------------------------
const greetingHeading2 = document.querySelector(".greetingMessage h2");
if (greetingHeading2) {
  greetingHeading2.textContent = searchTerm ? "Search Results" : "Jikes Cosmetics";
}

// -----------------------------
// FETCH ALL PRODUCTS FROM MONGODB AND FILTER
// -----------------------------
(async () => {
  try {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();

    if (!data.success) {
      resultsContainer.innerHTML = `<p style="color:#e74c3c;">Failed to load products.</p>`;
      return;
    }

    const matchingProducts = data.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm)
    );

    renderSearchResultsWithPagination(matchingProducts, currentPageNumber);

  } catch (err) {
    console.error("Search fetch error:", err);
    resultsContainer.innerHTML = `<p style="color:#e74c3c;">Server error. Make sure your backend is running.</p>`;
  }
})();