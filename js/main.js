document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Highlight active nav link based on current page
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-btn[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) a.classList.add('active');
  });

  // Scroll-triggered reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Magnetic pull on nav + CTA buttons
  if (!reduceMotion) {
    document.querySelectorAll('.nav-btn, form button').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // Cursor-tracked sheen on glass panels + buttons
  document.querySelectorAll('button, .glass').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
      btn.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  const hero = document.querySelector('.hero');
  const heroImg = document.querySelector('.hero-img');
  const heroContent = document.querySelector('.hero-content');
  const swatches = Array.from(document.querySelectorAll('.swatch'));
  const watermark = document.querySelector('.watermark');

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    if (hero && watermark) {
      // hero title fades out as the same-size watermark fades in behind the page
      const p = clamp(window.scrollY / hero.offsetHeight, 0, 1);
      watermark.style.opacity = 0.1 * clamp((p - 0.1) / 0.6, 0, 1);
    }
    if (reduceMotion) return;
    const vh = window.innerHeight;

    if (hero && heroImg && heroContent) {
      const heroH = hero.offsetHeight;
      const heroProg = clamp(window.scrollY / heroH, 0, 1);
      heroImg.style.transform = `translateY(${heroProg * 60}px) scale(${1 + heroProg * 0.04})`;
      heroContent.style.opacity = 1 - heroProg * 1.3;
      heroContent.style.transform = `translateY(${heroProg * 40}px)`;
    }

    swatches.forEach(sw => {
      const r = sw.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const dist = Math.abs(center - vh / 2);
      const prog = clamp(1 - dist / (vh * 0.7), 0, 1);
      const scale = 0.9 + prog * 0.1;
      const bright = 0.78 + prog * 0.22;
      sw.style.transform = `scale(${scale})`;
      sw.style.filter = `brightness(${bright}) saturate(${0.9 + prog * 0.1})`;
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  });
  onScroll();
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quote-form');
  if (!form || !window.emailjs) return;

  const status = form.querySelector('.form-status');
  const submitButton = form.querySelector('button[type="submit"]');

  window.emailjs.init({ publicKey: 'kZJKJsTPn9dOg7-EN' });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    status.hidden = false;
    status.classList.remove('ok', 'err');
    status.textContent = 'Sending your inquiry...';

    const params = {
      name: form.elements.namedItem('name').value,
      email: form.elements.namedItem('email').value,
      reply_to: form.elements.namedItem('email').value,
      company: form.elements.namedItem('company').value,
      phone: form.elements.namedItem('phone').value,
      country: form.elements.namedItem('country').value,
      product: form.elements.namedItem('product').value,
      estimated_quantity: form.elements.namedItem('estimated_quantity').value,
      destination_port: form.elements.namedItem('destination_port').value,
      message: form.elements.namedItem('message').value
    };

    try {
      await window.emailjs.send('service_lij7vf9', 'template_21lwd1m', params);
      form.reset();
      status.classList.add('ok');
      status.textContent = 'Thank you! Your inquiry was sent successfully. We’ll get back to you within one business day.';
    } catch (error) {
      console.error('EmailJS inquiry submission failed:', error);
      status.classList.add('err');
      status.textContent = 'Unable to send your inquiry. Please try again or contact us by email.';
    } finally {
      submitButton.disabled = false;
    }
  });
});

// M logo: show hovered/focused product name; clicking a colour follows its link to the product
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.querySelector('.m-wrap');
  if (!wrap) return;
  const cap = wrap.querySelector('.m-caption');
  const idle = cap.textContent;
  const show = (t) => { cap.textContent = t; };
  wrap.querySelectorAll('.m-band, .m-legend a').forEach(a => {
    const name = a.dataset.name;
    ['mouseenter', 'focus'].forEach(ev => a.addEventListener(ev, () => show(name)));
    ['mouseleave', 'blur'].forEach(ev => a.addEventListener(ev, () => show(idle)));
  });
});

// M hover: draw a thread from the colour to a details box beside the M
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.querySelector('.m-wrap');
  if (!wrap) return;
  const svg = wrap.querySelector('.m-logo');
  const thread = wrap.querySelector('.m-thread');
  const path = thread.querySelector('path');
  const dot = thread.querySelector('circle');
  const card = wrap.querySelector('.m-card');
  const wide = window.matchMedia('(min-width:860px)');
  let hideT;

  function show(band) {
    if (!wide.matches) return;
    clearTimeout(hideT);
    const w = wrap.getBoundingClientRect(), s = svg.getBoundingClientRect();
    const left = band.compareDocumentPosition(wrap.querySelectorAll('.m-band')[3]) & Node.DOCUMENT_POSITION_FOLLOWING; // bands 1-3 -> card on the left
    card.querySelector('.m-card-origin').textContent = band.dataset.origin;
    card.querySelector('.m-card-name').textContent = band.dataset.name;
    card.querySelector('.m-card-desc').textContent = band.dataset.desc;
    card.querySelector('.m-card-link').href = band.getAttribute('href');
    const cardH = card.offsetHeight;
    const cy = s.top - w.top + s.height / 2;
    const cardTop = cy - cardH / 2;
    card.style.top = cardTop + 'px';
    card.style.left = left ? '0px' : 'auto';
    card.style.right = left ? 'auto' : '0px';
    const ax = s.left - w.left + band.dataset.ax / 600 * s.width;
    const ay = s.top - w.top + band.dataset.ay / 500 * s.height;
    const ex = left ? card.offsetWidth : w.width - card.offsetWidth;
    const ey = cy;
    const mx = (ax + ex) / 2;
    path.setAttribute('d', `M${ax},${ay} C${mx},${ay} ${mx},${ey} ${ex},${ey}`);
    const len = Math.ceil(path.getTotalLength()) + 2;
    path.style.setProperty('--len', len);
    dot.setAttribute('cx', ax); dot.setAttribute('cy', ay);
    wrap.classList.remove('tip');
    void wrap.offsetWidth; // restart the draw animation
    wrap.classList.add('tip');
  }
  const hide = () => { hideT = setTimeout(() => wrap.classList.remove('tip'), 250); };

  wrap.querySelectorAll('.m-band').forEach(b => {
    b.addEventListener('mouseenter', () => show(b));
    b.addEventListener('focus', () => show(b));
    b.addEventListener('mouseleave', hide);
    b.addEventListener('blur', hide);
  });
  card.addEventListener('mouseenter', () => clearTimeout(hideT));
  card.addEventListener('mouseleave', hide);
});
