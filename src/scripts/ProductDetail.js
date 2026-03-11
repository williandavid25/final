/**
 * Product Detail Page Interactivity
 * Handles size selection, color swapping, quantity calculation and adding to cart.
 */
import { initCart, addToCart, openCart, procesarCompraWhatsApp } from './cartState.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Only run if we are on the product detail page
    if (!document.getElementById('pdp-main-img')) return;
    
    // Init Cart Logic Globally Here too
    initCart();

    // --- Dynamic Data Loading ---
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        try {
            console.log(`PDP: Intentando cargar producto ID: ${productId}`);
            const response = await fetch('./MOCK_DATA/productos.json');
            
            if (!response.ok) {
                throw new Error(`PDP: Error de red ${response.status}`);
            }

            const data = await response.json();
            const product = data.find(p => p.id === productId);

            if (product) {
                console.log(`PDP: Producto encontrado: ${product.nombre}`);
                // Update DOM elements with real product data
                const titleEl = document.getElementById('pdp-title');
                const priceEl = document.getElementById('pdp-price');
                const mainImg = document.getElementById('pdp-main-img');
                
                if (titleEl) titleEl.textContent = product.nombre;
                if (priceEl) priceEl.textContent = `$${product.precio.toFixed(2)}`;
                
                // Update Description Link Text as a stand-in for description
                const descLink = document.querySelector('.pdp-desc-link');
                if (descLink) descLink.textContent = product.descripcion;

                // Update Image
                if (mainImg && product.imagenes && product.imagenes[0]) {
                    mainImg.src = product.imagenes[0];
                    mainImg.alt = product.nombre;
                }
                
                // Actualizar tallas y colores si es necesario dinamicamente (Opcional)
                console.log('PDP: Vista de detalle actualizada correctamente.');
                
                // Show the container smoothly now that the correct data is in place
                const wrapper = document.getElementById('pdp-wrapper');
                if (wrapper) {
                    if (window.gsap) gsap.to(wrapper, { opacity: 1, duration: 0.4, ease: 'power2.out' });
                    else wrapper.style.opacity = 1;
                }
            } else {
                console.error(`PDP: Producto con ID ${productId} no existe en MOCK_DATA.`);
                alert("Producto no encontrado. Volviendo al catálogo...");
                window.location.href = "index.html";
            }
        } catch (error) {
            console.error("PDP: Error crítico cargando detalle de producto:", error);
            const wrapper = document.getElementById('pdp-wrapper');
            if (wrapper) wrapper.style.opacity = 1; 
        }
    } else {
        console.warn("PDP: Se accedió a la página de producto sin un ID válido.");
        // No ID provided, just show the hardcoded generic layout
        const wrapper = document.getElementById('pdp-wrapper');
        if (wrapper) {
            if (window.gsap) gsap.to(wrapper, { opacity: 1, duration: 0.4, ease: 'power2.out' });
            else wrapper.style.opacity = 1;
        }
    }

    // --- State ---
    let qty = 1;
    let isFavorited = false;
    let selectedSize = "L"; // Match the pre-selected HTML 'active' class
    let selectedColor = "Negro"; // Match HTML default

    // --- DOM Elements ---
    const sizeBoxes = document.querySelectorAll('.btn-size-box');
    const colorSwatches = document.querySelectorAll('.swatch');
    
    const btnQtyMinus = document.getElementById('btn-qty-minus');
    const btnQtyPlus = document.getElementById('btn-qty-plus');
    const displayQty = document.getElementById('pdp-qty-display');
    
    const btnFavorite = document.getElementById('pdp-fav-btn');
    const btnAddToCart = document.getElementById('btn-add-to-cart');
    const btnBuyNow = document.getElementById('btn-buy-now');
    const clickFavRow = document.querySelector('.pdp-fav-row');

    // --- Size Selection Logic ---
    if (sizeBoxes.length > 0) {
        sizeBoxes.forEach(box => {
            box.addEventListener('click', (e) => {
                // Remove active from all
                sizeBoxes.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                e.target.classList.add('active');
                selectedSize = e.target.getAttribute('data-size') || e.target.textContent;
                // Optional micro-animation
                if (window.gsap) gsap.fromTo(e.target, { scale: 0.95 }, { scale: 1, duration: 0.2 });
            });
        });
    }

    // --- Color Swatches Logic ---
    if (colorSwatches.length > 0) {
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                colorSwatches.forEach(s => s.classList.remove('active'));
                e.target.classList.add('active');
                selectedColor = e.target.getAttribute('data-color') || "Válido";
                // Flash main image to simulate color loading
                if (window.gsap) gsap.fromTo('#pdp-main-img', { opacity: 0.5 }, { opacity: 1, duration: 0.3 });
            });
        });
    }

    // --- Quantity Controller ---
    if (btnQtyMinus && btnQtyPlus && displayQty) {
        btnQtyMinus.addEventListener('click', () => {
            if (qty > 1) {
                qty--;
                displayQty.textContent = qty;
                if (window.gsap) gsap.fromTo(displayQty, { scale: 1.2 }, { scale: 1, duration: 0.2 });
            }
        });

        btnQtyPlus.addEventListener('click', () => {
            if (qty < 10) { // Limit max qty
                qty++;
                displayQty.textContent = qty;
                if (window.gsap) gsap.fromTo(displayQty, { scale: 1.2 }, { scale: 1, duration: 0.2 });
            }
        });
    }

    // --- Favorite Toggle ---
    const toggleFavorite = () => {
        isFavorited = !isFavorited;
        if (isFavorited) {
            btnFavorite.classList.add('is-favorite');
        } else {
            btnFavorite.classList.remove('is-favorite');
        }
        if (window.gsap) {
             gsap.fromTo(btnFavorite, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        }
    };

    if (btnFavorite) btnFavorite.addEventListener('click', toggleFavorite);
    if (clickFavRow) clickFavRow.addEventListener('click', (e) => {
        // Prevent double trigger if clicking exactly on the icon
        if(e.target !== btnFavorite && !btnFavorite.contains(e.target)){
            toggleFavorite();
        }
    });

    // --- Add/Buy Buttons ---
    const handleCartAction = (btn, originalText) => {
        btn.innerHTML = "PROCESANDO...";
        setTimeout(() => {
            btn.innerHTML = originalText;
            
            // Build the specific product object to add
            const id = urlParams.get('id') || "custom-product";
            const name = document.getElementById('pdp-title').textContent;
            
            // Clean price string "$25.00" -> 25.00
            const priceStr = document.getElementById('pdp-price').textContent;
            const price = parseFloat(priceStr.replace(/[^0-9.-]+/g,"")) || 0;
            const img = document.getElementById('pdp-main-img').src;
            
            addToCart({
                id: id,
                name: name,
                price: price,
                qty: qty,
                img: img,
                size: selectedSize,
                color: selectedColor
            });
            
        }, 300);
    };

    if (btnAddToCart) {
        const originalTextAdd = btnAddToCart.innerHTML;
        btnAddToCart.addEventListener('click', () => {
            if (window.gsap) gsap.fromTo(btnAddToCart, { scale: 0.98 }, { scale: 1, duration: 0.2 });
            handleCartAction(btnAddToCart, originalTextAdd);
        });
    }

    if (btnBuyNow) {
        const originalTextBuy = btnBuyNow.innerHTML;
        btnBuyNow.addEventListener('click', () => {
            if (window.gsap) gsap.fromTo(btnBuyNow, { scale: 0.95 }, { scale: 1, duration: 0.2 });
            handleCartAction(btnBuyNow, originalTextBuy);
            // Redirigir a WhatsApp en vez del viejo checkout falso
            setTimeout(() => {
                procesarCompraWhatsApp();
            }, 350);
        });
    }

    // Helpers removed because the cartState handles notifications & badges automatically
    // when openCart is called or the badge is globally updated.
});
