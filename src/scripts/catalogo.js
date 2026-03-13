/**
 * catalogo.js
 * Handles catalog page: reads URL params, fetches products, filters, sorts, and renders.
 */

import { ProductCard } from '../components/product/ProductCard.js';
import { MiniCart } from '../components/cart/MiniCart.js';
import { CheckoutModal } from '../components/forms/CheckoutForm.js';
import { initCart, addToCart, openCart, procesarCompraWhatsApp } from './cartState.js';

// -------------------------------
// Config maps for display labels
// -------------------------------
const CATEGORIA_META = {
    buzos:      { label: 'Buzos & Sudaderas', heroTitle: 'BUZOS &<br><span>SUDADERAS</span>', sub: 'Oversize con 300GSM · La comodidad que defines.' },
    camisetas:  { label: 'Camisetas', heroTitle: 'CAMI<span>SETAS</span>', sub: 'Corte relajado · Tejidos premium.' },
    conjuntos:  { label: 'Conjuntos', heroTitle: 'CON<span>JUNTOS</span>', sub: 'El look completo en un solo movimiento.' },
    pantalones: { label: 'Pantalones', heroTitle: 'PANTA<span>LONES</span>', sub: 'Cargo, wide-leg y relaxed fit.' },
};

const GENERO_META = {
    hombre: { label: 'Hombre', heroTitle: 'COLECCIÓN<br><span>HOMBRE</span>', sub: 'Streetwear urban para él.' },
    mujer:  { label: 'Mujer',  heroTitle: 'COLECCIÓN<br><span>MUJER</span>',  sub: 'Estilo oversize para ella.' },
};

const ALL_CATEGORIAS = Object.keys(CATEGORIA_META);

// -------------------------------
// App entry point
// -------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // Inject cart & checkout modals
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) cartContainer.innerHTML = MiniCart();
    const checkoutContainer = document.getElementById('checkout-container');
    if (checkoutContainer) checkoutContainer.innerHTML = CheckoutModal();

    initCart();
    setupMenuInteractions();

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const categoriaParam = params.get('categoria')?.toLowerCase() || null;
    const generoParam    = params.get('genero')?.toLowerCase()    || null;

    // Fetch all products
    let allProducts = [];
    try {
        const res = await fetch('./MOCK_DATA/productos.json');
        if (!res.ok) throw new Error('Network error');
        allProducts = await res.json();
    } catch (e) {
        console.error('Error cargando productos:', e);
        document.getElementById('catalog-grid-container').innerHTML =
            '<p style="text-align:center;padding:3rem;color:#999;">No se pudieron cargar los productos.</p>';
        return;
    }

    // Apply initial filter based on URL param
    updateHero(categoriaParam, generoParam);
    buildFilterChips(allProducts, categoriaParam, generoParam);
    renderProducts(applyFilters(allProducts, categoriaParam, generoParam));

    // Sort handler
    document.getElementById('sort-select').addEventListener('change', (e) => {
        const activeChip = document.querySelector('.chip.active');
        const activeCat = activeChip ? activeChip.dataset.cat || null : null;
        const activeGen = activeChip ? activeChip.dataset.gen || null : null;
        renderProducts(applyFilters(allProducts, activeCat, activeGen, e.target.value));
    });

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
    const labelEl   = document.getElementById('hero-label');
    const titleEl   = document.getElementById('hero-title');
    const subEl     = document.getElementById('hero-sub');

    if (categoria && CATEGORIA_META[categoria]) {
        const m = CATEGORIA_META[categoria];
        if (labelEl) labelEl.textContent = m.label;
        if (titleEl) titleEl.innerHTML   = m.heroTitle;
        if (subEl) subEl.textContent     = m.sub;
        document.title = `${m.label} | Ellel Oversize`;
    } else if (genero && GENERO_META[genero]) {
        const m = GENERO_META[genero];
        if (labelEl) labelEl.textContent = m.label;
        if (titleEl) titleEl.innerHTML   = m.heroTitle;
        if (subEl) subEl.textContent     = m.sub;
        document.title = `${m.label} | Ellel Oversize`;
    } else {
        if (labelEl) labelEl.textContent = 'Colección Completa';
        if (titleEl) titleEl.innerHTML   = 'TODOS LOS <span>MODELOS</span>';
        if (subEl) subEl.textContent     = 'Streetwear oversize de calidad premium';
        document.title = 'Catálogo | Ellel Oversize';
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
        { label: '<span>♂</span> Hombre',  cat: null,       gen: 'hombre' },
        { label: '<span>♀</span> Mujer',   cat: null,       gen: 'mujer' },
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
            gsap.to(btn, { 
                y: 4, 
                duration: 0.15, 
                ease: "power2.inOut",
                onComplete: () => {
                    gsap.to(btn, { 
                        y: 2, 
                        duration: 0.4, 
                        ease: "elastic.out(1, 0.75)" 
                    });
                }
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
    const menuBtn      = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu   = document.getElementById('mobile-menu');

    if (menuBtn  && mobileMenu) menuBtn.addEventListener('click',  () => mobileMenu.classList.add('active'));
    if (closeMenuBtn && mobileMenu) closeMenuBtn.addEventListener('click', () => mobileMenu.classList.remove('active'));

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
}
