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

// Quote form: email the inquiry to Minerva Exports via FormSubmit (falls back to the visitor's mail app)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const TO = 'Minervaeksports@gmail.com';
  const btn = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');

  function mailtoFallback(data) {
    const body = `Name: ${data.name}\nEmail: ${data.email}\nProduct: ${data.product}\n\n${data.message}`;
    location.href = `mailto:${TO}?subject=${encodeURIComponent('Quote inquiry — ' + data.product)}&body=${encodeURIComponent(body)}`;
  }

  const f = (n) => form.elements.namedItem(n);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (f('_honey').value) return; // spam bot
    const data = {
      name: f('name').value.trim(),
      email: f('email').value.trim(),
      product: f('product').value,
      message: f('message').value.trim(),
      _subject: `New quote inquiry — ${f('product').value}`,
      _replyto: f('email').value.trim(),
      _template: 'table',
      _captcha: 'false'
    };
    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.classList.remove('ok', 'err');
    status.textContent = '';
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${TO}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || 'Send failed');
      form.reset();
      btn.disabled = false;
      btn.textContent = 'Send inquiry';
      status.classList.add('ok');
      status.textContent = `✓ Submitted successfully. Thank you, ${data.name || 'there'} — we've received your inquiry and will reply to ${data.email} within one business day.`;
      setTimeout(() => { status.classList.remove('ok'); status.textContent = ''; }, 12000);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Send inquiry';
      status.classList.add('err');
      if (location.protocol === 'file:') {
        status.textContent = 'This page was opened as a file, so it cannot send email. Open the site through a web server (or the live website) and try again.';
      } else if (/activat/i.test(err.message)) {
        status.textContent = `Email sending isn't activated yet. Check ${TO} (including Spam) for the "Activate Form" email, click it, then send again.`;
      } else {
        status.textContent = `We couldn't send automatically, so we've opened your email app. You can also write to ${TO}.`;
        mailtoFallback(data);
      }
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
