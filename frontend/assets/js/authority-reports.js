// Tendering Authority Reports page

const reportType =
    document.getElementById('reportType');

const startDate =
    document.getElementById('startDate');

const endDate =
    document.getElementById('endDate');

const generateReportButton =
    document.getElementById('generateReportButton');

const printReportButton =
    document.getElementById('printReportButton');

const reportHeading =
    document.getElementById('reportHeading');

const reportDescription =
    document.getElementById('reportDescription');

const reportContent =
    document.getElementById('reportContent');

let authoritySummary = null;

const reportApi = {
    summary: '/api/reports/summary',
    tenders: '/api/reports/tenders',
    bids: '/api/reports/bids'
};

// Protect text added to generated HTML
function escapeReportText(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read an array from an API response
function getArray(data, key) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data[key])) {
        return data[key];
    }

    if (data && Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

// Convert values to safe numbers
function getNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

// Format date
function formatDate(value) {
    if (!value) {
        return 'Not available';
    }

    let date;

    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        date = new Date(`${value}T00:00:00`);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format money
function formatMoney(value) {
    const amount = getNumber(value);

    return amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Get status CSS class
function getStatusClass(status) {
    const value = String(status || '').toLowerCase();

    const allowed = [
        'open',
        'approved',
        'awarded',
        'pending',
        'draft',
        'submitted',
        'updated',
        'closed',
        'cancelled',
        'rejected'
    ];

    if (allowed.includes(value)) {
        return `status-${value}`;
    }

    return 'status-default';
}

// Create status badge
function statusBadge(status) {
    const value =
        String(status || 'UNKNOWN').toUpperCase();

    return `
        <span class="status-badge ${getStatusClass(value)}">
            ${escapeReportText(value)}
        </span>
    `;
}

// Check Tendering Authority access
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
            'Only Tendering Authorities can view this page.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Load protected JSON
async function fetchProtected(url) {
    const response = await fetch(url, {
        headers: {
            Authorization:
                `Bearer ${getToken()}`
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message || 'Request failed'
        );
    }

    return data;
}

// Update summary cards
function updateSummaryCards() {
    const tenderSummary =
        authoritySummary?.tenders || {};

    const bidSummary =
        authoritySummary?.bids || {};

    const documentSummary =
        authoritySummary?.documents || {};

    document.getElementById(
        'totalTenders'
    ).textContent = getNumber(
        tenderSummary.total_tenders
    );

    document.getElementById(
        'totalBids'
    ).textContent = getNumber(
        bidSummary.total_bids
    );

    document.getElementById(
        'totalDocuments'
    ).textContent = getNumber(
        documentSummary.total_documents
    );

    document.getElementById(
        'openTenders'
    ).textContent = getNumber(
        tenderSummary.open_tenders
    );

    document.getElementById(
        'closedTenders'
    ).textContent = getNumber(
        tenderSummary.closed_tenders
    );

    document.getElementById(
        'awardedTenders'
    ).textContent = getNumber(
        tenderSummary.awarded_tenders
    );

    document.getElementById(
        'pendingDocuments'
    ).textContent = getNumber(
        documentSummary.pending_documents
    );

    document.getElementById(
        'approvedBids'
    ).textContent = getNumber(
        bidSummary.approved_bids
    );
}

// Load Authority summary without creating a Tender or Bid report record
async function loadSummary() {
    try {
        const data = await fetchProtected(
            reportApi.summary
        );

        authoritySummary =
            data.summary || data.data || data;

        updateSummaryCards();
        showOverviewReport();

    } catch (error) {
        console.log(error);

        reportHeading.textContent =
            'Report Error';

        reportDescription.textContent =
            'The report summary could not be loaded.';

        reportContent.innerHTML = `
            <div class="empty-area">
                ${escapeReportText(error.message)}
            </div>
        `;
    }
}

// Get date used by a report item
function getItemDate(item, type) {
    if (type === 'TENDERS') {
        return item.open_date;
    }

    if (type === 'BIDS') {
        return item.submitted_at;
    }

    return null;
}

// Filter report records by selected dates
function filterByDate(items, type) {
    const fromValue = startDate.value;
    const toValue = endDate.value;

    if (!fromValue && !toValue) {
        return items;
    }

    const fromDate = fromValue
        ? new Date(`${fromValue}T00:00:00`)
        : null;

    const toDate = toValue
        ? new Date(`${toValue}T23:59:59`)
        : null;

    return items.filter(function (item) {
        const dateValue = getItemDate(item, type);

        if (!dateValue) {
            return false;
        }

        const itemDate = new Date(dateValue);

        if (Number.isNaN(itemDate.getTime())) {
            return false;
        }

        if (fromDate && itemDate < fromDate) {
            return false;
        }

        if (toDate && itemDate > toDate) {
            return false;
        }

        return true;
    });
}

// Describe the selected date range
function getDateDescription() {
    if (!startDate.value && !endDate.value) {
        return 'All available records.';
    }

    const fromText = startDate.value
        ? formatDate(startDate.value)
        : 'Beginning';

    const toText = endDate.value
        ? formatDate(endDate.value)
        : 'Today';

    return `Date range: ${fromText} to ${toText}.`;
}

// Show Authority overview
function showOverviewReport() {
    const tenderSummary =
        authoritySummary?.tenders || {};

    const bidSummary =
        authoritySummary?.bids || {};

    const documentSummary =
        authoritySummary?.documents || {};

    reportHeading.textContent =
        'Authority Overview Report';

    reportDescription.textContent =
        `Current summary generated on ${formatDate(new Date())}.`;

    reportContent.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Section</th>
                    <th>Item</th>
                    <th>Total</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Tenders</td>
                    <td>Total Tenders</td>
                    <td>${getNumber(tenderSummary.total_tenders)}</td>
                </tr>
                <tr>
                    <td>Tenders</td>
                    <td>Open</td>
                    <td>${getNumber(tenderSummary.open_tenders)}</td>
                </tr>
                <tr>
                    <td>Tenders</td>
                    <td>Closed</td>
                    <td>${getNumber(tenderSummary.closed_tenders)}</td>
                </tr>
                <tr>
                    <td>Tenders</td>
                    <td>Awarded</td>
                    <td>${getNumber(tenderSummary.awarded_tenders)}</td>
                </tr>
                <tr>
                    <td>Tenders</td>
                    <td>Cancelled</td>
                    <td>${getNumber(tenderSummary.cancelled_tenders)}</td>
                </tr>
                <tr>
                    <td>Bids</td>
                    <td>Total Bids</td>
                    <td>${getNumber(bidSummary.total_bids)}</td>
                </tr>
                <tr>
                    <td>Bids</td>
                    <td>Submitted</td>
                    <td>${getNumber(bidSummary.submitted_bids)}</td>
                </tr>
                <tr>
                    <td>Bids</td>
                    <td>Updated</td>
                    <td>${getNumber(bidSummary.updated_bids)}</td>
                </tr>
                <tr>
                    <td>Bids</td>
                    <td>Approved</td>
                    <td>${getNumber(bidSummary.approved_bids)}</td>
                </tr>
                <tr>
                    <td>Bids</td>
                    <td>Rejected</td>
                    <td>${getNumber(bidSummary.rejected_bids)}</td>
                </tr>
                <tr>
                    <td>Documents</td>
                    <td>Total Documents</td>
                    <td>${getNumber(documentSummary.total_documents)}</td>
                </tr>
                <tr>
                    <td>Documents</td>
                    <td>Pending</td>
                    <td>${getNumber(documentSummary.pending_documents)}</td>
                </tr>
                <tr>
                    <td>Documents</td>
                    <td>Approved</td>
                    <td>${getNumber(documentSummary.approved_documents)}</td>
                </tr>
                <tr>
                    <td>Documents</td>
                    <td>Rejected</td>
                    <td>${getNumber(documentSummary.rejected_documents)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Show Tender report
function showTenderReport(tenders) {
    const records = filterByDate(
        tenders,
        'TENDERS'
    );

    reportHeading.textContent =
        'Tender Report';

    reportDescription.textContent =
        `${records.length} tenders. ${getDateDescription()}`;

    if (records.length === 0) {
        showEmptyReport();
        return;
    }

    const rows = records.map(function (item) {
        return `
            <tr>
                <td>${escapeReportText(item.tender_id)}</td>
                <td>${escapeReportText(item.title)}</td>
                <td>${escapeReportText(item.category_name || 'Not available')}</td>
                <td>Rs. ${escapeReportText(formatMoney(item.budget))}</td>
                <td>${escapeReportText(formatDate(item.open_date))}</td>
                <td>${escapeReportText(formatDate(item.close_date))}</td>
                <td>${escapeReportText(getNumber(item.total_bids))}</td>
                <td>${statusBadge(item.status)}</td>
            </tr>
        `;
    }).join('');

    reportContent.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Tender ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Budget</th>
                    <th>Open Date</th>
                    <th>Close Date</th>
                    <th>Total Bids</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;
}

// Show Bid report
function showBidReport(bids) {
    const records = filterByDate(
        bids,
        'BIDS'
    );

    reportHeading.textContent =
        'Bid Report';

    reportDescription.textContent =
        `${records.length} bids. ${getDateDescription()}`;

    if (records.length === 0) {
        showEmptyReport();
        return;
    }

    const rows = records.map(function (item) {
        return `
            <tr>
                <td>${escapeReportText(item.bid_id)}</td>
                <td>
                    ${escapeReportText(item.tender_title)}
                    <div class="small text-muted">
                        Tender ID: ${escapeReportText(item.tender_id)}
                    </div>
                </td>
                <td>
                    ${escapeReportText(item.supplier_name)}
                    <div class="small text-muted">
                        ${escapeReportText(item.company_name || 'Company not available')}
                    </div>
                </td>
                <td>${escapeReportText(item.supplier_email)}</td>
                <td>Rs. ${escapeReportText(formatMoney(item.amount))}</td>
                <td>${escapeReportText(formatDate(item.submitted_at))}</td>
                <td>${statusBadge(item.bid_status)}</td>
            </tr>
        `;
    }).join('');

    reportContent.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Bid ID</th>
                    <th>Tender</th>
                    <th>Supplier</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;
}

// Show empty report result
function showEmptyReport() {
    reportContent.innerHTML = `
        <div class="empty-area">
            No records were found for the selected date range.
        </div>
    `;
}

// Generate selected report
async function generateReport() {
    if (
        startDate.value &&
        endDate.value &&
        startDate.value > endDate.value
    ) {
        showPopup(
            'Invalid Date Range',
            'The start date cannot be after the end date.',
            'warning'
        );

        return;
    }

    const selectedType = reportType.value;

    if (selectedType === 'OVERVIEW') {
        showOverviewReport();
        return;
    }

    generateReportButton.disabled = true;
    generateReportButton.textContent =
        'Generating...';

    reportContent.innerHTML = `
        <div class="empty-area">
            Generating report...
        </div>
    `;

    try {
        if (selectedType === 'TENDERS') {
            const data = await fetchProtected(
                reportApi.tenders
            );

            showTenderReport(
                getArray(data, 'tenders')
            );

            return;
        }

        if (selectedType === 'BIDS') {
            const data = await fetchProtected(
                reportApi.bids
            );

            showBidReport(
                getArray(data, 'bids')
            );
        }

    } catch (error) {
        console.log(error);

        reportHeading.textContent =
            'Report Error';

        reportDescription.textContent =
            'The selected report could not be generated.';

        reportContent.innerHTML = `
            <div class="empty-area">
                ${escapeReportText(error.message)}
            </div>
        `;

        showPopup(
            'Report Error',
            error.message,
            'danger'
        );

    } finally {
        generateReportButton.disabled = false;
        generateReportButton.textContent =
            'Generate';
    }
}

// Button events
generateReportButton.addEventListener(
    'click',
    generateReport
);

printReportButton.addEventListener(
    'click',
    function () {
        window.print();
    }
);

// Start page
if (checkAuthorityAccess()) {
    loadSummary();
}
