document.addEventListener("DOMContentLoaded", () => {
    const Hamburger = document.querySelector('.Hamburger');
    const NavMenu = document.querySelector('.Nav-Menu');

    Hamburger.addEventListener('click', () => {
        Hamburger.classList.toggle('active');
        NavMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(n =>
        n.addEventListener("click", () => {
            Hamburger.classList.remove('active');
            NavMenu.classList.remove('active');
        })
    );

    const API_BASE = "https://eliteplus.pythonanywhere.com";
    const urlParams = new URLSearchParams(window.location.search);
    const tvId = urlParams.get("id");

    const tvNameEl = document.getElementById("tvName");
    const tvOverviewEl = document.getElementById("tvOverview");
    const seasonSelect = document.getElementById("seasonSelect");
    const episodesDiv = document.getElementById("episodes");
    const playerDiv = document.getElementById("player");
    const seasonInfoEl = document.getElementById("Season");
    const episodeInfoEl = document.getElementById("Episode");

    seasonSelect.addEventListener("change", showEpisodes);

    let seasonsData = [];
    let currentSeason = null;
    let currentEpisode = null;

    if (!tvId) {
        document.body.innerHTML = "<h2>TV Series ID is required!</h2>";
        return;
    }

    fetch(`${API_BASE}/api/series?id=${tvId}`)
        .then(res => res.json())
        .then(data => {
            tvNameEl.textContent = data.name;
            tvOverviewEl.textContent = data.overview || "No overview available.";
            document.getElementById("genres").textContent = data.genres?.join(", ") || "Unknown";
            document.getElementById("actors").textContent = data.cast?.slice(0, 5).join(", ") || "Unknown";
            document.getElementById("creator").textContent = data.creator || "Unknown";
            document.getElementById("country").textContent = data.country || "—";
            document.getElementById("rating").textContent = data.vote_average ? data.vote_average + "/10" : "—";
            document.getElementById("release").textContent = data.first_air_date || "—";

            seasonsData = data.seasons_data?.filter(s => s.season_number >= 1) || [];
            seasonSelect.innerHTML = '';

            seasonsData.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.season_number;
                opt.textContent = `Season ${s.season_number}`;
                seasonSelect.appendChild(opt);
            });

            seasonSelect.value = 1;
            showEpisodes();
        })
        .catch(err => {
            document.body.innerHTML = `<h2>Error loading series<br>${err}</h2>`;
        });

    function showEpisodes() {
        const seasonNumber = Number(seasonSelect.value);
        const season = seasonsData.find(s => s.season_number === seasonNumber);
        episodesDiv.innerHTML = '';
        if (!season) return;

        season.episodes.forEach(ep => {
            const btn = document.createElement("button");
            btn.textContent = `Episode ${ep.episode_number}: ${ep.name}`;
            btn.onclick = () => playEpisode(tvId, season.season_number, ep.episode_number);
            episodesDiv.appendChild(btn);
        });

        if (season.episodes.length > 0) {
            playEpisode(tvId, season.season_number, season.episodes[0].episode_number);
        }
    }

    function playEpisode(id, season, episode) {
        currentSeason = season;
        currentEpisode = episode;

        const seasonData = seasonsData.find(s => s.season_number === season);
        const episodeData = seasonData?.episodes.find(e => e.episode_number === episode);

        seasonInfoEl.textContent = `Season ${season}`;
        episodeInfoEl.textContent = episodeData
            ? `Episode ${episode} — ${episodeData.name}`
            : `Episode ${episode}`;

        playerDiv.innerHTML = `
<iframe
    src="https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=63b8bc&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&autoplay=true&nextbutton=true&startAt=60&player=jw&title=true&poster=true&mute=false"
    allowfullscreen>
</iframe>

`;


    }

    window.showEpisodes = showEpisodes;
});
