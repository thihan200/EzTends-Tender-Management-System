// Admin Reports page

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

let users = [];
let tenders = [];
let bids = [];
let documents = [];

// API paths
const reportApi = {
    users: '/api/admin/users',
    tenders: '/api/tenders',
    bids: '/api/reports/bids',
    documents: '/api/documents',
    summary: '/api/reports/summary'
};

// Protect text in HTML
function escapeReportText(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read array from response
function getArray(data, key) {
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
function formatDate(value) {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format money
function formatMoney(value) {
    const amount = Number(value || 0);

    return amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Get status style
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

// Show status badge
function statusBadge(status) {
    const value =
        String(status || 'UNKNOWN').toUpperCase();

    return `
        <span class="status-badge ${getStatusClass(value)}">
            ${escapeReportText(value)}
        </span>
    `;
}

// Check Admin access
function checkAdminAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'ADMIN') {
        showPopup(
            'Access Denied',
            'Only Administrators can view this page.',
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

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Request failed'
        );
    }

    return data;
}

// Load public JSON
async function fetchPublic(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Request failed'
        );
    }

    return data;
}

// Load all report data
async function loadReportData() {
    try {
        const results = await Promise.allSettled([
            fetchProtected(reportApi.users),
            fetchPublic(reportApi.tenders),
            fetchProtected(reportApi.documents),
            fetchProtected(reportApi.bids),
            fetchProtected(reportApi.summary)
        ]);

        if (results[0].status === 'fulfilled') {
            users = getArray(
                results[0].value,
                'users'
            );
        }

        if (results[1].status === 'fulfilled') {
            tenders = getArray(
                results[1].value,
                'tenders'
            );
        }

        if (results[2].status === 'fulfilled') {
            documents = getArray(
                results[2].value,
                'documents'
            );
        }

        if (results[3].status === 'fulfilled') {
            bids = getArray(
                results[3].value,
                'bids'
            );
        }

        if (results[4].status === 'fulfilled') {
            const summary =
                results[4].value.summary ||
                results[4].value.data ||
                results[4].value;

            if (
                bids.length === 0 &&
                Number.isFinite(
                    Number(summary.total_bids)
                )
            ) {
                document.getElementById(
                    'totalBids'
                ).textContent =
                    summary.total_bids;
            }
        }

        updateSummaryCards();
        generateReport();

    } catch (error) {
        console.log(error);

        reportContent.innerHTML = `
            <div class="empty-area">
                Could not load report data.
            </div>
        `;
    }
}

// Update summary cards
function updateSummaryCards() {
    const openCount = tenders.filter(function (item) {
        return item.status === 'OPEN';
    }).length;

    const closedCount = tenders.filter(function (item) {
        return item.status === 'CLOSED';
    }).length;

    const awardedCount = tenders.filter(function (item) {
        return item.status === 'AWARDED';
    }).length;

    const pendingCount = documents.filter(function (item) {
        return item.status === 'PENDING';
    }).length;

    document.getElementById(
        'totalUsers'
    ).textContent = users.length;

    document.getElementById(
        'totalTenders'
    ).textContent = tenders.length;

    if (bids.length > 0) {
        document.getElementById(
            'totalBids'
        ).textContent = bids.length;
    }

    document.getElementById(
        'totalDocuments'
    ).textContent = documents.length;

    document.getElementById(
        'openTenders'
    ).textContent = openCount;

    document.getElementById(
        'closedTenders'
    ).textContent = closedCount;

    document.getElementById(
        'awardedTenders'
    ).textContent = awardedCount;

    document.getElementById(
        'pendingDocuments'
    ).textContent = pendingCount;
}

// Get item date
function getItemDate(item, type) {
    if (type === 'USERS') {
        return item.created_at;
    }

    if (type === 'TENDERS') {
        return item.created_at ||
            item.open_date;
    }

    if (type === 'BIDS') {
        return item.submitted_at;
    }

    if (type === 'DOCUMENTS') {
        return item.uploaded_at;
    }

    return null;
}

// Filter records by date
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
        const dateValue =
            getItemDate(item, type);

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

