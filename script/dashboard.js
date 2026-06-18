document.addEventListener("DOMContentLoaded", async () => {
  const TOKEN = localStorage.getItem("admin_session");
  if (!TOKEN) { location.replace("admin_login.html"); return; }

  const $ = (id) => document.getElementById(id);

  function adminLogout() {
    fetch(`${EP.API}/api/admin_logout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: TOKEN }),
    }).finally(() => { localStorage.removeItem("admin_session"); location.replace("admin_login.html"); });
  }

  async function adminFetch(path, opts = {}) {
    const res = await fetch(`${EP.API}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", "X-Admin-Token": TOKEN, ...(opts.headers || {}) },
    });
    if (res.status === 401) { localStorage.removeItem("admin_session"); location.replace("admin_login.html"); throw new Error("unauthorized"); }
    let data = null; try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data };
  }

  // Validate token before showing anything sensitive.
  try {
    const chk = await fetch(`${EP.API}/api/admin_check`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TOKEN }),
    }).then((r) => r.json());
    if (!chk.valid) { localStorage.removeItem("admin_session"); location.replace("admin_login.html"); return; }
  } catch (_) { /* network issue — let it try to load */ }

  $("adminWho").textContent = localStorage.getItem("admin_user") ? `@${localStorage.getItem("admin_user")}` : "";
  $("logoutBtn").addEventListener("click", adminLogout);
  $("refreshBtn").addEventListener("click", () => { loadStats(); loadUsers(); loadAdmins(); EP.toast("Refreshed", "success"); });

  /* ----------------- stats ----------------- */
  const STAT_DEFS = [
    { key: "users", label: "Users", icon: "ri-group-line", suffix: "" },
    { key: "profiles", label: "Profiles", icon: "ri-account-pin-circle-line", suffix: "" },
    { key: "active_sessions", label: "Active Sessions", icon: "ri-device-line", suffix: "" },
    { key: "watch_events", label: "Watch History", icon: "ri-play-circle-line", suffix: "" },
    { key: "cpu", label: "CPU Load", icon: "ri-cpu-line", suffix: "%" },
    { key: "storage", label: "Storage Used", icon: "ri-hard-drive-2-line", suffix: "%" },
    { key: "bandwidth", label: "Bandwidth", icon: "ri-wifi-line", suffix: "" },
  ];

  function renderStats(data) {
    $("statsGrid").innerHTML = STAT_DEFS.map((s) => {
      const val = data[s.key];
      const display = (val === undefined || val === null) ? "—" : `${val}${s.suffix}`;
      return `
      <div class="bg-ink-900 rounded-2xl border border-white/10 p-5 hover:border-white/20 transition">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">${s.label}</p>
            <p class="text-2xl font-extrabold text-white mt-1.5">${EP.esc(String(display))}</p>
          </div>
          <span class="w-10 h-10 rounded-xl bg-brand/15 text-brand grid place-items-center text-lg"><i class="${s.icon}"></i></span>
        </div>
      </div>`;
    }).join("");
  }

  async function loadStats() {
    $("statsGrid").innerHTML = STAT_DEFS.map(() =>
      `<div class="skeleton h-24 rounded-2xl"></div>`).join("");
    try {
      const { data } = await adminFetch("/api/dashboard/stats");
      renderStats(data || {});
    } catch (_) {}
  }

  /* ----------------- users ----------------- */
  let usersData = [];
  function renderUsers() {
    const q = $("searchUser").value.trim().toLowerCase();
    const rows = usersData.filter((u) =>
      !q || (u.username || "").toLowerCase().includes(q) || (u.fullname || "").toLowerCase().includes(q));
    $("usersEmpty").classList.toggle("hidden", rows.length > 0);
    $("userBody").innerHTML = rows.map((u, i) => `
      <tr class="hover:bg-white/[0.03] transition group">
        <td class="px-5 py-4 text-zinc-500">${i + 1}</td>
        <td class="px-5 py-4 font-semibold text-white">${EP.esc(u.username)}</td>
        <td class="px-5 py-4 text-zinc-300">${EP.esc(u.fullname || "—")}</td>
        <td class="px-5 py-4"><span class="inline-flex items-center gap-1 text-xs bg-white/5 text-zinc-400 rounded-md px-2.5 py-1"><i class="ri-lock-2-line text-brand"></i> Protected</span></td>
        <td class="px-5 py-4"><span class="bg-brand/15 text-brand px-2.5 py-1 rounded-lg text-xs font-bold">${(u.profiles || []).length} / ${u.max_profiles ?? 5}</span></td>
        <td class="px-5 py-4"><span class="bg-white/5 text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-bold">${u.max_devices ?? 1}</span></td>
        <td class="px-5 py-4 text-zinc-500">${EP.esc(u.date_added || "—")}</td>
        <td class="px-5 py-4 text-zinc-500">${EP.esc(u.date_updated || "—")}</td>
        <td class="px-5 py-4">
          <div class="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
            <button data-u="${EP.esc(u.username)}" class="editBtn w-8 h-8 grid place-items-center rounded-lg text-brand hover:bg-brand/10 transition" title="Edit"><i class="ri-pencil-line"></i></button>
            <button data-u="${EP.esc(u.username)}" class="clearBtn w-8 h-8 grid place-items-center rounded-lg text-amber-300 hover:bg-amber-500/10 transition" title="Clear device sessions"><i class="ri-device-recover-line"></i></button>
            <button data-u="${EP.esc(u.username)}" class="delBtn w-8 h-8 grid place-items-center rounded-lg text-red-300 hover:bg-red-500/10 transition" title="Delete"><i class="ri-delete-bin-line"></i></button>
          </div>
        </td>
      </tr>`).join("");

    $("userBody").querySelectorAll(".editBtn").forEach((b) => b.addEventListener("click", () => openUserModal(b.dataset.u)));
    $("userBody").querySelectorAll(".delBtn").forEach((b) => b.addEventListener("click", () => deleteUser(b.dataset.u)));
    $("userBody").querySelectorAll(".clearBtn").forEach((b) => b.addEventListener("click", () => clearSession(b.dataset.u)));
  }

  async function loadUsers() {
    try {
      const { data } = await adminFetch("/api/users");
      usersData = Array.isArray(data) ? data : [];
      renderUsers();
    } catch (_) {}
  }

  /* ----- user modal ----- */
  let editingUser = null;
  function openUserModal(username) {
    editingUser = username ? usersData.find((u) => u.username === username) : null;
    $("userModalTitle").textContent = editingUser ? "Edit User" : "Add User";
    $("f_username").value = editingUser ? editingUser.username : "";
    $("f_fullname").value = editingUser ? (editingUser.fullname || "") : "";
    $("f_password").value = "";
    $("f_password").placeholder = editingUser ? "•••••••• (unchanged)" : "";
    $("pwHint").classList.toggle("hidden", !editingUser);
    $("f_devices").value = editingUser ? (editingUser.max_devices ?? 1) : 1;
    $("f_maxprofiles").value = editingUser ? (editingUser.max_profiles ?? 5) : 5;
    $("deleteUserBtn").classList.toggle("hidden", !editingUser);
    showModal("userModal");
    setTimeout(() => $("f_username").focus(), 50);
  }

  async function saveUser() {
    const username = $("f_username").value.trim();
    const password = $("f_password").value.trim();
    const fullname = $("f_fullname").value.trim();
    const max_devices = parseInt($("f_devices").value, 10) || 1;
    const max_profiles = Math.max(1, parseInt($("f_maxprofiles").value, 10) || 5);
    if (!username) { EP.toast("Username is required", "error"); return; }
    if (!editingUser && !password) { EP.toast("Password is required for new users", "error"); return; }

    const today = new Date().toISOString().slice(0, 10);
    const body = editingUser
      ? { action: "update", username: editingUser.username, new_username: username, fullname, max_devices, max_profiles, date_updated: today }
      : { action: "create", username, fullname, password, max_devices, max_profiles, date_added: today };
    if (password) body.password = password; // only send when set

    $("saveUserBtn").disabled = true;
    try {
      const { ok, data } = await adminFetch("/api/users", { method: "POST", body: JSON.stringify(body) });
      if (!ok) { EP.toast((data && data.error) || "Save failed", "error"); }
      else { EP.toast(editingUser ? "User updated" : "User created", "success"); hideModal("userModal"); await loadUsers(); await loadStats(); }
    } catch (_) {}
    $("saveUserBtn").disabled = false;
  }

  async function deleteUser(username) {
    if (!confirm(`Delete user "${username}"? This removes their profiles, sessions and watch history.`)) return;
    try {
      const { ok, data } = await adminFetch("/api/users", { method: "POST", body: JSON.stringify({ action: "delete", username }) });
      if (!ok) { EP.toast((data && data.error) || "Delete failed", "error"); return; }
      EP.toast("User deleted", "success"); hideModal("userModal"); await loadUsers(); await loadStats();
    } catch (_) {}
  }

  async function clearSession(username) {
    try {
      const { ok, data } = await adminFetch("/api/clear_user_session", { method: "POST", body: JSON.stringify({ username }) });
      EP.toast(ok && data.status === "success" ? `Cleared sessions for ${username}` : (data && data.message) || "No active sessions", ok ? "success" : "info");
      loadStats();
    } catch (_) {}
  }

  /* ----------------- admins ----------------- */
  let adminsData = [];
  function renderAdmins() {
    const q = $("searchAdmin").value.trim().toLowerCase();
    const rows = adminsData.filter((a) => !q || (a.username || "").toLowerCase().includes(q));
    const onlyOne = adminsData.length <= 1;
    $("adminBody").innerHTML = rows.map((a, i) => `
      <tr class="hover:bg-white/[0.03] transition group">
        <td class="px-5 py-4 text-zinc-500">${i + 1}</td>
        <td class="px-5 py-4 font-semibold text-white">${EP.esc(a.username)}</td>
        <td class="px-5 py-4"><span class="font-mono text-xs bg-white/5 text-zinc-300 rounded-md px-2.5 py-1">${EP.esc(a.password)}</span></td>
        <td class="px-5 py-4 text-zinc-500">${EP.esc(a.date_added || "—")}</td>
        <td class="px-5 py-4 text-center">
          <button data-a="${EP.esc(a.username)}" class="delAdminBtn w-8 h-8 grid place-items-center rounded-lg mx-auto text-red-300 hover:bg-red-500/10 transition ${onlyOne ? "opacity-30 pointer-events-none" : "opacity-60 group-hover:opacity-100"}" title="${onlyOne ? "Cannot delete the only admin" : "Delete"}"><i class="ri-delete-bin-line"></i></button>
        </td>
      </tr>`).join("");
    $("adminBody").querySelectorAll(".delAdminBtn").forEach((b) => b.addEventListener("click", () => deleteAdmin(b.dataset.a)));
  }

  async function loadAdmins() {
    try {
      const { data } = await adminFetch("/api/admins");
      adminsData = Array.isArray(data) ? data : [];
      renderAdmins();
    } catch (_) {}
  }

  async function saveAdmin() {
    const username = $("a_username").value.trim();
    const password = $("a_password").value.trim();
    if (!username || !password) { EP.toast("Username and password are required", "error"); return; }
    $("saveAdminBtn").disabled = true;
    try {
      const { ok, data } = await adminFetch("/api/admins", { method: "POST", body: JSON.stringify({ action: "create", username, password }) });
      if (!ok) { EP.toast((data && data.error) || "Save failed", "error"); }
      else { EP.toast("Admin created", "success"); hideModal("adminModal"); await loadAdmins(); }
    } catch (_) {}
    $("saveAdminBtn").disabled = false;
  }

  async function deleteAdmin(username) {
    if (!confirm(`Delete admin "${username}"?`)) return;
    try {
      const { ok, data } = await adminFetch("/api/admins", { method: "POST", body: JSON.stringify({ action: "delete", username }) });
      if (!ok) { EP.toast((data && data.error) || "Delete failed", "error"); return; }
      EP.toast("Admin deleted", "success"); await loadAdmins();
    } catch (_) {}
  }

  /* ----------------- modal helpers ----------------- */
  function showModal(id) { const m = $(id); m.classList.remove("hidden"); m.classList.add("flex"); }
  function hideModal(id) { const m = $(id); m.classList.add("hidden"); m.classList.remove("flex"); }

  $("addUserBtn").addEventListener("click", () => openUserModal(null));
  $("saveUserBtn").addEventListener("click", saveUser);
  $("deleteUserBtn").addEventListener("click", () => editingUser && deleteUser(editingUser.username));
  $("closeUserModal").addEventListener("click", () => hideModal("userModal"));
  $("cancelUserBtn").addEventListener("click", () => hideModal("userModal"));
  $("userModal").addEventListener("click", (e) => { if (e.target.id === "userModal") hideModal("userModal"); });

  $("addAdminBtn").addEventListener("click", () => { $("a_username").value = ""; $("a_password").value = ""; showModal("adminModal"); setTimeout(() => $("a_username").focus(), 50); });
  $("saveAdminBtn").addEventListener("click", saveAdmin);
  $("closeAdminModal").addEventListener("click", () => hideModal("adminModal"));
  $("cancelAdminBtn").addEventListener("click", () => hideModal("adminModal"));
  $("adminModal").addEventListener("click", (e) => { if (e.target.id === "adminModal") hideModal("adminModal"); });

  $("searchUser").addEventListener("input", renderUsers);
  $("searchAdmin").addEventListener("input", renderAdmins);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hideModal("userModal"); hideModal("adminModal"); } });

  // initial load
  loadStats();
  loadUsers();
  loadAdmins();
});
