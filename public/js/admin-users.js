// ===============================
// ADMIN USERS
// ===============================


// ===============================
// LOAD USERS
// ===============================

async function loadUsers() {

    const tableBody =
        document.getElementById("usersTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Loading users...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch("/api/admin/users");

        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            window.location.href =
                "login.html";

            return;
        }


        if (
            !data.users ||
            data.users.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="empty-message">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        data.users.forEach(user => {

            const row =
                document.createElement("tr");


            let actions = "";


            if (user.status === "Pending") {

                actions = `
                    <button
                        class="action-btn approve-btn"
                        onclick="updateUserStatus(${user.user_id}, 'Approved')">
                        Approve
                    </button>

                    <button
                        class="action-btn reject-btn"
                        onclick="updateUserStatus(${user.user_id}, 'Rejected')">
                        Reject
                    </button>
                `;

            }


            else if (user.status === "Approved") {

                actions = `
                    <button
                        class="action-btn deactivate-btn"
                        onclick="updateUserStatus(${user.user_id}, 'Deactivated')">
                        Deactivate
                    </button>
                `;

            }


            else if (
                user.status === "Rejected" ||
                user.status === "Deactivated"
            ) {

                actions = `
                    <button
                        class="action-btn activate-btn"
                        onclick="updateUserStatus(${user.user_id}, 'Approved')">
                        Activate
                    </button>
                `;

            }


            row.innerHTML = `

                <td>
                    ${user.user_id}
                </td>

                <td>
                    ${user.name}
                </td>

                <td>
                    ${user.email}
                </td>

                <td>
                    ${user.user_type}
                </td>

                <td>

                    <span class="status ${user.status.toLowerCase()}">
                        ${user.status}
                    </span>

                </td>

                <td>
                    ${actions}
                </td>

            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load users.
                </td>
            </tr>
        `;

    }

}


// ===============================
// UPDATE USER STATUS
// ===============================

async function updateUserStatus(
    userId,
    status
) {

    const confirmAction =
        confirm(
            `Are you sure you want to set this user as ${status}?`
        );


    if (!confirmAction) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/users/${userId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: status
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        alert(data.message);


        loadUsers();


    } catch (error) {

        console.error(
            "Update user error:",
            error
        );

        alert(
            "Unable to update user."
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
        loadUsers
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
// LOAD USERS WHEN PAGE OPENS
// ===============================

loadUsers();