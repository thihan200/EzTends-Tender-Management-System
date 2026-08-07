// Authority Profile page

const loadingArea = document.getElementById('loadingArea');
const profileContent = document.getElementById('profileContent');
const pageMessage = document.getElementById('pageMessage');

const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const organizationNameInput = document.getElementById('organization_name');
const registrationNoInput = document.getElementById('registration_no');
const addressInput = document.getElementById('address');

const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const saveProfileButton = document.getElementById('saveProfileButton');
const changePasswordButton = document.getElementById('changePasswordButton');

// Show field error
function showError(input, errorId, message) {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    document.getElementById(errorId).textContent = message;
}

// Show valid field
function showValid(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    document.getElementById(errorId).textContent = '';
}

// Validate required field
function validateRequired(input, errorId, fieldName, minimumLength = 2) {
    const value = input.value.trim();

    if (value.length < minimumLength) {
        showError(input, errorId, `${fieldName} is required.`);
        return false;
    }

    showValid(input, errorId);
    return true;
}

// Validate email
function validateEmail() {
    const email = emailInput.value.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(email)) {
        showError(emailInput, 'emailError', 'Enter a valid email address.');
        return false;
    }

    showValid(emailInput, 'emailError');
    return true;
}

// Read profile response
function getProfileFromResponse(data) {
    if (data.user) {
        return data.user;
    }

    if (data.profile) {
        return data.profile;
    }

    if (data.data) {
        return data.data;
    }

    return data;
}

// Check password rules
function getPasswordRules() {
    const password = newPasswordInput.value;

    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password)
    };
}

// Update rule style
function updatePasswordRule(ruleId, isValid) {
    const rule = document.getElementById(ruleId);

    if (isValid) {
        rule.classList.add('rule-valid');
        rule.classList.remove('rule-invalid');
    } else {
        rule.classList.add('rule-invalid');
        rule.classList.remove('rule-valid');
    }
}

// Validate new password
function validateNewPassword() {
    const rules = getPasswordRules();

    updatePasswordRule('ruleLength', rules.length);
    updatePasswordRule('ruleUppercase', rules.uppercase);
    updatePasswordRule('ruleNumber', rules.number);
    updatePasswordRule('ruleSymbol', rules.symbol);

    const valid =
        rules.length &&
        rules.uppercase &&
        rules.number &&
        rules.symbol;

    if (!valid) {
        showError(
            newPasswordInput,
            'newPasswordError',
            'Password does not meet all requirements.'
        );

        return false;
    }

    showValid(newPasswordInput, 'newPasswordError');
    return true;
}

// Validate password confirmation
function validateConfirmPassword() {
    if (!confirmPasswordInput.value) {
        showError(
            confirmPasswordInput,
            'confirmPasswordError',
            'Please confirm the new password.'
        );

        return false;
    }

    if (confirmPasswordInput.value !== newPasswordInput.value) {
        showError(
            confirmPasswordInput,
            'confirmPasswordError',
            'Passwords do not match.'
        );

        return false;
    }

    showValid(confirmPasswordInput, 'confirmPasswordError');
    return true;
}

// Setup password eye buttons
function setupPasswordButtons() {
    const buttons = document.querySelectorAll('.password-toggle');

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            const input = document.getElementById(button.dataset.target);
            const eye = document.getElementById(button.dataset.eye);

            if (input.type === 'password') {
                input.type = 'text';
                eye.src = 'assets/images/eye-closed.png';
                eye.alt = 'Hide password';
            } else {
                input.type = 'password';
                eye.src = 'assets/images/eye-open.png';
                eye.alt = 'Show password';
            }
        });
    });
}

