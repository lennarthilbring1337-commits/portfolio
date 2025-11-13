// Exp Site 1 - starter interactions (kinetic type, lazy lab loader)

document.addEventListener('DOMContentLoaded', ()=>{
  gsap.registerPlugin();

  // kinetic lines
  const lines = document.querySelectorAll('.kt-line');
  if(lines.length){
    gsap.from(lines, { y: 40, opacity:0, stagger:0.12, duration:0.9, ease:'power3.out' });
  }

  // sidebar toggle
  const toggle = document.querySelector('.sidebar-toggle');
  const nav = document.getElementById('nav');
  toggle?.addEventListener('click', ()=>{
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    if(nav){
      nav.setAttribute('aria-hidden', String(expanded));
    }
  });

  // magnetic cursor (simple)
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const hero = document.querySelector('.hero');
    const cursor = document.createElement('div');
    cursor.className = 'mag-cursor';
    cursor.style.position = 'fixed'; cursor.style.zIndex = 9999; cursor.style.width='18px'; cursor.style.height='18px'; cursor.style.border='2px solid var(--paper)'; cursor.style.borderRadius='50%'; cursor.style.pointerEvents='none';
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e)=>{
      cursor.style.transform = `translate(${e.clientX-9}px, ${e.clientY-9}px)`;
    });
  }

  // hero font crossfade loop (swap between layer-a and layer-b)
  const layerA = document.querySelector('.layer-a');
  const layerB = document.querySelector('.layer-b');
  if(layerA && layerB){
    const tl = gsap.timeline({repeat:-1, repeatDelay:1});
    tl.to(layerA, {opacity:0, duration:0.9, ease:'power2.inOut'})
      .to(layerB, {opacity:1, duration:0.9, ease:'power2.inOut'}, '<')
      .to(layerB, {opacity:0, duration:0.8, ease:'power2.inOut'}, '+=2')
      .to(layerA, {opacity:1, duration:0.8, ease:'power2.inOut'}, '<');
  }

  // populate oversize grid with extra tiles and random spans
  const grid = document.getElementById('oversize-grid');
  if(grid){
    // add extra tiles
    for(let i=0;i<18;i++){
      const a = document.createElement('article');
      a.className = 'tile';
      a.tabIndex = 0;
      a.innerHTML = `<h3>Experiment ${i+1}</h3>`;
      // random chance to be rough-styled
      if(Math.random() < 0.25) a.classList.add('tile--rough');
      grid.appendChild(a);
    }

    // place tiles in grid with random spans
    const tiles = Array.from(grid.querySelectorAll('.tile'));
    tiles.forEach((t, idx)=>{
      // seeded or data attributes first
      const w = t.dataset.w ? Number(t.dataset.w) : (2 + Math.floor(Math.random()*6));
      const h = t.dataset.h ? Number(t.dataset.h) : (1 + Math.floor(Math.random()*4));
      const col = 1 + Math.floor(Math.random()*8);
      const row = 1 + Math.floor(Math.random()*12);
      t.style.gridColumn = `${col} / span ${w}`;
      t.style.gridRow = `${row} / span ${h}`;
      // entrance animation
      gsap.fromTo(t, {opacity:0, y:40, rotate: (Math.random()-0.5)*6}, {opacity:1, y:0, rotate:0, delay: idx*0.03, duration:0.9, ease:'elastic.out(1,0.6)'});
    });

    // draw rough borders on rough tiles using roughjs if available
    function applyRough(){
      if(!window.rough) return;
      tiles.filter(x=>x.classList.contains('tile--rough')).forEach(el=>{
        const rc = rough.svg(el);
        const rect = el.getBoundingClientRect();
        const w = rect.width; const h = rect.height;
        const node = rc.rectangle(0,0,w,h, {stroke:'white',strokeWidth:2,roughness:2});
        node.style.position='absolute'; node.style.left='0'; node.style.top='0';
        el.style.position='relative';
        el.appendChild(node);
      });
    }

    // try to fetch rough.js library and apply
    const rsrc = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.1/bundled/rough.min.js';
    const rs = document.createElement('script'); rs.src = rsrc; rs.onload = ()=>{ window.rough = window.rough || window.rough; applyRough(); };
    rs.onerror = ()=>{}; document.head.appendChild(rs);
  }

  // lazy-load lab (simple script-inject pattern)
  const labBtn = document.getElementById('open-lab');
  labBtn?.addEventListener('click', async ()=>{
    labBtn.disabled = true; labBtn.textContent = 'Loading…';
    // inject Three.js (UMD) and then initialize a tiny demo if available
    const src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js';
    const s = document.createElement('script'); s.src = src; s.onload = ()=>{
      labBtn.textContent = 'Lab loaded';
      try{ initTinyThreeDemo(); }catch(e){ console.warn('Demo init failed', e) }
    };
    s.onerror = ()=>{ labBtn.textContent = 'Load failed'; labBtn.disabled = false };
    document.head.appendChild(s);
  });

  // initialize hero scene or fallback masonry depending on device and prefs
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen = window.innerWidth < 720;
  if(!prefersReduced && !smallScreen){
    initHeroThree();
  } else {
    // show masonry fallback and animate with GSAP (lighter)
    document.getElementById('hero-masonry').setAttribute('aria-hidden','false');
    animateMasonryFallback();
  }
});

