document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // INITIALIZE EMAILJS (optional)
  // -----------------------------
  const EMAILJS_PUBLIC_KEY = "LwQCTrUmqyQcsHYsO";
  emailjs.init(EMAILJS_PUBLIC_KEY);

  // -----------------------------
  // VARIABLES
  // -----------------------------
  const overlay = document.getElementById("newsletterOverlay");
  const footerSubscribeBtn = document.getElementById("footerSubscribeBtn");
  const closeBtn = document.getElementById("closeNewsletter");
  const getOtpBtn = document.getElementById("getOtpBtn");
  const userEmail = document.getElementById("userEmail");
  const loginContainer = document.querySelector(".loginContainer");
  const newsletterForm = document.getElementById("newsletterForm");

  let currentEmail = ""; // track email for OTP verification

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
      showSpinner();
      try {
        // 1️⃣ Check or create user
        const resCheck = await fetch("http://localhost:5000/api/auth/check-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const dataCheck = await resCheck.json();
        console.log("User check response:", dataCheck);
        if (!dataCheck.success) {
          setTimeout(() => hideSpinner(), 400);
          return showToast("error", dataCheck.message || "Error checking user.");
        }

        if (!dataCheck.subscribed) {
          setTimeout(() => hideSpinner(), 400);
          showToast("info", "You must subscribe first before getting an OTP.");
          return;
        }
        // 3️⃣ Request OTP from backend
        const resOtp = await fetch("http://localhost:5000/api/auth/request-otp", {
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

    const backArrow = document.createElement("button");
    backArrow.id = "backArrowBtn";
    backArrow.textContent = "←Back";
    backArrow.style.all = "unset";
    backArrow.style.position = "absolute";
    backArrow.style.top = "0.4cm";
    backArrow.style.left = "0.4cm";
    backArrow.style.cursor = "pointer";
    backArrow.style.fontSize = "1rem";
    backArrow.style.padding = "0";
    backArrow.style.margin = "0";
    backArrow.style.color = "inherit";
    backArrow.style.font = "inherit";
    loginContainer.style.position = "relative";

    const otpInput = document.createElement("input");
    otpInput.id = "otpInput";
    otpInput.placeholder = "Enter OTP";
    otpInput.style.marginBottom = "1rem";

    const verifyBtn = document.createElement("button");
    verifyBtn.id = "verifyOtpBtn";
    verifyBtn.textContent = "Verify OTP";

    loginContainer.appendChild(backArrow);
    loginContainer.appendChild(otpInput);
    loginContainer.appendChild(verifyBtn);

    backArrow.addEventListener("click", () => {
      otpInput.remove();
      verifyBtn.remove();
      backArrow.remove();

      getOtpBtn.style.display = "block";
      userEmail.style.display = "block";
      if (loginParagraph) loginParagraph.textContent = "Enter your email below to receive an OTP.";
    });

    // -----------------------------
    // VERIFY OTP
    // -----------------------------
    verifyBtn.addEventListener("click", async () => {
      const enteredOTP = otpInput.value.trim();
      if (!enteredOTP) return showToast("error", "Please enter the OTP.");
      showSpinner();

      try {
        const resVerify = await fetch("http://localhost:5000/api/auth/verify-otp", {
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

        showToast("success", "Login successful!");
        window.location.href = "mainWebsitePage.html";
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
        const res = await fetch("http://localhost:5000/api/auth/subscribe-newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email, username })
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