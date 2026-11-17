// ==========================================
// SPENDWISE DASHBOARD
// ==========================================

let incomeExpenseChart;
let categoryChart;


// ==========================================
// LOAD DASHBOARD DATA
// ==========================================

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            console.error("Unable to load dashboard data.");
            return;
        }

        const data = await response.json();

        console.log("Dashboard data:", data);


        // ==========================================
        // USER NAME
        // ==========================================

        if (data.user) {

            document.getElementById("userName").textContent =
                data.user.name;

        }


        // ==========================================
        // SUMMARY CARDS
        // ==========================================

        document.getElementById("totalIncome").textContent =
            formatCurrency(data.totalIncome);

        document.getElementById("totalExpenses").textContent =
            formatCurrency(data.totalExpenses);

        document.getElementById("totalSavings").textContent =
            formatCurrency(
                Number(data.totalIncome) - Number(data.totalExpenses)
            );


        
        
        // ==========================================
        // BUDGET AND BUDGET ALERT
        // ==========================================

        let topBudgetAlert = document.getElementById("topBudgetAlert");

        if (!topBudgetAlert) {
            topBudgetAlert = document.createElement("div");
            topBudgetAlert.id = "topBudgetAlert";
            topBudgetAlert.style.display = "none";
            topBudgetAlert.style.padding = "12px 16px";
            topBudgetAlert.style.marginBottom = "12px";
            topBudgetAlert.style.borderRadius = "8px";
            topBudgetAlert.style.backgroundColor = "#fee2e2";
            topBudgetAlert.style.color = "#991b1b";
            topBudgetAlert.style.fontWeight = "600";
            topBudgetAlert.style.border = "1px solid #fecaca";
        }

        const remainingBudgetElement =
            document.getElementById("remainingBudget");

        const remainingBudgetCard =
            remainingBudgetElement.closest(
                ".stat-card, .summary-card, .dashboard-card, .card"
            ) || remainingBudgetElement.parentElement.parentElement;

        
const summaryCards = remainingBudgetCard.parentElement;

if (summaryCards && summaryCards.parentElement) {
    summaryCards.parentElement.insertBefore(
        topBudgetAlert,
        summaryCards
    );
}


        if (data.budget) {
            const budgetAmount = Number(data.budget.amount);
            const expenses = Number(data.totalExpenses || 0);
            const remaining = budgetAmount - expenses;

            document.getElementById("budgetAmount").textContent =
                formatCurrency(budgetAmount);

            const budgetText = document.getElementById("budgetText");

            if (remaining < 0) {
                budgetText.textContent =
                    formatCurrency(Math.abs(remaining)) + " over budget";

                remainingBudgetElement.textContent =
                    formatCurrency(remaining);
            } else if (remaining === 0) {
                budgetText.textContent = "Budget limit reached!";
                remainingBudgetElement.textContent = formatCurrency(0);
            } else {
                budgetText.textContent =
                    formatCurrency(remaining) + " remaining";

                remainingBudgetElement.textContent =
                    formatCurrency(remaining);
            }

            let progress = 0;

            if (budgetAmount > 0) {
                progress = (expenses / budgetAmount) * 100;
            }

            document.getElementById("budgetProgress").style.width =
                Math.min(progress, 100) + "%";

            // Show one alert above the Remaining Budget card
            if (budgetAmount > 0 && expenses >= budgetAmount) {
                topBudgetAlert.style.display = "block";

                if (expenses > budgetAmount) {
                    topBudgetAlert.textContent =
                        "⚠️ Budget exceeded by " +
                        formatCurrency(expenses - budgetAmount) +
                        "! Please control your spending.";
                } else {
                    topBudgetAlert.textContent =
                        "⚠️ Budget limit reached! You have used your entire budget.";
                }
            } else {
                topBudgetAlert.style.display = "none";
            }
        } else {
            document.getElementById("budgetAmount").textContent = "₹0";
            document.getElementById("budgetText").textContent = "No budget set";
            remainingBudgetElement.textContent = "₹0";
            document.getElementById("budgetProgress").style.width = "0%";

            topBudgetAlert.style.display = "none";
        }


        // ==========================================
        // RECENT TRANSACTIONS
        // ==========================================

        loadRecentTransactions(data.recentTransactions);


        // ==========================================
        // CHARTS
        // ==========================================

        createIncomeExpenseChart(
            data.totalIncome,
            data.totalExpenses
        );

        createCategoryChart(
            data.categoryExpenses
        );


    } catch (error) {

        console.error("Dashboard error:", error);

    }

}


// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(amount) {

    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


// ==========================================
// RECENT TRANSACTIONS
// ==========================================

function loadRecentTransactions(transactions) {

    const container =
        document.getElementById("transactionsList");


    if (!transactions || transactions.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No transactions yet.
            </p>
        `;

        return;

    }


    container.innerHTML = "";


    transactions.forEach(transaction => {

        const item =
            document.createElement("div");

        item.className = "transaction-item";


        const amount =
            Number(transaction.amount);


        const type =
            transaction.type;


        const sign =
            type === "Income" ? "+" : "-";


        const amountClass =
            type === "Income"
                ? "income"
                : "expense";


        item.innerHTML = `

            <div class="transaction-info">

                <strong>
                    ${transaction.category}
                </strong>

                <span>
                    ${transaction.description || "No description"}
                </span>

            </div>


            <div class="transaction-amount ${amountClass}">

                ${sign}${formatCurrency(amount)}

            </div>

        `;


        container.appendChild(item);

    });

}


// ==========================================
// INCOME VS EXPENSE CHART
// ==========================================

function createIncomeExpenseChart(income, expenses) {

    const canvas =
        document.getElementById("incomeExpenseChart");


    if (!canvas) {
        return;
    }


    if (incomeExpenseChart) {

        incomeExpenseChart.destroy();

    }


    incomeExpenseChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [
                    "Income",
                    "Expenses"
                ],

                datasets: [

                    {
                        label: "Amount",

                        data: [
                            Number(income || 0),
                            Number(expenses || 0)
                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        });

}


// ==========================================
// EXPENSE CATEGORY CHART
// ==========================================

function createCategoryChart(categoryExpenses) {

    const canvas =
        document.getElementById("categoryChart");


    if (!canvas) {
        return;
    }


    if (categoryChart) {

        categoryChart.destroy();

    }


    const labels = [];
    const values = [];


    if (categoryExpenses) {

        categoryExpenses.forEach(item => {

            labels.push(item.category);

            values.push(
                Number(item.total)
            );

        });

    }


    if (labels.length === 0) {

        labels.push("No Expenses");

        values.push(0);

    }


    categoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Expenses",

                        data: values

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "right"

                    }

                }

            }

        });

}


// ==========================================
// LOGOUT
// ==========================================

document
    .getElementById("logoutBtn")
    .addEventListener("click", async function () {

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


// ==========================================
// START DASHBOARD
// ==========================================

loadDashboard();