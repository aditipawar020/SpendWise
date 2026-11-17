// ===============================
// TRANSACTIONS PAGE
// ===============================

const transactionForm =
    document.getElementById("transactionForm");

const transactionMessage =
    document.getElementById("transactionMessage");

const transactionList =
    document.getElementById("transactionList");

const transactionType =
    document.getElementById("type");

const transactionCategory =
    document.getElementById("category");


// ===============================
// FILTER ELEMENTS
// ===============================

const searchTransaction =
    document.getElementById("searchTransaction");

const filterType =
    document.getElementById("filterType");

const filterCategory =
    document.getElementById("filterCategory");

const filterPayment =
    document.getElementById("filterPayment");

const clearFilters =
    document.getElementById("clearFilters");


// ===============================
// ALL TRANSACTIONS
// ===============================

let allTransactions = [];


// ===============================
// EDITING TRANSACTION
// ===============================

let editingTransactionId = null;


// ===============================
// SET TODAY'S DATE
// ===============================

// ===============================
// SET DATE LIMIT AND TODAY'S DATE
// ===============================

function setTodayDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;

    transactionDate.max = todayString;

    if (!transactionDate.value) {
        transactionDate.value = todayString;
    }
}

setTodayDate();


setTodayDate();

// ===============================
// CATEGORY BASED ON TRANSACTION TYPE
// ===============================

const incomeCategories = [
    "Salary",
    "Freelance",
    "Business",
    "Other Income"
];

const expenseCategories = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Other"
];


function updateCategories() {

    const selectedType =
        transactionType.value;

    transactionCategory.innerHTML = `
        <option value="">
            Select Category
        </option>
    `;


    let categories = [];


    if (selectedType === "Income") {

        categories =
            incomeCategories;

    }


    if (selectedType === "Expense") {

        categories =
            expenseCategories;

    }


    categories.forEach(
        function (category) {

            const option =
                document.createElement("option");

            option.value =
                category;

            option.textContent =
                category;

            transactionCategory.appendChild(
                option
            );

        }
    );

}


transactionType.addEventListener(
    "change",
    updateCategories
);

// ===============================
// ADD / UPDATE TRANSACTION
// ===============================

transactionForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const type =
            document.getElementById("type").value;

        const amount =
            document.getElementById("amount").value;

        const category =
            document.getElementById("category").value;

        const description =
            document.getElementById("description").value;

        const paymentMethod =
            document.getElementById("paymentMethod").value;

        const date =
            document.getElementById("transactionDate").value;

            // Prevent future transaction dates
const today = new Date();

const todayString =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

