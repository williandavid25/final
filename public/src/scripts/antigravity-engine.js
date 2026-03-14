/**
 * Antigravity Engine - Pro Edition (Vanilla JS Port)
 * ------------------------------------------------
 * Ported from advanced React Three.js logic.
 * Features: InstancedMesh, Magnetic Field Physics, Brand Colors (Purple/Gold), Auto-animation.
 */

(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    // --- Configuration ---
    const config = {
        count: window.innerWidth < 768 ? 500 : 1200, 
        brandColors: ['#5227FF', '#FFD700'], 
        magnetRadius: 8,
        ringRadius: 9,
        waveSpeed: 1.0, // Swifter waves (was 0.5)
        waveAmplitude: 1.2,
        particleSize: 1.1,
        lerpSpeed: 0.12, // Faster snap to target (was 0.05)
        autoAnimate: true,
        rotationSpeed: 0.003, // Slightly faster rotation (was 0.002)
        fieldStrength: 10
    };

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- Instanced Mesh & Particles Setup ---
    const geometry = new THREE.CapsuleGeometry(0.06, 0.2, 4, 8); // Balanced capsule dimensions
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.InstancedMesh(geometry, material, config.count);
    scene.add(mesh);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const particles = [];

    // Initialize particles
    for (let i = 0; i < config.count; i++) {
        // Intercale brand colors
        color.set(config.brandColors[i % config.brandColors.length]);
        mesh.setColorAt(i, color);

        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 20;

        particles.push({
            t: Math.random() * 100,
            speed: 0.02 + Math.random() / 100, // Faster internal oscillation (was 0.01 + /200)
            mx: x, my: y, mz: z, // Anchor position
            cx: x, cy: y, cz: z, // Current position
            randomRadiusOffset: (Math.random() - 0.5) * 2
        });
    }
    mesh.instanceColor.needsUpdate = true;

    // --- Interaction ---
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

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        
        let destX = (pointer.x * 60) / 2;
        let destY = (pointer.y * 40) / 2;

        // Auto-animate (Lissajous) when idle
        if (config.autoAnimate && Date.now() - lastMouseMoveTime > 2000) {
            destX = Math.sin(time * 0.8) * 15; // Faster auto-move (was 0.5)
            destY = Math.cos(time * 0.8 * 2) * 10;
        }

        // Smooth virtual mouse - snuffier response
        virtualMouse.x += (destX - virtualMouse.x) * 0.1; // Snappier following (was 0.05)
        virtualMouse.y += (destY - virtualMouse.y) * 0.1;

        particles.forEach((p, i) => {
            p.t += p.speed / 2;
            
            const dx = p.mx - virtualMouse.x;
            const dy = p.my - virtualMouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetX = p.mx;
            let targetY = p.my;
            let targetZ = p.mz;

            // Magnetic Field behavior
            if (dist < config.magnetRadius) {
                const angle = Math.atan2(dy, dx) + time * config.rotationSpeed;
                const wave = Math.sin(p.t * config.waveSpeed + angle) * (0.5 * config.waveAmplitude);
                const currentRingRadius = config.ringRadius + wave + p.randomRadiusOffset;

                targetX = virtualMouse.x + currentRingRadius * Math.cos(angle);
                targetY = virtualMouse.y + currentRingRadius * Math.sin(angle);
                targetZ = p.mz + Math.sin(p.t) * (2 * config.waveAmplitude);
            }

            // Lerp to target position
            p.cx += (targetX - p.cx) * config.lerpSpeed;
            p.cy += (targetY - p.cy) * config.lerpSpeed;
            p.cz += (targetZ - p.cz) * config.lerpSpeed;

            dummy.position.set(p.cx, p.cy, p.cz);
            dummy.lookAt(virtualMouse.x, virtualMouse.y, p.cz);
            dummy.rotateX(Math.PI / 2);

            // Pulse scale based on proximity to ring
            const distToMouse = Math.sqrt(Math.pow(p.cx - virtualMouse.x, 2) + Math.pow(p.cy - virtualMouse.y, 2));
            const distFromRing = Math.abs(distToMouse - config.ringRadius);
            let scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10));
            const finalScale = scaleFactor * (0.8 + Math.sin(p.t * 3) * 0.2) * config.particleSize;
            
            dummy.scale.set(finalScale, finalScale, finalScale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
    }

    animate();

    // --- Resize Handler ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
