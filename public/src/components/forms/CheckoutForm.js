export const CheckoutModal = () => {
    return `
        <div class="checkout-overlay" id="checkout-overlay">
            <div class="checkout-modal-minimal">
                <button class="close-checkout-btn-minimal" id="close-checkout-btn" aria-label="Cerrar">✕</button>
                
                <div class="checkout-header-minimal">
                    <h2>Checkout Seguro</h2>
                    <p>Completa tu pedido de Oversize.</p>
                </div>
                
                <div class="checkout-body-minimal">
                    <form id="checkout-form-minimal">
                        
                        <!-- Section 1 -->
                        <div class="checkout-section">
                            <h3>1. Información de Contacto</h3>
                            <div class="checkout-row">
                                <label for="email-min">Correo Electrónico</label>
                                <input type="email" id="email-min" required placeholder="tu@email.com" class="checkout-input-min">
                            </div>
                        </div>

                        <!-- Section 2 -->
                        <div class="checkout-section">
                            <h3>2. Dirección de Envío</h3>
                            <div class="checkout-row">
                                <label for="nombre-min">Nombre</label>
                                <input type="text" id="nombre-min" required placeholder="Nombre" class="checkout-input-min">
                            </div>
                            <div class="checkout-row">
                                <label for="apellido-min">Apellido</label>
                                <input type="text" id="apellido-min" required placeholder="Apellido" class="checkout-input-min">
                            </div>
                            <div class="checkout-row">
                                <label for="direccion-min">Dirección completa</label>
                                <input type="text" id="direccion-min" required placeholder="Calle 123, Apt 4B" class="checkout-input-min">
                            </div>
                        </div>

                        <!-- Section 3 -->
                        <div class="checkout-section">
                            <h3>3. Pago (Simulado)</h3>
                            <div class="checkout-row">
                                <label for="tarjeta-min">Número de Tarjeta</label>
                                <input type="text" id="tarjeta-min" placeholder="0000 0000 0000 0000" class="checkout-input-min" maxlength="19">
                            </div>
                            <div class="checkout-row">
                                <label for="vencimiento-min">Vencimiento</label>
                                <input type="text" id="vencimiento-min" placeholder="MM/AA" class="checkout-input-min" maxlength="5">
                            </div>
                            <div class="checkout-row">
                                <label for="cvv-min">CVV</label>
                                <input type="text" id="cvv-min" placeholder="123" class="checkout-input-min" maxlength="4">
                            </div>
                        </div>

                        <button type="submit" class="btn-checkout-submit">PAGAR PEDIDO</button>
                    </form>
                </div>
            </div>
        </div>
    `;
};
