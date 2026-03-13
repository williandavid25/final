/**
 * antigravity3D.js
 * High-performance 3D particle system using Vanilla Three.js.
 * Adapted from React Three Fiber logic for Vanilla environment.
 */

// Import Three.js via CDN in HTML, or as module if possible.
// Here we assume THREE is available globally via script tag for simplicity in static HTML.

class Antigravity3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.params = {
            count: window.innerWidth < 768 ? 600 : 1200, // Extreme density
            magnetRadius: 14, // Slightly larger for visibility
            ringRadius: 10,
            waveSpeed: 0.45,
            waveAmplitude: 1.5,
            particleSize: 0.8, // Slightly larger for better visibility
            lerpSpeed: 0.08,
            colors: ['#6F3ECD', '#FEBD01'], // Purple & Gold as requested
            autoAnimate: true,
            particleVariance: 1.2,
            rotationSpeed: 0.003,
            fieldStrength: 15
        };

        this.init();
        this.animate();
    }

    init() {
        // --- Renderer ---
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // --- Scene & Camera ---
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;

        // --- Particles ---
        const geometry = new THREE.CapsuleGeometry(0.08, 0.35, 4, 8);
        const material = new THREE.MeshBasicMaterial();
        this.mesh = new THREE.InstancedMesh(geometry, material, this.params.count);
        this.scene.add(this.mesh);

        this.dummy = new THREE.Object3D();
        this.particles = [];

        // Aspect ratio helpers
        const h = 50 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
        const w = h * this.camera.aspect;

        for (let i = 0; i < this.params.count; i++) {
            const t = Math.random() * 100;
            const speed = 0.01 + Math.random() / 150;
            
            const x = (Math.random() - 0.5) * w * 2.8;
            const y = (Math.random() - 0.5) * h * 2.8;
            const z = (Math.random() - 0.5) * 15;

            const randomRadiusOffset = (Math.random() - 0.5) * 2;

            // Set Instance Color
            const color = new THREE.Color(this.params.colors[i % this.params.colors.length]);
            this.mesh.setColorAt(i, color);

            this.particles.push({
                t, speed, 
                mx: x, my: y, mz: z,
                cx: x, cy: y, cz: z,
                randomRadiusOffset
            });
        }

        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

        // --- Interaction ---
        this.mouse = new THREE.Vector2(-1000, -1000);
        this.virtualMouse = new THREE.Vector2(0, 0);
        this.lastMouseMove = Date.now();

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.lastMouseMove = Date.now();
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            this.lastMouseMove = Date.now();
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = performance.now() * 0.001;
        
        // --- Mouse Smoothing ---
        const h = 50 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
        const w = h * this.camera.aspect;

        let destX = this.mouse.x * w;
        let destY = this.mouse.y * h;

        // Auto-animate if idle
        if (this.params.autoAnimate && Date.now() - this.lastMouseMove > 2500) {
            destX = Math.sin(time * 0.5) * (w / 2.5);
            destY = Math.cos(time * 0.6) * (h / 2.5);
        }

        this.virtualMouse.x += (destX - this.virtualMouse.x) * 0.06;
        this.virtualMouse.y += (destY - this.virtualMouse.y) * 0.06;

        const targetX = this.virtualMouse.x;
        const targetY = this.virtualMouse.y;

        // --- Update Particles ---
        this.particles.forEach((p, i) => {
            p.t += p.speed;

            // Parallax factor based on depth (z)
            const projectionFactor = 1 - p.cz / 60;
            const projTX = targetX * projectionFactor;
            const projTY = targetY * projectionFactor;

            const dx = p.mx - projTX;
            const dy = p.my - projTY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetPos = { x: p.mx, y: p.my, z: p.mz };

            if (dist < this.params.magnetRadius) {
                const angle = Math.atan2(dy, dx) + time * this.params.rotationSpeed * 50;
                const wave = Math.sin(p.t * this.params.waveSpeed + angle) * (0.5 * this.params.waveAmplitude);
                const deviation = p.randomRadiusOffset * (5 / (this.params.fieldStrength + 0.1));
                const currentRingRadius = this.params.ringRadius + wave + deviation;

                targetPos.x = projTX + currentRingRadius * Math.cos(angle);
                targetPos.y = projTY + currentRingRadius * Math.sin(angle);
                targetPos.z = p.mz + Math.sin(p.t) * (2 * this.params.waveAmplitude);
            }

            // Lerping for fluid organic feel
            p.cx += (targetPos.x - p.cx) * this.params.lerpSpeed;
            p.cy += (targetPos.y - p.cy) * this.params.lerpSpeed;
            p.cz += (targetPos.z - p.cz) * this.params.lerpSpeed;

            // Update Instance Matrix
            this.dummy.position.set(p.cx, p.cy, p.cz);
            this.dummy.lookAt(projTX, projTY, p.cz);
            this.dummy.rotateX(Math.PI / 2);

            // Scale based on proximity to attraction ring
            const curDist = Math.sqrt(Math.pow(p.cx - projTX, 2) + Math.pow(p.cy - projTY, 2));
            const ringDist = Math.abs(curDist - this.params.ringRadius);
            let s = Math.max(0.2, Math.min(1, 1 - ringDist / 12));
            
            const finalScale = s * (0.9 + Math.sin(p.t * 3) * 0.1) * this.params.particleSize;
            this.dummy.scale.set(finalScale, finalScale, finalScale);
            
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        });

        this.mesh.instanceMatrix.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
}

// Global invocation
document.addEventListener('DOMContentLoaded', () => {
    new Antigravity3D('particle-canvas');
});
