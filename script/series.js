document.addEventListener("DOMContentLoaded", async () => {
  if (!(await EP.requireAuth())) return;
  EP.mountNavbar("series");

  const id = new URLSearchParams(location.search).get("id");
  const playerEl = document.getElementById("player");
  const seasonSelect = document.getElementById("seasonSelect");
  const episodesEl = document.getElementById("episodes");
  const nowPlaying = document.getElementById("nowPlaying");

  if (!id) {
    playerEl.innerHTML = `<div class="absolute inset-0 grid place-items-center text-zinc-400">Series ID missing.</div>`;
    return;
  }

  let data, seasonsData = [], currentSeason = null, currentEpisode = null;

  try {
    data = await fetch(`${EP.API}/api/series?id=${id}`).then((r) => r.json());
    if (!data || data.error) throw new Error("not found");
  } catch (_) {
    playerEl.innerHTML = `<div class="absolute inset-0 grid place-items-center text-zinc-400">Couldn't load this series.</div>`;
    return;
  }

  document.title = `${data.name || "Series"} · ELITE+`;
  document.getElementById("tvName").textContent = data.name || "Untitled";
  document.getElementById("tvOverview").textContent = data.overview || "No overview available.";
  document.getElementById("genres").textContent = (data.genres || []).join(", ") || "—";
  document.getElementById("actors").textContent = (data.cast || []).slice(0, 6).join(", ") || "—";
  document.getElementById("creator").textContent = data.creator || "—";
  document.getElementById("country").textContent = data.country || "—";

  const meta = [];
  const year = (data.first_air_date || "").slice(0, 4);
  if (year) meta.push(`<span>${year}</span>`);
  if (data.vote_average && data.vote_average !== "—")
    meta.push(`<span class="text-brand">★ ${Number(data.vote_average).toFixed(1)}</span>`);
  meta.push(`<span class="px-2 py-0.5 rounded border border-white/15 uppercase tracking-wide text-xs">Series</span>`);
  document.getElementById("metaRow").innerHTML = meta.join("");

  // Parental gate
  if (!EP.itemAllowed(data, "tv")) {
    playerEl.innerHTML = `<div class="absolute inset-0 grid place-items-center text-center px-6">
      <div><i class="ri-lock-2-line text-4xl text-zinc-500"></i>
      <p class="mt-3 font-semibold text-white">Not available on this profile</p>
      <p class="text-sm text-zinc-400 mt-1">This title is restricted by parental controls.</p>
      <a href="profiles.html" class="inline-block mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition">Switch profile</a></div></div>`;
    document.getElementById("sources").innerHTML = "";
    document.getElementById("shieldNote").classList.add("hidden");
    episodesEl.innerHTML = "";
    document.getElementById("seasonSelect").classList.add("hidden");
    return;
  }

  seasonsData = (data.seasons_data || []).filter((s) => s.season_number >= 1 && s.episodes.length);
  if (!seasonsData.length) {
    episodesEl.innerHTML = `<p class="text-zinc-500">No episodes available.</p>`;
    return;
  }

  Player.init({
    type: "tv",
    id: data.id,
    meta: { title: data.name, poster: data.poster, backdrop: data.backdrop },
    frame: playerEl,
    switcher: document.getElementById("sources"),
    shieldNote: document.getElementById("shieldNote"),
  });

  // Build the season dropdown.
  seasonSelect.innerHTML = seasonsData
    .map((s) => `<option value="${s.season_number}">Season ${s.season_number}</option>`)
    .join("");

  // Resume from saved history if available, else S1E1.
  let resumeSeason = seasonsData[0].season_number;
  let resumeEpisode = seasonsData[0].episodes[0].episode_number;
  try {
    const { history } = await EP.getHistory();
    const saved = (history || []).find((h) => h.type === "tv" && +h.id === +data.id && h.season);
    if (saved) {
      const seasonExists = seasonsData.find((s) => s.season_number === +saved.season);
      const epExists = seasonExists && seasonExists.episodes.find((e) => e.episode_number === +saved.episode);
      if (epExists) {
        resumeSeason = +saved.season;
        resumeEpisode = +saved.episode;
        EP.toast(`Resuming S${resumeSeason} · E${resumeEpisode}`, "success");
      }
    }
  } catch (_) {}

  function renderEpisodes(seasonNumber) {
    const season = seasonsData.find((s) => s.season_number === seasonNumber);
    episodesEl.innerHTML = "";
    if (!season) return;
    season.episodes.forEach((ep) => {
      const active = seasonNumber === currentSeason && ep.episode_number === currentEpisode;
      const btn = document.createElement("button");
      btn.className =
        "ep-card text-left flex gap-3 p-2.5 rounded-xl border transition " +
        (active
          ? "border-brand bg-brand/10"
          : "border-white/10 bg-ink-800/60 hover:border-white/30 hover:bg-ink-800");
      btn.innerHTML = `
        <div class="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-ink-700 shrink-0">
          ${ep.still
            ? `<img src="${ep.still}" loading="lazy" class="w-full h-full object-cover" alt="">`
            : `<div class="w-full h-full grid place-items-center text-zinc-600"><i class="ri-film-line"></i></div>`}
          ${active ? '<span class="absolute inset-0 grid place-items-center bg-black/40 text-brand text-2xl"><i class="ri-play-circle-fill"></i></span>' : ''}
        </div>
        <div class="min-w-0 py-0.5">
          <p class="text-sm font-semibold ${active ? "text-brand" : "text-white"}">Episode ${ep.episode_number}</p>
          <p class="text-sm text-zinc-300 truncate">${EP.esc(ep.name || "")}</p>
          <p class="text-xs text-zinc-500 mt-1 line-clamp-2">${EP.esc(ep.overview || "")}</p>
        </div>`;
      btn.addEventListener("click", () => playEpisode(seasonNumber, ep.episode_number));
      episodesEl.appendChild(btn);
    });
  }

  function playEpisode(season, episode) {
    currentSeason = season;
    currentEpisode = episode;
    const season_ = seasonsData.find((s) => s.season_number === season);
    const ep_ = season_ && season_.episodes.find((e) => e.episode_number === episode);
    nowPlaying.textContent = `Season ${season} · Episode ${episode}${ep_ && ep_.name ? " — " + ep_.name : ""}`;
    Player.load(season, episode);
    if (+seasonSelect.value !== season) seasonSelect.value = season;
    renderEpisodes(season);
  }

  seasonSelect.addEventListener("change", () => renderEpisodes(+seasonSelect.value));

  // Initial paint + autoplay resume.
  seasonSelect.value = resumeSeason;
  playEpisode(resumeSeason, resumeEpisode);
});
