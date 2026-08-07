// Submit bid page

const pageMessage = document.getElementById('pageMessage');
const loadingArea = document.getElementById('loadingArea');
const bidContent = document.getElementById('bidContent');

const bidForm = document.getElementById('bidForm');
const amountInput = document.getElementById('amount');
const confirmBidInput = document.getElementById('confirmBid');
const submitBidButton = document.getElementById('submitBidButton');
const proposalFileInput = document.getElementById('proposalFile');

const urlParams = new URLSearchParams(window.location.search);
const tenderIdFromUrl = urlParams.get('tender_id');

let currentTender = null;

// Show field error
function showFieldError(input, errorId, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    document.getElementById(errorId).textContent = message;
}

// Show valid field
function showFieldValid(input, errorId) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    document.getElementById(errorId).textContent = '';
}

// Format date
function formatDate(dateValue) {
    if (!dateValue) {
        return 'Not available';
    }

    const datePart = String(dateValue).split('T')[0];
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
        month: 'long',
        year: 'numeric'
    });
}

// Format currency
function formatBudget(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return 'Not specified';
    }

    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2
    }).format(amount);
}

// Get remaining time
function getRemainingInfo(closeDate) {
    if (!closeDate) {
        return {
            text: 'Closing date unavailable',
            closed: true
        };
    }

    const datePart = String(closeDate).split('T')[0];
    const closingTime = new Date(`${datePart}T23:59:59`);
    const difference = closingTime.getTime() - Date.now();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (days < 0) {
        return {
            text: 'Tender closed',
            closed: true
        };
    }

    if (days === 0) {
        return {
            text: 'Closes today',
            closed: false
        };
    }

    if (days === 1) {
        return {
            text: '1 day remaining',
            closed: false
        };
    }

    return {
        text: `${days} days remaining`,
        closed: false
    };
}

// Read tender from API response
function getTenderFromResponse(data) {
    if (data.tender) {
        return data.tender;
    }

    if (Array.isArray(data.data)) {
        return data.data[0];
    }

    if (data.data) {
        return data.data;
    }

    return data;
}

// Validate bid amount
function validateAmount() {
    const amount = Number(amountInput.value);

    if (!amountInput.value || !Number.isFinite(amount) || amount <= 0) {
        showFieldError(
            amountInput,
            'amountError',
            'Enter a valid bid amount greater than zero.'
        );

        return false;
    }

    showFieldValid(amountInput, 'amountError');
    return true;
}

// Validate confirmation checkbox
function validateConfirmation() {
    if (!confirmBidInput.checked) {
        confirmBidInput.classList.add('is-invalid');
        document.getElementById('confirmBidError').textContent =
            'Please confirm the bid amount before submitting.';

        return false;
    }

    confirmBidInput.classList.remove('is-invalid');
    confirmBidInput.classList.add('is-valid');
    document.getElementById('confirmBidError').textContent = '';

    return true;
}

function validateProposalFile() {
    const file = proposalFileInput.files[0];

    if (!file) {
        proposalFileInput.classList.add('is-invalid');

        document.getElementById(
            'proposalFileError'
        ).textContent =
            'Please select a proposal document.';

        return false;
    }

    const allowedExtensions = [
        'pdf',
        'doc',
        'docx'
    ];

    const extension = file.name
        .split('.')
        .pop()
        .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        proposalFileInput.classList.add('is-invalid');

        document.getElementById(
            'proposalFileError'
        ).textContent =
            'Only PDF, DOC and DOCX files are allowed.';

        return false;
    }

    if (file.size > 5 * 1024 * 1024) {
        proposalFileInput.classList.add('is-invalid');

        document.getElementById(
            'proposalFileError'
        ).textContent =
            'File size must be 5 MB or smaller.';

        return false;
    }

    proposalFileInput.classList.remove('is-invalid');
    proposalFileInput.classList.add('is-valid');

    document.getElementById(
        'proposalFileError'
    ).textContent = '';

    return true;
}

