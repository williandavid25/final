/**
 * search.js — Live product search engine
 * Fetches productos.json once, caches it, and filters by keyword
 * across: nombre, descripcion, categoria, genero.
 * Opens search modal on search-btn click in any page.
 */

let productsCache = null;

// ── Load data ──────────────────────────────────────────────────
async function loadProducts() {
    if (productsCache) return productsCache;
    try {
        const rootPath = getRootPath();
        const res = await fetch(rootPath + 'MOCK_DATA/productos.json');
        productsCache = await res.json();
    } catch (e) {
        console.warn('Search: could not load products.json', e);
        productsCache = [];
    }
    return productsCache;
}

/** Detect root path so it works from any sub-page */
function getRootPath() {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    return depth > 1 ? '../'.repeat(depth - 1) : './';
}

// ── Filter ────────────────────────────────────────────────────
function filterProducts(products, query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/);

    return products.filter(p => {
        const haystack = [
            p.nombre       || '',
            p.descripcion  || '',
            p.categoria    || '',
            p.genero       || '',
        ].join(' ').toLowerCase();
        return terms.every(t => haystack.includes(t));
    }).slice(0, 12); // max 12 results
}

// ── Render results ────────────────────────────────────────────
function renderResults(results, query) {
    const body = document.getElementById('search-body');
    if (!body) return;

    if (!query || query.trim().length < 2) {
        body.innerHTML = '<p class="search-hint">Escribe para buscar productos...</p>';
        return;
    }

    if (results.length === 0) {
        body.innerHTML = `<p class="search-empty">Sin resultados para "<strong>${query}</strong>"</p>`;
        return;
    }

    const rootPath = getRootPath();

    body.innerHTML = `
        <p class="search-category-label">Productos (${results.length})</p>
        <div class="search-results-grid">
            ${results.map(p => {
                const img = (p.imagenes && p.imagenes[0])
                    ? p.imagenes[0].replace('./', rootPath)
                    : rootPath + 'src/assets/img/logo-square.png';
                const precio = typeof p.precio === 'number'
                    ? `$${p.precio.toFixed(2)}`
                    : p.precio;
                return `
                    <a href="${rootPath}producto.html?id=${p.id}" class="search-product-card" aria-label="${p.nombre}">
                        <img src="${img}" alt="${p.nombre}" class="search-product-img" loading="lazy">
                        <div class="search-product-name">${p.nombre}</div>
                        <div class="search-product-price">${precio}</div>
                    </a>`;
            }).join('')}
        </div>
    `;
}

// ── Modal open / close ─────────────────────────────────────────
function openSearchModal() {
    const overlay = document.getElementById('search-modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
        const input = document.getElementById('search-input');
        if (input) { input.focus(); input.value = ''; }
        renderResults([], '');
    }
}

function closeSearchModal() {
    const overlay = document.getElementById('search-modal-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ── Init ──────────────────────────────────────────────────────
export function initSearch() {
    // Inject modal HTML if not present
    if (!document.getElementById('search-modal-overlay')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="search-modal-overlay" id="search-modal-overlay">
                <div class="search-panel" role="dialog" aria-label="Buscar productos">
                    <div class="search-input-row">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            type="text"
                            id="search-input"
                            class="search-input"
                            placeholder="Buscar productos..."
                            autocomplete="off"
                            spellcheck="false"
                        >
                        <button class="search-close-btn" id="search-close-btn" aria-label="Cerrar búsqueda">✕</button>
                    </div>
                    <div class="search-body" id="search-body">
                        <p class="search-hint">Escribe para buscar productos...</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div.firstElementChild);
    }

    // Load products in background
    loadProducts();

    // Open on any search button click
    document.querySelectorAll('.search-btn').forEach(btn => {
        btn.addEventListener('click', openSearchModal);
    });

    // Close on X button or overlay click
    document.addEventListener('click', (e) => {
        if (e.target.closest('#search-close-btn')) closeSearchModal();
        if (e.target.id === 'search-modal-overlay') closeSearchModal();
        // Navigate on result click closes modal
        if (e.target.closest('.search-product-card')) closeSearchModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearchModal();
    });

    // Live search as user types
    let debounceTimer;
    document.addEventListener('input', async (e) => {
        if (e.target.id !== 'search-input') return;
        clearTimeout(debounceTimer);
        const query = e.target.value;
        debounceTimer = setTimeout(async () => {
            const products = await loadProducts();
            const results  = filterProducts(products, query);
            renderResults(results, query);
        }, 220); // 220ms debounce
    });
}
