document.addEventListener("DOMContentLoaded", async () => {
  if (!(await EP.requireAuth())) return;
  EP.mountNavbar("home");
  UI.initSearch();
  EP.playIntro();

  const heroHost = document.getElementById("hero");
  const content = document.getElementById("content");

  fetch(`${EP.API}/api/latest`)
    .then((r) => r.json())
    .then((d) => UI.mountHero(heroHost, d.movies || [], "movie"))
    .catch(() => UI.mountHero(heroHost, [], "movie"));

  await UI.mountContinue(content);

  // Top 10 this week (numbered)
  const t10 = UI.makeRow(content, "Top 10 This Week");
  UI.skeletonRow(t10.track, 6);
  try {
    const d = await fetch(`${EP.API}/api/trending?type=all`).then((r) => r.json());
    if (!UI.fillTop10(t10.track, d.items || [])) t10.section.remove();
  } catch (_) { t10.section.remove(); }

  const rows = [
    { title: "Trending Movies", url: "/api/movies", key: "movies", type: "movie" },
    { title: "Popular Series", url: "/api/tv", key: "tv_shows", type: "tv" },
    { title: "Popular Anime", url: "/api/anime?kind=series_popular", key: "tv_shows", type: "tv", noKids: true },
    { title: "Action", url: "/api/genre?genre_id=28", key: "movies", type: "movie", genre: 28 },
    { title: "Comedy", url: "/api/genre?genre_id=35", key: "movies", type: "movie", genre: 35 },
    { title: "Sci-Fi & Fantasy", url: "/api/series/genre?genre_id=10765", key: "tv_shows", type: "tv", genre: 10765 },
    { title: "Family", url: "/api/genre?genre_id=10751", key: "movies", type: "movie", genre: 10751 },
    { title: "Horror", url: "/api/genre?genre_id=27", key: "movies", type: "movie", genre: 27 },
    { title: "Animation", url: "/api/genre?genre_id=16", key: "movies", type: "movie", genre: 16 },
  ];

  for (const r of rows) {
    if (r.noKids && EP.profileKids) continue;
    if (r.genre && !EP.genreAllowed(r.genre, r.type)) continue;
    const { section, track } = UI.makeRow(content, r.title);
    UI.skeletonRow(track);
    try {
      const data = await fetch(`${EP.API}${r.url}`).then((res) => res.json());
      if (!UI.fillRow(track, data[r.key] || [], r.type)) section.remove();
    } catch (_) { section.remove(); }
  }
});
