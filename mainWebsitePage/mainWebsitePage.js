function clickme() {
  window.location.href = "mainWebsitePage.html";
}

document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // NAVIGATION / GREETING
  // -----------------------------
  const loginBtn = document.querySelector(".login");
  const businessName = document.querySelector(".businessName");
  const currentPage = window.location.pathname.split("/").pop();

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

  if (businessName) {
    businessName.addEventListener("click", () => {
      window.location.href = "mainWebsitePage.html";
    });
  }

  const navbar = document.getElementById("navBar");
  const searchInput = document.getElementById("searchInput");
  const closeSearch = document.getElementById("closeSearch");

  searchInput.addEventListener("focus", () => navbar.classList.add("search-active"));
  closeSearch.addEventListener("click", () => {
    navbar.classList.remove("search-active");
    searchInput.blur();
  });

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
  const cartSubtotal = document.getElementById("cartSubtotal");
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
  cartWrapper.addEventListener("click", () => {
    cartOverlay.classList.add("active");
    pageOverlay.classList.add("active");
    document.body.classList.add("cart-open");
    disableScroll();
  });

  function closeCartOverlay() {
    cartOverlay.classList.remove("active");
    pageOverlay.classList.remove("active");
    document.body.classList.remove("cart-open");
    enableScroll();
  }
  closeCart.addEventListener("click", closeCartOverlay);
  continueShopping.addEventListener("click", closeCartOverlay);

  function showAddCartMessage() {
    clearTimeout(addCartTimer);
    addCartMessage.classList.add("show");
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
    cartItemCountDisplay.textContent = count <= 1 ? `${count} item` : `${count} items`;
  }

  // -----------------------------
  // STEP 5 HELPER: BACKEND CART UPDATE
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
  // STEP 5.1: ADD TO CART → OPTIMISTIC UI + BACKEND
  // -----------------------------
  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const userId = sessionStorage.getItem("userId");
      if (!userId) return alert("Please log in to add items to cart.");

      const itemCard = button.closest(".item");
      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceAmount = itemCard.querySelector(".price").textContent;
      const price = Number(priceAmount.replace(/[₦,]/g, ""));

      // --------- OPTIMISTIC UI
      const existingItem = cart.find(item => item.name === name);
      if (existingItem) existingItem.quantity++;
      else cart.push({ name, image, price, quantity: 1 });

      renderCart();
      addCartMessage.textContent = "Item added to cart!";
      showAddCartMessage();

      // --------- CONFIRM BACKEND
      try {
        const res = await fetch(`http://localhost:5000/api/auth/update-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, name, image, price, action: "add", quantity: 1 })
        });
        const data = await res.json();

        if (!data.success) {
          // Rollback
          if (existingItem) {
            existingItem.quantity--;
            if (existingItem.quantity === 0) cart = cart.filter(i => i.name !== name);
          } else {
            cart = cart.filter(i => i.name !== name);
          }
          renderCart();
          alert(data.message || "Failed to add item.");
        } else {
          cart = data.cart; // final source of truth
          renderCart();
        }
      } catch (err) {
        console.error("Cart Error:", err);
        if (existingItem) {
          existingItem.quantity--;
          if (existingItem.quantity === 0) cart = cart.filter(i => i.name !== name);
        } else {
          cart = cart.filter(i => i.name !== name);
        }
        renderCart();
        alert("Server error. Check console.");
      }
    });
  });

  // -----------------------------
  // STEP 5.2: RENDER CART + UPDATE/REMOVE → BACKEND
  // -----------------------------
  function renderCart() {
    if (cart.length === 0) return showEmptyCart();

    cartItemsContainer.innerHTML = "";
    cartItemsContainer.classList.remove("empty");
    document.querySelector(".cartFooter").classList.remove("empty");

    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove("disabled");
    clearCartBtn.style.display = "inline";

    let subtotal = 0;

    cart.forEach((item, index) => {
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

      // INCREASE QUANTITY → OPTIMISTIC
      cartItem.querySelector(".increase").onclick = async () => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) return alert("Please log in.");
        item.quantity++; renderCart(); showCartOverlayMessage("Product quantity updated!");

        const success = await updateCartBackend(userId, item.name, "increase");
        if (!success) {
          item.quantity--; renderCart(); alert("Failed to update quantity.");
        }
      };

      // DECREASE QUANTITY → OPTIMISTIC
      cartItem.querySelector(".decrease").onclick = async () => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) return alert("Please log in.");
        if (item.quantity > 1) {
          item.quantity--; renderCart(); showCartOverlayMessage("Product quantity updated!");
          const success = await updateCartBackend(userId, item.name, "decrease");
          if (!success) {
            item.quantity++; renderCart(); alert("Failed to update quantity.");
          }
        }
      };

      // REMOVE ITEM → OPTIMISTIC
      cartItem.querySelector(".removeItem").onclick = async () => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) return alert("Please log in.");

        const backupCart = [...cart];
        cart = cart.filter(i => i.name !== item.name);
        renderCart(); showCartOverlayMessage("Product removed from cart!");

        const success = await updateCartBackend(userId, item.name, "remove");
        if (!success) {
          cart = backupCart; renderCart(); alert("Failed to remove item.");
        }
      };

      cartItemsContainer.appendChild(cartItem);
    });

    cartSubtotal.textContent = subtotal.toLocaleString();
    updateCartItemText();
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function showEmptyCart() {
    cartItemsContainer.innerHTML = "";
    cartItemsContainer.classList.add("empty");
    updateCartItemText();
    cartSubtotal.textContent = 0;
    cartCount.textContent = 0;
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add("disabled");
    clearCartBtn.style.display = "none";
    document.querySelector(".cartFooter").classList.add("empty");
  }

    // CLEAR CART → OPTIMISTIC UI + BACKEND
  clearCartBtn.addEventListener("click", async () => {

    const userId = sessionStorage.getItem("userId");

    // Backup cart in case rollback is needed
    const backupCart = [...cart];

    // -------- OPTIMISTIC UI --------
    cart = [];
    showEmptyCart();

    if (!userId) return;

    try {

      const res = await fetch(`http://localhost:5000/api/auth/clear-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (!data.success) {
        // Rollback if backend fails
        cart = backupCart;
        renderCart();
        alert("Failed to clear cart.");
      }

    } catch (err) {

      console.error("Clear Cart Error:", err);

      // Rollback if server error
      cart = backupCart;
      renderCart();
      alert("Server error. Cart restored.");
    }

  });

  // -----------------------------
  // STEP 4b: LOAD USER DATA
  // -----------------------------
  const userId = sessionStorage.getItem("userId");
  if (userId) {
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/userdata/${userId}`);
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.cart) && data.cart.length > 0) { cart = data.cart; renderCart(); }

          if (data.subscribed) {
            const newsletterInput = document.querySelector("#newsletterForm input[name='user_email']");
            if (newsletterInput && !document.querySelector(".alreadySubscribedMsg")) {
              newsletterInput.disabled = true;
              newsletterInput.value = data.email;
              const msg = document.createElement("p");
              msg.className = "alreadySubscribedMsg";
              msg.style.color = "#28a745";
              msg.style.textAlign = "center";
              msg.textContent = "You are already subscribed!";
              newsletterForm.appendChild(msg);
            }
          }
        }
      } catch (err) { console.error("Error loading user data:", err); }
    })();
  }

  // INITIAL RENDER
  if (cart.length > 0) renderCart();
  else showEmptyCart();
});