/**
 * Global Cart State Management
 * Handles adding/removing items, localStorage, and rendering the MiniCart contents.
 */

let cartItems = [];
let isCartInitialized = false;

export function initCart() {
    if (isCartInitialized) return;
    isCartInitialized = true;
    
    cartItems = []; // Reset on load
    
    // Load from local storage
    const saved = localStorage.getItem('ellel_cart');
    if (saved) {
        try { Object.assign(cartItems, JSON.parse(saved)); } 
        catch (e) { console.error('Error loading cart', e); }
    }
    renderCart();

    // Rebind cart toggle (index.js may have bound it, but we handle dynamic buttons here)
    const cartOverlay = document.getElementById('cart-overlay');
    const closeBtn = document.getElementById('close-cart-btn');
    const keepShopping = document.getElementById('btn-keep-shopping');
    
    if (closeBtn && cartOverlay) {
        closeBtn.addEventListener('click', () => closeCart());
    }
    if (keepShopping && cartOverlay) {
        keepShopping.addEventListener('click', () => closeCart());
    }
    
    // Bind global open buttons if any
    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', () => openCart());
    });
}

function saveCart() {
    localStorage.setItem('ellel_cart', JSON.stringify(cartItems));
}

export function openCart() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.classList.add('active');
    document.body.classList.add('cart-open');
    renderCart();
}

export function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('cart-open');
}

export function addToCart(product) {
    // product should match: { id, name, price, qty, img, size, color }
    const existingIndex = cartItems.findIndex(item => item.id === product.id && item.size === product.size && item.color === product.color);
    
    if (existingIndex > -1) {
        cartItems[existingIndex].qty += product.qty;
    } else {
        cartItems.push(product);
    }
    
    saveCart();
    renderCart();
    openCart();
}

export function removeFromCart(index) {
    cartItems.splice(index, 1);
    saveCart();
    renderCart();
}

export function updateQty(index, newQty) {
    if (newQty < 1) {
        removeFromCart(index);
    } else {
        cartItems[index].qty = newQty;
        saveCart();
        renderCart();
    }
}

export function renderCart() {
    const emptyState = document.getElementById('cart-empty-state');
    const filledState = document.getElementById('cart-filled-state');
    const itemsWrapper = document.getElementById('cart-items-wrapper');
    const subtotalEl = document.getElementById('cart-subtotal');
    
    // Update Global Badge
    const badges = document.querySelectorAll('.cart-badge');
    const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
    badges.forEach(b => {
        b.textContent = totalItems;
        if(window.gsap && totalItems > 0) gsap.fromTo(b, {scale: 1.5}, {scale: 1, duration: 0.3});
    });

    if (!emptyState || !filledState) return;

    if (cartItems.length === 0) {
        // Show Empty View (Reference image)
        emptyState.style.display = 'flex';
        filledState.style.display = 'none';
        
        // Ensure get offer button pulse happens
        const getOfferBtn = document.getElementById('btn-get-offer');
        if (getOfferBtn) {
            getOfferBtn.classList.add('vibrate-anim');
            getOfferBtn.addEventListener('click', () => {
                window.location.href = 'catalogo.html?oferta=true';
            });
        }
        
    } else {
        // Show Filled View
        emptyState.style.display = 'none';
        filledState.style.display = 'flex';
        
        // Render items
        if (itemsWrapper) {
            itemsWrapper.innerHTML = '';
            let subtotal = 0;
            
            cartItems.forEach((item, index) => {
                subtotal += (item.price * item.qty);
                
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-meta">Talla: ${item.size} | Color: ${item.color}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-qty-controls">
                            <button class="cart-qty-btn decrease" data-index="${index}">-</button>
                            <span class="cart-qty-val">${item.qty}</span>
                            <button class="cart-qty-btn increase" data-index="${index}">+</button>
                        </div>
                    </div>
                    <button class="btn-remove-item" data-index="${index}">Quitar</button>
                `;
                itemsWrapper.appendChild(itemEl);
            });
            
            if (subtotalEl) {
                subtotalEl.textContent = `$${subtotal.toFixed(2)} COP`;
            }
            
            // Bind item events
            attachItemEvents();
        }
    }
}

function attachItemEvents() {
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            removeFromCart(idx);
        });
    });
    
    document.querySelectorAll('.cart-qty-btn.decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            updateQty(idx, cartItems[idx].qty - 1);
        });
    });
    
    document.querySelectorAll('.cart-qty-btn.increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            updateQty(idx, cartItems[idx].qty + 1);
        });
    });
}

export function procesarCompraWhatsApp() {
    if (cartItems.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    const telefono = "593980862064"; 
    let mensaje = "Hola Ellel Oversize, deseo realizar el siguiente pedido:\n\n";
    let total = 0;

    cartItems.forEach(item => {
        const subtotal = item.qty * item.price;
        total += subtotal;
        mensaje += `- ${item.qty}x ${item.name} (${item.size} / ${item.color}) - $${subtotal.toFixed(2)}\n`;
    });

    mensaje += `\n*Total a pagar: $${total.toFixed(2)}*\n\n`;
    mensaje += "Quedo atento para coordinar el pago y envío.";

    const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}
