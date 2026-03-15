// ✅ Persistent login check
const storedUser = JSON.parse(localStorage.getItem("currentUser"));

if (storedUser) {
    // Sync with sessionStorage if not already set
    if (!sessionStorage.getItem("userId")) {
        sessionStorage.setItem("userId", storedUser.userId);
    }
} else {
    // No user logged in, redirect to login page
    if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
    }
}
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

        localStorage.removeItem("currentUser");

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
  const searchIcon = document.getElementById("icon");
    function redirectToSearchResults() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return; // do nothing if empty
    window.location.href = `searchResults.html?search=${encodeURIComponent(searchTerm)}`;
  }

  // Event listeners
  if (searchInput) {
    // Enter key triggers search
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        redirectToSearchResults();
      }
    });
  }

  // Optional: search icon click triggers search
  if (searchIcon) {
    searchIcon.addEventListener("click", redirectToSearchResults);
  }

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
      else if (currentPage === "searchResults.html") {
      greeting.classList.add("shopPage");
      greetingMessage.innerHTML = `<h1>Search Results</h1>`;
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

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  let overlayOpenCount = 0;

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

  closeCart.addEventListener("click", closeCartOverlay);
  continueShopping.addEventListener("click", closeCartOverlay);

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
    if (cartItemCountDisplay) {
      cartItemCountDisplay.textContent =
        count <= 1 ? `${count} item` : `${count} items`;
    }
    if (cartCount) {
      cartCount.textContent = count; // only unique items
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

  let addCartTimer;

  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
      if (!userId) return alert("Please log in to add items to cart.");
      const itemCard = button.closest(".item");
      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceAmount = itemCard.querySelector(".price").textContent;
      const price = Number(priceAmount.replace(/[₦,]/g, ""));
      const existingItem = cart.find(item => item.name === name);

      if (existingItem) {
        existingItem.quantity++; 
        addCartMessage.textContent = "Product quantity updated in cart!"
      } else {
        cart.push({ name, image, price, quantity: 1 })
        addCartMessage.textContent = "Added to cart!";
      }
      showAddCartMessage();
      renderCart();

      const success = await updateCartBackend(userId, name, image, price, "add", 1);
      if (!success) {
        // rollback frontend cart if backend fails
        if (existingItem) {
          existingItem.quantity--;
        } else {
          cart.pop();
        }
        renderCart();
      }
    });
  });

    // BACKEND CART UPDATE FUNCTION
  // -----------------------------
  async function updateCartBackend(userId, name, image, price, action, quantity = 1) {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/update-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, image, price, action, quantity })
      });
      const data = await res.json();
      if (data.success) {
        cart = data.cart; // update frontend cart from backend
        renderCart();
        return true;
      } else {
        alert("Failed to update cart on server.");
        return false;
      }
    } catch (err) {
      console.error("Cart Error:", err);
      alert("Server error while updating cart.");
      return false;
    }
  }

  // -----------------------------
  // RENDER CART
   // -----------------------------
  function renderCart() {
    if (cart.length === 0) {
      showEmptyCart();
      return;
    }
    if (!cartItemsContainer) {return;}

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

      const increaseBtn = cartItem.querySelector(".increase");
      const decreaseBtn = cartItem.querySelector(".decrease");
      const removeBtn = cartItem.querySelector(".removeItem");

      // QUANTITY CONTROLS / INCREASE
      increaseBtn.addEventListener("click", async () => {
        item.quantity++;
        renderCart();
        showCartOverlayMessage("Product quantity updated!");

        const success = await updateCartBackend(userId, item.name, item.image, item.price, "update", item.quantity);
        if (!success) {
          // rollback if backend fails
          item.quantity--;
          renderCart();
        }
      });

      // QUANTITY CONTROLS / DECREASE
      decreaseBtn.addEventListener("click", async () => {
        if (item.quantity > 1) {
          item.quantity--;
          renderCart();
          showCartOverlayMessage("Product quantity updated!");

          const success = await updateCartBackend(userId, item.name, item.image, item.price, "update", item.quantity);
          if (!success) {
            // rollback if backend fails
            item.quantity++;
            renderCart();
          }
        }
      });

      // REMOVE ITEM
      removeBtn.addEventListener("click", async () => {
        const removedItem = { ...item }; // backup for rollback
        cart.splice(index, 1);
        renderCart();
        showCartOverlayMessage("Product removed from cart!");

        const success = await updateCartBackend(userId, removedItem.name, removedItem.image, removedItem.price, "remove", 0);
        if (!success) {
          cart.splice(index, 0, removedItem); // rollback
          renderCart();
          showCartOverlayMessage("Failed to remove product, rollback applied.");
        }else {
          localStorage.setItem("cart", JSON.stringify(cart)); // sync storage
        }
      });
      cartItemsContainer.appendChild(cartItem);
    });

    cartSubtotalDisplay.textContent = subtotal.toLocaleString();
    updateCartItemText();

    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function showEmptyCart() {
    cartItemsContainer.innerHTML = "";
    cartItemsContainer.classList.add("empty");


    updateCartItemText();
    cartSubtotalDisplay.textContent = 0;
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
  clearCartBtn.addEventListener("click", async () => {
    if (!userId) return alert("Please log in to clear your cart.");
  
    try {
      const res = await fetch("http://localhost:5000/api/auth/clear-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        cart = [];
        showEmptyCart();
        localStorage.setItem("cart", JSON.stringify(cart)); // sync local storage
        showCartOverlayMessage("Cart cleared successfully!");
      } else {
        alert(data.message || "Failed to clear cart.");
      }
    } catch (err) {
      console.error("Clear cart error:", err);
      alert("Server error while clearing cart.");
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

      alert("Make sure the email you input is correct.");

      const usernameInput = newsletterForm.querySelector("input[name='username']");
      const username = usernameInput.value.trim();

      const newsletterInput = newsletterForm.querySelector("input[name='user_email']");
      const email = newsletterInput.value.trim();

      if (!email) return alert("Enter your email.");
      if (!username) return alert("Enter your name.");

      const userId = sessionStorage.getItem("userId"); // ✅ get userId from session

      try {
        const res = await fetch("http://localhost:5000/api/auth/subscribe-newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email, username  })
        });
        const data = await res.json();
        if (data.success) {
          if (data.message === "Subscription successful!") {
            // New subscription
            alert(data.message);
            newsletterInput.disabled = true;
          } else if (data.message === "You are already subscribed! Login.") {
            // Already subscribed
            alert(data.message); // only this alert
          } else {
            // fallback for any other message
            alert(data.message);
      }
        }else {
          alert(data.message || "Subscription failed.");
        }
      } catch (err) {
        console.error("Newsletter error:", err);
        alert("Server error.");
      }
    });
  }

  // INITIAL CART RENDER
  if (cart.length > 0) {
    renderCart();
  } else {
    showEmptyCart();
  }

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

  const prevBtn = document.querySelector(".backwardBtn");
  const nextBtn = document.querySelector(".fowardBtn");
  const pageLinks = document.querySelectorAll(".pages a");

  function getCurrentPageIndex() {
    return Array.from(pageLinks).findIndex(link => link.classList.contains("active"));
  }
  // PREVIOUS PAGE
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

  // NEXT PAGE
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
document.addEventListener("DOMContentLoaded", async () => {
  const userId = sessionStorage.getItem("userId");
  const navRight = document.getElementById("navRight");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userId && navRight && logoutBtn) {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/userdata/${userId}`);
      const data = await res.json();

      if (data.success) {
        const username = data.username && data.username.trim() ? data.username : "User";
        const email = data.email;

        // Create a container div
        const userDiv = document.createElement("div");
        userDiv.id = "loggedInUser";
        userDiv.style.display = "flex";
        userDiv.style.flexDirection = "column";
        userDiv.style.alignItems = "flex-end";
        userDiv.style.marginRight = "10px";
        userDiv.style.fontSize = "0.7rem";
        userDiv.style.color = "#333";

        // Add username and email
        const nameEl = document.createElement("span");
        nameEl.textContent = `Hello, ${username}`;
        nameEl.style.fontWeight = "bold";

        const emailEl = document.createElement("span");
        emailEl.textContent = email;
        emailEl.style.fontSize = "0.5rem";
        emailEl.style.color = "#666";

        userDiv.appendChild(nameEl);
        userDiv.appendChild(emailEl);

        // Insert before logout button
        navRight.insertBefore(userDiv, logoutBtn);

        // Show logout button
        logoutBtn.style.display = "block";

      } else {
        console.log("Failed to fetch user data:", data.message);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }
});