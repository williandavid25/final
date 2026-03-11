import { initAnimations, animateProductCards } from './animations.js';
import { ProductGrid } from '../components/product/ProductGrid.js';
import { MiniCart } from '../components/cart/MiniCart.js';
import { CheckoutModal } from '../components/forms/CheckoutForm.js';
import { initCart, addToCart, openCart, procesarCompraWhatsApp } from './cartState.js';
import { AuthModal } from '../components/auth/AuthModal.js';
import { initGoogleAuth, openAuthModal, closeAuthModal, signOut, simulateEmailAuth, updateCartAuthUI, updateHeaderAuthUI, getUser } from './auth.js';
import { initSearch } from './search.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Aplicación iniciada');

    // Iniciar animaciones globales de GSAP
    initAnimations();

    // 1. Renderizar componentes estáticos (Modales) MODO SINCRONO ANTES DE FETCH!
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) cartContainer.innerHTML = MiniCart();

    const checkoutContainer = document.getElementById('checkout-container');
    if (checkoutContainer) checkoutContainer.innerHTML = CheckoutModal();

    // Inject Auth Modal (Robust check)
    let authContainer = document.getElementById('auth-container');
    if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.id = 'auth-container';
        document.body.appendChild(authContainer);
    }
    authContainer.innerHTML = AuthModal();

    // 2. Inicializar Estado del Carrito y Lógica DOM
    initCart();
    setupUIInteractions();
    setupAuthInteractions();
    initGoogleAuth(); // Initialize Google Auth and load current user
    initSearch(); // Live product search

    // 3. Iniciar el Carrusel
    setupCarousel();

    // 4. Cargar productos y renderizar (Bloqueo Async con robustez)
    try {
        console.log('Intentando cargar productos desde API...');
        const response = await fetch('/api/productos');

        if (!response.ok) {
            throw new Error(`Error de red: ${response.status} ${response.statusText}`);
        }

        const productos = await response.json();
        console.log('Productos cargados exitosamente:', productos.length, 'ítems encontrados.');

        const gridContainer = document.getElementById('product-grid-container');
        if (gridContainer) {
            gridContainer.innerHTML = ProductGrid(productos);
            // ... (rest of interactions)
        }
    } catch (error) {
        console.error('Fallo al cargar catálogo:', error);
    }

    // Aquí inicializaremos Three.js para el canvas 3D más adelante
});

