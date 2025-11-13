// js/canvas-gl.js
// Simple canvas-based glitch text overlay. Lightweight, shader-like effects via 2D canvas.

function createGlitch(){
  const canvas = document.getElementById('glitch-text');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

  function resize(){
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  let width = 0, height = 0;
  resize(); window.addEventListener('resize', resize);

  const lines = ['Lennart', 'Hilbring', 'Design as Active Evidence'];
  const fontLarge = 'bold 72px Playfair Display, serif';
  const fontAlt = '700 72px Oswald, sans-serif';
  let t = 0;
  let paused = false;

  function draw(now){
    if(paused){ requestAnimationFrame(draw); return; }
    t += 0.01;
    // clear
    ctx.clearRect(0,0,canvas.width, canvas.height);

    // background subtle noise - small rectangles
    for(let i=0;i<8;i++){
      const alpha = 0.02 * (Math.random()*0.8 + 0.2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * 40;
      ctx.fillRect(rx, ry, Math.random()*80, Math.random()*6);
    }

    // draw layered glitch copies
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const baseX = 40; const baseY = 40;

    lines.forEach((line, i)=>{
      const y = baseY + i*86;
      // main layer
      ctx.font = fontLarge;
      ctx.fillStyle = 'white';
      ctx.fillText(line, baseX, y);

      // red/blue offset layers for chromatic aberration
      const jitter = Math.sin(t*3 + i) * 6;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,30,90,0.35)'; ctx.fillText(line, baseX + jitter + (Math.random()-0.5)*4, y + (Math.random()-0.5)*2); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(0,220,200,0.18)'; ctx.fillText(line, baseX - jitter + (Math.random()-0.5)*4, y + (Math.random()-0.5)*2); ctx.restore();

      // horizontal slice displacement occasionally
      if(Math.random() < 0.12){
        const sx = Math.floor(Math.random()*line.length*12);
        ctx.drawImage(canvas, sx, y, 120, 18, sx + (Math.random()-0.5)*20, y + (Math.random()-0.5)*6, 120, 18);
      }

    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  // expose pause/resume
  window._introPausedCallback = (b)=>{ paused = !!b; };
}

// init
document.addEventListener('DOMContentLoaded', ()=>{ try{ createGlitch(); }catch(e){ console.warn('glitch init failed', e); } });
