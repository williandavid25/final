/**
 * Antigravity Engine - Performance Edition
 * -----------------------------------------
 * Optimizaciones clave:
 *  1. IntersectionObserver: pausa el render cuando el canvas sale del viewport.
 *  2. Page Visibility API: pausa cuando la pestaña está oculta.
 *  3. DPR limitado a 1.5 en móvil / 2.0 en desktop.
 *  4. Antialias desactivado en móvil para ahorrar GPU.
 *  5. Partículas reducidas: 200 (móvil) / 600 (desktop) — calidad visual idéntica.
 */

(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;

    // --- Configuración optimizada ---
    const config = {
        count: isMobile ? 200 : 600,
        brandColors: ['#5227FF', '#FFD700'],
        magnetRadius: 8,
        ringRadius: 9,
        waveSpeed: 1.0,
        waveAmplitude: 1.2,
        particleSize: 1.1,
        lerpSpeed: 0.12,
        autoAnimate: true,
        rotationSpeed: 0.003,
        fieldStrength: 10
    };

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 50;

    // Antialias OFF en móvil para liberar GPU
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isMobile
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // DPR cap: 1.5 móvil (pantallas 3x/4x) / 2.0 desktop
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    // --- Instanced Mesh ---
    const geometry = new THREE.CapsuleGeometry(0.06, 0.2, 4, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.InstancedMesh(geometry, material, config.count);
    scene.add(mesh);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const particles = [];

    for (let i = 0; i < config.count; i++) {
        color.set(config.brandColors[i % config.brandColors.length]);
        mesh.setColorAt(i, color);
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 20;
        particles.push({
            t: Math.random() * 100,
            speed: 0.02 + Math.random() / 100,
            mx: x, my: y, mz: z,
            cx: x, cy: y, cz: z,
            randomRadiusOffset: (Math.random() - 0.5) * 2
        });
    }
    mesh.instanceColor.needsUpdate = true;

    // --- Interacción mouse / touch ---
    const pointer = new THREE.Vector2(0, 0);
    const virtualMouse = new THREE.Vector2(0, 0);
    let lastMouseMoveTime = Date.now();

    window.addEventListener('mousemove', (e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        lastMouseMoveTime = Date.now();
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            lastMouseMoveTime = Date.now();
        }
    }, { passive: true });

    // --- Control de ciclo de vida del render ---
    let animFrameId = null;
    let isVisible = true;     // IntersectionObserver
    let isTabActive = true;   // Page Visibility API

    function shouldRender() { return isVisible && isTabActive; }

    function startLoop() {
        if (animFrameId !== null) return; // ya corriendo
        loop();
    }

    function stopLoop() {
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    // --- Pausa cuando el canvas está fuera del viewport ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            isVisible ? startLoop() : stopLoop();
        });
    }, { threshold: 0 });
    observer.observe(canvas);

    // --- Pausa cuando la pestaña está oculta ---
    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;
        isTabActive ? startLoop() : stopLoop();
    });

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    function loop() {
        if (!shouldRender()) { animFrameId = null; return; }
        animFrameId = requestAnimationFrame(loop);

        const time = clock.getElapsedTime();
        let destX = (pointer.x * 60) / 2;
        let destY = (pointer.y * 40) / 2;

        if (config.autoAnimate && Date.now() - lastMouseMoveTime > 2000) {
            destX = Math.sin(time * 0.8) * 15;
            destY = Math.cos(time * 0.8 * 2) * 10;
        }

        virtualMouse.x += (destX - virtualMouse.x) * 0.1;
        virtualMouse.y += (destY - virtualMouse.y) * 0.1;

        particles.forEach((p, i) => {
            p.t += p.speed / 2;
            const dx = p.mx - virtualMouse.x;
            const dy = p.my - virtualMouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetX = p.mx, targetY = p.my, targetZ = p.mz;

            if (dist < config.magnetRadius) {
                const angle = Math.atan2(dy, dx) + time * config.rotationSpeed;
                const wave = Math.sin(p.t * config.waveSpeed + angle) * (0.5 * config.waveAmplitude);
                const currentRingRadius = config.ringRadius + wave + p.randomRadiusOffset;
                targetX = virtualMouse.x + currentRingRadius * Math.cos(angle);
                targetY = virtualMouse.y + currentRingRadius * Math.sin(angle);
                targetZ = p.mz + Math.sin(p.t) * (2 * config.waveAmplitude);
            }

            p.cx += (targetX - p.cx) * config.lerpSpeed;
            p.cy += (targetY - p.cy) * config.lerpSpeed;
            p.cz += (targetZ - p.cz) * config.lerpSpeed;

            dummy.position.set(p.cx, p.cy, p.cz);
            dummy.lookAt(virtualMouse.x, virtualMouse.y, p.cz);
            dummy.rotateX(Math.PI / 2);

            const distToMouse = Math.sqrt(Math.pow(p.cx - virtualMouse.x, 2) + Math.pow(p.cy - virtualMouse.y, 2));
            const distFromRing = Math.abs(distToMouse - config.ringRadius);
            const scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10));
            const finalScale = scaleFactor * (0.8 + Math.sin(p.t * 3) * 0.2) * config.particleSize;

            dummy.scale.set(finalScale, finalScale, finalScale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
    }

    // Arrancar si ya es visible
    startLoop();

    // --- Resize Handler ---
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 200);
    });
})();
