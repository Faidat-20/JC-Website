// Initialize EmailJS
(function () {
  emailjs.init("LwQCTrUmqyQcsHYsO");
})();

// WAIT until page loads before finding the form
window.addEventListener("load", function () {

  const form = document.getElementById("newsletterForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    emailjs.sendForm(
      "service_gouqvrc",
      "template_5tw4y1q",
      this
    ).then(
      function () {
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
