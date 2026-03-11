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

      if (!email) return alert("Please enter your email.");
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) return alert("Please enter a valid email.");

      try {
        // 1️⃣ Check or create user in backend
        const resCheck = await fetch("http://localhost:5000/api/auth/check-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const dataCheck = await resCheck.json();
        if (!dataCheck.success) return alert(dataCheck.message || "Error checking user.");

        // 2️⃣ Request OTP from backend
        const resOtp = await fetch("http://localhost:5000/api/auth/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const dataOtp = await resOtp.json();
        if (dataOtp.success) {
          alert(`OTP sent successfully to ${email}`);
          showOtpInput();
        } else {
          alert(dataOtp.message || "Failed to send OTP.");
        }

      } catch (err) {
        console.error("Error:", err);
        alert("Server error. Check console.");
      }
    });
  }

  // -----------------------------
  // SHOW OTP INPUT
  // -----------------------------
  function showOtpInput() {
    if (document.getElementById("otpInput")) return;

    loginContainer.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = "Enter OTP";

    const instruction = document.createElement("p");
    instruction.textContent = "Check your email and enter the OTP.";

    const otpInput = document.createElement("input");
    otpInput.placeholder = "Enter OTP";
    otpInput.id = "otpInput";
    otpInput.style.marginBottom = "1rem";

    const verifyBtn = document.createElement("button");
    verifyBtn.textContent = "Verify OTP";
    verifyBtn.id = "verifyOtpBtn";

    loginContainer.appendChild(title);
    loginContainer.appendChild(instruction);
    loginContainer.appendChild(otpInput);
    loginContainer.appendChild(verifyBtn);

    // -----------------------------
    // VERIFY OTP
    // -----------------------------
    verifyBtn.addEventListener("click", async () => {
      const enteredOTP = otpInput.value.trim();
      if (!enteredOTP) return alert("Please enter the OTP.");

      try {
        const resVerify = await fetch("http://localhost:5000/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail, otp: enteredOTP })
        });
        const dataVerify = await resVerify.json();

        if (dataVerify.success) {
          // ✅ Step 3a: save session
          sessionStorage.setItem("userId", dataVerify.userId);

          alert("Login successful!");
          window.location.href = "mainWebsitePage.html";
        } else {
          alert(dataVerify.message || "Incorrect OTP");
        }

      } catch (err) {
        console.error("Error verifying OTP:", err);
        alert("Server error. Check console.");
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
  // NEWSLETTER SUBSCRIPTION (Step 3b + 3c)
  // -----------------------------
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("newsletterEmail").value.trim();
      const userId = sessionStorage.getItem("userId"); // <-- Step 3b

      if (!userId) {
        alert("Please log in first to subscribe.");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/subscribe-newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email })
        });
        const data = await res.json();

        if (data.success) {
          alert("Subscription successful!");
        } else {
          alert(data.message || "Failed to subscribe.");
        }
      } catch (err) {
        console.error("Newsletter Error:", err);
        alert("Server error. Check console.");
      }
    });
  }

});