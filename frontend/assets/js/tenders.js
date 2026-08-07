// Tender listing page

const tenderList = document.getElementById('tenderList');
const resultCount = document.getElementById('resultCount');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const createTenderButton = document.getElementById('createTenderButton');
const pageMessage = document.getElementById('pageMessage');

let allTenders = [];

// Protect text added to HTML
function escapeText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Format date
function formatDate(value) {
    if (!value) return 'Not available';

    const datePart = String(value).split('T')[0];
    const parts = datePart.split('-');

    if (parts.length !== 3) return value;

    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format budget
function formatBudget(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return 'Not specified';

    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR'
    }).format(amount);
}

// Shorten description
function shortDescription(value) {
    const text = String(value || 'No description available.');

    if (text.length <= 130) return text;

    return text.substring(0, 130) + '...';
}

// Remaining days
function getRemainingDays(closeDate) {
    if (!closeDate) return 'No closing date';

    const datePart = String(closeDate).split('T')[0];
    const closingDate = new Date(datePart + 'T23:59:59');
    const difference = closingDate - new Date();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (difference < 0) return 'Expired';
    if (days === 0) return 'Closes today';
    if (days < 0) return 'Closed';
    if (days === 0) return 'Closes today';
    if (days === 1) return '1 day remaining';

    return days + ' days remaining';
}

// // Check whether an open tender has expired
// function isTenderExpired(tender) {
//     if (!tender.close_date) {
//         return false;
//     }

//     const datePart = String(tender.close_date).split('T')[0];
//     const closingDate = new Date(`${datePart}T23:59:59`);

//     return Date.now() > closingDate.getTime();
// }

// Status badge class
function getStatusClass(status) {
    if (status === 'OPEN') return 'status-open';
    if (status === 'EXPIRED') return 'status-expired';
    if (status === 'AWARDED') return 'status-awarded';
    if (status === 'CLOSED') return 'status-closed';
    if (status === 'CANCELLED') return 'status-cancelled';

    return 'status-pending';
}

// Read possible API response formats
function getTenderArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.tenders)) return data.tenders;
    if (Array.isArray(data.data)) return data.data;

    return [];
}

// Create one tender card
function createTenderCard(tender) {
    const authorityName =
        tender.created_by_name ||
        tender.authority_name ||
        'Tendering Authority';

    const status = tender.status || 'DRAFT';
    const remainingText = getRemainingDays(tender.close_date);
    const isExpired = remainingText === 'Expired';

    return `
        <div class="col-md-6 col-xl-4">
            <article class="tender-card">
                <div class="tender-card-body">
                    <span class="tender-category">
                        ${escapeText(tender.category_name || 'General')}
                    </span>

                    <h3 class="tender-title">
                        ${escapeText(tender.title)}
                    </h3>

                    <p class="tender-description">
                        ${escapeText(shortDescription(tender.description))}
                    </p>

                    <div class="tender-info">
                        <span><strong>Budget:</strong> ${escapeText(formatBudget(tender.budget))}</span>
                        <span><strong>Opening:</strong> ${escapeText(formatDate(tender.open_date))}</span>
                        <span><strong>Closing:</strong> ${escapeText(formatDate(tender.close_date))}</span>
                        <span><strong>Published By:</strong> ${escapeText(authorityName)}</span>
                    </div>

                    <a
                        href="tender-details.html?id=${tender.tender_id}"
                        class="btn btn-outline-eztends w-100"
                    >
                        View Tender Details
                    </a>
                </div>

                <footer class="tender-footer ${
                    status === 'EXPIRED'
                        ? 'expired-footer'
                        : ''
                }">
                    ${
                        status === 'EXPIRED'
                            ? `
                                <span class="status-badge status-expired">
                                    EXPIRED
                                </span>
                            `
                            : `
                                <span class="status-badge ${getStatusClass(status)}">
                                    ${escapeText(status)}
                                </span>

                                <span class="days-left">
                                    ${escapeText(
                                        getRemainingDays(tender.close_date)
                                    )}
                                </span>
                            `
                    }
                </footer>
            </article>
        </div>
    `;
}

// Show tender cards
function displayTenders(tenders) {
    resultCount.textContent =
        tenders.length + (tenders.length === 1 ? ' tender found' : ' tenders found');

    if (tenders.length === 0) {
        tenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">No tenders found</h3>
                    <p class="mb-0">Try changing the search or filters.</p>
                </div>
            </div>
        `;
        return;
    }

    tenderList.innerHTML = tenders.map(createTenderCard).join('');
}

// Load all categories from database
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');

        const data = await response.json();

        if (!response.ok) {
            throw new Error('Unable to load categories');
        }

        const categories = data.categories || [];

        categories.forEach(function (category) {
            const option = document.createElement('option');

            option.value = category.category_name;
            option.textContent = category.category_name;

            categoryFilter.appendChild(option);
        });

    } catch (error) {
        console.log(error);
    }
}

// Search and filter tenders
function applyFilters() {
    const searchText = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const status = statusFilter.value;

    const filtered = allTenders.filter(function (tender) {
        const title = String(tender.title || '').toLowerCase();
        const description = String(tender.description || '').toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);

        const matchesCategory =
            category === 'ALL' ||
            tender.category_name === category;

        const matchesStatus =
            status === 'ALL' ||
            tender.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    displayTenders(filtered);
}

// Clear all filters
function clearFilters() {
    searchInput.value = '';
    categoryFilter.value = 'ALL';
    statusFilter.value = 'ALL';

    displayTenders(allTenders);
}

// Show Create Tender button for authority
function checkAuthorityUser() {
    try {
        const savedUser = localStorage.getItem('user');
        const user = savedUser ? JSON.parse(savedUser) : null;

        if (user && user.type === 'TENDERING_AUTHORITY') {
            createTenderButton.classList.remove('d-none');
        }
    } catch (error) {
        createTenderButton.classList.add('d-none');
    }
}

// Load tenders from backend
async function loadTenders() {
    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }

    try {
        const response = await fetch('/api/tenders', {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load tenders');
        }

        allTenders = getTenderArray(data);

        displayTenders(allTenders);

    } catch (error) {
        resultCount.textContent = 'Unable to load tenders';

        pageMessage.innerHTML = `
            <div class="alert alert-warning">
                ${escapeText(error.message)}
            </div>
        `;

        tenderList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <h3 class="h5">Could not load tenders</h3>
                    <p class="mb-0">Check whether the backend server is running.</p>
                </div>
            </div>
        `;
    }
}

searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);
clearFiltersButton.addEventListener('click', clearFilters);

checkAuthorityUser();
loadCategories();
loadTenders();
