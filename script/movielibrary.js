document.addEventListener("DOMContentLoaded", async () => {
  if (!(await EP.requireAuth())) return;
  EP.mountNavbar("movies");
  UI.initSearch();

  const heroHost = document.getElementById("hero");
  const content = document.getElementById("content");

  fetch(`${EP.API}/api/latest`)
    .then((r) => r.json())
    .then((d) => UI.mountHero(heroHost, d.movies || [], "movie"))
    .catch(() => UI.mountHero(heroHost, [], "movie"));

  const GENRES = [
    [28, "Action"], [12, "Adventure"], [35, "Comedy"], [878, "Sci-Fi"],
    [27, "Horror"], [10749, "Romance"], [16, "Animation"], [53, "Thriller"],
    [80, "Crime"], [14, "Fantasy"], [18, "Drama"], [9648, "Mystery"],
    [10751, "Family"], [99, "Documentary"], [37, "Western"],
  ];

  // "Popular" first, then each genre.
  const { section: ps, track: pt } = UI.makeRow(content, "Popular Movies");
  UI.skeletonRow(pt);
  try {
    const d = await fetch(`${EP.API}/api/movies?limit=25`).then((r) => r.json());
    if (!UI.fillRow(pt, d.movies || [], "movie")) ps.remove();
  } catch (_) { ps.remove(); }

  for (const [id, name] of GENRES) {
    if (!EP.genreAllowed(id, "movie")) continue; // parental control
    const { section, track } = UI.makeRow(content, name);
    UI.skeletonRow(track);
    try {
      const d = await fetch(`${EP.API}/api/genre?genre_id=${id}`).then((r) => r.json());
      if (!UI.fillRow(track, d.movies || [], "movie")) section.remove();
    } catch (_) { section.remove(); }
  }
});
