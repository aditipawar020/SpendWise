// ===============================
// ADMIN TRANSACTIONS
// ===============================


// ===============================
// LOAD TRANSACTIONS
// ===============================

async function loadTransactions() {

    const tableBody =
        document.getElementById("transactionsTableBody");


    tableBody.innerHTML = `
        <tr>
            <td colspan="10">
                Loading transactions...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch("/api/admin/transactions");


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            window.location.href =
                "login.html";

            return;
        }


        if (
            !data.transactions ||
            data.transactions.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10"
                        class="empty-message">
                        No transactions found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        data.transactions.forEach(transaction => {

            const row =
                document.createElement("tr");


            const typeClass =
                transaction.type === "Income"
                    ? "income"
                    : "expense";


            const amountClass =
                transaction.type === "Income"
                    ? "amount-income"
                    : "amount-expense";


            const sign =
                transaction.type === "Income"
                    ? "+"
                    : "-";


            row.innerHTML = `

                <td>
                    ${transaction.transaction_id}
                </td>

                <td>
                    ${transaction.user_name}
                </td>

                <td>
                    ${transaction.user_email}
                </td>

                <td>

                    <span class="type ${typeClass}">
                        ${transaction.type}
                    </span>

                </td>

                <td class="${amountClass}">
                    ${sign} ₹${Number(transaction.amount).toFixed(2)}
                </td>

                <td>
                    ${transaction.category}
                </td>

                <td>
                    ${transaction.payment_method}
                </td>

                <td>
                    ${transaction.transaction_date}
                </td>

                <td>
                    ${transaction.source || "Manual"}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${transaction.transaction_id})">

                        Delete

                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Load admin transactions error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    Unable to load transactions.
                </td>
            </tr>
        `;

    }

}


// ===============================
// DELETE TRANSACTION
// ===============================

async function deleteTransaction(
    transactionId
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this transaction?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/transactions/${transactionId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        alert(data.message);


        loadTransactions();


    } catch (error) {

        console.error(
            "Delete transaction error:",
            error
        );


        alert(
            "Unable to delete transaction."
        );

    }

}


// ===============================
// REFRESH
// ===============================

const refreshBtn =
    document.getElementById("refreshBtn");


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadTransactions
    );

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
// LOAD WHEN PAGE OPENS
// ===============================

loadTransactions();