// Check Authority access
function checkAuthorityAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'TENDERING_AUTHORITY') {
        showPopup(
            'Access Denied',
            'Only Tendering Authorities can view this page.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Display profile details
function displayProfile(profile) {
    const name = profile.name || '';
    const email = profile.email || '';
    const organizationName = profile.organization_name || '';
    const registrationNo = profile.registration_no || '';
    const address = profile.address || '';

    nameInput.value = name;
    emailInput.value = email;
    organizationNameInput.value = organizationName;
    registrationNoInput.value = registrationNo;
    addressInput.value = address;

    document.getElementById('profileAvatar').textContent =
        name ? name.charAt(0).toUpperCase() : 'A';

    document.getElementById('profileName').textContent =
        name || 'Tendering Authority';

    document.getElementById('profileOrganization').textContent =
        organizationName || 'Organization details unavailable';

    document.getElementById('profileEmail').textContent = email;
    document.getElementById('summaryRegistrationNo').textContent =
        registrationNo || '-';

    document.getElementById('summaryAddress').textContent =
        address || '-';

    loadingArea.classList.add('d-none');
    profileContent.classList.remove('d-none');
}

// Load profile
async function loadProfile() {
    const savedUser = getUser();

    // Show saved login details first
    displayProfile({
        name: savedUser.name,
        email: savedUser.email
    });

    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load full profile');
        }

        displayProfile(getProfileFromResponse(data));

    } catch (error) {
        pageMessage.innerHTML = `
            <div class="alert alert-warning">
                Basic profile loaded. Organization information could not be loaded.
            </div>
        `;
    }
}

// Save profile
profileForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nameValid = validateRequired(
        nameInput,
        'nameError',
        'Contact name',
        3
    );

    const emailValid = validateEmail();

    const organizationValid = validateRequired(
        organizationNameInput,
        'organizationNameError',
        'Organization name',
        3
    );

    const registrationValid = validateRequired(
        registrationNoInput,
        'registrationNoError',
        'Registration number'
    );

    const addressValid = validateRequired(
        addressInput,
        'addressError',
        'Organization address',
        5
    );

    if (
        !nameValid ||
        !emailValid ||
        !organizationValid ||
        !registrationValid ||
        !addressValid
    ) {
        return;
    }

    const profileData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        organization_name: organizationNameInput.value.trim(),
        registration_no: registrationNoInput.value.trim(),
        address: addressInput.value.trim()
    };

    saveProfileButton.disabled = true;
    saveProfileButton.textContent = 'Saving...';

    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Profile Update Failed',
                data.message || 'Unable to update profile.',
                'danger'
            );

            return;
        }

        // Update saved login data
        const savedUser = getUser();
        savedUser.name = profileData.name;
        savedUser.email = profileData.email;

        localStorage.setItem('user', JSON.stringify(savedUser));

        displayProfile(profileData);

        showPopup(
            'Profile Updated',
            'Your Authority profile was updated successfully.',
            'success'
        );

    } catch (error) {
        showPopup(
            'Server Connection Error',
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = 'Save Profile';
    }
});

// Change password
passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const currentValid = validateRequired(
        currentPasswordInput,
        'currentPasswordError',
        'Current password'
    );

    const newPasswordValid = validateNewPassword();
    const confirmValid = validateConfirmPassword();

    if (!currentValid || !newPasswordValid || !confirmValid) {
        return;
    }

    changePasswordButton.disabled = true;
    changePasswordButton.textContent = 'Changing...';

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                current_password: currentPasswordInput.value,
                new_password: newPasswordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Password Change Failed',
                data.message || 'Unable to change password.',
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
        showPopup(
            'Server Connection Error',
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        changePasswordButton.disabled = false;
        changePasswordButton.textContent = 'Change Password';
    }
});

// Validate while typing
nameInput.addEventListener('input', function () {
    validateRequired(nameInput, 'nameError', 'Contact name', 3);
});

emailInput.addEventListener('input', validateEmail);

organizationNameInput.addEventListener('input', function () {
    validateRequired(
        organizationNameInput,
        'organizationNameError',
        'Organization name',
        3
    );
});

registrationNoInput.addEventListener('input', function () {
    validateRequired(
        registrationNoInput,
        'registrationNoError',
        'Registration number'
    );
});

addressInput.addEventListener('input', function () {
    validateRequired(
        addressInput,
        'addressError',
        'Organization address',
        5
    );
});

newPasswordInput.addEventListener('input', function () {
    validateNewPassword();

    if (confirmPasswordInput.value) {
        validateConfirmPassword();
    }
});

confirmPasswordInput.addEventListener(
    'input',
    validateConfirmPassword
);

// Start page
setupPasswordButtons();

if (checkAuthorityAccess()) {
    loadProfile();
}
