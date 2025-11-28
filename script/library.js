document.addEventListener("DOMContentLoaded", () => {
    const Hamburger = document.querySelector('.Hamburger');
    const NavMenu = document.querySelector('.Nav-Menu');

    Hamburger.addEventListener('click', () => {
        Hamburger.classList.toggle('active');
        NavMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener("click", () => {
        Hamburger.classList.remove('active');
        NavMenu.classList.remove('active');
    }));

    const API_BASE = "https://eliteplus.pythonanywhere.com";

    document.getElementById("logout").addEventListener("click", async () => {
    const username = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    await fetch(API_BASE + "/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            Username: username,
            Token: token
        })
    });

    localStorage.clear();
    window.location.href = "/";
});


    document.getElementById("logout").addEventListener("click", async () => {
        const user = localStorage.getItem("user");

        await fetch(API_BASE + "/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Username: user })
        });

        localStorage.clear();
        window.location.href = "/index.html";
    });

    const moviesLibrary = document.getElementById('moviesLibrary');
    const tvLibrary = document.getElementById('tvLibrary');
    const queryInput = document.getElementById('query');
    const form = document.getElementById('searchForm');

    async function fetchMovies(query = "") {
        try {
            const url = query
                ? `${API_BASE}/api/movies?query=${encodeURIComponent(query)}`
                : `${API_BASE}/api/movies`;

            const res = await fetch(url);
            const data = await res.json();
            renderLibrary(data.movies || [], moviesLibrary, "movie");
        } catch {
            moviesLibrary.innerHTML = "<p style='color:#fff;'>Failed to load movies.</p>";
        }
    }

    async function fetchTV(query = "") {
        try {
            const url = query
                ? `${API_BASE}/api/tv?query=${encodeURIComponent(query)}`
                : `${API_BASE}/api/tv`;

            const res = await fetch(url);
            const data = await res.json();
            renderLibrary(data.tv_shows || [], tvLibrary, "tv");
        } catch {
            tvLibrary.innerHTML = "<p style='color:#fff;'>Failed to load series.</p>";
        }
    }

    function renderLibrary(items, container, type) {
        container.innerHTML = "";
        items.forEach(item => {
            if (!item.poster) return;

            const div = document.createElement('div');
            div.innerHTML = `<img src="${item.poster}" loading="lazy" style="width:100%;border-radius:5px;">`;
            div.onclick = () => showModal(item, type);
            container.appendChild(div);
        });
    }

    const modal = document.getElementById('Modal');
    const modalClose = document.getElementById('ModalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalPoster = document.getElementById('modalPoster');
    const modalOverview = document.getElementById('modalOverview');
    const modalTrailer = document.getElementById('modalTrailer');
    const detailsLink = document.getElementById('detailsLink');

    let trailerTimeout;

    async function fetchTrailer(id, type) {
        try {
            const url = `${API_BASE}/api/trailer?id=${id}&type=${type}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.youtube_key) {
                return `https://www.youtube.com/embed/${data.youtube_key}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0`;
            }
            return null;

        } catch {
            return null;
        }
    }

    async function showModal(item, type) {
        if (trailerTimeout) clearTimeout(trailerTimeout);

        modalTitle.textContent = item.title || item.name;
        modalPoster.src = item.backdrop || item.poster;
        modalOverview.textContent = item.overview || "No overview available";

        detailsLink.href = type === "movie"
            ? `movie.html?id=${item.id}`
            : `series.html?id=${item.id}`;

        modal.style.display = "flex";
        modalPoster.style.display = "block";
        modalTrailer.style.display = "none";

        trailerTimeout = setTimeout(async () => {
            const trailer = await fetchTrailer(item.id, type);
            if (trailer) {
                modalTrailer.src = trailer;
                modalPoster.style.display = "none";
                modalTrailer.style.display = "block";
            }
        }, 2000);
    }

    modalClose.onclick = () => closeModal();
    window.onclick = e => { if (e.target === modal) closeModal(); };

    function closeModal() {
        modal.style.display = "none";
        modalTrailer.src = "";
        modalPoster.style.display = "block";
        modalTrailer.style.display = "none";
        if (trailerTimeout) clearTimeout(trailerTimeout);
    }

    queryInput.addEventListener("input", () => {
        const value = queryInput.value.trim();

        if (value.length > 0) {
            fetchMovies(value);
            fetchTV(value);
        } else {
            fetchMovies();
            fetchTV();
        }
    });

    form.addEventListener("submit", e => e.preventDefault());

    // Initial fetch calls
    fetchMovies();
    fetchTV();
    checkAuth();
});