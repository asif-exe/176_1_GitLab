/* HELLO/ — vanilla JS. All interactions work offline. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const root = document.body;
  const canvas = $('#starfield');
  const ctx = canvas.getContext('2d');
  const burstLayer = $('#burst-layer');
  const mouse = { x: -1000, y: -1000, active: false };
  const motionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themes = ['solar', 'bubble', 'ocean', 'ember'];
  const greetings = [
    ['HELLO', 'WORLD', 'The original. The classic. The icon.'],
    ['CIAO', 'MONDO', 'A little Italian flair. ✨'],
    ['HOLA', 'MUNDO', '¡Qué buena onda!'],
    ['BONJOUR', 'MONDE', 'Oui, oui. Very chic.'],
    ['HALLO', 'WELT', 'Guten Tag, internet!'],
    ['OLÁ', 'MUNDO', 'Sending sunshine your way.']
  ];
  let themeIndex = 0;
  let greetingIndex = 0;
  let interactions = 0;
  let freeGravity = false;
  let soundEnabled = false;
  let audio = null;
  let particles = [];
  let width = 0;
  let height = 0;
  let toastTimer;
  let frame = 0;
  let previousFocus = null;

  // Lightweight synthesizer: no audio files or libraries.
  function playTone(frequency = 440, duration = 0.12, wave = 'sine') {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audio ||= new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.15, audio.currentTime + duration);
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration + 0.01);
    } catch (_) { /* Audio is optional. */ }
  }
  function countInteraction() {
    interactions++;
    $('#click-counter').textContent = `${String(interactions).padStart(2, '0')} INTERACTIONS`;
  }
  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }
  const colors = () => {
    const s = getComputedStyle(root);
    return [s.getPropertyValue('--accent').trim(), s.getPropertyValue('--accent2').trim(), '#ffffff', '#ffde82', '#9d92ff'];
  };
  function burst(x, y, number = 55) {
    if (motionDisabled) return;
    const palette = colors();
    for (let i = 0; i < number; i++) {
      const item = document.createElement('i');
      item.className = 'burst-particle';
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * (number > 90 ? 460 : 280);
      const size = 4 + Math.random() * 11;
      item.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance + 55}px;--r:${Math.random() * 1200 - 600}deg;--s:${size}px;--c:${palette[i % palette.length]};--t:${0.75 + Math.random() * 0.95}s;--round:${i % 3 ? '1px' : '50%'};`;
      burstLayer.appendChild(item);
      item.addEventListener('animationend', () => item.remove(), { once: true });
    }
  }
  function burstFrom(element, count = 55) {
    const box = element.getBoundingClientRect();
    burst(box.left + box.width / 2, box.top + box.height / 2, count);
  }
  function shake() {
    root.classList.remove('shake');
    void root.offsetWidth;
    root.classList.add('shake');
    setTimeout(() => root.classList.remove('shake'), 650);
  }
  function switchTheme() {
    themeIndex = (themeIndex + 1) % themes.length;
    root.dataset.theme = themes[themeIndex];
    toast(`${themes[themeIndex].toUpperCase()} MODE ACTIVATED ✳`);
    countInteraction();
    burstFrom($('#theme-toggle'), 24);
    playTone(520 + themeIndex * 80);
  }
  function remix() {
    greetingIndex = (greetingIndex + 1) % greetings.length;
    const [hello, world, description] = greetings[greetingIndex];
    $('#hello-word').textContent = hello;
    $('#world-word').textContent = world;
    $('#main-heading').setAttribute('aria-label', `${hello} ${world}!`);
    // Scale long greetings gently to keep them on one line.
    $('.hero-title').style.fontSize = (hello.length > 6 || world.length > 6) ? 'clamp(64px, 8vw, 132px)' : '';
    root.dataset.theme = themes[++themeIndex % themes.length];
    toast(description);
    burst(window.innerWidth * .48, window.innerHeight * .45, 95);
    playTone(380 + greetingIndex * 65, .20, 'triangle');
    shake();
    countInteraction();
  }
  function surprise() {
    burst(Math.random() * innerWidth * .7 + innerWidth * .15, Math.random() * innerHeight * .5 + innerHeight * .2, 115);
    toast(['YOU FOUND THE SPARKLES ✨', 'GOOD VIBES: MAXIMUM', 'THE UNIVERSE SAYS HI 👋', 'CERTIFIED FUN MOMENT ✳'][Math.floor(Math.random() * 4)]);
    playTone(720, .22, 'triangle');
    countInteraction();
  }

  // Ambient starfield. Mouse gravity pulls particles; gravity toggle reverses it.
  class Star {
    constructor() { this.reset(true); }
    reset(random = false) {
      this.x = Math.random() * width;
      this.y = random ? Math.random() * height : -10;
      this.r = Math.random() * 1.6 + 0.35;
      this.vx = (Math.random() - .5) * .28;
      this.vy = Math.random() * .5 + .13;
      this.alpha = Math.random() * .52 + .11;
      this.phase = Math.random() * Math.PI * 2;
    }
    draw() {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      const dist2 = dx * dx + dy * dy;
      if (mouse.active && dist2 < 26000 && dist2 > 1) {
        const factor = freeGravity ? -0.75 : 0.75;
        const influence = (1 - Math.sqrt(dist2) / 162) * .55 * factor;
        this.x += (dx / Math.sqrt(dist2)) * influence * 2.8;
        this.y += (dy / Math.sqrt(dist2)) * influence * 2.8;
      }
      this.x += this.vx * (freeGravity ? 1.8 : 1);
      this.y += this.vy * (freeGravity ? -1.8 : 1);
      if (this.x > width + 20) this.x = -10;
      if (this.x < -20) this.x = width + 10;
      if (this.y > height + 20 || this.y < -20) this.reset(false);
      const twinkle = .8 + Math.sin(frame * .012 + this.phase) * .2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235,238,252,${this.alpha * twinkle})`;
      ctx.fill();
    }
  }
  function resizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth; height = innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: Math.min(130, Math.max(40, Math.floor(width * height / 13000))) }, () => new Star());
  }
  let animationId;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => p.draw());
    frame++;
    animationId = requestAnimationFrame(animate);
  }
  resizeCanvas();
  if (!motionDisabled) animate(); else {particles.forEach(p => p.draw());}
  addEventListener('resize', resizeCanvas, { passive: true });

  // Pointer glow and the tiny custom cursor.
  const cursor = $('#custom-cursor');
  const glow = $('#cursor-glow');
  let cursorX = -200, cursorY = -200, glowX = -900, glowY = -900;
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (finePointer && !motionDisabled) {
    addEventListener('pointermove', e => {
      mouse.x = cursorX = e.clientX;
      mouse.y = cursorY = e.clientY;
      mouse.active = true;
      cursor.style.transform = `translate3d(${cursorX - (cursor.classList.contains('hover') ? 24 : 7)}px,${cursorY - (cursor.classList.contains('hover') ? 24 : 7)}px,0)`;
      $('#coordinates').textContent = `X: ${String(Math.round(e.clientX)).padStart(3, '0')} / Y: ${String(Math.round(e.clientY)).padStart(3, '0')}`;
    }, { passive: true });
    function moveGlow() {
      glowX += (cursorX - glowX) * .065;
      glowY += (cursorY - glowY) * .065;
      glow.style.transform = `translate3d(${glowX - 235}px,${glowY - 235}px,0)`;
      requestAnimationFrame(moveGlow);
    }
    moveGlow();
    document.querySelectorAll('button, a').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
    const stage = $('#stage');
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      $('#planet-zone').style.transform = `translate(${x * 12}px,${y * 12}px)`;
      $('#planet-wrap').style.rotate = `${-y * 12}deg ${x * 13}deg`;
    });
    stage.addEventListener('pointerleave', () => {
      $('#planet-zone').style.transform = '';
      $('#planet-wrap').style.rotate = '';
    });
    // Magnetic call-to-action buttons.
    document.querySelectorAll('.magnetic').forEach(button => {
      button.addEventListener('pointermove', e => {
        const r = button.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        button.style.transform = `translate(${x * .12}px,${y * .17}px)`;
      });
      button.addEventListener('pointerleave', () => button.style.transform = '');
    });
  }
  addEventListener('pointerleave', () => { mouse.active = false; });

  $('#remix-button').addEventListener('click', remix);
  $('#surprise-button').addEventListener('click', surprise);
  $('#theme-toggle').addEventListener('click', switchTheme);
  $('#planet-button').addEventListener('click', () => {
    burstFrom($('#planet'), 110);
    shake();
    toast('HEY! THAT TICKLES! ☺');
    playTone(660, .16, 'triangle');
    countInteraction();
  });
  $('#chaos-button').addEventListener('click', () => {
    for (let i = 0; i < 4; i++) setTimeout(() => burst(Math.random() * innerWidth, Math.random() * innerHeight, 45), i * 120);
    shake();
    toast('CHAOS: DELIGHTFULLY UNLEASHED!');
    playTone(280, .24, 'sawtooth');
    countInteraction();
  });
  $('#gravity-button').addEventListener('click', () => {
    freeGravity = !freeGravity;
    $('#gravity-state').textContent = freeGravity ? 'OFF' : 'ON';
    $('#gravity-button').setAttribute('aria-pressed', String(freeGravity));
    toast(freeGravity ? 'GRAVITY HAS LEFT THE CHAT ☄' : 'BACK TO PLANET EARTH 🌎');
    playTone(freeGravity ? 480 : 360);
    countInteraction();
  });
  function closeSecret() {
    $('#secret-overlay').classList.remove('open');
    $('#secret-overlay').setAttribute('aria-hidden', 'true');
    root.style.overflow = '';
    previousFocus?.focus();
  }
  function openSecret() {
    previousFocus = document.activeElement;
    $('#secret-overlay').classList.add('open');
    $('#secret-overlay').setAttribute('aria-hidden', 'false');
    root.style.overflow = 'hidden';
    $('#secret-close').focus();
    countInteraction();
    playTone(900, .22, 'triangle');
  }
  $('#message-button').addEventListener('click', openSecret);
  $('#secret-close').addEventListener('click', closeSecret);
  $('#secret-okay').addEventListener('click', () => { closeSecret(); surprise(); });
  $('#secret-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeSecret(); });
  $('#sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const button = $('#sound-toggle');
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.setAttribute('aria-label', soundEnabled ? 'Turn sounds off' : 'Turn sounds on');
    $('#sound-icon').innerHTML = soundEnabled
      ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path>'
      : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="17" y1="9" x2="23" y2="15"></line><line x1="23" y1="9" x2="17" y2="15"></line>';
    toast(soundEnabled ? 'SOUND ON — LET\'S PLAY ♪' : 'SOUND OFF — SHHH ♫');
    playTone(600, .2);
  });
  addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    const overlayOpen = $('#secret-overlay').classList.contains('open');
    if (e.key === 'Escape' && overlayOpen) { closeSecret(); return; }
    if (overlayOpen) {
      if (e.key === 'Tab') {
        const focusable = [$('#secret-close'), $('#secret-okay')];
        const idx = focusable.indexOf(document.activeElement);
        if ((e.shiftKey && idx === 0) || (!e.shiftKey && idx === focusable.length - 1)) {e.preventDefault(); focusable[e.shiftKey ? focusable.length - 1 : 0].focus();}
      }
      return;
    }
    if (e.code === 'Space' && !['BUTTON', 'A'].includes(tag)) {e.preventDefault(); surprise();}
    else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) remix();
  });
  // Let the surprise be genuinely discoverable: five quick clicks on the heading.
  let titleClicks = 0;
  let titleTimer;
  $('#main-heading').addEventListener('click', () => {
    clearTimeout(titleTimer);
    titleClicks++;
    if (titleClicks >= 5) {titleClicks = 0; openSecret();}
    titleTimer = setTimeout(() => titleClicks = 0, 1700);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cancelAnimationFrame(animationId);}
    else if (!motionDisabled) animate();
  });
})();
