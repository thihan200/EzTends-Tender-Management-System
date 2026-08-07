// Admin Dashboard

const recentUserTable =
    document.getElementById('recentUserTable');

const recentDocumentTable =
    document.getElementById('recentDocumentTable');

let allUsers = [];
let allDocuments = [];

// Backend API paths
const adminApi = {
    users: '/api/admin/users',
    documents: '/api/documents',
    summary: '/api/reports/summary',
    tenders: '/api/tenders'
};

// Protect text in HTML
function escapeAdminText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read arrays from responses
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

// Get greeting from current time
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

// Format date
function formatDate(dateValue) {
    if (!dateValue) {
        return 'Not available';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Get document status
function getDocumentStatus(documentItem) {
    return (
        documentItem.status ||
        documentItem.validation_status ||
        'PENDING'
    );
}

// Get badge style
function getStatusClass(status) {
    const value = String(status || '').toUpperCase();

    if (value === 'PENDING') {
        return 'status-pending';
    }

    if (value === 'APPROVED' || value === 'ACTIVE') {
        return 'status-approved';
    }

    if (value === 'REJECTED' || value === 'DISABLED') {
        return 'status-rejected';
    }

    return 'status-default';
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
            'Only Administrators can view this dashboard.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Show Admin details
function showAdminDetails() {
    const user = getUser();
    const greeting = getTimeGreeting();

    document.getElementById('headerWelcome').textContent =
        `${greeting}`;

    document.getElementById('welcomeName').textContent =
        `Hello, ${user.name}`;

    document.getElementById('welcomeEmail').textContent =
        `${user.email} · Administrator Account`;
}

// Load protected JSON
async function loadProtectedJson(url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${getToken()}`
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

// Update user counts
function updateUserSummary() {
    const suppliers = allUsers.filter(function (user) {
        return user.type === 'SUPPLIER';
    });

    const authorities = allUsers.filter(function (user) {
        return user.type === 'TENDERING_AUTHORITY';
    });

    document.getElementById('totalUserCount').textContent =
        allUsers.length;

    document.getElementById('supplierCount').textContent =
        suppliers.length;

    document.getElementById('authorityCount').textContent =
        authorities.length;
}

// Update document counts
function updateDocumentSummary() {
    const pending = allDocuments.filter(function (item) {
        return getDocumentStatus(item) === 'PENDING';
    });

    const approved = allDocuments.filter(function (item) {
        return getDocumentStatus(item) === 'APPROVED';
    });

    const rejected = allDocuments.filter(function (item) {
        return getDocumentStatus(item) === 'REJECTED';
    });

    document.getElementById('pendingDocumentCount').textContent =
        pending.length;

    document.getElementById('approvedDocumentCount').textContent =
        approved.length;

    document.getElementById('rejectedDocumentCount').textContent =
        rejected.length;
}

// Show recent users
function displayRecentUsers() {
    const recentUsers = allUsers.slice(0, 5);

    if (recentUsers.length === 0) {
        recentUserTable.innerHTML = `
            <tr>
                <td colspan="3" class="empty-area">
                    No users available.
                </td>
            </tr>
        `;

        return;
    }

    recentUserTable.innerHTML = recentUsers
        .map(function (user) {
            return `
                <tr>
                    <td>
                        <div class="user-name">
                            ${escapeAdminText(user.name)}
                        </div>

                        <div class="small-note">
                            ${escapeAdminText(user.email)}
                        </div>
                    </td>

                    <td>
                        ${escapeAdminText(
                            String(user.type || '')
                                .replaceAll('_', ' ')
                        )}
                    </td>

                    <td>
                        ${escapeAdminText(
                            formatDate(user.created_at)
                        )}
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Get filename from stored path
function getDocumentFileName(filePath) {
    if (!filePath) {
        return 'Document';
    }

    const cleanPath = String(filePath)
        .replaceAll('\\', '/');

    return cleanPath.split('/').pop();
}

// Convert stored path to browser URL
function getDocumentUrl(filePath) {
    if (!filePath) {
        return '#';
    }

    const cleanPath = String(filePath)
        .replaceAll('\\', '/')
        .replace(/^\/+/, '');

    return `/${cleanPath}`;
}

// Show recent documents
function displayRecentDocuments() {
    const recentDocuments = allDocuments.slice(0, 5);

    if (recentDocuments.length === 0) {
        recentDocumentTable.innerHTML = `
            <tr>
                <td colspan="3" class="empty-area">
                    No documents available.
                </td>
            </tr>
        `;

        return;
    }

    recentDocumentTable.innerHTML = recentDocuments
        .map(function (item) {
            const status = getDocumentStatus(item);

            const fileName =
                getDocumentFileName(item.file_path);

            const fileUrl =
                getDocumentUrl(item.file_path);

            return `
                <tr>
                    <td>
                        <a
                            href="${escapeAdminText(fileUrl)}"
                            target="_blank"
                            rel="noopener"
                            class="document-name text-decoration-none"
                        >
                            ${escapeAdminText(fileName)}
                        </a>

                        <div class="small-note">
                            ${escapeAdminText(
                                item.tender_title ||
                                `Tender #${item.tender_id}`
                            )}
                        </div>
                    </td>

                    <td>
                        <div class="user-name">
                            ${escapeAdminText(
                                item.uploaded_by_name ||
                                'Unknown user'
                            )}
                        </div>

                        <div class="small-note">
                            ${escapeAdminText(
                                item.uploaded_by_email ||
                                ''
                            )}
                        </div>
                    </td>

                    <td>
                        <span
                            class="status-badge ${getStatusClass(status)}"
                        >
                            ${escapeAdminText(status)}
                        </span>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Load users
async function loadUsers() {
    try {
        const data = await loadProtectedJson(adminApi.users);

        allUsers = getArrayFromResponse(data, 'users');

        updateUserSummary();
        displayRecentUsers();

    } catch (error) {
        recentUserTable.innerHTML = `
            <tr>
                <td colspan="3" class="empty-area">
                    Could not load users.
                </td>
            </tr>
        `;
    }
}

// Load documents
async function loadDocuments() {
    try {
        const data = await loadProtectedJson(
            adminApi.documents
        );

        allDocuments = getArrayFromResponse(
            data,
            'documents'
        );

        updateDocumentSummary();
        displayRecentDocuments();

    } catch (error) {
        recentDocumentTable.innerHTML = `
            <tr>
                <td colspan="3" class="empty-area">
                    Could not load documents.
                </td>
            </tr>
        `;
    }
}

// Load public tender count
async function loadTenderCount() {
    try {
        const response = await fetch(adminApi.tenders);
        const data = await response.json();

        if (!response.ok) {
            return;
        }

        const tenders = getArrayFromResponse(
            data,
            'tenders'
        );

        document.getElementById('tenderCount').textContent =
            tenders.length;

    } catch (error) {
        document.getElementById('tenderCount').textContent =
            '0';
    }
}

// Load report summary
async function loadReportSummary() {
    try {
        const data = await loadProtectedJson(
            adminApi.summary
        );

        const summary = data.summary;

        document.getElementById('bidCount').textContent =
            summary.bids.total_bids;

        document.getElementById('tenderCount').textContent =
            summary.tenders.total_tenders;

    } catch (error) {
        await loadTenderCount();
    }
}

// Load dashboard data
async function loadAdminDashboard() {
    await Promise.all([
        loadUsers(),
        loadDocuments(),
        loadReportSummary()
    ]);
}

// Start page
if (checkAdminAccess()) {
    showAdminDetails();
    loadAdminDashboard();
}
