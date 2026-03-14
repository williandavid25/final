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
import { HistoryManager } from './utils.js';
import { AuthModal } from '../components/auth/AuthModal.js';

export { AuthModal };
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
        }, 800);
    });
}

/** Initialize consistent Auth Events for all pages */
export function initAuthEvents() {
    let authMode = 'register'; // 'login' | 'register'

    function setAuthMode(mode) {
        authMode = mode;
        const title        = document.getElementById('auth-modal-title');
        const submitText   = document.getElementById('auth-submit-text');
        const toggleBtn    = document.getElementById('auth-toggle-mode');
        const footerQ      = document.getElementById('auth-footer-question');
        const benefits     = document.querySelector('.auth-benefits');
        const nameField    = document.getElementById('auth-name-field');
        const confirmField = document.getElementById('auth-confirm-field');
        const errorMsg     = document.getElementById('auth-error-msg');

        if (errorMsg) errorMsg.textContent = '';

        if (mode === 'register') {
            if (title)        title.textContent          = 'Crea tu cuenta';
            if (submitText)   submitText.textContent     = 'CREAR CUENTA';
            if (toggleBtn)    toggleBtn.textContent      = 'Inicia sesión';
            if (footerQ)      footerQ.textContent        = '¿Ya tienes cuenta?';
            if (benefits)     benefits.style.display     = '';
            if (nameField)    nameField.style.display    = '';
            if (confirmField) confirmField.style.display = '';
        } else {
            if (title)        title.textContent          = 'Bienvenido de vuelta';
            if (submitText)   submitText.textContent     = 'INICIAR SESIÓN';
            if (toggleBtn)    toggleBtn.textContent      = 'Regístrate gratis';
            if (footerQ)      footerQ.textContent        = '¿No tienes cuenta?';
            if (benefits)     benefits.style.display     = 'none';
            if (nameField)    nameField.style.display    = 'none';
            if (confirmField) confirmField.style.display = 'none';
        }
    }

    // Passwords visibility
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.auth-toggle-password');
        if (!btn) return;
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Toggle mode
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#auth-toggle-mode')) return;
        setAuthMode(authMode === 'register' ? 'login' : 'register');
    });

    // Opening/Closing
    document.addEventListener('click', (e) => {
        if (
            e.target.closest('#header-login-btn') || 
            e.target.closest('#cart-login-trigger') ||
            e.target.closest('#cart-login-banner')
        ) {
            openAuthModal();
            setTimeout(() => setAuthMode('register'), 50);
        }
        if (e.target.closest('#cart-signout-btn') || e.target.closest('#header-user-avatar') || e.target.closest('.header-avatar-btn')) {
            signOut();
        }
        if (e.target.closest('#auth-close-btn') || e.target.id === 'auth-modal-overlay') {
            closeAuthModal();
        }
    });

    // Unified Submit
    document.addEventListener('submit', async (e) => {
        if (!e.target.matches('#auth-email-form')) return;
        e.preventDefault();

        const email      = document.getElementById('auth-email')?.value?.trim();
        const password   = document.getElementById('auth-password')?.value;
        const name       = document.getElementById('auth-name')?.value?.trim();
        const confirm2   = document.getElementById('auth-confirm')?.value;
        const errorMsg   = document.getElementById('auth-error-msg');
        const submitBtn  = document.getElementById('btn-auth-submit');
        const spinner    = document.getElementById('auth-spinner');
        const submitText = document.getElementById('auth-submit-text');
        const isRegister = authMode === 'register';

        if (errorMsg) errorMsg.textContent = '';

        if (isRegister && !name) {
            if (errorMsg) errorMsg.textContent = 'Ingresa tu nombre.';
            return;
        }
        if (!email || !password) {
            if (errorMsg) errorMsg.textContent = 'Completa todos los campos.';
            return;
        }
        if (isRegister && confirm2 !== password) {
            if (errorMsg) errorMsg.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (submitText) submitText.textContent = '';

        try {
            await simulateEmailAuth(email, password, isRegister, isRegister ? name : null);
        } catch (err) {
            if (errorMsg) errorMsg.textContent = 'Error al autenticar.';
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (submitText) submitText.textContent = isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
        }
    });

    // Initial check
    const user = loadUser();
    onAuthChange(user);
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
    const userBanner  = document.getElementById('cart-user-banner');
    // ── Filled state banners
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
    const loginBtn = document.getElementById('header-login-btn');
    const userBtn  = document.getElementById('header-user-avatar');

    if (!loginBtn || !userBtn) {
        console.warn('Auth UI: header-login-btn o header-user-avatar no encontrados en esta página.');
        return;
    }

    if (user) {
        loginBtn.style.display = 'none';
        userBtn.style.display  = 'flex';
        
        const avatarImg = userBtn.querySelector('img');
        if (avatarImg) {
            if (user.picture) {
                avatarImg.src = user.picture;
                avatarImg.style.display = 'block';
                // Remove any existing initials 
                const initials = userBtn.querySelector('.avatar-initials');
                if (initials) initials.remove();
            } else {
                avatarImg.style.display = 'none';
                // Create initials if not present
                let initialsEl = userBtn.querySelector('.avatar-initials');
                if (!initialsEl) {
                    initialsEl = document.createElement('span');
                    initialsEl.className = 'avatar-initials';
                    userBtn.appendChild(initialsEl);
                }
                const names = user.name.split(' ');
                initialsEl.textContent = names.length > 1 
                    ? (names[0][0] + names[1][0]).toUpperCase()
                    : names[0][0].toUpperCase();
            }
        }
    } else {
        loginBtn.style.display = 'flex';
        userBtn.style.display  = 'none';
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
        callback:  signInWithGoogle,
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
            size:  'large',
            width: googleBtnContainer.offsetWidth || 340,
            text:  'continue_with',
            logo_alignment: 'left',
        });
    }
}

// ── Open / Close Auth Modal ──────────────────────────────────────
export function openAuthModal() {
    const modal = document.getElementById('auth-modal-overlay');
    if (!modal) return;
    modal.classList.add('active');
    HistoryManager.pushState('auth', () => closeAuthModal());

    // Try to render Google button (may not have been available on page load)
    if (window.google?.accounts?.id && !currentUser) {
        const googleBtnContainer = document.getElementById('google-signin-btn');
        if (googleBtnContainer && !googleBtnContainer.children.length) {
            google.accounts.id.renderButton(googleBtnContainer, {
                theme: 'filled_black',
                size:  'large',
                width: googleBtnContainer.offsetWidth || 340,
                text:  'continue_with',
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
    if (modal) {
        modal.classList.remove('active');
        HistoryManager.popState('auth');
    }
}
