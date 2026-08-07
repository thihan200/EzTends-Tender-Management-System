// Tender details page

const pageMessage = document.getElementById('pageMessage');
const loadingArea = document.getElementById('loadingArea');
const tenderContent = document.getElementById('tenderContent');

// Get tender ID from URL
const urlParams = new URLSearchParams(window.location.search);
const tenderIdFromUrl = urlParams.get('id');

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

// Format budget
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

// Calculate remaining days
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
            text: 'Tender Expired',
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

// Return status badge class
function getStatusClass(status) {
    if (status === 'OPEN') {
        return 'status-open';
    }

    if (status === 'AWARDED') {
        return 'status-awarded';
    }

    if (status === 'CLOSED') {
        return 'status-closed';
    }

    if (status === 'CANCELLED') {
        return 'status-cancelled';
    }

    return 'status-pending';
}

// Get logged user
function getPageUser() {
    try {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        return null;
    }
}

// Read tender from common API response formats
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

// Display tender information
function displayTender(tender) {
    const status = tender.status || 'DRAFT';
    const remaining = getRemainingInfo(tender.close_date);

    const authority =
        tender.created_by_name ||
        tender.authority_name ||
        'Tendering Authority';

    document.title = `${tender.title} - EzTends`;

    document.getElementById('headerTenderTitle').textContent =
        tender.title;

    document.getElementById('tenderTitle').textContent =
        tender.title;

    document.getElementById('tenderDescription').textContent =
        tender.description || 'No description available.';

    document.getElementById('tenderCategory').textContent =
        tender.category_name || 'General';

    document.getElementById('categoryName').textContent =
        tender.category_name || 'General';

    document.getElementById('tenderId').textContent =
        tender.tender_id;

    document.getElementById('tenderBudget').textContent =
        formatBudget(tender.budget);

    document.getElementById('openDate').textContent =
        formatDate(tender.open_date);

    document.getElementById('closeDate').textContent =
        formatDate(tender.close_date);

    document.getElementById('authorityName').textContent =
        authority;

    const statusElement = document.getElementById('tenderStatus');
    statusElement.textContent = status;
    statusElement.className =
        `status-badge ${getStatusClass(status)}`;

    const remainingElement = document.getElementById('remainingTime');
    remainingElement.textContent = remaining.text;
    remainingElement.className = remaining.closed
        ? 'detail-value remaining-closed'
        : 'detail-value remaining-open';

    updateActionArea(tender, remaining.closed);

    loadingArea.classList.add('d-none');
    tenderContent.classList.remove('d-none');
}

// Show correct action according to role
function updateActionArea(tender, dateClosed) {
    const user = getPageUser();
    const actionTitle = document.getElementById('actionTitle');
    const actionText = document.getElementById('actionText');
    const actionButtonArea = document.getElementById('actionButtonArea');

    const tenderClosed =
        dateClosed ||
        tender.status !== 'OPEN';

    if (!user) {
        actionTitle.textContent = 'Interested in this tender?';
        actionText.textContent =
            'Login as a Supplier to submit a bid.';

        actionButtonArea.innerHTML = `
            <a class="btn btn-eztends w-100" href="login.html">
                Login to Continue
            </a>
        `;
        return;
    }

    if (user.type === 'SUPPLIER') {
        if (tenderClosed) {
            actionTitle.textContent = 'Bid submission unavailable';
            actionText.textContent =
                'This tender is not open for new bids.';

            actionButtonArea.innerHTML = `
                <button class="btn btn-secondary w-100" disabled>
                    Tender Closed
                </button>
            `;
            return;
        }

        actionTitle.textContent = 'Ready to submit a bid?';
        actionText.textContent =
            'Submit your proposed amount for this tender.';

        actionButtonArea.innerHTML = `
            <a
                class="btn btn-eztends w-100"
                href="submit-bid.html?tender_id=${tender.tender_id}"
            >
                Submit Bid
            </a>
        `;
        return;
    }

    if (user.type === 'TENDERING_AUTHORITY') {
        const isOwner =
            Number(tender.created_by) === Number(user.user_id);

        if (isOwner) {
            actionTitle.textContent = 'Manage this tender';
            actionText.textContent =
                'View submitted bids for your tender.';

            actionButtonArea.innerHTML = `
                <a
                    class="btn btn-eztends w-100"
                    href="tender-bids.html?tender_id=${tender.tender_id}"
                >
                    View Submitted Bids
                </a>
            `;
        } else {
            actionTitle.textContent = 'Tender information';
            actionText.textContent =
                'Only Suppliers can submit bids for this tender.';

            actionButtonArea.innerHTML = `
                <a
                    class="btn btn-outline-eztends w-100"
                    href="authority-dashboard.html"
                >
                    Open Dashboard
                </a>
            `;
        }

        return;
    }

    actionTitle.textContent = 'Administrator access';
    actionText.textContent =
        'Review tender information from the Admin dashboard.';

    actionButtonArea.innerHTML = `
        <a
            class="btn btn-eztends w-100"
            href="admin-dashboard.html"
        >
            Open Dashboard
        </a>
    `;
}

// Load one tender
async function loadTenderDetails() {
    if (!tenderIdFromUrl) {
        loadingArea.classList.add('d-none');

        pageMessage.innerHTML = `
            <div class="alert alert-danger">
                Tender ID is missing.
                <a href="tenders.html">Return to tender list</a>.
            </div>
        `;

        return;
    }

    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(
            `/api/tenders/${tenderIdFromUrl}`,
            {
                method: 'GET',
                headers: headers
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to load tender details'
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

loadTenderDetails();
