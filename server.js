const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "spendwise-secret-key",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "public")));


// =====================================================
// LOGIN USER
// =====================================================

app.post("/api/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter email and password."
        });
    }

    try {

        const [users] = await db.promise().execute(
            `SELECT
                user_id,
                name,
                email,
                password,
                role,
                user_type,
                status
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (user.status !== "Approved") {

            let message = "Your account cannot login.";

            if (user.status === "Pending") {
                message = "Your account is waiting for admin approval.";
            }

            if (user.status === "Rejected") {
                message = "Your account has been rejected by admin.";
            }

            if (user.status === "Deactivated") {
                message = "Your account has been deactivated.";
            }

            return res.status(403).json({
                success: false,
                message: message
            });
        }

        // CREATE SESSION

        req.session.userId = user.user_id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;
        req.session.userType = user.user_type;

        // ADMIN LOGIN

        if (user.role === "Admin") {

            return res.json({
                success: true,
                message: "Admin login successful!",
                redirect: "admin-dashboard.html",
                user: {
                    id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // USER LOGIN

        res.json({
            success: true,
            message: "Login successful!",
            redirect: "dashboard.html",
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.user_type
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error. Login failed."
        });
    }
});


// =====================================================
// CHECK LOGIN SESSION
// =====================================================

app.get("/api/session", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            loggedIn: false
        });
    }

    res.json({
        loggedIn: true,
        user: {
            id: req.session.userId,
            name: req.session.userName,
            email: req.session.userEmail,
            role: req.session.userRole,
            userType: req.session.userType
        }
    });
});


// =====================================================
// REGISTER USER
// =====================================================

app.post("/api/register", async (req, res) => {

    console.log("Registration request received");
    console.log(req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields."
        });
    }

    try {

        const [existingUser] = await db.promise().execute(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.json({
            success: true,
            message: "Registration successful!"
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Server error. Registration failed."
        });
    }
});


// =====================================================
// DASHBOARD DATA
// =====================================================

// =====================================================
// DASHBOARD API
// =====================================================

app.get("/api/dashboard", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const userId = req.session.userId;


        // ==========================================
        // MONTHLY INCOME AND EXPENSES
        // ==========================================

        const [summaryRows] = await db.promise().execute(
            `SELECT
                COALESCE(SUM(CASE
                    WHEN type = 'Income' THEN amount
                    ELSE 0
                END), 0) AS totalIncome,

                COALESCE(SUM(CASE
                    WHEN type = 'Expense' THEN amount
                    ELSE 0
                END), 0) AS totalExpenses

             FROM transactions

             WHERE user_id = ?
             AND MONTH(transaction_date) = MONTH(CURDATE())
             AND YEAR(transaction_date) = YEAR(CURDATE())`,
            [userId]
        );


        const totalIncome =
            Number(summaryRows[0].totalIncome || 0);

        const totalExpenses =
            Number(summaryRows[0].totalExpenses || 0);


        // ==========================================
        // RECENT TRANSACTIONS
        // ==========================================

        const [recentTransactions] =
            await db.promise().execute(
                `SELECT
                    transaction_id,
                    type,
                    amount,
                    category,
                    description,
                    transaction_date,
                    payment_method

                 FROM transactions

                 WHERE user_id = ?

                 ORDER BY transaction_date DESC,
                          transaction_id DESC

                 LIMIT 5`,
                [userId]
            );


        // ==========================================
        // EXPENSES BY CATEGORY
        // ==========================================

        const [categoryExpenses] =
            await db.promise().execute(
                `SELECT
                    category,
                    SUM(amount) AS total

                 FROM transactions

                 WHERE user_id = ?
                 AND type = 'Expense'
                 AND MONTH(transaction_date) = MONTH(CURDATE())
                 AND YEAR(transaction_date) = YEAR(CURDATE())

                 GROUP BY category

                 ORDER BY total DESC`,
                [userId]
            );


        // ==========================================
// MONTHLY BUDGET
// ==========================================

const [budgetRows] =
    await db.promise().execute(
        `SELECT
            monthly_limit

         FROM budgets

         WHERE user_id = ?
         AND month = MONTH(CURDATE())
         AND year = YEAR(CURDATE())

         ORDER BY budget_id DESC

         LIMIT 1`,
        [userId]
    );


let budget = null;

if (budgetRows.length > 0) {

    budget = {
        amount: Number(budgetRows[0].monthly_limit)
    };

}


        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({

            success: true,

            user: {
                name: req.session.userName
            },

            totalIncome: totalIncome,

            totalExpenses: totalExpenses,

            totalSavings:
                totalIncome - totalExpenses,

            recentTransactions:
                recentTransactions,

            categoryExpenses:
                categoryExpenses,

            budget:
                budget

        });


    } catch (error) {

        console.error(
            "Dashboard API error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to load dashboard data."

        });

    }

});

// =====================================================
// TRANSACTION APIs
// =====================================================

// ADD TRANSACTION

app.post("/api/transactions", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const {
        type,
        amount,
        category,
        description,
        paymentMethod,
        transactionDate
    } = req.body;

    if (!type || !amount || !category || !paymentMethod || !transactionDate) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    if (type !== "Income" && type !== "Expense") {
        return res.status(400).json({
            success: false,
            message: "Invalid transaction type."
        });
    }

    try {

        await db.promise().execute(
            `INSERT INTO transactions
            (user_id, type, amount, category, description,
             payment_method, transaction_date, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Manual')`,
            [
                req.session.userId,
                type,
                amount,
                category,
                description || null,
                paymentMethod,
                transactionDate
            ]
        );

        res.json({
            success: true,
            message: "Transaction added successfully!"
        });

    } catch (error) {

        console.error("Transaction insert error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add transaction."
        });
    }
});