function setupAuthInteractions() {

    // ── Current auth mode ─────────────────────────────────────────
    let authMode = 'register'; // 'login' | 'register'

    function setAuthMode(mode) {
        authMode = mode;
        const title = document.getElementById('auth-modal-title');
        const submitText = document.getElementById('auth-submit-text');
        const toggleBtn = document.getElementById('auth-toggle-mode');
        const footerQ = document.getElementById('auth-footer-question');
        const benefits = document.querySelector('.auth-benefits');
        const nameField = document.getElementById('auth-name-field');
        const confirmField = document.getElementById('auth-confirm-field');
        const errorMsg = document.getElementById('auth-error-msg');

        if (errorMsg) errorMsg.textContent = '';

        if (mode === 'register') {
            if (title) title.textContent = 'Crea tu cuenta';
            if (submitText) submitText.textContent = 'CREAR CUENTA';
            if (toggleBtn) toggleBtn.textContent = 'Inicia sesión';
            if (footerQ) footerQ.textContent = '¿Ya tienes cuenta?';
            if (benefits) benefits.style.display = '';
            if (nameField) nameField.style.display = '';
            if (confirmField) confirmField.style.display = '';
        } else {
            if (title) title.textContent = 'Bienvenido de vuelta';
            if (submitText) submitText.textContent = 'INICIAR SESIÓN';
            if (toggleBtn) toggleBtn.textContent = 'Regístrate gratis';
            if (footerQ) footerQ.textContent = '¿No tienes cuenta?';
            if (benefits) benefits.style.display = 'none';
            if (nameField) nameField.style.display = 'none';
            if (confirmField) confirmField.style.display = 'none';
        }
    }

    // ── Password visibility toggle ────────────────────────────────
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.auth-toggle-password');
        if (!btn) return;
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // ── Toggle mode (login ↔ register) ───────────────────────────
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#auth-toggle-mode')) return;
        setAuthMode(authMode === 'register' ? 'login' : 'register');
    });

    // ── Listen for custom openAuth event ─────────────────────────
    window.addEventListener('openAuth', () => {
        openAuthModal();
        setTimeout(() => {
            try { setAuthMode('register'); } catch (err) { console.error(err); }
        }, 50);
    });

    // ── Open / Close Modal (Direct bindings and delegation) ───────
    const loginTriggerElements = [
        '#cart-login-banner',
        '#cart-login-banner-filled',
        '#cart-login-trigger',
        '#header-login-btn'
    ];

    // Toggle User Dropdown
    document.addEventListener('click', (e) => {
        const headerAvatar = e.target.closest('#header-user-avatar');
        const dropdown = document.getElementById('header-user-dropdown');

        if (headerAvatar) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdown) dropdown.classList.toggle('active');
        } else if (dropdown && !e.target.closest('#header-user-dropdown')) {
            dropdown.classList.remove('active');
        }
    });

    // Direct binding for the main header button for extra reliability
    const mainLoginBtn = document.getElementById('header-login-btn');
    if (mainLoginBtn) {
        mainLoginBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ellel Auth: Direct click on header-login-btn');
            openAuthModal();
            setTimeout(() => {
                try { setAuthMode('login'); } catch (err) { console.error('Auth mode error:', err); }
            }, 50);
        };
    }

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.cart-login-trigger') || 
                        loginTriggerElements.map(s => e.target.closest(s)).find(el => el !== null);

        if (trigger) {
            // If it was the main button, it's already handled by onclick (avoid double trigger)
            if (trigger.id === 'header-login-btn' && mainLoginBtn) return;

            e.preventDefault();
            e.stopPropagation();
            console.log('Ellel Auth: Opening modal from delegation:', trigger.id || trigger.className);
            openAuthModal();
            setTimeout(() => {
                try { setAuthMode('login'); } catch (err) { console.error('Auth mode error:', err); }
            }, 50);
            return;
        }

        if (e.target.closest('#auth-close-btn') || e.target.id === 'auth-modal-overlay') {
            closeAuthModal();
        }
    });

    // ── Unified form submit ───────────────────────────────────────
    document.addEventListener('submit', async (e) => {
        if (!e.target.matches('#auth-email-form')) return;
        e.preventDefault();

        const email = document.getElementById('auth-email')?.value?.trim();
        const password = document.getElementById('auth-password')?.value;
        const name = document.getElementById('auth-name')?.value?.trim();
        const confirm2 = document.getElementById('auth-confirm')?.value;
        const errorMsg = document.getElementById('auth-error-msg');
        const submitBtn = document.getElementById('btn-auth-submit');
        const spinner = document.getElementById('auth-spinner');
        const submitText = document.getElementById('auth-submit-text');
        const isRegister = authMode === 'register';

        if (errorMsg) errorMsg.textContent = '';

        // Validate
        if (isRegister && !name) {
            if (errorMsg) errorMsg.textContent = 'Por favor ingresa tu nombre completo.';
            return;
        }
        if (!email || !password) {
            if (errorMsg) errorMsg.textContent = 'Por favor completa todos los campos.';
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            if (errorMsg) errorMsg.textContent = 'Ingresa un correo electrónico válido.';
            return;
        }
        if (password.length < 6) {
            if (errorMsg) errorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            return;
        }
        if (isRegister && confirm2 !== password) {
            if (errorMsg) errorMsg.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        // Loading
        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (submitText) submitText.textContent = '';

        try {
            await simulateEmailAuth(email, password, isRegister, isRegister ? name : null);
        } catch (err) {
            if (errorMsg) errorMsg.textContent = 'Ocurrió un error, inténtalo de nuevo.';
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (submitText) submitText.textContent = isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
        }
    });

    // ── Google Sign-In ────────────────────────────────────────────
    const initAuthOnLoad = () => {
        if (window.google?.accounts?.id && !getUser()) {
            initGoogleAuth();
        }
    };

    if (document.readyState === 'complete') {
        initAuthOnLoad();
    } else {
        window.addEventListener('load', initAuthOnLoad);
    }
}

function setupUIInteractions() {
    const checkoutBtn = document.getElementById('btn-checkout-whatsapp');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const cartOverlay = document.getElementById('cart-overlay');

    // Header cart button is handled in cartState (openCart)
    // Close button handles in cartState (closeCart)

    // Checkout actions
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', procesarCompraWhatsApp);
    }
    if (closeCheckoutBtn && checkoutOverlay) {
        closeCheckoutBtn.addEventListener('click', () => checkoutOverlay.classList.remove('active'));
    }

    // Mobile Menu Actions
    const menuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-sublink');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.add('active'));
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => mobileMenu.classList.remove('active'));
    }

    // Smooth scroll and auto-close upon selecting a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Check if it's pointing to an anchor on this page
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                // Close menu
                if (mobileMenu) mobileMenu.classList.remove('active');

                // Scroll if section exists
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Minimal Checkout Form logic (Fake Processing)
    const checkoutFormMinimal = document.getElementById('checkout-form-minimal');
    const submitOrderBtn = document.querySelector('.btn-checkout-submit');
    const emailInput = document.getElementById('email-min');

    if (checkoutFormMinimal && submitOrderBtn) {
        checkoutFormMinimal.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalText = submitOrderBtn.textContent;

            // Simulating payment process
            submitOrderBtn.textContent = 'PROCESANDO PAGO...';
            submitOrderBtn.disabled = true;
            if (window.gsap) gsap.to(submitOrderBtn, { opacity: 0.5, yoyo: true, repeat: -1, duration: 0.3 });

            setTimeout(() => {
                if (window.gsap) gsap.killTweensOf(submitOrderBtn);

                submitOrderBtn.style.opacity = '1';
                submitOrderBtn.style.color = 'green';
                submitOrderBtn.textContent = `PAGO EXITOSO - RECIBO A ${emailInput.value.toUpperCase()}`;

                // Limpiar carrito globalmente
                localStorage.removeItem('ellel_cart');

                setTimeout(() => {
                    const checkoutOverlay = document.getElementById('checkout-overlay');
                    if (checkoutOverlay) checkoutOverlay.classList.remove('active');

                    // Resetear Formulario
                    checkoutFormMinimal.reset();
                    submitOrderBtn.textContent = originalText;
                    submitOrderBtn.disabled = false;
                    submitOrderBtn.style.color = '';

                    // Refrescar para reiniciar el UI del carrito
                    window.location.reload();
                }, 2500);
            }, 2000);
        });
    }

    // Nav smooth scroll (Explore Catalog to grid)
    const exploreBtn = document.querySelector('.btn-black.pulse-anim');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // NOTE: Search is now handled by initSearch() from search.js
    // Filter by gender — real filtering of product cards
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const genero = e.target.dataset.genero || ''; // '' = todos
            const cards = document.querySelectorAll('.product-card');

            cards.forEach(card => {
                const cardGenero = card.dataset.genero || '';
                const show = !genero || cardGenero === genero;

                if (show) {
                    card.style.display = '';
                    gsap.fromTo(card,
                        { y: 20, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out' }
                    );
                } else {
                    gsap.to(card, {
                        autoAlpha: 0, y: -10, duration: 0.25, ease: 'power2.in',
                        onComplete: () => { card.style.display = 'none'; }
                    });
                }
            });
        });
    });

    // Bind Quick Add functionality
    setupQuickAddParams();

    // Interactive 360 Logo Rotation
    setupLogoRotation();
}

