// Edit Tender page

const editTenderForm = document.getElementById('editTenderForm');
const loadingCard = document.getElementById('loadingCard');
const editContent = document.getElementById('editContent');

const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const categoryInput = document.getElementById('categoryId');
const budgetInput = document.getElementById('budget');
const openDateInput = document.getElementById('openDate');
const closeDateInput = document.getElementById('closeDate');
const statusInput = document.getElementById('status');
const saveTenderButton = document.getElementById('saveTenderButton');

const tenderIdFromUrl = new URLSearchParams(
    window.location.search
).get('id');

let currentTender = null;

// Show field error
function showFieldError(input, errorId, message) {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    document.getElementById(errorId).textContent = message;
}

// Show valid field
function showFieldValid(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    document.getElementById(errorId).textContent = '';
}

// Read category list
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

// Read tender object
function getTenderFromResponse(data) {
    if (data.tender) {
        return data.tender;
    }

    if (data.data) {
        return data.data;
    }

    return data;
}

// Format date for input
function formatInputDate(dateValue) {
    if (!dateValue) {
        return '';
    }

    return String(dateValue).split('T')[0];
}

// Format date for display
function formatDisplayDate(dateValue) {
    if (!dateValue) {
        return 'Not available';
    }

    const datePart = formatInputDate(dateValue);
    const parts = datePart.split('-');

    if (parts.length !== 3) {
        return dateValue;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Get today's local date
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
            'Only Tendering Authorities can edit tenders.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Load categories
async function loadCategories() {
    const response = await fetch('/api/categories');
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to load categories');
    }

    const categories = getCategoryArray(data);

    categoryInput.innerHTML = `
        <option value="">Select a category</option>
    `;

    categories.forEach(function (category) {
        const option = document.createElement('option');

        option.value = category.category_id;
        option.textContent = category.category_name;

        categoryInput.appendChild(option);
    });
}

// Load selected tender
async function loadTender() {
    const response = await fetch(
        `/api/tenders/${tenderIdFromUrl}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to load tender');
    }

    currentTender = getTenderFromResponse(data);
}

// Check ownership and status
function validateTenderAccess() {
    const user = getUser();

    if (
        currentTender.created_by !== undefined &&
        Number(currentTender.created_by) !== Number(user.user_id)
    ) {
        showPopup(
            'Access Denied',
            'You can only edit tenders created by your Authority account.',
            'warning',
            'my-tenders.html'
        );

        return false;
    }

    if (
        currentTender.status !== 'DRAFT' &&
        currentTender.status !== 'OPEN'
    ) {
        showPopup(
            'Edit Not Allowed',
            'Only Draft or Open tenders can be edited.',
            'warning',
            'my-tenders.html'
        );

        return false;
    }

    return true;
}

// Fill form fields
function displayTender() {
    titleInput.value = currentTender.title || '';
    descriptionInput.value = currentTender.description || '';
    budgetInput.value = currentTender.budget || '';
    openDateInput.value = formatInputDate(currentTender.open_date);
    closeDateInput.value = formatInputDate(currentTender.close_date);
    categoryInput.value = currentTender.category_id || '';
    statusInput.value = currentTender.status || 'DRAFT';

    document.getElementById('descriptionCount').textContent =
        descriptionInput.value.length;

    document.getElementById('summaryTenderId').textContent =
        currentTender.tender_id;

    document.getElementById('summaryCreatedBy').textContent =
        currentTender.created_by_name || getUser().name;

    document.getElementById('summaryCreatedDate').textContent =
        formatDisplayDate(currentTender.created_at);

    document.getElementById('viewTenderButton').href =
        `tender-details.html?id=${currentTender.tender_id}`;

    closeDateInput.min = openDateInput.value || getTodayDate();

    updateStatusDisplay();

    loadingCard.classList.add('d-none');
    editContent.classList.remove('d-none');
}

// Update status display
function updateStatusDisplay() {
    const badge = document.getElementById('currentStatusBadge');
    const statusNote = document.getElementById('statusNote');

    badge.textContent = statusInput.value;
    badge.className = statusInput.value === 'OPEN'
        ? 'status-badge status-open'
        : 'status-badge status-draft';

    if (currentTender.status === 'OPEN') {
        statusInput.value = 'OPEN';
        statusInput.disabled = true;

        statusNote.innerHTML =
            '<strong>Open tender:</strong> Use the Close button on My Tenders when bidding should stop.';
    } else {
        statusInput.disabled = false;

        statusNote.innerHTML =
            '<strong>Draft:</strong> Keep it as Draft or change it to Open to publish the tender.';
    }
}

// Validate title
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

// Validate description
function validateDescription() {
    const description = descriptionInput.value.trim();

    document.getElementById('descriptionCount').textContent =
        descriptionInput.value.length;

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

// Validate category
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

// Validate budget
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

// Validate open date
function validateOpenDate() {
    if (!openDateInput.value) {
        showFieldError(
            openDateInput,
            'openDateError',
            'Please select an open date.'
        );

        return false;
    }

    if (
        currentTender.status === 'DRAFT' &&
        openDateInput.value < getTodayDate()
    ) {
        showFieldError(
            openDateInput,
            'openDateError',
            'Draft tender open date cannot be in the past.'
        );

        return false;
    }

    showFieldValid(openDateInput, 'openDateError');
    return true;
}

// Validate closing date
function validateCloseDate() {
    if (!closeDateInput.value) {
        showFieldError(
            closeDateInput,
            'closeDateError',
            'Please select a closing date.'
        );

        return false;
    }

    if (
        openDateInput.value &&
        closeDateInput.value <= openDateInput.value
    ) {
        showFieldError(
            closeDateInput,
            'closeDateError',
            'Closing date must be after the open date.'
        );

        return false;
    }

    if (
        statusInput.value === 'OPEN' &&
        closeDateInput.value <= getTodayDate()
    ) {
        showFieldError(
            closeDateInput,
            'closeDateError',
            'Open tender closing date must be in the future.'
        );

        return false;
    }

    showFieldValid(closeDateInput, 'closeDateError');
    return true;
}

// Validate status
function validateStatus() {
    if (
        statusInput.value !== 'DRAFT' &&
        statusInput.value !== 'OPEN'
    ) {
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

// Update date limits
function setupDateEvents() {
    openDateInput.addEventListener('change', function () {
        closeDateInput.min = openDateInput.value || getTodayDate();

        validateOpenDate();

        if (closeDateInput.value) {
            validateCloseDate();
        }
    });
}

// Save changes
editTenderForm.addEventListener('submit', async function (event) {
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

    saveTenderButton.disabled = true;
    saveTenderButton.textContent = 'Saving Changes...';

    try {
        const response = await fetch(
            `/api/tenders/${tenderIdFromUrl}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(tenderData)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Update Failed',
                data.message || 'Unable to update the tender.',
                'danger'
            );

            return;
        }

        showPopup(
            'Tender Updated',
            'The tender was updated successfully.',
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
        saveTenderButton.disabled = false;
        saveTenderButton.textContent = 'Save Changes';
    }
});

// Validate while editing
titleInput.addEventListener('input', validateTitle);
descriptionInput.addEventListener('input', validateDescription);
categoryInput.addEventListener('change', validateCategory);
budgetInput.addEventListener('input', validateBudget);
closeDateInput.addEventListener('change', validateCloseDate);

statusInput.addEventListener('change', function () {
    validateStatus();
    updateStatusDisplay();

    if (closeDateInput.value) {
        validateCloseDate();
    }
});

// Start page
async function startEditPage() {
    if (!tenderIdFromUrl) {
        showPopup(
            'Tender Not Selected',
            'Select a tender from the My Tenders page.',
            'warning',
            'my-tenders.html'
        );

        return;
    }

    try {
        await loadCategories();
        await loadTender();

        if (!validateTenderAccess()) {
            return;
        }

        setupDateEvents();
        displayTender();

    } catch (error) {
        console.log(error);

        loadingCard.innerHTML = `
            <h2 class="h5">Could not load tender</h2>
            <p>${error.message}</p>
            <a href="my-tenders.html" class="btn btn-eztends">
                Back to My Tenders
            </a>
        `;
    }
}

// Run page
if (checkAuthorityAccess()) {
    startEditPage();
}