// GET TRANSACTIONS

app.get("/api/transactions", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const [transactions] = await db.promise().execute(
            `SELECT
                transaction_id,
                type,
                amount,
                category,
                description,
                payment_method,
                transaction_date,
                source
             FROM transactions
             WHERE user_id = ?
             ORDER BY transaction_date DESC, transaction_id DESC`,
            [req.session.userId]
        );

        res.json({
            success: true,
            transactions: transactions
        });

    } catch (error) {

        console.error("Transaction fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load transactions."
        });
    }
});


// UPDATE USER TRANSACTION

app.put("/api/transactions/:transactionId", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const transactionId = req.params.transactionId;

    const {
        type,
        amount,
        category,
        description,
        paymentMethod,
        transactionDate
    } = req.body;

    if (
        !type ||
        !amount ||
        !category ||
        !paymentMethod ||
        !transactionDate
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }

    if (type !== "Income" && type !== "Expense") {
        return res.status(400).json({
            success: false,
            message: "Invalid transaction type."
        });
    }

    try {

        const [transaction] = await db.promise().execute(
            `SELECT transaction_id
             FROM transactions
             WHERE transaction_id = ?
             AND user_id = ?`,
            [
                transactionId,
                req.session.userId
            ]
        );

        if (transaction.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        await db.promise().execute(
            `UPDATE transactions
             SET
                type = ?,
                amount = ?,
                category = ?,
                description = ?,
                payment_method = ?,
                transaction_date = ?
             WHERE transaction_id = ?
             AND user_id = ?`,
            [
                type,
                amount,
                category,
                description || null,
                paymentMethod,
                transactionDate,
                transactionId,
                req.session.userId
            ]
        );

        res.json({
            success: true,
            message: "Transaction updated successfully!"
        });

    } catch (error) {

        console.error("Transaction update error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update transaction."
        });
    }
});


// DELETE USER TRANSACTION

app.delete("/api/transactions/:transactionId", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const transactionId = req.params.transactionId;

    try {

        const [transaction] = await db.promise().execute(
            `SELECT transaction_id
             FROM transactions
             WHERE transaction_id = ?
             AND user_id = ?`,
            [
                transactionId,
                req.session.userId
            ]
        );

        if (transaction.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        await db.promise().execute(
            `DELETE FROM transactions
             WHERE transaction_id = ?
             AND user_id = ?`,
            [
                transactionId,
                req.session.userId
            ]
        );

        res.json({
            success: true,
            message: "Transaction deleted successfully."
        });

    } catch (error) {

        console.error("Transaction delete error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete transaction."
        });
    }
});


// =====================================================
// LOGOUT
// =====================================================

app.post("/api/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.error("Logout error:", err);

            return res.status(500).json({
                success: false,
                message: "Logout failed."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logout successful."
        });
    });
});


// =====================================================
// BUDGET API
// =====================================================

// SAVE / UPDATE BUDGET

