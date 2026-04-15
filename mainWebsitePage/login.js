document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // INITIALIZE EMAILJS (optional)
  // -----------------------------
  const EMAILJS_PUBLIC_KEY = "LwQCTrUmqyQcsHYsO";
  emailjs.init(EMAILJS_PUBLIC_KEY);

  // -----------------------------
  // VARIABLES
  // -----------------------------
  const BASE_URL = "https://jc-website.onrender.com";
  const overlay = document.getElementById("newsletterOverlay");
  const footerSubscribeBtn = document.getElementById("footerSubscribeBtn");
  const closeBtn = document.getElementById("closeNewsletter");
  const getOtpBtn = document.getElementById("getOtpBtn");
  const userEmail = document.getElementById("userEmail");
  const loginContainer = document.querySelector(".loginContainer");
  const newsletterForm = document.getElementById("newsletterForm");

  let currentEmail = "";
  let resendTimer = null;
  let resendCountdown = 60;

  // -----------------------------
  // GET OTP
  // -----------------------------
  if (getOtpBtn && userEmail) {
    getOtpBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = userEmail.value.trim();
      currentEmail = email;

      if (!email) return showToast("error", "Please enter your email.");
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) return showToast("error", "Please enter a valid email.");
      
      // Remove subscribe prompt if user is retrying after subscribing
      const existingPrompt = document.getElementById("subscribePrompt");
      if (existingPrompt) existingPrompt.remove();

      showSpinner();
      try {
        const resCheck = await fetch(`${BASE_URL}/api/auth/check-or-create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const dataCheck = await resCheck.json();
        if (!dataCheck.success) {
          setTimeout(() => hideSpinner(), 400);
          return showToast("error", dataCheck.message || "Error checking user.");
        }

        if (!dataCheck.subscribed) {
          setTimeout(() => hideSpinner(), 400);

          // Show inline subscribe prompt inside the login box
          if (!document.getElementById("subscribePrompt")) {
            const loginParagraph = loginContainer.querySelector("p");
            if (loginParagraph) loginParagraph.textContent = "You need to subscribe before you can log in.";

            const prompt = document.createElement("div");
            prompt.id = "subscribePrompt";
            prompt.style.cssText = `
              background: #fff8f0;
              border: 1.5px solid hsl(357, 45%, 69%);
              border-radius: 10px;
              padding: 16px;
              margin-bottom: 1rem;
              text-align: center;
              font-size: 14px;
              color: #555;
            `;
            prompt.innerHTML = `
              <p style="margin-bottom: 12px;">
                You're not subscribed yet. Subscribe first with the email 
                <strong>${userEmail.value.trim()}</strong> to create your account, 
                then come back to log in.
              </p>
              <button id="openSubscribeBtn" style="
                width: 100%;
                padding: 12px;
                background: hsl(357, 45%, 69%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: bold;
                cursor: pointer;
              ">Subscribe now</button>
            `;

            // Insert prompt above the Get OTP button
            loginContainer.insertBefore(prompt, getOtpBtn);

            // Open the newsletter overlay when they click Subscribe now
            document.getElementById("openSubscribeBtn").addEventListener("click", () => {
              const newsletterOverlay = document.getElementById("newsletterOverlay");
              const newsletterEmailInput = document.querySelector("#newsletterForm input[name='user_email']");
              if (newsletterOverlay) {
                // Pre-fill the email they already typed
                if (newsletterEmailInput) {
                  newsletterEmailInput.value = userEmail.value.trim();
                }
                newsletterOverlay.classList.add("show");
                document.body.style.overflow = "hidden";
              }
            });
          }
          return;
        }

        const resOtp = await fetch(`${BASE_URL}/api/auth/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (!resOtp.ok) {
          hideSpinner();
          const dataErr = await resOtp.json();
          return showToast("error", dataErr.message || "Failed to request OTP.");
        }

        const dataOtp = await resOtp.json();
        if (dataOtp.success) {
          setTimeout(() => hideSpinner(), 400);
          showToast("success", `OTP sent successfully to ${email}`);
          showOtpInput();
        } else {
          setTimeout(() => hideSpinner(), 400);
          showToast("error", dataOtp.message || "Failed to send OTP.");
        }

      } catch (err) {
        console.error("Error:", err);
        hideSpinner();
        showToast("error", "Server error. Check console.");
      }
    });
  }

  // -----------------------------
  // SHOW OTP INPUT
  // -----------------------------
  function showOtpInput() {
    if (document.getElementById("otpInput")) return;

    getOtpBtn.style.display = "none";
    userEmail.style.display = "none";

    const loginParagraph = loginContainer.querySelector("p");
    if (loginParagraph) loginParagraph.textContent = "Enter the OTP code sent to your email.";

    // Back arrow
    const backArrow = document.createElement("button");
    backArrow.id = "backArrowBtn";
    backArrow.textContent = "← Back";
    backArrow.style.cssText = `
      all: unset;
      position: absolute;
      top: 0.4cm;
      left: 0.4cm;
      cursor: pointer;
      font-size: 0.95rem;
      color: inherit;
      font: inherit;
    `;
    loginContainer.style.position = "relative";

    // OTP input
    const otpInput = document.createElement("input");
    otpInput.id = "otpInput";
    otpInput.placeholder = "Enter OTP";
    otpInput.style.marginBottom = "0.5rem";

    // Verify button
    const verifyBtn = document.createElement("button");
    verifyBtn.id = "verifyOtpBtn";
    verifyBtn.textContent = "Verify OTP";
    verifyBtn.style.marginBottom = "1rem";

    // Resend OTP row
    const resendRow = document.createElement("div");
    resendRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    `;

    const resendLabel = document.createElement("span");
    resendLabel.style.cssText = "font-size: 0.85rem; color: #666;";
    resendLabel.textContent = "Didn't receive the code?";

    const resendBtn = document.createElement("button");
    resendBtn.id = "resendOtpBtn";
    resendBtn.textContent = "Resend OTP";
    resendBtn.style.cssText = `
      all: unset;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: bold;
      color: hsl(357, 45%, 69%);
      text-decoration: underline;
    `;

    const timerSpan = document.createElement("span");
    timerSpan.id = "resendTimer";
    timerSpan.style.cssText = "font-size: 0.8rem; color: #999;";
    timerSpan.textContent = "";

    resendRow.appendChild(resendLabel);
    resendRow.appendChild(resendBtn);
    resendRow.appendChild(timerSpan);

    loginContainer.appendChild(backArrow);
    loginContainer.appendChild(otpInput);
    loginContainer.appendChild(verifyBtn);
    loginContainer.appendChild(resendRow);

    // Start cooldown immediately after first OTP send
    startResendCooldown(resendBtn, timerSpan);

    // Back button
    backArrow.addEventListener("click", () => {
      clearInterval(resendTimer);
      otpInput.remove();
      verifyBtn.remove();
      backArrow.remove();
      resendRow.remove();

      getOtpBtn.style.display = "block";
      userEmail.style.display = "block";
      if (loginParagraph) loginParagraph.textContent = "Enter your email below to receive an OTP.";
    });

    // Resend button
    resendBtn.addEventListener("click", async () => {
      if (resendBtn.disabled) return;
      showSpinner();
      try {
        const res = await fetch(`${BASE_URL}/api/auth/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail })
        });
        const data = await res.json();
        setTimeout(() => hideSpinner(), 400);
        if (data.success) {
          showToast("success", `OTP resent to ${currentEmail}`);
          startResendCooldown(resendBtn, timerSpan);
        } else {
          showToast("error", data.message || "Failed to resend OTP.");
        }
      } catch (err) {
        console.error("Resend OTP error:", err);
        setTimeout(() => hideSpinner(), 400);
        showToast("error", "Server error. Please try again.");
      }
    });

    // Verify button
    verifyBtn.addEventListener("click", async () => {
      const enteredOTP = otpInput.value.trim();
      if (!enteredOTP) return showToast("error", "Please enter the OTP.");
      showSpinner();

      try {
        const resVerify = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail, otp: enteredOTP })
        });
        const dataVerify = await resVerify.json();

        if (dataVerify.success) {
          sessionStorage.setItem("userId", dataVerify.userId);
          localStorage.setItem("currentUser", JSON.stringify({
            userId: dataVerify.userId,
            username: dataVerify.username || "User",
            email: currentEmail
          }));
          // Save guest cart separately before merging, and flag this as a fresh login
          const currentGuestCart = JSON.parse(localStorage.getItem("cart")) || [];
          if (currentGuestCart.length > 0) {
            localStorage.setItem("guestCart", JSON.stringify(currentGuestCart));
          }
          sessionStorage.setItem("justLoggedIn", "true");
          showToast("success", "Login successful!");
          // If user came from checkout flow, send them to checkout
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect");
          if (redirect === "checkout") {
            window.location.href = "checkout.html";
          } else {
            window.location.href = "mainWebsitePage.html";
          }
        } else {
          setTimeout(() => hideSpinner(), 400);
          showToast("error", dataVerify.message || "Incorrect OTP");
        }

      } catch (err) {
        console.error("Error verifying OTP:", err);
        setTimeout(() => hideSpinner(), 400);
        showToast("error", "Server error. Check console.");
      }
    });
  }

  // -----------------------------
  // RESEND COOLDOWN TIMER
  // -----------------------------
  function startResendCooldown(resendBtn, timerSpan) {
    resendBtn.style.opacity = "0.4";
    resendBtn.style.cursor = "not-allowed";
    resendBtn.disabled = true;

    clearInterval(resendTimer);
    resendCountdown = 60;
    timerSpan.textContent = `(${resendCountdown}s)`;

    resendTimer = setInterval(() => {
      resendCountdown--;
      timerSpan.textContent = `(${resendCountdown}s)`;

      if (resendCountdown <= 0) {
        clearInterval(resendTimer);
        timerSpan.textContent = "";
        resendBtn.style.opacity = "1";
        resendBtn.style.cursor = "pointer";
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  // -----------------------------
  // NEWSLETTER OVERLAY
  // -----------------------------
  if (overlay && footerSubscribeBtn) {
    footerSubscribeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        overlay.classList.remove("show");
        document.body.style.overflow = "auto";

        // If on login page, restore the email input and Get OTP button
        // so user can proceed to login after subscribing
        const getOtpBtn = document.getElementById("getOtpBtn");
        const userEmail = document.getElementById("userEmail");
        const subscribePrompt = document.getElementById("subscribePrompt");
        const loginParagraph = document.querySelector(".loginContainer p");

        if (getOtpBtn && userEmail) {
          if (subscribePrompt) subscribePrompt.remove();
          getOtpBtn.style.display = "block";
          userEmail.style.display = "block";
          if (loginParagraph) loginParagraph.textContent = "Enter your email below to receive an OTP.";
        }
      });
    }
  }

  // -----------------------------
  // NEWSLETTER SUBSCRIPTION
  // -----------------------------
  const newsletterInput = document.querySelector("#newsletterForm input[name='user_email']");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!newsletterInput.value.trim()) return showToast("error", "Enter your email.");

      const email = newsletterInput.value.trim();
      const userId = sessionStorage.getItem("userId");
      const usernameInput = newsletterForm.querySelector("input[name='username']");
      const username = usernameInput ? usernameInput.value.trim() : "";

      try {
        const res = await fetch(`${BASE_URL}/api/auth/subscribe-newsletter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username })
        });
        const data = await res.json();
        if (data.success) {
          if (data.message === "Subscription successful!") {
            showToast("info", data.message);
            newsletterInput.disabled = true;
          }
        } else {
          showToast("error", data.message || "Subscription failed.");
        }
      } catch (err) {
        console.error("Newsletter error:", err);
        showToast("error", "Server error.");
      }
    });
  }

});