/**
 * Global Cart State Management (Connected to D1 API)
 */

import { getUser } from './auth.js';

let cartItems = [];
let isCartInitialized = false;

const API_BASE = '/api';

async function fetchAPI(path, options = {}) {
    const user = getUser();
    const token = localStorage.getItem('ellel_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
        if (res.status === 401) return null;
        const err = await res.json();
        throw new Error(err.error || 'Cart API Error');
    }
    return res.json();
}

export async function initCart() {
    if (isCartInitialized) return;
    isCartInitialized = true;

    await loadCartFromAPI();

    // Rebind cart toggle
    const closeBtn = document.getElementById('close-cart-btn');
    const keepShopping = document.getElementById('btn-keep-shopping');

    if (closeBtn) closeBtn.addEventListener('click', () => closeCart());
    if (keepShopping) keepShopping.addEventListener('click', () => closeCart());

    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', () => openCart());
    });
}

async function loadCartFromAPI() {
    const user = getUser();
    if (!user) {
        cartItems = [];
        renderCart();
        return;
    }
    try {
        const items = await fetchAPI('/carrito');
        if (items) {
            cartItems = items;
            renderCart();
        }
    } catch (e) {
        console.error('Error loading cart from API:', e);
    }
}

export function openCart() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.classList.add('active');
    document.body.classList.add('cart-open');
    loadCartFromAPI();
}

export function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('cart-open');
}

export async function addToCart(product) {
    const user = getUser();
    if (!user) {
        alert("Por favor inicia sesión para añadir al carrito.");
        window.dispatchEvent(new CustomEvent('openAuth'));
        return;
    }

    try {
        await fetchAPI('/carrito', {
            method: 'POST',
            body: JSON.stringify({
                producto_id: product.id,
                talla_id: product.sizeId || null,
                color_id: product.colorId || null,
                cantidad: product.qty || 1
            })
        });
        await loadCartFromAPI();
        openCart();
    } catch (err) {
        alert(err.message);
    }
}

export async function removeFromCart(id) {
    try {
        await fetchAPI(`/carrito/${id}`, { method: 'DELETE' });
        await loadCartFromAPI();
    } catch (e) {
        alert(e.message);
    }
}

export async function updateQty(id, newQty) {
    if (newQty < 1) return removeFromCart(id);
    try {
        await fetchAPI(`/carrito/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ cantidad: newQty })
        });
        await loadCartFromAPI();
    } catch (e) {
        alert(e.message);
    }
}

export async function renderCart() {
    const emptyState = document.getElementById('cart-empty-state');
    const filledState = document.getElementById('cart-filled-state');
    const itemsWrapper = document.getElementById('cart-items-wrapper');
    const subtotalEl = document.getElementById('cart-subtotal');

    const totalItems = cartItems.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.textContent = totalItems;
    });

    if (!emptyState || !filledState) return;

    if (cartItems.length === 0) {
        emptyState.style.display = 'flex';
        filledState.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        filledState.style.display = 'flex';

        if (itemsWrapper) {
            itemsWrapper.innerHTML = '';
            let subtotal = 0;

            cartItems.forEach((item) => {
                const precio = item.precio_oferta || item.precio;
                subtotal += (precio * item.cantidad);

                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <img src="${item.imagen_url}" alt="${item.nombre}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.nombre}</div>
                        <div class="cart-item-meta">${item.talla_nombre || ''} ${item.color_nombre ? '| ' + item.color_nombre : ''}</div>
                        <div class="cart-item-price">$${precio.toFixed(2)}</div>
                        <div class="cart-item-qty-controls">
                            <button class="cart-qty-btn decrease" data-id="${item.id}">-</button>
                            <span class="cart-qty-val">${item.cantidad}</span>
                            <button class="cart-qty-btn increase" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="btn-remove-item" data-id="${item.id}">Quitar</button>
                `;
                itemsWrapper.appendChild(itemEl);
            });

            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            attachItemEvents();
        }
    }

    // Always ensure auth UI is synced after render
    try {
        const { updateCartAuthUI, getUser } = await import('./auth.js');
        updateCartAuthUI(getUser());
    } catch (e) { console.warn('Auth sync failed in renderCart'); }
}

function attachItemEvents() {
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.onclick = () => removeFromCart(btn.dataset.id);
    });

    document.querySelectorAll('.cart-qty-btn.decrease').forEach(btn => {
        btn.onclick = () => {
            const item = cartItems.find(i => i.id == btn.dataset.id);
            if (item) updateQty(item.id, item.cantidad - 1);
        };
    });

    document.querySelectorAll('.cart-qty-btn.increase').forEach(btn => {
        btn.onclick = () => {
            const item = cartItems.find(i => i.id == btn.dataset.id);
            if (item) updateQty(item.id, item.cantidad + 1);
        };
    });
}

export function procesarCompraWhatsApp() {
    if (cartItems.length === 0) return alert("El carrito está vacío.");

    const telefono = "593980862064";
    let mensaje = "Hola Ellel Oversize, deseo realizar el siguiente pedido:\n\n";
    let total = 0;

    cartItems.forEach(item => {
        const precio = item.precio_oferta || item.precio;
        const subtotal = item.cantidad * precio;
        total += subtotal;
        mensaje += `- ${item.cantidad}x ${item.nombre} (${item.talla_nombre || ''} ${item.color_nombre || ''}) - $${subtotal.toFixed(2)}\n`;
    });

    mensaje += `\n*Total a pagar: $${total.toFixed(2)}*\n\n`;
    const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}
