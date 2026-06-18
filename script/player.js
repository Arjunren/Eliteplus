/* =====================================================================
   ElitePlus+ player core — sandboxed embed + ad-shield + progress save.
   Shared by movie.js and series.js. Exposes window.Player.
   ===================================================================== */
(function () {
  const COLORS = "primaryColor=00eaff&secondaryColor=8a8a8a&iconColor=00eaff";

  // shielded:true  → rendered inside an ad-blocking sandbox (pop-ups/redirects blocked).
  // resume:true    → reports playback position back to us (powers Continue Watching).
  const SOURCES = {
    movie: (id) => ([
      { name: "Ad-Shield", url: `https://vidsrc.cc/v2/embed/movie/${id}`, shielded: true },
      { name: "Ad-Shield 2", url: `https://embed.su/embed/movie/${id}`, shielded: true },
      { name: "HD + Resume", url: `https://vidlink.pro/movie/${id}?${COLORS}&title=true&poster=true&autoplay=true`, resume: true },
      { name: "Server 4", url: `https://vidsrc.to/embed/movie/${id}`, shielded: true },
    ]),
    tv: (id, s, e) => ([
      { name: "Ad-Shield", url: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`, shielded: true },
      { name: "Ad-Shield 2", url: `https://embed.su/embed/tv/${id}/${s}/${e}`, shielded: true },
      { name: "HD + Resume", url: `https://vidlink.pro/tv/${id}/${s}/${e}?${COLORS}&title=true&poster=true&autoplay=true&nextbutton=true`, resume: true },
      { name: "Server 4", url: `https://vidsrc.to/embed/tv/${id}/${s}/${e}`, shielded: true },
    ]),
  };

  const Player = {
    type: null, id: null,
    season: null, episode: null,
    meta: {},                 // {title, poster, backdrop}
    sourceIdx: 0,
    _frame: null, _switcher: null, _shieldNote: null,
    _lastSave: 0, _sawData: false, _pending: null,

    init({ type, id, meta, frame, switcher, shieldNote }) {
      this.type = type; this.id = +id; this.meta = meta || {};
      this._frame = frame; this._switcher = switcher; this._shieldNote = shieldNote;
      this._listen();
      window.addEventListener("pagehide", () => this._flush(true));
      document.addEventListener("visibilitychange", () => { if (document.hidden) this._flush(true); });
    },

    sources() {
      return this.type === "movie"
        ? SOURCES.movie(this.id)
        : SOURCES.tv(this.id, this.season, this.episode);
    },

    load(season, episode) {
      if (this.type === "tv") { this.season = season; this.episode = episode; }
      this._sawData = false;
      this._render();
      // Baseline so the title shows in "Continue Watching" even if the
      // embed never reports progress (e.g. on a non-shielded server).
      clearTimeout(this._baseTimer);
      this._baseTimer = setTimeout(() => {
        if (!this._sawData) this._save({ position: 0, duration: 0, progress: 1 });
      }, 12000);
    },

    setSource(i) {
      this.sourceIdx = i;
      this._render();
    },

    _render() {
      const list = this.sources();
      const src = list[this.sourceIdx] || list[0];

      // Only shielded sources get the ad-blocking sandbox. The resume server
      // (vidlink) refuses to run sandboxed, so it plays normally + reports progress.
      const sandboxAttr = src.shielded ? ` sandbox="${EP.SANDBOX}"` : "";
      this._frame.innerHTML = `
        <iframe src="${src.url}" class="absolute inset-0 w-full h-full" allowfullscreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          referrerpolicy="origin"${sandboxAttr}></iframe>`;

      if (this._switcher) {
        this._switcher.innerHTML = list.map((s, i) => {
          const icon = s.shielded ? "ri-shield-check-fill" : (s.resume ? "ri-history-line" : "ri-server-line");
          return `<button type="button" data-i="${i}" class="src-btn px-3.5 py-2 rounded-lg text-sm font-semibold border transition flex items-center gap-1.5 ${
            i === this.sourceIdx
              ? "bg-brand text-black border-brand"
              : "bg-ink-800 text-zinc-300 border-white/10 hover:border-white/30"
          }"><i class="${icon}"></i>${s.name}</button>`;
        }).join("");
        this._switcher.querySelectorAll(".src-btn").forEach((b) =>
          b.addEventListener("click", () => this.setSource(+b.dataset.i)));
      }
      if (this._shieldNote) {
        this._shieldNote.classList.remove("hidden");
        this._shieldNote.innerHTML = src.shielded
          ? '<i class="ri-shield-check-fill text-brand"></i> Ad-Shield on — pop-ups &amp; redirects are blocked.'
          : '<i class="ri-history-line text-brand"></i> Resume tracking on — this server is unshielded and may show ads.';
      }
    },

    /* ---- progress capture (vidlink.pro posts MEDIA_DATA) ---- */
    _listen() {
      window.addEventListener("message", (e) => {
        const d = e.data;
        if (!d || typeof d !== "object" || d.type !== "MEDIA_DATA") return;
        const info = this._extract(d.data);
        if (!info) return;
        this._sawData = true;
        this._pending = info;                      // newest known position
        const now = Date.now();
        if (now - this._lastSave < 4500) return;   // throttle network saves
        this._lastSave = now;
        this._save(info);
        this._pending = null;
      });
    },

    _extract(store) {
      if (!store || typeof store !== "object") return null;
      const rec = store[this.id] || store[String(this.id)];
      if (!rec) return null;
      if (this.type === "movie") {
        const p = rec.progress || {};
        return { position: +p.watched || 0, duration: +p.duration || 0 };
      }
      // TV: prefer the record matching the episode we're playing.
      let watched = 0, duration = 0;
      const sp = rec.show_progress || {};
      const match = Object.values(sp).find((v) =>
        +v.season === +this.season && +v.episode === +this.episode);
      const chosen = match || (rec.progress ? rec : Object.values(sp).slice(-1)[0]);
      const pg = (chosen && chosen.progress) || rec.progress || {};
      watched = +pg.watched || 0; duration = +pg.duration || 0;
      return { position: watched, duration };
    },

    _save(info, beacon) {
      EP.saveHistory({
        id: this.id, type: this.type,
        title: this.meta.title || "",
        poster: this.meta.poster || "",
        backdrop: this.meta.backdrop || "",
        season: this.type === "tv" ? this.season : null,
        episode: this.type === "tv" ? this.episode : null,
        position: info.position || 0,
        duration: info.duration || 0,
        progress: info.progress, // undefined → backend computes from pos/dur
      }, { beacon });
    },

    // Flush the newest throttled position on unload via sendBeacon.
    _flush(beacon) {
      if (this._pending) {
        this._save(this._pending, beacon);
        this._pending = null;
      }
    },
  };

  window.Player = Player;
})();
