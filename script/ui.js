/* =====================================================================
   ElitePlus+ shared browse UI — cards, rows, hero, details modal, search.
   Depends on window.EP (config.js). Exposes window.UI.
   ===================================================================== */
(function () {
  const UI = {};

  const hrefFor = (item, type) =>
    (type === "movie" ? `movie.html?id=${item.id}` : `series.html?id=${item.id}`);

  /* ---------------- poster card ---------------- */
  UI.posterCard = function (item, type, opts = {}) {
    const title = EP.esc(item.title || item.name || "");
    const poster = item.poster || item.backdrop || "";
    const prog = typeof opts.progress === "number" ? Math.max(4, Math.min(100, opts.progress)) : null;
    return `
    <div class="poster-card group relative shrink-0 w-28 sm:w-36 md:w-40 cursor-pointer" data-id="${item.id}" data-type="${type}">
      <div class="relative rounded-lg overflow-hidden bg-ink-800 aspect-[2/3] ring-1 ring-white/5">
        ${poster
          ? `<img src="${poster}" loading="lazy" alt="" class="w-full h-full object-cover">`
          : `<div class="w-full h-full grid place-items-center text-zinc-700"><i class="ri-film-line text-3xl"></i></div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
        <div class="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
          <span class="w-11 h-11 rounded-full bg-white/90 text-black grid place-items-center text-xl shadow-lg"><i class="ri-play-fill"></i></span>
        </div>
        ${prog !== null ? `<div class="absolute bottom-0 inset-x-0 h-1 bg-white/20"><div class="h-full bg-brand" style="width:${prog}%"></div></div>` : ""}
      </div>
      <p class="mt-2 text-xs sm:text-sm text-zinc-400 truncate group-hover:text-white transition">${title}</p>
    </div>`;
  };

  /* ---------------- continue-watching card (landscape) ---------------- */
  UI.continueCard = function (item) {
    const type = item.type;
    const title = EP.esc(item.title || "");
    const img = item.backdrop || item.poster || "";
    const sub = type === "tv" && item.season
      ? `S${item.season} · E${item.episode}` : (type === "movie" ? "Movie" : "Series");
    const key = `${type}-${item.id}`;
    const prog = Math.max(4, Math.min(100, item.progress || 0));
    return `
    <div class="cw-card poster-card group relative shrink-0 w-52 sm:w-64 cursor-pointer" data-href="${hrefFor(item, type)}" data-key="${key}">
      <div class="relative rounded-lg overflow-hidden bg-ink-800 aspect-video ring-1 ring-white/5">
        ${img
          ? `<img src="${img}" loading="lazy" alt="" class="w-full h-full object-cover">`
          : `<div class="w-full h-full grid place-items-center text-zinc-700"><i class="ri-film-line text-3xl"></i></div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div>
        <div class="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
          <span class="w-12 h-12 rounded-full bg-white/90 text-black grid place-items-center text-2xl shadow-lg"><i class="ri-play-fill"></i></span>
        </div>
        <button class="cw-remove absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition" title="Remove">
          <i class="ri-close-line"></i>
        </button>
        <div class="absolute bottom-2.5 left-3 right-3">
          <p class="text-sm font-semibold text-white truncate drop-shadow">${title}</p>
          <p class="text-[11px] text-zinc-300">${sub}</p>
        </div>
        <div class="absolute bottom-0 inset-x-0 h-1.5 bg-white/20"><div class="h-full bg-brand" style="width:${prog}%"></div></div>
      </div>
    </div>`;
  };

  /* ---------------- a titled, scrollable row ---------------- */
  let rowSeq = 0;
  UI.makeRow = function (parent, title, opts = {}) {
    const id = "row-" + (++rowSeq);
    const section = document.createElement("section");
    section.className = "mb-8 sm:mb-10 animate-fade-in";
    section.innerHTML = `
      <div class="flex items-center justify-between px-4 sm:px-8 mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-white">${EP.esc(title)}</h2>
      </div>
      <div class="relative group/row">
        <button class="row-prev hidden md:grid place-items-center absolute left-0 inset-y-0 z-10 w-12 bg-gradient-to-r from-ink-950 to-transparent text-white text-3xl opacity-0 group-hover/row:opacity-100 transition"><i class="ri-arrow-left-s-line"></i></button>
        <div id="${id}" class="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth px-4 sm:px-8 pb-2"></div>
        <button class="row-next hidden md:grid place-items-center absolute right-0 inset-y-0 z-10 w-12 bg-gradient-to-l from-ink-950 to-transparent text-white text-3xl opacity-0 group-hover/row:opacity-100 transition"><i class="ri-arrow-right-s-line"></i></button>
      </div>`;
    parent.appendChild(section);
    const track = section.querySelector("#" + id);
    section.querySelector(".row-prev").addEventListener("click", () =>
      track.scrollBy({ left: -track.clientWidth * 0.85, behavior: "smooth" }));
    section.querySelector(".row-next").addEventListener("click", () =>
      track.scrollBy({ left: track.clientWidth * 0.85, behavior: "smooth" }));
    return { section, track };
  };

  // Fill a row track with poster cards and wire clicks → details modal.
  // Items are filtered by the active profile's parental restrictions.
  UI.fillRow = function (track, items, type) {
    const valid = (items || []).filter((i) => (i.poster || i.backdrop) && EP.itemAllowed(i, type));
    track.innerHTML = valid.map((i) => UI.posterCard(i, type)).join("");
    valid.forEach((i) => UI._cache(i, type));
    track.querySelectorAll(".poster-card").forEach((el) => {
      el.addEventListener("click", () => UI.openDetails(el.dataset.id, el.dataset.type));
    });
    return valid.length;
  };

  // Netflix-style numbered Top 10 row. Items carry their own `.type`.
  UI.top10Card = function (item, rank) {
    const poster = item.poster || item.backdrop || "";
    return `
    <div class="poster-card group relative shrink-0 cursor-pointer flex items-end" data-id="${item.id}" data-type="${item.type}">
      <span class="text-[4.5rem] sm:text-[7rem] leading-[0.75] font-black text-ink-900 select-none" style="-webkit-text-stroke:2px #3a3a45;">${rank}</span>
      <div class="relative -ml-3 sm:-ml-5 w-20 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-brand/60 transition">
        ${poster ? `<img src="${poster}" loading="lazy" class="w-full h-full object-cover" alt="">`
                 : `<div class="w-full h-full grid place-items-center text-zinc-700"><i class="ri-film-line"></i></div>`}
      </div>
    </div>`;
  };

  UI.fillTop10 = function (track, items) {
    const valid = (items || []).filter((i) => (i.poster || i.backdrop) && EP.itemAllowed(i, i.type)).slice(0, 10);
    track.innerHTML = valid.map((i, idx) => UI.top10Card(i, idx + 1)).join("");
    valid.forEach((i) => UI._cache(i, i.type));
    track.querySelectorAll(".poster-card").forEach((el) =>
      el.addEventListener("click", () => UI.openDetails(el.dataset.id, el.dataset.type)));
    return valid.length;
  };

  UI.skeletonRow = function (track, n = 8, landscape = false) {
    const c = landscape ? "w-52 sm:w-64 aspect-video" : "w-28 sm:w-36 md:w-40 aspect-[2/3]";
    track.innerHTML = Array.from({ length: n }).map(() =>
      `<div class="skeleton shrink-0 rounded-lg ${c}"></div>`).join("");
  };

  /* ---------------- item cache (for details modal) ---------------- */
  UI._store = {};
  UI._cache = function (item, type) { UI._store[`${type}-${item.id}`] = { item, type }; };

  /* ---------------- details modal (singleton) ---------------- */
  let trailerTimer = null;
  function ensureModal() {
    if (document.getElementById("ep-details")) return;
    const el = document.createElement("div");
    el.id = "ep-details";
    el.className = "fixed inset-0 z-[140] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto";
    el.innerHTML = `
      <div class="w-full max-w-2xl rounded-2xl overflow-hidden bg-ink-900 border border-white/10 shadow-2xl animate-scale-in my-auto">
        <div class="relative aspect-video bg-black">
          <img id="ep-d-img" class="w-full h-full object-cover" alt="">
          <iframe id="ep-d-trailer" class="absolute inset-0 w-full h-full hidden" allow="autoplay; encrypted-media" referrerpolicy="origin" frameborder="0"></iframe>
          <div class="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-black/30 pointer-events-none"></div>
          <button id="ep-d-close" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white grid place-items-center text-xl">&times;</button>
          <h2 id="ep-d-title" class="absolute bottom-3 left-5 right-5 text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg"></h2>
        </div>
        <div class="p-5 sm:p-6">
          <div id="ep-d-meta" class="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-3"></div>
          <p id="ep-d-overview" class="text-sm text-zinc-300 leading-relaxed max-h-32 overflow-y-auto thin-scroll"></p>
          <div class="mt-5 flex items-center gap-3">
            <a id="ep-d-play" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-black font-bold transition"><i class="ri-play-fill text-lg"></i> Play</a>
            <button id="ep-d-close2" class="px-5 py-2.5 rounded-xl border border-white/15 text-zinc-200 hover:bg-white/5 font-semibold transition">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    const close = () => UI.closeDetails();
    el.querySelector("#ep-d-close").addEventListener("click", close);
    el.querySelector("#ep-d-close2").addEventListener("click", close);
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  UI.openDetails = function (id, type, itemMaybe) {
    ensureModal();
    const cached = UI._store[`${type}-${id}`];
    const item = itemMaybe || (cached && cached.item);
    if (!item) return;

    const el = document.getElementById("ep-details");
    const img = document.getElementById("ep-d-img");
    const trailer = document.getElementById("ep-d-trailer");
    document.getElementById("ep-d-title").textContent = item.title || item.name || "";
    document.getElementById("ep-d-overview").textContent = item.overview || "No overview available.";
    document.getElementById("ep-d-play").href = hrefFor(item, type);

    const meta = [];
    const year = (item.release_date || "").slice(0, 4);
    if (year) meta.push(`<span>${year}</span>`);
    if (item.rating) meta.push(`<span class="text-brand">★ ${Number(item.rating).toFixed(1)}</span>`);
    meta.push(`<span class="px-2 py-0.5 rounded border border-white/15 uppercase tracking-wide">${type === "movie" ? "Movie" : "Series"}</span>`);
    document.getElementById("ep-d-meta").innerHTML = meta.join("");

    img.src = item.backdrop || item.poster || "";
    img.classList.remove("hidden");
    trailer.classList.add("hidden");
    trailer.src = "";

    el.classList.remove("hidden");
    el.classList.add("flex");
    document.body.style.overflow = "hidden";

    if (trailerTimer) clearTimeout(trailerTimer);
    trailerTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${EP.API}/api/trailer?id=${item.id}&type=${type}`);
        const data = await res.json();
        if (data.youtube_key && !el.classList.contains("hidden")) {
          trailer.src = `https://www.youtube.com/embed/${data.youtube_key}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1`;
          trailer.classList.remove("hidden");
          img.classList.add("hidden");
        }
      } catch (_) {}
    }, 900);
  };

  UI.closeDetails = function () {
    const el = document.getElementById("ep-details");
    if (!el) return;
    el.classList.add("hidden");
    el.classList.remove("flex");
    document.getElementById("ep-d-trailer").src = "";
    document.body.style.overflow = "";
    if (trailerTimer) clearTimeout(trailerTimer);
  };

  /* ---------------- hero carousel ---------------- */
  UI.mountHero = function (host, items, type) {
    const slides = (items || []).filter((i) => (i.backdrop || i.poster) && EP.itemAllowed(i, type)).slice(0, 6);
    if (!slides.length) {
      host.innerHTML = '<div class="h-44 sm:h-52 bg-gradient-to-b from-ink-900 via-ink-900 to-ink-950"></div>';
      return;
    }
    slides.forEach((i) => UI._cache(i, type));

    host.innerHTML = `
      <div class="relative h-[58vh] min-h-[380px] max-h-[640px] overflow-hidden">
        <div id="ep-hero-track" class="flex h-full transition-transform duration-700 ease-out">
          ${slides.map((s) => `
            <div class="relative w-full h-full shrink-0">
              <img src="${s.backdrop || s.poster}" alt="" class="absolute inset-0 w-full h-full object-cover object-top">
              <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/30 to-transparent"></div>
              <div class="absolute bottom-16 sm:bottom-20 left-4 sm:left-10 max-w-xl">
                <h1 class="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg">${EP.esc(s.title || s.name || "")}</h1>
                <p class="mt-3 text-sm sm:text-base text-zinc-200 line-clamp-3 drop-shadow">${EP.esc(s.overview || "")}</p>
                <div class="mt-5 flex items-center gap-3">
                  <a href="${hrefFor(s, type)}" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-black font-bold transition shadow-lg shadow-brand/20"><i class="ri-play-fill text-lg"></i> Play</a>
                  <button data-id="${s.id}" class="ep-hero-info inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold backdrop-blur transition"><i class="ri-information-line text-lg"></i> More Info</button>
                </div>
              </div>
            </div>`).join("")}
        </div>
        <div id="ep-hero-dots" class="absolute bottom-6 left-4 sm:left-10 flex gap-2"></div>
      </div>`;

    const track = host.querySelector("#ep-hero-track");
    const dots = host.querySelector("#ep-hero-dots");
    let idx = 0;
    dots.innerHTML = slides.map((_, i) =>
      `<button data-i="${i}" class="h-1.5 rounded-full transition-all ${i === 0 ? "w-6 bg-brand" : "w-2.5 bg-white/40"}"></button>`).join("");
    const go = (i) => {
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.querySelectorAll("button").forEach((d, di) => {
        d.className = `h-1.5 rounded-full transition-all ${di === idx ? "w-6 bg-brand" : "w-2.5 bg-white/40"}`;
      });
    };
    dots.querySelectorAll("button").forEach((d) => d.addEventListener("click", () => { go(+d.dataset.i); reset(); }));
    host.querySelectorAll(".ep-hero-info").forEach((b) =>
      b.addEventListener("click", () => UI.openDetails(b.dataset.id, type)));

    let timer = setInterval(() => go(idx + 1), 6000);
    const reset = () => { clearInterval(timer); timer = setInterval(() => go(idx + 1), 6000); };
  };

  /* ---------------- continue-watching row ---------------- */
  UI.mountContinue = async function (host) {
    const { continue: cont } = await EP.getHistory();
    if (!cont || !cont.length) { host.innerHTML = ""; return false; }
    const { track } = UI.makeRow(host, "Continue Watching");
    track.innerHTML = cont.map(UI.continueCard).join("");
    track.querySelectorAll(".cw-card").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".cw-remove")) return;
        location.href = el.dataset.href;
      });
      el.querySelector(".cw-remove").addEventListener("click", async (e) => {
        e.stopPropagation();
        await EP.deleteHistory(el.dataset.key);
        el.remove();
        if (!track.children.length) host.innerHTML = "";
        EP.toast("Removed from Continue Watching", "success");
      });
    });
    return true;
  };

  /* ---------------- search overlay ---------------- */
  UI.initSearch = function () {
    if (document.getElementById("ep-search")) return;
    const ov = document.createElement("div");
    ov.id = "ep-search";
    ov.className = "fixed inset-0 z-[150] hidden flex-col bg-ink-950/97 backdrop-blur-xl";
    ov.innerHTML = `
      <div class="px-4 sm:px-8 pt-6 pb-4 border-b border-white/10">
        <div class="max-w-3xl mx-auto flex items-center gap-3">
          <i class="ri-search-line text-2xl text-zinc-400"></i>
          <input id="ep-search-input" type="text" placeholder="Search movies and series…"
            class="flex-1 bg-transparent text-xl sm:text-2xl text-white placeholder-zinc-500 focus:outline-none">
          <button id="ep-search-close" class="text-zinc-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto thin-scroll px-4 sm:px-8 py-6">
        <div id="ep-search-status" class="max-w-5xl mx-auto text-zinc-500 text-sm"></div>
        <div id="ep-search-results" class="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mt-4"></div>
      </div>`;
    document.body.appendChild(ov);

    const input = ov.querySelector("#ep-search-input");
    const results = ov.querySelector("#ep-search-results");
    const status = ov.querySelector("#ep-search-status");
    const open = () => { ov.classList.remove("hidden"); ov.classList.add("flex"); document.body.style.overflow = "hidden"; setTimeout(() => input.focus(), 50); };
    const close = () => { ov.classList.add("hidden"); ov.classList.remove("flex"); document.body.style.overflow = ""; };

    document.getElementById("ep-search-btn")?.addEventListener("click", open);
    ov.querySelector("#ep-search-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    let t = null;
    input.addEventListener("input", () => {
      clearTimeout(t);
      const q = input.value.trim();
      if (!q) { results.innerHTML = ""; status.textContent = ""; return; }
      status.textContent = "Searching…";
      t = setTimeout(async () => {
        try {
          const [m, s] = await Promise.all([
            fetch(`${EP.API}/api/search?query=${encodeURIComponent(q)}`).then((r) => r.json()),
            fetch(`${EP.API}/api/search_series?query=${encodeURIComponent(q)}`).then((r) => r.json()),
          ]);
          const movies = (m.movies || []).map((x) => ({ x, type: "movie" }));
          const series = (s.tv_shows || []).map((x) => ({ x, type: "tv" }));
          const all = [...movies, ...series].filter((o) => (o.x.poster || o.x.backdrop) && EP.itemAllowed(o.x, o.type));
          if (!all.length) { status.textContent = `No results for “${q}”.`; results.innerHTML = ""; return; }
          status.textContent = `Results for “${q}”`;
          results.innerHTML = all.map((o) => {
            UI._cache(o.x, o.type);
            return `<div class="poster-card group cursor-pointer" data-id="${o.x.id}" data-type="${o.type}">
              <div class="relative rounded-lg overflow-hidden bg-ink-800 aspect-[2/3] ring-1 ring-white/5">
                <img src="${o.x.poster || o.x.backdrop}" loading="lazy" class="w-full h-full object-cover" alt="">
                <span class="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white uppercase">${o.type === "movie" ? "Movie" : "TV"}</span>
              </div>
              <p class="mt-1.5 text-xs text-zinc-400 truncate group-hover:text-white">${EP.esc(o.x.title || o.x.name || "")}</p>
            </div>`;
          }).join("");
          results.querySelectorAll(".poster-card").forEach((el) =>
            el.addEventListener("click", () => { close(); UI.openDetails(el.dataset.id, el.dataset.type); }));
        } catch (_) { status.textContent = "Search failed. Try again."; }
      }, 350);
    });
  };

  window.UI = UI;
})();
