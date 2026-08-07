// Supplier Profile page

const loadingArea = document.getElementById('loadingArea');
const profileContent = document.getElementById('profileContent');
const pageMessage = document.getElementById('pageMessage');

const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const companyNameInput = document.getElementById('company_name');
const businessRegInput = document.getElementById('business_reg_no');
const taxIdInput = document.getElementById('tax_id');

const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const saveProfileButton = document.getElementById('saveProfileButton');
const changePasswordButton = document.getElementById('changePasswordButton');

// Show field error
function showError(input, errorId, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    document.getElementById(errorId).textContent = message;
}

// Show valid field
function showValid(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    document.getElementById(errorId).textContent = '';
}

// Validate required text field
function validateRequired(input, errorId, fieldName, minimumLength = 2) {
    const value = input.value.trim();

    if (value.length < minimumLength) {
        showError(
            input,
            errorId,
            `${fieldName} is required.`
        );

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
        showError(
            emailInput,
            'emailError',
            'Enter a valid email address.'
        );

        return false;
    }

    showValid(emailInput, 'emailError');
    return true;
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

// Change rule colour
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

// Validate confirm password
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

// Setup eye buttons
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

// Display profile data
function displayProfile(profile) {
    const name = profile.name || '';
    const email = profile.email || '';
    const companyName = profile.company_name || '';
    const businessRegNo = profile.business_reg_no || '';
    const taxId = profile.tax_id || '';

    nameInput.value = name;
    emailInput.value = email;
    companyNameInput.value = companyName;
    businessRegInput.value = businessRegNo;
    taxIdInput.value = taxId;

    document.getElementById('profileAvatar').textContent =
        name ? name.charAt(0).toUpperCase() : 'S';

    document.getElementById('profileName').textContent =
        name || 'Supplier';

    document.getElementById('profileCompany').textContent =
        companyName || 'Company details unavailable';

    document.getElementById('profileEmail').textContent =
        email;

    document.getElementById('summaryBusinessReg').textContent =
        businessRegNo || '-';

    document.getElementById('summaryTaxId').textContent =
        taxId || '-';

    loadingArea.classList.add('d-none');
    profileContent.classList.remove('d-none');
}

// Read profile from API response
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

// Check Supplier access
function checkSupplierAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'SUPPLIER') {
        showPopup(
            'Access Denied',
            'Only Suppliers can view this page.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Load profile
async function loadProfile() {
    const savedUser = getUser();

    // Show basic information immediately
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
            throw new Error(
                data.message || 'Unable to load full profile'
            );
        }

        const profile = getProfileFromResponse(data);
        displayProfile(profile);

    } catch (error) {
        pageMessage.innerHTML = `
            <div class="alert alert-warning">
                Basic profile loaded. Company information could not be loaded.
            </div>
        `;
    }
}

// Save profile changes
profileForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nameValid = validateRequired(
        nameInput,
        'nameError',
        'Full name',
        3
    );

    const emailValid = validateEmail();

    const companyValid = validateRequired(
        companyNameInput,
        'companyNameError',
        'Company name',
        3
    );

    const businessValid = validateRequired(
        businessRegInput,
        'businessRegError',
        'Business registration number'
    );

    const taxValid = validateRequired(
        taxIdInput,
        'taxIdError',
        'Tax ID'
    );

    if (
        !nameValid ||
        !emailValid ||
        !companyValid ||
        !businessValid ||
        !taxValid
    ) {
        return;
    }

    saveProfileButton.disabled = true;
    saveProfileButton.textContent = 'Saving...';

    const profileData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        company_name: companyNameInput.value.trim(),
        business_reg_no: businessRegInput.value.trim(),
        tax_id: taxIdInput.value.trim()
    };

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

        const savedUser = getUser();

        savedUser.name = profileData.name;
        savedUser.email = profileData.email;

        localStorage.setItem('user', JSON.stringify(savedUser));

        displayProfile(profileData);

        showPopup(
            'Profile Updated',
            'Your profile was updated successfully.',
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
    validateRequired(nameInput, 'nameError', 'Full name', 3);
});

emailInput.addEventListener('input', validateEmail);

companyNameInput.addEventListener('input', function () {
    validateRequired(
        companyNameInput,
        'companyNameError',
        'Company name',
        3
    );
});

businessRegInput.addEventListener('input', function () {
    validateRequired(
        businessRegInput,
        'businessRegError',
        'Business registration number'
    );
});

taxIdInput.addEventListener('input', function () {
    validateRequired(
        taxIdInput,
        'taxIdError',
        'Tax ID'
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

if (checkSupplierAccess()) {
    loadProfile();
}
