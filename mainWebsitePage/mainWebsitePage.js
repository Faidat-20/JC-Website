
function clickme() {
  window.location.href = "mainWebsitePage.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector(".login");

  if (loginBtn) {
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "login.html") {
      loginBtn.classList.add("active");
    }
    loginBtn.addEventListener("click", (e) => {
      if (currentPage === "login.html") {
        e.preventDefault();
        return;
      }
      window.location.href = "login.html";
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const businessName = document.querySelector(".businessName");

  if (businessName) {
    businessName.addEventListener("click", () => {
      window.location.href = "mainWebsitePage.html";
    });
  }
});

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

// Select the greeting container
const greeting = document.querySelector(".greeting");
const greetingMessage = document.querySelector(".greetingMessage");

const currentPage = window.location.pathname.split("/").pop();
if (greeting && greetingMessage) {
  if (currentPage === "login.html") {
    greeting.classList.add("shopPage");
    greetingMessage.innerHTML = `<h1>Login</h1>`;
  }
  else if (currentPage !== "mainWebsitePage.html") {
    greeting.classList.add("shopPage");
    greetingMessage.innerHTML = `<h1>Shop</h1>`;
  }
}

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

const cartOverlayMessage = document.getElementById("cartOverlayMessage");
let cartOverlayTimer;

// CART STATE (LOAD FROM STORAGE)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let overlayOpenCount = 0;

function disableScroll() {
  if (overlayOpenCount === 0) {
    document.body.style.overflow = "hidden";
  }
  overlayOpenCount++;
}

function enableScroll() {
  overlayOpenCount--;
  if (overlayOpenCount <= 0) {
    document.body.style.overflow = "auto";
    overlayOpenCount = 0;
  }
}

// CART OVERLAY OPEN
cartWrapper.addEventListener("click", () => {
  cartOverlay.classList.add("active");
  pageOverlay.classList.add("active");
  document.body.classList.add("cart-open");
  disableScroll();
});

// CART OVERLAY CLOSE / CONTINUE SHOPPING
function closeCartOverlay() {
  cartOverlay.classList.remove("active");
  pageOverlay.classList.remove("active");
  document.body.classList.remove("cart-open");
  enableScroll();
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

function showCartOverlayMessage(message) {
  if (!cartOverlayMessage) return;

  clearTimeout(cartOverlayTimer);

  cartOverlayMessage.textContent = message;
  cartOverlayMessage.classList.add("show");

  cartOverlayTimer = setTimeout(() => {
    cartOverlayMessage.classList.remove("show");
  }, 1200);
}

function updateCartItemText() {
  const count = cart.length;
  cartItemCountDisplay.textContent =
    count <= 1 ? `${count} item` : `${count} items`;
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

    // QUANTITY CONTROLS / INCREASE
    cartItem.querySelector(".increase").onclick = () => {
      item.quantity++;
      renderCart();
      showCartOverlayMessage("Product quantity updated!");
    };

    // QUANTITY CONTROLS / DECREASE
    cartItem.querySelector(".decrease").onclick = () => {
      if (item.quantity > 1) {
        item.quantity--;
        renderCart();
        showCartOverlayMessage("Product quantity updated!");
      }
    };

    // REMOVE ITEM
    cartItem.querySelector(".removeItem").onclick = () => {
      cart.splice(index, 1);
      renderCart();
      showCartOverlayMessage("Product removed from cart!");
      localStorage.setItem("cart", JSON.stringify(cart));
    };



    cartItemsContainer.appendChild(cartItem);
  });

  cartSubtotal.textContent = subtotal.toLocaleString();
  updateCartItemText();

  cartCount.textContent = cart.length;
  localStorage.setItem("cart", JSON.stringify(cart));
}

// EMPTY CART 
function showEmptyCart() {
  cartItemsContainer.innerHTML = "";
  cartItemsContainer.classList.add("empty");

  
  updateCartItemText();
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
  localStorage.setItem("cart", JSON.stringify(cart));
  showEmptyCart();
});

// ENSURE CORRECT STATE ON PAGE LOAD
if (cart.length > 0) {
  renderCart();
} else {
  showEmptyCart();
}

// Sync cart across all open pages
window.addEventListener("storage", (event) => {
  if (event.key === "cart") {
    cart = JSON.parse(event.newValue) || []

    if (cart.length > 0) {
      renderCart();
    } else {
      showEmptyCart();
    }
  }
})

// PAGINATION BUTTONS
const prevBtn = document.querySelector(".backwardBtn");
const nextBtn = document.querySelector(".fowardBtn");
const pageLinks = document.querySelectorAll(".pages a");

function getCurrentPageIndex() {
  return Array.from(pageLinks).findIndex(link => link.classList.contains("active"));
}

if (prevBtn) {
  prevBtn.addEventListener("click", (e) => {
    e.preventDefault(); 
    const currentIndex = getCurrentPageIndex();
    
    if (currentIndex > 0) {
      window.location.href = pageLinks[currentIndex - 1].href;
    } else {
      window.scrollTo(0, 0);
      window.location.reload();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const currentIndex = getCurrentPageIndex();
    
    if (currentIndex < pageLinks.length - 1) {
      window.location.href = pageLinks[currentIndex + 1].href;
    } else {
      window.location.href = pageLinks[0].href;
    }
  });
}

// Newsletter elements
const overlay = document.getElementById("newsletterOverlay");
const footerSubscribeBtn = document.getElementById("footerSubscribeBtn");
const closeBtn = document.getElementById("closeNewsletter");

// Auto-show newsletter only on the home page with 24hr limit
if (currentPage === "mainWebsitePage.html" && overlay) {
  window.addEventListener("load", () => {
    const lastShown = localStorage.getItem("newsletterLastShown");
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastShown || now - lastShown > twentyFourHours) {
      setTimeout(() => {
        overlay.classList.add("show");
        disableScroll();
        localStorage.setItem("newsletterLastShown", now);
      }, 1000);
    }
  });
}

// Show newsletter when footer subscribe button is clicked
if (footerSubscribeBtn) {
  footerSubscribeBtn.addEventListener("click", () => {
    overlay.classList.add("show");
    disableScroll();
  });
}

// Close newsletter overlay
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("show");
    enableScroll();
  });
}

// -----------------------------
// NEWSLETTER SUBSCRIPTION (Prevent duplicate emails)
// -----------------------------
const newsletterForm = document.getElementById("newsletterForm");

if (newsletterForm) {

  const messageBox = document.createElement("p");
  messageBox.style.position = "absolute";
  messageBox.style.bottom = "-58px";
  messageBox.style.left = "0";
  messageBox.style.width = "100%";
  messageBox.style.textAlign = "center";
  messageBox.style.fontSize = "14px";
  messageBox.style.color = "#c26b72";

  newsletterForm.style.position = "relative";
  newsletterForm.appendChild(messageBox);

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = newsletterForm.user_email.value.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailPattern.test(email)) {
      messageBox.textContent = "Please enter a valid email.";
      return;
    }

    let subscribers = JSON.parse(localStorage.getItem("subscribers")) || [];

    if (subscribers.includes(email)) {
      messageBox.textContent = "You have already subscribed! Login.";
      return;
    }

    subscribers.push(email);
    localStorage.setItem("subscribers", JSON.stringify(subscribers));

    messageBox.textContent = "";
    newsletterForm.reset();
    overlay.classList.remove("show");
    enableScroll();
  });
}