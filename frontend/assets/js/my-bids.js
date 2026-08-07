// My Bids page

const bidTableBody = document.getElementById('bidTableBody');
const resultCount = document.getElementById('resultCount');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');

const editBidForm = document.getElementById('editBidForm');
const editBidIdInput = document.getElementById('editBidId');
const editAmountInput = document.getElementById('editAmount');
const editTenderTitle = document.getElementById('editTenderTitle');
const saveBidButton = document.getElementById('saveBidButton');

const cancelBidIdInput = document.getElementById('cancelBidId');
const cancelTenderTitle = document.getElementById('cancelTenderTitle');
const confirmCancelButton = document.getElementById('confirmCancelButton');

// Proposal file fields inside Edit modal
const editProposalFileInput = document.getElementById('editProposalFile');
const currentProposalLink = document.getElementById('currentProposalLink');
const currentProposalArea = document.getElementById('currentProposalArea');

const editBidModal = new bootstrap.Modal(document.getElementById('editBidModal'));
const cancelBidModal = new bootstrap.Modal(document.getElementById('cancelBidModal'));

let allBids = [];

// Protect text before adding it to HTML
function escapeBidText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read bid list from different API response formats
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

// Format submitted date and time
function formatDateTime(dateValue) {
    if (!dateValue) {
        return 'Not available';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format bid amount
function formatAmount(value) {
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

// Convert saved Windows file path into browser URL
function getProposalUrl(filePath) {
    if (!filePath) {
        return '';
    }

    const cleanPath = String(filePath)
        .replaceAll('\\', '/')
        .replace(/^\/+/, '');

    return `/${cleanPath}`;
}

// Get bid status
function getBidStatus(bid) {
    return bid.status || bid.bid_status || 'SUBMITTED';
}

// Return status badge class
function getStatusClass(status) {
    if (status === 'APPROVED') {
        return 'status-approved';
    }

    if (status === 'REJECTED') {
        return 'status-rejected';
    }

    if (status === 'CANCELLED') {
        return 'status-cancelled';
    }

    if (status === 'UPDATED') {
        return 'status-updated';
    }

    return 'status-open';
}

// Get tender title
function getTenderTitle(bid) {
    return (
        bid.tender_title ||
        bid.title ||
        `Tender #${bid.tender_id}`
    );
}

// Check whether the bid can be updated or cancelled
function canChangeBid(bid) {
    const status = getBidStatus(bid);

    const validBidStatus =
        status === 'SUBMITTED' ||
        status === 'UPDATED';

    const tenderOpen =
        !bid.tender_status ||
        bid.tender_status === 'OPEN';

    let deadlineOpen = true;

    if (bid.close_date) {
        const datePart =
            String(bid.close_date).split('T')[0];

        const deadline =
            new Date(`${datePart}T23:59:59`);

        deadlineOpen =
            new Date() <= deadline;
    }

    return (
        validBidStatus &&
        tenderOpen &&
        deadlineOpen
    );
}

// Validate optional replacement proposal file
function validateEditProposalFile() {
    const file = editProposalFileInput.files[0];
    const errorElement = document.getElementById(
        'editProposalFileError'
    );

    // File replacement is optional
    if (!file) {
        editProposalFileInput.classList.remove(
            'is-invalid'
        );
        editProposalFileInput.classList.remove(
            'is-valid'
        );

        errorElement.textContent = '';

        return true;
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
        editProposalFileInput.classList.remove(
            'is-valid'
        );
        editProposalFileInput.classList.add(
            'is-invalid'
        );

        errorElement.textContent =
            'Only PDF, DOC and DOCX files are allowed.';

        return false;
    }

    if (file.size > 5 * 1024 * 1024) {
        editProposalFileInput.classList.remove(
            'is-valid'
        );
        editProposalFileInput.classList.add(
            'is-invalid'
        );

        errorElement.textContent =
            'File size must be 5 MB or smaller.';

        return false;
    }

    editProposalFileInput.classList.remove(
        'is-invalid'
    );
    editProposalFileInput.classList.add(
        'is-valid'
    );

    errorElement.textContent = '';

    return true;
}

// Create one bid table row
function createBidRow(bid) {
    const tenderTitle = getTenderTitle(bid);
    const status = getBidStatus(bid);
    const editable = canChangeBid(bid);

    // Proposal file button
    const proposalHtml = bid.proposal_file
        ? `
            <a
                class="btn btn-sm btn-outline-secondary"
                href="${escapeBidText(
                    getProposalUrl(bid.proposal_file)
                )}"
                target="_blank"
                rel="noopener"
            >
                View File
            </a>
        `
        : `
            <span class="text-muted">
                No file
            </span>
        `;

    const editButton = editable
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-eztends"
                onclick="openEditBid(${bid.bid_id})"
            >
                Edit
            </button>
        `
        : '';

    const cancelButton = editable
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="openCancelBid(${bid.bid_id})"
            >
                Cancel
            </button>
        `
        : '';

    return `
        <tr>
            <td>
                <a
                    class="bid-title-link"
                    href="tender-details.html?id=${bid.tender_id}"
                >
                    ${escapeBidText(tenderTitle)}
                </a>

                <div class="small text-muted mt-1">
                    Tender ID:
                    ${escapeBidText(bid.tender_id)}
                </div>
            </td>

            <td class="bid-amount">
                ${escapeBidText(
                    formatAmount(bid.amount)
                )}
            </td>

            <td>
                ${proposalHtml}
            </td>

            <td>
                ${escapeBidText(
                    formatDateTime(bid.submitted_at)
                )}
            </td>

            <td>
                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeBidText(status)}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <a
                        class="btn btn-sm btn-outline-secondary"
                        href="tender-details.html?id=${bid.tender_id}"
                    >
                        View
                    </a>

                    ${editButton}
                    ${cancelButton}
                </div>
            </td>
        </tr>
    `;
}

// Display bid table rows
function displayBids(bids) {
    resultCount.textContent =
        `${bids.length} bid${bids.length === 1 ? '' : 's'} found`;

    if (bids.length === 0) {
        bidTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <h3 class="h5">No bids found</h3>

                    <p class="mb-3">
                        You have not submitted a matching bid.
                    </p>

                    <a
                        href="tenders.html"
                        class="btn btn-eztends"
                    >
                        Browse Tenders
                    </a>
                </td>
            </tr>
        `;

        return;
    }

    bidTableBody.innerHTML = bids
        .map(createBidRow)
        .join('');
}

// Update summary card values
function updateSummary() {
    const activeBids = allBids.filter(function (bid) {
        const status = getBidStatus(bid);

        return (
            status === 'SUBMITTED' ||
            status === 'UPDATED'
        );
    });

    const approvedBids = allBids.filter(function (bid) {
        return getBidStatus(bid) === 'APPROVED';
    });

    const cancelledBids = allBids.filter(function (bid) {
        return getBidStatus(bid) === 'CANCELLED';
    });

    document.getElementById(
        'totalBidCount'
    ).textContent = allBids.length;

    document.getElementById(
        'activeBidCount'
    ).textContent = activeBids.length;

    document.getElementById(
        'approvedBidCount'
    ).textContent = approvedBids.length;

    document.getElementById(
        'cancelledBidCount'
    ).textContent = cancelledBids.length;
}

// Apply search and status filters
function applyFilters() {
    const searchText = searchInput.value
        .trim()
        .toLowerCase();

    const selectedStatus = statusFilter.value;

    const filteredBids = allBids.filter(function (bid) {
        const title = getTenderTitle(bid).toLowerCase();

        const matchesSearch =
            title.includes(searchText);

        const matchesStatus =
            selectedStatus === 'ALL' ||
            getBidStatus(bid) === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    displayBids(filteredBids);
}

// Clear filters
function clearFilters() {
    searchInput.value = '';
    statusFilter.value = 'ALL';

    displayBids(allBids);
}

// Find one bid from loaded bids
function findBid(bidId) {
    return allBids.find(function (bid) {
        return Number(bid.bid_id) === Number(bidId);
    });
}

// Open Edit Bid modal
function openEditBid(bidId) {
    const bid = findBid(bidId);

    if (!bid || !canChangeBid(bid)) {
        showPopup(
            'Update Not Allowed',
            'This bid cannot be updated.',
            'warning'
        );

        return;
    }

    editBidIdInput.value = bid.bid_id;
    editAmountInput.value = bid.amount;
    editTenderTitle.textContent =
        getTenderTitle(bid);

    editAmountInput.classList.remove(
        'is-invalid'
    );
    editAmountInput.classList.remove(
        'is-valid'
    );

    document.getElementById(
        'editAmountError'
    ).textContent = '';

    // Clear newly selected proposal
    editProposalFileInput.value = '';

    editProposalFileInput.classList.remove(
        'is-invalid'
    );
    editProposalFileInput.classList.remove(
        'is-valid'
    );

    document.getElementById(
        'editProposalFileError'
    ).textContent = '';

    // Display current proposal
    if (bid.proposal_file) {
        currentProposalArea.classList.remove(
            'd-none'
        );

        currentProposalLink.href =
            getProposalUrl(bid.proposal_file);
    } else {
        currentProposalArea.classList.add(
            'd-none'
        );

        currentProposalLink.removeAttribute(
            'href'
        );
    }

    editBidModal.show();
}

// Validate changed amount
function validateEditAmount() {
    const amount = Number(editAmountInput.value);

    if (
        !editAmountInput.value ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        editAmountInput.classList.remove(
            'is-valid'
        );
        editAmountInput.classList.add(
            'is-invalid'
        );

        document.getElementById(
            'editAmountError'
        ).textContent =
            'Enter a valid amount greater than zero.';

        return false;
    }

    editAmountInput.classList.remove(
        'is-invalid'
    );
    editAmountInput.classList.add(
        'is-valid'
    );

    document.getElementById(
        'editAmountError'
    ).textContent = '';

    return true;
}

// Open Cancel Bid modal
function openCancelBid(bidId) {
    const bid = findBid(bidId);

    if (!bid || !canChangeBid(bid)) {
        showPopup(
            'Cancellation Not Allowed',
            'This bid cannot be cancelled.',
            'warning'
        );

        return;
    }

    cancelBidIdInput.value = bid.bid_id;
    cancelTenderTitle.textContent =
        getTenderTitle(bid);

    cancelBidModal.show();
}

// Update bid amount and optional proposal
editBidForm.addEventListener(
    'submit',
    async function (event) {
        event.preventDefault();

        const amountValid = validateEditAmount();
        const fileValid =
            validateEditProposalFile();

        if (!amountValid || !fileValid) {
            return;
        }

        const bidId = editBidIdInput.value;

        // Use FormData because a file may be uploaded
        const formData = new FormData();

        formData.append(
            'amount',
            editAmountInput.value
        );

        // Add file only when Supplier selects one
        if (editProposalFileInput.files[0]) {
            formData.append(
                'proposal_file',
                editProposalFileInput.files[0]
            );
        }

        saveBidButton.disabled = true;
        saveBidButton.textContent = 'Saving...';

        try {
            const response = await fetch(
                `/api/bids/${bidId}`,
                {
                    method: 'PUT',

                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Update Failed',
                    data.message ||
                        'Unable to update the bid.',
                    'danger'
                );

                return;
            }

            editBidModal.hide();

            showPopup(
                'Bid Updated',
                'Your bid and proposal details were updated successfully.',
                'success'
            );

            // Reload updated bids
            await loadMyBids();

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );
        } finally {
            saveBidButton.disabled = false;
            saveBidButton.textContent =
                'Save Changes';
        }
    }
);

// Cancel bid
confirmCancelButton.addEventListener(
    'click',
    async function () {
        const bidId = cancelBidIdInput.value;

        confirmCancelButton.disabled = true;
        confirmCancelButton.textContent =
            'Cancelling...';

        try {
            const response = await fetch(
                `/api/bids/${bidId}`,
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
                        'Unable to cancel the bid.',
                    'danger'
                );

                return;
            }

            cancelBidModal.hide();

            showPopup(
                'Bid Cancelled',
                'Your bid and proposal document were cancelled successfully.',
                'success'
            );

            // Reload updated bids
            await loadMyBids();

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
                'Cancel Bid';
        }
    }
);

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
            'Only Suppliers can view this page.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Load logged Supplier bids
async function loadMyBids() {
    try {
        const response = await fetch(
            '/api/bids/my-bids',
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
                    'Unable to load your bids'
            );
        }

        allBids = getBidArray(data);

        updateSummary();
        applyFilters();

    } catch (error) {
        resultCount.textContent =
            'Unable to load bids';

        bidTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <h3 class="h5">
                        Could not load your bids
                    </h3>

                    <p class="mb-0">
                        ${escapeBidText(error.message)}
                    </p>
                </td>
            </tr>
        `;
    }
}

// Search and filter events
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

// Edit validation events
editAmountInput.addEventListener(
    'input',
    validateEditAmount
);

editProposalFileInput.addEventListener(
    'change',
    validateEditProposalFile
);

// Start page
if (checkSupplierAccess()) {
    loadMyBids();
}