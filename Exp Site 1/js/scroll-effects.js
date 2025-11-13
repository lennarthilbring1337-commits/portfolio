// js/scroll-effects.js
// Centralized scroll + WebGL lazy-init module

const MIN_DESKTOP_WIDTH = 720;
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js';

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
}

async function init(){
  // register ScrollTrigger if available globally
  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({toggleActions:'play pause resume reset'});
  }

  // ensure work area isolation to avoid blend leaks
  document.querySelectorAll('.work-section, .project-tile').forEach(el=> el.classList.add('isolate'));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.innerWidth >= MIN_DESKTOP_WIDTH;

  if(!reduced && isDesktop){
    try{
      await loadScript(THREE_CDN);
      if(window.THREE){ initIntroThree(); initTileThumbnails(); }
    }catch(e){
      console.warn('Three.js load failed, falling back to CSS/GSAP animations', e);
      initSimpleAnimations();
    }
  }else{
    initSimpleAnimations();
  }

  // light ScrollTrigger example: fade nav on scroll past intro
  if(window.ScrollTrigger){
    ScrollTrigger.create({ trigger:'#work', start:'top 60%', onEnter: ()=> gsap.to('.nav-compact',{opacity:1,duration:0.6}), onLeaveBack: ()=> gsap.to('.nav-compact',{opacity:0.85,duration:0.6}) });
  }
}

/* Intro Three.js scene similar to earlier prototype but modularized */
function initIntroThree(){
  if(!window.THREE) return;
  const canvas = document.getElementById('hero-three-canvas');
  if(!canvas) return;

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0,0,8);

  const amb = new THREE.AmbientLight(0xffffff, 0.85); scene.add(amb);
  const loader = new THREE.TextureLoader(); loader.crossOrigin = '';

  const seeds = [1,2,3,4,5,6,7];
  const planes = [];
  seeds.forEach((s,i)=>{
    const url = `/assets/images/placeholder_${s}.jpg`;
    const tex = loader.load(url, ()=>{});
    const w = 1.6 + Math.random()*1.6;
    const h = w * (0.6 + Math.random()*0.8);
    const geo = new THREE.PlaneGeometry(w,h);
    const mat = new THREE.MeshBasicMaterial({map:tex, transparent:true});
    const m = new THREE.Mesh(geo, mat);
    m.position.set((Math.random()-0.5)*6, (Math.random()-0.5)*2.2, -Math.random()*2);
    m.rotation.z = (Math.random()-0.5)*0.6;
    m.userData = {ang: Math.random()*Math.PI*2, speed:0.2 + Math.random()*0.6};
    scene.add(m); planes.push(m);
  });

  function resize(){ const w = canvas.clientWidth; const h = canvas.clientHeight; renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize); resize();

  let last = performance.now(); let paused = false;
  function animate(now){ const dt = (now-last)/1000; last = now; if(!paused){ planes.forEach((p,idx)=>{ p.userData.ang += dt * p.userData.speed * 0.4; p.position.x = Math.cos(p.userData.ang + idx) * (1.6 + idx*0.12); p.position.y = Math.sin(p.userData.ang*1.1 + idx*0.3) * (0.5 + (idx%3)*0.3); p.rotation.z += dt * 0.1 * (idx%2?1:-1); }); renderer.render(scene, camera); } requestAnimationFrame(animate); }
  requestAnimationFrame(animate);

  window._introPausedCallback = (b)=>{ paused = !!b; };
  window._cleanupIntro = ()=>{ planes.forEach(p=>{ if(p.material.map) p.material.map.dispose(); p.geometry.dispose(); p.material.dispose(); scene.remove(p); }); renderer.dispose(); window.removeEventListener('resize', resize); };
}

/* Per-tile thumbnails: lazy init small Three.js planes inside each project tile */
function initTileThumbnails(){
  if(!window.THREE) return;
  const tiles = Array.from(document.querySelectorAll('[data-component="project-tile"]'));
  if(!tiles.length) return;
  const obs = new IntersectionObserver((entries, o)=>{ entries.forEach(en=>{ if(en.isIntersecting){ o.unobserve(en.target); instantiateTile(en.target); } }); }, {rootMargin:'200px 0px 200px 0px', threshold:0.1});
  tiles.forEach(t=>obs.observe(t));
}

function instantiateTile(container){
  const img = container.dataset.image || '/assets/images/placeholder_1.jpg';
  const canvas = document.createElement('canvas'); canvas.className = 'thumb-canvas'; container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000); camera.position.z = 3;
  const loader = new THREE.TextureLoader(); loader.crossOrigin=''; loader.load(img, texture=>{ const aspect = texture.image ? (texture.image.width/texture.image.height):1.5; const w=1.6; const h=w/aspect; const geo = new THREE.PlaneGeometry(w,h); const mat = new THREE.MeshBasicMaterial({map:texture, transparent:true}); const mesh = new THREE.Mesh(geo,mat); scene.add(mesh);
    // pointer tilt
    container.addEventListener('pointermove', (ev)=>{ const rX=(ev.offsetY/container.clientHeight-0.5)*0.12; const rY=(ev.offsetX/container.clientWidth-0.5)*0.12; gsap.to(mesh.rotation, {x:rX, y:rY, duration:0.5, ease:'power2.out'}); });
    container.addEventListener('pointerleave', ()=> gsap.to(mesh.rotation, {x:0,y:0,duration:0.7,ease:'power2.out'}));
    let t=0; function loop(){ t+=0.01; mesh.position.y = Math.sin(t)*0.06; renderer.render(scene,camera); mesh._raf=requestAnimationFrame(loop);} loop();
  });
  function resize(){ renderer.setSize(container.clientWidth, container.clientHeight, false); camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); }
  resize(); window.addEventListener('resize', resize);
  container._cleanup = ()=>{ cancelAnimationFrame(container._raf); window.removeEventListener('resize', resize); };
}

function initSimpleAnimations(){
  // simple subtle GSAP loops for non-webgl devices
  document.querySelectorAll('#work .tile').forEach((el, idx)=>{ gsap.fromTo(el, {y:20, rotation:(Math.random()-0.5)*1.2, opacity:0.95}, {y:0, rotation:0, opacity:1, delay:idx*0.05, duration:1, ease:'power3.out', repeat:-1, yoyo:true, repeatDelay:2+Math.random()*2}); });
}

// Auto-init on module load
document.addEventListener('DOMContentLoaded', ()=>{ init().catch(e=>console.error(e)); });

*** End Patch