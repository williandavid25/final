export const CartItem = (item) => {
    return `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.nombre}</h4>
                <div class="cart-item-variant">Talla: ${item.talla} | Color: ${item.color}</div>
                <div class="cart-item-price">$${item.precio.toFixed(2)}</div>
                
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="qty-btn dec-btn">-</button>
                        <span class="qty-display">${item.cantidad}</span>
                        <button class="qty-btn inc-btn">+</button>
                    </div>
                    <button class="remove-item-btn" aria-label="Eliminar producto">Eliminar</button>
                </div>
            </div>
        </div>
    `;
};
