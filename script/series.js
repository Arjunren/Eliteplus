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
    seasonSelect.addEventListener("change", showEpisodes);
    let seasonsData = [];

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

            seasonsData = data.seasons_data || [];

            seasonSelect.innerHTML = '';
            seasonsData.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.season_number;
                opt.textContent = `Season ${s.season_number}`;
                seasonSelect.appendChild(opt);
            });

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
        playerDiv.innerHTML = `
            <iframe src="https://vidlink.pro/tv/${id}/${season}/${episode}" allowfullscreen allow="encrypted-media"></iframe>
        `;
    }

    window.showEpisodes = showEpisodes;
});
