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

  const userId = sessionStorage.getItem("userId");

  if (userId) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "none";
  } else {
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {

        const confirmSwitch = confirm("Do you want to log out and switch users?");
        if (!confirmSwitch) return;

        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        sessionStorage.removeItem("userId");
        localStorage.removeItem("cart");

        window.location.href = "login.html";

      } catch (err) {
        console.error("Logout error:", err);
        alert("Failed to log out.");
      }
    });
  }

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

  // -----------------------------
  // SEARCH BAR
  // -----------------------------
  const navbar = document.getElementById("navBar");
  const searchInput = document.getElementById("searchInput");
  const closeSearch = document.getElementById("closeSearch");

  if (searchInput) {
    searchInput.addEventListener("focus", () => {
      navbar.classList.add("search-active");
    });
  }

  if (closeSearch) {
    closeSearch.addEventListener("click", () => {
      navbar.classList.remove("search-active");
      searchInput.blur();
    });
  }

  // -----------------------------
  // GREETING MESSAGE
  // -----------------------------
  const greeting = document.querySelector(".greeting");
  const greetingMessage = document.querySelector(".greetingMessage");

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

  // -----------------------------
  // CART ELEMENTS
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

  let cartOverlayTimer;
  let addCartTimer;

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

  if (cartWrapper) {
    cartWrapper.addEventListener("click", () => {

      cartOverlay.classList.add("active");
      pageOverlay.classList.add("active");

      document.body.classList.add("cart-open");

      disableScroll();
    });
  }

  function closeCartOverlay() {

    cartOverlay.classList.remove("active");
    pageOverlay.classList.remove("active");

    document.body.classList.remove("cart-open");

    enableScroll();
  }

  if (closeCart) closeCart.addEventListener("click", closeCartOverlay);

  if (continueShopping) continueShopping.addEventListener("click", closeCartOverlay);

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

    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartItemCountDisplay) {

      cartItemCountDisplay.textContent =

        count <= 1 ? `${count} item` : `${count} items`;
    }
  }

  // -----------------------------
  // BACKEND CART UPDATE
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

      const existingItem = cart.find(item => item.name === name);

      if (existingItem) existingItem.quantity++;

      else cart.push({ name, image, price, quantity: 1 });

      renderCart();

      addCartMessage.textContent = "Item added to cart!";

      showAddCartMessage();

      try {

        const res = await fetch(`http://localhost:5000/api/auth/update-cart`, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ userId, name, image, price, action: "add", quantity: 1 })

        });

        const data = await res.json();

        if (!data.success) {

          alert("Failed to add item");

        }

      } catch (err) {

        console.error("Cart Error:", err);
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

          <span>${item.quantity}</span>

        </div>
      `;

      cartItemsContainer.appendChild(cartItem);
    });

    cartSubtotalDisplay.textContent = subtotal.toLocaleString();

    updateCartItemText();

    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function showEmptyCart() {

    if (cartItemsContainer) cartItemsContainer.innerHTML = "";

    updateCartItemText();

    if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = 0;

    if (cartCount) cartCount.textContent = 0;
  }

  // -----------------------------
  // LOAD USER DATA
  // -----------------------------
  if (userId) {

    (async () => {

      try {

        const res = await fetch(`http://localhost:5000/api/auth/userdata/${userId}`);

        const data = await res.json();

        if (data.success) {

          if (Array.isArray(data.cart) && data.cart.length > 0) {

            cart = data.cart;

            renderCart();
          }

          checkNewsletterStatus(data);

        }

      } catch (err) {

        console.error("Error loading user data:", err);
      }

    })();
  }

  // -----------------------------
  // NEWSLETTER (STEP 7)
  // -----------------------------
  const newsletterForm = document.getElementById("newsletterForm");
  const newsletterInput = document.querySelector("#newsletterForm input[name='user_email']");

  function checkNewsletterStatus(userData) {
    if (!newsletterInput) return;
    if (userData.isSubscribed) {
      newsletterInput.disabled = true;

      newsletterInput.value = userData.email;

      if (!document.querySelector(".alreadySubscribedMsg")) {

        const msg = document.createElement("p");

        msg.className = "alreadySubscribedMsg";

        msg.style.color = "green";

        msg.textContent = "You are already subscribed!";

        newsletterForm.appendChild(msg);
      }
    }
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (newsletterInput.disabled) return alert("You are already subscribed.");

      const email = newsletterInput.value.trim();
      if (!email) return alert("Enter your email.");

      const userId = sessionStorage.getItem("userId"); // ✅ get userId from session
      if (!userId) return alert("Make sure the email you input is correct.");

      try {

        const res = await fetch("http://localhost:5000/api/auth/subscribe-newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email })
        });
        const data = await res.json();
        if (data.success) {
          alert("Subscription successful!");
          newsletterInput.disabled = true;
        }
        else {
          alert(data.message || "Subscription failed.");
        }
      } catch (err) {
        console.error("Newsletter error:", err);
        alert("Server error.");
      }
    });
  }

  // INITIAL CART RENDER
  if (cart.length > 0) renderCart();

  else showEmptyCart();
  
    // -----------------------------
  // FOOTER SUBSCRIBE BUTTON & AUTO POPUP
  // -----------------------------
  const overlay = document.getElementById("newsletterOverlay");
  const footerSubscribeBtn = document.querySelector("#footerSubscribeBtn button"); // the button inside the div
  const closeBtn = document.getElementById("closeNewsletter");

  // Show newsletter on footer subscribe click
  if (overlay && footerSubscribeBtn) {
    footerSubscribeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.add("show");
      disableScroll(); // use existing function
    });
  }

  // Close overlay
  if (overlay && closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("show");
      enableScroll(); // use existing function
    });

  }

  // Auto-show newsletter on home page once every 24 hours
  if (currentPage === "mainWebsitePage.html" && overlay) {
    const lastShown = localStorage.getItem("newsletterLastShown");
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastShown || now - lastShown > twentyFourHours) {
      setTimeout(() => {
        overlay.classList.add("show");
        disableScroll();
        localStorage.setItem("newsletterLastShown", now);
      }, 1000); // 1-second delay after page load
    }
  }
});
