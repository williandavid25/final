/**
 * AuthModal.js — Login & Register modal matching the design screenshot
 * Single form that toggles between "Crea tu cuenta" (register) and "Bienvenido de vuelta" (login)
 */
export const AuthModal = () => `
    <div class="auth-modal-overlay" id="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div class="auth-modal">

            <!-- Close -->
            <button class="auth-close-btn" id="auth-close-btn" aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>

            <!-- Brand -->
            <div class="auth-brand">
                <img src="./src/assets/img/logo-square.png" alt="Ellel Oversize" class="auth-logo" onerror="this.style.display='none'">
                <span class="auth-brand-name">Ellel Oversize</span>
            </div>

            <!-- Title & Subtitle -->
            <h2 class="auth-title" id="auth-modal-title">Crea tu cuenta</h2>
            <p class="auth-subtitle">Inicia sesión para guardar tus pedidos y pagar más rápido</p>

            <!-- Benefits (shown only in register mode) -->
            <ul class="auth-benefits" id="auth-benefits-list">
                <li>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Historial de pedidos guardado
                </li>
                <li>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Checkout en un solo clic
                </li>
                <li>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Ofertas exclusivas para miembros
                </li>
            </ul>

            <!-- Google Sign-In: ONE container. JS will render GIS button here, OR show fallback if GIS fails -->
            <div class="auth-google-wrapper" id="auth-google-wrapper">
                <!-- GIS renders its button inside this div -->
                <div id="google-signin-btn"></div>
                <!-- Fallback shown ONLY if GIS fails (hidden by default) -->
                <button class="auth-google-fallback" id="auth-google-fallback" type="button" style="display:none;">
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continuar con Google
                </button>
            </div>

            <!-- Divider -->
            <div class="auth-divider"><span>o continúa con email</span></div>

            <!-- Unified Email / Password Form -->
            <form class="auth-email-form" id="auth-email-form" novalidate>

                <!-- Name field (register only) -->
                <div class="auth-field" id="auth-name-field" style="display:none;">
                    <label for="auth-name">NOMBRE COMPLETO</label>
                    <input type="text" id="auth-name" placeholder="Tu nombre completo" autocomplete="name">
                </div>

                <div class="auth-field">
                    <label for="auth-email">CORREO ELECTRÓNICO</label>
                    <input type="email" id="auth-email" placeholder="tu@correo.com" autocomplete="email" required>
                </div>

                <div class="auth-field">
                    <label for="auth-password">CONTRASEÑA</label>
                    <div class="auth-input-wrapper">
                        <input type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" required>
                        <button type="button" class="auth-toggle-password" data-target="auth-password" aria-label="Ver contraseña">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Confirm password (register only) -->
                <div class="auth-field" id="auth-confirm-field" style="display:none;">
                    <label for="auth-confirm">CONFIRMAR CONTRASEÑA</label>
                    <div class="auth-input-wrapper">
                        <input type="password" id="auth-confirm" placeholder="Repite tu contraseña" autocomplete="new-password">
                        <button type="button" class="auth-toggle-password" data-target="auth-confirm" aria-label="Ver contraseña">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                </div>

                <p class="auth-error-msg" id="auth-error-msg"></p>

                <button type="submit" class="btn-auth-submit" id="btn-auth-submit">
                    <span id="auth-submit-text">CREAR CUENTA</span>
                    <span class="auth-spinner" id="auth-spinner" style="display:none;"></span>
                </button>
            </form>

            <!-- Footer toggle -->
            <div class="auth-footer-links">
                <span id="auth-footer-question">¿Ya tienes cuenta?</span>
                <button class="auth-link-btn" id="auth-toggle-mode">Inicia sesión</button>
            </div>

            <div class="auth-legal">
                Al continuar, aceptas nuestros <a href="privacidad.html">Términos y Política de Privacidad</a>.
            </div>
        </div>
    </div>
`;
