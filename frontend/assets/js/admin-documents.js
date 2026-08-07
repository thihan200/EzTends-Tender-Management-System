// Admin Documents page

const documentTableBody =
    document.getElementById('documentTableBody');

const resultCount =
    document.getElementById('resultCount');

const searchInput =
    document.getElementById('searchInput');

const statusFilter =
    document.getElementById('statusFilter');

const clearFiltersButton =
    document.getElementById('clearFiltersButton');

const validationDocumentId =
    document.getElementById('validationDocumentId');

const validationStatus =
    document.getElementById('validationStatus');

const validationDocumentName =
    document.getElementById('validationDocumentName');

const validationStatusText =
    document.getElementById('validationStatusText');

const validationMessage =
    document.getElementById('validationMessage');

const validationModalTitle =
    document.getElementById('validationModalTitle');

const confirmValidationButton =
    document.getElementById('confirmValidationButton');

const validationModal = new bootstrap.Modal(
    document.getElementById('validationModal')
);

let allDocuments = [];

// Protect text in HTML
function escapeDocumentText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read document arrays
function getDocumentArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.documents)) {
        return data.documents;
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

// Get filename from path
function getDocumentFileName(filePath) {
    if (!filePath) {
        return 'Document';
    }

    const cleanPath = String(filePath)
        .replaceAll('\\', '/');

    return cleanPath.split('/').pop();
}

// Convert file path to URL
function getDocumentUrl(filePath) {
    if (!filePath) {
        return '#';
    }

    const cleanPath = String(filePath)
        .replaceAll('\\', '/')
        .replace(/^\/+/, '');

    return `/${cleanPath}`;
}

// Get status style
function getStatusClass(status) {
    const value = String(status || '').toUpperCase();

    if (value === 'PENDING') {
        return 'status-pending';
    }

    if (value === 'APPROVED') {
        return 'status-approved';
    }

    if (value === 'REJECTED') {
        return 'status-rejected';
    }

    return 'status-default';
}

// Find one document
function findDocument(documentId) {
    return allDocuments.find(function (item) {
        return Number(item.document_id) ===
            Number(documentId);
    });
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

// Update summary cards
function updateSummary() {
    const pending = allDocuments.filter(function (item) {
        return item.status === 'PENDING';
    });

    const approved = allDocuments.filter(function (item) {
        return item.status === 'APPROVED';
    });

    const rejected = allDocuments.filter(function (item) {
        return item.status === 'REJECTED';
    });

    document.getElementById(
        'totalDocumentCount'
    ).textContent = allDocuments.length;

    document.getElementById(
        'pendingDocumentCount'
    ).textContent = pending.length;

    document.getElementById(
        'approvedDocumentCount'
    ).textContent = approved.length;

    document.getElementById(
        'rejectedDocumentCount'
    ).textContent = rejected.length;
}

// Create one document row
function createDocumentRow(item) {
    const fileName =
        getDocumentFileName(item.file_path);

    const fileUrl =
        getDocumentUrl(item.file_path);

    const status =
        String(item.status || 'PENDING').toUpperCase();

    let validationButtons = `
        <span class="small-note">
            Already validated
        </span>
    `;

    if (status === 'PENDING') {
        validationButtons = `
            <button
                type="button"
                class="btn btn-sm btn-success"
                onclick="openValidationModal(
                    ${item.document_id},
                    'APPROVED'
                )"
            >
                Approve
            </button>

            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="openValidationModal(
                    ${item.document_id},
                    'REJECTED'
                )"
            >
                Reject
            </button>
        `;
    }

    return `
        <tr>
            <td>
                <a
                    href="${escapeDocumentText(fileUrl)}"
                    target="_blank"
                    rel="noopener"
                    class="document-name text-decoration-none"
                >
                    ${escapeDocumentText(fileName)}
                </a>

                <div class="small-note mt-1">
                    Document ID:
                    ${escapeDocumentText(item.document_id)}
                </div>
            </td>

            <td>
                <div class="document-name">
                    ${escapeDocumentText(
                        item.tender_title ||
                        `Tender #${item.tender_id}`
                    )}
                </div>

                <div class="small-note">
                    Tender ID:
                    ${escapeDocumentText(item.tender_id)}
                </div>
            </td>

            <td>
                <div class="document-name">
                    ${escapeDocumentText(
                        item.uploaded_by_name ||
                        'Unknown user'
                    )}
                </div>

                <div class="small-note">
                    ${escapeDocumentText(
                        item.uploaded_by_email || ''
                    )}
                </div>

                <div class="small-note">
                    ${escapeDocumentText(
                        String(
                            item.uploaded_by_type || ''
                        ).replaceAll('_', ' ')
                    )}
                </div>
            </td>

            <td>
                ${escapeDocumentText(
                    formatDate(item.uploaded_at)
                )}
            </td>

            <td>
                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeDocumentText(status)}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <a
                        href="${escapeDocumentText(fileUrl)}"
                        target="_blank"
                        rel="noopener"
                        class="btn btn-sm btn-outline-secondary"
                    >
                        Open
                    </a>

                    ${validationButtons}
                </div>
            </td>
        </tr>
    `;
}

// Display documents
function displayDocuments(documents) {
    resultCount.textContent =
        `${documents.length} document${documents.length === 1 ? '' : 's'} found`;

    if (documents.length === 0) {
        documentTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <h3 class="h5">
                        No documents found
                    </h3>

                    <p class="mb-0">
                        No documents match the selected filters.
                    </p>
                </td>
            </tr>
        `;

        return;
    }

    documentTableBody.innerHTML = documents
        .map(createDocumentRow)
        .join('');
}

