// Create Tender page

const createTenderForm = document.getElementById('createTenderForm');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const categoryInput = document.getElementById('categoryId');
const budgetInput = document.getElementById('budget');
const openDateInput = document.getElementById('openDate');
const closeDateInput = document.getElementById('closeDate');
const statusInput = document.getElementById('status');
const createTenderButton = document.getElementById('createTenderButton');

function showFieldError(input, errorId, message) {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    document.getElementById(errorId).textContent = message;
}

function showFieldValid(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    document.getElementById(errorId).textContent = '';
}

function getCategoryArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.categories)) {
        return data.categories;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function checkAuthorityAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'TENDERING_AUTHORITY') {
        showPopup(
            'Access Denied',
            'Only Tendering Authorities can create tenders.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load categories');
        }

        const categories = getCategoryArray(data);

        categoryInput.innerHTML = '<option value="">Select a category</option>';

        categories.forEach(function (category) {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.category_name;
            categoryInput.appendChild(option);
        });

        if (categories.length === 0) {
            categoryInput.innerHTML = '<option value="">No categories available</option>';
            categoryInput.disabled = true;
            createTenderButton.disabled = true;
        }

    } catch (error) {
        categoryInput.innerHTML = '<option value="">Unable to load categories</option>';
        categoryInput.disabled = true;
        createTenderButton.disabled = true;

        showPopup(
            'Category Loading Failed',
            'Could not load tender categories.',
            'danger'
        );
    }
}

function validateTitle() {
    const title = titleInput.value.trim();

    if (title.length < 5) {
        showFieldError(
            titleInput,
            'titleError',
            'Tender title must contain at least 5 characters.'
        );

        return false;
    }

    showFieldValid(titleInput, 'titleError');
    return true;
}

function validateDescription() {
    const description = descriptionInput.value.trim();
    document.getElementById('descriptionCount').textContent = descriptionInput.value.length;

    if (description.length < 20) {
        showFieldError(
            descriptionInput,
            'descriptionError',
            'Description must contain at least 20 characters.'
        );

        return false;
    }

    showFieldValid(descriptionInput, 'descriptionError');
    return true;
}

function validateCategory() {
    if (!categoryInput.value) {
        showFieldError(
            categoryInput,
            'categoryError',
            'Please select a tender category.'
        );

        return false;
    }

    showFieldValid(categoryInput, 'categoryError');
    return true;
}

function validateBudget() {
    const budget = Number(budgetInput.value);

    if (!budgetInput.value || !Number.isFinite(budget) || budget <= 0) {
        showFieldError(
            budgetInput,
            'budgetError',
            'Enter a valid budget greater than zero.'
        );

        return false;
    }

    showFieldValid(budgetInput, 'budgetError');
    return true;
}

function validateOpenDate() {
    if (!openDateInput.value) {
        showFieldError(
            openDateInput,
            'openDateError',
            'Please select an open date.'
        );

        return false;
    }

    if (openDateInput.value < getTodayDate()) {
        showFieldError(
            openDateInput,
            'openDateError',
            'Open date cannot be in the past.'
        );

        return false;
    }

    showFieldValid(openDateInput, 'openDateError');
    return true;
}

function validateCloseDate() {
    if (!closeDateInput.value) {
        showFieldError(
            closeDateInput,
            'closeDateError',
            'Please select a closing date.'
        );

        return false;
    }

    if (openDateInput.value && closeDateInput.value <= openDateInput.value) {
        showFieldError(
            closeDateInput,
            'closeDateError',
            'Closing date must be after the open date.'
        );

        return false;
    }

    showFieldValid(closeDateInput, 'closeDateError');
    return true;
}

function validateStatus() {
    const allowedStatuses = ['DRAFT', 'OPEN'];

    if (!allowedStatuses.includes(statusInput.value)) {
        showFieldError(
            statusInput,
            'statusError',
            'Select a valid tender status.'
        );

        return false;
    }

    showFieldValid(statusInput, 'statusError');
    return true;
}

function setupDateInputs() {
    const today = getTodayDate();

    openDateInput.min = today;
    closeDateInput.min = today;

    if (!openDateInput.value) {
        openDateInput.value = today;
    }

    openDateInput.addEventListener('change', function () {
        closeDateInput.min = openDateInput.value || today;
        validateOpenDate();

        if (closeDateInput.value) {
            validateCloseDate();
        }
    });
}

createTenderForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const titleValid = validateTitle();
    const descriptionValid = validateDescription();
    const categoryValid = validateCategory();
    const budgetValid = validateBudget();
    const openDateValid = validateOpenDate();
    const closeDateValid = validateCloseDate();
    const statusValid = validateStatus();

    if (
        !titleValid ||
        !descriptionValid ||
        !categoryValid ||
        !budgetValid ||
        !openDateValid ||
        !closeDateValid ||
        !statusValid
    ) {
        return;
    }

    const tenderData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        budget: Number(budgetInput.value),
        open_date: openDateInput.value,
        close_date: closeDateInput.value,
        status: statusInput.value,
        category_id: Number(categoryInput.value)
    };

    createTenderButton.disabled = true;
    createTenderButton.textContent = 'Creating Tender...';

    try {
        const response = await fetch('/api/tenders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify(tenderData)
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Tender Creation Failed',
                data.message || 'Unable to create the tender.',
                'danger'
            );

            return;
        }

        showPopup(
            'Tender Created',
            statusInput.value === 'OPEN'
                ? 'The tender was published successfully.'
                : 'The tender was saved as a draft successfully.',
            'success',
            'my-tenders.html'
        );

    } catch (error) {
        console.log(error);

        showPopup(
            'Server Connection Error',
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        createTenderButton.disabled = false;
        createTenderButton.textContent = 'Create Tender';
    }
});

titleInput.addEventListener('input', validateTitle);
descriptionInput.addEventListener('input', validateDescription);
categoryInput.addEventListener('change', validateCategory);
budgetInput.addEventListener('input', validateBudget);
closeDateInput.addEventListener('change', validateCloseDate);
statusInput.addEventListener('change', validateStatus);

if (checkAuthorityAccess()) {
    setupDateInputs();
    loadCategories();
}