app.post("/api/budget", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const {
        monthlyLimit,
        month,
        year
    } = req.body;

    if (!monthlyLimit || !month || !year) {
        return res.status(400).json({
            success: false,
            message: "Please fill all budget fields."
        });
    }

    try {

        await db.promise().execute(
            `INSERT INTO budgets
            (user_id, monthly_limit, month, year)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            monthly_limit = VALUES(monthly_limit)`,
            [
                req.session.userId,
                monthlyLimit,
                month,
                year
            ]
        );

        res.json({
            success: true,
            message: "Budget saved successfully!"
        });

    } catch (error) {

        console.error("Budget save error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save budget."
        });
    }
});


// GET BUDGET

app.get("/api/budget", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const [budgets] = await db.promise().execute(
            `SELECT
                budget_id,
                monthly_limit,
                month,
                year
             FROM budgets
             WHERE user_id = ?
             ORDER BY year DESC, month DESC
             LIMIT 1`,
            [req.session.userId]
        );

        if (budgets.length === 0) {
            return res.json({
                success: true,
                budget: null
            });
        }

        res.json({
            success: true,
            budget: budgets[0]
        });

    } catch (error) {

        console.error("Budget fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load budget."
        });
    }
});


// =====================================================
// SAVINGS GOALS APIs
// =====================================================

// GET SAVINGS GOALS

app.get("/api/savings-goals", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const [goals] = await db.promise().execute(
            `SELECT
                goal_id,
                goal_name,
                target_amount,
                target_date,
                created_at
             FROM savings_goals
             WHERE user_id = ?
             ORDER BY goal_id DESC`,
            [req.session.userId]
        );

        res.json({
            success: true,
            goals: goals
        });

    } catch (error) {

        console.error("Get savings goals error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load savings goals."
        });
    }
});


// ADD SAVINGS GOAL

app.post("/api/savings-goals", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const {
        goalName,
        targetAmount,
        targetDate
    } = req.body;

    if (!goalName || !targetAmount) {
        return res.status(400).json({
            success: false,
            message: "Please enter goal name and target amount."
        });
    }

    if (Number(targetAmount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Target amount must be greater than 0."
        });
    }

    try {

        await db.promise().execute(
            `INSERT INTO savings_goals
                (user_id, goal_name, target_amount, target_date)
             VALUES (?, ?, ?, ?)`,
            [
                req.session.userId,
                goalName,
                targetAmount,
                targetDate || null
            ]
        );

        res.json({
            success: true,
            message: "Savings goal added successfully!"
        });

    } catch (error) {

        console.error("Add savings goal error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add savings goal."
        });
    }
});


// DELETE SAVINGS GOAL

app.delete("/api/savings-goals/:goalId", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const goalId = req.params.goalId;

    try {

        const [result] = await db.promise().execute(
            `DELETE FROM savings_goals
             WHERE goal_id = ?
             AND user_id = ?`,
            [
                goalId,
                req.session.userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Savings goal not found."
            });
        }

        res.json({
            success: true,
            message: "Savings goal deleted successfully!"
        });

    } catch (error) {

        console.error("Delete savings goal error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete savings goal."
        });
    }
});

// ==========================================
// REPORTS API
// ==========================================

app.get("/api/reports", async (req, res) => {

    if (!req.session.userId) {

        return res.status(401).json({
            success: false,
            message: "Please login first."
        });

    }

    try {

        const userId = req.session.userId;

        const month =
            Number(req.query.month);

        const year =
            Number(req.query.year);

        if (
            !month ||
            month < 1 ||
            month > 12 ||
            !year
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid report period."
            });

        }


        // ==========================================
        // SUMMARY
        // ==========================================

        const [summaryRows] =
            await db.promise().execute(

                `SELECT

                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'Income'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalIncome,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'Expense'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalExpenses

                 FROM transactions

                 WHERE user_id = ?

                 AND MONTH(transaction_date) = ?

                 AND YEAR(transaction_date) = ?`,

                [
                    userId,
                    month,
                    year
                ]

            );


        // ==========================================
        // CATEGORY EXPENSES
        // ==========================================

        const [categoryExpenses] =
            await db.promise().execute(

                `SELECT

                    category,

                    SUM(amount) AS total

                 FROM transactions

                 WHERE user_id = ?

                 AND type = 'Expense'

                 AND MONTH(transaction_date) = ?

                 AND YEAR(transaction_date) = ?

                 GROUP BY category

                 ORDER BY total DESC`,

                [
                    userId,
                    month,
                    year
                ]

            );


        // ==========================================
        // TRANSACTIONS
        // ==========================================

        const [transactions] =
            await db.promise().execute(

                `SELECT

                    transaction_id,
                    type,
                    amount,
                    category,
                    description,
                    transaction_date,
                    payment_method

                 FROM transactions

                 WHERE user_id = ?

                 AND MONTH(transaction_date) = ?

                 AND YEAR(transaction_date) = ?

                 ORDER BY transaction_date DESC,
                          transaction_id DESC`,

                [
                    userId,
                    month,
                    year
                ]

            );


        const totalIncome =
            Number(summaryRows[0].totalIncome || 0);

        const totalExpenses =
            Number(summaryRows[0].totalExpenses || 0);


        res.json({

            success: true,

            totalIncome: totalIncome,

            totalExpenses: totalExpenses,

            totalSavings:
                totalIncome - totalExpenses,

            categoryExpenses:
                categoryExpenses,

            transactions:
                transactions

        });


    } catch (error) {

        console.error(
            "Reports API error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to load report data."

        });

    }

});

