// ===============================
// ADMIN DASHBOARD
// ===============================


// ===============================
// CHECK ADMIN LOGIN
// ===============================

async function checkAdmin() {

    try {

        const response =
            await fetch("/api/admin/dashboard");

        if (!response.ok) {

            window.location.href =
                "login.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(
            "Admin check error:",
            error
        );

        window.location.href =
            "login.html";

        return false;
    }
}


// ===============================
// LOAD ADMIN DASHBOARD
// ===============================

async function loadAdminDashboard() {

    try {

        const response =
            await fetch("/api/admin/dashboard");

        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            window.location.href =
                "login.html";

            return;
        }


        document.getElementById("totalUsers").textContent =
            data.totalUsers;


        document.getElementById("pendingUsers").textContent =
            data.pendingUsers;


        document.getElementById("totalTransactions").textContent =
            data.totalTransactions;


        document.getElementById("totalExpenses").textContent =
            "₹" +
            Number(data.totalExpenses).toFixed(2);


    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

    }
}


// ===============================
// LOGOUT
// ===============================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                const response =
                    await fetch(
                        "/api/logout",
                        {
                            method: "POST"
                        }
                    );


                const data =
                    await response.json();


                if (data.success) {

                    window.location.href =
                        "login.html";

                }

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// ===============================
// START ADMIN DASHBOARD
// ===============================

checkAdmin().then((isAdmin) => {

    if (isAdmin) {

        loadAdminDashboard();

    }

});