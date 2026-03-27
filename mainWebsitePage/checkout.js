document.addEventListener("DOMContentLoaded", () => {

  const cartItemsContainer = document.getElementById("checkoutCartItems");

  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  const checkoutForm = document.getElementById("checkoutForm");

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  localStorage.removeItem("selectedShipping");

  // CHECKOUT CART MESSAGE
  let checkoutMessageTimer;
  function showCheckoutMessage(message) {
    const addCartMessage = document.querySelector(".addCartMessage");
    if (!addCartMessage) return;
    clearTimeout(checkoutMessageTimer);
    addCartMessage.textContent = message;
    addCartMessage.classList.add("show");
    checkoutMessageTimer = setTimeout(() => {
      addCartMessage.classList.remove("show");
    }, 1200);
  }
  // BACKEND CART SYNC
  const userId = sessionStorage.getItem("userId");

  async function updateCartBackend(name, image, price, action, quantity = 1) {
    try {
      const res = await fetch("http://localhost:5000/api/auth/update-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, image, price, action, quantity })
      });
      const data = await res.json();
      if (data.success) {
        return true;
      } else {
        console.error("Backend cart update failed:", data.message);
        return false;
      }
    } catch (err) {
      console.error("Cart backend error:", err);
      return false;
    }
  }
  // Render cart items
  function renderCart() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";
    let subtotal = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
      subtotalEl.textContent = "0";
      totalEl.textContent = "0";
      return;
    }

    cart.forEach((item, index) => {
      subtotal += item.price * item.quantity;

      const cartItem = document.createElement("div");
      cartItem.className = "checkoutCartItem";

      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="checkoutCartImage">
        <div class="checkoutCartDetails">
          <h4>${item.name}</h4>

          <div class="checkoutQuantityControl">
            <button class="decrease">−</button>
            <span class="quantity">${item.quantity}</span>
            <button class="increase">+</button>
          </div>
        </div>

        <p class="checkoutCartPrice">
          ₦${(item.price * item.quantity).toLocaleString()}
        </p>
      `;

      const increaseBtn = cartItem.querySelector(".increase");
      const decreaseBtn = cartItem.querySelector(".decrease");
      const quantityEl = cartItem.querySelector(".quantity");

      increaseBtn.addEventListener("click", async () => {
        item.quantity++;
        quantityEl.textContent = item.quantity;
        const priceEl = cartItem.querySelector(".checkoutCartPrice");
        priceEl.textContent = `₦${(item.price * item.quantity).toLocaleString()}`;

        updateTotals();
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
        showCheckoutMessage("Product quantity updated!");

        const success = await updateCartBackend(item.name, item.image, item.price, "update", item.quantity);
        if (!success) {
          item.quantity--;
          renderCart();
        }
      });

      decreaseBtn.addEventListener("click", async () => {
        const removedItem = { ...item };
        if (item.quantity > 1) {
          item.quantity--;
          quantityEl.textContent = item.quantity;
          const priceEl = cartItem.querySelector(".checkoutCartPrice");
          priceEl.textContent = `₦${(item.price * item.quantity).toLocaleString()}`;
          
          updateTotals();
          localStorage.setItem("cart", JSON.stringify(cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
          showCheckoutMessage("Product quantity updated!");

          const success = await updateCartBackend(item.name, item.image, item.price, "update", item.quantity);
          if (!success) {
            item.quantity++;
            renderCart();
          }
        } else {
          cart.splice(index, 1);
          renderCart();
          localStorage.setItem("cart", JSON.stringify(cart));
          window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
          showCheckoutMessage("Product removed from cart!");

          const success = await updateCartBackend(removedItem.name, removedItem.image, removedItem.price, "remove", 0);
          if (!success) {
            cart.splice(index, 0, removedItem);
            renderCart();
            localStorage.setItem("cart", JSON.stringify(cart));
            window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
            showCheckoutMessage("Failed to remove product, rollback applied.");
          }
        }
      });

      cartItemsContainer.appendChild(cartItem);
    });

    updateTotals();
  }

  // Updates subtotal and total
  function updateTotals() {
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.quantity);

    subtotalEl.textContent = subtotal.toLocaleString();
    // add shipping if selected
    const shipping = JSON.parse(localStorage.getItem("selectedShipping"))?.price || 0;
    totalEl.textContent = (subtotal + shipping).toLocaleString();
  }

  renderCart();

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

  // DELIVERY PANEL
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

  // COUNTRY & STATE DROPDOWN
  const countrySelect = document.getElementById("country");
  const stateSelect = document.getElementById("state");

  let countriesData = [];

  // Load countries from API
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

  // Populate country dropdown
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

  // Populate state dropdown
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

  // Keep current country selected when focusing dropdown
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

  // Update states when country changes
  countrySelect.addEventListener("change", () => {
    const selectedCountry = countrySelect.value;
    updateStates(selectedCountry);
  });

  // Search-as-you-type feature
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

  // Initialize
  loadCountries();

  const shippingOptions = document.querySelectorAll("input[name='shipping']");
  function updateTotal() {
    let subtotal = Number(subtotalEl.textContent.replace(/,/g, "")) || 0;

    // Get shipping from localStorage (more reliable)
    const savedShipping = JSON.parse(localStorage.getItem("selectedShipping"));
    const shipping = savedShipping ? savedShipping.price : 0;

    // Update shipping display
    const shippingEl = document.getElementById("shippingAmount");
    if (shippingEl) {
      shippingEl.textContent = shipping.toLocaleString();
    }

    const total = subtotal + shipping;
    totalEl.textContent = total.toLocaleString();
  }

  shippingOptions.forEach(option => {
    option.addEventListener("change", updateTotal);
  });
  updateTotal();

  // SHIPPING PANEL
  const shippingSectionBtn = document.getElementById("shippingSectionBtn");
  const shippingPanel = document.getElementById("shippingPanel");
  const closeShipping = document.getElementById("closeShipping");
  const shippingForm = document.getElementById("shippingForm");
  let shippingOptionsContainer = null;
  let shippingSelected = false; 
  let isChangeClick = false;

  if (shippingForm) {
    shippingOptionsContainer = shippingForm.querySelector(".shippingOptions");
  }

  const shippingData = [
    { name: "GUO for Interstate Delivery(UGBOWO, Aba, Abakaliki, Asaba, Awka, Bauchi, Enugu, Utako, Gwarinpa, Mararaba, Kubwa, Wuse2, Zuba, Zaria, Yola, Imo, Umuahia, Sokoto, Nnewi, Jos)", desc:"GUO Charge based on the weight of the item, if the price is more than 4500 you’d be contacted to balance up and if it’s lesser than 4500 you’d be refunded.", price: 4500 },
    { name: "Lagos mainland", desc: "Our delivery days are Tuesday, Thursday, and Saturday. Delivery within Lagos takes 1-2business days this means that you either get it on the same day or next day. In cases where it rains or the rider encounters issues on the way delivery might be slow.", price: 3500 },
    { name: "Ikorodu", desc: "Delivery within Lagos takes 1-2 business days this means that you either get it on the same day or next day. In cases where it rains or the rider encounters issues on the way delivery might be slow.", price: 5000 },
    { name: "Pick Up", desc: "Beside Idimu Central Mosque, Idimu Bus Stop, Ikotun Road, Lagos. Kindly confirm if your item has been packed before sending a rider.", price: 0 },
    { name: "Northern States", desc: "GIG DELIVERY (delivery fee charged based on weight of the item, if it’s more than the stated amount you’d be contacted to balance up and if it is lesser you’d be refunded)", price: 7000 },
    { name: "PARK DELIVERY (Ibadan, Ago Iwoye, Ijebu Ode, Abeokuta, Ilaro, Mowe Ibafo, Ifo, Saapade, Ogun State, Ondo, Akure, Owo, Akungba, Ife, Oshogbo, Ogbomosho, Owode, Oyo, Saki, Ekiti, Ilorin, Offa)", desc: "PAY THE DRIVER", price: 0 },
    { name: "Far Distanced Lagos Mainland And Out Skirt", desc: "Delivery within Lagos takes 1-2 business days this means that you either get it on the same day or next day. In cases where it rains or the rider encounters issues on the way delivery might be slow.", price: 4000 },
    { name: "Lagos Island", desc: "Delivery within Lagos takes 1-2 business days this means that you either get it on the same day or next day. In cases where it rains or the rider encounters issues on the way delivery might be slow.", price: 4500 },
    { name: "Ajah, Ibeju Lekki, Outskirts Island", desc: "Delivery within Lagos takes 1-2 business days this means that you either get it on the same day or next day. In cases where it rains or the rider encounters issues on the way delivery might be slow.", price: 6500 },
    { name: "GIG for Interstate Delivery", desc: "GIG charge based on weight, if price more than 5000 you'll be contacted to balance up and if it’s lesser you’d be refunded.", price: 5000 },
    { name: "Ajegunle, Ojo, Ago Palace, Ayobo, Berger, Omole, Ilupeju, CMS, Oworo, Magodo, Alagbado, Gbagada, Mile2, Maza Maza,", desc: "Delivery within Lagos takes 1-2 business days , this means that you either get it on the same day or next day. In cases where it rains or the rider encounters issues on the way delivery might be slow.", price: 4000 },
    { name: "PARK DELIVERY FOR SMALL ITEMS( Abraka, Asaba, Benin, Sapele, Warri, Portharcourt, Bayelsa, Ughelli, Ozoro, Ogwashi Uku, Ubulu Uku, Isele Uku)", desc: "Small items 0-3kg If the price is more, you’d be contacted to balance up.", price: 4000 },
    { name: "PARK DELIVERY FOR BIG ITEMS( Abraka, Asaba, Benin, Sapele, Warri, Portharcourt, Bayelsa, Ughelli, Ozoro, Ogwashi Uku, Ubulu Uku, Isele Uku)", desc: "If price is more, you'll be contacted to balance up", price: 7000 },
    { name: "Waybill", desc: "", price: 8500 }
  ];

  // Function to render shipping options
  function renderShippingOptions() {
    shippingOptionsContainer.innerHTML = "";
    const savedShipping = JSON.parse(localStorage.getItem("selectedShipping"));
    shippingData.forEach((option, index) => {
      const div = document.createElement("div");
      div.classList.add("shippingOption");
      div.innerHTML = `
        <label class="shippingOptionLabel">

          <input 
            type="radio" 
            name="shipping" 
            value="${option.price}" 
            data-name="${option.name}"
            ${
              isChangeClick && savedShipping && savedShipping.name === option.name
                ? "checked"
                : ""
            }
          >

          <p class="shippingText">
            <strong>${option.name}</strong><br>
            ${option.desc}
          </p>

          <span class="shippingPrice">₦${option.price.toLocaleString()}</span>

        </label>
      `;
      shippingOptionsContainer.appendChild(div);
    });

    const shippingRadios = shippingOptionsContainer.querySelectorAll("input[name='shipping']");
    shippingRadios.forEach(radio => {
      radio.addEventListener("change", () => {
        const selectedOption = shippingData.find(
          opt => opt.price == radio.value && opt.name === radio.dataset.name
        );
        if (!selectedOption) return;

        shippingSectionBtn.innerHTML = `<strong>${selectedOption.name}</strong><br>${selectedOption.desc}`;
        shippingSelected = true;

        shippingSectionBtn.style.border = "none";
        const shippingChoice = {
          name: selectedOption.name,
          price: Number(selectedOption.price)
        };
        localStorage.setItem("selectedShipping", JSON.stringify(shippingChoice));

        updateTotal();
      });
    });
  }
  if (shippingSectionBtn && shippingPanel && closeShipping && shippingOptionsContainer) {
    const shippingDisplayText = document.getElementById("shippingDisplayText");
    const shippingChangeTag = document.getElementById("shippingChangeTag");

    function handleShippingSelection(selectedOption) {
      shippingSectionBtn.style.display = "none";
      shippingDisplayText.innerHTML = `
        <div class="shippingDisplayWrapper">
          <p class="shippingDisplayName">${selectedOption.name}</p>
          <p class="shippingDisplayDesc">${selectedOption.desc}</p>
        </div>
      `;
      shippingChangeTag.style.display = "inline";
      shippingDisplayText.style.border = "none";
      localStorage.setItem("selectedShipping", JSON.stringify({
        name: selectedOption.name,
        price: Number(selectedOption.price)
      }));

      updateTotal();
      shippingSelected = true;
    }
    function attachShippingListeners() {
      const shippingRadios = shippingOptionsContainer.querySelectorAll("input[name='shipping']");
      shippingRadios.forEach(radio => {
        radio.addEventListener("change", () => {
          const selectedOption = shippingData.find(
            opt => opt.price == radio.value && opt.name === radio.dataset.name
          );
          if (!selectedOption) return;
          handleShippingSelection(selectedOption);
          shippingPanel.classList.remove("active");
          enableScroll();
        });
      });
    }

    // Open panel via original button (first time only)
    shippingSectionBtn.addEventListener("click", () => {
      if (!shippingSelected) {
        isChangeClick = false;
        shippingPanel.classList.add("active");
        disableScroll();
        renderShippingOptions();
        attachShippingListeners();
      }
    });
    // Open panel via "Change"
    shippingChangeTag.addEventListener("click", () => {
      isChangeClick = true; 
      shippingPanel.classList.add("active");
      disableScroll();
      renderShippingOptions();
      attachShippingListeners();
    });

    // Close panel
    closeShipping.addEventListener("click", () => {
      shippingPanel.classList.remove("active");
      enableScroll();
    });
  }

  // Save selected shipping
  if (shippingForm) {
    shippingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const selected = shippingForm.querySelector("input[name='shipping']:checked");
      if (!selected) return alert("Please select a shipping option!");

      // Save to localStorage
      const shippingChoice = {
        name: selected.dataset.name,
        price: Number(selected.value)
      };
      localStorage.setItem("selectedShipping", JSON.stringify(shippingChoice));

      // Update the button text to show selected option
      shippingSectionBtn.textContent = `${shippingChoice.name} - ₦${shippingChoice.price.toLocaleString()}`;

      shippingPanel.classList.remove("active");
      enableScroll();

      // Update total
      updateTotal();
    });
  }
  // Sync checkout cart when main page updates localStorage
  window.addEventListener("storage", (event) => {
    if (event.key === "cart") {
      const updatedCart = JSON.parse(event.newValue) || [];
      cart.length = 0;
      updatedCart.forEach(item => cart.push(item));
      renderCart();
    }
  });
});