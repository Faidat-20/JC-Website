// INJECT SPINNER INTO EVERY PAGE AUTOMATICALLY
const spinnerDiv = document.createElement("div");
spinnerDiv.className = "pageSpinner";
spinnerDiv.id = "pageSpinner";
spinnerDiv.innerHTML = `<div class="spinnerCircle"></div>`;
document.body.appendChild(spinnerDiv);

function showSpinner() {
  document.getElementById("pageSpinner").classList.add("active");
}
function hideSpinner() {
  document.getElementById("pageSpinner").classList.remove("active");
}

window.addEventListener("pageshow", (e) => {
  hideSpinner();
});

// INJECT TOAST CONTAINER
const toastContainer = document.createElement("div");
toastContainer.className = "toastContainer";
toastContainer.id = "toastContainer";
document.body.appendChild(toastContainer);

// TOAST FUNCTION
let toastTimer;
function showToast(type, message) {
  const container = document.getElementById("toastContainer");

  // Remove any existing toast immediately
  const existing = container.querySelector(".toast");
  if (existing) {
    existing.remove();
  }
  clearTimeout(toastTimer);

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toastMsg">${message}</span>
    <span class="toastClose">✕</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  const close = toast.querySelector(".toastClose");
  const dismiss = () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  };

  close.addEventListener("click", dismiss);
  toastTimer = setTimeout(dismiss, 2000);
}

const storedUser = JSON.parse(localStorage.getItem("currentUser"));

