/**
 * Global Wishlist State Management
 */
import { HistoryManager } from './utils.js';

let wishlistItems = [];
let isWishlistInitialized = false;

export function initWishlist() {
    if (isWishlistInitialized) return;
    isWishlistInitialized = true;
    
    // Load from local storage
    const saved = localStorage.getItem('libardino_wishlist');
    if (saved) {
        try { 
            const parsed = JSON.parse(saved);
            wishlistItems = Array.isArray(parsed) ? parsed : [];
        } 
        catch (e) { 
            console.error('Error loading wishlist', e);
            wishlistItems = [];
        }
    }
    
    renderWishlist();

    renderWishlist();

    // Use event delegation for drawer-specific events (safer if DOM is re-injected)
    document.addEventListener('click', (e) => {
        // Close Button
        if (e.target.closest('#close-wishlist-btn')) {
            closeWishlist();
        }
        
        // Explore Button (Empty state)
        if (e.target.closest('#btn-explore-wishlist')) {
            closeWishlist();
            window.location.href = 'catalogo.html';
        }
    });

    // Bind global toggle buttons
    document.querySelectorAll('.wishlist-btn-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openWishlist();
        });
    });
}

function saveWishlist() {
    localStorage.setItem('libardino_wishlist', JSON.stringify(wishlistItems));
}

export function openWishlist() {
    const overlay = document.getElementById('wishlist-overlay');
    if (overlay) {
        overlay.classList.add('active');
        HistoryManager.pushState('wishlist', () => closeWishlist());
    }
    document.body.classList.add('wishlist-open');
    renderWishlist();
}

export function closeWishlist() {
    const overlay = document.getElementById('wishlist-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        HistoryManager.popState('wishlist');
    }
    document.body.classList.remove('wishlist-open');
}

export function toggleWishlist(product) {
    const existingIndex = wishlistItems.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
        wishlistItems.splice(existingIndex, 1);
        updateHeartIcons(product.id, false);
    } else {
        wishlistItems.push(product);
        updateHeartIcons(product.id, true);
        // Professional animation effect for the heart button that was clicked
        animateHeartPop(product.id);
    }
    
    saveWishlist();
    renderWishlist();
}

export function isInWishlist(productId) {
    return wishlistItems.some(item => item.id === productId);
}

function updateHeartIcons(productId, active) {
    const icons = document.querySelectorAll(`.heart-icon-btn[data-id="${productId}"]`);
    icons.forEach(icon => {
        if (active) icon.classList.add('active');
        else icon.classList.remove('active');
    });
}

function animateHeartPop(productId) {
    const icons = document.querySelectorAll(`.heart-icon-btn[data-id="${productId}"]`);
    if (window.gsap) {
        icons.forEach(icon => {
            const isActive = icon.classList.contains('active');
            
            // Kill any ongoing animations on this icon
            gsap.killTweensOf(icon);
            
            if (isActive) {
                // Energetic "Add" animation: heartbeat pulse + rotation
                const tl = gsap.timeline();
                tl.to(icon, { 
                    scale: 1.5, 
                    rotation: 15,
                    duration: 0.15, 
                    ease: "power2.out" 
                })
                .to(icon, { 
                    scale: 0.8, 
                    rotation: -10,
                    duration: 0.1, 
                    ease: "power2.in" 
                })
                .to(icon, { 
                    scale: 1.2, 
                    rotation: 0,
                    duration: 0.2, 
                    ease: "back.out(2)" 
                })
                .to(icon, { 
                    scale: 1, 
                    duration: 0.2 
                });
            } else {
                // Subtle "Remove" animation: slight shrink and shake
                gsap.to(icon, {
                    x: (index) => index % 2 === 0 ? -3 : 3,
                    duration: 0.05,
                    repeat: 3,
                    yoyo: true,
                    onComplete: () => gsap.set(icon, { x: 0 })
                });
                gsap.to(icon, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
            }
        });
    }
}

export function renderWishlist() {
    const emptyState = document.getElementById('wishlist-empty-state');
    const filledState = document.getElementById('wishlist-filled-state');
    const itemsWrapper = document.getElementById('wishlist-items-wrapper');
    const badges = document.querySelectorAll('.wishlist-badge');
    
    // Update Badges
    const count = wishlistItems.length;
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        if (window.gsap && count > 0) {
            gsap.killTweensOf(badge);
            gsap.fromTo(badge, {scale: 1.3}, {scale: 1, duration: 0.3});
        }
    });

    if (!emptyState || !filledState) return;

    if (wishlistItems.length === 0) {
        emptyState.style.display = 'flex';
        filledState.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        filledState.style.display = 'flex';
        
        if (itemsWrapper) {
            itemsWrapper.innerHTML = '';
            wishlistItems.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'wishlist-item';
                itemEl.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" class="wishlist-item-img">
                    <div class="wishlist-item-info">
                        <div class="wishlist-item-title">${item.name}</div>
                        <div class="wishlist-item-price">$${item.price.toLocaleString()}</div>
                        <button class="btn-wishlist-add-cart" data-index="${index}">AGREGAR AL CARRITO</button>
                    </div>
                    <button class="btn-remove-wishlist" data-index="${index}" aria-label="Quitar">×</button>
                `;
                itemsWrapper.appendChild(itemEl);
            });
            
            attachWishlistEvents();
        }
    }
}

function attachWishlistEvents() {
    document.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            const product = wishlistItems[idx];
            toggleWishlist(product);
        });
    });

    document.querySelectorAll('.btn-wishlist-add-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            const product = wishlistItems[idx];
            
            // Import cart state functions
            const { addToCart, openCart } = await import('./cartState.js');
            
            // Add to cart
            addToCart({
                ...product,
                qty: 1,
                size: product.defaultSize || 'M',
                color: product.defaultColor || 'Único'
            });
            
            // Close Wishlist and Open Cart immediately
            closeWishlist();
            
            // Small delay for smooth transition between drawers
            setTimeout(() => {
                openCart();
            }, 300);
        });
    });
}
