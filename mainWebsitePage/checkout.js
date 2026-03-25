document.addEventListener("DOMContentLoaded", () => {

  const cartItemsContainer = document.getElementById("checkoutCartItems");

  const subtotalEl = document.getElementById("subtotal");
  const checkoutForm = document.getElementById("checkoutForm");

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Render cart items
  function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
      subtotalEl.textContent = "0";
      return;
    }

    let subtotal = 0;

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("cart-item");

      itemDiv.innerHTML = `
        <p><strong>${item.name}</strong> x ${item.quantity}</p>
        <p>₦${itemTotal.toFixed(2)}</p>
      `;

      cartItemsContainer.appendChild(itemDiv);
    });

    subtotalEl.textContent = subtotal.toFixed(2);
  }

  renderCart();

  // =========================
  // 🔴 FIX: prevent crash if form does not exist
  // =========================
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(checkoutForm);
      const orderData = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        email: formData.get("email") || null,
        cart: cart,
        subtotal: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
      };

      console.log("Order Data:", orderData);

      alert("Checkout data collected. Next step: Payment!");
    });
  }

  // =========================
  // DELIVERY PANEL
  // =========================

  const addDeliveryBtn = document.getElementById("addDeliveryBtn");
  const deliveryPanel = document.getElementById("deliveryPanel");
  const closeDelivery = document.getElementById("closeDelivery");
  const deliveryForm = document.getElementById("deliveryForm");

  function disableScroll() {
    document.body.style.overflow = "hidden";
  }

  function enableScroll() {
    document.body.style.overflow = "auto";
  }

  if (addDeliveryBtn && deliveryPanel && closeDelivery) {
    addDeliveryBtn.addEventListener("click", () => {
      deliveryPanel.classList.add("active");
      disableScroll();
    });

    closeDelivery.addEventListener("click", () => {
      deliveryPanel.classList.remove("active");
      enableScroll();
    });
  }

  if (deliveryForm) {
    deliveryForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = Object.fromEntries(new FormData(deliveryForm).entries());
      localStorage.setItem("deliveryDetails", JSON.stringify(formData));

      deliveryPanel.classList.remove("active");
      enableScroll();

      alert("Delivery details saved!");
    });
  }

  // =========================
  // COUNTRY & STATE DROPDOWN
  // =========================

  const countrySelect = document.getElementById("country");
  const stateSelect = document.getElementById("state");

  let countriesData = [];

  // -------------------------
  // Load countries from API
  // -------------------------
  async function loadCountries() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/states");
      const data = await res.json();

      countriesData = data.data;

      console.log("Countries loaded:", countriesData);

      populateCountries();

    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }

  // -------------------------
  // Populate country dropdown
  // -------------------------
  function populateCountries() {
    countrySelect.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "Nigeria";
    placeholderOption.textContent = "Nigeria";
    placeholderOption.selected = true;
    countrySelect.appendChild(placeholderOption);

    countriesData.forEach(country => {
      if (country.name !== "Nigeria") {
        const option = document.createElement("option");
        option.value = country.name;
        option.textContent = country.name;
        countrySelect.appendChild(option);
      }
    });
    updateStates("Nigeria");
  }

  // -------------------------
  // Populate state dropdown
  // -------------------------
  function updateStates(selectedCountry) {
    stateSelect.innerHTML = "";

    const country = countriesData.find(c => c.name === selectedCountry);

    if (!country || !country.states.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No states available";
      stateSelect.appendChild(option);
      return;
    }
    country.states.forEach(state => {
      const option = document.createElement("option");
      option.value = state.name;
      option.textContent = state.name;

      if (selectedCountry === "Nigeria" && state.name === "Lagos") {
        option.selected = true;
      }
      stateSelect.appendChild(option);
    });
  }

  // -------------------------
  // Keep current country selected when focusing dropdown
  // -------------------------
  function resetCountryDropdownKeepSelection() {
    const currentSelection = countrySelect.value;
    countrySelect.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "Nigeria";
    placeholderOption.textContent = "Nigeria";
    countrySelect.appendChild(placeholderOption);

    countriesData.forEach(country => {
      const option = document.createElement("option");
      option.value = country.name;
      option.textContent = country.name;

      if (country.name === currentSelection) {
        option.selected = true;
      }

      countrySelect.appendChild(option);
    });
  }

  countrySelect.addEventListener("focus", () => {
    resetCountryDropdownKeepSelection();
  });

  // -------------------------
  // Update states when country changes
  // -------------------------
  countrySelect.addEventListener("change", () => {
    const selectedCountry = countrySelect.value;
    updateStates(selectedCountry);
  });

  // -------------------------
  // Search-as-you-type feature
  // -------------------------
  countrySelect.addEventListener("input", () => {
    const search = countrySelect.value.toLowerCase();
    const options = countrySelect.querySelectorAll("option");
    options.forEach(opt => {
      if (opt.value.toLowerCase().includes(search) || opt.value === "") {
        opt.style.display = "";
      } else {
        opt.style.display = "none";
      }
    });
  });

  stateSelect.addEventListener("input", () => {
    const search = stateSelect.value.toLowerCase();
    const options = stateSelect.querySelectorAll("option");
    options.forEach(opt => {
      if (opt.value.toLowerCase().includes(search) || opt.value === "") {
        opt.style.display = "";
      } else {
        opt.style.display = "none";
      }
    });
  });

  // -------------------------
  // Initialize
  // -------------------------
  loadCountries();
});