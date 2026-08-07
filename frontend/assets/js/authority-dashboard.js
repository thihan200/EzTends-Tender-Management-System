// Authority Dashboard

const recentTenderList =
    document.getElementById('recentTenderList');

let authorityTenders = [];

// Protect text before adding to HTML
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

// Shorten long titles
function shortenText(text, maxLength = 70) {
    const value = String(text || '');

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.substring(0, maxLength).trim()}...`;
}

// Return status CSS class
function getStatusClass(status) {
    const value = String(status || '').toLowerCase();

    if (value === 'open') {
        return 'status-open';
    }

    if (value === 'closed') {
        return 'status-closed';
    }

    if (value === 'awarded') {
        return 'status-awarded';
    }

    if (value === 'cancelled') {
        return 'status-cancelled';
    }

    return 'status-draft';
}

// Check Authority access
function checkAuthorityAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (
        !user ||
        user.type !== 'TENDERING_AUTHORITY'
    ) {
        showPopup(
            'Access Denied',
            'Only Tendering Authorities can view this dashboard.',
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
        return 'Good Morning!';
    }

    if (currentHour < 17) {
        return 'Good Afternoon!';
    }

    return 'Good Evening!';
}

// Show logged user details
function showAuthorityDetails() {
    const user = getUser();
    const greeting = getTimeGreeting();

    document.getElementById('headerWelcome').textContent =
        `${greeting}`;

    document.getElementById('welcomeName').textContent =
        `Hello ${user.name}`;

    document.getElementById('welcomeEmail').textContent =
        `${user.email} · Tendering Authority Account`;
}

// Update tender summary cards
function updateTenderSummary() {
    const openTenders = authorityTenders.filter(function (tender) {
        return tender.status === 'OPEN';
    });

    const closedTenders = authorityTenders.filter(function (tender) {
        return tender.status === 'CLOSED';
    });

    const awardedTenders = authorityTenders.filter(function (tender) {
        return tender.status === 'AWARDED';
    });

    document.getElementById('totalTenderCount').textContent =
        authorityTenders.length;

    document.getElementById('openTenderCount').textContent =
        openTenders.length;

    document.getElementById('closedTenderCount').textContent =
        closedTenders.length;

    document.getElementById('awardedTenderCount').textContent =
        awardedTenders.length;
}

// Create one tender card
function createTenderCard(tender) {
    const status = tender.status || 'DRAFT';

    return `
        <div class="col-md-6 col-xl-4">
            <article class="tender-card">
                <div class="tender-card-body">
                    <span class="status-label ${getStatusClass(status)}">
                        ${escapeDashboardText(status)}
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

                        <span>
                            <strong>Bids:</strong>
                            ${escapeDashboardText(tender.bid_count || 0)}
                        </span>
                    </div>

                    <div class="d-flex gap-2">
                        <a
                            href="tender-details.html?id=${tender.tender_id}"
                            class="btn btn-outline-secondary w-50"
                        >
                            View
                        </a>

                        <a
                            href="tender-bids.html?tender_id=${tender.tender_id}"
                            class="btn btn-outline-eztends w-50"
                        >
                            Bids
                        </a>
                    </div>
                </div>
            </article>
        </div>
    `;
}

// Show recent tenders
function displayRecentTenders() {
    const recentTenders = authorityTenders.slice(0, 6);

    if (recentTenders.length === 0) {
        recentTenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">No tenders created</h3>

                    <p>
                        Create your first tender to receive Supplier bids.
                    </p>

                    <a href="create-tender.html" class="btn btn-eztends">
                        Create Tender
                    </a>
                </div>
            </div>
        `;

        return;
    }

    recentTenderList.innerHTML = recentTenders
        .map(createTenderCard)
        .join('');
}

// Load bids for one tender
async function getTenderBidCount(tenderId) {
    try {
        const response = await fetch(
            `/api/bids/tender/${tenderId}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

        if (!response.ok) {
            return 0;
        }

        const data = await response.json();
        const bids = getArrayFromResponse(data, 'bids');

        return bids.length;

    } catch (error) {
        return 0;
    }
}

// Load bid counts for all tenders
async function loadBidCounts() {
    const countPromises = authorityTenders.map(
        async function (tender) {
            const count = await getTenderBidCount(
                tender.tender_id
            );

            tender.bid_count = count;

            return count;
        }
    );

    const counts = await Promise.all(countPromises);

    const totalBids = counts.reduce(
        function (total, count) {
            return total + count;
        },
        0
    );

    document.getElementById('totalBidCount').textContent =
        totalBids;

    displayRecentTenders();
}

// Load Authority tenders
async function loadAuthorityTenders() {
    try {
        const response = await fetch(
            '/api/tenders/my-tenders',
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
                    'Unable to load Authority tenders'
            );
        }

        authorityTenders =
            getArrayFromResponse(data, 'tenders');

        updateTenderSummary();
        displayRecentTenders();
        await loadBidCounts();

    } catch (error) {
        recentTenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">Could not load your tenders</h3>

                    <p class="mb-0">
                        ${escapeDashboardText(error.message)}
                    </p>
                </div>
            </div>
        `;
    }
}

// Start page
if (checkAuthorityAccess()) {
    showAuthorityDetails();
    loadAuthorityTenders();
}
