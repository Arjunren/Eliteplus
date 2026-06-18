document.addEventListener("DOMContentLoaded", async () => {
  if (!(await EP.requireAuth())) return;
  EP.mountNavbar("series");
  UI.initSearch();

  const heroHost = document.getElementById("hero");
  const content = document.getElementById("content");

  fetch(`${EP.API}/api/latest_series`)
    .then((r) => r.json())
    .then((d) => UI.mountHero(heroHost, d.series || [], "tv"))
    .catch(() => UI.mountHero(heroHost, [], "tv"));

  const GENRES = [
    [10759, "Action & Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"],
    [18, "Drama"], [10765, "Sci-Fi & Fantasy"], [9648, "Mystery"], [10751, "Family"],
    [10762, "Kids"], [99, "Documentary"], [10764, "Reality"], [10768, "War & Politics"],
    [37, "Western"],
  ];

  const { section: ps, track: pt } = UI.makeRow(content, "Popular Series");
  UI.skeletonRow(pt);
  try {
    const d = await fetch(`${EP.API}/api/tv?limit=25`).then((r) => r.json());
    if (!UI.fillRow(pt, d.tv_shows || [], "tv")) ps.remove();
  } catch (_) { ps.remove(); }

  for (const [id, name] of GENRES) {
    if (!EP.genreAllowed(id, "tv")) continue; // parental control
    const { section, track } = UI.makeRow(content, name);
    UI.skeletonRow(track);
    try {
      const d = await fetch(`${EP.API}/api/series/genre?genre_id=${id}`).then((r) => r.json());
      if (!UI.fillRow(track, d.tv_shows || [], "tv")) section.remove();
    } catch (_) { section.remove(); }
  }
});
