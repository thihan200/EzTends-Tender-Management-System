// My Tenders page

const tenderTableBody =
    document.getElementById('tenderTableBody');

const resultCount =
    document.getElementById('resultCount');

const searchInput =
    document.getElementById('searchInput');

const statusFilter =
    document.getElementById('statusFilter');

const clearFiltersButton =
    document.getElementById('clearFiltersButton');

const closeTenderIdInput =
    document.getElementById('closeTenderId');

const closeTenderTitle =
    document.getElementById('closeTenderTitle');

const confirmCloseButton =
    document.getElementById('confirmCloseButton');

const cancelTenderIdInput =
    document.getElementById('cancelTenderId');

const cancelTenderTitle =
    document.getElementById('cancelTenderTitle');

const confirmCancelButton =
    document.getElementById('confirmCancelButton');

const closeTenderModal = new bootstrap.Modal(
    document.getElementById('closeTenderModal')
);

const cancelTenderModal = new bootstrap.Modal(
    document.getElementById('cancelTenderModal')
);

const reopenTenderIdInput =
    document.getElementById('reopenTenderId');

const reopenCloseDateInput =
    document.getElementById('reopenCloseDate');

const confirmReopenButton =
    document.getElementById('confirmReopenButton');

const reopenTenderModal = new bootstrap.Modal(
    document.getElementById('reopenTenderModal')
);

let allTenders = [];

// Protect text in HTML
function escapeTenderText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read tender arrays
function getTenderArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.tenders)) {
        return data.tenders;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

// Read bid arrays
function getBidArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.bids)) {
        return data.bids;
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

// Format budget
function formatBudget(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return 'Not available';
    }

    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2
    }).format(amount);
}

// Get status style
function getStatusClass(status) {
    if (status === 'OPEN') {
        return 'status-open';
    }

    if (status === 'CLOSED') {
        return 'status-closed';
    }

    if (status === 'AWARDED') {
        return 'status-awarded';
    }

    if (status === 'CANCELLED') {
        return 'status-cancelled';
    }

    return 'status-draft';
}

// Check edit permission
function canEditTender(tender) {
    return (
        tender.status === 'DRAFT' ||
        tender.status === 'OPEN'
    );
}

// Check cancel permission
function canCancelTender(tender) {
    return (
        tender.status !== 'AWARDED' &&
        tender.status !== 'CANCELLED'
    );
}

// Create table row
function createTenderRow(tender) {
    const editButton = canEditTender(tender)
        ? `
            <a
                href="edit-tender.html?id=${tender.tender_id}"
                class="btn btn-sm btn-outline-eztends"
            >
                Edit
            </a>
        `
        : '';

    const closeButton = tender.status === 'OPEN'
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                onclick="openCloseTender(${tender.tender_id})"
            >
                Close
            </button>
        `
        : '';

    const reopenButton = tender.status === 'CLOSED'
    ? `
        <button
            type="button"
            class="btn btn-sm btn-outline-success"
            onclick="openReopenTender(${tender.tender_id})"
        >
            Reopen
        </button>
    `
    : '';

    const cancelButton = canCancelTender(tender)
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="openCancelTender(${tender.tender_id})"
            >
                Cancel
            </button>
        `
        : '';

    return `
        <tr>
            <td>
                <a
                    href="tender-details.html?id=${tender.tender_id}"
                    class="tender-title-link"
                >
                    ${escapeTenderText(tender.title)}
                </a>

                <div class="small text-muted mt-1">
                    Tender ID: ${escapeTenderText(tender.tender_id)}
                </div>
            </td>

            <td>
                ${escapeTenderText(
                    tender.category_name || 'Not assigned'
                )}
            </td>

            <td>
                <strong>
                    ${escapeTenderText(formatBudget(tender.budget))}
                </strong>
            </td>

            <td>
                ${escapeTenderText(formatDate(tender.close_date))}
            </td>

            <td>
                <span class="status-badge ${getStatusClass(tender.status)}">
                    ${escapeTenderText(tender.status || 'DRAFT')}
                </span>
            </td>

            <td>
                ${escapeTenderText(tender.bid_count || 0)}
            </td>

            <td>
                <div class="action-buttons">
                    <a
                        href="tender-details.html?id=${tender.tender_id}"
                        class="btn btn-sm btn-outline-secondary"
                    >
                        View
                    </a>

                    <a
                        href="tender-bids.html?tender_id=${tender.tender_id}"
                        class="btn btn-sm btn-outline-primary"
                    >
                        Bids
                    </a>

                    <a
                        href="tender-documents.html?tender_id=${tender.tender_id}"
                        class="btn btn-sm btn-outline-success"
                    >
                        Documents
                    </a>

                    ${editButton}
                    ${closeButton}
                    ${reopenButton}
                    ${cancelButton}
                </div>
            </td>
        </tr>
    `;
}

