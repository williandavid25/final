/**
 * HistoryManager - Handles sync between UI overlays and browser history
 * Allows closing modals/drawers using the browser's back button/gesture.
 */

export const HistoryManager = {
    stack: [],
    isProcessingPop: false,

    /**
     * Call this when opening an overlay
     * @param {string} id Unique identifier for the overlay
     * @param {Function} closeFn Function to call when user goes back
     */
    pushState(id, closeFn) {
        if (this.stack.find(item => item.id === id)) return; // Already in stack
        
        this.stack.push({ id, closeFn });
        window.history.pushState({ overlayId: id }, '');
    },

    /**
     * Call this when closing an overlay via UI (e.g., clicking 'X')
     * This will trigger a popstate if the overlay is at the top of the stack.
     */
    popState(id) {
        if (this.isProcessingPop) return;

        const index = this.stack.findIndex(item => item.id === id);
        if (index !== -1) {
            // If it's the top element, we use history.back() to keep history clean
            if (index === this.stack.length - 1) {
                this.stack.pop();
                window.history.back();
            } else {
                // If it's not the top, we just remove it from stack (unusual case)
                this.stack.splice(index, 1);
            }
        }
    },

    init() {
        window.addEventListener('popstate', (event) => {
            this.isProcessingPop = true;
            
            // If we have items in stack, close the top one
            if (this.stack.length > 0) {
                const item = this.stack.pop();
                if (item && typeof item.closeFn === 'function') {
                    item.closeFn();
                }
            }
            
            this.isProcessingPop = false;
        });
    }
};
