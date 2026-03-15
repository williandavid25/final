export const MiniCart = () => {
    return `
        <div class="mini-cart-overlay" id="cart-overlay">
            <aside class="mini-cart" id="mini-cart">
                <div class="cart-header-empty">
                    <button class="close-btn-minimal" id="close-cart-btn" aria-label="Cerrar carrito">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div class="cart-body-scrollable">

                    <!-- ═══ CONTENEDOR CARRITO VACÍO ═══ -->
                    <div class="cart-empty-state" id="cart-empty-state">
                        <h2 class="empty-title">TU CARRITO ESTA VACÍO</h2>
                        
                        <!-- Login / User Banner dentro del estado vacío -->
                        <div id="cart-login-banner" style="margin-bottom: 1.5rem;">
                            <p style="font-size: 0.95rem; color: #333; font-weight: 500; text-align: center;">
                                ¿Tienes una cuenta? <span id="cart-login-trigger" style="color: #902126; text-decoration: underline; cursor: pointer; font-weight: 700;">Inicia sesión</span> para pagar más rápido.
                            </p>
                        </div>

                        <!-- Si SÍ está logueado → info del usuario -->
                        <div class="cart-user-banner" id="cart-user-banner" style="display:none; margin-bottom: 1.5rem;">
                            <!-- Content injected by auth.js -->
                        </div>
                        
                        <button class="btn-keep-shopping" id="btn-keep-shopping">SEGUIR COMPRANDO</button>
                        
                        <button class="btn-get-offer vibrate-anim" id="btn-get-offer">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 10px;"><path d="M19 6h-4c0-1.66-1.34-3-3-3s-3 1.34-3 3H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-1c.55 0 1 .45 1 1h-2c0-.55.45-1 1-1zm7 14H5V8h14v11z"/><circle cx="12" cy="12" r="2"/></svg>
                            Obtener Oferta!
                        </button>
                    </div>

                    <!-- ═══ CONTENEDOR ITEMS CARRITO ═══ -->
                    <div class="cart-filled-state" id="cart-filled-state" style="display: none;">
                        <!-- Login / User Banner dentro del estado lleno -->
                        <div class="cart-filled-auth" style="padding: 12px 20px 0;">
                            <div id="cart-login-banner-filled" style="background: #fafafa; border: 1.5px solid #ececec; border-radius: 10px; padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#902126" stroke-width="2.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                <span style="font-size: 0.8rem; color: #333; font-weight: 500;">¿Tienes cuenta? <span style="color: #902126; font-weight: 700; text-decoration: underline;">Inicia sesión</span> para pagar más rápido.</span>
                            </div>
                            <div id="cart-user-banner-filled" style="display:none; background: #fafafa; border: 1.5px solid #ececec; border-radius: 10px; padding: 10px 14px; display:none; align-items: center; gap: 10px;">
                                <!-- Content injected by auth.js -->
                            </div>
                        </div>

                        <div id="cart-items-wrapper" style="padding: 12px 20px;"></div>
                        
                        <div class="cart-footer">
                            <div class="cart-summary-row total">
                                <span>Subtotal</span>
                                <span id="cart-subtotal">$0.00</span>
                            </div>
                            <button class="btn btn-checkout-wa pag-btn pulse-anim" id="btn-checkout-whatsapp">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 0C5.383 0 0 5.385 0 12.033c0 2.128.552 4.195 1.6 6.02L.268 23.01l5.088-1.332a12.01 12.01 0 0 0 6.674 1.996h.004c6.649 0 12.033-5.385 12.033-12.032C24.067 5.385 18.681 0 12.031 0zm0 21.644h-.002c-1.802 0-3.568-.484-5.118-1.4l-.367-.218-3.804.997 1.015-3.708-.239-.38C2.515 15.358 1.966 13.725 1.966 12.033 1.966 6.471 6.475 1.964 12.031 1.964c5.558 0 10.067 4.507 10.067 10.069 0 5.56-4.509 10.067-10.067 10.067zm5.526-7.551c-.302-.152-1.791-.885-2.068-.988-.276-.102-.478-.152-.679.152-.201.303-.781.988-.958 1.19-.175.202-.352.227-.654.076-1.558-.781-2.731-1.442-3.812-3.32-.279-.485.424-.45.986-1.574.1-.202.05-.38-.025-.532-.075-.152-.679-1.638-.93-2.245-.246-.593-.495-.512-.679-.521-.176-.01-.378-.01-.58-.01-.202 0-.528.076-.805.38s-1.057 1.034-1.057 2.522 1.082 2.928 1.233 3.13 2.138 3.262 5.183 4.577c.725.313 1.291.501 1.733.642.728.232 1.391.199 1.916.12.585-.088 1.791-.733 2.043-1.439.252-.708.252-1.314.176-1.439-.076-.127-.277-.203-.579-.355z"/></svg>
                                COMPRAR POR WHATSAPP
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    `;
};
