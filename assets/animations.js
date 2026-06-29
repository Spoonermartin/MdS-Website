// MDS Websites — GSAP animation engine v2
// Cinematic loader, scroll reveals, magnetic buttons, custom cursor
// Requires: gsap + ScrollTrigger (CDN). Degrades gracefully if absent.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ========================================================================
  // PAGE LOADER
  // ========================================================================
  const loader = document.querySelector('.loader');
  const loaderBar = document.querySelector('.loader-bar');
  const loaderLogo = document.querySelector('.loader-logo');
  const loaderText = document.querySelector('.loader-text');

  if (loader && !reduced && window.__mdsIntro !== false) {
    document.body.style.overflow = 'hidden';
    const loaderTl = gsap.timeline({
      onComplete: () => {
        loader.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        document.body.classList.remove('loading');
      }
    });

    loaderTl
      .set(loader, { display: 'flex' })
      .from(loaderLogo, { yPercent: 40, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, 0.1)
      .from(loaderText, { autoAlpha: 0, duration: 0.5 }, 0.4)
      .to(loaderBar, { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0.3)
      .to([loaderLogo, loaderText], { autoAlpha: 0, y: -18, duration: 0.45, ease: 'power2.in' }, 1.6)
      // Start entrance animations while loader is still sliding — DOM changes happen under cover
      .call(runEntranceAnimations, [], 1.85)
      .to(loader, { yPercent: -100, duration: 0.85, ease: 'power4.in' }, 1.9)
      .set(loader, { display: 'none' });
  } else {
    // No loader: run entrance immediately
    if (!reduced) setTimeout(runEntranceAnimations, 0);
  }

  // ========================================================================
  // ENTRANCE ANIMATIONS (hero reveal)
  // immediateRender: false on all from() tweens prevents elements being
  // set invisible before the animation plays.
  // ========================================================================
  function runEntranceAnimations() {
    const heroH1 = document.querySelector('.hero h1, .page-hero h1');
    if (heroH1) {
      // Split headline into line masks
      const rawHTML = heroH1.innerHTML;
      const words = rawHTML.split(' ');
      const chunks = [];
      for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4).join(' '));
      heroH1.innerHTML = chunks.map(c => `<span class="line-mask"><span>${c}</span></span>`).join('');

      const section = heroH1.closest('section');
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from(heroH1.querySelectorAll('.line-mask > span'), {
          yPercent: 115, duration: 1.15, stagger: 0.13, immediateRender: false
        }, 0)
        .fromTo(
          section.querySelectorAll('.eyebrow, p.lead, .hero-ctas, .crumbs'),
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.11, clearProps: 'opacity,transform' },
          0.5
        )
        .fromTo('.hero-proof .stat',
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.09, duration: 0.75, clearProps: 'opacity,transform' },
          0.88
        );
    }
  }

  if (reduced) return;

  // ========================================================================
  // CUSTOM CURSOR
  // ========================================================================
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot  = document.querySelector('.cursor-dot')  || (() => { const d = document.createElement('div'); d.className = 'cursor-dot'; document.body.append(d); return d; })();
    const ring = document.querySelector('.cursor-ring') || (() => { const r = document.createElement('div'); r.className = 'cursor-ring'; document.body.append(r); return r; })();

    const dx = gsap.quickTo(dot,  'x', { duration: 0.06 });
    const dy = gsap.quickTo(dot,  'y', { duration: 0.06 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.38, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.38, ease: 'power3' });

    window.addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });

    document.querySelectorAll('a, button, .work-card, summary, .filter-btn').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  // ========================================================================
  // ANIMATED COUNTERS
  // ========================================================================
  document.querySelectorAll('[data-count]').forEach(el => {
    const end      = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const decimals = el.dataset.count.includes('.') ? 1 : 0;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 2, ease: 'power2.out',
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; }
      })
    });
  });

  // ========================================================================
  // SECTION HEAD REVEALS
  // immediateRender: false — elements stay visible until ScrollTrigger fires,
  // preventing the "invisible header" bug when sections load near the viewport.
  // ========================================================================
  gsap.utils.toArray('.section, .section-numbers').forEach(sec => {
    const heads = sec.querySelectorAll('.section-head .eyebrow, .section-head h2, .section-head p, .section-head .lead');
    if (!heads.length) return;
    gsap.from(heads, {
      scrollTrigger: { trigger: sec, start: 'top 78%', once: true },
      y: 40, autoAlpha: 0, duration: 1.0, stagger: 0.13, ease: 'power3.out',
      immediateRender: false   // ← key fix: don't hide until animation is about to start
    });
  });

  // ========================================================================
  // CARD GRID STAGGERS
  // ========================================================================
  gsap.utils.toArray('.grid, .work-grid, .stats-band, .numbers-grid').forEach(grid => {
    const cards = grid.querySelectorAll(':scope > .card, :scope > .work-card, :scope > .quote-card, :scope > article, :scope > div');
    if (!cards.length) return;
    gsap.from(cards, {
      scrollTrigger: { trigger: grid, start: 'top 82%', once: true },
      y: 55, autoAlpha: 0, duration: 0.85, stagger: 0.10, ease: 'power3.out',
      clearProps: 'all', immediateRender: false
    });
  });

  // ========================================================================
  // TIMELINE STEPS
  // ========================================================================
  gsap.utils.toArray('.timeline-step').forEach(step => {
    gsap.from(step, {
      scrollTrigger: { trigger: step, start: 'top 84%', once: true },
      x: -45, autoAlpha: 0, duration: 0.85, ease: 'power3.out',
      immediateRender: false
    });
    const marker = step.querySelector('.marker');
    if (marker) gsap.from(marker, {
      scrollTrigger: { trigger: step, start: 'top 84%', once: true },
      scale: 0, duration: 0.65, ease: 'back.out(2.5)',
      immediateRender: false
    });
  });

  // ========================================================================
  // IMAGE REVEALS — gold curtain wipe
  // ========================================================================
  gsap.utils.toArray('.visual, .work-card .thumb').forEach(wrap => {
    const img = wrap.querySelector('img');
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:var(--gold-500);z-index:3;transform-origin:right;pointer-events:none;';
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    wrap.style.overflow = 'hidden';
    wrap.appendChild(overlay);
    gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } })
      .to(overlay, { scaleX: 0, duration: 0.95, ease: 'power4.inOut' })
      .from(img || wrap, { scale: 1.28, duration: 1.25, ease: 'power3.out', immediateRender: false }, 0.12);
    if (img) gsap.to(img, {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // ========================================================================
  // GIANT WORDS — horizontal drift on scroll
  // ========================================================================
  gsap.utils.toArray('.giant-word').forEach(word => {
    gsap.fromTo(word, { xPercent: 7 }, {
      xPercent: -7, ease: 'none',
      scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
    });
  });

  // ========================================================================
  // MARQUEE
  // ========================================================================
  document.querySelectorAll('.marquee').forEach(mq => {
    const track = mq.querySelector('.marquee-track');
    if (!track) return;
    track.innerHTML += track.innerHTML;
    const anim = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    mq.addEventListener('mouseenter', () => anim.timeScale(0.2));
    mq.addEventListener('mouseleave', () => anim.timeScale(1));
  });

  // ========================================================================
  // UNDERLINE DRAW
  // ========================================================================
  document.querySelectorAll('.underline-draw').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      onEnter: () => el.classList.add('drawn')
    });
  });

  // ========================================================================
  // MAGNETIC BUTTONS
  // ========================================================================
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn').forEach(btn => {
      const qx = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3' });
      const qy = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width  / 2) * 0.3);
        qy((e.clientY - r.top  - r.height / 2) * 0.4);
      });
      btn.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  // ========================================================================
  // CARD GLOW follows mouse
  // ========================================================================
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--glow-y', (e.clientY - r.top)  + 'px');
    });
  });

  // ========================================================================
  // CTA BAND — zoom-settle
  // ========================================================================
  gsap.utils.toArray('.cta-band').forEach(band => {
    gsap.fromTo(band,
      { scale: 0.93, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: { trigger: band, start: 'top 84%', once: true } }
    );
  });

  // ========================================================================
  // NUMBERS SECTION — dramatic entrance
  // ========================================================================
  const numbersSection = document.querySelector('.section-numbers');
  if (numbersSection) {
    gsap.from('.number-item', {
      scrollTrigger: { trigger: numbersSection, start: 'top 78%', once: true },
      y: 60, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      immediateRender: false
    });
  }

  // ========================================================================
  // HERO CANVAS parallax on scroll
  // ========================================================================
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    gsap.to(heroCanvas, {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  // Service cards are handled by the card grid stagger above (.grid article)

  // ========================================================================
  // SPLIT-TEXT reveals for quote-card blockquotes
  // ========================================================================
  gsap.utils.toArray('.quote-card blockquote').forEach(bq => {
    gsap.from(bq, {
      scrollTrigger: { trigger: bq, start: 'top 85%', once: true },
      clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.out',
      immediateRender: false
    });
  });

  // ========================================================================
  // PAGE SECTION — subtle background shift on scroll (why-us section)
  // ========================================================================
  const darkSection = document.querySelector('.section--dark');
  if (darkSection) {
    gsap.fromTo(darkSection, { backgroundPositionY: '0%' }, {
      backgroundPositionY: '100%', ease: 'none',
      scrollTrigger: { trigger: darkSection, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  // Legacy: ensure .reveal elements are visible
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));

})();