if (storedUser) {
  // Sync with sessionStorage if not already set
  if (!sessionStorage.getItem("userId")) {
    sessionStorage.setItem("userId", storedUser.userId);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "https://jc-website.onrender.com";
  // -----------------------------
  // NAVIGATION / GREETING
  // -----------------------------
  const loginBtn = document.querySelector(".login");
  const logoutBtn = document.getElementById("logoutBtn");
  const businessName = document.querySelector(".businessName");
  const currentPage = window.location.pathname.split("/").pop();
  const userId = sessionStorage.getItem("userId");
  const footerTrack = document.getElementById("footerTrack");

  if (userId) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "none";
    if (footerTrack) footerTrack.style.display = "block";
  } else {
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (footerTrack) footerTrack.style.display = "none";
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {

        const confirmSwitch = confirm("Do you want to log out and switch users?");
        if (!confirmSwitch) return;
        showSpinner();

        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        sessionStorage.removeItem("userId");
        localStorage.removeItem("cart");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";

      } catch (err) {
        console.error("Logout error:", err);
        setTimeout(() => hideSpinner(), 400);
        showToast("error", "Failed to log out.");
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
      showSpinner();
      setTimeout(() => {
        window.location.href = "mainWebsitePage.html";
      }, 600);
    });
  }

  const homeIcon = document.querySelector(".homeIcon");
  if (homeIcon) {
    homeIcon.addEventListener("click", (e) => {
      e.preventDefault();
      showSpinner();
      setTimeout(() => {
        window.location.href = "index.html";
      }, 600);
    });
  }

  const footerTrackBtn = document.querySelector(".footerTrackBtn");
  if (footerTrackBtn) {
    footerTrackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showSpinner();
      setTimeout(() => {
        window.location.href = "track-order.html";
      }, 600);
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
    if (!searchTerm) return;
    showSpinner();
    setTimeout(() => {
      window.location.href = `searchResults.html?search=${encodeURIComponent(searchTerm)}`;
    }, 600);
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

    const pageTitles = {
      "login.html": "Login",
      "searchResults.html": "Search Results",
      "checkout.html": "Checkout",
      "admin.html": "Admin Dashboard",
      "track-order.html": "Track Your Order",
      "shop.html": "Shop"
    };
    const title = pageTitles[currentPage] || (currentPage !== "mainWebsitePage.html" ? "Shop" : null);
    if (title) {
      greeting.classList.add("shopPage");
      greetingMessage.innerHTML = `<h1>${title}</h1>`;
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

  let addCartTimer;
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
  // ADD TO CART
  // -----------------------------

  addToCartButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const itemCard = button.closest(".item");
      const name = itemCard.querySelector("h2").textContent;
      const image = itemCard.querySelector("img").src;
      const priceAmount = itemCard.querySelector(".price").textContent;
      const price = Number(priceAmount.replace(/[₦,]/g, ""));
      const existingItem = cart.find(item => item.name === name);

      // Guest users can add to cart — saved in localStorage only
      if (!userId) {
        if (existingItem) {
          existingItem.quantity++;
          addCartMessage.textContent = "Product quantity updated in cart!";
        } else {
          cart.push({ name, image, price, quantity: 1 });
          addCartMessage.textContent = "Added to cart!";
        }
        showAddCartMessage();
        renderCart();
        return; // skip backend sync
      }

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
      const res = await fetch(`${BASE_URL}/api/auth/update-cart`, {
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
        showToast("error", "Failed to update cart on server.");
        return false;
      }
    } catch (err) {
      console.error("Cart Error:", err);
      showToast("error", "Server error while updating cart.");
      return false;
    }
  }

  function syncCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
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
        syncCart();

        if (!userId) return; // guest — localStorage already updated
        const success = await updateCartBackend(userId, item.name, item.image, item.price, "update", item.quantity);
        if (!success) {
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
          syncCart();

          if (!userId) return; // guest — localStorage already updated
          const success = await updateCartBackend(userId, item.name, item.image, item.price, "update", item.quantity);
          if (!success) {
            item.quantity++;
            renderCart();
          }
        } else {
          const removedItem = { ...item };
          cart.splice(index, 1);
          renderCart();
          showCartOverlayMessage("Product removed from cart!");
          syncCart();

          if (!userId) return; // guest — localStorage already updated
          const success = await updateCartBackend(userId, removedItem.name, removedItem.image, removedItem.price, "remove", 0);
          if (!success) {
            cart.splice(index, 0, removedItem);
            renderCart();
            syncCart();
            showCartOverlayMessage("Failed to remove product, rollback applied.");
          }
        }
      });

      // REMOVE ITEM
      removeBtn.addEventListener("click", async () => {
        const removedItem = { ...item };
        cart.splice(index, 1);
        renderCart();
        showCartOverlayMessage("Product removed from cart!");
        syncCart();

        if (!userId) return; // guest — localStorage already updated
        const success = await updateCartBackend(userId, removedItem.name, removedItem.image, removedItem.price, "remove", 0);
        if (!success) {
          cart.splice(index, 0, removedItem);
          renderCart();
          syncCart();
          showCartOverlayMessage("Failed to remove product, rollback applied.");
        }
      });
      cartItemsContainer.appendChild(cartItem);
    });

    cartSubtotalDisplay.textContent = subtotal.toLocaleString();
    updateCartItemText();

    cartCount.textContent = cart.length;
  }

  // -----------------------------
  // CHECKOUT BUTTON NAVIGATION
  // -----------------------------
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) return;
      localStorage.setItem("cart", JSON.stringify(cart));

      // If not logged in, save cart and send to login first
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        window.location.href = "login.html?redirect=checkout";
        return;
      }

      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
      setTimeout(() => {
        window.location.href = "checkout.html";
      }, 800);
      window.addEventListener("pageshow", (e) => {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = "Checkout";
      });
    });
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
    if (!userId) {
      cart = [];
      showEmptyCart();
      syncCart()
      showCartOverlayMessage("Cart cleared!");
      return;
    }
  
    try {
      const res = await fetch(`${BASE_URL}/api/auth/clear-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        cart = [];
        showEmptyCart();
        syncCart();
        showCartOverlayMessage("Cart cleared successfully!");
      } else {
        showToast("error", data.message || "Failed to clear cart.");
      }
    } catch (err) {
      console.error("Clear cart error:", err);
      showToast("error", "Server error while clearing cart.");
    }
  });

  // -----------------------------
  // LOAD USER DATA
  // -----------------------------
  if (userId) {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/userdata/${userId}`);
        const data = await res.json();
        if (data.success) {

          const backendCart = Array.isArray(data.cart) ? data.cart : [];

          // Only merge guest cart if this is a fresh login (flag set by login.js)
          const justLoggedIn = sessionStorage.getItem("justLoggedIn");
          const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];

          if (justLoggedIn && guestCart.length > 0) {
            sessionStorage.removeItem("justLoggedIn");
            localStorage.removeItem("guestCart");

            for (const guestItem of guestCart) {
              const existing = backendCart.find(i => i.name === guestItem.name);
              if (existing) {
                existing.quantity += guestItem.quantity;
              } else {
                backendCart.push(guestItem);
              }
              await updateCartBackend(userId, guestItem.name, guestItem.image, guestItem.price, "add", guestItem.quantity);
            }
            cart = backendCart;
            renderCart();
          } else if (backendCart.length > 0) {
            cart = backendCart;
            renderCart();
          }
          checkNewsletterStatus(data);
          const navRight = document.getElementById("navRight");
          const logoutBtn = document.getElementById("logoutBtn");

          if (navRight && logoutBtn) {
            const fullUsername = data.username && data.username.trim() ? data.username : "User";
            const firstName = fullUsername.split(" ")[0];
            const firstLetter = firstName.charAt(0).toUpperCase();
            const email = data.email;

            logoutBtn.style.display = "none";

            const existing = document.getElementById("userAvatarWrapper");
            if (existing) existing.remove();

            // Build avatar + dropdown
            const avatarWrapper = document.createElement("div");
            avatarWrapper.id = "userAvatarWrapper";
            avatarWrapper.className = "userAvatar";
            avatarWrapper.setAttribute("title", `Hello, ${firstName}`);
            avatarWrapper.innerHTML = firstLetter;

            const dropdown = document.createElement("div");
            dropdown.className = "userDropdown";
            dropdown.innerHTML = `
              <div class="userDropdownHeader">
                <div class="dropdownName">Hello, ${firstName} 👋</div>
                <div class="dropdownEmail">${email}</div>
              </div>
              <a href="track-order.html" class="userDropdownItem" id="dropdownTrackOrder">
                <i class="fa-solid fa-box"></i> Track Order
              </a>
              <div class="userDropdownDivider"></div>
              <button class="userDropdownItem logout" id="dropdownLogout">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
              </button>
            `;

            avatarWrapper.appendChild(dropdown);
            // Insert avatar before cart
            const cartWrapper = navRight.querySelector(".cartWrapper");
            navRight.insertBefore(avatarWrapper, cartWrapper);

            // Toggle dropdown on avatar click
            avatarWrapper.addEventListener("click", (e) => {
              e.stopPropagation();
              dropdown.classList.toggle("open");
            });

            // Close dropdown when clicking outside
            document.addEventListener("click", () => {
              dropdown.classList.remove("open");
            });

            // Track order link
            dropdown.querySelector("#dropdownTrackOrder").addEventListener("click", (e) => {
              e.preventDefault();
              dropdown.classList.remove("open");
              showSpinner();
              setTimeout(() => {
                window.location.href = "track-order.html";
              }, 600);
            });

            // Logout from dropdown
            dropdown.querySelector("#dropdownLogout").addEventListener("click", async () => {
              const confirmSwitch = confirm("Do you want to log out?");
              if (!confirmSwitch) return;
              showSpinner();
              try {
                await fetch(`${BASE_URL}/api/auth/logout`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" }
                });
                sessionStorage.removeItem("userId");
                localStorage.removeItem("cart");
                localStorage.removeItem("currentUser");
                window.location.href = "login.html";
              } catch (err) {
                console.error("Logout error:", err);
                setTimeout(() => hideSpinner(), 400);
                showToast("error", "Failed to log out.");
              }
            });
          }
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

      const submitBtn = newsletterForm.querySelector("button[type='submit']");
      const originalBtnText = submitBtn.textContent;

      function setLoading(isLoading) {
        if (isLoading) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Please wait...`;
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }

      const usernameInput = newsletterForm.querySelector("input[name='username']");
      const username = usernameInput.value.trim();

      const newsletterInput = newsletterForm.querySelector("input[name='user_email']");
      const email = newsletterInput.value.trim();

      if (!email) return showToast("error", "Please enter your email.");
      if (!username) return showToast("error", "Please enter your name.");

      setLoading(true);
      
      try {
        const res = await fetch(`${BASE_URL}/api/auth/subscribe-newsletter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username  })
        });
        const data = await res.json();
        if (data.success) {
          setLoading(false);
          showToast("info", data.message);
          if (data.message === "Subscription successful!") newsletterInput.disabled = true;
          if (
            data.message === "Subscription successful!" ||
            data.message === "You are already subscribed! Login."
          ) {
            setTimeout(() => {
              overlay.classList.remove("show");
              enableScroll();
            }, 2000);
          }
        }else {
          setLoading(false);
          showToast("error", data.message || "Subscription failed.");
        }
      } catch (err) {
        console.error("Newsletter error:", err);
        setLoading(false);
        showToast("error", "Server error.");
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
      setTimeout(() => {
        if (overlay.classList.contains("show")) {
          overlay.classList.remove("show");
          enableScroll();
        }
      }, 5000);
    }, 1000);
  }
  }
});