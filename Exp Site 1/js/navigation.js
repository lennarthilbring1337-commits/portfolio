// js/navigation.js
// Handles sidebar toggle, intro controls, and simple keyboard accessibility

document.addEventListener('DOMContentLoaded', ()=>{
  // sidebar toggle
  const toggle = document.querySelector('.sidebar-toggle');
  const nav = document.getElementById('nav');
  if(toggle && nav){
    toggle.addEventListener('click', ()=>{
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.setAttribute('aria-hidden', String(expanded));
    });
  }

  // intro control buttons (enter work / lab)
  const btnWork = document.getElementById('open-work');
  const btnLab = document.getElementById('open-lab');
  const btnPause = document.getElementById('toggle-motion');
  const workSection = document.getElementById('work');
  const labSection = document.getElementById('lab');

  if(btnWork && workSection){
    btnWork.addEventListener('click', ()=>{ workSection.scrollIntoView({behavior:'smooth'}); });
  }
  if(btnLab && labSection){
    btnLab.addEventListener('click', ()=>{ labSection.scrollIntoView({behavior:'smooth'}); });
  }

  // Pause motion toggle communicates with window._introPausedCallback if present
  if(btnPause){
    btnPause.addEventListener('click', ()=>{
      const pressed = btnPause.getAttribute('aria-pressed') === 'true';
      btnPause.setAttribute('aria-pressed', String(!pressed));
      if(window._introPausedCallback) window._introPausedCallback(!pressed);
    });
  }

  // keyboard accessibility: Enter on project seeds will focus corresponding tiles
  document.querySelectorAll('[data-component="project-tile"]').forEach(el=>{
    el.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        const link = el.querySelector('.project-link');
        if(link) link.click();
      }
    });
  });
});
