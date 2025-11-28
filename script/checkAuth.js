document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "https://eliteplus.pythonanywhere.com";

    async function logout() {
        const username = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!username || !token) {
            localStorage.clear();
            window.location.href = "/";
            return;
        }

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
    }

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    async function checkAuth() {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            localStorage.clear();
            window.location.href = "/";
            return;
        }

        try {
            const res = await fetch(API_BASE + "/api/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Username: user,
                    Token: token
                })
            });

            const data = await res.json();

            if (!data.valid) {
                localStorage.clear();
                window.location.href = "/";
            }

        } catch (err) {
            console.error("Auth error:", err);
            localStorage.clear();
            window.location.href = "/";
        }
    }

    checkAuth();
});