// Show tender rows
function displayTenders(tenders) {
    resultCount.textContent =
        `${tenders.length} tender${tenders.length === 1 ? '' : 's'} found`;

    if (tenders.length === 0) {
        tenderTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <h3 class="h5">No tenders found</h3>

                    <p class="mb-3">
                        No tenders match the selected filters.
                    </p>

                    <a href="create-tender.html" class="btn btn-eztends">
                        Create Tender
                    </a>
                </td>
            </tr>
        `;

        return;
    }

    tenderTableBody.innerHTML = tenders
        .map(createTenderRow)
        .join('');
}

// Update summary cards
function updateSummary() {
    const openTenders = allTenders.filter(function (tender) {
        return tender.status === 'OPEN';
    });

    const closedTenders = allTenders.filter(function (tender) {
        return tender.status === 'CLOSED';
    });

    const awardedTenders = allTenders.filter(function (tender) {
        return tender.status === 'AWARDED';
    });

    document.getElementById('totalTenderCount').textContent =
        allTenders.length;

    document.getElementById('openTenderCount').textContent =
        openTenders.length;

    document.getElementById('closedTenderCount').textContent =
        closedTenders.length;

    document.getElementById('awardedTenderCount').textContent =
        awardedTenders.length;
}

// Apply search and filter
function applyFilters() {
    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedStatus =
        statusFilter.value;

    const filteredTenders = allTenders.filter(
        function (tender) {
            const title = String(
                tender.title || ''
            ).toLowerCase();

            const matchesSearch =
                title.includes(searchText);

            const matchesStatus =
                selectedStatus === 'ALL' ||
                tender.status === selectedStatus;

            return matchesSearch && matchesStatus;
        }
    );

    displayTenders(filteredTenders);
}

// Clear filters
function clearFilters() {
    searchInput.value = '';
    statusFilter.value = 'ALL';

    displayTenders(allTenders);
}

// Find tender by ID
function findTender(tenderId) {
    return allTenders.find(function (tender) {
        return Number(tender.tender_id) === Number(tenderId);
    });
}

// Open close confirmation
function openCloseTender(tenderId) {
    const tender = findTender(tenderId);

    if (!tender || tender.status !== 'OPEN') {
        showPopup(
            'Close Not Allowed',
            'Only open tenders can be closed.',
            'warning'
        );

        return;
    }

    closeTenderIdInput.value = tender.tender_id;
    closeTenderTitle.textContent = tender.title;

    closeTenderModal.show();
}

// Open cancel confirmation
function openCancelTender(tenderId) {
    const tender = findTender(tenderId);

    if (!tender || !canCancelTender(tender)) {
        showPopup(
            'Cancellation Not Allowed',
            'This tender cannot be cancelled.',
            'warning'
        );

        return;
    }

    cancelTenderIdInput.value = tender.tender_id;
    cancelTenderTitle.textContent = tender.title;

    cancelTenderModal.show();
}


// Open reopen tender modal
function openReopenTender(tenderId) {
    const tender = findTender(tenderId);

    if (!tender || tender.status !== 'CLOSED') {
        showPopup(
            'Reopen Not Allowed',
            'Only closed tenders can be reopened.',
            'warning'
        );

        return;
    }

    reopenTenderIdInput.value =
        tender.tender_id;

    reopenCloseDateInput.value = '';

    reopenCloseDateInput.classList.remove(
        'is-invalid'
    );

    document.getElementById(
        'reopenDateError'
    ).textContent = '';

    // Minimum date is tomorrow
    const tomorrow = new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    const year =
        tomorrow.getFullYear();

    const month =
        String(tomorrow.getMonth() + 1)
            .padStart(2, '0');

    const day =
        String(tomorrow.getDate())
            .padStart(2, '0');

    reopenCloseDateInput.min =
        `${year}-${month}-${day}`;

    reopenTenderModal.show();
}

// Confirm reopen tender
confirmReopenButton.addEventListener(
    'click',
    async function () {
        const tenderId =
            reopenTenderIdInput.value;

        const closeDate =
            reopenCloseDateInput.value;

        if (!closeDate) {
            reopenCloseDateInput.classList.add(
                'is-invalid'
            );

            document.getElementById(
                'reopenDateError'
            ).textContent =
                'Please select a new closing date.';

            return;
        }

        const newDeadline =
            new Date(`${closeDate}T00:00:00`);

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (
            Number.isNaN(newDeadline.getTime()) ||
            newDeadline <= today
        ) {
            reopenCloseDateInput.classList.add(
                'is-invalid'
            );

            document.getElementById(
                'reopenDateError'
            ).textContent =
                'Closing date must be a future date.';

            return;
        }

        reopenCloseDateInput.classList.remove(
            'is-invalid'
        );

        document.getElementById(
            'reopenDateError'
        ).textContent = '';

        confirmReopenButton.disabled = true;
        confirmReopenButton.textContent =
            'Reopening...';

        try {
            const response = await fetch(
                `/api/tenders/${tenderId}/reopen`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        close_date: closeDate
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                showPopup(
                    'Reopen Failed',
                    data.message ||
                        'Unable to reopen tender.',
                    'danger'
                );

                return;
            }

            reopenTenderModal.hide();

            showPopup(
                'Tender Reopened',
                'The tender is open for bidding again.',
                'success'
            );

            await loadMyTenders();

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );

        } finally {
            confirmReopenButton.disabled =
                false;

            confirmReopenButton.textContent =
                'Reopen Tender';
        }
    }
);

// Close tender
confirmCloseButton.addEventListener(
    'click',
    async function () {
        const tenderId = closeTenderIdInput.value;

        confirmCloseButton.disabled = true;
        confirmCloseButton.textContent = 'Closing...';

        try {
            const response = await fetch(
                `/api/tenders/${tenderId}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        status: 'CLOSED'
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Close Failed',
                    data.message ||
                        'Unable to close the tender.',
                    'danger'
                );

                return;
            }

            closeTenderModal.hide();

            showPopup(
                'Tender Closed',
                'The tender was closed successfully.',
                'success'
            );

            await loadMyTenders();

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );
        } finally {
            confirmCloseButton.disabled = false;
            confirmCloseButton.textContent =
                'Close Tender';
        }
    }
);

