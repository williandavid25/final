import { initAnimations, animateProductCards, initProductClickAnimations } from './animations.js';
import { ProductGrid } from '../components/product/ProductGrid.js';
import { MiniCart } from '../components/cart/MiniCart.js';
import { CheckoutModal } from '../components/forms/CheckoutForm.js';
import { initCart, addToCart, openCart, procesarCompraWhatsApp } from './cartState.js';
import { AuthModal } from '../components/auth/AuthModal.js';
import { initGoogleAuth, openAuthModal, closeAuthModal, signOut, simulateEmailAuth, updateCartAuthUI, updateHeaderAuthUI, getUser, initAuthEvents } from './auth.js';
import { initSearch } from './search.js';
import { WishlistDrawer } from '../components/wishlist/WishlistDrawer.js';
import { initWishlist, toggleWishlist, openWishlist } from './wishlistState.js';
import { HistoryManager } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Aplicación iniciada');
    
    // Initialize History Manager for navigation
    HistoryManager.init();
    
    // Iniciar animaciones globales de GSAP
    initAnimations();
    
    // 1. Renderizar componentes estáticos (Modales) MODO SINCRONO ANTES DE FETCH!
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) cartContainer.innerHTML = MiniCart();
    
    const checkoutContainer = document.getElementById('checkout-container');
    if (checkoutContainer) checkoutContainer.innerHTML = CheckoutModal();

    // Inject Auth Modal
    const authContainer = document.getElementById('auth-container');
    if (authContainer) authContainer.innerHTML = AuthModal();

    // Inject Wishlist Drawer
    const wishlistContainer = document.getElementById('wishlist-container');
    if (wishlistContainer) wishlistContainer.innerHTML = WishlistDrawer();

    // 2. Inicializar Estado del Carrito y Lógica DOM
    initCart();
    initWishlist();
    initProductClickAnimations();
    setupUIInteractions();
    initAuthEvents();
    initGoogleAuth();
    initSearch(); // Live product search
    
    // 3. Iniciar el Carrusel
    setupCarousel();
    
    // 4. Cargar productos y renderizar (Bloqueo Async con robustez)
    try {
        console.log('Intentando cargar productos desde ./MOCK_DATA/productos.json...');
        const response = await fetch('./MOCK_DATA/productos.json');
        
        if (!response.ok) {
            throw new Error(`Error de red: ${response.status} ${response.statusText}`);
        }

        const productos = await response.json();
        console.log('Productos cargados exitosamente:', productos.length, 'ítems encontrados.');
        
        const gridContainer = document.getElementById('product-grid-container');
        if (gridContainer) {
            gridContainer.innerHTML = ProductGrid(productos);
            console.log('Catálogo inyectado en el DOM correctamente.');
            
            // Setup buttons generated dynamically
            setupQuickAddParams();
            
            // Animate cards now that they exist in the DOM
            animateProductCards();
        } else {
            console.error('No se encontró el contenedor #product-grid-container en el HTML.');
        }
    } catch (error) {
        console.error('CRÍTICO: Fallo al cargar o renderizar el catálogo:', error);
        const gridContainer = document.getElementById('product-grid-container');
        if (gridContainer) {
            gridContainer.innerHTML = `<div class="error-msg">Lo sentimos, no pudimos cargar los productos. Por favor intenta de nuevo más tarde.</div>`;
        }
    }

    // Aquí inicializaremos Three.js para el canvas 3D más adelante
});


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
        closeCheckoutBtn.addEventListener('click', () => {
            HistoryManager.popState('checkout');
            checkoutOverlay.classList.remove('active');
        });
    }

    // Mobile Menu Actions
    const menuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-sublink');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            HistoryManager.pushState('mobile-menu', () => mobileMenu.classList.remove('active'));
        });
    }
    
    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            HistoryManager.popState('mobile-menu');
            mobileMenu.classList.remove('active');
        });
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
                    if (mobileMenu) {
                        HistoryManager.popState('mobile-menu');
                        mobileMenu.classList.remove('active');
                    }
                
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
            if (window.gsap) gsap.to(submitOrderBtn, {opacity: 0.5, yoyo: true, repeat: -1, duration: 0.3});

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
            const cards  = document.querySelectorAll('.product-card');

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

    // Heart Icon Click Handling (Event Delegation for dynamic cards)
    document.addEventListener('click', (e) => {
        const heartBtn = e.target.closest('.heart-icon-btn');
        if (heartBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const card = heartBtn.closest('.product-card');
            if (card) {
                const id = heartBtn.dataset.id;
                const name = card.querySelector('.product-title')?.textContent || 'Producto';
                const priceStr = card.querySelector('.product-price')?.textContent || '0';
                const price = parseFloat(priceStr.replace(/[^0-9.-]+/g,""));
                const img = card.querySelector('.product-img')?.src;
                
                toggleWishlist({ id, name, price, img });
            }
        }
    });

    // Wishlist Toggle Buttons (Header)
    document.querySelectorAll('.wishlist-btn-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openWishlist();
        });
    });
}

