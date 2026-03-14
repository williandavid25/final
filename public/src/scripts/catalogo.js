/**
 * catalogo.js
 * Handles catalog page: reads URL params, fetches products, filters, sorts, and renders.
 */

import { ProductCard } from '../components/product/ProductCard.js';
import { MiniCart } from '../components/cart/MiniCart.js';
import { CheckoutModal } from '../components/forms/CheckoutForm.js';
import { initCart, addToCart, openCart, procesarCompraWhatsApp } from './cartState.js';
import { WishlistDrawer } from '../components/wishlist/WishlistDrawer.js';
import { initWishlist, toggleWishlist, openWishlist } from './wishlistState.js';
import { initProductClickAnimations } from './animations.js';
import { initGoogleAuth, initAuthEvents, AuthModal } from './auth.js';
import { HistoryManager } from './utils.js';

// -------------------------------
// Config maps for display labels
// -------------------------------
const CATEGORIA_META = {
    buzos:      { label: 'NUEVA TEMPORADA', heroTitle: 'NUESTROS <span class="text-yellow">BUZOS</span>', sub: 'Diseños exclusivos con el mejor gramaje y confort.' },
    camisetas:  { label: 'PREMIUM COTTON',  heroTitle: 'BASIC <span class="text-yellow">OVERSAYS</span>',  sub: 'Calidad superior en cada fibra y estilo relajado.' },
    conjuntos:  { label: 'LOOK COMPLETO',   heroTitle: 'NUESTROS <span class="text-yellow">CONJUNTOS</span>', sub: 'La mejor combinación urbana lista para cualquier ocasión.' },
    pantalones: { label: 'COLECCIÓN 2026',  heroTitle: 'ESTILO <span class="text-yellow">RELAXED</span>',   sub: 'Pantalones con el calce perfecto para tu día a día.' },
};

const GENERO_META = {
    hombre: { label: 'URBAN STYLE', heroTitle: 'COLECCIÓN <span class="text-yellow">HOMBRE</span>', sub: 'Streetwear premium para el hombre moderno' },
    mujer:  { label: 'URBAN STYLE', heroTitle: 'COLECCIÓN <span class="text-yellow">MUJER</span>', sub: 'Estilo oversize diseñado exclusivamente para ella' },
};

const ALL_CATEGORIAS = Object.keys(CATEGORIA_META);

