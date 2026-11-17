// ===============================
// SAVINGS GOALS
// ===============================

const savingsGoalForm = document.getElementById("savingsGoalForm");
const goalsList = document.getElementById("goalsList");
const goalMessage = document.getElementById("goalMessage");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");


// ===============================
// LOAD SAVINGS GOALS
// ===============================

async function loadSavingsGoals() {

    try {

        const response = await fetch("/api/savings-goals");

        const data = await response.json();

        if (!response.ok) {

            goalsList.innerHTML = `
                <p class="empty-message">
                    Unable to load savings goals.
                </p>
            `;

            return;
        }


        if (!data.goals || data.goals.length === 0) {

            goalsList.innerHTML = `
                <p class="empty-message">
                    No savings goals created yet.
                </p>
            `;

            return;
        }


        goalsList.innerHTML = "";


        data.goals.forEach(goal => {

            const goalItem = document.createElement("div");

            goalItem.className = "goal-item";


            const targetAmount =
                Number(goal.target_amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });


            let targetDate = "No target date";

            if (goal.target_date) {

                const date = new Date(goal.target_date);

                targetDate = date.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });

            }


            goalItem.innerHTML = `

                <div class="goal-info">

                    <h3>
                        ${goal.goal_name}
                    </h3>

                    <p>
                        Target Amount:
                        ₹${targetAmount}
                    </p>

                    <p>
                        Target Date:
                        ${targetDate}
                    </p>

                </div>


                <button
                    class="goal-delete-btn"
                    data-id="${goal.goal_id}">

                    Delete

                </button>

            `;


            goalsList.appendChild(goalItem);

        });


        // Add delete event to buttons

        document
            .querySelectorAll(".goal-delete-btn")
            .forEach(button => {

                button.addEventListener("click", function () {

                    const goalId = this.dataset.id;

                    deleteSavingsGoal(goalId);

                });

            });


    } catch (error) {

        console.error("Load savings goals error:", error);

        goalsList.innerHTML = `
            <p class="empty-message">
                Server error while loading savings goals.
            </p>
        `;

    }

}


// ===============================
// ADD SAVINGS GOAL
// ===============================

savingsGoalForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const goalName =
        document.getElementById("goalName").value.trim();


    const targetAmount =
        document.getElementById("targetAmount").value;


    const targetDate =
        document.getElementById("targetDate").value;


    goalMessage.textContent = "";


    try {

        const response = await fetch("/api/savings-goals", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                goalName: goalName,

                targetAmount: targetAmount,

                targetDate: targetDate

            })

        });


        const data = await response.json();


        if (!response.ok) {

            goalMessage.textContent =
                data.message || "Unable to add savings goal.";

            goalMessage.style.color = "#dc2626";

            return;
        }


        goalMessage.textContent =
            "Savings goal added successfully!";

        goalMessage.style.color = "#16a34a";


        savingsGoalForm.reset();


        await loadSavingsGoals();


    } catch (error) {

        console.error("Add savings goal error:", error);

        goalMessage.textContent =
            "Server error. Please try again.";

        goalMessage.style.color = "#dc2626";

    }

});


// ===============================
// DELETE SAVINGS GOAL
// ===============================

async function deleteSavingsGoal(goalId) {

    const confirmed = confirm(
        "Are you sure you want to delete this savings goal?"
    );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `/api/savings-goals/${goalId}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to delete savings goal."
            );

            return;
        }


        alert("Savings goal deleted successfully!");


        loadSavingsGoals();


    } catch (error) {

        console.error("Delete savings goal error:", error);

        alert(
            "Server error. Please try again."
        );

    }

}


// ===============================
// REFRESH BUTTON
// ===============================

refreshBtn.addEventListener("click", function () {

    loadSavingsGoals();

});


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener("click", async function () {

    try {

        await fetch("/api/logout", {
            method: "POST"
        });

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout error:", error);

        window.location.href = "login.html";

    }

});


// ===============================
// INITIAL LOAD
// ===============================

loadSavingsGoals();