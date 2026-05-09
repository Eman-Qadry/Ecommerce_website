// Authentication & Cart Functions

// Determine API URL based on environment
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : window.location.origin;

// Check if user is logged in and update navbar
function checkAuth() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const ordersLink = document.getElementById('ordersLink');
    const adminBtn = document.getElementById('adminBtn');

    if (token) {

        if (authButtons) {
            authButtons.style.display = 'none';
        }

        if (userMenu) {
            userMenu.style.display = 'flex';
        }

        if (ordersLink) {
            ordersLink.style.display = 'block';
        }

        loadNavbarProfileImage();

        if (userRole === 'admin' && adminBtn) {
            adminBtn.style.display = 'block';

            adminBtn.onclick = () => {
                window.location.href = 'admin.html';
            };
        }

        updateCartCount();

    } else {

        if (authButtons) {
            authButtons.style.display = 'flex';
        }

        if (userMenu) {
            userMenu.style.display = 'none';
        }

        if (ordersLink) {
            ordersLink.style.display = 'none';
        }
    }
}

// Load profile image in navbar
function loadNavbarProfileImage() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/users/profile-image`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {

        const navImage = document.getElementById('navProfileImage');
        const navIcon = document.getElementById('navProfileIcon');

        if (!navImage || !navIcon) return;

        if (data.profileImage) {
            navImage.src = data.profileImage;
            navImage.style.display = 'block';
            navIcon.style.display = 'none';
        } else {
            navImage.style.display = 'none';
            navIcon.style.display = 'flex';
        }
    })
    .catch(err => console.log('Error loading profile image:', err));
}

// Update cart count in navbar
function updateCartCount() {
    const token = localStorage.getItem('token');

    const cartCount = document.getElementById('cartCount');

    if (!cartCount) return;

    if (!token) {
        cartCount.textContent = '0';
        return;
    }

    fetch(`${API_URL}/api/cart`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(items => {
        cartCount.textContent = items.length;
    })
    .catch(err => {
        cartCount.textContent = '0';
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');

    window.location.href = 'index.html';
}

// Run checkAuth on page load
document.addEventListener('DOMContentLoaded', checkAuth);