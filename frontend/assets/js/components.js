// Shared navbar and footer for EzTends

function getLoggedUser() {
    try {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        return null;
    }
}

function escapeText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function navLink(label, href, pageName, currentPage) {
    const activeClass = pageName === currentPage ? ' active' : '';
    const currentAttribute = pageName === currentPage ? ' aria-current="page"' : '';

    return `
        <li class="nav-item">
            <a class="nav-link${activeClass}" href="${href}"${currentAttribute}>
                ${label}
            </a>
        </li>
    `;
}

function getDashboardPage(userType) {
    if (userType === 'ADMIN') return 'admin-dashboard.html';
    if (userType === 'TENDERING_AUTHORITY') return 'authority-dashboard.html';
    return 'supplier-dashboard.html';
}

function getRoleMenu(user) {
    if (user.type === 'ADMIN') {
        return `
            <li><a class="dropdown-item" href="admin-dashboard.html">Dashboard</a></li>
            <li><a class="dropdown-item" href="admin-users.html">Manage Users</a></li>
            <li><a class="dropdown-item" href="admin-documents.html">Validate Documents</a></li>
            <li><a class="dropdown-item" href="admin-reports.html">Reports</a></li>
        `;
    }

    if (user.type === 'TENDERING_AUTHORITY') {
        return `
            <li><a class="dropdown-item" href="authority-dashboard.html">Dashboard</a></li>
            <li><a class="dropdown-item" href="create-tender.html">Create Tender</a></li>
            <li><a class="dropdown-item" href="my-tenders.html">My Tenders</a></li>
            <li><a class="dropdown-item" href="authority-reports.html">Reports</a></li>
            <li><a class="dropdown-item" href="authority-profile.html">My Profile</a></li>
        `;
    }

    return `
        <li><a class="dropdown-item" href="supplier-dashboard.html">Dashboard</a></li>
        <li><a class="dropdown-item" href="my-bids.html">My Bids</a></li>
        <li><a class="dropdown-item" href="upload-document.html">Upload Documents</a></li>
        <li><a class="dropdown-item" href="supplier-profile.html">My Profile</a></li>
    `;
}

function getRoleName(type) {
    if (type === 'TENDERING_AUTHORITY') return 'Tendering Authority';
    if (type === 'ADMIN') return 'Admin';
    return 'Supplier';
}

function renderNavbar() {
    const navbarArea = document.getElementById('siteNavbar');
    if (!navbarArea) return;

    const currentPage = document.body.dataset.page || '';
    const user = getLoggedUser();

    let accountArea;

    if (user) {
        accountArea = `
            <a class="btn btn-eztends me-2 d-none d-lg-inline-flex"
               href="${getDashboardPage(user.type)}">
                Dashboard
            </a>

            <div class="dropdown">
                <button class="btn user-menu-button dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                    <span class="user-avatar">${escapeText(user.name).charAt(0).toUpperCase()}</span>
                    <span class="user-menu-text">
                        <strong>${escapeText(user.name)}</strong>
                        <small>${getRoleName(user.type)}</small>
                    </span>
                </button>

                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    ${getRoleMenu(user)}
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button class="dropdown-item text-danger"
                                type="button"
                                onclick="logoutFromNavbar()">
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        `;
    } else {
        accountArea = `
            <a class="btn btn-outline-eztends me-2" href="login.html">Login</a>
            <a class="btn btn-eztends" href="register.html">Register</a>
        `;
    }

    navbarArea.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-white site-navbar sticky-top">
            <div class="container">
                <a class="navbar-brand eztends-brand" href="index.html">
                    <img
                        src="assets/images/logo.png"
                        alt="EzTends Logo"
                        class="navbar-logo"
                    >
                    <span>
                        <strong>EzTends</strong>
                        <small>Tender Management System</small>
                    </span>
                </a>

                <button class="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#mainNavbar"
                        aria-controls="mainNavbar"
                        aria-expanded="false"
                        aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="mainNavbar">
                    <ul class="navbar-nav ms-auto align-items-lg-center">
                        ${navLink('Home', 'index.html', 'home', currentPage)}
                        ${navLink('Tenders', 'tenders.html', 'tenders', currentPage)}
                        ${navLink('About Us', 'about.html', 'about', currentPage)}
                        ${navLink('Contact', 'contact.html', 'contact', currentPage)}
                    </ul>

                    <div class="navbar-account ms-lg-3 mt-3 mt-lg-0">
                        ${accountArea}
                    </div>
                </div>
            </div>
        </nav>
    `;
}

function renderFooter() {
    const footerArea = document.getElementById('siteFooter');
    if (!footerArea) return;

    const year = new Date().getFullYear();

    footerArea.innerHTML = `
        <footer class="site-footer mt-auto">
            <div class="container">
                <div class="row g-4 py-5">
                    <div class="col-lg-5">
                        <a class="footer-brand" href="index.html">
                            <img
                                src="assets/images/logo.png"
                                alt="EzTends Logo"
                                class="footer-logo"
                            >
                            <span>EzTends</span>
                        </a>
                        <p class="footer-description mt-3">
                            A local web-based tender management system for publishing
                            tenders, submitting bids and improving transparency.
                        </p>
                       
                    </div>

                    <div class="col-6 col-lg-2">
                        <h2 class="footer-heading">Quick Links</h2>
                        <ul class="footer-links">
                            <li><a href="index.html">Home</a></li>
                            <li><a href="tenders.html">Tenders</a></li>
                            <li><a href="about.html">About Us</a></li>
                            <li><a href="contact.html">Contact</a></li>
                        </ul>
                    </div>

                    <div class="col-6 col-lg-2">
                        <h2 class="footer-heading">Account</h2>
                        <ul class="footer-links">
                            <li><a href="login.html">Login</a></li>
                            <li><a href="register.html">Register</a></li>
                            <li><a href="supplier-dashboard.html">Supplier</a></li>
                            <li><a href="authority-dashboard.html">Authority</a></li>
                        </ul>
                    </div>

                    <div class="col-lg-3">
                        <h2 class="footer-heading">
                            Address
                        </h2>

                        <p class="footer-contact mb-2">
                            94, Galle Road,
                        </p>

                        <p class="footer-contact mb-2">
                            Walana,
                        </p>

                        <p class="footer-contact mb-0">
                            Panadura, Sri Lanka
                        </p>
                    </div>
                </div>

                <div class="footer-bottom">
                    <p class="mb-0">
                        &copy; ${year} EzTends. All rights reserved..
                    </p>
                </div>
            </div>
        </footer>
    `;
}

function logoutFromNavbar() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginExpiry');

    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', function () {
    renderNavbar();
    renderFooter();
});
