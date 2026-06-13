/* =====================================================
   BUILDING MAINTENANCE MANAGER
   Vanilla JS · LocalStorage · No dependencies
   ===================================================== */

// ─── STORAGE KEYS ────────────────────────────────────
const KEYS = {
  flats: 'bmm_flats',
  maintenance: 'bmm_maintenance',
  other: 'bmm_other',
  expenses: 'bmm_expenses',
  settings: 'bmm_settings',
  collectionTypes: 'bmm_collection_types',
  expenseTypes: 'bmm_expense_types',
  session: 'bmm_session',
  seeded: 'bmm_seeded'
};

// ─── STORAGE HELPERS ─────────────────────────────────
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ─── ID GENERATOR ────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── DATE HELPERS ────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${day}, ${y}`;
}
function formatMonth(m) {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(mo)-1]} ${y}`;
}
function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

// ─── SEED DATA ────────────────────────────────────────
function seedData() {
  if (load(KEYS.seeded)) return;

  const flats = [
    { id: uid(), number: 'A101', owner: 'Rajesh Kumar', mobile: '9876543210', status: 'active' },
    { id: uid(), number: 'A102', owner: 'Priya Sharma', mobile: '9876543211', status: 'active' },
    { id: uid(), number: 'A103', owner: 'Suresh Patel', mobile: '9876543212', status: 'active' },
    { id: uid(), number: 'B101', owner: 'Anita Verma', mobile: '9876543213', status: 'active' },
    { id: uid(), number: 'B102', owner: 'Mohan Singh', mobile: '9876543214', status: 'active' },
    { id: uid(), number: 'B103', owner: 'Kavita Nair', mobile: '9876543215', status: 'active' },
    { id: uid(), number: 'C101', owner: 'Vijay Reddy', mobile: '9876543216', status: 'active' },
    { id: uid(), number: 'C102', owner: 'Sunita Joshi', mobile: '9876543217', status: 'active' },
    { id: uid(), number: 'C103', owner: 'Ramesh Gupta', mobile: '9876543218', status: 'active' },
    { id: uid(), number: 'D101', owner: 'Meena Das', mobile: '9876543219', status: 'active' },
    { id: uid(), number: 'D102', owner: 'Ashok Malhotra', mobile: '9876543220', status: 'inactive' },
    { id: uid(), number: 'D103', owner: 'Pooja Iyer', mobile: '9876543221', status: 'active' },
  ];
  save(KEYS.flats, flats);

  const activeFlats = flats.filter(f => f.status === 'active');
  const prev = getPrevMonth(currentMonth());
  const maintenance = [];
  activeFlats.forEach(f => {
    maintenance.push({
      id: uid(), flatId: f.id, flatNumber: f.number, flatOwner: f.owner,
      month: prev, amount: 1500, date: '', status: 'pending', notes: ''
    });
  });
  maintenance.slice(0, 7).forEach(m => {
    m.status = 'paid';
    m.date = prev + '-15';
  });
  save(KEYS.maintenance, maintenance);

  const otherCollections = [
    { id: uid(), date: today(), flatId: flats[0].id, flatNumber: flats[0].number, type: 'Painting Fund', amount: 2000, notes: 'Annual painting collection' },
    { id: uid(), date: today(), flatId: flats[1].id, flatNumber: flats[1].number, type: 'Painting Fund', amount: 2000, notes: '' },
    { id: uid(), date: prev + '-10', flatId: flats[2].id, flatNumber: flats[2].number, type: 'Festival Fund', amount: 500, notes: 'Diwali celebration' },
  ];
  save(KEYS.other, otherCollections);

  const expenses = [
    { id: uid(), date: today(), type: 'Electricity', amount: 3200, notes: 'Common area electricity bill' },
    { id: uid(), date: today(), type: 'Maid', amount: 2000, notes: 'Monthly cleaning staff' },
    { id: uid(), date: prev + '-05', type: 'Security', amount: 5000, notes: 'Security guard salary' },
    { id: uid(), date: prev + '-20', type: 'Cleaning', amount: 1500, notes: 'Water tank cleaning' },
  ];
  save(KEYS.expenses, expenses);

  const settings = {
    buildingName: 'G61 Building',
    buildingAddress: '',
    defaultAmount: 1500
  };
  save(KEYS.settings, settings);

  save(KEYS.collectionTypes, ['Painting Fund', 'Road Repair', 'Wire Repair', 'Water Tank', 'Festival Fund', 'Lift Repair', 'Donation', 'Misc']);
  save(KEYS.expenseTypes, ['Electricity', 'Maid', 'Cleaning', 'Security', 'Painting', 'Road Repair', 'Misc']);

  save(KEYS.seeded, true);
}

function getPrevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  if (m === 1) return `${y-1}-12`;
  return `${y}-${String(m-1).padStart(2,'0')}`;
}

// ─── DATA ACCESS ─────────────────────────────────────
function getFlats() { return load(KEYS.flats) || []; }
function getMaintenance() { return load(KEYS.maintenance) || []; }
function getOther() { return load(KEYS.other) || []; }
function getExpenses() { return load(KEYS.expenses) || []; }
function getSettings() { return load(KEYS.settings) || { buildingName: 'G61 Building', buildingAddress: '', defaultAmount: 1500 }; }
function getCollectionTypes() { return load(KEYS.collectionTypes) || ['Misc']; }
function getExpenseTypes() { return load(KEYS.expenseTypes) || ['Misc']; }

