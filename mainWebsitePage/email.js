// Initialize EmailJS
(function () {
  emailjs.init("LwQCTrUmqyQcsHYsO");
})();

window.addEventListener("load", function () {

  const form = document.getElementById("newsletterForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const emailInput = form.querySelector("input[name='user_email']");
    const email = emailInput.value.trim().toLowerCase();

    let subscribers = JSON.parse(localStorage.getItem("subscribers")) || [];

    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`http://localhost:5000/api/auth/userdata/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.subscribed) {
            return;
          } else {
            trackSubscriber();
          }
        })
        .catch(err => {
          console.error("Error checking subscription status:", err);
          trackSubscriber();
        });
    } else {
      trackSubscriber();
    }

    function trackSubscriber() {
      if (subscribers.includes(email)) return;
      // Welcome email is sent from backend — just track locally
      subscribers.push(email);
      localStorage.setItem("subscribers", JSON.stringify(subscribers));
    }
  });
});