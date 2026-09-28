// Mobile nav toggle
const hamb = document.getElementById('hamb');
const menu = document.getElementById('menu');
if (hamb && menu) {
  hamb.addEventListener('click', () => menu.classList.toggle('open'));
}

// Year in footer
const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();

// ===== Carrusel básico con tacto, flechas, bullets y autoplay =====
(function(){
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach(initCarousel);

  function initCarousel(root){
    const viewport = root.querySelector('.car-viewport');
    const track = root.querySelector('.car-track');
    const slides = Array.from(root.querySelectorAll('.car-slide'));
    const prev = root.querySelector('.car-btn.prev');
    const next = root.querySelector('.car-btn.next');
    const dotsWrap = root.querySelector('.car-dots');

    let index = 0;
    let startX = 0, currentX = 0, isDown = false;
    let autoplay = root.dataset.autoplay === 'true';
    let interval = parseInt(root.dataset.interval || '5000', 10);
    let timer = null;

    // Bullets
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });

    function update(){
      const x = -index * viewport.clientWidth;
      track.style.transform = `translate3d(${x}px,0,0)`;
      // dots
      dotsWrap.querySelectorAll('button').forEach((b, i)=>{
        b.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function goTo(i){
      index = (i + slides.length) % slides.length;
      update();
      restartAutoplay();
    }

    function nextSlide(){ goTo(index + 1); }
    function prevSlide(){ goTo(index - 1); }

    // Resize handling
    window.addEventListener('resize', update);

    // Buttons
    next.addEventListener('click', nextSlide);
    prev.addEventListener('click', prevSlide);

    // Drag / touch
    viewport.addEventListener('pointerdown', e => {
      isDown = true; startX = e.clientX; currentX = startX;
      viewport.setPointerCapture(e.pointerId);
      track.style.transition = 'none';
    });
    viewport.addEventListener('pointermove', e => {
      if(!isDown) return;
      currentX = e.clientX;
      const delta = currentX - startX;
      const base = -index * viewport.clientWidth;
      track.style.transform = `translate3d(${base + delta}px,0,0)`;
    });
    viewport.addEventListener('pointerup', e => {
      if(!isDown) return; isDown = false;
      track.style.transition = '';
      const delta = currentX - startX;
      const threshold = viewport.clientWidth * 0.18;
      if (delta > threshold) prevSlide();
      else if (delta < -threshold) nextSlide();
      else update();
    });
    viewport.addEventListener('pointerleave', () => {
      if (isDown){ isDown = false; track.style.transition=''; update(); }
    });

    // Autoplay
    function startAutoplay(){
      if (!autoplay) return;
      stopAutoplay();
      timer = setInterval(nextSlide, interval);
    }
    function stopAutoplay(){ if (timer) clearInterval(timer); }
    function restartAutoplay(){ stopAutoplay(); startAutoplay(); }

    // Pause autoplay on hover/focus (desktop)
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);

    // Init
    update();
    startAutoplay();
  }
})();

// === Ajuste de altura para ver la imagen completa (contain) ===
(function(){
  const carousels = document.querySelectorAll('.carousel.contain');
  carousels.forEach(initContainHeight);

  function initContainHeight(root){
    const viewport = root.querySelector('.car-viewport');
    const track = root.querySelector('.car-track');
    const slides = Array.from(root.querySelectorAll('.car-slide'));
    let index = 0;

    // Detecta si ya existe control de índice (de tu carrusel actual)
    // Si tienes una variable global o función update(), puedes engancharte;
    // si no, te dejo un observador simple del transform para re-calcular.

    // Función que pone la altura exacta del viewport según el slide activo
    function setViewportHeight(i){
      const slide = slides[i];
      if(!slide) return;
      const img = slide.querySelector('img');
      if(!img) return;

      // Cuando la imagen ya está lista, calcula proporción
      const apply = () => {
        const w = img.naturalWidth || img.width || 1;
        const h = img.naturalHeight || img.height || 1;
        const vw = viewport.clientWidth;
        viewport.style.height = (h / w * vw) + 'px';
      };

      if (img.complete) apply();
      else img.addEventListener('load', apply, { once:true });
    }

    // Descubre el índice actual leyendo el translateX del track
    function readIndex(){
      const m = getComputedStyle(track).transform;
      // matrix(1,0,0,1, -x, 0) => x / viewportWidth
      if (m && m !== 'none'){
        const x = parseFloat(m.split(',')[4]) || 0;
        const w = viewport.clientWidth || 1;
        index = Math.round(Math.abs(x) / w);
      }
      setViewportHeight(index);
    }

    // Recalcula en resize y al cargar cada imagen
    window.addEventListener('resize', () => setViewportHeight(index));
    slides.forEach(s=>{
      const img = s.querySelector('img');
      if (img && !img.complete) img.addEventListener('load', ()=>setViewportHeight(index));
    });

    // Observa cambios en el track (cuando cambias de slide)
    const obs = new MutationObserver(readIndex);
    obs.observe(track, { attributes:true, attributeFilter:['style'] });

    // Primer cálculo
    setViewportHeight(0);
  }
})();
