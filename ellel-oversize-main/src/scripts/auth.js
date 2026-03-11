/**
 * auth.js — Google Sign-In using Google Identity Services (GIS)
 * ---------------------------------------------------------------
 * Uses the official Google Identity Services library.
 * Requires a Google Cloud Console Client ID (see comment below).
 *
 * HOW TO ACTIVATE REAL GOOGLE LOGIN:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project → APIs & Services → Credentials
 * 3. Create an "OAuth 2.0 Client ID" for "Web application"
 * 4. Add your domain to "Authorized JavaScript origins"
 * 5. Replace GOOGLE_CLIENT_ID below with your real client ID
 */

export const GOOGLE_CLIENT_ID = '440096429908-li0naluh0idbvqo3rn8hhbma55nm0i75.apps.googleusercontent.com';

// ── Auth State ──────────────────────────────────────────────────
let currentUser = null;
const AUTH_STORAGE_KEY = 'ellel_user';

/** Load user from localStorage on page load */
export function loadUser() {
    try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) currentUser = JSON.parse(saved);
    } catch (e) { currentUser = null; }
    return currentUser;
}

/** Returns currently logged-in user, or null */
export function getUser() { return currentUser; }

/** Sign in with Google credential JWT payload */
export function signInWithGoogle(credentialResponse) {
    try {
        // Decode the JWT from Google (no library needed — payload is base64)
        const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
        currentUser = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            sub: payload.sub,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        onAuthChange(currentUser);
    } catch (e) {
        console.error('Error parsing Google credential:', e);
    }
}

/** Sign out */
export function signOut() {
    currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (window.google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
    }
    onAuthChange(null);
}