if (!date || date > todayString) {

    transactionMessage.textContent =
        "Future transaction dates are not allowed.";

    transactionMessage.style.color =
        "#dc2626";

    transactionDate.max = todayString;

    return;
}


        transactionMessage.textContent =
            editingTransactionId
                ? "Updating transaction..."
                : "Saving transaction...";

        transactionMessage.style.color =
            "#2563eb";


        try {

            let response;


            // ===============================
            // UPDATE
            // ===============================

            if (editingTransactionId) {

                response = await fetch(
                    `/api/transactions/${editingTransactionId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            type: type,
                            amount: amount,
                            category: category,
                            description: description,
                            paymentMethod: paymentMethod,
                            transactionDate: date

                        })
                    }
                );

            }


            // ===============================
            // ADD
            // ===============================

            else {

                response = await fetch(
                    "/api/transactions",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            type: type,
                            amount: amount,
                            category: category,
                            description: description,
                            paymentMethod: paymentMethod,
                            transactionDate: date

                        })
                    }
                );

            }


            const data =
                await response.json();


            if (!response.ok) {

                transactionMessage.textContent =
                    data.message;

                transactionMessage.style.color =
                    "#dc2626";

                return;
            }


            transactionMessage.textContent =
                data.message;

            transactionMessage.style.color =
                "#16a34a";


            editingTransactionId =
                null;


            transactionForm.reset();


            setTodayDate();


            const submitButton =
                transactionForm.querySelector(
                    ".submit-btn"
                );


            submitButton.textContent =
                "Add Transaction";


            loadTransactions();


        } catch (error) {

            console.error(
                "Transaction error:",
                error
            );


            transactionMessage.textContent =
                "Unable to connect to the server.";

            transactionMessage.style.color =
                "#dc2626";

        }

    }
);


// ===============================
// LOAD TRANSACTIONS
// ===============================

async function loadTransactions() {

    try {

        const response =
            await fetch("/api/transactions");


        const data =
            await response.json();


        if (!response.ok) {

            transactionList.innerHTML = `
                <p class="empty-message">
                    ${data.message}
                </p>
            `;

            return;
        }


        allTransactions =
            data.transactions || [];


        displayTransactions(
            allTransactions
        );


    } catch (error) {

        console.error(
            "Load transactions error:",
            error
        );


        transactionList.innerHTML = `
            <p class="empty-message">
                Unable to load transactions.
            </p>
        `;

    }

}


// ===============================
// DISPLAY TRANSACTIONS
// ===============================

function displayTransactions(
    transactions
) {

    if (
        !transactions ||
        transactions.length === 0
    ) {

        transactionList.innerHTML = `
            <p class="empty-message">
                No transactions found.
            </p>
        `;

        return;
    }


    transactionList.innerHTML = "";


    transactions.forEach(
        transaction => {

            const transactionItem =
                document.createElement("div");


            transactionItem.className =
                "transaction-item";


            const amountClass =
                transaction.type === "Income"
                    ? "income"
                    : "expense";


            const sign =
                transaction.type === "Income"
                    ? "+"
                    : "-";


            transactionItem.innerHTML = `

                <div>

                    <strong>
                        ${transaction.category}
                    </strong>

                    <p>
                        ${transaction.description ||
                        "No description"}
                    </p>

                    <small>
                        ${transaction.transaction_date}
                        •
                        ${transaction.payment_method}
                    </small>

                </div>


                <div class="transaction-right">

                    <div class="${amountClass}">
                        ${sign}
                        ₹${Number(
                            transaction.amount
                        ).toFixed(2)}
                    </div>


                    <div class="transaction-actions">

                        <button
                            class="edit-btn"
                            onclick="editTransaction(
                                ${transaction.transaction_id}
                            )">

                            Edit

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteTransaction(
                                ${transaction.transaction_id}
                            )">

                            Delete

                        </button>

                    </div>

                </div>

            `;


            transactionList.appendChild(
                transactionItem
            );

        }
    );

}


// ===============================
// APPLY FILTERS
// ===============================

function applyFilters() {

    const searchText =
        searchTransaction.value
            .trim()
            .toLowerCase();


    const selectedType =
        filterType.value;


    const selectedCategory =
        filterCategory.value;


    const selectedPayment =
        filterPayment.value;


    const filteredTransactions =
        allTransactions.filter(
            transaction => {


                // ===============================
                // SEARCH
                // ===============================

                const searchMatch =

                    !searchText ||

                    String(
                        transaction.category
                    )
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    String(
                        transaction.description || ""
                    )
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    String(
                        transaction.payment_method
                    )
                        .toLowerCase()
                        .includes(searchText);


                // ===============================
                // TYPE
                // ===============================

                const typeMatch =
                    selectedType === "all" ||
                    transaction.type === selectedType;


                // ===============================
                // CATEGORY
                // ===============================

                const categoryMatch =
                    selectedCategory === "all" ||
                    transaction.category === selectedCategory;


                // ===============================
                // PAYMENT METHOD
                // ===============================

                const paymentMatch =
                    selectedPayment === "all" ||
                    transaction.payment_method === selectedPayment;


                return (
                    searchMatch &&
                    typeMatch &&
                    categoryMatch &&
                    paymentMatch
                );

            }
        );


    displayTransactions(
        filteredTransactions
    );

}


// ===============================
// FILTER EVENTS
// ===============================

if (searchTransaction) {

    searchTransaction.addEventListener(
        "input",
        applyFilters
    );

}


if (filterType) {

    filterType.addEventListener(
        "change",
        applyFilters
    );

}


if (filterCategory) {

    filterCategory.addEventListener(
        "change",
        applyFilters
    );

}


if (filterPayment) {

    filterPayment.addEventListener(
        "change",
        applyFilters
    );

}


// ===============================
// CLEAR FILTERS
// ===============================

if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        function () {

            searchTransaction.value =
                "";

            filterType.value =
                "all";

            filterCategory.value =
                "all";

            filterPayment.value =
                "all";


            displayTransactions(
                allTransactions
            );

        }
    );

}


// ===============================
// EDIT TRANSACTION
// ===============================

async function editTransaction(
    transactionId
) {

    try {

        const response =
            await fetch("/api/transactions");


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        const transaction =
            data.transactions.find(
                item =>
                    item.transaction_id ===
                    transactionId
            );


        if (!transaction) {

            alert(
                "Transaction not found."
            );

            return;
        }


        document.getElementById("type").value =
    transaction.type;

// Update categories according to transaction type
updateCategories();

document.getElementById("amount").value =
    transaction.amount;

document.getElementById("category").value =
    transaction.category;

        document.getElementById("description").value =
            transaction.description || "";

        document.getElementById("paymentMethod").value =
            transaction.payment_method;

        document.getElementById("transactionDate").value =
            transaction.transaction_date;


        editingTransactionId =
            transactionId;


        const submitButton =
            transactionForm.querySelector(
                ".submit-btn"
            );


        submitButton.textContent =
            "Update Transaction";


        transactionMessage.textContent =
            "Editing transaction...";

        transactionMessage.style.color =
            "#2563eb";


        transactionForm.scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "Edit transaction error:",
            error
        );


        alert(
            "Unable to edit transaction."
        );

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
                `/api/transactions/${transactionId}`,
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


        if (
            editingTransactionId ===
            transactionId
        ) {

            editingTransactionId =
                null;

            transactionForm.reset();

            setTodayDate();


            const submitButton =
                transactionForm.querySelector(
                    ".submit-btn"
                );


            submitButton.textContent =
                "Add Transaction";

        }


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

                window.location.href =
                    "login.html";

            }

        }
    );

}


// ===============================
// LOAD TRANSACTIONS
// ===============================

loadTransactions();