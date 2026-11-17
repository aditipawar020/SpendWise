// ===============================
// BUDGET PAGE
// ===============================

const budgetForm = document.getElementById("budgetForm");

const budgetMessage =
    document.getElementById("budgetMessage");

const currentBudget =
    document.getElementById("currentBudget");

const currentMonth =
    document.getElementById("currentMonth");

const logoutBtn =
    document.getElementById("logoutBtn");


// ===============================
// SET CURRENT MONTH AND YEAR
// ===============================

const today = new Date();

const currentMonthNumber =
    today.getMonth() + 1;

const currentYear =
    today.getFullYear();


document.getElementById("budgetMonth").value =
    currentMonthNumber;

document.getElementById("budgetYear").value =
    currentYear;


// ===============================
// SAVE BUDGET
// ===============================

budgetForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const monthlyLimit =
        document.getElementById("monthlyLimit").value;

    const month =
        document.getElementById("budgetMonth").value;

    const year =
        document.getElementById("budgetYear").value;


    budgetMessage.textContent =
        "Saving budget...";

    budgetMessage.style.color =
        "#2563eb";


    try {

        const response = await fetch("/api/budget", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                monthlyLimit: monthlyLimit,

                month: month,

                year: year

            })

        });


        const data =
            await response.json();


        if (!response.ok) {

            budgetMessage.textContent =
                data.message;

            budgetMessage.style.color =
                "#dc2626";

            return;
        }


        budgetMessage.textContent =
            data.message;

        budgetMessage.style.color =
            "#16a34a";


        loadBudget();

    } catch (error) {

        console.error(
            "Budget save error:",
            error
        );


        budgetMessage.textContent =
            "Unable to connect to the server.";

        budgetMessage.style.color =
            "#dc2626";

    }

});


// ===============================
// LOAD CURRENT BUDGET
// ===============================

async function loadBudget() {

    try {

        const response =
            await fetch("/api/budget");


        const data =
            await response.json();


        if (!response.ok) {

            window.location.href =
                "login.html";

            return;
        }


        if (!data.budget) {

            currentBudget.textContent =
                "₹0.00";

            currentMonth.textContent =
                "No budget set";

            return;
        }


        currentBudget.textContent =
            "₹" +
            Number(
                data.budget.monthly_limit
            ).toFixed(2);


        const monthNames = [

            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"

        ];


        const monthName =
            monthNames[
                Number(data.budget.month) - 1
            ];


        currentMonth.textContent =
            monthName +
            " " +
            data.budget.year;


    } catch (error) {

        console.error(
            "Budget load error:",
            error
        );

    }

}


// ===============================
// LOGOUT
// ===============================

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
// LOAD BUDGET WHEN PAGE OPENS
// ===============================

loadBudget();