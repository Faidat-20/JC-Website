function clickme() {
    window.location.href = "mainWebsitePage.html";
}

const navbar = document.getElementById("navBar");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");

searchInput.addEventListener("focus", () => {
  navbar.classList.add("search-active");
});


closeSearch.addEventListener("click", () => {
  navbar.classList.remove("search-active");
  searchInput.blur();
});
