document.addEventListener("DOMContentLoaded", () => {
  // Already signed in? Skip straight ahead.
  if (EP.token && EP.user) {
    location.href = EP.profileId ? "library.html" : "profiles.html";
    return;
  }

  // Brand splash on first open of the session.
  EP.playIntro();

  const form = document.getElementById("loginForm");
  const userEl = document.getElementById("Username");
  const passEl = document.getElementById("Password");
  const errorBox = document.getElementById("errorBox");
  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");
  const spinner = document.getElementById("loginSpinner");
  const toggle = document.getElementById("togglePass");

  toggle.addEventListener("click", () => {
    const show = passEl.type === "password";
    passEl.type = show ? "text" : "password";
    toggle.innerHTML = show ? '<i class="ri-eye-line"></i>' : '<i class="ri-eye-off-line"></i>';
    passEl.focus();
  });

  function showError(msg) {
    errorBox.innerHTML = `<i class="ri-error-warning-line"></i><span>${EP.esc(msg)}</span>`;
    errorBox.classList.remove("hidden");
    errorBox.classList.add("flex", "animate-fade-in");
  }
  function clearError() {
    errorBox.classList.add("hidden");
    errorBox.classList.remove("flex");
  }
  function loading(on) {
    btn.disabled = on;
    spinner.classList.toggle("hidden", !on);
    btnText.textContent = on ? "Signing in…" : "Sign In";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const username = userEl.value.trim();
    const password = passEl.value;
    if (!username || !password) {
      showError("Please enter your username and password.");
      return;
    }

    loading(true);
    try {
      const res = await fetch(`${EP.API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: username, Password: password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", username);
        localStorage.setItem("token", data.token);
        if (data.fullname) localStorage.setItem("fullname", data.fullname);
        EP.clearProfile(); // force "who's watching" after each login
        location.href = "profiles.html";
      } else {
        showError(data.error || "Incorrect username or password.");
        loading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("Couldn't reach the server. Please try again.");
      loading(false);
    }
  });
});
