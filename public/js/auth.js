// ===============================
// LOGIN PROTECTION
// ===============================

async function checkLogin() {
    try {
        const response = await fetch("/api/session");

        if (!response.ok) {
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (!data.loggedIn) {
            window.location.href = "login.html";
        }

    } catch (error) {
        console.error("Session check error:", error);
        window.location.href = "login.html";
    }
}

checkLogin();