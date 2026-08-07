// Registration page validation

const registerForm = document.getElementById('registerForm');
const typeSelect = document.getElementById('type');
const supplierFields = document.getElementById('supplierFields');
const authorityFields = document.getElementById('authorityFields');
const registerMessage = document.getElementById('registerMessage');
const registerButton = document.getElementById('registerButton');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

const companyNameInput = document.getElementById('company_name');
const businessRegInput = document.getElementById('business_reg_no');
const taxIdInput = document.getElementById('tax_id');

const organizationNameInput = document.getElementById('organization_name');
const registrationNoInput = document.getElementById('registration_no');
const addressInput = document.getElementById('address');

// Show page message
function showRegisterMessage(message, type) {
    registerMessage.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}

// Show error near an input
function showError(input, errorId, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    document.getElementById(errorId).textContent = message;
}

// Show valid input
function showValid(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    document.getElementById(errorId).textContent = '';
}

// Clear input style
function clearValidation(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.remove('is-valid');
    document.getElementById(errorId).textContent = '';
}

// Validate name
function validateName() {
    const name = nameInput.value.trim();

    if (name.length < 3) {
        showError(
            nameInput,
            'nameError',
            'Full name must contain at least 3 characters.'
        );
        return false;
    }

    showValid(nameInput, 'nameError');
    return true;
}

// Validate email
function validateEmail() {
    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
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

// Check all password rules
function getPasswordRules() {
    const password = passwordInput.value;

    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password)
    };
}

// Change password rule colour
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

// Validate password
function validatePassword() {
    const rules = getPasswordRules();

    updatePasswordRule('ruleLength', rules.length);
    updatePasswordRule('ruleUppercase', rules.uppercase);
    updatePasswordRule('ruleNumber', rules.number);
    updatePasswordRule('ruleSymbol', rules.symbol);

    const isPasswordValid =
        rules.length &&
        rules.uppercase &&
        rules.number &&
        rules.symbol;

    if (!isPasswordValid) {
        showError(
            passwordInput,
            'passwordError',
            'Password does not meet all requirements.'
        );
        return false;
    }

    showValid(passwordInput, 'passwordError');
    return true;
}

// Validate confirm password
function validateConfirmPassword() {
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword.length === 0) {
        showError(
            confirmPasswordInput,
            'confirmPasswordError',
            'Please confirm your password.'
        );
        return false;
    }

    if (confirmPassword !== passwordInput.value) {
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

// Validate account type
function validateType() {
    if (typeSelect.value === '') {
        showError(
            typeSelect,
            'typeError',
            'Please select an account type.'
        );
        return false;
    }

    showValid(typeSelect, 'typeError');
    return true;
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

// Validate supplier fields
function validateSupplierFields() {
    if (typeSelect.value !== 'SUPPLIER') {
        return true;
    }

    const companyValid = validateRequired(
        companyNameInput,
        'companyNameError',
        'Company name',
        3
    );

    const businessRegValid = validateRequired(
        businessRegInput,
        'businessRegError',
        'Business registration number'
    );

    const taxIdValid = validateRequired(
        taxIdInput,
        'taxIdError',
        'Tax ID'
    );

    return companyValid && businessRegValid && taxIdValid;
}

// Validate authority fields
function validateAuthorityFields() {
    if (typeSelect.value !== 'TENDERING_AUTHORITY') {
        return true;
    }

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
        'Address',
        5
    );

    return organizationValid && registrationValid && addressValid;
}

// Show fields according to selected role
function updateRoleFields() {
    supplierFields.classList.remove('show');
    authorityFields.classList.remove('show');

    if (typeSelect.value === 'SUPPLIER') {
        supplierFields.classList.add('show');
    }

    if (typeSelect.value === 'TENDERING_AUTHORITY') {
        authorityFields.classList.add('show');
    }

    clearValidation(companyNameInput, 'companyNameError');
    clearValidation(businessRegInput, 'businessRegError');
    clearValidation(taxIdInput, 'taxIdError');

    clearValidation(organizationNameInput, 'organizationNameError');
    clearValidation(registrationNoInput, 'registrationNoError');
    clearValidation(addressInput, 'addressError');

    validateType();
}

// Password visibility button
function setupPasswordButtons() {
    const buttons = document.querySelectorAll('.password-toggle');

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            const targetId = button.dataset.target;
            const eyeId = button.dataset.eye;

            const input = document.getElementById(targetId);
            const eyeImage = document.getElementById(eyeId);

            if (input.type === 'password') {
                input.type = 'text';
                eyeImage.src = 'assets/images/eye-closed.png';
                eyeImage.alt = 'Hide password';
                button.setAttribute('aria-label', 'Hide password');
            } else {
                input.type = 'password';
                eyeImage.src = 'assets/images/eye-open.png';
                eyeImage.alt = 'Show password';
                button.setAttribute('aria-label', 'Show password');
            }
        });
    });
}

// Validate as user types
nameInput.addEventListener('input', validateName);
emailInput.addEventListener('input', validateEmail);

passwordInput.addEventListener('input', function () {
    validatePassword();

    if (confirmPasswordInput.value.length > 0) {
        validateConfirmPassword();
    }
});

confirmPasswordInput.addEventListener(
    'input',
    validateConfirmPassword
);

typeSelect.addEventListener('change', updateRoleFields);

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
        'Address',
        5
    );
});

// Submit registration form
registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nameValid = validateName();
    const emailValid = validateEmail();
    const passwordValid = validatePassword();
    const confirmPasswordValid = validateConfirmPassword();
    const typeValid = validateType();
    const supplierValid = validateSupplierFields();
    const authorityValid = validateAuthorityFields();

    const formValid =
        nameValid &&
        emailValid &&
        passwordValid &&
        confirmPasswordValid &&
        typeValid &&
        supplierValid &&
        authorityValid;

    if (!formValid) {
        showRegisterMessage(
            'Please correct the highlighted fields.',
            'danger'
        );
        return;
    }

    const userData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        type: typeSelect.value
    };

    if (typeSelect.value === 'SUPPLIER') {
        userData.company_name = companyNameInput.value.trim();
        userData.business_reg_no = businessRegInput.value.trim();
        userData.tax_id = taxIdInput.value.trim();
    }

    if (typeSelect.value === 'TENDERING_AUTHORITY') {
        userData.organization_name = organizationNameInput.value.trim();
        userData.registration_no = registrationNoInput.value.trim();
        userData.address = addressInput.value.trim();
    }

    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';
    registerMessage.innerHTML = '';

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            showRegisterMessage(
                data.message || 'Registration failed.',
                'danger'
            );
            return;
        }

        showPopup(
            'Registration Successful',
            'Your account has been created successfully. You can now login.',
            'success',
            'login.html'
        );

    } catch (error) {
        showRegisterMessage(
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
    }
});

// Start page
setupPasswordButtons();