// Get selected date note
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

// Show Overview report
function showOverviewReport() {
    reportHeading.textContent =
        'System Overview Report';

    reportDescription.textContent =
        `Generated on ${formatDate(new Date())}.`;

    const suppliers = users.filter(function (item) {
        return item.type === 'SUPPLIER';
    }).length;

    const authorities = users.filter(function (item) {
        return item.type ===
            'TENDERING_AUTHORITY';
    }).length;

    const admins = users.filter(function (item) {
        return item.type === 'ADMIN';
    }).length;

    const open = tenders.filter(function (item) {
        return item.status === 'OPEN';
    }).length;

    const closed = tenders.filter(function (item) {
        return item.status === 'CLOSED';
    }).length;

    const awarded = tenders.filter(function (item) {
        return item.status === 'AWARDED';
    }).length;

    const cancelled = tenders.filter(function (item) {
        return item.status === 'CANCELLED';
    }).length;

    const pendingDocuments =
        documents.filter(function (item) {
            return item.status === 'PENDING';
        }).length;

    const approvedDocuments =
        documents.filter(function (item) {
            return item.status === 'APPROVED';
        }).length;

    const rejectedDocuments =
        documents.filter(function (item) {
            return item.status === 'REJECTED';
        }).length;

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
                    <td>Users</td>
                    <td>Suppliers</td>
                    <td>${suppliers}</td>
                </tr>

                <tr>
                    <td>Users</td>
                    <td>Tendering Authorities</td>
                    <td>${authorities}</td>
                </tr>

                <tr>
                    <td>Users</td>
                    <td>Administrators</td>
                    <td>${admins}</td>
                </tr>

                <tr>
                    <td>Tenders</td>
                    <td>Open</td>
                    <td>${open}</td>
                </tr>

                <tr>
                    <td>Tenders</td>
                    <td>Closed</td>
                    <td>${closed}</td>
                </tr>

                <tr>
                    <td>Tenders</td>
                    <td>Awarded</td>
                    <td>${awarded}</td>
                </tr>

                <tr>
                    <td>Tenders</td>
                    <td>Cancelled</td>
                    <td>${cancelled}</td>
                </tr>

                <tr>
                    <td>Bids</td>
                    <td>Total Bids</td>
                    <td>${bids.length}</td>
                </tr>

                <tr>
                    <td>Documents</td>
                    <td>Pending</td>
                    <td>${pendingDocuments}</td>
                </tr>

                <tr>
                    <td>Documents</td>
                    <td>Approved</td>
                    <td>${approvedDocuments}</td>
                </tr>

                <tr>
                    <td>Documents</td>
                    <td>Rejected</td>
                    <td>${rejectedDocuments}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Show User report
function showUserReport() {
    const records =
        filterByDate(users, 'USERS');

    reportHeading.textContent =
        'User Report';

    reportDescription.textContent =
        `${records.length} users. ${getDateDescription()}`;

    if (records.length === 0) {
        showEmptyReport();
        return;
    }

    const rows = records.map(function (user) {
        return `
            <tr>
                <td>${escapeReportText(user.user_id)}</td>
                <td>${escapeReportText(user.name)}</td>
                <td>${escapeReportText(user.email)}</td>
                <td>
                    ${escapeReportText(
                        String(user.type || '')
                            .replaceAll('_', ' ')
                    )}
                </td>
                <td>
                    ${escapeReportText(
                        user.company_name ||
                        user.organization_name ||
                        user.admin_level ||
                        'Not available'
                    )}
                </td>
                <td>
                    ${escapeReportText(
                        formatDate(user.created_at)
                    )}
                </td>
            </tr>
        `;
    }).join('');

    reportContent.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Account Type</th>
                    <th>Company / Organization</th>
                    <th>Registered Date</th>
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;
}

// Show Tender report
function showTenderReport() {
    const records =
        filterByDate(tenders, 'TENDERS');

    reportHeading.textContent =
        'Tender Report';

    reportDescription.textContent =
        `${records.length} tenders. ${getDateDescription()}`;

    if (records.length === 0) {
        showEmptyReport();
        return;
    }

    const rows = records.map(function (tender) {
        return `
            <tr>
                <td>${escapeReportText(tender.tender_id)}</td>
                <td>${escapeReportText(tender.title)}</td>
                <td>
                    ${escapeReportText(
                        tender.category_name ||
                        tender.category_id ||
                        'Not available'
                    )}
                </td>
                <td>Rs. ${escapeReportText(
                    formatMoney(tender.budget)
                )}</td>
                <td>${escapeReportText(
                    formatDate(tender.open_date)
                )}</td>
                <td>${escapeReportText(
                    formatDate(tender.close_date)
                )}</td>
                <td>${statusBadge(tender.status)}</td>
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
                    <th>Closing Date</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;
}

// Show Bid report
function showBidReport() {
    const records =
        filterByDate(bids, 'BIDS');

    reportHeading.textContent =
        'Bid Report';

    reportDescription.textContent =
        `${records.length} bids. ${getDateDescription()}`;

    if (records.length === 0) {
        reportContent.innerHTML = `
            <div class="empty-area">
                <h3 class="h5">No bid report data available</h3>

                <p class="mb-0">
                    Confirm that the backend provides
                    GET /api/reports/bids.
                </p>
            </div>
        `;

        return;
    }

    const rows = records.map(function (bid) {
        return `
            <tr>
                <td>${escapeReportText(bid.bid_id)}</td>
                <td>
                    ${escapeReportText(
                        bid.tender_title ||
                        bid.tender_id
                    )}
                </td>
                <td>
                    ${escapeReportText(
                        bid.supplier_name ||
                        bid.company_name ||
                        bid.supplier_id
                    )}
                </td>
                <td>
                    Rs. ${escapeReportText(
                        formatMoney(bid.amount)
                    )}
                </td>
                <td>
                    ${escapeReportText(
                        formatDate(bid.submitted_at)
                    )}
                </td>
                <td>
                    ${statusBadge(
                        bid.status ||
                        bid.bid_status
                    )}
                </td>
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
                    <th>Amount</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;
}

// Show Document report
function showDocumentReport() {
    const records =
        filterByDate(documents, 'DOCUMENTS');

    reportHeading.textContent =
        'Document Report';

    reportDescription.textContent =
        `${records.length} documents. ${getDateDescription()}`;

    if (records.length === 0) {
        showEmptyReport();
        return;
    }

    const rows = records.map(function (item) {
        const fileName = String(
            item.file_path || 'Document'
        )
            .replaceAll('\\', '/')
            .split('/')
            .pop();

        return `
            <tr>
                <td>${escapeReportText(item.document_id)}</td>
                <td>${escapeReportText(fileName)}</td>
                <td>
                    ${escapeReportText(
                        item.tender_title ||
                        item.tender_id
                    )}
                </td>
                <td>
                    ${escapeReportText(
                        item.uploaded_by_name ||
                        'Unknown user'
                    )}
                </td>
                <td>
                    ${escapeReportText(
                        formatDate(item.uploaded_at)
                    )}
                </td>
                <td>${statusBadge(item.status)}</td>
            </tr>
        `;
    }).join('');

    reportContent.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Document ID</th>
                    <th>Filename</th>
                    <th>Tender</th>
                    <th>Uploaded By</th>
                    <th>Uploaded Date</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;
}

// Show empty report
function showEmptyReport() {
    reportContent.innerHTML = `
        <div class="empty-area">
            No records were found for the selected date range.
        </div>
    `;
}

// Generate selected report
function generateReport() {
    const selectedType =
        reportType.value;

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

    if (selectedType === 'USERS') {
        showUserReport();
        return;
    }

    if (selectedType === 'TENDERS') {
        showTenderReport();
        return;
    }

    if (selectedType === 'BIDS') {
        showBidReport();
        return;
    }

    if (selectedType === 'DOCUMENTS') {
        showDocumentReport();
        return;
    }

    showOverviewReport();
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
if (checkAdminAccess()) {
    loadReportData();
}
