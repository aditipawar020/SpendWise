// ==========================================
// SETTINGS PAGE
// ==========================================

const profileForm =
    document.getElementById("profileForm");

const passwordForm =
    document.getElementById("passwordForm");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileUserType =
    document.getElementById("profileUserType");

const profileStatus =
    document.getElementById("profileStatus");

const profileMessage =
    document.getElementById("profileMessage");

const passwordMessage =
    document.getElementById("passwordMessage");

const accountType =
    document.getElementById("accountType");

const memberSince =
    document.getElementById("memberSince");

const logoutBtn =
    document.getElementById("logoutBtn");


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

    try {

        const response =
            await fetch("/api/profile");

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            console.error(
                data.message || "Unable to load profile."
            );

            return;

        }


        const user = data.user;


        profileName.value =
            user.name || "";

        profileEmail.value =
            user.email || "";

        profileUserType.value =
            user.user_type || "Personal";

        profileStatus.value =
            user.status || "Approved";


        accountType.textContent =
            user.user_type || "Personal";


        if (user.created_at) {

            memberSince.textContent =
                new Date(
                    user.created_at
                ).toLocaleDateString("en-IN");

        } else {

            memberSince.textContent =
                "-";

        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


// ==========================================
// UPDATE PROFILE
// ==========================================

profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        profileMessage.textContent =
            "";

        profileMessage.className =
            "message";


        const name =
            profileName.value.trim();

        const email =
            profileEmail.value.trim();

        const userType =
            profileUserType.value;


        if (!name || !email) {

            profileMessage.textContent =
                "Name and email are required.";

            profileMessage.classList.add(
                "error-message"
            );

            return;

        }


        try {

            const response =
                await fetch("/api/profile", {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        userType: userType
                    })

                });


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                profileMessage.textContent =
                    data.message ||
                    "Unable to update profile.";

                profileMessage.classList.add(
                    "error-message"
                );

                return;

            }


            profileMessage.textContent =
                "Profile updated successfully.";

            profileMessage.classList.add(
                "success-message"
            );


            accountType.textContent =
                userType;


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            profileMessage.textContent =
                "Unable to update profile.";

            profileMessage.classList.add(
                "error-message"
            );

        }

    }
);


// ==========================================
// CHANGE PASSWORD
// ==========================================

passwordForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        passwordMessage.textContent =
            "";

        passwordMessage.className =
            "message";


        const currentPassword =
            document.getElementById(
                "currentPassword"
            ).value;

        const newPassword =
            document.getElementById(
                "newPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        if (newPassword !== confirmPassword) {

            passwordMessage.textContent =
                "New passwords do not match.";

            passwordMessage.classList.add(
                "error-message"
            );

            return;

        }


        if (newPassword.length < 6) {

            passwordMessage.textContent =
                "Password must contain at least 6 characters.";

            passwordMessage.classList.add(
                "error-message"
            );

            return;

        }


        try {

            const response =
                await fetch("/api/change-password", {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        currentPassword:
                            currentPassword,

                        newPassword:
                            newPassword

                    })

                });


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                passwordMessage.textContent =
                    data.message ||
                    "Unable to change password.";

                passwordMessage.classList.add(
                    "error-message"
                );

                return;

            }


            passwordMessage.textContent =
                "Password changed successfully.";

            passwordMessage.classList.add(
                "success-message"
            );


            passwordForm.reset();


        } catch (error) {

            console.error(
                "Password change error:",
                error
            );

            passwordMessage.textContent =
                "Unable to change password.";

            passwordMessage.classList.add(
                "error-message"
            );

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
    "click",
    async function () {

        try {

            await fetch(
                "/api/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

        window.location.href =
            "login.html";

    }
);


// ==========================================
// INITIAL LOAD
// ==========================================

loadProfile();