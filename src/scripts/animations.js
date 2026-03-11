export const initAnimations = () => {
    gsap.registerPlugin(ScrollTrigger);

    // Detect mobile to adjust animation settings
    const isMobile = window.innerWidth < 768;

    // Hero & static elements — run immediately on page load
    const heroEls = [
        { sel: '.hero-badge',        y: -20 },
        { sel: '.hero-title',        y: 40 },
        { sel: '.hero-subtitle',     y: 30 },
        { sel: '.hero-cta-group',    y: 20 },
        { sel: '.floating-hero-img', y: 0, scale: true },
        { sel: '.whatsapp-float',    y: 0, scale: true, rotate: true },
    ];

    let delay = 0;
    heroEls.forEach(({ sel, y, scale, rotate }) => {
        const el = document.querySelector(sel);
        if (!el) return;

        const from = { opacity: 0, y };
        const to   = { opacity: 1, y: 0, duration: isMobile ? 0.5 : 0.7, ease: 'power3.out', delay };

        if (scale)  { from.scale = scale === true ? 0 : scale; to.scale = 1; }
        if (rotate) { from.rotation = -45; to.rotation = 0; }

        gsap.fromTo(el, from, to);
        delay += 0.1;
    });

    // Section titles — scroll triggered with mobile-friendly start
    gsap.utils.toArray('.section-title').forEach(el => {
        gsap.fromTo(el,
            { y: 25, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: isMobile ? 'top 95%' : 'top 85%', // fires earlier on mobile
                    once: true
                }
            }
        );
    });

    // Value cards and about-page elements (nosotros.html)
    gsap.utils.toArray('.value-card').forEach((card, i) => {
        gsap.fromTo(card,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.5, ease: 'power2.out',
                delay: (i % 2) * 0.08, // stagger in pairs for 2-column grid
                scrollTrigger: {
                    trigger: card,
                    start: isMobile ? 'top 98%' : 'top 88%',
                    once: true
                }
            }
        );
    });

    // Stats bar
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) {
        gsap.fromTo(statsBar,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
                scrollTrigger: {
                    trigger: statsBar,
                    start: isMobile ? 'top 98%' : 'top 88%',
                    once: true
                }
            }
        );
    }

    // Team / CTA banner
    const banner = document.querySelector('.team-banner');
    if (banner) {
        gsap.fromTo(banner,
            { scale: 0.96, opacity: 0 },
            {
                scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.2)',
                scrollTrigger: {
                    trigger: banner,
                    start: isMobile ? 'top 98%' : 'top 88%',
                    once: true
                }
            }
        );
    }

    // Privacy sections
    gsap.utils.toArray('.privacy-section').forEach((sec, i) => {
        gsap.fromTo(sec,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.5, ease: 'power2.out',
                delay: 0.05,
                scrollTrigger: {
                    trigger: sec,
                    start: isMobile ? 'top 98%' : 'top 88%',
                    once: true
                }
            }
        );
    });

    // Header glass effect on scroll
    ScrollTrigger.create({
        start: 'top -20',
        end: 99999,
        toggleClass: { className: 'scrolled', targets: '.header' }
    });
};

/**
 * Animates product cards AFTER they have been injected into the DOM.
 * Call this from index.js or catalogo.js immediately after the grid renders.
 */
export const animateProductCards = () => {
    const cards = document.querySelectorAll('.product-card');
    if (cards.length === 0) return;

    const isMobile = window.innerWidth < 768;

    gsap.fromTo(cards,
        { y: 30, autoAlpha: 0 },
        {
            y: 0, autoAlpha: 1,
            duration: isMobile ? 0.4 : 0.6,
            stagger: isMobile ? 0.04 : 0.07,
            ease: 'back.out(1.2)',
            scrollTrigger: {
                trigger: '#catalogo, #catalog-grid-container',
                start: isMobile ? 'top 99%' : 'top 80%',
                once: true
            }
        }
    );
};
