
// Initialize EmailJS
(function () {
  emailjs.init("LwQCTrUmqyQcsHYsO");
})();

// WAIT until page loads before finding the form
// window.addEventListener("load", function () {

//   const form = document.getElementById("newsletterForm");

//   form.addEventListener("submit", function (e) {
//     e.preventDefault();

//     const emailInput = form.querySelector("input[name='user_email']");
//     const email = emailInput.value.trim().toLowerCase();

//     let subscribers = JSON.parse(localStorage.getItem("subscribers")) || [];
//   });
// });