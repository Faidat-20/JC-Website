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

searchInput.addEventListener("focus", () => {
  navbar.classList.add("search-active");
});


closeSearch.addEventListener("click", () => {
  navbar.classList.remove("search-active");
  searchInput.blur();
});

cartWrapper.addEventListener("click", () => {
    cartOverlay.classList.add("active");
    document.body.classList.add("cart-open");
});

closeCart.addEventListener("click", () => {
    cartOverlay.classList.remove("active");
    document.body.classList.remove("cart-open");
});