// =====================================================
// ADMIN USERS API
// =====================================================

// GET ALL USERS

app.get("/api/admin/users", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const [adminCheck] = await db.promise().execute(
            `SELECT role
             FROM users
             WHERE user_id = ?`,
            [req.session.userId]
        );

        if (
            adminCheck.length === 0 ||
            adminCheck[0].role !== "Admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const [users] = await db.promise().execute(
            `SELECT
                user_id,
                name,
                email,
                user_type,
                status,
                created_at
             FROM users
             WHERE role != 'Admin'
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users: users
        });

    } catch (error) {

        console.error("Admin users error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load users."
        });
    }
});


// UPDATE USER STATUS

app.put("/api/admin/users/:userId/status", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const { status } = req.body;
    const userId = req.params.userId;

    const allowedStatuses = [
        "Approved",
        "Rejected",
        "Deactivated"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user status."
        });
    }

    try {

        const [adminCheck] = await db.promise().execute(
            `SELECT role
             FROM users
             WHERE user_id = ?`,
            [req.session.userId]
        );

        if (
            adminCheck.length === 0 ||
            adminCheck[0].role !== "Admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const [targetUser] = await db.promise().execute(
            `SELECT role
             FROM users
             WHERE user_id = ?`,
            [userId]
        );

        if (targetUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (targetUser[0].role === "Admin") {
            return res.status(403).json({
                success: false,
                message: "Admin account cannot be changed here."
            });
        }

        await db.promise().execute(
            `UPDATE users
             SET status = ?
             WHERE user_id = ?`,
            [
                status,
                userId
            ]
        );

        res.json({
            success: true,
            message: `User status changed to ${status}.`
        });

    } catch (error) {

        console.error("User status update error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update user status."
        });
    }
});


// =====================================================
// ADMIN TRANSACTIONS API
// =====================================================

// GET ALL TRANSACTIONS

app.get("/api/admin/transactions", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const [adminCheck] = await db.promise().execute(
            `SELECT role
             FROM users
             WHERE user_id = ?`,
            [req.session.userId]
        );

        if (
            adminCheck.length === 0 ||
            adminCheck[0].role !== "Admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const [transactions] = await db.promise().execute(
            `SELECT
                t.transaction_id,
                t.type,
                t.amount,
                t.category,
                t.payment_method,
                t.transaction_date,
                t.source,
                u.name AS user_name,
                u.email AS user_email

             FROM transactions t

             INNER JOIN users u
             ON t.user_id = u.user_id

             ORDER BY
                t.transaction_date DESC,
                t.transaction_id DESC`
        );

        res.json({
            success: true,
            transactions: transactions
        });

    } catch (error) {

        console.error("Admin transactions error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load transactions."
        });
    }
});


// DELETE ADMIN TRANSACTION

app.delete("/api/admin/transactions/:transactionId", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const transactionId = req.params.transactionId;

    try {

        const [adminCheck] = await db.promise().execute(
            `SELECT role
             FROM users
             WHERE user_id = ?`,
            [req.session.userId]
        );

        if (
            adminCheck.length === 0 ||
            adminCheck[0].role !== "Admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const [transactionCheck] = await db.promise().execute(
            `SELECT transaction_id
             FROM transactions
             WHERE transaction_id = ?`,
            [transactionId]
        );

        if (transactionCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        await db.promise().execute(
            `DELETE FROM transactions
             WHERE transaction_id = ?`,
            [transactionId]
        );

        res.json({
            success: true,
            message: "Transaction deleted successfully."
        });

    } catch (error) {

        console.error("Admin transaction delete error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete transaction."
        });
    }
});


// =====================================================
// ADMIN DASHBOARD API
// =====================================================

app.get("/api/admin/dashboard", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const [users] = await db.promise().execute(
            `SELECT role
             FROM users
             WHERE user_id = ?`,
            [req.session.userId]
        );

        if (
            users.length === 0 ||
            users[0].role !== "Admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const [totalUsersResult] =
            await db.promise().execute(
                `SELECT COUNT(*) AS totalUsers
                 FROM users
                 WHERE role != 'Admin'`
            );

        const [pendingUsersResult] =
            await db.promise().execute(
                `SELECT COUNT(*) AS pendingUsers
                 FROM users
                 WHERE role != 'Admin'
                 AND status = 'Pending'`
            );

        const [totalTransactionsResult] =
            await db.promise().execute(
                `SELECT COUNT(*) AS totalTransactions
                 FROM transactions`
            );

        const [totalExpensesResult] =
            await db.promise().execute(
                `SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'Expense'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalExpenses
                 FROM transactions`
            );

        res.json({

            success: true,

            totalUsers:
                totalUsersResult[0].totalUsers,

            pendingUsers:
                pendingUsersResult[0].pendingUsers,

            totalTransactions:
                totalTransactionsResult[0].totalTransactions,

            totalExpenses:
                totalExpensesResult[0].totalExpenses
        });

    } catch (error) {

        console.error("Admin dashboard error:", error);

        res.status(500).json({

            success: false,

            message:
                "Unable to load admin dashboard."
        });
    }
});


// =====================================================
// START SERVER
// =====================================================
// ==========================================
// PROFILE API
// ==========================================

app.get("/api/profile", async (req, res) => {

    if (!req.session.userId) {

        return res.status(401).json({
            success: false,
            message: "Please login first."
        });

    }

    try {

        const [rows] =
            await db.promise().execute(

                `SELECT
                    user_id,
                    name,
                    email,
                    user_type,
                    status,
                    created_at

                 FROM users

                 WHERE user_id = ?`,

                [req.session.userId]

            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        res.json({

            success: true,

            user: rows[0]

        });


    } catch (error) {

        console.error(
            "Profile API error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to load profile."

        });

    }

});

// ==========================================
// UPDATE PROFILE API
// ==========================================

app.put("/api/profile", async (req, res) => {

    if (!req.session.userId) {

        return res.status(401).json({
            success: false,
            message: "Please login first."
        });

    }

    try {

        const {
            name,
            email,
            userType
        } = req.body;


        if (!name || !email || !userType) {

            return res.status(400).json({

                success: false,

                message:
                    "All profile fields are required."

            });

        }


        const [existingUser] =
            await db.promise().execute(

                `SELECT user_id

                 FROM users

                 WHERE email = ?

                 AND user_id != ?`,

                [
                    email,
                    req.session.userId
                ]

            );


        if (existingUser.length > 0) {

            return res.status(400).json({

                success: false,

                message:
                    "This email is already registered."

            });

        }


        await db.promise().execute(

            `UPDATE users

             SET name = ?,
                 email = ?,
                 user_type = ?

             WHERE user_id = ?`,

            [
                name,
                email,
                userType,
                req.session.userId
            ]

        );


        // Update session information too

        req.session.userName =
            name;

        req.session.userEmail =
            email;

        req.session.userType =
            userType;


        res.json({

            success: true,

            message:
                "Profile updated successfully."

        });


    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to update profile."

        });

    }

});

// ==========================================
// CHANGE PASSWORD API
// ==========================================

app.put("/api/change-password", async (req, res) => {

    if (!req.session.userId) {

        return res.status(401).json({
            success: false,
            message: "Please login first."
        });

    }

    try {

        const {
            currentPassword,
            newPassword
        } = req.body;


        if (!currentPassword || !newPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Current and new passwords are required."

            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters."

            });

        }


        const [rows] =
            await db.promise().execute(

                `SELECT password

                 FROM users

                 WHERE user_id = ?`,

                [req.session.userId]

            );


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                currentPassword,
                rows[0].password
            );


        if (!passwordMatch) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        await db.promise().execute(

            `UPDATE users

             SET password = ?

             WHERE user_id = ?`,

            [
                hashedPassword,
                req.session.userId
            ]

        );


        res.json({

            success: true,

            message:
                "Password changed successfully."

        });


    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to change password."

        });

    }

});

app.listen(PORT, () => {
    console.log(
        `SpendWise server running at http://localhost:${PORT}`
    );
});