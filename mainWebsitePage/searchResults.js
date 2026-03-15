// -----------------------------
// CART OVERLAY MESSAGE SETUP
// -----------------------------
const cartOverlayMessage = document.getElementById("cartOverlayMessage"); // make sure you have this element in your HTML
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
  // Example: update a cart count badge
  const cartCountElement = document.getElementById("cartCount"); // your cart badge element
  if (cartCountElement) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
  }
}

// -----------------------------
// CART SETUP
// -----------------------------
let cart = [];

// Try to load from localStorage if it exists
const savedCart = localStorage.getItem("cart");
if (savedCart) {
  try {
    cart = JSON.parse(savedCart);
    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch (err) {
    cart = [];
  }
}

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
// FILTER PRODUCTS
// -----------------------------
const matchingProducts = allProducts.filter(product =>
  product.name.toLowerCase().includes(searchTerm)
);


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

    const productDiv = document.createElement("div");
    productDiv.className = "item";

    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h2>${product.name}</h2>
      <div class="price">${product.price}</div>
      <button class="addToCart">Add to Cart</button>
    `;

    resultsContainer.appendChild(productDiv);

  });

  

  // ADD TO CART
  const addToCartButtons = resultsContainer.querySelectorAll(".addToCart");

  addToCartButtons.forEach(button => {

    button.addEventListener("click", () => {

      const userId = sessionStorage.getItem("userId");
      if (!userId) return alert("Please log in to add items to cart.");

      const itemCard = button.closest(".item");

      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceAmount = itemCard.querySelector(".price").textContent;

      const price = Number(priceAmount.replace(/[₦,]/g, ""));

      const existingItem = cart.find(item => item.name === name);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name, image, price, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));

      renderCart();
      showCartOverlayMessage("Product added to cart!");

    });

  });

}


// -----------------------------
// PAGINATION LOGIC
// -----------------------------
function getPaginatedProducts(products, page, perPage) {

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return products.slice(start, end);

}


// -----------------------------
// CREATE PAGINATION STRUCTURE
// -----------------------------
const paginationSection = document.createElement("section");
paginationSection.className = "paginationContainer";

const paginationDiv = document.createElement("div");
paginationDiv.className = "pagination";

paginationSection.appendChild(paginationDiv);

resultsContainer.after(paginationSection);


// -----------------------------
// PAGINATION CONTROLS
// -----------------------------
function renderPaginationControls(products, page) {

  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(products.length / resultsPerPage);

  if (totalPages <= 1) return;

  // BACK BUTTON
  const backBtn = document.createElement("button");
  backBtn.textContent = "←";
  backBtn.className = "backwardBtn";

  backBtn.addEventListener("click", () => {
    if (currentPageNumber > 1) {
      currentPageNumber--;
    } else {
      location.reload();
    }
    renderSearchResultsWithPagination(products, currentPageNumber);
    window.scrollTo({ top: resultsContainer.offsetTop - 120, behavior: "smooth" });
  });

  paginationDiv.appendChild(backBtn);


  // PAGE NUMBERS
  const pagesDiv = document.createElement("div");
  pagesDiv.className = "pages";

  for (let i = 1; i <= totalPages; i++) {

    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.textContent = i;

    if (i === page) {
      pageLink.classList.add("active");
    }

    pageLink.addEventListener("click", (e) => {
      e.preventDefault();
      currentPageNumber = i;
      renderSearchResultsWithPagination(products, currentPageNumber);
      window.scrollTo({ top: resultsContainer.offsetTop - 120, behavior: "smooth" });
    });
    pagesDiv.appendChild(pageLink);
  }
  paginationDiv.appendChild(pagesDiv);


  // FORWARD BUTTON
  const forwardBtn = document.createElement("button");
  forwardBtn.textContent = "→";
  forwardBtn.className = "fowardBtn";

  forwardBtn.addEventListener("click", () => {
    if (currentPageNumber < totalPages) {
      currentPageNumber++;
    } else {
      currentPageNumber = 1;
    }
    renderSearchResultsWithPagination(products, currentPageNumber);
    window.scrollTo({ top: resultsContainer.offsetTop - 120, behavior: "smooth" });
  });
  paginationDiv.appendChild(forwardBtn);
}

// RENDER WITH PAGINATION
function renderSearchResultsWithPagination(products, page = 1) {

  const paginatedProducts = getPaginatedProducts(products, page, resultsPerPage);
  renderSearchResults(paginatedProducts);
  renderPaginationControls(products, page);

}

// GREETING TEXT
const greetingHeading2 = document.querySelector(".greetingMessage h2");

if (greetingHeading2) {
  if (searchTerm) {
    greetingHeading2.textContent = "Search Results";
  } else {
    greetingHeading2.textContent = "Jikes Cosmetics";
  }
}

// INITIAL RUN
renderSearchResultsWithPagination(matchingProducts, currentPageNumber);