// Display tender summary
function displayTender(tender) {
    currentTender = tender;

    const remaining = getRemainingInfo(tender.close_date);
    const tenderIsClosed =
        remaining.closed ||
        tender.status !== 'OPEN';

 

    document.getElementById('tenderTitle').textContent =
        tender.title;

    document.getElementById('tenderCategory').textContent =
        tender.category_name || 'General';

    document.getElementById('tenderId').textContent =
        tender.tender_id;

    document.getElementById('tenderBudget').textContent =
        formatBudget(tender.budget);

    document.getElementById('closingDate').textContent =
        formatDate(tender.close_date);

    document.getElementById('remainingTime').textContent =
        remaining.text;

    const statusElement = document.getElementById('tenderStatus');
    statusElement.textContent = tender.status;

    if (tender.status === 'OPEN') {
        statusElement.classList.add('status-open');
    } else if (tender.status === 'AWARDED') {
        statusElement.classList.add('status-awarded');
    } else {
        statusElement.classList.add('status-closed');
    }

    document.getElementById('viewTenderButton').href =
        `tender-details.html?id=${tender.tender_id}`;

    if (tenderIsClosed) {
        submitBidButton.disabled = true;
        submitBidButton.textContent = 'Tender Not Open';

        showPopup(
            'Bid Submission Unavailable',
            'This tender is not open for new bids.',
            'warning',
            `tender-details.html?id=${tender.tender_id}`
        );
    }

    loadingArea.classList.add('d-none');
    bidContent.classList.remove('d-none');
}

// Check user is Supplier
function checkSupplierAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'SUPPLIER') {
        showPopup(
            'Access Denied',
            'Only Suppliers can submit bids.',
            'warning',
            'tenders.html'
        );

        return false;
    }

    return true;
}

// Load tender details
async function loadTender() {
    if (!tenderIdFromUrl) {
        loadingArea.classList.add('d-none');

        pageMessage.innerHTML = `
            <div class="alert alert-danger">
                Tender ID is missing.
                <a href="tenders.html">Return to tenders</a>.
            </div>
        `;

        return;
    }

    try {
        const response = await fetch(
            `/api/tenders/${tenderIdFromUrl}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to load tender'
            );
        }

        const tender = getTenderFromResponse(data);

        if (!tender || !tender.tender_id) {
            throw new Error('Tender was not found');
        }

        displayTender(tender);

    } catch (error) {
        loadingArea.classList.add('d-none');

        pageMessage.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

// Submit bid
bidForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const amountValid = validateAmount();
    const confirmationValid = validateConfirmation();
    const fileValid = validateProposalFile();

    if (
        !amountValid ||
        !confirmationValid ||
        !fileValid
    ) {
        return;
    }

    if (!currentTender || currentTender.status !== 'OPEN') {
        showPopup(
            'Bid Submission Unavailable',
            'This tender is not open for new bids.',
            'warning'
        );

        return;
    }

    submitBidButton.disabled = true;
    submitBidButton.textContent = 'Submitting Bid...';

    // Create multipart form data
    const formData = new FormData();

    formData.append(
        'tender_id',
        tenderIdFromUrl
    );

    formData.append(
        'amount',
        amountInput.value
    );

    formData.append(
        'proposal_file',
        proposalFileInput.files[0]
    );

    try {
        const response = await fetch('/api/bids', {
            method: 'POST',

            headers: {
                Authorization: `Bearer ${getToken()}`
            },

            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Bid Submission Failed',
                data.message || 'Unable to submit bid.',
                'danger'
            );

            return;
        }

        showPopup(
            'Bid Submitted',
            'Your bid and proposal document were submitted successfully.',
            'success',
            'my-bids.html'
        );

    } catch (error) {
        console.log(error);

        showPopup(
            'Server Connection Error',
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        submitBidButton.disabled = false;
        submitBidButton.textContent = 'Submit Bid';
    }
});

// Validate while typing
amountInput.addEventListener(
    'input',
    validateAmount
);

confirmBidInput.addEventListener(
    'change',
    validateConfirmation
);

proposalFileInput.addEventListener(
    'change',
    validateProposalFile
);

// Start page
if (checkSupplierAccess()) {
    loadTender();
}