// ─── AUTH ─────────────────────────────────────────────
const CREDS = { username: 'admin', password: 'admin123' };

function handleLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  if (u === CREDS.username && p === CREDS.password) {
    save(KEYS.session, { loggedIn: true });
    showApp();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
}

function handleLogout() {
  save(KEYS.session, { loggedIn: false });
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.add('hidden');
  closeMenu();
}

function showApp() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('active');
  updateHeader();
  navigateTo('dashboard');
}

function updateHeader() {
  const s = getSettings();
  const name = s.buildingName || 'Building Manager';
  document.getElementById('headerBuildingName').textContent = name;
  document.getElementById('buildingNameDisplay').textContent = name;
}

// ─── NAVIGATION ───────────────────────────────────────
let currentPage = 'dashboard';

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });

  const el = document.getElementById('page-' + page);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('active');
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  currentPage = page;
  closeMenu();
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'maintenance') renderMaintenance();
  else if (page === 'other') renderOther();
  else if (page === 'expenses') renderExpenses();
  else if (page === 'reports') initReports();
  else if (page === 'flats') renderFlats();
  else if (page === 'settings') renderSettings();
}

// ─── DROPDOWN MENU ────────────────────────────────────
function toggleMenu() {
  const m = document.getElementById('topMenu');
  m.classList.toggle('hidden');
}

function closeMenu() {
  document.getElementById('topMenu').classList.add('hidden');
}

document.addEventListener('click', e => {
  const dropdown = document.getElementById('menuDropdown');
  if (dropdown && !dropdown.contains(e.target)) closeMenu();
});

// ─── TOAST ────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

// ─── MODALS ───────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function closeModalOnOverlay(e, id) {
  if (e.target.id === id) closeModal(id);
}

// ─── CONFIRM DELETE ───────────────────────────────────
function confirmDelete(msg, onConfirm) {
  document.getElementById('confirmMessage').textContent = msg;
  const btn = document.getElementById('confirmBtn');
  btn.onclick = () => { onConfirm(); closeModal('confirmModal'); };
  openModal('confirmModal');
}

