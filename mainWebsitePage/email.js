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

    // if (subscribers.includes(email)) {
    //   return; // do nothing
    // }
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:5000/api/auth/userdata/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.subscribed) {
            return;
          } else {
            sendEmail();
          }
        })
        .catch(err => {
          console.error("Error checking subscription status:", err);
          sendEmail();
        });
    } else {
      sendEmail();
    }


    function sendEmail() {
      if (subscribers.includes(email)) {
        return;
      }

      emailjs.sendForm( /* global emailjs */
        "service_gouqvrc",
        "template_5tw4y1q",
        form
      ).then(
        function () {
          subscribers.push(email);
          localStorage.setItem("subscribers", JSON.stringify(subscribers));
          showToast("success", "Subscription successful! Check your email.");
          form.reset();
        },
        function (error) {
          console.log("EmailJS Error:", error);
          showToast("error", "Something went wrong. Please try again.");
        }
      );
    }
  });
});