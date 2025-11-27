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
    const movieId = new URLSearchParams(location.search).get("id");

    if (!movieId) {
        document.getElementById("player").innerHTML = "<h2 style='color:white;text-align:center;'>Movie ID missing!</h2>";
    } else {
        fetch(`${API_BASE}/api/movie?id=${movieId}`)
            .then(res => res.json())
            .then(movie => {

                document.getElementById("title").textContent = movie.title || "Untitled";
                document.getElementById("overview").textContent = movie.overview || "No overview available.";

                document.getElementById("genre").textContent = movie.genres?.join(", ") || "Unknown";
                document.getElementById("actors").textContent = movie.cast?.slice(0, 5).join(", ") || "Unknown";
                document.getElementById("director").textContent = movie.director || "Unknown";
                document.getElementById("country").textContent = movie.country || "—";
                document.getElementById("rating").textContent = movie.vote_average ? movie.vote_average + "/10" : "—";
                document.getElementById("release").textContent = movie.release_date || "—";
                document.getElementById("duration").textContent =
                    movie.runtime && movie.runtime !== "—" ? movie.runtime + " min" : "—";


                document.getElementById("player").innerHTML = `
                        <iframe src="https://vidsrc.to/embed/movie/${movie.id}" allow="fullscreen"></iframe>
                    `;
            })
            .catch(() => {
                document.getElementById("player").innerHTML = "<h2 style='color:white;text-align:center;'>Error loading movie.</h2>";
            });
    }
});