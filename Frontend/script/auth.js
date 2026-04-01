/* ============================================================
   LEXINOTE AUTHENTICATION LOGIC (OPTIMIZED)
   ============================================================ */

// 1. REDIRECTION SHIELD: Run this BEFORE the page renders to stop flicker
if (localStorage.getItem('token')) {
    // Hide body and immediately jump to index
    document.documentElement.style.display = 'none';
    window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM ELEMENTS
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authAlert = document.getElementById('authAlert');

    /**
     * Displays feedback messages using Bootstrap & ARIA standards.
     */
    function showAlert(message, type) {
        if (!authAlert) return;
        authAlert.textContent = message;
        authAlert.className = `alert alert-${type}`;
        authAlert.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => {
                authAlert.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * Bridges the JS logic to the HTML's visual toggle function.
     */
    function switchAuth(mode) {
        if (typeof toggleAuth === "function") {
            toggleAuth(mode);
        }
    }

    /* ================= 2. SIGNUP LOGIC ================= */
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                // Ensure prefix /auth is used to match main.py
                const response = await fetch('http://127.0.0.1:8003/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert("Account created! Switching to login...", "success");
                    signupForm.reset();
                    setTimeout(() => switchAuth('login'), 2000);
                } else {
                    showAlert(data.detail || "Signup failed. Try again.", "danger");
                }
            } catch (error) {
                showAlert("Connection error. Ensure backend is on port 8000.", "danger");
            }
        });
    }

    /* ================= 3. LOGIN LOGIC ================= */
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                // Ensure prefix /auth is used to match main.py
                const response = await fetch('http://127.0.0.1:8003/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userName', data.userName || "User");
                    showAlert("Login successful! Redirecting...", "success");

                    setTimeout(() => {
                        window.location.replace('index.html'); 
                    }, 1000);
                } else {
                    showAlert(data.detail || "Invalid email or password", "danger");
                }
            } catch (error) {
                showAlert("Backend unreachable. Check CORS or Server status.", "danger");
            }
        });
    }
});