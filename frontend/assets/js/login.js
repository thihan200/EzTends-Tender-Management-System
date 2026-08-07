// Login page

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginButton = document.getElementById('loginButton');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const passwordEye = document.getElementById('passwordEye');

// Show message on the page
function showLoginMessage(message, type) {
    loginMessage.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}

// Show or hide password
passwordToggle.addEventListener(
    'click',
    function () {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';

            passwordEye.src =
                'assets/images/eye-closed.png';

            passwordEye.alt = 'Hide password';
            passwordToggle.setAttribute(
                'aria-label',
                'Hide password'
            );
        } else {
            passwordInput.type = 'password';

            passwordEye.src =
                'assets/images/eye-open.png';

            passwordEye.alt = 'Show password';
            passwordToggle.setAttribute(
                'aria-label',
                'Show password'
            );
        }
    }
);

// Login form submit
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    loginMessage.innerHTML = '';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showLoginMessage(data.message || 'Login failed', 'danger');
            return;
        }

        saveLoginData(data.token, data.user);

        showLoginMessage('Login successful. Redirecting...', 'success');

        setTimeout(function () {
            redirectByRole(data.user);
        }, 700);

    } catch (error) {
        showLoginMessage(
            'Cannot connect to the local server. Please start the backend.',
            'danger'
        );
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
});
