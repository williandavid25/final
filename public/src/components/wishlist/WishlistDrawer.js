export const WishlistDrawer = () => {
    return `
        <div class="mini-cart-overlay wishlist-overlay" id="wishlist-overlay">
            <aside class="mini-cart" id="wishlist-drawer">
                <div class="cart-header-empty">
                    <h2 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 900; margin-right: auto; padding-left: 20px;">MIS FAVORITOS</h2>
                    <button class="close-btn-minimal" id="close-wishlist-btn" aria-label="Cerrar favoritos">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div class="cart-body-scrollable">
                    <!-- ESTADO VACÍO -->
                    <div class="cart-empty-state" id="wishlist-empty-state">
                        <div class="empty-wishlist-icon" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.2;">❤️</div>
                        <h2 class="empty-title">AÚN NO TIENES FAVORITOS</h2>
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 2rem; max-width: 250px;">Guarda los productos que más te gusten para verlos después.</p>
                        <button class="btn-keep-shopping" id="btn-explore-wishlist">EXPLORAR TIENDA</button>
                    </div>

                    <!-- ESTADO LLENO -->
                    <div class="cart-filled-state" id="wishlist-filled-state" style="display: none;">
                        <div id="wishlist-items-wrapper" style="padding: 12px 20px;"></div>
                    </div>
                </div>
            </aside>
        </div>
    `;
};
