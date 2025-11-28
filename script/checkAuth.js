document.addEventListener("DOMContentLoaded", () => {
    const API_BASES = "https://eliteplus.pythonanywhere.com";

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