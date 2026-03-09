document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // INITIALIZE EMAILJS
  // -----------------------------
  const EMAILJS_PUBLIC_KEY = "LwQCTrUmqyQcsHYsO"; // Your EmailJS public key
  emailjs.init(EMAILJS_PUBLIC_KEY); // Replace with your actual public key

  // -----------------------------
  // VARIABLES
  // -----------------------------
  let generatedOTP; // OTP accessible everywhere

  const overlay = document.getElementById("newsletterOverlay");
  const footerSubscribeBtn = document.getElementById("footerSubscribeBtn");
  const closeBtn = document.getElementById("closeNewsletter");
  const getOtpBtn = document.getElementById("getOtpBtn");
  const userEmail = document.getElementById("userEmail");
  const loginContainer = document.querySelector(".loginContainer");

  if (getOtpBtn && userEmail) {
    getOtpBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = userEmail.value.trim();

      if (!email) {
        alert("Please enter your email.");
        return;
      }

      // Simple email format check
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      // Get subscribers from localStorage
      const subscribers = JSON.parse(localStorage.getItem("subscribers")) || [];

      // Check if user subscribed
      if (!subscribers.includes(email)) {
        alert("You must subscribe before logging in.");
        footerSubscribeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        footerSubscribeBtn.style.outline = "3px solid red";

        setTimeout(() => { footerSubscribeBtn.style.outline = "none"; }, 3000);
        return;
      }

      // Generate 6-digit OTP
      generatedOTP = Math.floor(100000 + Math.random() * 900000);
      console.log("Generated OTP:", generatedOTP);

      // -----------------------------
      // SEND OTP VIA EMAILJS
      // -----------------------------
      const serviceID = "service_gouqvrc";       // Replace with your actual service ID
      const templateID = "template_wxy2dn8";     // Replace with your OTP template ID

      const templateParams = {
        user_email: email,   // Must match template variable exactly
        otp_code: generatedOTP
      };

      try {
        const result = await emailjs.send(serviceID, templateID, templateParams);
        console.log("EmailJS send result:", result);
        alert("OTP sent successfully to " + email);
        showOtpInput(); // Display OTP input field
      } catch (error) {
        console.error("EmailJS Error Details:", error);
        alert("Failed to send OTP. Please check console for details.");
      }

    });
  }

  // -----------------------------
  // SHOW OTP INPUT FUNCTION
  // -----------------------------
  function showOtpInput() {
    // Prevent duplicate OTP inputs
    if (document.getElementById("otpInput")) return;

    const otpInput = document.createElement("input");
    otpInput.placeholder = "Enter OTP";
    otpInput.id = "otpInput";
    otpInput.style.marginBottom = "1rem";

    const verifyBtn = document.createElement("button");
    verifyBtn.textContent = "Verify OTP";
    verifyBtn.id = "verifyOtpBtn";

    loginContainer.appendChild(otpInput);
    loginContainer.appendChild(verifyBtn);

    verifyBtn.addEventListener("click", () => {
      const enteredOTP = otpInput.value.trim();

      if (!enteredOTP) {
        alert("Please enter the OTP.");
        return;
      }

      if (enteredOTP == generatedOTP) {
        alert("Login successful!");
        localStorage.setItem("userLoggedIn", "true");
        window.location.href = "mainWebsitePage.html";
      } else {
        alert("Incorrect OTP. Try again.");
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

    // Close overlay
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        overlay.classList.remove("show");
        document.body.style.overflow = "auto";
      });
    }
  }

});