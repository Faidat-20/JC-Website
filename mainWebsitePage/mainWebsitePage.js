function clickme() {
    window.location.href = "mainWebsitePage.html";
}

const navbar = document.getElementById("navBar");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");
const cartIcon = document.getElementById("cart");
const closeCart = document.getElementById("closeCart");
const cartWrapper = document.querySelector(".cartWrapper");
const cartOverlay = document.getElementById("cartOverlay");
const pageOverlay = document.getElementById("pageOverlay");

const addToCartButtons = document.querySelectorAll(".addToCart");
const cartCount = document.querySelector(".countCart");
const addCartMessage = document.querySelector(".addCartMessage");

const pageContent = document.querySelector(".pageContent");

const cartItemCountDisplay = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartItemsContainer = document.getElementById("cartItems");
const continueShopping = document.getElementById("continueShopping");

  

// Search Input Activation
searchInput.addEventListener("focus", () => {
  navbar.classList.add("search-active");
});


closeSearch.addEventListener("click", () => {
  navbar.classList.remove("search-active");
  searchInput.blur();
});

// Cart Overlay
cartWrapper.addEventListener("click", () => {
    cartOverlay.classList.add("active");
     pageOverlay.classList.add("active");
    document.body.classList.add("cart-open");
});

closeCart.addEventListener("click", () => {
    cartOverlay.classList.remove("active");
    pageOverlay.classList.remove("active");
    document.body.classList.remove("cart-open");
});
 
// Count cart Display
let cartItemCount = 0;


const addedProducts = new Set();

// Prevent duplicate cart count for same product
addToCartButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (addedProducts.has(index)) {
      return; //
    }

    addedProducts.add(index);
    cartItemCount++;
    cartCount.textContent = cartItemCount;

  });
});

let pullDistance = 0;
let isPulling = false;
let resetTimer;

window.addEventListener("scroll", () => {
  // If user scrolls normally, reset
  if (window.scrollY > 0) {
    resetPull();
  }
});

window.addEventListener(
  "wheel",
  (e) => {
    if (window.scrollY === 0 && e.deltaY < 0) {
      e.preventDefault();

      pullDistance += Math.abs(e.deltaY) * 0.35;
      pullDistance = Math.min(pullDistance, 40);

      pageContent.style.transform = `translateY(${pullDistance}px)`;

      clearTimeout(resetTimer);
      resetTimer = setTimeout(resetPull, 30); // ← quick snap back
    } else {
      resetPull();
    }
  },
  { passive: false }
);


function resetPull() {
  pullDistance = 0;

  pageContent.style.transition = "none";
  pageContent.style.transform = "translateY(0)";

  requestAnimationFrame(() => {
    pageContent.style.transition = "transform 0.06s linear";
  });
}

function showEmptyCart() {
  cartItemCountDisplay.textContent = 0;
  cartSubtotal.textContent = 0;
  checkoutBtn.disabled = true;

  cartItemsContainer.classList.add("empty");
  cartItemsContainer.innerHTML = ""; // empty on purpose
}

cartWrapper.addEventListener("click", () => {
  if (cartItemCount === 0) {
    showEmptyCart();
  }

  cartOverlay.classList.add("active");
  pageOverlay.classList.add("active");
  document.body.classList.add("cart-open");
});

// Close cart overlay on continue shopping click
continueShopping.addEventListener("click", () => {
  cartOverlay.classList.remove("active");
  pageOverlay.classList.remove("active");
  document.body.classList.remove("cart-open");
});

// Add to cart popup message

document.addEventListener("DOMContentLoaded", () => {
  
  if (!addToCartButtons.length || !cartCount || !addCartMessage) return;

  const addedProducts = new Set();
  let cartItemCount = 0;
  let addCartTimer;

  addToCartButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (addedProducts.has(index)) return;

      addedProducts.add(index);
      cartItemCount++;
      cartCount.textContent = cartItemCount;

      button.textContent = "Added";
      button.disabled = true;

      showAddCartMessage();
    });
  });

  function showAddCartMessage() {
    clearTimeout(addCartTimer);
    addCartMessage.classList.add("show");

    addCartTimer = setTimeout(() => {
      addCartMessage.classList.remove("show");
    }, 1000);
  }
});
