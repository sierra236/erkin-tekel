// ── State ──────────────────────────────────────────────
let products = JSON.parse(localStorage.getItem('tekel_products') || '[]');
let settings = JSON.parse(localStorage.getItem('tekel_settings') || '{}');
let currentFilter = 'all';
let deleteTargetId = null;
let qrInstance = null;

const CATEGORY_LABELS = {
  sigara: '🚬 Sigara',
  alkol: '🍺 Alkol',
  icecek: '🥤 İçecek',
  atistirmalik: '🍿 Atıştırmalık',
  diger: '📦 Diğer',
};

// ── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (products.length === 0) seedDefaults();
  loadSettings();
  renderProducts();
  buildQR();
});

function seedDefaults() {
  products = [
    { id: uid(), name: 'Marlboro Kırmızı', category: 'sigara', price: 110, unit: 'paket', desc: '20\'li paket', inStock: true },
    { id: uid(), name: 'Camel', category: 'sigara', price: 100, unit: 'paket', desc: '20\'li paket', inStock: true },
    { id: uid(), name: 'Efes Pilsen', category: 'alkol', price: 65, unit: 'şişe', desc: '50cl', inStock: true },
    { id: uid(), name: 'Tuborg Gold', category: 'alkol', price: 65, unit: 'şişe', desc: '50cl', inStock: true },
    { id: uid(), name: 'Coca Cola', category: 'icecek', price: 30, unit: 'şişe', desc: '50cl', inStock: true },
    { id: uid(), name: 'Su', category: 'icecek', price: 10, unit: 'şişe', desc: '0.5lt', inStock: true },
    { id: uid(), name: 'Cips', category: 'atistirmalik', price: 25, unit: 'adet', desc: 'Çeşitli markalar', inStock: true },
  ];
  save();
}

// ── Tabs ───────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
  if (name === 'qr') buildQR();
}

// ── Products ───────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const list = currentFilter === 'all' ? products : products.filter(p => p.category === currentFilter);

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><p>Henüz ürün yok. "Ürün Ekle" butonunu kullanın.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="product-card ${p.inStock ? '' : 'out-of-stock'}">
      <span class="stock-badge ${p.inStock ? 'stock-yes' : 'stock-no'}">${p.inStock ? 'Stokta' : 'Tükendi'}</span>
      <div class="product-badge badge-${p.category}">${CATEGORY_LABELS[p.category]}</div>
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-desc">${esc(p.desc || '')}</div>
      <div class="product-footer">
        <div>
          <div class="product-price">${formatPrice(p.price)}</div>
          <div class="product-unit">/ ${p.unit}</div>
        </div>
        <div class="product-actions">
          <button class="icon-btn" onclick="openEditModal('${p.id}')" title="Düzenle">✏️</button>
          <button class="icon-btn del" onclick="openDeleteModal('${p.id}', '${esc(p.name)}')" title="Sil">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCategory(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts();
}

// ── Modal ──────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Ürün Ekle';
  document.getElementById('edit-id').value = '';
  document.getElementById('p-name').value = '';
  document.getElementById('p-category').value = 'sigara';
  document.getElementById('p-price').value = '';
  document.getElementById('p-unit').value = 'adet';
  document.getElementById('p-desc').value = '';
  document.getElementById('p-instock').checked = true;
  document.getElementById('modal').classList.add('open');
  document.getElementById('p-name').focus();
}

function openEditModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Ürünü Düzenle';
  document.getElementById('edit-id').value = p.id;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-unit').value = p.unit;
  document.getElementById('p-desc').value = p.desc || '';
  document.getElementById('p-instock').checked = p.inStock;
  document.getElementById('modal').classList.add('open');
  document.getElementById('p-name').focus();
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal')) return;
  document.getElementById('modal').classList.remove('open');
}

