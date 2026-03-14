/**
 * Antigravity Field — Particle System v2
 * ----------------------------------------
 * Works on BOTH desktop (mousemove) and mobile (touchmove / touchstart).
 * Mobile uses a reduced particle count to stay smooth on low-end phones.
 */

const canvas = document.getElementById('particle-canvas');
if (!canvas) throw new Error('particle-canvas not found');

const ctx = canvas.getContext('2d');

// ─── Resize canvas to full window ───
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

// ─── Touch / mouse pointer ───
const pointer = {
    x: undefined,
    y: undefined,
    radius: window.innerWidth < 768 ? 180 : 400, // smaller radius on mobile
    active: false, // true while finger/mouse is pressing
};

// MOUSE events (desktop)
window.addEventListener('mousemove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
});

window.addEventListener('mouseleave', () => {
    pointer.x = undefined;
    pointer.y = undefined;
    pointer.active = false;
});

// TOUCH events (mobile) — preventDefault kept passive:false for scroll safety
window.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    pointer.x = t.clientX;
    pointer.y = t.clientY;
    pointer.active = true;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    pointer.x = t.clientX;
    pointer.y = t.clientY;
    pointer.active = true;
}, { passive: true });

window.addEventListener('touchend', () => {
    // Keep the last position so particles settle back gradually
    setTimeout(() => {
        pointer.x = undefined;
        pointer.y = undefined;
        pointer.active = false;
    }, 600);
});

// ─── Particle Class ───
const COLORS = ['#6F3ECD', '#FEBD01', '#aaaaaa', '#cccccc', '#9B72E7'];

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x      = Math.random() * canvas.width;
        this.y      = Math.random() * canvas.height;
        this.baseX  = this.x;
        this.baseY  = this.y;
        this.size   = Math.random() * 2.2 + 0.3;
        this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.opacity = Math.random() * 0.6 + 0.3;
        this.density = (Math.random() * 6) + 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle   = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (pointer.x !== undefined && pointer.y !== undefined) {
            const dx       = pointer.x - this.x;
            const dy       = pointer.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < pointer.radius) {
                const fx = (dx / distance);
                const fy = (dy / distance);
                const force = (pointer.radius - distance) / pointer.radius;
                const maxSpeed = 1.8;

                let vx = fx * force * this.density;
                let vy = fy * force * this.density;

                vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
                vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));

                this.x += vx;
                this.y += vy;
            } else {
                this.x -= (this.x - this.baseX) / 35;
                this.y -= (this.y - this.baseY) / 35;
            }
        } else {
            // Drift back to base when no pointer
            this.x -= (this.x - this.baseX) / 20;
            this.y -= (this.y - this.baseY) / 20;
        }

        // Gentle ambient drift
        this.baseX += (Math.random() - 0.5) * 0.4;
        this.baseY += (Math.random() - 0.5) * 0.4;

        // Keep in bounds
        if (this.baseX < 0 || this.baseX > canvas.width)  this.baseX = Math.random() * canvas.width;
        if (this.baseY < 0 || this.baseY > canvas.height) this.baseY = Math.random() * canvas.height;

        this.draw();
    }
}

// ─── Particle count — smaller on mobile for smooth 60fps ───
function particleCount() {
    const area = canvas.width * canvas.height;
    return window.innerWidth < 768
        ? Math.floor(area / 6000)   // ~120 particles on a 360×800 phone
        : Math.floor(area / 2500);  // ~300 on a 1440×900 desktop
}

// ─── Init / Animate ───
let particles = [];

function init() {
    particles = [];
    const count = particleCount();
    for (let i = 0; i < count; i++) particles.push(new Particle());
}

let animFrameId;
function animate() {
    animFrameId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) particles[i].update();
}

init();
animate();

// ─── Handle resize ───
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeCanvas();
        pointer.radius = window.innerWidth < 768 ? 180 : 400;
        init();
    }, 200);
});
