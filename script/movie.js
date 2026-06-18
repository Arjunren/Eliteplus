document.addEventListener("DOMContentLoaded", async () => {
  if (!(await EP.requireAuth())) return;
  EP.mountNavbar("movies");

  const id = new URLSearchParams(location.search).get("id");
  const playerEl = document.getElementById("player");

  if (!id) {
    playerEl.innerHTML = `<div class="absolute inset-0 grid place-items-center text-zinc-400">Movie ID missing.</div>`;
    return;
  }

  let movie;
  try {
    movie = await fetch(`${EP.API}/api/movie?id=${id}`).then((r) => r.json());
    if (!movie || movie.error) throw new Error("not found");
  } catch (_) {
    playerEl.innerHTML = `<div class="absolute inset-0 grid place-items-center text-zinc-400">Couldn't load this movie.</div>`;
    return;
  }

  document.title = `${movie.title || "Movie"} · ELITE+`;
  document.getElementById("title").textContent = movie.title || "Untitled";
  document.getElementById("overview").textContent = movie.overview || "No overview available.";
  document.getElementById("genre").textContent = (movie.genres || []).join(", ") || "—";
  document.getElementById("actors").textContent = (movie.cast || []).slice(0, 6).join(", ") || "—";
  document.getElementById("director").textContent = movie.director || "—";
  document.getElementById("country").textContent = movie.country || "—";
  document.getElementById("release").textContent = movie.release_date || "—";
  document.getElementById("duration").textContent =
    movie.runtime && movie.runtime !== "—" ? `${movie.runtime} min` : "—";

  const meta = [];
  const year = (movie.release_date || "").slice(0, 4);
  if (year) meta.push(`<span>${year}</span>`);
  if (movie.vote_average && movie.vote_average !== "—")
    meta.push(`<span class="text-brand">★ ${Number(movie.vote_average).toFixed(1)}</span>`);
  meta.push(`<span class="px-2 py-0.5 rounded border border-white/15 uppercase tracking-wide text-xs">Movie</span>`);
  document.getElementById("metaRow").innerHTML = meta.join("");

  // Parental gate
  if (!EP.itemAllowed(movie, "movie")) {
    playerEl.innerHTML = `<div class="absolute inset-0 grid place-items-center text-center px-6">
      <div><i class="ri-lock-2-line text-4xl text-zinc-500"></i>
      <p class="mt-3 font-semibold text-white">Not available on this profile</p>
      <p class="text-sm text-zinc-400 mt-1">This title is restricted by parental controls.</p>
      <a href="profiles.html" class="inline-block mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition">Switch profile</a></div></div>`;
    document.getElementById("sources").innerHTML = "";
    document.getElementById("shieldNote").classList.add("hidden");
    return;
  }

  Player.init({
    type: "movie",
    id: movie.id,
    meta: { title: movie.title, poster: movie.poster, backdrop: movie.backdrop },
    frame: playerEl,
    switcher: document.getElementById("sources"),
    shieldNote: document.getElementById("shieldNote"),
  });
  Player.load();
});
