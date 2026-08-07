// Admin Users page

const userTableBody =
    document.getElementById('userTableBody');

const resultCount =
    document.getElementById('resultCount');

const searchInput =
    document.getElementById('searchInput');

const typeFilter =
    document.getElementById('typeFilter');

const clearFiltersButton =
    document.getElementById('clearFiltersButton');

const userDetailsBody =
    document.getElementById('userDetailsBody');

const userDetailsModal = new bootstrap.Modal(
    document.getElementById('userDetailsModal')
);

const editUserForm =
    document.getElementById('editUserForm');

const editUserModal = new bootstrap.Modal(
    document.getElementById('editUserModal')
);

const statusUserIdInput =
    document.getElementById('statusUserId');

const newAccountStatusInput =
    document.getElementById('newAccountStatus');

const statusModalTitle =
    document.getElementById('statusModalTitle');

const statusConfirmMessage =
    document.getElementById('statusConfirmMessage');

const statusAdminPasswordInput =
    document.getElementById('statusAdminPassword');

const confirmStatusButton =
    document.getElementById('confirmStatusButton');

const statusUserModal = new bootstrap.Modal(
    document.getElementById('statusUserModal')
);

const saveUserButton =
    document.getElementById('saveUserButton');

const editUserNameInput =
    document.getElementById('editUserName');

const editUserEmailInput =
    document.getElementById('editUserEmail');

let allUsers = [];

