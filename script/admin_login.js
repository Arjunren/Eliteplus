document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("adminForm");
  const userEl = document.getElementById("adminUser");
  const passEl = document.getElementById("adminPass");
  const errorEl = document.getElementById("error");
  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("btnText");
  const spinner = document.getElementById("spinner");
  const toggle = document.getElementById("togglePass");

  // If a valid admin token already exists, skip to the dashboard.
  const existing = localStorage.getItem("admin_session");
  if (existing) {
    try {
      const res = await fetch(`${EP.API}/api/admin_check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: existing }),
      });
      const data = await res.json();
      if (data.valid) { location.href = "dashboard.html"; return; }
      localStorage.removeItem("admin_session");
    } catch (_) {}
  }

  toggle.addEventListener("click", () => {
    const show = passEl.type === "password";
    passEl.type = show ? "text" : "password";
    toggle.innerHTML = show ? '<i class="ri-eye-line"></i>' : '<i class="ri-eye-off-line"></i>';
    passEl.focus();
  });

  function showError(msg) {
    errorEl.innerHTML = `<i class="ri-error-warning-line"></i><span>${EP.esc(msg)}</span>`;
    errorEl.classList.remove("hidden"); errorEl.classList.add("flex", "animate-fade-in");
  }
  function loading(on) {
    btn.disabled = on;
    spinner.classList.toggle("hidden", !on);
    btnText.textContent = on ? "Signing in…" : "Sign In";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");
    const username = userEl.value.trim();
    const password = passEl.value;
    if (!username || !password) { showError("Enter username and password."); return; }

    loading(true);
    try {
      const res = await fetch(`${EP.API}/api/admin_login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === "success" && data.token) {
        localStorage.setItem("admin_session", data.token);
        localStorage.setItem("admin_user", data.username || username);
        location.href = "dashboard.html";
      } else {
        showError(data.error || "Invalid credentials.");
        loading(false);
      }
    } catch (err) {
      showError("Couldn't reach the server.");
      loading(false);
    }
  });
});