// -------------------------------
// App entry point
// -------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // Start history manager
    HistoryManager.init();

    // Inject cart & checkout modals
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) cartContainer.innerHTML = MiniCart();
    const checkoutContainer = document.getElementById('checkout-container');
    if (checkoutContainer) checkoutContainer.innerHTML = CheckoutModal();

    const wishlistContainer = document.getElementById('wishlist-container');
    if (wishlistContainer) wishlistContainer.innerHTML = WishlistDrawer();

    const authContainer = document.getElementById('auth-container');
    if (authContainer) authContainer.innerHTML = AuthModal();

    initCart();
    initWishlist();
    initAuthEvents();
    initGoogleAuth();
    initProductClickAnimations();
    setupMenuInteractions();

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const categoriaParam = params.get('categoria')?.toLowerCase() || null;
    const generoParam    = params.get('genero')?.toLowerCase()    || null;

    // Fetch and Render
    try {
        console.log('Catálogo: Iniciando carga de productos...');
        const res = await fetch('./MOCK_DATA/productos.json');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const allProducts = await res.json();
        console.log(`Catálogo: ${allProducts.length} productos cargados. Iniciando renderizado...`);

        updateHero(categoriaParam, generoParam);
        console.log('Catálogo: Hero actualizado.');
        buildFilterChips(allProducts, categoriaParam, generoParam);
        console.log('Catálogo:Chips construidos.');
        renderProducts(applyFilters(allProducts, categoriaParam, generoParam));
        console.log('Catálogo: Productos renderizados.');
        
        // Sort handler
        const sortSelect = document.getElementById('sort-select');
            sortSelect.addEventListener('change', (e) => {
                const activeChip = document.querySelector('.filter-chip.active');
                const activeCat = activeChip ? activeChip.dataset.cat || null : null;
                const activeGen = activeChip ? activeChip.dataset.gen || null : null;
                renderProducts(applyFilters(allProducts, activeCat, activeGen, e.target.value));
            });

    } catch (e) {
        console.error('Catálogo: Error crítico en inicialización:', e);
        const container = document.getElementById('catalog-grid-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding: 4rem 2rem; color: #666;">
                    <p>Lo sentimos, no pudimos cargar el catálogo en este momento.</p>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.8rem 1.6rem; background: #000; color: #fff; border: none; border-radius: 99px; cursor: pointer;">Reintentar</button>
                </div>`;
        }
    }

    // Scroll-triggered header
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        }
    });
});

// -------------------------------
// Hero Banner
// -------------------------------
function updateHero(categoria, genero) {
    const heroEl    = document.getElementById('catalog-hero');
    const labelEl   = document.getElementById('hero-label');
    const titleEl   = document.getElementById('hero-title');
    const subEl     = document.getElementById('hero-sub');

    if (!heroEl) return;

    // Reset hero classes
    const heroClasses = ['hero-buzos', 'hero-camisetas', 'hero-catalogo', 'hero-conjuntos', 'hero-hombre', 'hero-mujer', 'hero-pantalones'];
    heroEl.classList.remove(...heroClasses);
    heroEl.classList.add('hero-section');

    const hasGSAP = typeof gsap !== 'undefined';

    const performUpdate = () => {
        if (categoria && CATEGORIA_META[categoria]) {
            const m = CATEGORIA_META[categoria];
            if (labelEl) labelEl.textContent = m.label;
            if (titleEl) titleEl.innerHTML   = m.heroTitle;
            if (subEl) subEl.textContent     = m.sub;
            heroEl.classList.add(`hero-${categoria}`);
            document.title = `${m.label} | Ellel Oversize`;
        } else if (genero && GENERO_META[genero]) {
            const m = GENERO_META[genero];
            if (labelEl) labelEl.textContent = m.label;
            if (titleEl) titleEl.innerHTML   = m.heroTitle;
            if (subEl) subEl.textContent     = m.sub;
            heroEl.classList.add(`hero-${genero}`);
            document.title = `${m.label} | Ellel Oversize`;
        } else {
            if (labelEl) labelEl.textContent = 'COLECCIÓN COMPLETA';
            if (titleEl) titleEl.innerHTML   = 'TODOS LOS <span class="text-yellow">MODELOS</span>';
            if (subEl) subEl.textContent     = 'Streetwear oversize de calidad premium para redefinir tu estilo.';
            heroEl.classList.add('hero-catalogo');
            document.title = 'Catálogo | Ellel Oversize';
        }
        
        if (hasGSAP) {
            gsap.to('.hero-content', { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
        }
    };

    if (hasGSAP) {
        gsap.to('.hero-content', { opacity: 0, y: 15, duration: 0.3, onComplete: performUpdate });
    } else {
        performUpdate();
    }
}

// -------------------------------
// Filter Chips
// -------------------------------
function buildFilterChips(products, activeCat, activeGen) {
    const container = document.getElementById('filter-chips');
    if (!container) return;

    const chipsConfig = [
        { label: 'Todos',      cat: null,       gen: null },
        { label: 'Hombre',     cat: null,       gen: 'hombre' },
        { label: 'Mujer',      cat: null,       gen: 'mujer' },
        { label: 'Buzos',      cat: 'buzos',    gen: null },
        { label: 'Camisetas',  cat: 'camisetas', gen: null },
        { label: 'Conjuntos',  cat: 'conjuntos', gen: null },
        { label: 'Pantalones', cat: 'pantalones', gen: null },
    ];

    container.innerHTML = chipsConfig.map(chip => {
        const isActive = (chip.cat === activeCat && chip.gen === activeGen) ? 'active' : '';
        return `<button class="filter-chip ${isActive}" data-cat="${chip.cat || ''}" data-gen="${chip.gen || ''}">${chip.label}</button>`;
    }).join('');

    // Cinematic Entrance Stagger
    gsap.from(".filter-chip", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: "expo.out",
        clearProps: "all"
    });

    container.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (btn.classList.contains('active')) return;

            // Remove active from others
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            // Add to current
            btn.classList.add('active');

            const cat = btn.dataset.cat || null;
            const gen = btn.dataset.gen || null;
            const sort = document.getElementById('sort-select').value;

            updateHero(cat, gen);
            renderProducts(applyFilters(products, cat, gen, sort));

            // GSAP Professional 3D mechanical feedback
            gsap.timeline()
                .to(btn, { scale: 0.95, y: 2, duration: 0.1, ease: "power2.inOut" })
                .to(btn, { 
                    scale: 1.05, 
                    y: -2, 
                    duration: 0.4, 
                    ease: "elastic.out(1.2, 0.5)" 
                });

            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.delete('categoria');
            url.searchParams.delete('genero');
            if (cat) url.searchParams.set('categoria', cat);
            if (gen) url.searchParams.set('genero', gen);
            window.history.replaceState({}, '', url);
        });
    });
}

// -------------------------------
// Filter + Sort
// -------------------------------
function applyFilters(products, cat, gen, sort = 'default') {
    let filtered = [...products];
    if (cat) filtered = filtered.filter(p => p.categoria === cat);
    if (gen) filtered = filtered.filter(p => p.genero === gen);

    switch (sort) {
        case 'precio-asc':  filtered.sort((a, b) => a.precio - b.precio); break;
        case 'precio-desc': filtered.sort((a, b) => b.precio - a.precio); break;
        case 'nuevo':       filtered.sort((a, b) => b.esNuevo - a.esNuevo); break;
    }

    return filtered;
}

// -------------------------------
// Render
// -------------------------------
function renderProducts(products) {
    const container = document.getElementById('catalog-grid-container');
    const countEl   = document.getElementById('result-count');

    if (countEl) countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}`;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-catalog">
                <h3>Sin resultados</h3>
                <p>No hay productos disponibles con los filtros seleccionados.</p>
                <a href="catalogo.html">Ver todos los productos</a>
            </div>`;
        return;
    }

    const html = `<div class="product-grid catalog-loaded">${products.map(p => ProductCard(p)).join('')}</div>`;
    container.innerHTML = html;

    // Bind cart buttons
    container.querySelectorAll('.add-to-cart-hidden').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card  = e.target.closest('.product-card');
            if (!card) return;
            const imgEl = card.querySelector('.product-img');
            const titleEl = card.querySelector('.product-title');
            const priceStr = card.querySelector('.product-price')?.textContent || '0';
            const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, ''));
            const id    = e.target.getAttribute('data-id');
            addToCart({
                id:    id || Math.random().toString(),
                name:  titleEl ? titleEl.textContent : 'Producto',
                price: price || 0,
                qty:   1,
                img:   imgEl ? imgEl.src : './src/assets/img/logo-square.png',
                size:  'M',
                color: 'Negro'
            });
        });
    });
}

// -------------------------------
// Menu / UI interactions
// -------------------------------
function setupMenuInteractions() {
    const menuBtn = document.getElementById('open-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const menu = document.getElementById('mobile-menu');

    if (menuBtn  && menu) menuBtn.addEventListener('click',  () => menu.classList.add('active'));
    if (closeBtn && menu) closeBtn.addEventListener('click', () => menu.classList.remove('active'));

    const checkoutBtn       = document.getElementById('btn-checkout-whatsapp');
    const checkoutOverlay   = document.getElementById('checkout-overlay');
    const closeCheckoutBtn  = document.getElementById('close-checkout-btn');
    const cartOverlay       = document.getElementById('cart-overlay');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', procesarCompraWhatsApp);
    }
    if (closeCheckoutBtn && checkoutOverlay) {
        closeCheckoutBtn.addEventListener('click', () => checkoutOverlay.classList.remove('active'));
    }

    // Checkout form handler
    const checkoutForm = document.getElementById('checkout-form-minimal');
    const submitBtn = document.querySelector('.btn-checkout-submit');
    const emailInput = document.getElementById('email-min');
    if (checkoutForm && submitBtn) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'PROCESANDO...';
            submitBtn.disabled = true;
            setTimeout(() => {
                submitBtn.style.color = 'green';
                submitBtn.textContent = `PAGO EXITOSO`;
                localStorage.removeItem('ellel_cart');
                setTimeout(() => {
                    checkoutOverlay.classList.remove('active');
                    checkoutForm.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.style.color = '';
                    submitBtn.disabled = false;
                    window.location.reload();
                }, 2500);
            }, 1500);
        });
    }

    // Search button
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = prompt('¿Qué estás buscando?');
            if (query) alert(`Buscando "${query}"...`);
        });
    }

    // Wishlist Event Delegation
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

    // Header Wishlist Button
    document.querySelectorAll('.wishlist-btn-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openWishlist();
        });
    });
}
