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

const pageContent = document.querySelector(".pageContent");

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

addToCartButtons.forEach(button => {
  button.addEventListener("click", () => {
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
