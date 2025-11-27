document.addEventListener("DOMContentLoaded", () => {
    const API_BASES = "https://eliteplus.pythonanywhere.com";

    async function checkAuth() {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            localStorage.clear();
            window.location.href = "/";
            return;
        }

        try {
            const res = await fetch(API_BASES + "/api/check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
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
            localStorage.clear();
            window.location.href = "/";
        }
    }

    document.getElementById("logout").addEventListener("click", async () => {
        const user = localStorage.getItem("user");

        await fetch(API_BASES + "/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Username: user })
        });

        localStorage.clear();
        window.location.href = "/index.html";
    });

    checkAuth();
});