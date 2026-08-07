// Tender Bids page

const bidTableBody = document.getElementById('bidTableBody');
const resultCount = document.getElementById('resultCount');
const selectionNote = document.getElementById('selectionNote');
const selectedBidIdInput = document.getElementById('selectedBidId');
const confirmSelectButton = document.getElementById('confirmSelectButton');
const tenderIdFromUrl = new URLSearchParams(window.location.search).get('tender_id');

const selectSupplierModal = new bootstrap.Modal(
    document.getElementById('selectSupplierModal')
);

let currentTender = null;
let allBids = [];

// Protect text in HTML
function escapeBidText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read bid arrays
function getBidArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.bids)) return data.bids;
    if (Array.isArray(data.data)) return data.data;
    return [];
}

// Read tender object
function getTenderFromResponse(data) {
    return data.tender || data.data || data;
}

// Format money
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

// Format date and time
function formatDateTime(dateValue) {
    if (!dateValue) return 'Not available';

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

// Format date only
function formatDate(dateValue) {
    if (!dateValue) return 'Not available';

    const datePart = String(dateValue).split('T')[0];
    const parts = datePart.split('-');

    if (parts.length !== 3) return dateValue;

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

// Convert saved file path to URL
function getProposalUrl(filePath) {
    if (!filePath) return '';

    const cleanPath = String(filePath)
        .replaceAll('\\', '/')
        .replace(/^\/+/, '');

    return `/${cleanPath}`;
}

// Get bid status
function getBidStatus(bid) {
    return bid.bid_status || bid.status || 'SUBMITTED';
}

// Get bid status style
function getBidStatusClass(status) {
    if (status === 'APPROVED') return 'status-approved';
    if (status === 'REJECTED') return 'status-rejected';
    if (status === 'CANCELLED') return 'status-cancelled';
    if (status === 'UPDATED') return 'status-updated';
    return 'status-submitted';
}

// Get tender status style
function getTenderStatusClass(status) {
    if (status === 'OPEN') return 'status-open';
    if (status === 'CLOSED') return 'status-closed';
    if (status === 'AWARDED') return 'status-awarded';
    return 'status-draft';
}

// Check active bid
function isActiveBid(bid) {
    const status = getBidStatus(bid);
    return status === 'SUBMITTED' || status === 'UPDATED';
}

// Check selection permission
function canSelectBid(bid) {
    return currentTender &&
        currentTender.status === 'CLOSED' &&
        isActiveBid(bid);
}

// Check Authority access
function checkAuthorityAccess() {
    if (!checkAuth()) return false;

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'TENDERING_AUTHORITY') {
        showPopup(
            'Access Denied',
            'Only Tendering Authorities can view tender bids.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Show tender details
function displayTender() {
    document.getElementById('tenderTitle').textContent =
        currentTender.title || 'Tender';

    document.getElementById('tenderIdText').textContent =
        currentTender.tender_id || tenderIdFromUrl;

    document.getElementById('tenderCloseDate').textContent =
        formatDate(currentTender.close_date);

    document.getElementById('tenderBudget').textContent =
        formatAmount(currentTender.budget);

    const badge = document.getElementById('tenderStatus');
    badge.textContent = currentTender.status || 'DRAFT';
    badge.className = `status-badge ${getTenderStatusClass(currentTender.status)}`;

    updateSelectionNote();
}

// Show selection rules
function updateSelectionNote() {
    if (currentTender.status === 'OPEN') {
        selectionNote.className = 'selection-note open mb-4';
        selectionNote.innerHTML =
            '<strong>Tender is still open.</strong> Close it before selecting a winning Supplier.';
        return;
    }

    if (currentTender.status === 'CLOSED') {
        selectionNote.className = 'selection-note closed mb-4';
        selectionNote.innerHTML =
            '<strong>Tender is closed.</strong> You can now select the winning Supplier.';
        return;
    }

    selectionNote.className = 'selection-note locked mb-4';
    selectionNote.innerHTML =
        '<strong>Selection is locked.</strong> Draft, awarded or cancelled tenders cannot select a bid.';
}

// Create one bid row
function createBidRow(bid) {
    const status = getBidStatus(bid);

    const proposalButton = bid.proposal_file
        ? `<a href="${escapeBidText(getProposalUrl(bid.proposal_file))}"
              target="_blank" rel="noopener"
              class="btn btn-sm btn-outline-secondary">View Proposal</a>`
        : '<span class="text-muted">No file</span>';

    const selectButton = canSelectBid(bid)
        ? `<button type="button" class="btn btn-sm btn-eztends"
              onclick="openSelectSupplier(${bid.bid_id})">Select Supplier</button>`
        : '<span class="text-muted">Not available</span>';

    return `
        <tr>
            <td>
                <div class="supplier-name">${escapeBidText(bid.supplier_name || 'Supplier')}</div>
                <div class="company-name">${escapeBidText(bid.company_name || 'Company not available')}</div>
            </td>
            <td>${escapeBidText(bid.supplier_email || 'Not available')}</td>
            <td class="bid-amount">${escapeBidText(formatAmount(bid.amount))}</td>
            <td>${proposalButton}</td>
            <td>${escapeBidText(formatDateTime(bid.submitted_at))}</td>
            <td><span class="status-badge ${getBidStatusClass(status)}">${escapeBidText(status)}</span></td>
            <td>${selectButton}</td>
        </tr>
    `;
}

// Show bid rows
function displayBids() {
    resultCount.textContent =
        `${allBids.length} bid${allBids.length === 1 ? '' : 's'} received`;

    if (allBids.length === 0) {
        bidTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <h3 class="h5">No bids received</h3>
                    <p class="mb-0">Supplier bids will appear here after submission.</p>
                </td>
            </tr>
        `;
        return;
    }

    bidTableBody.innerHTML = allBids.map(createBidRow).join('');
}

// Update summary cards
function updateSummary() {
    const activeBids = allBids.filter(isActiveBid);
    const approvedBids = allBids.filter(
        bid => getBidStatus(bid) === 'APPROVED'
    );

    const amounts = activeBids
        .map(bid => Number(bid.amount))
        .filter(amount => Number.isFinite(amount));

    const lowest = amounts.length ? Math.min(...amounts) : null;

    document.getElementById('totalBidCount').textContent = allBids.length;
    document.getElementById('activeBidCount').textContent = activeBids.length;
    document.getElementById('selectedBidCount').textContent = approvedBids.length;
    document.getElementById('lowestBidAmount').textContent =
        lowest === null ? '-' : formatAmount(lowest);
}

// Find bid by ID
function findBid(bidId) {
    return allBids.find(
        bid => Number(bid.bid_id) === Number(bidId)
    );
}

// Open selection modal
function openSelectSupplier(bidId) {
    const bid = findBid(bidId);

    if (!bid || !canSelectBid(bid)) {
        showPopup(
            'Selection Not Allowed',
            'This bid cannot be selected.',
            'warning'
        );
        return;
    }

    selectedBidIdInput.value = bid.bid_id;
    document.getElementById('selectedSupplierName').textContent =
        bid.supplier_name || 'Supplier';
    document.getElementById('selectedCompanyName').textContent =
        bid.company_name || 'Not available';
    document.getElementById('selectedBidAmount').textContent =
        formatAmount(bid.amount);

    selectSupplierModal.show();
}

// Select winning Supplier
confirmSelectButton.addEventListener('click', async function () {
    const bidId = selectedBidIdInput.value;

    confirmSelectButton.disabled = true;
    confirmSelectButton.textContent = 'Selecting...';

    try {
        const response = await fetch(`/api/bids/${bidId}/select`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Selection Failed',
                data.message || 'Unable to select the Supplier.',
                'danger'
            );
            return;
        }

        selectSupplierModal.hide();

        showPopup(
            'Supplier Selected',
            'The winning Supplier was selected and the tender was awarded.',
            'success'
        );

        await loadPageData();

    } catch (error) {
        console.log(error);

        showPopup(
            'Server Connection Error',
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        confirmSelectButton.disabled = false;
        confirmSelectButton.textContent = 'Select Supplier';
    }
});

// Load tender details
async function loadTender() {
    const response = await fetch(`/api/tenders/${tenderIdFromUrl}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to load tender');
    }

    currentTender = getTenderFromResponse(data);

    const user = getUser();

    if (
        currentTender.created_by !== undefined &&
        Number(currentTender.created_by) !== Number(user.user_id)
    ) {
        throw new Error('You do not have permission to view these bids');
    }

    displayTender();
}

// Load Supplier bids
async function loadBids() {
    const response = await fetch(
        `/api/bids/tender/${tenderIdFromUrl}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to load tender bids');
    }

    allBids = getBidArray(data);
    updateSummary();
    displayBids();
}

// Load full page
async function loadPageData() {
    try {
        await loadTender();
        await loadBids();

    } catch (error) {
        console.log(error);

        resultCount.textContent = 'Unable to load bids';
        bidTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <h3 class="h5">Could not load tender bids</h3>
                    <p class="mb-3">${escapeBidText(error.message)}</p>
                    <a href="my-tenders.html" class="btn btn-eztends">Back to My Tenders</a>
                </td>
            </tr>
        `;
    }
}

// Start page
if (checkAuthorityAccess()) {
    if (!tenderIdFromUrl) {
        showPopup(
            'Tender Not Selected',
            'Select a tender from the My Tenders page.',
            'warning',
            'my-tenders.html'
        );
    } else {
        loadPageData();
    }
}
