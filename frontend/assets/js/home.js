// Home page functions

const TENDER_API_URL = '/api/tenders';

// Protect text before adding it to HTML
function escapeHomeText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Format MySQL date for display
function formatTenderDate(dateValue) {
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

// Format tender budget
function formatTenderBudget(value) {
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
function getRemainingText(closeDate) {
    if (!closeDate) {
        return 'Closing date unavailable';
    }

    const datePart = String(closeDate).split('T')[0];
    const close = new Date(`${datePart}T23:59:59`);
    const now = new Date();

    const difference = close.getTime() - now.getTime();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (days < 0) {
        return 'Closed';
    }

    if (days === 0) {
        return 'Closes today';
    }

    if (days === 1) {
        return '1 day remaining';
    }

    return `${days} days remaining`;
}

// Check tender is still open
function isOpenTender(tender) {
    return tender.status === 'OPEN' &&
        getRemainingText(tender.close_date) !== 'Closed';
}

// Shorten long descriptions
function shortenDescription(description, maxLength = 125) {
    const text = String(description || 'No description available.');

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.substring(0, maxLength).trim()}...`;
}

// Create one tender card
function createTenderCard(tender) {
    const tenderId = encodeURIComponent(tender.tender_id);

    return `
        <div class="col-md-6 col-xl-4">
            <article class="tender-card">
                <div class="tender-card-body">
                    <span class="tender-category">
                        ${escapeHomeText(tender.category_name || 'General')}
                    </span>

                    <h3 class="tender-title">
                        ${escapeHomeText(tender.title)}
                    </h3>

                    <p class="tender-description">
                        ${escapeHomeText(shortenDescription(tender.description))}
                    </p>

                    <div class="tender-meta">
                        <span>
                            <strong>Budget:</strong>
                            ${escapeHomeText(formatTenderBudget(tender.budget))}
                        </span>

                        <span>
                            <strong>Closing:</strong>
                            ${escapeHomeText(formatTenderDate(tender.close_date))}
                        </span>

                        <span>
                            <strong>Published by:</strong>
                            ${escapeHomeText(tender.created_by_name || 'Tendering Authority')}
                        </span>
                    </div>

                    <a class="btn btn-outline-eztends w-100"
                       href="tender-details.html?id=${tenderId}">
                        View Tender
                    </a>
                </div>

                <footer class="tender-card-footer">
                    <span class="status-badge status-open">OPEN</span>
                    <span class="days-left">
                        ${escapeHomeText(getRemainingText(tender.close_date))}
                    </span>
                </footer>
            </article>
        </div>
    `;
}

// Update statistic cards
function updateStatistics(tenders) {
    const openTenders = tenders.filter(isOpenTender);
    const awardedTenders = tenders.filter(
        tender => tender.status === 'AWARDED'
    );

    const categories = new Set(
        tenders
            .map(tender => tender.category_name)
            .filter(Boolean)
    );

    document.getElementById('totalTenderCount').textContent =
        tenders.length;

    document.getElementById('openTenderCount').textContent =
        openTenders.length;

    document.getElementById('awardedTenderCount').textContent =
        awardedTenders.length;

    document.getElementById('categoryCount').textContent =
        categories.size;

    document.getElementById('heroOpenTenders').textContent =
        openTenders.length;

    const latestTender = openTenders[0] || tenders[0];

    document.getElementById('heroLatestTender').textContent =
        latestTender ? latestTender.title : 'No tender available';
}

// Display latest tender cards
function displayLatestTenders(tenders) {
    const tenderList = document.getElementById('latestTenderList');

    const openTenders = tenders
        .filter(isOpenTender)
        .slice(0, 6);

    if (openTenders.length === 0) {
        tenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">No open tenders available</h3>
                    <p class="mb-0">
                        New tender opportunities will appear here.
                    </p>
                </div>
            </div>
        `;
        return;
    }

    tenderList.innerHTML = openTenders
        .map(createTenderCard)
        .join('');
}

// Change account buttons after login
function updateAccountButtons() {
    let user = null;

    try {
        const savedUser = localStorage.getItem('user');
        user = savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        user = null;
    }

    if (!user) {
        return;
    }

    let dashboardPage = 'supplier-dashboard.html';

    if (user.type === 'ADMIN') {
        dashboardPage = 'admin-dashboard.html';
    }

    if (user.type === 'TENDERING_AUTHORITY') {
        dashboardPage = 'authority-dashboard.html';
    }

    const heroButton = document.getElementById('heroAccountButton');
    const ctaButton = document.getElementById('ctaAccountButton');

    heroButton.href = dashboardPage;
    heroButton.textContent = 'Open Dashboard';

    ctaButton.href = dashboardPage;
    ctaButton.textContent = 'Go to Dashboard';
}

// Load tenders from local backend
async function loadHomeTenders() {
    const tenderMessage = document.getElementById('tenderMessage');
    const token = localStorage.getItem('token');

    const headers = {};

    // Token is added when a protected route is still used
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(TENDER_API_URL, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load tenders');
        }

        const tenders = Array.isArray(data.tenders)
            ? data.tenders
            : [];

        updateStatistics(tenders);
        displayLatestTenders(tenders);

    } catch (error) {
        console.error('Home tender error:', error);

        document.getElementById('latestTenderList').innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">Could not load tenders</h3>
                    <p class="mb-0">
                        Check whether the local Node.js server is running.
                    </p>
                </div>
            </div>
        `;

        tenderMessage.innerHTML = `
            <div class="alert alert-warning" role="alert">
                ${escapeHomeText(error.message)}
            </div>
        `;
    }
}

// Start home page
document.addEventListener('DOMContentLoaded', function () {
    updateAccountButtons();
    loadHomeTenders();
});
