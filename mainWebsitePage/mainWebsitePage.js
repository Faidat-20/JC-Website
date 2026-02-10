
function clickme() {
  window.location.href = "mainWebsitePage.html";
}
// NAVBAR ELEMENTS
const navbar = document.getElementById("navBar");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");

// SEARCH INPUT ACTIVATION 
searchInput.addEventListener("focus", () => {
  navbar.classList.add("search-active");
});
// SEARCH INPUT DEACTIVATION 
closeSearch.addEventListener("click", () => {
  navbar.classList.remove("search-active");
  searchInput.blur();
});

//  CART ELEMENTS
const cartWrapper = document.querySelector(".cartWrapper");
const cartOverlay = document.getElementById("cartOverlay");
const pageOverlay = document.getElementById("pageOverlay");

const cartItemsContainer = document.getElementById("cartItems");
const cartItemCountDisplay = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartCount = document.querySelector(".countCart");

const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCart");
const closeCart = document.getElementById("closeCart");
const continueShopping = document.getElementById("continueShopping");

const addToCartButtons = document.querySelectorAll(".addToCart");
const addCartMessage = document.querySelector(".addCartMessage");

// CART STATE
let cart = []; // each item = { name, image, price, quantity }

// CART OVERLAY OPEN
cartWrapper.addEventListener("click", () => {
  cartOverlay.classList.add("active");
  pageOverlay.classList.add("active");
  document.body.classList.add("cart-open");
});

// CART OVERLAY CLOSE / CONTINUE SHOPPING
function closeCartOverlay() {
  cartOverlay.classList.remove("active");
  pageOverlay.classList.remove("active");
  document.body.classList.remove("cart-open");
}
closeCart.addEventListener("click", closeCartOverlay);
continueShopping.addEventListener("click", closeCartOverlay);

// ADD TO CART
let addCartTimer;

addToCartButtons.forEach(button => {
  button.addEventListener("click", () => {
    const itemCard = button.closest(".item");
    const name = itemCard.querySelector("h2").textContent;
    const image = itemCard.querySelector("img").src;
    const priceAmount = itemCard.querySelector(".price").textContent;
    const price = Number(priceAmount.replace(/[₦,]/g, ""));

    const existingItem = cart.find(item => item.name === name);
    
// CHECK IF PRODUCT ALREADY IN CART
    if (existingItem) {
  existingItem.quantity++;
  addCartMessage.textContent = "Product quantity updated in cart!";
  } else {
  cart.push({ name, image, price, quantity: 1 })
  addCartMessage.textContent = "Added to cart";
}
// UPDATE CART UI
    showAddCartMessage();
    renderCart(); 
  });
});

function showAddCartMessage() {
  clearTimeout(addCartTimer);
  addCartMessage.classList.add("show");

  addCartTimer = setTimeout(() => {
    addCartMessage.classList.remove("show");
  }, 1200);
}

// RENDER EMPTY CART STATE
function renderCart() {
  if (cart.length === 0) {
    showEmptyCart();
    return;
  }

  cartItemsContainer.innerHTML = "";
  cartItemsContainer.classList.remove("empty");
  document.querySelector(".cartFooter").classList.remove("empty");

  checkoutBtn.disabled = false;
  checkoutBtn.classList.remove("disabled");
  clearCartBtn.style.display = "inline";

  // UPDATE CART PRICE
  let subtotal = 0;

  cart.forEach((item, index) => {
    subtotal += item.price * item.quantity;

    // CREATES NEW CART ELEMENT
    const cartItem = document.createElement("div");
    cartItem.className = "cartItem";

    cartItem.innerHTML = `
      <img src="${item.image}">
      <div class="cartItemDetails">
        <h4>${item.name}</h4>
        <div class="price">₦${item.price.toLocaleString()}</div>
      </div>
      <div class="cartItemActions">
        <div class="quantityControl">
          <button class="decrease">−</button>
          <span>${item.quantity}</span>
          <button class="increase">+</button>
        </div>
        <i class="fa-solid fa-trash removeItem"></i>
      </div>
    `;

    // QUANTITY CONTROLS
    cartItem.querySelector(".increase").onclick = () => {
      item.quantity++;
      renderCart();
    };

    cartItem.querySelector(".decrease").onclick = () => {
      if (item.quantity > 1) item.quantity--;
      renderCart();
    };
    // REMOVE ITEM
  cartItem.querySelector(".removeItem").onclick = () => {
    cart.splice(index, 1);
    renderCart();
  };


    cartItemsContainer.appendChild(cartItem);
  });

  cartSubtotal.textContent = subtotal.toLocaleString();
  cartItemCountDisplay.textContent = cart.length;
  cartCount.textContent = cart.length;
}

// EMPTY CART 
function showEmptyCart() {
  cartItemsContainer.innerHTML = "";
  cartItemsContainer.classList.add("empty");

  
  cartItemCountDisplay.textContent = 0;
  cartSubtotal.textContent = 0;
  cartCount.textContent = 0;

  // CHECKOUT DISABLED
  checkoutBtn.disabled = true;
  checkoutBtn.classList.add("disabled");

  // PREVENTS EMPTY CART CLEARING
  clearCartBtn.style.display = "none";

  // CENTER FOOTER CONTENT WHEN CART IS EMPTY
  document.querySelector(".cartFooter").classList.add("empty");
}

// ENABLE CLEAR CART 
clearCartBtn.addEventListener("click", () => {
  cart = [];
  showEmptyCart();
});

// ENSURE CORRECT STATE ON PAGE LOAD
showEmptyCart();
