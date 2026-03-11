document.addEventListener("DOMContentLoaded", () => {

  // INITIALIZE EMAILJS
  const EMAILJS_PUBLIC_KEY = "LwQCTrUmqyQcsHYsO"
  emailjs.init(EMAILJS_PUBLIC_KEY)

  // VARIABLES
  let generatedOTP
  const overlay = document.getElementById("newsletterOverlay")
  const footerSubscribeBtn = document.getElementById("footerSubscribeBtn")
  const closeBtn = document.getElementById("closeNewsletter")
  const getOtpBtn = document.getElementById("getOtpBtn")
  const userEmail = document.getElementById("userEmail")
  const loginContainer = document.querySelector(".loginContainer")

  if (getOtpBtn && userEmail) {
    getOtpBtn.addEventListener("click", async (e) => {
      e.preventDefault()

      const email = userEmail.value.trim()

      if (!email) {
        alert("Please enter your email.")
        return
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.")
        return
      }

      // Get subscribers from localStorage
      const subscribers = JSON.parse(localStorage.getItem("subscribers")) || []

      // Check if user subscribed
      if (!subscribers.includes(email)) {
        alert("You must subscribe before logging in.")
        footerSubscribeBtn.scrollIntoView({ behavior: "smooth", block: "center" })
        footerSubscribeBtn.style.outline = "3px solid red"

        setTimeout(() => { footerSubscribeBtn.style.outline = "none" }, 3000)
        return
      }

      // Generate 6-digit OTP
      generatedOTP = Math.floor(100000 + Math.random() * 900000)
      console.log("Generated OTP:", generatedOTP)

      // -----------------------------
      // SEND OTP VIA EMAILJS
      // -----------------------------
      const serviceID = "service_gouqvrc"       // Replace with your actual service ID
      const templateID = "template_wxy2dn8"     // Replace with your OTP template ID

      const templateParams = {
        user_email: email,   // Must match template variable exactly
        otp_code: generatedOTP
      }

      try {
        const result = await emailjs.send(serviceID, templateID, templateParams)
        console.log("EmailJS send result:", result)
        alert("OTP sent successfully to " + email)
        showOtpInput() // Display OTP input field
      } catch (error) {
        console.error("EmailJS Error Details:", error)
        alert("Failed to send OTP. Please check console for details.")
      }

    })
  }

  // -----------------------------
  // SHOW OTP INPUT FUNCTION
    function showOtpInput() {

    // Prevent duplicate OTP inputs
    if (document.getElementById("otpInput")) return

    // REMOVE the original login content
    loginContainer.innerHTML = ""

    // Create new title
    const title = document.createElement("h2")
    title.textContent = "Enter OTP"

    // Create instruction text
    const instruction = document.createElement("p")
    instruction.textContent = "Check your email and enter the OTP."

    // Create OTP input
    const otpInput = document.createElement("input")
    otpInput.placeholder = "Enter OTP"
    otpInput.id = "otpInput"
    otpInput.style.marginBottom = "1rem"

    // Create verify button
    const verifyBtn = document.createElement("button")
    verifyBtn.textContent = "Verify OTP"
    verifyBtn.id = "verifyOtpBtn"

    // Add everything to the container
    loginContainer.appendChild(title)
    loginContainer.appendChild(instruction)
    loginContainer.appendChild(otpInput)
    loginContainer.appendChild(verifyBtn)

    verifyBtn.addEventListener("click", () => {
      const enteredOTP = otpInput.value.trim()

      if (!enteredOTP) {
        alert("Please enter the OTP.")
        return
      }

      if (enteredOTP == generatedOTP) {
        alert("Login successful!")
        localStorage.setItem("userLoggedIn", "true")
        window.location.href = "mainWebsitePage.html"
      } else {
        alert("Incorrect OTP. Try again.")
      }
    })
  }

  // -----------------------------
  // NEWSLETTER OVERLAY
  // -----------------------------
  if (overlay && footerSubscribeBtn) {
    footerSubscribeBtn.addEventListener("click", (e) => {
      e.preventDefault()
      overlay.classList.add("show")
      document.body.style.overflow = "hidden"
    })

    // Close overlay
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        overlay.classList.remove("show")
        document.body.style.overflow = "auto"
      })
    }
  }

    // -----------------------------
  // NEWSLETTER SUBSCRIPTION (Prevent duplicate emails)
  // -----------------------------
  const newsletterForm = document.getElementById("newsletterForm")

})

// now, i see that the user login doesnt have an interface...if a user uses one email, and has done some things, when another person tries to subscribe on the same device, the other person dosent have its account. i dont know if you understang me. 