// ─── MODULE 1: DASHBOARD ──────────────────────────────
function renderDashboard() {
  const flats = getFlats();
  const maintenance = getMaintenance();
  const other = getOther();
  const expenses = getExpenses();

  const activeFlats = flats.filter(f => f.status === 'active').length;
  const inactiveFlats = flats.filter(f => f.status === 'inactive').length;

  const maintenancePaid = maintenance.filter(m => m.status === 'paid').reduce((s, m) => s + Number(m.amount), 0);
  const maintenancePending = maintenance.filter(m => m.status === 'pending').reduce((s, m) => s + Number(m.amount), 0);
  const otherTotal = other.reduce((s, o) => s + Number(o.amount), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit = maintenancePaid + otherTotal;
  const availableFund = totalCredit - expenseTotal;
  const pendingCount = maintenance.filter(m => m.status === 'pending').length;

  const stats = [
    { label: 'Total Flats', value: flats.length, cls: '' },
    { label: 'Active Flats', value: activeFlats, cls: 'success' },
    { label: 'Inactive Flats', value: inactiveFlats, cls: 'warning' },
    { label: 'Pending Maintenance', value: pendingCount, cls: 'danger' },
    { label: 'Maintenance Collection', value: formatCurrency(maintenancePaid), cls: 'accent' },
    { label: 'Other Collection', value: formatCurrency(otherTotal), cls: 'accent' },
    { label: 'Total Credit', value: formatCurrency(totalCredit), cls: 'success', full: true },
    { label: 'Total Expense', value: formatCurrency(expenseTotal), cls: 'danger', full: true },
    { label: 'Available Fund', value: formatCurrency(availableFund), cls: availableFund >= 0 ? 'success' : 'danger', full: true },
  ];

  document.getElementById('dashboardStats').innerHTML = stats.map(s =>
    `<div class="stat-card${s.full ? ' full-width' : ''}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value ${s.cls}">${s.value}</div>
    </div>`
  ).join('');

  const allCollections = [
    ...maintenance.filter(m => m.status === 'paid').map(m => ({
      title: `Flat ${m.flatNumber} — ${m.flatOwner}`,
      sub: `Maintenance · ${formatMonth(m.month)}`,
      amount: m.amount,
      date: m.date,
      badge: 'badge-success', badgeText: 'Paid'
    })),
    ...other.map(o => ({
      title: `Flat ${o.flatNumber}`,
      sub: o.type,
      amount: o.amount,
      date: o.date,
      badge: 'badge-accent', badgeText: 'Other'
    }))
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);

  document.getElementById('recentCollections').innerHTML = allCollections.length
    ? allCollections.map(c =>
        `<div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">${c.title}</div>
            <div class="list-item-sub">${c.sub} · ${formatDate(c.date)}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount">${formatCurrency(c.amount)}</div>
            <span class="badge ${c.badge}">${c.badgeText}</span>
          </div>
        </div>`
      ).join('')
    : emptyState('No collections yet');

  const recentExp = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  document.getElementById('recentExpenses').innerHTML = recentExp.length
    ? recentExp.map(e =>
        `<div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">${e.type}</div>
            <div class="list-item-sub">${formatDate(e.date)}${e.notes ? ' · ' + e.notes : ''}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount text-danger">${formatCurrency(e.amount)}</div>
          </div>
        </div>`
      ).join('')
    : emptyState('No expenses yet');
}

// ─── MODULE 2: MAINTENANCE ────────────────────────────
function renderMaintenance() {
  const maintenance = getMaintenance();
  const monthFilter = document.getElementById('maintenanceMonthFilter').value;
  const statusFilter = document.getElementById('maintenanceStatusFilter').value;

  const months = [...new Set(maintenance.map(m => m.month))].sort().reverse();
  const mf = document.getElementById('maintenanceMonthFilter');
  const curVal = mf.value;
  mf.innerHTML = '<option value="">All Months</option>' +
    months.map(m => `<option value="${m}" ${m === curVal ? 'selected' : ''}>${formatMonth(m)}</option>`).join('');

  const filtered = maintenance.filter(m =>
    (!monthFilter || m.month === monthFilter) &&
    (!statusFilter || m.status === statusFilter)
  );

  const paid = filtered.filter(m => m.status === 'paid');
  const pending = filtered.filter(m => m.status === 'pending');
  const paidAmt = paid.reduce((s, m) => s + Number(m.amount), 0);

  document.getElementById('maintenanceStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Paid Flats</div>
      <div class="stat-value success">${paid.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Flats</div>
      <div class="stat-value danger">${pending.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Collected</div>
      <div class="stat-value accent">${formatCurrency(paidAmt)}</div>
    </div>`;

  const sorted = [...filtered].sort((a, b) =>
    (b.month + a.status).localeCompare(a.month + b.status)
  );

  document.getElementById('maintenanceList').innerHTML = sorted.length
    ? sorted.map(m => {
        const isPaid = m.status === 'paid';
        return `<div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">Flat ${m.flatNumber} — ${m.flatOwner}</div>
            <div class="list-item-sub">${formatMonth(m.month)}${m.date ? ' · Paid ' + formatDate(m.date) : ''}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount">${formatCurrency(m.amount)}</div>
            <span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">${isPaid ? 'Paid' : 'Pending'}</span>
          </div>
          <div class="list-item-actions">
            ${!isPaid ? `<button class="btn-icon-sm pay" onclick="markMaintenancePaid('${m.id}')">✓ Pay</button>` : ''}
            <button class="btn-icon-sm edit" onclick="openMaintenanceModal('${m.id}')">✎</button>
          </div>
        </div>`;
      }).join('')
    : emptyState('No maintenance records', 'Generate records for a month using the + Generate button');
}

function openCreateMonthModal() {
  const s = getSettings();
  document.getElementById('generateMonth').value = currentMonth();
  document.getElementById('generateAmount').value = s.defaultAmount || 1500;
  document.getElementById('generateWarning').classList.add('hidden');
  openModal('createMonthModal');
}

function generateMonthlyRecords() {
  const month = document.getElementById('generateMonth').value;
  const amount = Number(document.getElementById('generateAmount').value);

  if (!month) { showToast('Please select a month', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

  const maintenance = getMaintenance();
  const flats = getFlats().filter(f => f.status === 'active');

  const existing = maintenance.filter(m => m.month === month);
  if (existing.length > 0) {
    document.getElementById('generateWarning').textContent = `Records for ${formatMonth(month)} already exist (${existing.length} records). This will only add records for new active flats.`;
    document.getElementById('generateWarning').classList.remove('hidden');
  }

  const existingFlatIds = existing.map(m => m.flatId);
  const newFlats = flats.filter(f => !existingFlatIds.includes(f.id));

  if (newFlats.length === 0) {
    showToast('All active flats already have records for this month', 'error');
    return;
  }

  const newRecords = newFlats.map(f => ({
    id: uid(), flatId: f.id, flatNumber: f.number, flatOwner: f.owner,
    month, amount, date: '', status: 'pending', notes: ''
  }));

  save(KEYS.maintenance, [...maintenance, ...newRecords]);
  closeModal('createMonthModal');
  showToast(`Generated ${newRecords.length} maintenance records for ${formatMonth(month)}`, 'success');
  renderMaintenance();
}

function markMaintenancePaid(id) {
  const maintenance = getMaintenance();
  const rec = maintenance.find(m => m.id === id);
  if (!rec) return;
  rec.status = 'paid';
  rec.date = today();
  save(KEYS.maintenance, maintenance);
  showToast('Marked as Paid', 'success');
  renderMaintenance();
  if (currentPage === 'dashboard') renderDashboard();
}

function openMaintenanceModal(id) {
  const m = getMaintenance().find(x => x.id === id);
  if (!m) return;
  document.getElementById('maintenanceEditId').value = id;
  document.getElementById('maintenanceFlatDisplay').value = `Flat ${m.flatNumber} — ${m.flatOwner}`;
  document.getElementById('maintenanceMonthDisplay').value = formatMonth(m.month);
  document.getElementById('maintenanceAmount').value = m.amount;
  document.getElementById('maintenanceDate').value = m.date || today();
  document.getElementById('maintenanceStatus').value = m.status;
  document.getElementById('maintenanceNotes').value = m.notes || '';
  openModal('maintenanceModal');
}

function saveMaintenance() {
  const id = document.getElementById('maintenanceEditId').value;
  const amount = Number(document.getElementById('maintenanceAmount').value);
  const date = document.getElementById('maintenanceDate').value;
  const status = document.getElementById('maintenanceStatus').value;
  const notes = document.getElementById('maintenanceNotes').value.trim();

  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

  const maintenance = getMaintenance();
  const idx = maintenance.findIndex(m => m.id === id);
  if (idx === -1) return;
  maintenance[idx] = { ...maintenance[idx], amount, date, status, notes };
  save(KEYS.maintenance, maintenance);
  closeModal('maintenanceModal');
  showToast('Maintenance record updated', 'success');
  renderMaintenance();
  if (currentPage === 'dashboard') renderDashboard();
}

// ─── MODULE 3: OTHER COLLECTIONS ──────────────────────
function renderOther() {
  const other = getOther();
  const typeFilter = document.getElementById('otherTypeFilter').value;
  const flatFilter = document.getElementById('otherFlatFilter').value;

  const types = [...new Set(other.map(o => o.type))].sort();
  const tf = document.getElementById('otherTypeFilter');
  const tfVal = tf.value;
  tf.innerHTML = '<option value="">All Types</option>' +
    types.map(t => `<option value="${t}" ${t === tfVal ? 'selected' : ''}>${t}</option>`).join('');

  const flats = getFlats();
  const ff = document.getElementById('otherFlatFilter');
  const ffVal = ff.value;
  ff.innerHTML = '<option value="">All Flats</option>' +
    flats.map(f => `<option value="${f.id}" ${f.id === ffVal ? 'selected' : ''}>Flat ${f.number}</option>`).join('');

  const filtered = other.filter(o =>
    (!typeFilter || o.type === typeFilter) &&
    (!flatFilter || o.flatId === flatFilter)
  ).sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById('otherList').innerHTML = filtered.length
    ? filtered.map(o =>
        `<div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">Flat ${o.flatNumber} — ${o.type}</div>
            <div class="list-item-sub">${formatDate(o.date)}${o.notes ? ' · ' + o.notes : ''}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount">${formatCurrency(o.amount)}</div>
          </div>
          <div class="list-item-actions">
            <button class="btn-icon-sm edit" onclick="openOtherModal('${o.id}')">✎</button>
            <button class="btn-icon-sm del" onclick="deleteOther('${o.id}')">✕</button>
          </div>
        </div>`
      ).join('')
    : emptyState('No collections yet', 'Add other collections using the + Add button');
}

function openOtherModal(id) {
  const types = getCollectionTypes();
  const flats = getFlats();
  const typeSelect = document.getElementById('otherType');
  const flatSelect = document.getElementById('otherFlat');

  typeSelect.innerHTML = '<option value="">Select type</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');
  flatSelect.innerHTML = '<option value="">Select flat</option>' +
    flats.map(f => `<option value="${f.id}">Flat ${f.number} — ${f.owner}</option>`).join('');

  if (id) {
    const o = getOther().find(x => x.id === id);
    if (!o) return;
    document.getElementById('otherModalTitle').textContent = 'Edit Collection';
    document.getElementById('otherEditId').value = id;
    document.getElementById('otherDate').value = o.date;
    document.getElementById('otherFlat').value = o.flatId;
    document.getElementById('otherType').value = o.type;
    document.getElementById('otherAmount').value = o.amount;
    document.getElementById('otherNotes').value = o.notes || '';
  } else {
    document.getElementById('otherModalTitle').textContent = 'Add Collection';
    document.getElementById('otherEditId').value = '';
    document.getElementById('otherDate').value = today();
    document.getElementById('otherFlat').value = '';
    document.getElementById('otherType').value = '';
    document.getElementById('otherAmount').value = '';
    document.getElementById('otherNotes').value = '';
  }
  openModal('otherModal');
}

function saveOther() {
  const id = document.getElementById('otherEditId').value;
  const date = document.getElementById('otherDate').value;
  const flatId = document.getElementById('otherFlat').value;
  const type = document.getElementById('otherType').value;
  const amount = Number(document.getElementById('otherAmount').value);
  const notes = document.getElementById('otherNotes').value.trim();

  if (!date) { showToast('Please select a date', 'error'); return; }
  if (!flatId) { showToast('Please select a flat', 'error'); return; }
  if (!type) { showToast('Please select a collection type', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

  const flat = getFlats().find(f => f.id === flatId);
  const flatNumber = flat ? flat.number : '';

  const other = getOther();
  if (id) {
    const idx = other.findIndex(o => o.id === id);
    if (idx !== -1) other[idx] = { ...other[idx], date, flatId, flatNumber, type, amount, notes };
  } else {
    other.push({ id: uid(), date, flatId, flatNumber, type, amount, notes });
  }
  save(KEYS.other, other);
  closeModal('otherModal');
  showToast(id ? 'Collection updated' : 'Collection added', 'success');
  renderOther();
  if (currentPage === 'dashboard') renderDashboard();
}

function deleteOther(id) {
  confirmDelete('Delete this collection entry?', () => {
    save(KEYS.other, getOther().filter(o => o.id !== id));
    showToast('Collection deleted', 'success');
    renderOther();
    if (currentPage === 'dashboard') renderDashboard();
  });
}

// ─── MODULE 4: EXPENSES ───────────────────────────────
function renderExpenses() {
  const expenses = getExpenses();
  const typeFilter = document.getElementById('expenseTypeFilter').value;

  const types = [...new Set(expenses.map(e => e.type))].sort();
  const tf = document.getElementById('expenseTypeFilter');
  const tfVal = tf.value;
  tf.innerHTML = '<option value="">All Types</option>' +
    types.map(t => `<option value="${t}" ${t === tfVal ? 'selected' : ''}>${t}</option>`).join('');

  const filtered = expenses.filter(e => !typeFilter || e.type === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById('expenseList').innerHTML = filtered.length
    ? filtered.map(e =>
        `<div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">${e.type}</div>
            <div class="list-item-sub">${formatDate(e.date)}${e.notes ? ' · ' + e.notes : ''}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount text-danger">${formatCurrency(e.amount)}</div>
          </div>
          <div class="list-item-actions">
            <button class="btn-icon-sm edit" onclick="openExpenseModal('${e.id}')">✎</button>
            <button class="btn-icon-sm del" onclick="deleteExpense('${e.id}')">✕</button>
          </div>
        </div>`
      ).join('')
    : emptyState('No expenses yet', 'Add expenses using the + Add button');
}

function openExpenseModal(id) {
  const types = getExpenseTypes();
  const typeSelect = document.getElementById('expenseType');
  typeSelect.innerHTML = '<option value="">Select type</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');

  if (id) {
    const e = getExpenses().find(x => x.id === id);
    if (!e) return;
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    document.getElementById('expenseEditId').value = id;
    document.getElementById('expenseDate').value = e.date;
    document.getElementById('expenseType').value = e.type;
    document.getElementById('expenseAmount').value = e.amount;
    document.getElementById('expenseNotes').value = e.notes || '';
  } else {
    document.getElementById('expenseModalTitle').textContent = 'Add Expense';
    document.getElementById('expenseEditId').value = '';
    document.getElementById('expenseDate').value = today();
    document.getElementById('expenseType').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseNotes').value = '';
  }
  openModal('expenseModal');
}

function saveExpense() {
  const id = document.getElementById('expenseEditId').value;
  const date = document.getElementById('expenseDate').value;
  const type = document.getElementById('expenseType').value;
  const amount = Number(document.getElementById('expenseAmount').value);
  const notes = document.getElementById('expenseNotes').value.trim();

  if (!date) { showToast('Please select a date', 'error'); return; }
  if (!type) { showToast('Please select an expense type', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

  const expenses = getExpenses();
  if (id) {
    const idx = expenses.findIndex(e => e.id === id);
    if (idx !== -1) expenses[idx] = { ...expenses[idx], date, type, amount, notes };
  } else {
    expenses.push({ id: uid(), date, type, amount, notes });
  }
  save(KEYS.expenses, expenses);
  closeModal('expenseModal');
  showToast(id ? 'Expense updated' : 'Expense added', 'success');
  renderExpenses();
  if (currentPage === 'dashboard') renderDashboard();
}

function deleteExpense(id) {
  confirmDelete('Delete this expense?', () => {
    save(KEYS.expenses, getExpenses().filter(e => e.id !== id));
    showToast('Expense deleted', 'success');
    renderExpenses();
    if (currentPage === 'dashboard') renderDashboard();
  });
}

// ─── MODULE 5: FLATS ──────────────────────────────────
function renderFlats() {
  const q = (document.getElementById('flatSearch').value || '').toLowerCase();
  const flats = getFlats().filter(f =>
    !q || f.number.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q)
  );

  document.getElementById('flatList').innerHTML = flats.length
    ? flats.map(f => {
        const isActive = f.status === 'active';
        return `<div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">Flat ${f.number} — ${f.owner}</div>
            <div class="list-item-sub">${f.mobile || 'No mobile'}${isActive ? '' : ' · Inactive'}</div>
          </div>
          <div class="list-item-right">
            <span class="badge ${isActive ? 'badge-success' : 'badge-muted'}">${isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn-icon-sm edit" onclick="openFlatModal('${f.id}')">✎</button>
            <button class="btn-icon-sm del" onclick="deleteFlat('${f.id}')">✕</button>
          </div>
        </div>`;
      }).join('')
    : emptyState('No flats found', 'Add flats using the + Add button');
}

function openFlatModal(id) {
  if (id) {
    const f = getFlats().find(x => x.id === id);
    if (!f) return;
    document.getElementById('flatModalTitle').textContent = 'Edit Flat';
    document.getElementById('flatEditId').value = id;
    document.getElementById('flatNumber').value = f.number;
    document.getElementById('flatOwner').value = f.owner;
    document.getElementById('flatMobile').value = f.mobile || '';
    document.getElementById('flatStatus').value = f.status;
  } else {
    document.getElementById('flatModalTitle').textContent = 'Add Flat';
    document.getElementById('flatEditId').value = '';
    document.getElementById('flatNumber').value = '';
    document.getElementById('flatOwner').value = '';
    document.getElementById('flatMobile').value = '';
    document.getElementById('flatStatus').value = 'active';
  }
  openModal('flatModal');
}

function saveFlat() {
  const id = document.getElementById('flatEditId').value;
  const number = document.getElementById('flatNumber').value.trim();
  const owner = document.getElementById('flatOwner').value.trim();
  const mobile = document.getElementById('flatMobile').value.trim();
  const status = document.getElementById('flatStatus').value;

  if (!number) { showToast('Please enter flat number', 'error'); return; }
  if (!owner) { showToast('Please enter owner name', 'error'); return; }

  const flats = getFlats();
  const duplicate = flats.find(f => f.number.toLowerCase() === number.toLowerCase() && f.id !== id);
  if (duplicate) { showToast('Flat number already exists', 'error'); return; }

  if (id) {
    const idx = flats.findIndex(f => f.id === id);
    if (idx !== -1) {
      flats[idx] = { ...flats[idx], number, owner, mobile, status };
      const maintenance = getMaintenance();
      maintenance.forEach(m => {
        if (m.flatId === id) { m.flatNumber = number; m.flatOwner = owner; }
      });
      save(KEYS.maintenance, maintenance);
      const other = getOther();
      other.forEach(o => { if (o.flatId === id) o.flatNumber = number; });
      save(KEYS.other, other);
    }
  } else {
    if (flats.length >= 12) { showToast('Maximum 12 flats allowed', 'error'); return; }
    flats.push({ id: uid(), number, owner, mobile, status });
  }

  save(KEYS.flats, flats);
  closeModal('flatModal');
  showToast(id ? 'Flat updated' : 'Flat added', 'success');
  renderFlats();
  if (currentPage === 'dashboard') renderDashboard();
}

function deleteFlat(id) {
  confirmDelete('Delete this flat? This will NOT delete associated maintenance or collection records.', () => {
    save(KEYS.flats, getFlats().filter(f => f.id !== id));
    showToast('Flat deleted', 'success');
    renderFlats();
    if (currentPage === 'dashboard') renderDashboard();
  });
}

// ─── MODULE 6: SETTINGS ───────────────────────────────
function renderSettings() {
  const s = getSettings();
  document.getElementById('settingBuildingName').value = s.buildingName || '';
  document.getElementById('settingBuildingAddress').value = s.buildingAddress || '';
  document.getElementById('settingDefaultAmount').value = s.defaultAmount || 1500;
  renderCollectionTypes();
  renderExpenseTypes();
}

function saveSettings() {
  const buildingName = document.getElementById('settingBuildingName').value.trim();
  const buildingAddress = document.getElementById('settingBuildingAddress').value.trim();
  const defaultAmount = Number(document.getElementById('settingDefaultAmount').value) || 1500;
  save(KEYS.settings, { buildingName, buildingAddress, defaultAmount });
  updateHeader();
  showToast('Settings saved', 'success');
}

function renderCollectionTypes() {
  const types = getCollectionTypes();
  document.getElementById('collectionTypesList').innerHTML = types.map(t =>
    `<span class="tag">${t}<button class="tag-del" onclick="removeCollectionType('${t}')">✕</button></span>`
  ).join('') || '<span class="text-muted" style="font-size:0.85rem">No types added</span>';
}

function addCollectionType() {
  const input = document.getElementById('newCollectionType');
  const val = input.value.trim();
  if (!val) return;
  const types = getCollectionTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  types.push(val);
  save(KEYS.collectionTypes, types);
  input.value = '';
  renderCollectionTypes();
  showToast('Collection type added', 'success');
}

function removeCollectionType(type) {
  const types = getCollectionTypes().filter(t => t !== type);
  save(KEYS.collectionTypes, types);
  renderCollectionTypes();
}

function renderExpenseTypes() {
  const types = getExpenseTypes();
  document.getElementById('expenseTypesList').innerHTML = types.map(t =>
    `<span class="tag">${t}<button class="tag-del" onclick="removeExpenseType('${t}')">✕</button></span>`
  ).join('') || '<span class="text-muted" style="font-size:0.85rem">No types added</span>';
}

function addExpenseType() {
  const input = document.getElementById('newExpenseType');
  const val = input.value.trim();
  if (!val) return;
  const types = getExpenseTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  types.push(val);
  save(KEYS.expenseTypes, types);
  input.value = '';
  renderExpenseTypes();
  showToast('Expense type added', 'success');
}

function removeExpenseType(type) {
  const types = getExpenseTypes().filter(t => t !== type);
  save(KEYS.expenseTypes, types);
  renderExpenseTypes();
}

// ─── QUICK ADD TYPE (inline in modals) ────────────────
function toggleQuickType(panelId) {
  const panel = document.getElementById(panelId);
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const inp = panel.querySelector('input');
    if (inp) { inp.value = ''; inp.focus(); }
  }
}

function quickAddCollectionType() {
  const input = document.getElementById('quickCollectionTypeInput');
  const val = input.value.trim();
  if (!val) return;
  const types = getCollectionTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  types.push(val);
  save(KEYS.collectionTypes, types);
  const sel = document.getElementById('otherType');
  sel.innerHTML = '<option value="">Select type</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');
  sel.value = val;
  document.getElementById('collectionQuickAdd').classList.add('hidden');
  input.value = '';
  showToast(`"${val}" added`, 'success');
}

function quickAddExpenseType() {
  const input = document.getElementById('quickExpenseTypeInput');
  const val = input.value.trim();
  if (!val) return;
  const types = getExpenseTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  types.push(val);
  save(KEYS.expenseTypes, types);
  const sel = document.getElementById('expenseType');
  sel.innerHTML = '<option value="">Select type</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');
  sel.value = val;
  document.getElementById('expenseQuickAdd').classList.add('hidden');
  input.value = '';
  showToast(`"${val}" added`, 'success');
}

// ─── MODULE 7: REPORTS ────────────────────────────────
let reportFilter = 'monthly';
let reportData = null;

function initReports() {
  setReportFilter('monthly');
}

function setReportFilter(type) {
  reportFilter = type;
  document.getElementById('filterMonthly').classList.toggle('active-filter', type === 'monthly');
  document.getElementById('filterYearly').classList.toggle('active-filter', type === 'yearly');
  document.getElementById('filterCustom').classList.toggle('active-filter', type === 'custom');

  const inputs = document.getElementById('reportFilterInputs');
  if (type === 'monthly') {
    inputs.innerHTML = `<input type="month" id="reportMonth" value="${currentMonth()}" />`;
  } else if (type === 'yearly') {
    const yr = new Date().getFullYear();
    inputs.innerHTML = `<select id="reportYear">
      ${[yr, yr-1, yr-2].map(y => `<option value="${y}">${y}</option>`).join('')}
    </select>`;
  } else {
    inputs.innerHTML = `
      <input type="date" id="reportFrom" value="${currentMonth() + '-01'}" />
      <input type="date" id="reportTo" value="${today()}" />
    `;
  }
}

function getReportDateRange() {
  if (reportFilter === 'monthly') {
    const m = document.getElementById('reportMonth')?.value || currentMonth();
    return { from: m + '-01', to: m + '-31', label: formatMonth(m) };
  } else if (reportFilter === 'yearly') {
    const y = document.getElementById('reportYear')?.value || new Date().getFullYear();
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: `Year ${y}` };
  } else {
    const from = document.getElementById('reportFrom')?.value || '';
    const to = document.getElementById('reportTo')?.value || '';
    return { from, to, label: `${formatDate(from)} – ${formatDate(to)}` };
  }
}

function inRange(date, from, to) {
  if (!date) return false;
  return date >= from && date <= to;
}

function generateReport() {
  const { from, to, label } = getReportDateRange();
  if (!from || !to) { showToast('Please set a date range', 'error'); return; }

  const maintenance = getMaintenance();
  const other = getOther();
  const expenses = getExpenses();

  const filteredMaint = maintenance.filter(m => {
    const d = m.date || (m.month + '-01');
    return d >= from && d <= to;
  });
  const filteredOther = other.filter(o => inRange(o.date, from, to));
  const filteredExpenses = expenses.filter(e => inRange(e.date, from, to));
  const pendingMaint = maintenance.filter(m => {
    const d = m.month + '-01';
    return m.status === 'pending' && d >= from && d <= to;
  });

  const maintenancePaid = filteredMaint.filter(m => m.status === 'paid').reduce((s, m) => s + Number(m.amount), 0);
  const otherTotal = filteredOther.reduce((s, o) => s + Number(o.amount), 0);
  const expenseTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit = maintenancePaid + otherTotal;
  const availableFund = totalCredit - expenseTotal;
  const pendingAmount = pendingMaint.reduce((s, m) => s + Number(m.amount), 0);

  reportData = { label, filteredMaint, filteredOther, filteredExpenses, pendingMaint, maintenancePaid, otherTotal, expenseTotal, totalCredit, availableFund, pendingAmount };

  const html = `
    <div id="printArea">
      <div class="section-card">
        <div class="section-title">Summary — ${label}</div>
        <div class="report-summary">
          <div class="stat-card"><div class="stat-label">Maintenance</div><div class="stat-value accent">${formatCurrency(maintenancePaid)}</div></div>
          <div class="stat-card"><div class="stat-label">Other Collection</div><div class="stat-value accent">${formatCurrency(otherTotal)}</div></div>
          <div class="stat-card"><div class="stat-label">Total Credit</div><div class="stat-value success">${formatCurrency(totalCredit)}</div></div>
          <div class="stat-card"><div class="stat-label">Total Expense</div><div class="stat-value danger">${formatCurrency(expenseTotal)}</div></div>
          <div class="stat-card"><div class="stat-label">Available Fund</div><div class="stat-value ${availableFund >= 0 ? 'success' : 'danger'}">${formatCurrency(availableFund)}</div></div>
          <div class="stat-card"><div class="stat-label">Pending Amount</div><div class="stat-value warning">${formatCurrency(pendingAmount)}</div></div>
        </div>
      </div>

      <div class="section-card report-section">
        <div class="report-section-title">Maintenance Collection (${filteredMaint.filter(m => m.status === 'paid').length} records)</div>
        ${filteredMaint.filter(m => m.status === 'paid').length ? `
        <table class="report-table">
          <thead><tr><th>Flat</th><th>Month</th><th>Date</th><th>Amount</th></tr></thead>
          <tbody>${filteredMaint.filter(m => m.status === 'paid').map(m => `
            <tr><td>Flat ${m.flatNumber}<br><small class="text-muted">${m.flatOwner}</small></td>
            <td>${formatMonth(m.month)}</td><td>${formatDate(m.date)}</td>
            <td><b>${formatCurrency(m.amount)}</b></td></tr>`).join('')}
          </tbody>
        </table>` : '<p class="text-muted" style="font-size:0.875rem;padding:8px 0">No maintenance collected in this period</p>'}
      </div>

      <div class="section-card report-section">
        <div class="report-section-title">Other Collections (${filteredOther.length} records)</div>
        ${filteredOther.length ? `
        <table class="report-table">
          <thead><tr><th>Date</th><th>Flat</th><th>Type</th><th>Amount</th></tr></thead>
          <tbody>${filteredOther.map(o => `
            <tr><td>${formatDate(o.date)}</td><td>Flat ${o.flatNumber}</td>
            <td>${o.type}</td><td><b>${formatCurrency(o.amount)}</b></td></tr>`).join('')}
          </tbody>
        </table>` : '<p class="text-muted" style="font-size:0.875rem;padding:8px 0">No other collections in this period</p>'}
      </div>

      <div class="section-card report-section">
        <div class="report-section-title">Expenses (${filteredExpenses.length} records)</div>
        ${filteredExpenses.length ? `
        <table class="report-table">
          <thead><tr><th>Date</th><th>Type</th><th>Notes</th><th>Amount</th></tr></thead>
          <tbody>${filteredExpenses.map(e => `
            <tr><td>${formatDate(e.date)}</td><td>${e.type}</td>
            <td class="text-muted">${e.notes || '—'}</td>
            <td><b class="text-danger">${formatCurrency(e.amount)}</b></td></tr>`).join('')}
          </tbody>
        </table>` : '<p class="text-muted" style="font-size:0.875rem;padding:8px 0">No expenses in this period</p>'}
      </div>

      <div class="section-card report-section">
        <div class="report-section-title">Pending Maintenance (${pendingMaint.length} records)</div>
        ${pendingMaint.length ? `
        <table class="report-table">
          <thead><tr><th>Flat</th><th>Month</th><th>Amount</th></tr></thead>
          <tbody>${pendingMaint.map(m => `
            <tr><td>Flat ${m.flatNumber}<br><small class="text-muted">${m.flatOwner}</small></td>
            <td>${formatMonth(m.month)}</td>
            <td><b class="text-warning">${formatCurrency(m.amount)}</b></td></tr>`).join('')}
          </tbody>
        </table>` : '<p class="text-muted" style="font-size:0.875rem;padding:8px 0">No pending maintenance in this period</p>'}
      </div>
    </div>
  `;

  document.getElementById('reportResult').innerHTML = html;
  document.getElementById('reportActions').classList.remove('hidden');
}

function printReport() {
  window.print();
}

function exportCSV() {
  if (!reportData) { showToast('Please generate a report first', 'error'); return; }
  const { label, filteredMaint, filteredOther, filteredExpenses, pendingMaint } = reportData;
  const rows = [
    ['Building Maintenance Report - ' + label],
    [],
    ['=== MAINTENANCE COLLECTION ==='],
    ['Flat No', 'Owner', 'Month', 'Date', 'Amount', 'Status'],
    ...filteredMaint.filter(m => m.status === 'paid').map(m => [
      `Flat ${m.flatNumber}`, m.flatOwner, formatMonth(m.month), m.date, m.amount, 'Paid'
    ]),
    [],
    ['=== OTHER COLLECTIONS ==='],
    ['Date', 'Flat', 'Type', 'Amount', 'Notes'],
    ...filteredOther.map(o => [o.date, `Flat ${o.flatNumber}`, o.type, o.amount, o.notes || '']),
    [],
    ['=== EXPENSES ==='],
    ['Date', 'Type', 'Amount', 'Notes'],
    ...filteredExpenses.map(e => [e.date, e.type, e.amount, e.notes || '']),
    [],
    ['=== PENDING MAINTENANCE ==='],
    ['Flat No', 'Owner', 'Month', 'Amount'],
    ...pendingMaint.map(m => [`Flat ${m.flatNumber}`, m.flatOwner, formatMonth(m.month), m.amount]),
    [],
    ['=== SUMMARY ==='],
    ['Maintenance Collected', reportData.maintenancePaid],
    ['Other Collections', reportData.otherTotal],
    ['Total Credit', reportData.totalCredit],
    ['Total Expenses', reportData.expenseTotal],
    ['Available Fund', reportData.availableFund],
    ['Pending Amount', reportData.pendingAmount],
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-report-${label.replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported', 'success');
}

// ─── EMPTY STATE ──────────────────────────────────────
function emptyState(title, sub = '') {
  return `<div class="empty-state">
    <span class="empty-state-icon">📭</span>
    <div class="empty-state-title">${title}</div>
    ${sub ? `<div class="empty-state-sub">${sub}</div>` : ''}
  </div>`;
}

// ─── PWA ─────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  seedData();

  // Migrate old default building name
  const storedSettings = load(KEYS.settings);
  if (storedSettings && storedSettings.buildingName === 'Sunrise Apartments') {
    storedSettings.buildingName = 'G61 Building';
    storedSettings.buildingAddress = storedSettings.buildingAddress || '';
    save(KEYS.settings, storedSettings);
  }

  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginUsername').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPassword').focus();
  });

  const session = load(KEYS.session);
  if (session && session.loggedIn) {
    showApp();
  }
});