// Protect text in HTML
function escapeUserText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Read user arrays
function getUserArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.users)) {
        return data.users;
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

// Get account type text
function getTypeText(type) {
    if (type === 'TENDERING_AUTHORITY') {
        return 'Tendering Authority';
    }

    if (type === 'SUPPLIER') {
        return 'Supplier';
    }

    if (type === 'ADMIN') {
        return 'Administrator';
    }

    return type || 'Unknown';
}

// Get account type style
function getTypeClass(type) {
    if (type === 'ADMIN') {
        return 'type-admin';
    }

    if (type === 'TENDERING_AUTHORITY') {
        return 'type-authority';
    }

    return 'type-supplier';
}

// Get organization or company
function getOrganization(user) {
    return (
        user.company_name ||
        user.organization_name ||
        user.admin_level ||
        'Not available'
    );
}

// Find user by ID
function findUser(userId) {
    return allUsers.find(function (user) {
        return Number(user.user_id) === Number(userId);
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
    const suppliers = allUsers.filter(function (user) {
        return user.type === 'SUPPLIER';
    });

    const authorities = allUsers.filter(function (user) {
        return user.type === 'TENDERING_AUTHORITY';
    });

    const admins = allUsers.filter(function (user) {
        return user.type === 'ADMIN';
    });

    document.getElementById('totalUserCount').textContent =
        allUsers.length;

    document.getElementById('supplierCount').textContent =
        suppliers.length;

    document.getElementById('authorityCount').textContent =
        authorities.length;

    document.getElementById('adminCount').textContent =
        admins.length;
}

// Create one user row
function createUserRow(user) {
    const accountStatus = user.account_status || 'ACTIVE';
    const isAdminAccount = user.type === 'ADMIN';

    const loggedUser = getUser();

    const loggedAdmin = allUsers.find(
        function (item) {
            return Number(item.user_id) ===
                Number(loggedUser.user_id);
        }
    );

    const loggedAdminLevel =
        loggedAdmin
            ? loggedAdmin.admin_level
            : 'ADMIN';

    const isSuperAdminAccount =
        user.type === 'ADMIN' &&
        user.admin_level === 'SUPER_ADMIN';

    const cannotEditSuperAdmin =
        loggedAdminLevel === 'ADMIN' &&
        isSuperAdminAccount;

    const editButton = cannotEditSuperAdmin
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                disabled
                title="Only a Super Administrator can edit this account"
            >
                Edit
            </button>
        `
        : `
            <button
                type="button"
                class="btn btn-sm btn-outline-eztends"
                onclick="openEditUser(${user.user_id})"
            >
                Edit
            </button>
        `;

    // Admin accounts cannot be activated or deactivated
    const statusButton = isAdminAccount
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                disabled
                title="Administrator accounts are protected"
            >
                Protected
            </button>
        `
        : accountStatus === 'INACTIVE'
            ? `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-success"
                    onclick="changeAccountStatus(
                        ${user.user_id},
                        'ACTIVE'
                    )"
                >
                    Activate
                </button>
            `
            : `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="changeAccountStatus(
                        ${user.user_id},
                        'INACTIVE'
                    )"
                >
                    Deactivate
                </button>
            `;

    return `
        <tr>
            <td>
                <div class="user-name">
                    ${escapeUserText(user.name)}
                </div>

                <div class="user-email">
                    ${escapeUserText(user.email)}
                </div>

                <div class="small text-muted mt-1">
                    User ID:
                    ${escapeUserText(user.user_id)}
                </div>
            </td>

            <td>
                <span
                    class="type-badge ${getTypeClass(user.type)}"
                >
                    ${escapeUserText(
                        getTypeText(user.type)
                    )}
                </span>
            </td>

            <td>
                ${escapeUserText(
                    getOrganization(user)
                )}
            </td>

            <td>
                ${
                    accountStatus === 'ACTIVE'
                        ? `
                            <span class="status-badge status-approved">
                                ACTIVE
                            </span>
                        `
                        : `
                            <span class="status-badge status-rejected">
                                INACTIVE
                            </span>
                        `
                }
            </td>

            <td>
                ${escapeUserText(
                    formatDate(user.created_at)
                )}
            </td>

            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        onclick="openUserDetails(${user.user_id})"
                    >
                        View
                    </button>

                    ${editButton}
                    ${statusButton}
                </div>
            </td>
        </tr>
    `;
}

// Display users
function displayUsers(users) {
    resultCount.textContent =
        `${users.length} user${users.length === 1 ? '' : 's'} found`;

    if (users.length === 0) {
        userTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <h3 class="h5">No users found</h3>

                    <p class="mb-0">
                        No user accounts match the selected filters.
                    </p>
                </td>
            </tr>
        `;

        return;
    }

    userTableBody.innerHTML = users
        .map(createUserRow)
        .join('');
}

// Apply search and type filter
function applyFilters() {
    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedType =
        typeFilter.value;

    const filteredUsers = allUsers.filter(
        function (user) {
            const name =
                String(user.name || '').toLowerCase();

            const email =
                String(user.email || '').toLowerCase();

            const matchesSearch =
                name.includes(searchText) ||
                email.includes(searchText);

            const matchesType =
                selectedType === 'ALL' ||
                user.type === selectedType;

            return matchesSearch && matchesType;
        }
    );

    displayUsers(filteredUsers);
}

// Clear filters
function clearFilters() {
    searchInput.value = '';
    typeFilter.value = 'ALL';

    displayUsers(allUsers);
}

// Create one detail row
function createDetailRow(label, value) {
    return `
        <div class="detail-row">
            <span class="detail-label">
                ${escapeUserText(label)}
            </span>

            <span class="detail-value">
                ${escapeUserText(value || 'Not available')}
            </span>
        </div>
    `;
}

// Open user details
function openUserDetails(userId) {
    const user = findUser(userId);

    if (!user) {
        return;
    }

    let roleDetails = '';

    if (user.type === 'SUPPLIER') {
        roleDetails += createDetailRow(
            'Company Name',
            user.company_name
        );

        roleDetails += createDetailRow(
            'Business Registration No',
            user.business_reg_no
        );

        roleDetails += createDetailRow(
            'Tax ID',
            user.tax_id
        );
    }

    if (user.type === 'TENDERING_AUTHORITY') {
        roleDetails += createDetailRow(
            'Organization Name',
            user.organization_name
        );

        roleDetails += createDetailRow(
            'Registration Number',
            user.registration_no
        );

        roleDetails += createDetailRow(
            'Address',
            user.address
        );
    }

    if (user.type === 'ADMIN') {
        roleDetails += createDetailRow(
            'Admin Level',
            user.admin_level
        );
    }

    userDetailsBody.innerHTML =
        createDetailRow('User ID', user.user_id) +
        createDetailRow('Name', user.name) +
        createDetailRow('Email', user.email) +
        createDetailRow(
            'Account Type',
            getTypeText(user.type)
        ) +
        roleDetails +
        createDetailRow(
            'Account Status',
            user.account_status
        ) +
        createDetailRow(
            'Registered Date',
            formatDate(user.created_at)
        );

    userDetailsModal.show();
}

// Open Edit User modal
function openEditUser(userId) {
    const user = findUser(userId);

    if (!user) {
        return;
    }

    document.getElementById('editUserId').value =
        user.user_id;

    document.getElementById('editUserName').value =
        user.name || '';

    document.getElementById('editUserEmail').value =
        user.email || '';

    const supplierFields =
        document.getElementById('supplierEditFields');

    const authorityFields =
        document.getElementById('authorityEditFields');

    supplierFields.classList.add('d-none');
    authorityFields.classList.add('d-none');

    if (user.type === 'SUPPLIER') {
        supplierFields.classList.remove('d-none');

        document.getElementById('editCompanyName').value =
            user.company_name || '';

        document.getElementById('editBusinessRegNo').value =
            user.business_reg_no || '';

        document.getElementById('editTaxId').value =
            user.tax_id || '';
    }

    if (user.type === 'TENDERING_AUTHORITY') {
        authorityFields.classList.remove('d-none');

        document.getElementById(
            'editOrganizationName'
        ).value = user.organization_name || '';

        document.getElementById(
            'editRegistrationNo'
        ).value = user.registration_no || '';

        document.getElementById('editAddress').value =
            user.address || '';
    }

    editUserModal.show();
}


// Open activate/deactivate confirmation modal
function changeAccountStatus(userId, newStatus) {
    const user = findUser(userId);

    if (!user) {
        return;
    }

    const isDeactivate =
        newStatus === 'INACTIVE';

    statusUserIdInput.value =
        user.user_id;

    newAccountStatusInput.value =
        newStatus;

    statusModalTitle.textContent =
        isDeactivate
            ? 'Deactivate Account'
            : 'Activate Account';

    statusConfirmMessage.textContent =
        isDeactivate
            ? `Are you sure you want to deactivate ${user.name}'s account?`
            : `Are you sure you want to activate ${user.name}'s account?`;

    confirmStatusButton.textContent =
        isDeactivate
            ? 'Deactivate Account'
            : 'Activate Account';

    if (isDeactivate) {
        confirmStatusButton.className =
            'btn btn-danger';
    } else {
        confirmStatusButton.className =
            'btn btn-success';
    }

    // Clear previous password
    statusAdminPasswordInput.value = '';

    statusAdminPasswordInput.classList.remove(
        'is-invalid'
    );

    document.getElementById(
        'statusAdminPasswordError'
    ).textContent = '';

    statusUserModal.show();
}

// Confirm account status change
confirmStatusButton.addEventListener(
    'click',
    async function () {
        const userId =
            statusUserIdInput.value;

        const newStatus =
            newAccountStatusInput.value;

        const adminPassword =
            statusAdminPasswordInput.value;

        // Admin password required
        if (!adminPassword) {
            statusAdminPasswordInput.classList.add(
                'is-invalid'
            );

            document.getElementById(
                'statusAdminPasswordError'
            ).textContent =
                'Enter your Admin password.';

            return;
        }

        statusAdminPasswordInput.classList.remove(
            'is-invalid'
        );

        document.getElementById(
            'statusAdminPasswordError'
        ).textContent = '';

        confirmStatusButton.disabled = true;

        confirmStatusButton.textContent =
            newStatus === 'INACTIVE'
                ? 'Deactivating...'
                : 'Activating...';

        try {
            const response = await fetch(
                `/api/admin/users/${userId}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        account_status:
                            newStatus,

                        admin_password:
                            adminPassword
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                showPopup(
                    'Account Update Failed',
                    data.message ||
                        'Unable to update account.',
                    'danger'
                );

                return;
            }

            statusUserModal.hide();

            showPopup(
                'Account Updated',
                data.message,
                'success'
            );

            await loadUsers();

        } catch (error) {
            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );

        } finally {
            confirmStatusButton.disabled =
                false;

            confirmStatusButton.textContent =
                'Confirm';
        }
    }
);


// Load all users
async function loadUsers() {
    try {
        const response = await fetch(
            '/api/admin/users',
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
                'Unable to load users'
            );
        }

        allUsers = getUserArray(data);

        updateSummary();
        applyFilters();

    } catch (error) {
        console.log(error);

        resultCount.textContent =
            'Unable to load users';

        userTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <h3 class="h5">
                        Could not load users
                    </h3>

                    <p class="mb-0">
                        ${escapeUserText(
                            error.message
                        )}
                    </p>
                </td>
            </tr>
        `;
    }
}


// Update user details
editUserForm.addEventListener(
    'submit',
    async function (event) {
        event.preventDefault();

        const userId =
            document.getElementById(
                'editUserId'
            ).value;

        const user = findUser(userId);

        if (!user) {
            return;
        }

        const name =
            editUserNameInput.value.trim();

        const email =
            editUserEmailInput.value.trim();

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate name
        if (name.length < 3) {
            showPopup(
                'Validation Error',
                'Name must contain at least 3 characters.',
                'warning'
            );

            return;
        }

        // Validate email
        if (!emailPattern.test(email)) {
            showPopup(
                'Validation Error',
                'Enter a valid email address.',
                'warning'
            );

            return;
        }

        const userData = {
            name: name,
            email: email
        };

        // Supplier fields
        if (user.type === 'SUPPLIER') {
            userData.company_name =
                document.getElementById(
                    'editCompanyName'
                ).value.trim();

            userData.business_reg_no =
                document.getElementById(
                    'editBusinessRegNo'
                ).value.trim();

            userData.tax_id =
                document.getElementById(
                    'editTaxId'
                ).value.trim();
        }

        // Authority fields
        if (
            user.type ===
            'TENDERING_AUTHORITY'
        ) {
            userData.organization_name =
                document.getElementById(
                    'editOrganizationName'
                ).value.trim();

            userData.registration_no =
                document.getElementById(
                    'editRegistrationNo'
                ).value.trim();

            userData.address =
                document.getElementById(
                    'editAddress'
                ).value.trim();
        }

        saveUserButton.disabled = true;
        saveUserButton.textContent =
            'Saving...';

        try {
            const response = await fetch(
                `/api/admin/users/${userId}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify(
                        userData
                    )
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showPopup(
                    'Update Failed',
                    data.message ||
                        'Unable to update the user.',
                    'danger'
                );

                return;
            }

            // Update local data if Admin edited own account
            const loggedUser = getUser();

            if (
                Number(userId) ===
                Number(loggedUser.user_id)
            ) {
                loggedUser.name = name;
                loggedUser.email = email;

                localStorage.setItem(
                    'user',
                    JSON.stringify(loggedUser)
                );
            }

            editUserModal.hide();

            showPopup(
                'User Updated',
                'The user details were updated successfully.',
                'success'
            );

            await loadUsers();

        } catch (error) {
            console.log(error);

            showPopup(
                'Server Connection Error',
                'Cannot connect to the local server.',
                'danger'
            );

        } finally {
            saveUserButton.disabled = false;
            saveUserButton.textContent =
                'Save Changes';
        }
    }
);

// Filter events
searchInput.addEventListener(
    'input',
    applyFilters
);

typeFilter.addEventListener(
    'change',
    applyFilters
);

clearFiltersButton.addEventListener(
    'click',
    clearFilters
);

// Start page
if (checkAdminAccess()) {
    loadUsers();
}
