document.addEventListener("DOMContentLoaded", async () => {
  const ok = await EP.requireAuth({ needProfile: false });
  if (!ok) return;

  const grid = document.getElementById("profilesGrid");
  const manageBtn = document.getElementById("manageBtn");
  const manageLabel = document.getElementById("manageLabel");
  const title = document.getElementById("screenTitle");
  const sub = document.getElementById("screenSub");

  const modal = document.getElementById("profileModal");
  const modalTitle = document.getElementById("modalTitle");
  const nameInput = document.getElementById("profileName");
  const kidsToggle = document.getElementById("kidsToggle");
  const avatarPicker = document.getElementById("avatarPicker");
  const avatarPreview = document.getElementById("modalAvatarPreview");
  const genrePicker = document.getElementById("genrePicker");
  const pinInput = document.getElementById("profilePin");
  const removePinRow = document.getElementById("removePinRow");
  const removePin = document.getElementById("removePin");
  const saveBtn = document.getElementById("saveProfileBtn");
  const deleteBtn = document.getElementById("deleteProfileBtn");

  // Parental lock
  const parentalBtn = document.getElementById("parentalBtn");
  const parentalLabel = document.getElementById("parentalLabel");
  const parentalIcon = document.getElementById("parentalIcon");
  const parentalModal = document.getElementById("parentalModal");
  const parentalTitle = document.getElementById("parentalTitle");
  const parentalDesc = document.getElementById("parentalDesc");
  const parentalCurrentRow = document.getElementById("parentalCurrentRow");
  const parentalCurrent = document.getElementById("parentalCurrent");
  const parentalNewRow = document.getElementById("parentalNewRow");
  const parentalNew = document.getElementById("parentalNew");
  const parentalRemoveRow = document.getElementById("parentalRemoveRow");
  const parentalRemove = document.getElementById("parentalRemove");

  document.getElementById("signOut").addEventListener("click", () => EP.logout());

  // Friendly categories → TMDB genre ids (covering both movie & tv ids).
  const GENRE_GROUPS = [
    { label: "Animation", ids: [16] }, { label: "Family", ids: [10751] },
    { label: "Kids", ids: [10762] }, { label: "Comedy", ids: [35] },
    { label: "Action", ids: [28, 10759] }, { label: "Adventure", ids: [12, 10759] },
    { label: "Fantasy & Sci-Fi", ids: [14, 878, 10765] }, { label: "Drama", ids: [18] },
    { label: "Romance", ids: [10749] }, { label: "Mystery", ids: [9648] },
    { label: "Crime", ids: [80] }, { label: "Thriller", ids: [53] },
    { label: "Horror", ids: [27] }, { label: "Documentary", ids: [99] },
    { label: "Music", ids: [10402] }, { label: "Reality", ids: [10764] },
    { label: "War & Politics", ids: [10752, 10768] }, { label: "Western", ids: [37] },
  ];
  const KID_GROUPS = ["Animation", "Family", "Kids", "Comedy", "Adventure", "Fantasy & Sci-Fi"];

  let profiles = [], max = 5, manageMode = false, hasManagePin = false;
  const wantManage = new URLSearchParams(location.search).has("manage");
  let editing = null, chosenAvatar = 0;
  let selectedGroups = new Set();

  function setManage(on) {
    manageMode = on;
    manageLabel.textContent = on ? "Done" : "Manage Profiles";
    manageBtn.classList.toggle("border-white", on);
    title.textContent = on ? "Manage Family" : "Who's watching?";
    sub.textContent = on ? "Add, edit or remove profiles for your household." : "Pick a profile to start streaming.";
    render();
  }

  async function load() {
    const res = await fetch(`${EP.API}/api/profiles?username=${encodeURIComponent(EP.user)}&token=${encodeURIComponent(EP.token)}`);
    if (res.status === 401) { localStorage.clear(); location.href = "index.html"; return; }
    const data = await res.json();
    profiles = data.profiles || [];
    max = data.max || 5;
    hasManagePin = !!data.has_manage_pin;
    updateParentalUI();
    render();
  }

  function tile(p) {
    const initial = EP.esc((p.name || "?").charAt(0).toUpperCase());
    return `
      <button data-id="${p.id}" class="profile-tile group flex flex-col items-center gap-3 focus:outline-none">
        <span class="relative w-24 h-24 sm:w-36 sm:h-36 rounded-2xl grid place-items-center text-4xl sm:text-5xl font-extrabold text-white shadow-lg ring-2 ring-transparent group-hover:ring-white/80 transition" style="background:${EP.avatarStyle(p.avatar)}">
          ${initial}
          ${p.has_pin ? '<span class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 grid place-items-center text-xs text-brand"><i class="ri-lock-2-fill"></i></span>' : ''}
          ${p.kids ? '<span class="absolute -top-2 -right-2 text-[10px] font-bold bg-brand text-black px-2 py-0.5 rounded-full shadow">KIDS</span>' : ''}
          ${manageMode ? '<span class="absolute inset-0 rounded-2xl bg-black/55 grid place-items-center text-3xl text-white"><i class="ri-pencil-line"></i></span>' : ''}
        </span>
        <span class="text-sm sm:text-base text-zinc-300 group-hover:text-white transition max-w-[7rem] sm:max-w-[9rem] truncate">${EP.esc(p.name)}</span>
      </button>`;
  }

  function addTile() {
    return `
      <button id="addProfileTile" class="group flex flex-col items-center gap-3 focus:outline-none">
        <span class="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl grid place-items-center text-5xl text-zinc-500 border-2 border-dashed border-white/20 group-hover:border-brand group-hover:text-brand transition"><i class="ri-add-line"></i></span>
        <span class="text-sm sm:text-base text-zinc-400 group-hover:text-white transition">Add Profile</span>
      </button>`;
  }

  function render() {
    grid.innerHTML = profiles.map(tile).join("") + (profiles.length < max ? addTile() : "");
    grid.querySelectorAll(".profile-tile").forEach((el) => {
      el.addEventListener("click", () => {
        const p = profiles.find((x) => x.id === el.dataset.id);
        if (!p) return;
        if (manageMode) openModal(p); else selectProfile(p);
      });
    });
    document.getElementById("addProfileTile")?.addEventListener("click", () => openModal(null));
  }

  async function selectProfile(p) {
    if (p.has_pin) {
      const ok = await EP.requirePin(p);
      if (!ok) return;
    }
    EP.setProfile(p);
    location.href = "library.html";
  }

  /* ---------- avatar picker ---------- */
  function buildAvatarPicker() {
    avatarPicker.innerHTML = EP.avatars.map((g, i) =>
      `<button type="button" data-i="${i}" class="avatar-opt w-11 h-11 rounded-xl ring-2 ring-transparent transition" style="background:${g}"></button>`).join("");
    avatarPicker.querySelectorAll(".avatar-opt").forEach((b) =>
      b.addEventListener("click", () => { chosenAvatar = +b.dataset.i; reflectAvatar(); }));
  }
  function reflectAvatar() {
    avatarPreview.style.background = EP.avatarStyle(chosenAvatar);
    avatarPreview.textContent = (nameInput.value.trim().charAt(0) || "?").toUpperCase();
    avatarPicker.querySelectorAll(".avatar-opt").forEach((b) => {
      const on = +b.dataset.i === chosenAvatar;
      b.classList.toggle("ring-white", on);
      b.classList.toggle("scale-110", on);
    });
  }

  /* ---------- genre picker ---------- */
  function buildGenrePicker() {
    genrePicker.innerHTML = GENRE_GROUPS.map((g) =>
      `<button type="button" data-label="${g.label}" class="genre-chip px-3 py-1.5 rounded-full text-xs font-semibold border transition">${g.label}</button>`).join("");
    genrePicker.querySelectorAll(".genre-chip").forEach((b) =>
      b.addEventListener("click", () => {
        const l = b.dataset.label;
        if (selectedGroups.has(l)) selectedGroups.delete(l); else selectedGroups.add(l);
        reflectGenres();
      }));
  }
  function reflectGenres() {
    genrePicker.querySelectorAll(".genre-chip").forEach((b) => {
      const on = selectedGroups.has(b.dataset.label);
      b.className = "genre-chip px-3 py-1.5 rounded-full text-xs font-semibold border transition " +
        (on ? "bg-brand text-black border-brand" : "bg-ink-800 text-zinc-300 border-white/10 hover:border-white/30");
    });
  }
  function groupsFromGenres(ids) {
    const set = new Set();
    GENRE_GROUPS.forEach((g) => { if (g.ids.some((id) => ids.includes(id))) set.add(g.label); });
    return set;
  }
  function genresFromGroups() {
    const ids = new Set();
    GENRE_GROUPS.forEach((g) => { if (selectedGroups.has(g.label)) g.ids.forEach((id) => ids.add(id)); });
    return [...ids];
  }

  kidsToggle.addEventListener("change", () => {
    if (kidsToggle.checked && selectedGroups.size === 0) {
      KID_GROUPS.forEach((l) => selectedGroups.add(l));
      reflectGenres();
    }
  });

  /* ---------- modal ---------- */
  function openModal(p) {
    editing = p;
    modalTitle.textContent = p ? "Edit Profile" : "Add Profile";
    nameInput.value = p ? p.name : "";
    kidsToggle.checked = p ? !!p.kids : false;
    chosenAvatar = p ? (p.avatar || 0) : Math.floor(Math.random() * EP.avatars.length);
    selectedGroups = p ? groupsFromGenres(p.allowed_genres || []) : new Set();
    pinInput.value = "";
    removePin.checked = false;
    removePinRow.classList.toggle("hidden", !(p && p.has_pin));
    removePinRow.classList.toggle("flex", !!(p && p.has_pin));
    deleteBtn.classList.toggle("hidden", !p || profiles.length <= 1);
    buildAvatarPicker(); reflectAvatar();
    buildGenrePicker(); reflectGenres();
    modal.classList.remove("hidden"); modal.classList.add("flex");
    setTimeout(() => nameInput.focus(), 50);
  }
  function closeModal() { modal.classList.add("hidden"); modal.classList.remove("flex"); }

  nameInput.addEventListener("input", reflectAvatar);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("cancelProfileBtn").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name) { EP.toast("Please enter a profile name", "error"); nameInput.focus(); return; }
    const pin = pinInput.value.trim();
    if (pin && !(/^\d{4,6}$/.test(pin))) { EP.toast("PIN must be 4–6 digits", "error"); return; }

    const body = {
      username: EP.user, token: EP.token,
      name, avatar: chosenAvatar, kids: kidsToggle.checked,
      allowed_genres: genresFromGroups(),
    };
    if (editing) {
      body.action = "update"; body.id = editing.id;
      if (pin) body.pin = pin;
      else if (removePin.checked) body.clear_pin = true;
    } else {
      body.action = "create";
      if (pin) body.pin = pin;
    }

    saveBtn.disabled = true;
    try {
      const res = await fetch(`${EP.API}/api/profiles`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) EP.toast(data.error || "Could not save profile", "error");
      else {
        EP.toast(editing ? "Profile updated" : "Profile created", "success");
        if (editing && editing.id === EP.profileId) EP.setProfile(data.profile);
        closeModal(); await load();
      }
    } catch (_) { EP.toast("Network error", "error"); }
    saveBtn.disabled = false;
  });

  deleteBtn.addEventListener("click", async () => {
    if (!editing) return;
    if (!confirm(`Delete profile "${editing.name}"? Its watch history will be removed.`)) return;
    try {
      const res = await fetch(`${EP.API}/api/profiles`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: EP.user, token: EP.token, action: "delete", id: editing.id }),
      });
      const data = await res.json();
      if (!res.ok) { EP.toast(data.error || "Could not delete", "error"); return; }
      if (editing.id === EP.profileId) EP.clearProfile();
      EP.toast("Profile deleted", "success");
      closeModal(); await load();
    } catch (_) { EP.toast("Network error", "error"); }
  });

  /* ---------- parental lock ---------- */
  function updateParentalUI() {
    parentalLabel.textContent = hasManagePin ? "Parental Lock: On" : "Set Parental Lock";
    parentalIcon.className = hasManagePin ? "ri-lock-2-line" : "ri-lock-unlock-line";
  }
  function openParental() {
    parentalCurrent.value = ""; parentalNew.value = ""; parentalRemove.checked = false;
    parentalCurrentRow.classList.toggle("hidden", !hasManagePin);
    parentalRemoveRow.classList.toggle("hidden", !hasManagePin);
    parentalRemoveRow.classList.toggle("flex", hasManagePin);
    parentalNewRow.classList.remove("hidden");
    parentalTitle.textContent = hasManagePin ? "Update Parental Lock" : "Set Parental Lock";
    parentalDesc.textContent = hasManagePin
      ? "Enter your current PIN, then set a new one or turn the lock off."
      : "Create a PIN that will be required before managing profiles.";
    parentalModal.classList.remove("hidden"); parentalModal.classList.add("flex");
    setTimeout(() => (hasManagePin ? parentalCurrent : parentalNew).focus(), 50);
  }
  function closeParental() { parentalModal.classList.add("hidden"); parentalModal.classList.remove("flex"); }

  parentalRemove.addEventListener("change", () => parentalNewRow.classList.toggle("hidden", parentalRemove.checked));
  parentalBtn.addEventListener("click", openParental);
  document.getElementById("parentalClose").addEventListener("click", closeParental);
  document.getElementById("parentalCancel").addEventListener("click", closeParental);
  parentalModal.addEventListener("click", (e) => { if (e.target === parentalModal) closeParental(); });

  document.getElementById("parentalSave").addEventListener("click", async () => {
    const remove = hasManagePin && parentalRemove.checked;
    const current = parentalCurrent.value.trim();
    const neu = parentalNew.value.trim();
    if (hasManagePin && !current) { EP.toast("Enter your current PIN", "error"); parentalCurrent.focus(); return; }
    if (!remove && !/^\d{4,6}$/.test(neu)) { EP.toast("PIN must be 4–6 digits", "error"); parentalNew.focus(); return; }
    try {
      const res = await fetch(`${EP.API}/api/profiles`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: EP.user, token: EP.token, action: "set_manage_pin", current_pin: current, pin: neu, remove }),
      });
      const data = await res.json();
      if (!res.ok) { EP.toast(data.error || "Could not update", "error"); return; }
      EP.toast(remove ? "Parental lock turned off" : "Parental lock saved", "success");
      closeParental();
      await load();
    } catch (_) { EP.toast("Network error", "error"); }
  });

  /* ---------- manage mode (gated by the parental PIN) ---------- */
  async function enterManage() {
    if (hasManagePin) { const ok = await EP.requireManagePin(); if (!ok) return; }
    setManage(true);
  }
  manageBtn.addEventListener("click", () => { if (manageMode) setManage(false); else enterManage(); });

  await load();
  if (wantManage) enterManage();
});