function saveProduct() {
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  if (!name) return alert('Ürün adı zorunludur.');
  if (isNaN(price) || price < 0) return alert('Geçerli bir fiyat girin.');

  const data = {
    name,
    category: document.getElementById('p-category').value,
    price,
    unit: document.getElementById('p-unit').value,
    desc: document.getElementById('p-desc').value.trim(),
    inStock: document.getElementById('p-instock').checked,
  };

  const editId = document.getElementById('edit-id').value;
  if (editId) {
    const idx = products.findIndex(x => x.id === editId);
    products[idx] = { ...products[idx], ...data };
  } else {
    products.push({ id: uid(), ...data });
  }

  save();
  renderProducts();
  document.getElementById('modal').classList.remove('open');
}

// ── Delete ─────────────────────────────────────────────
function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('delete-name').textContent = name;
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal(e) {
  if (e && e.target !== document.getElementById('delete-modal')) return;
  document.getElementById('delete-modal').classList.remove('open');
}

function confirmDelete() {
  products = products.filter(p => p.id !== deleteTargetId);
  save();
  renderProducts();
  document.getElementById('delete-modal').classList.remove('open');
}

// ── QR Code ───────────────────────────────────────────
function buildQR() {
  const container = document.getElementById('qr-display');
  container.innerHTML = '';

  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ products, settings }))));
  const base = settings.publicUrl
    ? settings.publicUrl.replace(/\/?$/, '')
    : (window.location.origin + window.location.pathname.replace(/index\.html$/, '') + 'menu.html');
  const menuBase = base.endsWith('menu.html') ? base : base + '/menu.html';
  const url = menuBase + '?d=' + payload;

  document.getElementById('qr-url-text').textContent = menuBase + '?d=<veri>';

  qrInstance = new QRCode(container, {
    text: url,
    width: 220,
    height: 220,
    colorDark: '#1a1a2e',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.L,
  });
}

function downloadQR() {
  const canvas = document.querySelector('#qr-display canvas');
  if (!canvas) return;

  const link = document.createElement('a');
  const shopName = settings.name || 'Tekel-Bayii';
  link.download = shopName.replace(/\s+/g, '-') + '-QR.png';

  // Add white padding + title
  const out = document.createElement('canvas');
  out.width = 280; out.height = 320;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 280, 320);
  ctx.drawImage(canvas, 30, 30, 220, 220);
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.name || 'Erkin Tekel', 140, 278);
  ctx.fillStyle = '#888';
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillText('Menüyü görmek için tarayın', 140, 300);

  link.href = out.toDataURL('image/png');
  link.click();
}

function copyMenuLink() {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ products, settings }))));
  const base = settings.publicUrl
    ? settings.publicUrl.replace(/\/?$/, '')
    : (window.location.origin + window.location.pathname.replace(/index\.html$/, '') + 'menu.html');
  const menuBase = base.endsWith('menu.html') ? base : base + '/menu.html';
  const url = menuBase + '?d=' + payload;
  navigator.clipboard.writeText(url).then(() => {
    const btn = event.currentTarget;
    btn.textContent = '✅ Kopyalandı!';
    setTimeout(() => btn.textContent = '🔗 Linki Kopyala', 2000);
  });
}

// ── Settings ──────────────────────────────────────────
function loadSettings() {
  document.getElementById('set-name').value = settings.name || '';
  document.getElementById('set-address').value = settings.address || '';
  document.getElementById('set-phone').value = settings.phone || '';
  document.getElementById('set-hours').value = settings.hours || '';
  document.getElementById('set-color').value = settings.color || '#1a1a2e';
  document.getElementById('set-url').value = settings.publicUrl || '';
}

function saveSettings() {
  settings = {
    name: document.getElementById('set-name').value,
    address: document.getElementById('set-address').value,
    phone: document.getElementById('set-phone').value,
    hours: document.getElementById('set-hours').value,
    color: document.getElementById('set-color').value,
    publicUrl: document.getElementById('set-url').value.trim(),
  };
  localStorage.setItem('tekel_settings', JSON.stringify(settings));
  const ind = document.getElementById('save-indicator');
  ind.classList.add('show');
  clearTimeout(ind._t);
  ind._t = setTimeout(() => ind.classList.remove('show'), 2000);
}

// ── Helpers ────────────────────────────────────────────
function save() { localStorage.setItem('tekel_products', JSON.stringify(products)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatPrice(n) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₺'; }

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('delete-modal').classList.remove('open');
  }
});