/**
 * Permite girar el logo manualmente y añade efecto 3D tilt
 */
function setupLogoRotation() {
    const logoLink = document.querySelector('.logo-link');
    const logoImg = logoLink?.querySelector('img');
    if (!logoImg) return;

    let isDragging = false;
    let startX = 0;
    let currentRotation = 0;

    // Efecto 3D Tilt al mover el mouse
    logoLink.addEventListener('mousemove', (e) => {
        if (isDragging) return;
        
        const rect = logoLink.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 8; // Sensibilidad vertical
        const rotateY = (centerX - x) / 5; // Sensibilidad horizontal
        
        gsap.to(logoImg, { 
            rotateX: rotateY, // Toco invertido para efecto natural
            rotateY: -rotateX, 
            scale: 1.1,
            duration: 0.5, 
            ease: 'power2.out',
            transformPerspective: 1000
        });
    });

    logoLink.addEventListener('mouseleave', () => {
        if (isDragging) return;
        gsap.to(logoImg, { 
            rotateX: 0, 
            rotateY: 0, 
            scale: 1,
            duration: 0.8, 
            ease: 'back.out(1.7)' 
        });
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
        const rotationJump = deltaX * 1.5; 
        gsap.set(logoImg, { rotation: currentRotation + rotationJump });
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        logoImg.style.cursor = 'grab';
        
        const deltaX = e.clientX - startX;
        currentRotation += deltaX * 1.5;
        
        if (Math.abs(deltaX) > 20) {
            gsap.to(logoImg, { 
                rotation: currentRotation + (deltaX * 2), 
                duration: 1.5, 
                ease: 'power2.out'
            });
        }
    });

    // Touch support para móviles
    logoImg.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    }, {passive: true});

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        gsap.set(logoImg, { rotation: currentRotation + (deltaX * 1.5) });
    }, {passive: true});

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
            if(card) {
               const imgEl = card.querySelector('.product-img');
               const titleEl = card.querySelector('.product-title');
               const priceStr = card.querySelector('.product-price').textContent;
               const price = parseFloat(priceStr.replace(/[^0-9.-]+/g,""));
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
    if (!document.querySelector('.mySwiper')) return;

    const swiper = new Swiper(".mySwiper", {
        // 1. Efecto Coverflow (Apple 3D Style)
        effect: "coverflow",
        coverflowEffect: {
            rotate: 10,     /* Ligera inclinación 3D profesional */
            stretch: 0,     /* Espaciado natural */
            depth: 250,     /* Profundidad en el eje Z */
            modifier: 1,    /* Escala de intensidad */
            slideShadows: false, /* Sin sombras negras agresivas */
        },
        
        grabCursor: true, 
        centeredSlides: true, 
        slidesPerView: "auto", 
        loop: true, 
        speed: 800, 
        
        // 3. Reproducción Automática
        autoplay: {
            delay: 4000, 
            disableOnInteraction: false, 
        },
        
        // 4. Controles de Navegación
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        
        // 5. Controles de Paginación
        pagination: {
            el: ".swiper-pagination",
            clickable: true, 
            dynamicBullets: false, 
        },

        // Optimización de rendimiento
        watchSlidesProgress: true,
    });
}
