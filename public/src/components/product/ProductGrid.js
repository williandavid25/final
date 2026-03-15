import { ProductCard } from './ProductCard.js';

export const ProductGrid = (products) => {
    if (!products || products.length === 0) {
        return `<p style="text-align: center; color: var(--color-text-muted);">No hay productos disponibles por ahora.</p>`;
    }

    const cardsHtml = products.map(product => ProductCard(product)).join('');

    return `
        <div class="product-grid">
            ${cardsHtml}
        </div>
    `;
};
