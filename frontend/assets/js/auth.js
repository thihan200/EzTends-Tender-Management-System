// Save login data
function saveLoginData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Login expires after 24 hours
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);

    localStorage.setItem('loginExpiry', expiryTime);
}

// Get saved token
function getToken() {
    return localStorage.getItem('token');
}

// Get saved user
function getUser() {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;
}

// Check user login
function checkAuth() {
    const token = getToken();
    const expiryTime = localStorage.getItem('loginExpiry');

    if (!token || !expiryTime) {
        logout();
        return false;
    }

    // Check whether 24 hours have passed
    if (Date.now() > Number(expiryTime)) {
        alert('Your session has expired. Please login again.');
        logout();
        return false;
    }

    return true;
}

// Automatically logout after remaining time
function startAutoLogout() {
    const expiryTime = localStorage.getItem('loginExpiry');

    if (!expiryTime) {
        return;
    }

    const remainingTime = Number(expiryTime) - Date.now();

    if (remainingTime <= 0) {
        logout();
        return;
    }

    setTimeout(() => {
        alert('Your session has expired. Please login again.');
        logout();
    }, remainingTime);
}

// Logout user
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginExpiry');

    window.location.href = 'login.html';
}

// Redirect user according to role
function redirectByRole(user) {
    if (user.type === 'ADMIN') {
        window.location.href = 'admin-dashboard.html';

    } else if (user.type === 'SUPPLIER') {
        window.location.href = 'supplier-dashboard.html';

    } else if (user.type === 'TENDERING_AUTHORITY') {
        window.location.href = 'authority-dashboard.html';

    } else {
        alert('Invalid user type');
    }
}