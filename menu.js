const CATEGORY_ORDER = ['sigara', 'alkol', 'icecek', 'atistirmalik', 'diger'];
const CATEGORY_LABELS = {
  sigara: '🚬 Sigara',
  alkol: '🍺 Alkol',
  icecek: '🥤 İçecek',
  atistirmalik: '🍿 Atıştırmalık',
  diger: '📦 Diğer',
};

const products = JSON.parse(localStorage.getItem('tekel_products') || '[]');
const settings = JSON.parse(localStorage.getItem('tekel_settings') || '{}');

// ── Header ────────────────────────────────────────────
document.getElementById('shop-name').textContent = settings.name || 'Tekel Bayii';
if (settings.color) {
  document.querySelector('.menu-header').style.background = settings.color;
}
const metaParts = [];
if (settings.hours) metaParts.push('🕐 ' + settings.hours);
if (settings.phone) metaParts.push('📞 ' + settings.phone);
document.getElementById('shop-meta').textContent = metaParts.join('  ·  ');

// ── Footer ────────────────────────────────────────────
const footerParts = [];
if (settings.name) footerParts.push('<strong style="color:#fff">' + settings.name + '</strong>');
if (settings.address) footerParts.push('📍 ' + settings.address);
if (settings.phone) footerParts.push('📞 ' + settings.phone);
if (settings.hours) footerParts.push('🕐 ' + settings.hours);
document.getElementById('footer-info').innerHTML = footerParts.join('<br>');

// ── Build Menu ────────────────────────────────────────
const usedCategories = CATEGORY_ORDER.filter(cat => products.some(p => p.category === cat));

// Category Nav
const navEl = document.getElementById('cat-nav');
usedCategories.forEach((cat, i) => {
  const btn = document.createElement('button');
  btn.className = 'menu-cat-btn' + (i === 0 ? ' active' : '');
  btn.textContent = CATEGORY_LABELS[cat];
  btn.dataset.cat = cat;
  btn.onclick = () => scrollToSection(cat, btn);
  navEl.appendChild(btn);
});

// Sections
const main = document.getElementById('menu-content');
if (products.length === 0) {
  main.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><p>Henüz menüde ürün bulunmuyor.</p></div>';
} else {
  main.innerHTML = '';
  usedCategories.forEach(cat => {
    const items = products.filter(p => p.category === cat);
    if (!items.length) return;

    const section = document.createElement('section');
    section.className = 'cat-section';
    section.id = 'cat-' + cat;

    section.innerHTML = `<div class="cat-title">${CATEGORY_LABELS[cat]}</div>` +
      items.map(p => `
        <div class="product-item ${p.inStock ? '' : 'out'}">
          <div class="product-left">
            <div class="item-name">${esc(p.name)}</div>
            ${p.desc ? `<div class="item-desc">${esc(p.desc)}</div>` : ''}
            ${!p.inStock ? `<div class="item-oos">● Tükendi</div>` : ''}
          </div>
          <div class="product-right">
            <div class="item-price">${formatPrice(p.price)}</div>
            <div class="item-unit">/ ${esc(p.unit)}</div>
          </div>
        </div>
      `).join('');

    main.appendChild(section);
  });
}

// ── Scroll Spy ────────────────────────────────────────
function scrollToSection(cat, btn) {
  const el = document.getElementById('cat-' + cat);
  if (!el) return;
  const offset = 88 + 48; // header + nav
  const top = el.getBoundingClientRect().top + window.scrollY - offset - 8;
  window.scrollTo({ top, behavior: 'smooth' });
  setActiveNav(btn);
}

function setActiveNav(activeBtn) {
  document.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const cat = entry.target.id.replace('cat-', '');
      const btn = document.querySelector(`.menu-cat-btn[data-cat="${cat}"]`);
      if (btn) setActiveNav(btn);
    }
  });
}, { rootMargin: '-100px 0px -60% 0px' });

document.querySelectorAll('.cat-section').forEach(s => observer.observe(s));

// ── Helpers ───────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatPrice(n) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₺'; }
