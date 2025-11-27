document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("Modal");
    const modalClose = document.getElementById("ModalClose");
    const modalTitle = document.getElementById("modalTitle");
    const modalPoster = document.getElementById("modalPoster");
    const modalOverview = document.getElementById("modalOverview");
    const modalTrailer = document.getElementById("modalTrailer");
    const detailsLink = document.getElementById("detailsLink");

    const API_BASE = "https://eliteplus.pythonanywhere.com";
    let MOVIE_CACHE = {};

    const searchForm = document.getElementById("searchForm");
    const queryInput = document.getElementById("query");
    const genresContainer = document.getElementById("genres");
    const heroSection = document.querySelector(".hero-section");

    let searchContainer = document.createElement("div");
    searchContainer.id = "searchContainer";
    searchContainer.style.display = "none";
    searchContainer.style.marginTop = "100px";
    searchContainer.style.padding = "10px";

    searchContainer.innerHTML = `
    <h2 id="searchTitle" style="color:#fff; margin-bottom:15px;">Search Results</h2>
    <div id="searchResults"
         style="display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px;">
    </div>
`;
    document.body.insertBefore(searchContainer, genresContainer);

    const searchResultsDiv = document.getElementById("searchResults");
    const searchTitle = document.getElementById("searchTitle");


    async function searchMovies(q) {
        try {
            const res = await fetch(`${API_BASE}/api/search?query=${encodeURIComponent(q)}`);
            const data = await res.json();
            return data.movies || [];
        } catch (e) {
            console.error("Search error:", e);
            return [];
        }
    }

    function renderSearchResults(movies, queryText) {
        searchResultsDiv.innerHTML = "";

        searchTitle.innerHTML = `You’ve searched for “<span style="color:#0cf">${queryText}</span>”`;

        if (!movies || movies.length === 0) {
            searchResultsDiv.innerHTML = `<p style="color:#fff;">No results found.</p>`;
            return;
        }

        movies.forEach(m => {
            MOVIE_CACHE[m.id] = m;

            const card = document.createElement("div");
            card.className = "movie-card";
            card.style.cursor = "pointer";

            card.innerHTML = `
            <img src="${m.poster || m.backdrop || ''}" 
                 style="width:100%;height:210px;object-fit:cover;border-radius:8px;">
            <div style="padding:6px 4px;color:#fff;font-size:14px">${m.title || m.name}</div>
        `;

            card.addEventListener("click", () => showModal(m.id));
            searchResultsDiv.appendChild(card);
        });
    }

    queryInput.addEventListener("input", async () => {
        const text = queryInput.value.trim();

        if (text.length > 0) {
            if (heroSection) heroSection.style.display = "none";
            genresContainer.style.display = "none";

            searchContainer.style.display = "block";
            searchResultsDiv.innerHTML = `<p style="color:#fff;padding:10px;">Searching...</p>`;

            const movies = await searchMovies(text);
            renderSearchResults(movies, text);

        } else {
            if (heroSection) heroSection.style.display = "block";
            genresContainer.style.display = "block";

            searchContainer.style.display = "none";
            searchResultsDiv.innerHTML = "";
        }
    });

    searchForm.addEventListener("submit", e => e.preventDefault());

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

    const GENRES = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
        99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
        27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
        53: "Thriller", 10752: "War", 37: "Western"
    };

    async function loadGenre(id, name) {
        const res = await fetch(`${API_BASE}/api/genre?genre_id=${id}`);
        const data = await res.json();
        const movies = data.movies || [];

        const section = document.createElement("div");

        movies.forEach(m => MOVIE_CACHE[m.id] = m);

        section.innerHTML = `
        <h2>${name}</h2>
        <div class="swiper swiper-${id}">
            <div class="swiper-wrapper">
                ${movies.map(m => `
                    <div class="swiper-slide" onclick="showModal(${m.id})">
                        <div class="movie-card">
                            <img src="${m.poster}">
                        </div>
                    </div>
                `).join("")}
            </div>
            <div class="swiper-button-next swiper-next-${id}"></div>
            <div class="swiper-button-prev swiper-prev-${id}"></div>
        </div>
    `;

        genresContainer.appendChild(section);

        new Swiper(`.swiper-${id}`, {
            slidesPerView: 6,
            spaceBetween: 10,
            freeMode: true,
            navigation: {
                nextEl: `.swiper-next-${id}`,
                prevEl: `.swiper-prev-${id}`
            },
            breakpoints: {
                0: { slidesPerView: 2 },
                500: { slidesPerView: 3 },
                700: { slidesPerView: 4 },
                1000: { slidesPerView: 6 }
            }
        });
    }

    async function loadAll() {
        for (const id in GENRES) await loadGenre(id, GENRES[id]);
    }

    async function loadHero() {
        const res = await fetch(`${API_BASE}/api/latest`);
        const data = await res.json();
        const movies = data.movies.slice(0, 5);

        const wrapper = document.getElementById("heroWrapper");

        movies.forEach(m => MOVIE_CACHE[m.id] = m);

        wrapper.innerHTML = movies.map(m => `
        <div class="swiper-slide hero-slide" onclick="showModal(${m.id})">
            <img src="${m.backdrop || m.poster}">
            <div class="hero-info">
                <h1>${m.title || m.name}</h1>
                <p>${m.overview}</p>
                <a href="movie.html?id=${m.id}">Play</a>
                <a onclick="showModal(${m.id})">View Detail</a>
            </div>
        </div>
    `).join("");

        new Swiper(".hero-swiper", {
            autoplay: { delay: 4000, disableOnInteraction: false },
            loop: true,
            pagination: { el: ".swiper-pagination", clickable: true }
        });
    }

    let trailerTimeout;

    function showModal(id) {
        const movie = MOVIE_CACHE[id];
        if (!movie) return console.warn("Movie not found:", id);
        openModal(movie);
    }

    async function openModal(movie) {
        if (trailerTimeout) clearTimeout(trailerTimeout);

        modal.style.display = "flex";
        modalTitle.textContent = movie.title || movie.name;
        modalPoster.src = movie.backdrop || movie.poster;
        modalOverview.textContent = movie.overview;
        detailsLink.href = `movie.html?id=${movie.id}`;

        modalPoster.style.display = "block";
        modalTrailer.style.display = "none";
        modalTrailer.src = "";

        trailerTimeout = setTimeout(async () => {
            const res = await fetch(`${API_BASE}/api/trailer?id=${movie.id}&type=movie`);
            const data = await res.json();

            if (data.youtube_key) {
                modalTrailer.src =
                    `https://www.youtube.com/embed/${data.youtube_key}?autoplay=1&mute=0`;
                modalPoster.style.display = "none";
                modalTrailer.style.display = "block";
            }
        }, 500);
    }

    modalClose.onclick = () => {
        modal.style.display = "none";
        modalTrailer.src = "";
    };

    window.onclick = e => {
        if (e.target === modal) {
            modal.style.display = "none";
            modalTrailer.src = "";
        }
    };

    window.showModal = showModal;

    loadHero();
    loadAll();
});