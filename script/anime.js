document.addEventListener("DOMContentLoaded", async () => {
  if (!(await EP.requireAuth())) return;
  EP.mountNavbar("anime");
  UI.initSearch();

  const heroHost = document.getElementById("hero");
  const content = document.getElementById("content");

  // The general anime catalogue mixes mature titles that genre data can't
  // reliably flag, so it's withheld from Kids profiles.
  if (EP.profileKids) {
    heroHost.innerHTML = '<div class="h-16"></div>';
    content.innerHTML = `
      <div class="px-6 py-24 text-center text-zinc-400">
        <i class="ri-shield-keyhole-line text-4xl text-zinc-600"></i>
        <p class="mt-3 font-semibold text-white">Anime is off for Kids profiles</p>
        <p class="text-sm text-zinc-500 mt-1">Family-friendly animation is still available on Home and Movies.</p>
        <a href="library.html" class="inline-block mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition">Back to Home</a>
      </div>`;
    return;
  }

  fetch(`${EP.API}/api/anime?kind=series_popular`)
    .then((r) => r.json())
    .then((d) => UI.mountHero(heroHost, d.tv_shows || [], "tv"))
    .catch(() => UI.mountHero(heroHost, [], "tv"));

  const rows = [
    { title: "Popular Anime", url: "/api/anime?kind=series_popular", key: "tv_shows", type: "tv" },
    { title: "Top Rated Anime", url: "/api/anime?kind=series_top", key: "tv_shows", type: "tv" },
    { title: "New Anime", url: "/api/anime?kind=series_new", key: "tv_shows", type: "tv" },
    { title: "Anime Movies", url: "/api/anime?kind=movies", key: "movies", type: "movie" },
  ];

  let rendered = 0;
  for (const r of rows) {
    const { section, track } = UI.makeRow(content, r.title);
    UI.skeletonRow(track);
    try {
      const data = await fetch(`${EP.API}${r.url}`).then((res) => res.json());
      const n = UI.fillRow(track, data[r.key] || [], r.type);
      if (!n) section.remove(); else rendered += n;
    } catch (_) { section.remove(); }
  }

  if (!rendered) {
    content.innerHTML = `
      <div class="px-6 py-24 text-center text-zinc-400">
        <i class="ri-emotion-sad-line text-4xl text-zinc-600"></i>
        <p class="mt-3 font-semibold">No anime available for this profile.</p>
        <p class="text-sm text-zinc-500 mt-1">Animation may be restricted by this profile's parental controls.</p>
      </div>`;
  }
});
