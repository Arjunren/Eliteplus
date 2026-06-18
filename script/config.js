/* =====================================================================
   ElitePlus+ — shared frontend module (loaded on every page)
   Exposes a single global: window.EP
   ===================================================================== */
(function () {
  const isLocal = ["localhost", "127.0.0.1", ""].includes(location.hostname);

  const EP = {
    // Local dev hits the Flask dev server; production hits PythonAnywhere.
    API: isLocal ? "http://127.0.0.1:5000" : "https://eliteplus.pythonanywhere.com",

    BRAND: "#00eaff",

    // Player iframe sandbox. Intentionally OMITS allow-popups,
    // allow-top-navigation and allow-modals so the embed cannot open
    // pop-ups / redirect the tab — that kills the worst streaming ads
    // while still letting the video player run.
    SANDBOX: "allow-same-origin allow-scripts allow-presentation allow-forms",

    // 8 avatar gradients shared with the backend's avatar index.
    avatars: [
      "linear-gradient(135deg,#22d3ee,#2563eb)",
      "linear-gradient(135deg,#e879f9,#7e22ce)",
      "linear-gradient(135deg,#fbbf24,#ea580c)",
      "linear-gradient(135deg,#34d399,#0d9488)",
      "linear-gradient(135deg,#fb7185,#dc2626)",
      "linear-gradient(135deg,#818cf8,#6d28d9)",
      "linear-gradient(135deg,#a3e635,#16a34a)",
      "linear-gradient(135deg,#38bdf8,#0891b2)",
    ],

    // Default kid-safe genres used when a Kids profile has no custom list.
    KID_GENRES: { movie: [16, 10751, 12, 35, 14, 10402], tv: [16, 10751, 10762, 35, 10759] },
    // Genres always hidden from Kids profiles (catches mature anime tagged
    // "Animation" + Romance/Horror/etc, which genre alone can't distinguish).
    KID_BLOCK: [27, 53, 80, 10749, 10752, 10768],

    /* ---------- session ---------- */
    get user() { return localStorage.getItem("user"); },
    get token() { return localStorage.getItem("token"); },
    get profileId() { return localStorage.getItem("profileId"); },
    get profileName() { return localStorage.getItem("profileName"); },
    get profileAvatar() { return parseInt(localStorage.getItem("profileAvatar") || "0", 10); },
    get profileKids() { return localStorage.getItem("profileKids") === "1"; },
    get profileGenres() { try { return JSON.parse(localStorage.getItem("profileGenres") || "[]"); } catch (_) { return []; } },

    setProfile(p) {
      localStorage.setItem("profileId", p.id);
      localStorage.setItem("profileName", p.name);
      localStorage.setItem("profileAvatar", p.avatar || 0);
      localStorage.setItem("profileKids", p.kids ? "1" : "0");
      localStorage.setItem("profileGenres", JSON.stringify(p.allowed_genres || []));
    },
    clearProfile() {
      ["profileId", "profileName", "profileAvatar", "profileKids", "profileGenres"].forEach(k => localStorage.removeItem(k));
    },

    /* ---------- parental / genre restrictions ---------- */
    restricted(type) { return this.profileKids || (this.profileGenres && this.profileGenres.length > 0); },
    allowedSet(type) {
      const g = this.profileGenres;
      if (g && g.length) return g.map(Number);
      if (this.profileKids) return this.KID_GENRES[type] || [];
      return null; // null = unrestricted
    },
    genreAllowed(id, type) {
      const set = this.allowedSet(type);
      return !set || set.includes(+id);
    },
    itemAllowed(item, type) {
      const set = this.allowedSet(type);
      if (!set) return true;
      const ids = (item.genre_ids || []).map(Number);
      // Kids: hard-block mature-signal genres even if "Animation" is allowed.
      if (this.profileKids && ids.some((id) => this.KID_BLOCK.includes(id))) return false;
      if (!ids.length) return !this.profileKids; // unknown genres: hide for kids, allow otherwise
      return ids.some((id) => set.includes(+id));
    },

    /* ---------- utils ---------- */
    esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    avatarStyle(i) { return this.avatars[(i | 0) % this.avatars.length]; },

    toast(msg, type = "info") {
      let wrap = document.getElementById("ep-toasts");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "ep-toasts";
        wrap.className = "fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end";
        document.body.appendChild(wrap);
      }
      const colors = {
        info: "bg-white/10 border-white/20 text-white",
        success: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200",
        error: "bg-red-500/15 border-red-400/40 text-red-200",
      };
      const t = document.createElement("div");
      t.className = `px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg text-sm font-medium ` +
        `translate-y-2 opacity-0 transition-all duration-300 ${colors[type] || colors.info}`;
      t.textContent = msg;
      wrap.appendChild(t);
      requestAnimationFrame(() => { t.classList.remove("translate-y-2", "opacity-0"); });
      setTimeout(() => {
        t.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => t.remove(), 350);
      }, 2600);
    },

    async api(path, opts = {}) {
      const res = await fetch(this.API + path, opts);
      let data = null;
      try { data = await res.json(); } catch (_) {}
      return { ok: res.ok, status: res.status, data };
    },

    /* ---------- auth guards ---------- */
    async logout() {
      try {
        await fetch(this.API + "/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Username: this.user, Token: this.token }),
        });
      } catch (_) {}
      localStorage.clear();
      location.href = "index.html";
    },

    // Use on browse/player pages: verifies token, then ensures a profile is picked.
    async requireAuth(opts = {}) {
      const token = this.token, user = this.user;
      if (!token || !user) { location.href = "index.html"; return false; }
      try {
        const res = await fetch(this.API + "/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Username: user, Token: token }),
        });
        const data = await res.json();
        if (!data.valid) { localStorage.clear(); location.href = "index.html"; return false; }
      } catch (e) {
        // Network hiccup shouldn't hard-logout; let the page try to load.
        console.warn("Auth check failed:", e);
      }
      if (opts.needProfile !== false && !this.profileId) {
        location.href = "profiles.html"; return false;
      }
      return true;
    },

    /* ---------- watch history ---------- */
    async saveHistory(item, opts = {}) {
      if (!this.user || !this.profileId) return;
      const payload = JSON.stringify({
        username: this.user, token: this.token, profile: this.profileId, action: "save", item,
      });
      // On page unload, sendBeacon is the only reliable transport.
      if (opts.beacon && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(this.API + "/api/history", new Blob([payload], { type: "application/json" }));
          return;
        } catch (_) {}
      }
      try {
        await fetch(this.API + "/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      } catch (e) { console.warn("saveHistory failed", e); }
    },

    async getHistory() {
      if (!this.user || !this.profileId) return { history: [], continue: [] };
      try {
        const res = await fetch(
          `${this.API}/api/history?username=${encodeURIComponent(this.user)}&token=${encodeURIComponent(this.token)}&profile=${encodeURIComponent(this.profileId)}`);
        return await res.json();
      } catch (e) { return { history: [], continue: [] }; }
    },

    async deleteHistory(key) {
      try {
        await fetch(this.API + "/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: this.user, token: this.token, profile: this.profileId, action: "delete", key }),
        });
      } catch (_) {}
    },

    /* ---------- PIN verification (returns Promise<bool>) ---------- */
    verifyPin(profileId, pin) {
      return fetch(this.API + "/api/profiles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: this.user, token: this.token, action: "verify_pin", id: profileId, pin }),
      }).then((r) => r.json()).then((d) => !!d.valid).catch(() => false);
    },
    verifyManagePin(pin) {
      return fetch(this.API + "/api/profiles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: this.user, token: this.token, action: "verify_manage_pin", pin }),
      }).then((r) => r.json()).then((d) => !!d.valid).catch(() => false);
    },

    // Generic PIN modal. `verify(pin)` → Promise<bool>. Resolves true on success, false if cancelled.
    _pinModal({ title, subtitle, gradient, verify }) {
      return new Promise((resolve) => {
        const o = document.createElement("div");
        o.className = "fixed inset-0 z-[260] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4";
        o.innerHTML = `
          <div class="w-full max-w-xs rounded-2xl bg-ink-900 border border-white/10 p-6 text-center animate-scale-in">
            <div class="mx-auto w-12 h-12 rounded-xl grid place-items-center text-xl text-white mb-3" style="background:${gradient}"><i class="ri-lock-2-fill"></i></div>
            <h3 class="text-white font-bold">${this.esc(title)}</h3>
            <p class="text-sm text-zinc-400 mt-1">${this.esc(subtitle)}</p>
            <input id="ep-pin-in" type="password" inputmode="numeric" maxlength="6" autocomplete="off"
              class="mt-4 w-full text-center tracking-[0.5em] text-2xl py-3 rounded-xl bg-ink-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" />
            <p id="ep-pin-err" class="text-red-400 text-xs mt-2 h-4"></p>
            <div class="flex gap-3 mt-3">
              <button id="ep-pin-cancel" type="button" class="flex-1 py-2.5 rounded-xl border border-white/15 text-zinc-300 hover:bg-white/5 text-sm font-semibold">Cancel</button>
              <button id="ep-pin-ok" type="button" class="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-black text-sm font-bold">Unlock</button>
            </div>
          </div>`;
        document.body.appendChild(o);
        const input = o.querySelector("#ep-pin-in");
        const err = o.querySelector("#ep-pin-err");
        setTimeout(() => input.focus(), 50);
        let busy = false;
        const done = (val) => { o.remove(); resolve(val); };
        const submit = async () => {
          if (busy) return;
          const pin = input.value.trim();
          if (!pin) return;
          busy = true;
          const ok = await verify(pin);
          busy = false;
          if (ok) done(true);
          else { err.textContent = "Incorrect PIN"; input.value = ""; input.focus(); }
        };
        o.querySelector("#ep-pin-ok").addEventListener("click", submit);
        o.querySelector("#ep-pin-cancel").addEventListener("click", () => done(false));
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
        o.addEventListener("click", (e) => { if (e.target === o) done(false); });
      });
    },

    requirePin(profile) {
      return this._pinModal({
        title: "Profile Locked",
        subtitle: `Enter ${profile.name}'s PIN`,
        gradient: this.avatarStyle(profile.avatar),
        verify: (pin) => this.verifyPin(profile.id, pin),
      });
    },
    requireManagePin() {
      return this._pinModal({
        title: "Parental Lock",
        subtitle: "Enter your parental PIN to manage profiles",
        gradient: "linear-gradient(135deg,#00eaff,#00b8cc)",
        verify: (pin) => this.verifyManagePin(pin),
      });
    },

    /* ---------- shared top navigation ---------- */
    navbar(active) {
      const av = this.avatarStyle(this.profileAvatar);
      const initial = this.esc((this.profileName || "?").charAt(0).toUpperCase());
      const link = (href, label, key) =>
        `<a href="${href}" class="nav-link px-1 py-1 text-sm font-medium transition-colors ${
          active === key ? "text-white" : "text-zinc-400 hover:text-white"
        }">${label}</a>`;
      return `
      <header class="fixed top-0 inset-x-0 z-50 transition-colors duration-300" id="ep-header">
        <div class="px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-7">
            <a href="library.html" class="text-2xl font-extrabold tracking-tight text-white shrink-0">
              ELITE<span class="text-brand">+</span>
            </a>
            <nav class="hidden md:flex items-center gap-6">
              ${link("library.html", "Home", "home")}
              ${link("movielibrary.html", "Movies", "movies")}
              ${link("serieslibrary.html", "Series", "series")}
              ${this.profileKids ? "" : link("anime.html", "Anime", "anime")}
            </nav>
          </div>
          <div class="flex items-center gap-3">
            <button id="ep-search-btn" class="text-zinc-300 hover:text-white text-xl w-9 h-9 grid place-items-center rounded-full hover:bg-white/10 transition" title="Search"><i class="ri-search-line"></i></button>
            <div class="relative group">
              <button id="ep-profile-btn" class="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/10 transition">
                <span class="w-8 h-8 rounded-md grid place-items-center text-sm font-bold text-white shadow" style="background:${av}">${initial}</span>
                <i class="ri-arrow-down-s-line text-zinc-300 hidden sm:block"></i>
              </button>
              <div id="ep-profile-menu" class="hidden absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div class="px-4 py-3 border-b border-white/10">
                  <p class="text-xs text-zinc-400">Watching as</p>
                  <p class="text-sm font-semibold text-white truncate">${this.esc(this.profileName || "Guest")}</p>
                </div>
                <a href="profiles.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/10"><i class="ri-user-shared-line"></i> Switch profile</a>
                <a href="profiles.html?manage=1" class="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/10"><i class="ri-team-line"></i> Manage family</a>
                <button id="ep-logout" class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10"><i class="ri-logout-box-r-line"></i> Sign out</button>
              </div>
            </div>
            <button class="md:hidden text-white text-2xl" id="ep-burger"><i class="ri-menu-line"></i></button>
          </div>
        </div>
        <nav id="ep-mobile-nav" class="md:hidden hidden border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl px-4 py-2 flex-col">
          ${(this.profileKids
              ? ["library.html|Home|home","movielibrary.html|Movies|movies","serieslibrary.html|Series|series"]
              : ["library.html|Home|home","movielibrary.html|Movies|movies","serieslibrary.html|Series|series","anime.html|Anime|anime"]
            ).map(s=>{const [h,l,k]=s.split("|");return `<a href="${h}" class="py-3 text-sm border-b border-white/5 ${active===k?"text-brand":"text-zinc-200"}">${l}</a>`;}).join("")}
        </nav>
      </header>`;
    },

    mountNavbar(active) {
      const host = document.getElementById("ep-nav");
      if (!host) return;
      host.innerHTML = this.navbar(active);

      const btn = document.getElementById("ep-profile-btn");
      const menu = document.getElementById("ep-profile-menu");
      btn?.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("hidden"); });
      document.addEventListener("click", () => menu?.classList.add("hidden"));
      document.getElementById("ep-logout")?.addEventListener("click", () => this.logout());

      const burger = document.getElementById("ep-burger");
      const mobile = document.getElementById("ep-mobile-nav");
      burger?.addEventListener("click", () => { mobile.classList.toggle("hidden"); mobile.classList.toggle("flex"); });

      // Solid header background after scrolling.
      const header = document.getElementById("ep-header");
      const onScroll = () => {
        if (window.scrollY > 20) header.classList.add("bg-zinc-950/85", "backdrop-blur-xl", "shadow-lg", "shadow-black/40");
        else header.classList.remove("bg-zinc-950/85", "backdrop-blur-xl", "shadow-lg", "shadow-black/40");
      };
      window.addEventListener("scroll", onScroll); onScroll();
    },

    /* ---------- Netflix-style ELITE+ intro ---------- */
    playIntro(opts = {}) {
      if (!opts.force && sessionStorage.getItem("ep_intro_played")) return Promise.resolve();
      sessionStorage.setItem("ep_intro_played", "1");
      return new Promise((resolve) => {
        const o = document.createElement("div");
        o.id = "ep-intro";
        o.className = "fixed inset-0 z-[300] grid place-items-center bg-black overflow-hidden";
        o.innerHTML = `
          <div class="relative select-none">
            <h1 class="ep-intro-text text-6xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-white">ELITE<span class="text-brand ep-intro-plus">+</span></h1>
            <div class="pointer-events-none absolute inset-0 overflow-hidden">
              <div class="ep-intro-sweep absolute top-0 -left-1/3 h-full w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-md"></div>
            </div>
          </div>
          <div class="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500 text-[10px] sm:text-xs tracking-[.4em] uppercase animate-fade-in" style="animation-delay:1.2s">Streaming Reimagined</div>
          <button id="ep-intro-skip" class="absolute bottom-7 right-7 text-zinc-500 hover:text-white text-xs flex items-center gap-1 transition">Skip <i class="ri-skip-forward-fill"></i></button>`;
        document.body.appendChild(o);

        // Best-effort "ta-dum" chime (silently ignored if autoplay is blocked).
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) {
            const ac = new Ctx();
            const blip = (freq, t, dur) => {
              const osc = ac.createOscillator(), g = ac.createGain();
              osc.type = "sine"; osc.frequency.value = freq;
              osc.connect(g); g.connect(ac.destination);
              g.gain.setValueAtTime(0.0001, ac.currentTime + t);
              g.gain.exponentialRampToValueAtTime(0.22, ac.currentTime + t + 0.04);
              g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + dur);
              osc.start(ac.currentTime + t); osc.stop(ac.currentTime + t + dur + 0.05);
            };
            ac.resume?.();
            blip(196, 0.55, 0.5); blip(294, 0.85, 0.7);
          }
        } catch (_) {}

        let done = false;
        const finish = () => {
          if (done) return; done = true;
          o.classList.add("ep-intro-hide");
          setTimeout(() => { o.remove(); resolve(); }, 600);
        };
        document.getElementById("ep-intro-skip").addEventListener("click", finish);
        setTimeout(finish, 2800);
      });
    },
  };

  window.EP = EP;
})();
