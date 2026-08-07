// Supplier Dashboard

const latestTenderList = document.getElementById('latestTenderList');

let supplierBids = [];

// Protect text before adding it to HTML
function escapeDashboardText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read arrays from common response formats
function getArrayFromResponse(data, key) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data[key])) {
        return data[key];
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

// Get bid status from possible field names
function getBidStatus(bid) {
    return bid.status || bid.bid_status || 'SUBMITTED';
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
        month: 'short',
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

// Shorten title
function shortenText(text, maxLength = 70) {
    const value = String(text || '');

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.substring(0, maxLength).trim()}...`;
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
            'Only Suppliers can view this dashboard.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Get greeting based on current time
function getTimeGreeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
        return 'Good Morning';
    }

    if (currentHour < 17) {
        return 'Good Afternoon';
    }

    return 'Good Evening';
}

// Show logged user details
function showSupplierDetails() {
    const user = getUser();
    const greeting = getTimeGreeting();

    document.getElementById('headerWelcome').textContent =
        `${greeting}`;

    document.getElementById('welcomeName').textContent =
        `Hello ${user.name}`;

    document.getElementById('welcomeEmail').textContent =
        `${user.email} · Supplier Account`;
}

// Update bid summary cards
function updateBidSummary() {
    const activeBids = supplierBids.filter(function (bid) {
        const status = getBidStatus(bid);

        return status === 'SUBMITTED' || status === 'UPDATED';
    });

    const approvedBids = supplierBids.filter(function (bid) {
        return getBidStatus(bid) === 'APPROVED';
    });

    const rejectedBids = supplierBids.filter(function (bid) {
        return getBidStatus(bid) === 'REJECTED';
    });

    document.getElementById('totalBidCount').textContent =
        supplierBids.length;

    document.getElementById('activeBidCount').textContent =
        activeBids.length;

    document.getElementById('approvedBidCount').textContent =
        approvedBids.length;

    document.getElementById('rejectedBidCount').textContent =
        rejectedBids.length;
}

// Load Supplier bids
async function loadBidSummary() {
    try {
        const response = await fetch('/api/bids/my-bids', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load bids');
        }

        supplierBids = getArrayFromResponse(data, 'bids');
        updateBidSummary();

    } catch (error) {
        console.log(error);
    }
}

// Create tender card
function createTenderCard(tender) {
    return `
        <div class="col-md-6 col-xl-4">
            <article class="tender-card">
                <div class="tender-card-body">
                    <span class="category-label">
                        ${escapeDashboardText(tender.category_name || 'General')}
                    </span>

                    <h3 class="tender-title">
                        ${escapeDashboardText(shortenText(tender.title))}
                    </h3>

                    <div class="tender-meta">
                        <span>
                            <strong>Budget:</strong>
                            ${escapeDashboardText(formatBudget(tender.budget))}
                        </span>

                        <span>
                            <strong>Closing:</strong>
                            ${escapeDashboardText(formatDate(tender.close_date))}
                        </span>
                    </div>

                    <a
                        href="tender-details.html?id=${tender.tender_id}"
                        class="btn btn-outline-eztends w-100"
                    >
                        View Tender
                    </a>
                </div>
            </article>
        </div>
    `;
}

// Show latest open tenders
function displayLatestTenders(tenders) {
    const openTenders = tenders
        .filter(function (tender) {
            return tender.status === 'OPEN';
        })
        .slice(0, 6);

    if (openTenders.length === 0) {
        latestTenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">No open tenders available</h3>
                    <p class="mb-0">
                        New opportunities will appear here.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    latestTenderList.innerHTML = openTenders
        .map(createTenderCard)
        .join('');
}

// Load latest tenders
async function loadLatestTenders() {
    try {
        const response = await fetch('/api/tenders');

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load tenders');
        }

        const tenders = getArrayFromResponse(data, 'tenders');

        displayLatestTenders(tenders);

    } catch (error) {
        latestTenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">Could not load tenders</h3>
                    <p class="mb-0">
                        Check whether the local server is running.
                    </p>
                </div>
            </div>
        `;
    }
}

// Start page
if (checkSupplierAccess()) {
    showSupplierDetails();
    loadBidSummary();
    loadLatestTenders();
}