/** Professional Email Login / Signup Simulation (Connected to API) */
export async function simulateEmailAuth(email, password, isRegister = false, customName = null) {
    const endpoint = isRegister ? '/auth/registro' : '/auth/login';
    const body = isRegister ? { nombre: customName, email, password } : { email, password };

    try {
        const res = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        currentUser = {
            ...data.user,
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.nombre)}&background=902126&color=fff&bold=true&size=128`,
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        localStorage.setItem('ellel_token', data.token); // Store token separately for API requests
        onAuthChange(currentUser);
        return currentUser;
    } catch (err) {
        alert(err.message);
        throw err;
    }
}

// ── UI Update Callback ───────────────────────────────────────────
function onAuthChange(user) {
    // Update cart auth state
    updateCartAuthUI(user);
    // Update header user icon
    updateHeaderAuthUI(user);
    // Close auth modal if open
    const modal = document.getElementById('auth-modal-overlay');
    if (modal && user) modal.classList.remove('active');
    // Dispatch custom event for any listeners
    window.dispatchEvent(new CustomEvent('authChange', { detail: user }));
}

// ── Cart Auth Section ────────────────────────────────────────────
export function updateCartAuthUI(user) {
    // ── Empty state banners
    const loginBanner = document.getElementById('cart-login-banner');
    const userBanner = document.getElementById('cart-user-banner');
    // ── Filled state banners
    const loginBannerFilled = document.getElementById('cart-login-banner-filled');
    const userBannerFilled = document.getElementById('cart-user-banner-filled');

    const userProfileHtml = user ? `
        <img src="${user.picture || ''}" alt="Avatar" style="width: 38px; height: 38px; border-radius: 50%; border: 2.5px solid #902126; object-fit: cover; flex-shrink: 0;">
        <div style="flex-grow: 1; min-width: 0;">
            <span style="font-weight: 800; font-size: 0.85rem; color: #000; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</span>
            <span style="font-size: 0.72rem; color: #666; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email}</span>
        </div>
        <button id="cart-signout-btn" style="flex-shrink: 0; background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 8px; font-weight: 700; font-size: 0.68rem; cursor: pointer; color: #444; text-transform: uppercase;">Salir</button>
    ` : '';

    // Update empty-state banners
    if (loginBanner) loginBanner.style.display = user ? 'none' : '';
    if (userBanner) {
        userBanner.style.display = user ? 'flex' : 'none';
        if (user) {
            userBanner.style.cssText = 'display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; margin-bottom: 1.5rem;';
            userBanner.innerHTML = userProfileHtml;
        }
    }

    // Update filled-state banners (may not exist yet)
    if (loginBannerFilled) loginBannerFilled.style.display = user ? 'none' : 'flex';
    if (userBannerFilled) {
        userBannerFilled.style.display = user ? 'flex' : 'none';
        if (user) {
            userBannerFilled.style.cssText = 'display: flex; align-items: center; gap: 10px; background: #fafafa; border: 1.5px solid #ececec; border-radius: 10px; padding: 10px 14px;';
            userBannerFilled.innerHTML = userProfileHtml;
        }
    }
}

// ── Header Avatar ────────────────────────────────────────────────
export function updateHeaderAuthUI(user) {
    const headerAvatar = document.getElementById('header-user-avatar');
    const loginIconBtn = document.getElementById('header-login-btn');
    const headerDropdown = document.getElementById('header-user-dropdown');

    if (user) {
        if (headerAvatar) {
            headerAvatar.style.display = 'flex';
            const img = headerAvatar.querySelector('img');
            if (img) img.src = user.picture || './src/assets/img/avatar-placeholder.png';
        }
        if (loginIconBtn) loginIconBtn.style.display = 'none';

        // Populate dropdown
        if (headerDropdown) {
            const isAdmin = user.rol === 'admin';
            headerDropdown.innerHTML = `
                <div class="user-info-brief">
                    <span class="user-info-name">${user.nombre || user.email}</span>
                    <span class="user-info-role">${user.rol === 'admin' ? 'Administrador' : 'Cliente'}</span>
                </div>
                <a href="perfil.html" class="user-dropdown-item">
                    <i class="fas fa-user-edit"></i> Editar Información
                </a>
                ${isAdmin ? `
                <a href="admin.html" class="user-dropdown-item">
                    <i class="fas fa-shield-alt"></i> Panel de Admin
                </a>
                ` : ''}
                <button id="header-logout-btn" class="user-dropdown-item logout">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            `;

            // Explicitly set log out listener
            const logoutBtn = headerDropdown.querySelector('#header-logout-btn');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                        signOut();
                        headerDropdown.classList.remove('active');
                    }
                };
            }
        }
    } else {
        if (headerAvatar) headerAvatar.style.display = 'none';
        if (loginIconBtn) loginIconBtn.style.display = '';
        if (headerDropdown) {
            headerDropdown.innerHTML = '';
            headerDropdown.classList.remove('active');
        }
    }
}

// ── Initialize Google Identity Services ─────────────────────────
export function initGoogleAuth() {
    loadUser();

    if (!window.google?.accounts?.id) {
        console.warn('Google Identity Services not loaded. Showing fallback button.');
        // Show fallback Google button
        const fallback = document.getElementById('auth-google-fallback');
        if (fallback) fallback.style.display = 'flex';
        onAuthChange(currentUser);
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: signInWithGoogle,
        auto_select: false,
        cancel_on_tap_outside: true,
    });

    // Update UI
    onAuthChange(currentUser);

    // Render Google button inside the modal
    const googleBtnContainer = document.getElementById('google-signin-btn');
    if (googleBtnContainer && !currentUser) {
        google.accounts.id.renderButton(googleBtnContainer, {
            theme: 'filled_black',
            size: 'large',
            width: googleBtnContainer.offsetWidth || 340,
            text: 'continue_with',
            logo_alignment: 'left',
        });
    }
}

// ── Open / Close Auth Modal ──────────────────────────────────────
export function openAuthModal() {
    const modal = document.getElementById('auth-modal-overlay');
    if (!modal) return;
    modal.classList.add('active');

    // Try to render Google button (may not have been available on page load)
    if (window.google?.accounts?.id && !currentUser) {
        const googleBtnContainer = document.getElementById('google-signin-btn');
        if (googleBtnContainer && !googleBtnContainer.children.length) {
            google.accounts.id.renderButton(googleBtnContainer, {
                theme: 'filled_black',
                size: 'large',
                width: googleBtnContainer.offsetWidth || 340,
                text: 'continue_with',
                logo_alignment: 'left',
            });
        }
    } else if (!window.google?.accounts?.id) {
        // Show fallback if GIS never loaded
        const fallback = document.getElementById('auth-google-fallback');
        if (fallback) fallback.style.display = 'flex';
    }
}

export function closeAuthModal() {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.remove('active');
}
