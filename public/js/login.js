const loginForm = document.getElementById("loginForm");

const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    loginMessage.textContent =
        "Logging in...";

    loginMessage.style.color =
        "#2563eb";


    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });


        const data = await response.json();


        if (!response.ok) {

            loginMessage.textContent =
                data.message;

            loginMessage.style.color =
                "#dc2626";

            return;
        }


        loginMessage.textContent =
            data.message;

        loginMessage.style.color =
            "#16a34a";


        // ===============================
        // REDIRECT USER
        // ===============================

        setTimeout(function () {

            window.location.href =
                data.redirect;

        }, 500);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        loginMessage.textContent =
            "Unable to connect to the server.";

        loginMessage.style.color =
            "#dc2626";

    }

});