/**
 * Permite girar el logo manualmente interactuando con el mouse
 */
function setupLogoRotation() {
    const logoImg = document.querySelector('.logo-link img');
    if (!logoImg) return;

    let isDragging = false;
    let startX = 0;
    let currentRotation = 0;

    // Efecto de imán / seguimiento ligero al mover el mouse
    logoImg.addEventListener('mousemove', (e) => {
        if (isDragging) return;
        const rect = logoImg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const deltaX = e.clientX - centerX;
        const rotation = deltaX * 0.2; // Sensibilidad ligera
        gsap.to(logoImg, { rotation: rotation, duration: 0.5, ease: 'power2.out' });
    });

    logoImg.addEventListener('mouseleave', () => {
        if (isDragging) return;
        gsap.to(logoImg, { rotation: 0, duration: 0.8, ease: 'back.out(1.7)' });
    });

    // Giro manual de 360 grados al hacer clic o arrastrar
    logoImg.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        logoImg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const rotationJump = deltaX * 1.5; // Rapidez del giro
        gsap.set(logoImg, { rotation: currentRotation + rotationJump });
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        logoImg.style.cursor = 'grab';

        const deltaX = e.clientX - startX;
        currentRotation += deltaX * 1.5;

        // Animación de inercia si el giro fue rápido
        if (Math.abs(deltaX) > 20) {
            gsap.to(logoImg, {
                rotation: currentRotation + (deltaX * 2),
                duration: 1.5,
                ease: 'power2.out',
                onComplete: () => {
                    // Opcional: Volver a 0 o quedarse ahí
                    // gsap.to(logoImg, { rotation: 0, delay: 2, duration: 1 });
                }
            });
        }
    });

    // Touch support para móviles
    logoImg.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        gsap.set(logoImg, { rotation: currentRotation + (deltaX * 1.5) });
    });

    window.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const deltaX = e.changedTouches[0].clientX - startX;
        currentRotation += deltaX * 1.5;
    });
}

function setupQuickAddParams() {
    const quickAddBtns = document.querySelectorAll('.add-to-cart-hidden');

    quickAddBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = e.target.closest('.product-card');
            if (card) {
                const imgEl = card.querySelector('.product-img');
                const titleEl = card.querySelector('.product-title');
                const priceStr = card.querySelector('.product-price').textContent;
                const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, ""));
                const id = e.target.getAttribute('data-id');

                addToCart({
                    id: id || Math.random().toString(),
                    name: titleEl ? titleEl.textContent : "Producto Genérico",
                    price: price || 0,
                    qty: 1,
                    img: imgEl ? imgEl.src : "./src/assets/img/logo-square.png",
                    size: "L",
                    color: "Negro"
                });
            } else {
                openCart();
            }
        });
    });
}

function setupCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-nav');
    const nextBtn = document.querySelector('.next-nav');

    if (slides.length === 0) return;

    let currentSlide = 0;

    function goToSlide(n) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        slides[currentSlide].style.transform = `translateX(${-100 * n}%)`; // Ensure proper direction hidden
        slides[currentSlide].style.opacity = '0';

        currentSlide = (n + slides.length) % slides.length;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');

        // Arrange items physically
        slides.forEach((slide, index) => {
            slide.style.transform = `translateX(${-100 * currentSlide}%)`;
            slide.style.opacity = index === currentSlide ? '1' : '0';
        });
    }

    // Initialize 
    goToSlide(0);

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    // Auto advance
    setInterval(() => goToSlide(currentSlide + 1), 5000);
}
