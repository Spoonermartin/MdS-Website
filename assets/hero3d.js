// MDS Websites — Three.js hero v2 — Crystalline geometric scene
// Mouse-reactive depth, multi-object rotation, breathing lights
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined' || reduced) return;

  const hero = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0, 28);

  // ——— LIGHTS ———
  const ambient = new THREE.AmbientLight(0x1a2a50, 1.4);
  scene.add(ambient);

  const goldLight = new THREE.PointLight(0xd9b66a, 3.5, 55);
  goldLight.position.set(10, 7, 12);
  scene.add(goldLight);

  const blueLight = new THREE.PointLight(0x1f3a63, 2.2, 45);
  blueLight.position.set(-14, -5, 8);
  scene.add(blueLight);

  const rimLight = new THREE.PointLight(0x4a7ab5, 1.5, 30);
  rimLight.position.set(0, -10, -5);
  scene.add(rimLight);

  // ——— MAIN CRYSTAL — Icosahedron with golden edges ———
  const icoGeo = new THREE.IcosahedronGeometry(7, 2);
  const icoCrystal = new THREE.LineSegments(
    new THREE.EdgesGeometry(icoGeo),
    new THREE.LineBasicMaterial({ color: 0xc9a14d, transparent: true, opacity: 0.34, depthWrite: false })
  );
  icoCrystal.position.set(8, 0, -4);
  scene.add(icoCrystal);

  // Inner illuminated core
  const coreMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x1a3566, transparent: true, opacity: 0.18, depthWrite: false })
  );
  coreMesh.position.copy(icoCrystal.position);
  scene.add(coreMesh);

  // Orbiting ring 1
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(5.9, 0.045, 8, 100),
    new THREE.MeshBasicMaterial({ color: 0xd9b66a, transparent: true, opacity: 0.28 })
  );
  ring1.position.copy(icoCrystal.position);
  ring1.rotation.x = Math.PI * 0.35;
  scene.add(ring1);

  // Orbiting ring 2 (tilted differently)
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(6.6, 0.028, 8, 100),
    new THREE.MeshBasicMaterial({ color: 0xc9a14d, transparent: true, opacity: 0.16 })
  );
  ring2.position.copy(icoCrystal.position);
  ring2.rotation.x = Math.PI * 0.6;
  ring2.rotation.z = Math.PI * 0.18;
  scene.add(ring2);

  // ——— SECONDARY: Octahedron (far background left) ———
  const octCrystal = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(4.5, 1)),
    new THREE.LineBasicMaterial({ color: 0x3a6aaa, transparent: true, opacity: 0.26, depthWrite: false })
  );
  octCrystal.position.set(-13, 5, -12);
  scene.add(octCrystal);

  // ——— TERTIARY: Tetrahedron (lower far) ———
  const tetraCrystal = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(3.5, 1)),
    new THREE.LineBasicMaterial({ color: 0xc9a14d, transparent: true, opacity: 0.18, depthWrite: false })
  );
  tetraCrystal.position.set(3, -9, -14);
  scene.add(tetraCrystal);

  // ——— PARTICLES ———
  const COUNT = window.innerWidth < 768 ? 150 : 340;
  const RANGE = 42;
  const positions = new Float32Array(COUNT * 3);
  const velocities = [];
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * RANGE * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * RANGE;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 2;
    velocities.push({
      x: (Math.random() - 0.5) * 0.009,
      y: (Math.random() - 0.5) * 0.009
    });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xd9b66a, size: 0.13, transparent: true, opacity: 0.78,
    sizeAttenuation: true, depthWrite: false
  }));
  scene.add(particles);

  // ——— TWINKLE STAR GROUPS ———
  // 5 independent groups, each cycling opacity at a different frequency + phase
  // so stars twinkle at different moments giving a natural starfield shimmer
  const twinkleGroups = [];
  const TWINKLE_GROUPS = 5;
  const TWINKLE_PER   = 18;
  for (let g = 0; g < TWINKLE_GROUPS; g++) {
    const tGeo = new THREE.BufferGeometry();
    const tPos = new Float32Array(TWINKLE_PER * 3);
    for (let i = 0; i < TWINKLE_PER; i++) {
      tPos[i * 3]     = (Math.random() - 0.5) * RANGE * 1.9;
      tPos[i * 3 + 1] = (Math.random() - 0.5) * RANGE * 0.85;
      tPos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 2;
    }
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    const tMat = new THREE.PointsMaterial({
      color: g % 2 === 0 ? 0xfff5d6 : 0xd9b66a,
      size: 0.19 + (g % 3) * 0.06,
      transparent: true, opacity: 0,
      sizeAttenuation: true, depthWrite: false
    });
    const tPts = new THREE.Points(tGeo, tMat);
    tPts.userData = {
      freq:  0.55 + g * 0.28,
      phase: (g / TWINKLE_GROUPS) * Math.PI * 2
    };
    scene.add(tPts);
    twinkleGroups.push(tPts);
  }

  // Connecting lines
  const MAX_LINKS = 500;
  const linePos = new Float32Array(MAX_LINKS * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineSegs = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    color: 0xc9a14d, transparent: true, opacity: 0.12, depthWrite: false
  }));
  scene.add(lineSegs);

  // ——— FLOATING MINI SHAPES ———
  const miniShapes = [];
  const miniDefs = [
    { geo: new THREE.OctahedronGeometry(0.55, 0), color: 0xc9a14d },
    { geo: new THREE.TetrahedronGeometry(0.65, 0), color: 0x3a6aaa },
    { geo: new THREE.IcosahedronGeometry(0.45, 0), color: 0xc9a14d },
    { geo: new THREE.OctahedronGeometry(0.38, 0), color: 0x4a7ab5 }
  ];
  for (let i = 0; i < 20; i++) {
    const def = miniDefs[i % 4];
    const m = new THREE.LineSegments(
      new THREE.EdgesGeometry(def.geo),
      new THREE.LineBasicMaterial({ color: def.color, transparent: true, opacity: 0.22 + Math.random() * 0.38 })
    );
    m.position.set(
      (Math.random() - 0.5) * 38,
      (Math.random() - 0.5) * 26,
      (Math.random() - 0.5) * 18 - 3
    );
    m.userData = {
      rx: (Math.random() - 0.5) * 0.018,
      ry: (Math.random() - 0.5) * 0.025,
      vy: (Math.random() - 0.5) * 0.006,
      baseY: m.position.y
    };
    scene.add(m);
    miniShapes.push(m);
  }

  // ——— MOUSE ———
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener('mouseleave', () => { mouse.tx = 0; mouse.ty = 0; });

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const LINK_DIST = 5.8;
  let visible = true;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  function tick(t) {
    requestAnimationFrame(tick);
    if (!visible) return;

    const time = t * 0.001;
    // Smooth mouse follow
    mouse.x += (mouse.tx - mouse.x) * 0.036;
    mouse.y += (mouse.ty - mouse.y) * 0.036;

    // Main crystal — mouse-influenced rotation
    icoCrystal.rotation.x = time * 0.16 + mouse.y * 0.2;
    icoCrystal.rotation.y = time * 0.11 + mouse.x * 0.24;
    coreMesh.rotation.copy(icoCrystal.rotation);
    ring1.rotation.z = time * 0.09 + mouse.x * 0.07;
    ring2.rotation.x = Math.PI * 0.6 + time * 0.07;
    ring2.rotation.z = Math.PI * 0.18 + time * 0.05;

    octCrystal.rotation.x = time * -0.13;
    octCrystal.rotation.y = time * 0.08 + mouse.x * 0.05;

    tetraCrystal.rotation.x = time * 0.12;
    tetraCrystal.rotation.z = time * -0.09;

    // Breathing lights
    goldLight.intensity = 3.0 + Math.sin(time * 1.7) * 0.9;
    goldLight.position.x = 10 + Math.cos(time * 0.35) * 3;
    goldLight.position.y = 7 + Math.sin(time * 0.28) * 2;
    rimLight.intensity = 1.2 + Math.cos(time * 2.1) * 0.5;

    // Particle drift
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      if (Math.abs(pos[i * 3])     > RANGE)        velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > RANGE * 0.55) velocities[i].y *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Gentle global pulse on main particles
    particles.material.opacity = 0.62 + Math.sin(time * 0.45) * 0.16;

    // Twinkle groups — each cycles in/out independently
    twinkleGroups.forEach(tg => {
      const v = Math.sin(time * tg.userData.freq + tg.userData.phase);
      tg.material.opacity = Math.max(0, v) * 0.9;
    });

    // Rebuild connection lines
    let li = 0;
    for (let i = 0; i < COUNT && li < MAX_LINKS; i++) {
      for (let j = i + 1; j < COUNT && li < MAX_LINKS; j++) {
        const dx = pos[i*3]-pos[j*3], dy = pos[i*3+1]-pos[j*3+1], dz = pos[i*3+2]-pos[j*3+2];
        if (dx*dx + dy*dy + dz*dz < LINK_DIST * LINK_DIST) {
          linePos.set([pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]], li * 6);
          li++;
        }
      }
    }
    lineGeo.setDrawRange(0, li * 2);
    lineGeo.attributes.position.needsUpdate = true;

    // Mini shapes float and spin
    miniShapes.forEach(s => {
      s.rotation.x += s.userData.rx;
      s.rotation.y += s.userData.ry;
      s.position.y += s.userData.vy;
      if (Math.abs(s.position.y - s.userData.baseY) > 9) s.userData.vy *= -1;
    });

    // Camera parallax + scroll pullback
    camera.position.x += (mouse.x * 3.0 - camera.position.x) * 0.026;
    camera.position.y += (-mouse.y * 1.9 - camera.position.y) * 0.026;
    const scrollPull = Math.min(scrollY * 0.02, 6);
    camera.position.z = 28 + scrollPull;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
