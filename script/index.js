document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "https://eliteplus.pythonanywhere.com";

    if (localStorage.getItem("token")) {
        window.location.href = "/library.html";
    }

    const passInput = document.getElementById("Password");
    const togglePass = document.getElementById("togglePass");

    togglePass.addEventListener("click", () => {
        const isHidden = passInput.type === "password";
        passInput.type = isHidden ? "text" : "password";
        togglePass.innerHTML = isHidden
            ? '<i class="ri-eye-fill"></i>'
            : '<i class="ri-eye-off-fill"></i>';
    });

    document.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("Username").value.trim();
        const password = document.getElementById("Password").value.trim();
        const errorBox = document.getElementById("errorBox");

        errorBox.style.display = "none";
        errorBox.innerText = "";

        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Username: username,
                    Password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("user", username);
                localStorage.setItem("token", data.token);

                window.location.href = "/library.html";
            } else {
                errorBox.style.display = "block";
                errorBox.innerText = data.error || "Incorrect username or password.";
            }
        } catch (err) {
            errorBox.style.display = "block";
            errorBox.innerText = "Failed to reach server.";
            console.error("Login Error:", err);
        }
    });
});