function initTinyThreeDemo(){
  // create a small canvas node and a rotating box if THREE is present
  if(!window.THREE) return;
  const container = document.getElementById('hero-canvas');
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%'; canvas.style.height = '100%';
  container.innerHTML = ''; container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 3;
  const geo = new THREE.BoxGeometry(1,1,1);
  const mat = new THREE.MeshNormalMaterial();
  const box = new THREE.Mesh(geo, mat);
  scene.add(box);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  function animate(){
    box.rotation.x += 0.01; box.rotation.y += 0.02;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

/* ---------- New: Hero Three.js scene (flying image planes) ---------- */
function initHeroThree(){
  // inject Three.js UMD dynamically
  if(window.THREE) return setupHeroScene();
  const src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js';
  const s = document.createElement('script'); s.src = src; s.onload = ()=>{ try{ setupHeroScene() }catch(e){ console.warn('hero three init failed', e); showMasonryFallback() }};
  s.onerror = ()=>{ console.warn('three failed to load'); showMasonryFallback(); };
  document.head.appendChild(s);
}

function showMasonryFallback(){
  document.getElementById('hero-masonry').setAttribute('aria-hidden','false');
  animateMasonryFallback();
}

function animateMasonryFallback(){
  const imgs = document.querySelectorAll('#hero-masonry img');
  if(!imgs.length) return;
  imgs.forEach((img,i)=>{
    gsap.fromTo(img, {y:60, rotation:(Math.random()-0.5)*6, opacity:0}, {y:0, rotation:0, opacity:1, delay:i*0.08, duration:1.1, ease:'power3.out', repeat:-1, yoyo:true, repeatDelay:2+Math.random()*2});
  });
}

function setupHeroScene(){
  // minimal Three.js hero: floating image planes that orbit the headline
  const canvas = document.getElementById('hero-three-canvas');
  if(!canvas) return;
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 6;

  // lights
  const amb = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(amb);

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = '';

  // seeds (use picsum images) - lower resolution for perf
  const seeds = [101,102,103,104,105,106,107,108];
  const planes = [];
  seeds.forEach((s, idx)=>{
    const url = `https://picsum.photos/seed/${s}/600/400`;
    const tex = loader.load(url, ()=>{});
    const mat = new THREE.MeshBasicMaterial({map:tex, transparent:true});
    const aspect = 600/400;
    const geo = new THREE.PlaneGeometry(1.8 * (Math.random()*1.6 + 0.6), (1.8/aspect) * (Math.random()*1.6 + 0.6));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = (Math.random()-0.5)*6;
    mesh.position.y = (Math.random()-0.5)*2.4;
    mesh.position.z = -Math.random()*2;
    mesh.rotation.z = (Math.random()-0.5)*0.6;
    scene.add(mesh);
    planes.push({mesh, speed:0.2 + Math.random()*0.6, ang:Math.random()*Math.PI*2});
  });

  // resize handler
  function resize(){
    const w = canvas.clientWidth; const h = canvas.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  // animate
  let last = performance.now();
  function animate(now){
    const dt = (now - last) / 1000; last = now;
    planes.forEach((p,i)=>{
      p.ang += dt * p.speed * 0.4;
      p.mesh.position.x = Math.cos(p.ang + i) * (1.8 + i*0.12);
      p.mesh.position.y = Math.sin(p.ang*1.1 + i*0.3) * (0.6 + (i%3)*0.3);
      p.mesh.rotation.z += dt * 0.1 * (i%2?1:-1);
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // expose dispose for cleanup (optional)
  window._heroThreeCleanup = ()=>{
    planes.forEach(p=>{ p.mesh.geometry.dispose(); if(p.mesh.material.map) p.mesh.material.map.dispose(); p.mesh.material.dispose(); scene.remove(p.mesh); });
    renderer.dispose();
    window.removeEventListener('resize', resize);
  };
}
