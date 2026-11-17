// ==========================================
// REPORTS PAGE
// ==========================================

const reportMonth = document.getElementById("reportMonth");
const reportYear = document.getElementById("reportYear");

const generateReportBtn =
    document.getElementById("generateReportBtn");

const exportReportBtn =
    document.getElementById("exportReportBtn");

const reportIncome =
    document.getElementById("reportIncome");

const reportExpenses =
    document.getElementById("reportExpenses");

const reportSavings =
    document.getElementById("reportSavings");

const reportSavingsRate =
    document.getElementById("reportSavingsRate");

const categorySummary =
    document.getElementById("categorySummary");

const reportTransactions =
    document.getElementById("reportTransactions");

const logoutBtn =
    document.getElementById("logoutBtn");

let incomeExpenseChart = null;
let categoryChart = null;

let currentReportData = null;


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
// LOAD YEARS
// ==========================================

function loadYears() {

    const currentYear = new Date().getFullYear();

    for (let year = currentYear - 5; year <= currentYear + 1; year++) {

        const option = document.createElement("option");

        option.value = year;

        option.textContent = year;

        reportYear.appendChild(option);

    }

    reportYear.value = currentYear;

}


// ==========================================
// SET CURRENT MONTH
// ==========================================

function setCurrentMonth() {

    const currentMonth = new Date().getMonth() + 1;

    reportMonth.value = currentMonth;

}


// ==========================================
// LOAD REPORT
// ==========================================

async function loadReport() {

    const month = reportMonth.value;

    const year = reportYear.value;

    try {

        const response = await fetch(
            `/api/reports?month=${month}&year=${year}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(data.message || "Unable to load report.");

            return;

        }

        currentReportData = data;

        displaySummary(data);

        displayCategorySummary(data.categoryExpenses);

        displayTransactions(data.transactions);

        createIncomeExpenseChart(data);

        createCategoryChart(data.categoryExpenses);

    } catch (error) {

        console.error("Report error:", error);

        alert("Unable to load report.");

    }

}


// ==========================================
// DISPLAY SUMMARY
// ==========================================

function displaySummary(data) {

    const income = Number(data.totalIncome || 0);

    const expenses = Number(data.totalExpenses || 0);

    const savings = income - expenses;

    let savingsRate = 0;

    if (income > 0) {

        savingsRate = (savings / income) * 100;

    }

    reportIncome.textContent =
        formatCurrency(income);

    reportExpenses.textContent =
        formatCurrency(expenses);

    reportSavings.textContent =
        formatCurrency(savings);

    reportSavingsRate.textContent =
        savingsRate.toFixed(1) + "%";

}


// ==========================================
// CATEGORY SUMMARY
// ==========================================

function displayCategorySummary(categories) {

    if (!categories || categories.length === 0) {

        categorySummary.innerHTML = `
            <p class="empty-message">
                No expenses found for this month.
            </p>
        `;

        return;

    }

    categorySummary.innerHTML =
        categories.map(category => {

            return `
                <div class="category-row">

                    <span class="category-name">
                        ${escapeHtml(category.category)}
                    </span>

                    <span class="category-amount">
                        ${formatCurrency(category.total)}
                    </span>

                </div>
            `;

        }).join("");

}


// ==========================================
// DISPLAY TRANSACTIONS
// ==========================================

function displayTransactions(transactions) {

    if (!transactions || transactions.length === 0) {

        reportTransactions.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No transactions found for this month.
                </td>
            </tr>
        `;

        return;

    }

    reportTransactions.innerHTML =
        transactions.map(transaction => {

            const typeClass =
                transaction.type === "Income"
                    ? "income-text"
                    : "expense-text";

            const sign =
                transaction.type === "Income"
                    ? "+"
                    : "-";

            const date =
                transaction.transaction_date
                    ? new Date(
                        transaction.transaction_date
                    ).toLocaleDateString("en-IN")
                    : "-";

            return `
                <tr>

                    <td>
                        ${date}
                    </td>

                    <td class="${typeClass}">
                        ${escapeHtml(transaction.type)}
                    </td>

                    <td>
                        ${escapeHtml(transaction.category || "-")}
                    </td>

                    <td>
                        ${escapeHtml(transaction.description || "-")}
                    </td>

                    <td>
                        ${escapeHtml(transaction.payment_method || "-")}
                    </td>

                    <td class="${typeClass}">
                        ${sign}${formatCurrency(transaction.amount)}
                    </td>

                </tr>
            `;

        }).join("");

}


// ==========================================
// INCOME VS EXPENSE CHART
// ==========================================

function createIncomeExpenseChart(data) {

    const canvas =
        document.getElementById("incomeExpenseChart");

    if (incomeExpenseChart) {

        incomeExpenseChart.destroy();

    }

    incomeExpenseChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "Income",
                "Expenses",
                "Savings"
            ],

            datasets: [

                {
                    label: "Amount",

                    data: [
                        Number(data.totalIncome || 0),
                        Number(data.totalExpenses || 0),
                        Number(data.totalIncome || 0)
                        - Number(data.totalExpenses || 0)
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
// CATEGORY CHART
// ==========================================

function createCategoryChart(categories) {

    const canvas =
        document.getElementById("categoryChart");

    if (categoryChart) {

        categoryChart.destroy();

    }

    const labels =
        categories.map(item => item.category);

    const values =
        categories.map(item => Number(item.total));

    categoryChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [

                {
                    data: values
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}


// ==========================================
// EXPORT REPORT
// ==========================================

exportReportBtn.addEventListener("click", function () {

    if (!currentReportData) {

        alert("Please generate a report first.");

        return;

    }

    const data = currentReportData;

    let csv = "";

    csv += "SpendWise Financial Report\n";

    csv += `Month,${reportMonth.options[reportMonth.selectedIndex].text}\n`;

    csv += `Year,${reportYear.value}\n\n`;

    csv += "Summary\n";

    csv += "Total Income,Total Expenses,Total Savings,Savings Rate\n";

    csv += `${data.totalIncome},${data.totalExpenses},`;

    const savings =
        Number(data.totalIncome || 0)
        - Number(data.totalExpenses || 0);

    const savingsRate =
        Number(data.totalIncome || 0) > 0
            ? ((savings / Number(data.totalIncome)) * 100).toFixed(1)
            : 0;

    csv += `${savings},${savingsRate}%\n\n`;

    csv += "Transactions\n";

    csv += "Date,Type,Category,Description,Payment Method,Amount\n";

    data.transactions.forEach(transaction => {

        csv += `"${transaction.transaction_date || ""}",`;

        csv += `"${transaction.type || ""}",`;

        csv += `"${transaction.category || ""}",`;

        csv += `"${transaction.description || ""}",`;

        csv += `"${transaction.payment_method || ""}",`;

        csv += `"${transaction.amount || 0}"\n`;

    });

    const blob =
        new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `SpendWise_Report_${reportMonth.value}_${reportYear.value}.csv`;

    link.click();

    URL.revokeObjectURL(url);

});


// ==========================================
// GENERATE REPORT BUTTON
// ==========================================

generateReportBtn.addEventListener(
    "click",
    loadReport
);


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async function () {

    try {

        await fetch("/api/logout", {
            method: "POST"
        });

    } catch (error) {

        console.error("Logout error:", error);

    }

    window.location.href = "login.html";

});


// ==========================================
// INITIAL LOAD
// ==========================================

loadYears();

setCurrentMonth();

loadReport();