// Cancel tender
confirmCancelButton.addEventListener(
    'click',
    async function () {
        const tenderId = cancelTenderIdInput.value;

        confirmCancelButton.disabled = true;
        confirmCancelButton.textContent = 'Cancelling...';

        try {
            const response = await fetch(
                `/api/tenders/${tenderId}`,
                {
                    method: 'DELETE',

                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Cancellation Failed',
                    data.message ||
                        'Unable to cancel the tender.',
                    'danger'
                );

                return;
            }

            cancelTenderModal.hide();

            showPopup(
                'Tender Cancelled',
                'The tender was cancelled successfully.',
                'success'
            );

            await loadMyTenders();

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );
        } finally {
            confirmCancelButton.disabled = false;
            confirmCancelButton.textContent =
                'Cancel Tender';
        }
    }
);

// Load one tender's bid count
async function loadBidCount(tender) {
    try {
        const response = await fetch(
            `/api/bids/tender/${tender.tender_id}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

        if (!response.ok) {
            tender.bid_count = 0;
            return;
        }

        const data = await response.json();
        const bids = getBidArray(data);

        tender.bid_count = bids.length;

    } catch (error) {
        tender.bid_count = 0;
    }
}

// Load all bid counts
async function loadBidCounts() {
    const tasks = allTenders.map(loadBidCount);

    await Promise.all(tasks);
    applyFilters();
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
            'Only Tendering Authorities can view this page.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Load Authority tenders
async function loadMyTenders() {
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
                    'Unable to load your tenders'
            );
        }

        allTenders = getTenderArray(data);

        updateSummary();
        applyFilters();
        await loadBidCounts();

    } catch (error) {
        resultCount.textContent =
            'Unable to load tenders';

        tenderTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <h3 class="h5">
                        Could not load your tenders
                    </h3>

                    <p class="mb-0">
                        ${escapeTenderText(error.message)}
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
if (checkAuthorityAccess()) {
    loadMyTenders();
}
