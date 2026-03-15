/**
 * auth.js — Google Sign-In using Google Identity Services (GIS)
 * ---------------------------------------------------------------
 * Dominio autorizado: https://elletshop.dev y https://www.elletshop.dev
 * Añadir en Google Cloud Console → OAuth Client → Authorized JS Origins.
 *
 * FIX RACE CONDITION: renderButton ahora se llama con setTimeout(320ms)
 * después de abrir el modal, garantizando offsetWidth > 0.
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
        const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
        currentUser = {
            name:    payload.name,
            email:   payload.email,
            picture: payload.picture,
            sub:     payload.sub,
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

/** Professional Email Login / Signup Simulation */
export function simulateEmailAuth(email, password, isRegister = false, customName = null) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const baseName = customName || email.split('@')[0];
            const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            const newUser = {
                name:    displayName,
                email:   email,
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=902126&color=fff&bold=true&size=128`,
                sub:     (isRegister ? 'reg_' : 'local_') + Date.now(),
            };
            currentUser = newUser;
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
            onAuthChange(currentUser);
            resolve(currentUser);
        }, 1200);
    });
}

// ── UI Update Callback ───────────────────────────────────────────
function onAuthChange(user) {
    updateCartAuthUI(user);
    updateHeaderAuthUI(user);
    const modal = document.getElementById('auth-modal-overlay');
    if (modal && user) modal.classList.remove('active');
    window.dispatchEvent(new CustomEvent('authChange', { detail: user }));
}

// ── Cart Auth Section ────────────────────────────────────────────
export function updateCartAuthUI(user) {
    const loginBanner = document.getElementById('cart-login-banner');
    const userBanner  = document.getElementById('cart-user-banner');
    const loginBannerFilled = document.getElementById('cart-login-banner-filled');
    const userBannerFilled  = document.getElementById('cart-user-banner-filled');

    const userProfileHtml = user ? `
        <img src="${user.picture || ''}" alt="Avatar" style="width: 38px; height: 38px; border-radius: 50%; border: 2.5px solid #902126; object-fit: cover; flex-shrink: 0;">
        <div style="flex-grow: 1; min-width: 0;">
            <span style="font-weight: 800; font-size: 0.85rem; color: #000; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</span>
            <span style="font-size: 0.72rem; color: #666; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email}</span>
        </div>
        <button id="cart-signout-btn" style="flex-shrink: 0; background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 8px; font-weight: 700; font-size: 0.68rem; cursor: pointer; color: #444; text-transform: uppercase;">Salir</button>
    ` : '';

    if (loginBanner) loginBanner.style.display = user ? 'none' : '';
    if (userBanner) {
        userBanner.style.display = user ? 'flex' : 'none';
        if (user) {
            userBanner.style.cssText = 'display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; margin-bottom: 1.5rem;';
            userBanner.innerHTML = userProfileHtml;
        }
    }

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

    if (user) {
        if (headerAvatar) {
            headerAvatar.style.display = 'flex';
            const img = headerAvatar.querySelector('img');
            if (img) img.src = user.picture || '';
        }
        if (loginIconBtn) loginIconBtn.style.display = 'none';
    } else {
        if (headerAvatar) headerAvatar.style.display = 'none';
        if (loginIconBtn) loginIconBtn.style.display = '';
    }
}

// ── Render Google Button (corregido: espera a que el contenedor tenga ancho real) ──
function renderGoogleButton() {
    if (!window.google?.accounts?.id || currentUser) return;
    const container = document.getElementById('google-signin-btn');
    if (!container) return;

    // requestAnimationFrame garantiza que el modal ya está visible en pantalla
    // y el contenedor tiene offsetWidth > 0 antes de que Google renderice su iframe.
    requestAnimationFrame(() => {
        const width = container.offsetWidth || 340;
        // Si hay un iframe ya renderizado con ancho 0 (fallo anterior), limpiarlo
        const existingIframe = container.querySelector('iframe');
        if (existingIframe && existingIframe.offsetWidth < 10) {
            container.innerHTML = '';
        }
        if (container.children.length === 0) {
            google.accounts.id.renderButton(container, {
                theme:          'filled_black',
                size:           'large',
                width:          width,
                text:           'continue_with',
                logo_alignment: 'left',
                ux_mode:        'popup', // popup es más compatible con Pages/subdomains
            });
        }
    });
}

// ── Initialize Google Identity Services ─────────────────────────
export function initGoogleAuth() {
    loadUser();

    if (!window.google?.accounts?.id) {
        console.warn('Google Identity Services not loaded yet.');
        const fallback = document.getElementById('auth-google-fallback');
        if (fallback) fallback.style.display = 'flex';
        onAuthChange(currentUser);
        return;
    }

    google.accounts.id.initialize({
        client_id:             GOOGLE_CLIENT_ID,
        callback:              signInWithGoogle,
        auto_select:           false,
        cancel_on_tap_outside: true,
        ux_mode:               'popup',
    });

    onAuthChange(currentUser);
    renderGoogleButton();
}

// ── Open / Close Auth Modal ──────────────────────────────────────
export function openAuthModal() {
    const modal = document.getElementById('auth-modal-overlay');
    if (!modal) return;
    modal.classList.add('active');

    // Esperar que la transición CSS del modal termine (~300ms)
    // para que el contenedor google-signin-btn tenga offsetWidth > 0.
    setTimeout(() => {
        if (window.google?.accounts?.id) {
            renderGoogleButton();
        } else {
            const fallback = document.getElementById('auth-google-fallback');
            if (fallback) fallback.style.display = 'flex';
        }
    }, 320);
}

export function closeAuthModal() {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.remove('active');
}

// ── Callback global para el script GIS ──────────────────────────
// accounts.google.com/gsi/client llama automáticamente a window.onGoogleLibraryLoad
// cuando la librería está lista. Más confiable que el evento 'load'.
window.onGoogleLibraryLoad = () => {
    if (typeof initGoogleAuth === 'function') initGoogleAuth();
};
