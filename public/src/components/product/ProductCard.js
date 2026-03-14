export const ProductCard = (product) => {
    const isNewBadge = product.esNuevo ? `<span class="product-badge">NUEVO</span>` : '';
    const imageSrc = product.imagenes && product.imagenes[0] ? product.imagenes[0] : 'https://via.placeholder.com/300x400/eeeeee/333333?text=Modelo';
    
    return `
        <article class="product-card" id="${product.id}" data-genero="${product.genero || ''}" data-categoria="${product.categoria || ''}">
            <div class="product-image-wrapper">
                ${isNewBadge}
                <a href="producto.html?id=${product.id}" style="display: block; width: 100%; height: 100%;">
                    <img src="${imageSrc}" alt="${product.nombre}" class="product-img" loading="lazy">
                </a>
                
                <div class="quick-add-overlay">
                    <button class="btn-quick-add add-to-cart-hidden" data-id="${product.id}">AÑADIR</button>
                </div>
            </div>
            
            <div class="product-info">
                <a href="producto.html?id=${product.id}" style="text-decoration: none; color: inherit; display: inline-block;">
                    <h3 class="product-title" title="${product.nombre}">${product.nombre}</h3>
                </a>
                <span class="product-desc-mini">${(product.descripcion || '').substring(0, 30)}...</span>
                
                <div class="product-meta">
                    <span class="product-price">$${product.precio.toFixed(2)}</span>
                    <button class="heart-icon-btn" data-id="${product.id}" aria-label="Añadir a deseos">
                        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    </button>
                </div>
            </div>
        </article>
    `;
};
