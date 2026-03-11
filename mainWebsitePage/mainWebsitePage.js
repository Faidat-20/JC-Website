function clickme() {
  window.location.href = "mainWebsitePage.html";
}

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // NAVIGATION / GREETING
  // -----------------------------
  const loginBtn = document.querySelector(".login");
  const logoutBtn = document.getElementById("logoutBtn");
  const businessName = document.querySelector(".businessName");
  const currentPage = window.location.pathname.split("/").pop();

  // Get userId once
  const userId = sessionStorage.getItem("userId");

  // Show/hide login & logout buttons
  if (userId) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "none";
  } else {
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
  }

  // Logout click handler
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        // Clear session & cart
        sessionStorage.removeItem("userId");
        localStorage.removeItem("cart");

        // Redirect to login page
        window.location.href = "login.html";
      } catch (err) {
        console.error("Logout error:", err);
        alert("Failed to log out. Check console.");
      }
    });
  }

  // Login button navigation
  if (loginBtn) {
    if (currentPage === "login.html") loginBtn.classList.add("active");
    loginBtn.addEventListener("click", (e) => {
      if (currentPage === "login.html") {
        e.preventDefault();
        return;
      }
      window.location.href = "login.html";
    });
  }

  // -----------------------------
  // SWITCH USER
  // -----------------------------
  function handleSwitchUser() {
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
      const confirmSwitch = confirm("Do you want to log out and switch users?");
      if (!confirmSwitch) return;

      try {
        // Backend logout
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        // Clear session & user-specific data
        sessionStorage.removeItem("userId");
        localStorage.removeItem("cart");

        const cartItemsContainer = document.getElementById("cartItems");
        if (cartItemsContainer) cartItemsContainer.innerHTML = "";
        const cartSubtotal = document.getElementById("cartSubtotal");
        if (cartSubtotal) cartSubtotal.textContent = "0";
        const cartCount = document.querySelector(".countCart");
        if (cartCount) cartCount.textContent = "0";

        // Reset newsletter
        const newsletterInput = document.querySelector("#newsletterForm input[name='user_email']");
        if (newsletterInput) {
          newsletterInput.disabled = false;
          newsletterInput.value = "";
          const msg = document.querySelector(".alreadySubscribedMsg");
          if (msg) msg.remove();
        }

        // Toggle buttons
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";

        // Redirect
        window.location.href = "login.html";
      } catch (err) {
        console.error("Switch user error:", err);
        alert("Failed to switch users. Check console.");
      }
    });
  }

  // Call switch user handler
  handleSwitchUser();

  // Business name navigation
  if (businessName) {
    businessName.addEventListener("click", () => {
      window.location.href = "mainWebsitePage.html";
    });
  }

  // -----------------------------
  // SEARCH BAR
  // -----------------------------
  const navbar = document.getElementById("navBar");
  const searchInput = document.getElementById("searchInput");
  const closeSearch = document.getElementById("closeSearch");

  if (searchInput) searchInput.addEventListener("focus", () => navbar.classList.add("search-active"));
  if (closeSearch) closeSearch.addEventListener("click", () => {
    navbar.classList.remove("search-active");
    searchInput.blur();
  });

  // -----------------------------
  // GREETING MESSAGE
  // -----------------------------
  const greeting = document.querySelector(".greeting");
  const greetingMessage = document.querySelector(".greetingMessage");

  if (greeting && greetingMessage) {
    if (currentPage === "login.html") {
      greeting.classList.add("shopPage");
      greetingMessage.innerHTML = `<h1>Login</h1>`;
    } else if (currentPage !== "mainWebsitePage.html") {
      greeting.classList.add("shopPage");
      greetingMessage.innerHTML = `<h1>Shop</h1>`;
    }
  }

  // -----------------------------
  // CART ELEMENTS & STATE
  // -----------------------------
  const cartWrapper = document.querySelector(".cartWrapper");
  const cartOverlay = document.getElementById("cartOverlay");
  const pageOverlay = document.getElementById("pageOverlay");

  const cartItemsContainer = document.getElementById("cartItems");
  const cartItemCountDisplay = document.getElementById("cartItemCount");
  const cartSubtotalDisplay = document.getElementById("cartSubtotal");
  const cartCount = document.querySelector(".countCart");

  const checkoutBtn = document.getElementById("checkoutBtn");
  const clearCartBtn = document.getElementById("clearCart");
  const closeCart = document.getElementById("closeCart");
  const continueShopping = document.getElementById("continueShopping");

  const addToCartButtons = document.querySelectorAll(".addToCart");
  const addCartMessage = document.querySelector(".addCartMessage");
  const cartOverlayMessage = document.getElementById("cartOverlayMessage");

  let cartOverlayTimer, addCartTimer;
  let overlayOpenCount = 0;
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function disableScroll() {
    if (overlayOpenCount === 0) document.body.style.overflow = "hidden";
    overlayOpenCount++;
  }

  function enableScroll() {
    overlayOpenCount--;
    if (overlayOpenCount <= 0) {
      document.body.style.overflow = "auto";
      overlayOpenCount = 0;
    }
  }

  // CART OVERLAY
  if (cartWrapper) cartWrapper.addEventListener("click", () => {
    if (cartOverlay) cartOverlay.classList.add("active");
    if (pageOverlay) pageOverlay.classList.add("active");
    document.body.classList.add("cart-open");
    disableScroll();
  });

  if (closeCart) closeCart.addEventListener("click", () => {
    if (cartOverlay) cartOverlay.classList.remove("active");
    if (pageOverlay) pageOverlay.classList.remove("active");
    document.body.classList.remove("cart-open");
    enableScroll();
  });

  if (continueShopping) continueShopping.addEventListener("click", () => {
    if (cartOverlay) cartOverlay.classList.remove("active");
    if (pageOverlay) pageOverlay.classList.remove("active");
    document.body.classList.remove("cart-open");
    enableScroll();
  });

  function showAddCartMessage() {
    clearTimeout(addCartTimer);
    if (addCartMessage) addCartMessage.classList.add("show");
    addCartTimer = setTimeout(() => addCartMessage.classList.remove("show"), 1200);
  }

  function showCartOverlayMessage(message) {
    if (!cartOverlayMessage) return;
    clearTimeout(cartOverlayTimer);
    cartOverlayMessage.textContent = message;
    cartOverlayMessage.classList.add("show");
    cartOverlayTimer = setTimeout(() => cartOverlayMessage.classList.remove("show"), 1200);
  }

  function updateCartItemText() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartItemCountDisplay) cartItemCountDisplay.textContent = count <= 1 ? `${count} item` : `${count} items`;
  }

  // -----------------------------
  // HELPER: BACKEND CART UPDATE
  // -----------------------------
  async function updateCartBackend(userId, name, action) {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/update-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, action })
      });
      const data = await res.json();
      if (data.success) {
        cart = data.cart;
        renderCart();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Cart Error:", err);
      return false;
    }
  }

  // -----------------------------
  // ADD TO CART
  // -----------------------------
  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
      if (!userId) return alert("Please log in to add items to cart.");

      const itemCard = button.closest(".item");
      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceAmount = itemCard.querySelector(".price").textContent;
      const price = Number(priceAmount.replace(/[₦,]/g, ""));

      // Optimistic UI
      const existingItem = cart.find(item => item.name === name);
      if (existingItem) existingItem.quantity++;
      else cart.push({ name, image, price, quantity: 1 });

      renderCart();
      if (addCartMessage) addCartMessage.textContent = "Item added to cart!";
      showAddCartMessage();

      // Backend confirmation
      try {
        const res = await fetch(`http://localhost:5000/api/auth/update-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, name, image, price, action: "add", quantity: 1 })
        });
        const data = await res.json();
        if (!data.success) {
          if (existingItem) { existingItem.quantity--; if (existingItem.quantity === 0) cart = cart.filter(i => i.name !== name); }
          else cart = cart.filter(i => i.name !== name);
          renderCart();
          alert(data.message || "Failed to add item.");
        } else { cart = data.cart; renderCart(); }
      } catch (err) {
        console.error("Cart Error:", err);
        if (existingItem) { existingItem.quantity--; if (existingItem.quantity === 0) cart = cart.filter(i => i.name !== name); }
        else cart = cart.filter(i => i.name !== name);
        renderCart();
        alert("Server error. Check console.");
      }
    });
  });

  // -----------------------------
  // RENDER CART
  // -----------------------------
  function renderCart() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) return showEmptyCart();

    cartItemsContainer.innerHTML = "";
    cartItemsContainer.classList.remove("empty");
    document.querySelector(".cartFooter")?.classList.remove("empty");

    if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.classList.remove("disabled"); }
    if (clearCartBtn) clearCartBtn.style.display = "inline";

    let subtotal = 0;

    cart.forEach((item) => {
      subtotal += item.price * item.quantity;

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

      // Increase/Decrease/Remove
      cartItem.querySelector(".increase").onclick = async () => {
        item.quantity++; renderCart(); showCartOverlayMessage("Product quantity updated!");
        const success = await updateCartBackend(userId, item.name, "increase");
        if (!success) { item.quantity--; renderCart(); alert("Failed to update quantity."); }
      };
      cartItem.querySelector(".decrease").onclick = async () => {
        if (item.quantity > 1) { item.quantity--; renderCart(); showCartOverlayMessage("Product quantity updated!"); 
          const success = await updateCartBackend(userId, item.name, "decrease");
          if (!success) { item.quantity++; renderCart(); alert("Failed to update quantity."); }
        }
      };
      cartItem.querySelector(".removeItem").onclick = async () => {
        const backupCart = [...cart];
        cart = cart.filter(i => i.name !== item.name); renderCart(); showCartOverlayMessage("Product removed!");
        const success = await updateCartBackend(userId, item.name, "remove");
        if (!success) { cart = backupCart; renderCart(); alert("Failed to remove item."); }
      };

      cartItemsContainer.appendChild(cartItem);
    });

    if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = subtotal.toLocaleString();
    updateCartItemText();
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function showEmptyCart() {
    if (cartItemsContainer) cartItemsContainer.innerHTML = "";
    cartItemsContainer?.classList.add("empty");
    updateCartItemText();
    if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = 0;
    if (cartCount) cartCount.textContent = 0;
    if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.classList.add("disabled"); }
    if (clearCartBtn) clearCartBtn.style.display = "none";
    document.querySelector(".cartFooter")?.classList.add("empty");
  }

  // -----------------------------
  // CLEAR CART
  // -----------------------------
  if (clearCartBtn) clearCartBtn.addEventListener("click", async () => {
    const backupCart = [...cart];
    cart = []; showEmptyCart();
    if (!userId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/auth/clear-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!data.success) { cart = backupCart; renderCart(); alert("Failed to clear cart."); }
    } catch (err) {
      console.error("Clear Cart Error:", err);
      cart = backupCart; renderCart();
      alert("Server error. Cart restored.");
    }
  });

  // -----------------------------
  // LOAD USER DATA
  // -----------------------------
  if (userId) {
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/userdata/${userId}`);
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.cart) && data.cart.length > 0) { cart = data.cart; renderCart(); }
        }
      } catch (err) { console.error("Error loading user data:", err); }
    })();
  }

  // INITIAL CART RENDER
  if (cart.length > 0) renderCart();
  else showEmptyCart();
});