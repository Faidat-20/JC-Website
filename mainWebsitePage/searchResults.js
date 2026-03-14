
// GET SEARCH TERM FROM URL

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const searchTerm = getQueryParam("search")?.toLowerCase().trim() || "";
const resultsContainer = document.getElementById("searchResultsContainer");

const matchingProducts = allProducts.filter(product =>
  product.name.toLowerCase().includes(searchTerm)
);

const searchMessage = document.getElementById("searchMessage");

function renderSearchResults(products) {
  resultsContainer.innerHTML = ""; // clear previous content

  // Only show search message if we have matching products
  if (products.length > 0 && searchMessage) {
    searchMessage.textContent = `Search results for "${searchTerm}"`;
    searchMessage.style.color = "#666";
  } else if (searchMessage) {
    searchMessage.textContent = ""; // hide message if no products
  }

  if (products.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = `No products found for "${searchTerm}"`;
    msg.style.textAlign = "center";
    msg.style.marginTop = "20px";
    msg.style.marginBottom = "20px";
    msg.style.color = "#666";
    resultsContainer.appendChild(msg);
    return;
  }

  products.forEach(product => {
    const productDiv = document.createElement("div");
    productDiv.className = "item"; // use main layout class

    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h2>${product.name}</h2>
      <div class="price">${product.price}</div>
      <button class="addToCart">Add to Cart</button>
    `;

    resultsContainer.appendChild(productDiv);
  });

  // Attach Add-to-Cart functionality
  const addToCartButtons = resultsContainer.querySelectorAll(".addToCart");

  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
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

const greetingHeading2 = document.querySelector(".greetingMessage h2");
if (searchTerm) {
  greetingHeading2.textContent = `Search Results`;
} else {
  greetingHeading2.textContent = `Jikes Cosmectics`; // fallback for main page
}

// Run search
renderSearchResults(matchingProducts);

// Uncaught (in promise) TypeError: cart.find is not a function
//     at HTMLButtonElement.<anonymous> (searchResults.js:67:33)
// (anonymous)	@	searchResults.js:67