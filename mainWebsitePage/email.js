// Initialize EmailJS
(function () {
  emailjs.init("LwQCTrUmqyQcsHYsO");
})();

// WAIT until page loads before finding the form
window.addEventListener("load", function () {

  const form = document.getElementById("newsletterForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const emailInput = form.querySelector("input[name='user_email']");
    const email = emailInput.value.trim().toLowerCase();

    let subscribers = JSON.parse(localStorage.getItem("subscribers")) || [];

    // PREVENT DUPLICATE EMAILJS SENDING
    if (subscribers.includes(email)) {
      alert("You have already subscribed.");
      return;
    }

    // SEND EMAIL ONLY IF USER IS NEW
    emailjs.sendForm(
      "service_gouqvrc",
      "template_5tw4y1q",
      this
    ).then(
      function () {

        // SAVE NEW SUBSCRIBER
        subscribers.push(email);
        localStorage.setItem("subscribers", JSON.stringify(subscribers));

        alert("Subscription successful! Check your email.");

        form.reset();

      },
      function (error) {
        console.log("EmailJS Error:", error);
        alert("Something went wrong. Please try again.");
      }
    );

  });

});