document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("newsletterOverlay");
  const footerSubscribeBtn = document.getElementById("footerSubscribeBtn");
  const closeBtn = document.getElementById("closeNewsletter");
  const getOtpBtn = document.getElementById("getOtpBtn");
  const userEmail = document.getElementById("userEmail");

  // OTP BUTTON
  if (getOtpBtn && userEmail) {
    getOtpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = userEmail.value.trim();
      if (!email) {
        alert("Please enter your email.");
        return;
      }

      console.log("OTP request sent for email:", email);
      alert("OTP request sent to: " + email);
    });
  }

  // NEWSLETTER OVERLAY
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