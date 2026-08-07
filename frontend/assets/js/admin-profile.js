// Admin Profile page

const profileForm =
    document.getElementById('profileForm');

const passwordForm =
    document.getElementById('passwordForm');

const adminNameInput =
    document.getElementById('adminName');

const adminEmailInput =
    document.getElementById('adminEmail');

const adminLevelInput =
    document.getElementById('adminLevel');

const saveProfileButton =
    document.getElementById('saveProfileButton');

const currentPasswordInput =
    document.getElementById('currentPassword');

const newPasswordInput =
    document.getElementById('newPassword');

const confirmPasswordInput =
    document.getElementById('confirmPassword');

const changePasswordButton =
    document.getElementById('changePasswordButton');

// Check Admin access
function checkAdminAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'ADMIN') {
        showPopup(
            'Access Denied',
            'Only Administrators can view this page.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Update profile summary
function updateProfileSummary(profile) {
    const name =
        profile.name || 'Administrator';

    const email =
        profile.email || 'Not available';

    const adminLevel =
        profile.admin_level || 'ADMIN';

    document.getElementById(
        'profileName'
    ).textContent = name;

    document.getElementById(
        'profileEmail'
    ).textContent = email;

    document.getElementById(
        'profileLevel'
    ).textContent =
        `Admin Level: ${adminLevel}`;

    document.getElementById(
        'profileInitial'
    ).textContent =
        name.charAt(0).toUpperCase();

    adminNameInput.value = name;
    adminEmailInput.value = email;
    adminLevelInput.value = adminLevel;
}

// Load Admin profile
async function loadAdminProfile() {
    try {
        const response = await fetch(
            '/api/auth/profile',
            {
                method: 'GET',

                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Unable to load profile'
            );
        }

        const profile =
            data.profile ||
            data.user ||
            data.data ||
            data;

        updateProfileSummary(profile);

    } catch (error) {
        console.log(error);

        showPopup(
            'Profile Error',
            error.message,
            'danger'
        );
    }
}

// Update profile
profileForm.addEventListener(
    'submit',
    async function (event) {
        event.preventDefault();

        const name =
            adminNameInput.value.trim();

        const email =
            adminEmailInput.value.trim();

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (name.length < 3) {
            showPopup(
                'Validation Error',
                'Name must contain at least 3 characters.',
                'warning'
            );

            return;
        }

        if (!emailPattern.test(email)) {
            showPopup(
                'Validation Error',
                'Enter a valid email address.',
                'warning'
            );

            return;
        }

        saveProfileButton.disabled = true;
        saveProfileButton.textContent =
            'Saving...';

        try {
            const response = await fetch(
                '/api/auth/profile',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        admin_level:
                            adminLevelInput.value
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Update Failed',
                    data.message ||
                        'Unable to update profile.',
                    'danger'
                );

                return;
            }

            const storedUser = getUser();

            storedUser.name = name;
            storedUser.email = email;

            localStorage.setItem(
                'user',
                JSON.stringify(storedUser)
            );

            updateProfileSummary({
                name: name,
                email: email,
                admin_level:
                    adminLevelInput.value
            });

            showPopup(
                'Profile Updated',
                'Your profile was updated successfully.',
                'success'
            );

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );

        } finally {
            saveProfileButton.disabled = false;
            saveProfileButton.textContent =
                'Save Profile';
        }
    }
);

// Change password
passwordForm.addEventListener(
    'submit',
    async function (event) {
        event.preventDefault();

        const currentPassword =
            currentPasswordInput.value;

        const newPassword =
            newPasswordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;

        const hasUppercase = /[A-Z]/.test(newPassword);

        const hasNumber = /[0-9]/.test(newPassword);

        const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

        if (newPassword.length < 8 || !hasUppercase || !hasNumber || !hasSymbol) {
            showPopup(
                'Validation Error',
                'Password must contain at least 8 characters, one uppercase letter, one number and one symbol.',
                'warning'
            );

            return;
        }

        if (newPassword !== confirmPassword) {
            showPopup(
                'Password Mismatch',
                'New password and confirmation do not match.',
                'warning'
            );

            return;
        }

        if (currentPassword === newPassword) {
            showPopup(
                'Validation Error',
                'New password must be different from the current password.',
                'warning'
            );

            return;
        }

        changePasswordButton.disabled = true;
        changePasswordButton.textContent =
            'Changing...';

        try {
            const response = await fetch(
                '/api/auth/change-password',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        current_password:
                            currentPassword,

                        new_password:
                            newPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Password Change Failed',
                    data.message ||
                        'Unable to change password.',
                    'danger'
                );

                return;
            }

            passwordForm.reset();

            showPopup(
                'Password Changed',
                'Your password was changed successfully.',
                'success'
            );

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );

        } finally {
            changePasswordButton.disabled = false;
            changePasswordButton.textContent =
                'Change Password';
        }
    }
);

// Password visibility buttons
document.querySelectorAll(
    '.password-toggle'
).forEach(function (button) {
    button.addEventListener(
        'click',
        function () {
            const targetId =
                button.dataset.target;

            const input =
                document.getElementById(targetId);

            const image =
                button.querySelector('img');

            if (input.type === 'password') {
                input.type = 'text';

                image.src =
                    'assets/images/eye-closed.png';

                image.alt =
                    'Hide password';

            } else {
                input.type = 'password';

                image.src =
                    'assets/images/eye-open.png';

                image.alt =
                    'Show password';
            }
        }
    );
});

// Start page
if (checkAdminAccess()) {
    loadAdminProfile();
}