// Apply filters
function applyFilters() {
    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedStatus =
        statusFilter.value;

    const filteredDocuments =
        allDocuments.filter(function (item) {
            const fileName =
                getDocumentFileName(
                    item.file_path
                ).toLowerCase();

            const tenderTitle =
                String(
                    item.tender_title || ''
                ).toLowerCase();

            const uploaderName =
                String(
                    item.uploaded_by_name || ''
                ).toLowerCase();

            const uploaderEmail =
                String(
                    item.uploaded_by_email || ''
                ).toLowerCase();

            const matchesSearch =
                fileName.includes(searchText) ||
                tenderTitle.includes(searchText) ||
                uploaderName.includes(searchText) ||
                uploaderEmail.includes(searchText);

            const matchesStatus =
                selectedStatus === 'ALL' ||
                item.status === selectedStatus;

            return matchesSearch &&
                matchesStatus;
        });

    displayDocuments(filteredDocuments);
}

// Clear filters
function clearFilters() {
    searchInput.value = '';
    statusFilter.value = 'ALL';

    displayDocuments(allDocuments);
}

// Open validation modal
function openValidationModal(
    documentId,
    newStatus
) {
    const documentItem =
        findDocument(documentId);

    if (!documentItem) {
        return;
    }

    const fileName =
        getDocumentFileName(
            documentItem.file_path
        );

    validationDocumentId.value =
        documentItem.document_id;

    validationStatus.value =
        newStatus;

    validationDocumentName.textContent =
        fileName;

    validationStatusText.textContent =
        newStatus;

    if (newStatus === 'APPROVED') {
        validationModalTitle.textContent =
            'Approve Document';

        validationMessage.textContent =
            'Confirm that this document is valid and should be approved.';

        confirmValidationButton.className =
            'btn btn-success';

        confirmValidationButton.textContent =
            'Approve Document';
    } else {
        validationModalTitle.textContent =
            'Reject Document';

        validationMessage.textContent =
            'Confirm that this document should be rejected.';

        confirmValidationButton.className =
            'btn btn-danger';

        confirmValidationButton.textContent =
            'Reject Document';
    }

    validationModal.show();
}

// Validate document
confirmValidationButton.addEventListener(
    'click',
    async function () {
        const documentId =
            validationDocumentId.value;

        const newStatus =
            validationStatus.value;

        confirmValidationButton.disabled = true;
        confirmValidationButton.textContent =
            'Updating...';

        try {
            const response = await fetch(
                `/api/documents/${documentId}/validate`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Validation Failed',
                    data.message ||
                        'Unable to update the document status.',
                    'danger'
                );

                return;
            }

            validationModal.hide();

            showPopup(
                'Document Updated',
                `The document was ${newStatus.toLowerCase()} successfully.`,
                'success'
            );

            await loadDocuments();

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );

        } finally {
            confirmValidationButton.disabled = false;
        }
    }
);

// Load documents
async function loadDocuments() {
    try {
        const response = await fetch(
            '/api/documents',
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
                'Unable to load documents'
            );
        }

        allDocuments =
            getDocumentArray(data);

        updateSummary();
        applyFilters();

    } catch (error) {
        console.log(error);

        resultCount.textContent =
            'Unable to load documents';

        documentTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <h3 class="h5">
                        Could not load documents
                    </h3>

                    <p class="mb-0">
                        ${escapeDocumentText(
                            error.message
                        )}
                    </p>
                </td>
            </tr>
        `;
    }
}

// Filter events
searchInput.addEventListener(
    'input',
    applyFilters
);

statusFilter.addEventListener(
    'change',
    applyFilters
);

clearFiltersButton.addEventListener(
    'click',
    clearFilters
);

// Start page
if (checkAdminAccess()) {
    loadDocuments();
}
