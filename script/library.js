document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Mobile Menu Logic ---
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = mobileBtn.querySelector('i');

    mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        if (mobileMenu.classList.contains('hidden')) {
            menuIcon.classList.remove('ri-close-line');
            menuIcon.classList.add('ri-menu-4-line');
        } else {
            menuIcon.classList.remove('ri-menu-4-line');
            menuIcon.classList.add('ri-close-line');
        }
    });

    // --- 2. Auth & LOGOUT MODAL Logic ---
    const API_BASE = "https://eliteplus.pythonanywhere.com";

    // Modal Elements
    const logoutModal = document.getElementById('LogoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');
    const navLogoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('logoutMobileBtn');

    // Show Logout Modal
    function openLogoutModal() {
        logoutModal.classList.remove('hidden');
        logoutModal.classList.add('flex');
    }

    // Hide Logout Modal
    function closeLogoutModal() {
        logoutModal.classList.add('hidden');
        logoutModal.classList.remove('flex');
    }

    // Attach listeners to trigger modal
    if (navLogoutBtn) navLogoutBtn.addEventListener('click', openLogoutModal);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', openLogoutModal);

    // Attach listeners to modal buttons
    cancelLogoutBtn.addEventListener('click', closeLogoutModal);

    // Close if clicking outside
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) closeLogoutModal();
    });

    // Perform Actual Logout
    confirmLogoutBtn.addEventListener('click', async () => {
        const username = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        // Optional: Change button text to "Signing out..."
        confirmLogoutBtn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i>';

        if (username) {
            try {
                await fetch(API_BASE + "/api/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Username: username, Token: token })
                });
            } catch (e) {
                console.error("Logout error", e);
            }
        }

        localStorage.clear();
        window.location.href = "/index.html";
    });

    function checkAuth() {
        // If you want to force login check:
        // const token = localStorage.getItem("token");
        // if (!token) window.location.href = "/index.html";
    }

    // --- 3. Library Fetching Logic ---
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
        } catch (e) {
            console.error(e);
            moviesLibrary.innerHTML = "<p class='text-red-400 col-span-full text-center'>Failed to load movies.</p>";
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
        } catch (e) {
            console.error(e);
            tvLibrary.innerHTML = "<p class='text-red-400 col-span-full text-center'>Failed to load series.</p>";
        }
    }

    function renderLibrary(items, container, type) {
        container.innerHTML = "";
        items.forEach(item => {
            if (!item.poster) return;

            const div = document.createElement('div');
            div.className = "relative group cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-cyan-500/20 bg-slate-800 border border-slate-700";

            div.innerHTML = `
                        <img src="${item.poster}" loading="lazy" class="w-full h-full object-cover aspect-[2/3]">
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <i class="ri-play-circle-fill text-4xl text-brand-neon"></i>
                        </div>
                    `;
            div.onclick = () => showModal(item, type);
            container.appendChild(div);
        });
    }

    // --- 4. Content Modal Logic ---
    const modal = document.getElementById('Modal');
    const modalClose = document.getElementById('ModalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalPoster = document.getElementById('modalPoster');
    const modalOverview = document.getElementById('modalOverview');
    const modalTrailer = document.getElementById('modalTrailer');
    const detailsLink = document.getElementById('detailsLink');
    const playIconOverlay = document.getElementById('playIconOverlay');

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
        } catch { return null; }
    }

    async function showModal(item, type) {
        if (trailerTimeout) clearTimeout(trailerTimeout);

        modalTitle.textContent = item.title || item.name;
        modalPoster.src = item.backdrop || item.poster;
        modalOverview.textContent = item.overview || "No overview available";

        detailsLink.href = type === "movie"
            ? `movie.html?id=${item.id}`
            : `series.html?id=${item.id}`;

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        modalPoster.style.display = "block";
        playIconOverlay.style.display = "flex";
        modalTrailer.style.display = "none";
        modalTrailer.src = "";

        trailerTimeout = setTimeout(async () => {
            const trailer = await fetchTrailer(item.id, type);
            if (trailer) {
                modalTrailer.src = trailer;
                modalPoster.style.display = "none";
                playIconOverlay.style.display = "none";
                modalTrailer.style.display = "block";
            }
        }, 2000);
    }

    function closeContentModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modalTrailer.src = "";
        if (trailerTimeout) clearTimeout(trailerTimeout);
    }

    modalClose.onclick = closeContentModal;

    // Global click close for both modals
    window.onclick = e => {
        if (e.target === modal) closeContentModal();
    };

    // Search Logic
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

    // Initialize
    checkAuth();
    fetchMovies();
    fetchTV();
});