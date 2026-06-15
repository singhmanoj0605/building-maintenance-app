/* =====================================================
   BUILDING MAINTENANCE MANAGER
   Firebase Firestore · Real-time · Vanilla JS
   ===================================================== */

// ─── SESSION (localStorage only — login state) ────────
const SESSION_KEY = 'bmm_session';
function getSession()    { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
function saveSession(v)  { localStorage.setItem(SESSION_KEY, JSON.stringify(v)); }

// ─── IN-MEMORY CACHE (populated by Firestore listeners) ──
const DB = {
  flats:           [],
  maintenance:     [],
  other:           [],
  expenses:        [],
  settings:        { buildingName: 'G61 Building', buildingAddress: '', defaultAmount: 1500 },
  collectionTypes: [],
  expenseTypes:    [],
  _loaded: { flats: false, maintenance: false, other: false, expenses: false, settings: false, collectionTypes: false, expenseTypes: false },
  _seededChecked:  false,
  _pendingShow:    false
};

function isAllLoaded() {
  return Object.values(DB._loaded).every(Boolean);
}

// ─── READ HELPERS (from in-memory cache) ─────────────
function getFlats()           { return DB.flats; }
function getMaintenance()     { return DB.maintenance; }
function getOther()           { return DB.other; }
function getExpenses()        { return DB.expenses; }
function getSettings()        { return DB.settings || { buildingName: 'G61 Building', buildingAddress: '', defaultAmount: 1500 }; }
function getCollectionTypes() { return DB.collectionTypes.length ? DB.collectionTypes : ['Misc']; }
function getExpenseTypes()    { return DB.expenseTypes.length ? DB.expenseTypes : ['Misc']; }

// ─── ID / DATE HELPERS ────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function today() { return new Date().toISOString().slice(0, 10); }
function currentMonth() { return new Date().toISOString().slice(0, 7); }
function getPrevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`;
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
function formatCurrency(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

// ─── FIRESTORE SEED ───────────────────────────────────
async function checkAndSeed() {
  try {
    const meta = await db.collection('config').doc('meta').get();
    if (meta.exists) return;

    const prev = getPrevMonth(currentMonth());
    const batch = db.batch();

    // Flats
    const flatSeeds = [
      { number: 'A101', owner: 'Rajesh Kumar',   mobile: '9876543210', status: 'active' },
      { number: 'A102', owner: 'Priya Sharma',   mobile: '9876543211', status: 'active' },
      { number: 'A103', owner: 'Suresh Patel',   mobile: '9876543212', status: 'active' },
      { number: 'B101', owner: 'Anita Verma',    mobile: '9876543213', status: 'active' },
      { number: 'B102', owner: 'Mohan Singh',    mobile: '9876543214', status: 'active' },
      { number: 'B103', owner: 'Kavita Nair',    mobile: '9876543215', status: 'active' },
      { number: 'C101', owner: 'Vijay Reddy',    mobile: '9876543216', status: 'active' },
      { number: 'C102', owner: 'Sunita Joshi',   mobile: '9876543217', status: 'active' },
      { number: 'C103', owner: 'Ramesh Gupta',   mobile: '9876543218', status: 'active' },
      { number: 'D101', owner: 'Meena Das',      mobile: '9876543219', status: 'active' },
      { number: 'D102', owner: 'Ashok Malhotra', mobile: '9876543220', status: 'inactive' },
      { number: 'D103', owner: 'Pooja Iyer',     mobile: '9876543221', status: 'active' },
    ];

    const flatRefs = flatSeeds.map(f => {
      const ref = db.collection('flats').doc(uid());
      batch.set(ref, f);
      return { ref, data: f };
    });

    // Maintenance (active flats only)
    const activeFlats = flatRefs.filter(f => f.data.status === 'active');
    activeFlats.forEach((f, i) => {
      const mRef = db.collection('maintenance').doc(uid());
      batch.set(mRef, {
        flatId: f.ref.id, flatNumber: f.data.number, flatOwner: f.data.owner,
        month: prev, amount: 1500, date: i < 7 ? prev + '-15' : '',
        status: i < 7 ? 'paid' : 'pending', notes: ''
      });
    });

    // Other collections
    batch.set(db.collection('otherCollections').doc(uid()), {
      date: today(), flatId: flatRefs[0].ref.id, flatNumber: flatRefs[0].data.number,
      type: 'Painting Fund', amount: 2000, notes: 'Annual painting collection'
    });
    batch.set(db.collection('otherCollections').doc(uid()), {
      date: today(), flatId: flatRefs[1].ref.id, flatNumber: flatRefs[1].data.number,
      type: 'Painting Fund', amount: 2000, notes: ''
    });
    batch.set(db.collection('otherCollections').doc(uid()), {
      date: prev + '-10', flatId: flatRefs[2].ref.id, flatNumber: flatRefs[2].data.number,
      type: 'Festival Fund', amount: 500, notes: 'Diwali celebration'
    });

    // Expenses
    batch.set(db.collection('expenses').doc(uid()), { date: today(), type: 'Electricity', amount: 3200, notes: 'Common area electricity bill' });
    batch.set(db.collection('expenses').doc(uid()), { date: today(), type: 'Maid',        amount: 2000, notes: 'Monthly cleaning staff' });
    batch.set(db.collection('expenses').doc(uid()), { date: prev + '-05', type: 'Security', amount: 5000, notes: 'Security guard salary' });
    batch.set(db.collection('expenses').doc(uid()), { date: prev + '-20', type: 'Cleaning', amount: 1500, notes: 'Water tank cleaning' });

    // Config
    batch.set(db.collection('config').doc('settings'), { buildingName: 'G61 Building', buildingAddress: '', defaultAmount: 1500 });
    batch.set(db.collection('config').doc('collectionTypes'), { types: ['Painting Fund', 'Road Repair', 'Wire Repair', 'Water Tank', 'Festival Fund', 'Lift Repair', 'Donation', 'Misc'] });
    batch.set(db.collection('config').doc('expenseTypes'),    { types: ['Electricity', 'Maid', 'Cleaning', 'Security', 'Painting', 'Road Repair', 'Misc'] });
    batch.set(db.collection('config').doc('meta'),            { seeded: true, seededAt: new Date().toISOString() });

    await batch.commit();
  } catch (err) {
    console.error('Seed error:', err);
  }
}

// ─── FIRESTORE LISTENERS ──────────────────────────────
let _listenersStarted = false;

function setupListeners() {
  if (_listenersStarted) return;
  _listenersStarted = true;

  db.collection('flats').onSnapshot(snap => {
    DB.flats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    DB.flats.sort((a, b) => a.number.localeCompare(b.number));
    DB._loaded.flats = true;
    onSnapshotUpdate();
  }, err => console.error('flats listener:', err));

  db.collection('maintenance').onSnapshot(snap => {
    DB.maintenance = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    DB._loaded.maintenance = true;
    onSnapshotUpdate();
  }, err => console.error('maintenance listener:', err));

  db.collection('otherCollections').onSnapshot(snap => {
    DB.other = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    DB._loaded.other = true;
    onSnapshotUpdate();
  }, err => console.error('other listener:', err));

  db.collection('expenses').onSnapshot(snap => {
    DB.expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    DB._loaded.expenses = true;
    onSnapshotUpdate();
  }, err => console.error('expenses listener:', err));

  db.collection('config').doc('settings').onSnapshot(snap => {
    if (snap.exists) DB.settings = snap.data();
    DB._loaded.settings = true;
    updateHeaderIfVisible();
    onSnapshotUpdate();
  }, err => console.error('settings listener:', err));

  db.collection('config').doc('collectionTypes').onSnapshot(snap => {
    if (snap.exists) DB.collectionTypes = snap.data().types || [];
    DB._loaded.collectionTypes = true;
    onSnapshotUpdate();
  }, err => console.error('collectionTypes listener:', err));

  db.collection('config').doc('expenseTypes').onSnapshot(snap => {
    if (snap.exists) DB.expenseTypes = snap.data().types || [];
    DB._loaded.expenseTypes = true;
    onSnapshotUpdate();
  }, err => console.error('expenseTypes listener:', err));
}

async function onSnapshotUpdate() {
  if (!isAllLoaded()) return;

  if (!DB._seededChecked) {
    DB._seededChecked = true;
    await checkAndSeed();
  }

  hideLoadingOverlay();

  if (DB._pendingShow) {
    DB._pendingShow = false;
    doShowApp();
    return;
  }

  // Live update — re-render current page if app is visible
  const appVisible = document.getElementById('appScreen').classList.contains('active');
  if (appVisible) {
    renderPage(currentPage);
    updateHeaderIfVisible();
  }

  // Update building name on login screen too
  updateLoginBuildingName();
}

function updateHeaderIfVisible() {
  const appVisible = document.getElementById('appScreen').classList.contains('active');
  if (appVisible) updateHeader();
}

function updateLoginBuildingName() {
  const s = getSettings();
  const el = document.getElementById('buildingNameDisplay');
  if (el) el.textContent = s.buildingName || 'Manager';
}

// ─── LOADING OVERLAY ──────────────────────────────────
function showLoadingOverlay(msg) {
  const el = document.getElementById('loadingOverlay');
  if (el) {
    el.querySelector('.loading-msg').textContent = msg || 'Loading…';
    el.classList.remove('hidden');
  }
}
function hideLoadingOverlay() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.add('hidden');
}

// ─── AUTH ─────────────────────────────────────────────
const CREDS = { username: 'admin', password: 'admin123' };

function handleLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  if (u === CREDS.username && p === CREDS.password) {
    saveSession({ loggedIn: true });
    if (isAllLoaded()) {
      doShowApp();
    } else {
      showLoadingOverlay('Connecting to database…');
      DB._pendingShow = true;
    }
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
}

function handleLogout() {
  saveSession({ loggedIn: false });
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.add('hidden');
  closeMenu();
}

function doShowApp() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('active');
  updateHeader();
  navigateTo('dashboard');
}

function updateHeader() {
  const s = getSettings();
  const name = s.buildingName || 'Building Manager';
  const h = document.getElementById('headerBuildingName');
  const d = document.getElementById('buildingNameDisplay');
  if (h) h.textContent = name;
  if (d) d.textContent = name;
}

// ─── NAVIGATION ───────────────────────────────────────
let currentPage = 'dashboard';

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  currentPage = page;
  closeMenu();
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard')   renderDashboard();
  else if (page === 'maintenance') renderMaintenance();
  else if (page === 'other')  renderOther();
  else if (page === 'expenses') renderExpenses();
  else if (page === 'reports') initReports();
  else if (page === 'flats')  renderFlats();
  else if (page === 'settings') renderSettings();
}

// ─── DROPDOWN MENU ────────────────────────────────────
function toggleMenu() { document.getElementById('topMenu').classList.toggle('hidden'); }
function closeMenu()  { document.getElementById('topMenu').classList.add('hidden'); }
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
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function closeModalOnOverlay(e, id) { if (e.target.id === id) closeModal(id); }

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

  const activeFlats  = flats.filter(f => f.status === 'active').length;
  const inactiveFlats = flats.filter(f => f.status === 'inactive').length;
  const maintenancePaid    = maintenance.filter(m => m.status === 'paid').reduce((s, m) => s + Number(m.amount), 0);
  const maintenancePending = maintenance.filter(m => m.status === 'pending').reduce((s, m) => s + Number(m.amount), 0);
  const otherTotal    = other.reduce((s, o) => s + Number(o.amount), 0);
  const expenseTotal  = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit   = maintenancePaid + otherTotal;
  const availableFund = totalCredit - expenseTotal;
  const pendingCount  = maintenance.filter(m => m.status === 'pending').length;

  const stats = [
    { label: 'Total Flats',           value: flats.length,                 cls: '' },
    { label: 'Active Flats',          value: activeFlats,                  cls: 'success' },
    { label: 'Inactive Flats',        value: inactiveFlats,                cls: 'warning' },
    { label: 'Pending Maintenance',   value: pendingCount,                 cls: 'danger' },
    { label: 'Maintenance Collection',value: formatCurrency(maintenancePaid),  cls: 'accent' },
    { label: 'Other Collection',      value: formatCurrency(otherTotal),   cls: 'accent' },
    { label: 'Total Credit',          value: formatCurrency(totalCredit),  cls: 'success', full: true },
    { label: 'Total Expense',         value: formatCurrency(expenseTotal), cls: 'danger',  full: true },
    { label: 'Available Fund',        value: formatCurrency(availableFund),cls: availableFund >= 0 ? 'success' : 'danger', full: true },
  ];

  document.getElementById('dashboardStats').innerHTML = stats.map(s =>
    `<div class="stat-card${s.full ? ' full-width' : ''}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value ${s.cls}">${s.value}</div>
    </div>`
  ).join('');

  const allCollections = [
    ...maintenance.filter(m => m.status === 'paid').map(m => ({
      title: `Flat ${m.flatNumber} — ${m.flatOwner}`, sub: `Maintenance · ${formatMonth(m.month)}`,
      amount: m.amount, date: m.date, badge: 'badge-success', badgeText: 'Paid'
    })),
    ...other.map(o => ({
      title: `Flat ${o.flatNumber}`, sub: o.type,
      amount: o.amount, date: o.date, badge: 'badge-accent', badgeText: 'Other'
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
        </div>`).join('')
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
        </div>`).join('')
    : emptyState('No expenses yet');
}

// ─── MODULE 2: MAINTENANCE ────────────────────────────
function renderMaintenance() {
  const maintenance = getMaintenance();
  const monthFilter  = document.getElementById('maintenanceMonthFilter').value;
  const statusFilter = document.getElementById('maintenanceStatusFilter').value;

  const months = [...new Set(maintenance.map(m => m.month))].sort().reverse();
  const mf = document.getElementById('maintenanceMonthFilter');
  const curVal = mf.value;
  mf.innerHTML = '<option value="">All Months</option>' +
    months.map(m => `<option value="${m}" ${m === curVal ? 'selected' : ''}>${formatMonth(m)}</option>`).join('');

  const filtered = maintenance.filter(m =>
    (!monthFilter  || m.month   === monthFilter) &&
    (!statusFilter || m.status  === statusFilter)
  );
  const paid = filtered.filter(m => m.status === 'paid');
  const pending = filtered.filter(m => m.status === 'pending');
  const paidAmt = paid.reduce((s, m) => s + Number(m.amount), 0);

  document.getElementById('maintenanceStats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Paid Flats</div><div class="stat-value success">${paid.length}</div></div>
    <div class="stat-card"><div class="stat-label">Pending Flats</div><div class="stat-value danger">${pending.length}</div></div>
    <div class="stat-card"><div class="stat-label">Total Collected</div><div class="stat-value accent">${formatCurrency(paidAmt)}</div></div>`;

  const sorted = [...filtered].sort((a, b) => (b.month + a.status).localeCompare(a.month + b.status));

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
  document.getElementById('generateMonth').value  = currentMonth();
  document.getElementById('generateAmount').value = s.defaultAmount || 1500;
  document.getElementById('generateWarning').classList.add('hidden');
  openModal('createMonthModal');
}

async function generateMonthlyRecords() {
  const month  = document.getElementById('generateMonth').value;
  const amount = Number(document.getElementById('generateAmount').value);
  if (!month)           { showToast('Please select a month', 'error'); return; }
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
  if (newFlats.length === 0) { showToast('All active flats already have records for this month', 'error'); return; }

  try {
    const batch = db.batch();
    newFlats.forEach(f => {
      const ref = db.collection('maintenance').doc(uid());
      batch.set(ref, { flatId: f.id, flatNumber: f.number, flatOwner: f.owner, month, amount, date: '', status: 'pending', notes: '' });
    });
    await batch.commit();
    closeModal('createMonthModal');
    showToast(`Generated ${newFlats.length} maintenance records for ${formatMonth(month)}`, 'success');
  } catch (err) {
    showToast('Error generating records', 'error');
    console.error(err);
  }
}

async function markMaintenancePaid(id) {
  try {
    await db.collection('maintenance').doc(id).update({ status: 'paid', date: today() });
    showToast('Marked as Paid', 'success');
  } catch (err) {
    showToast('Error updating record', 'error');
    console.error(err);
  }
}

function openMaintenanceModal(id) {
  const m = getMaintenance().find(x => x.id === id);
  if (!m) return;
  document.getElementById('maintenanceEditId').value        = id;
  document.getElementById('maintenanceFlatDisplay').value   = `Flat ${m.flatNumber} — ${m.flatOwner}`;
  document.getElementById('maintenanceMonthDisplay').value  = formatMonth(m.month);
  document.getElementById('maintenanceAmount').value        = m.amount;
  document.getElementById('maintenanceDate').value          = m.date || today();
  document.getElementById('maintenanceStatus').value        = m.status;
  document.getElementById('maintenanceNotes').value         = m.notes || '';
  openModal('maintenanceModal');
}

async function saveMaintenance() {
  const id     = document.getElementById('maintenanceEditId').value;
  const amount = Number(document.getElementById('maintenanceAmount').value);
  const date   = document.getElementById('maintenanceDate').value;
  const status = document.getElementById('maintenanceStatus').value;
  const notes  = document.getElementById('maintenanceNotes').value.trim();
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
  try {
    await db.collection('maintenance').doc(id).update({ amount, date, status, notes });
    closeModal('maintenanceModal');
    showToast('Maintenance record updated', 'success');
  } catch (err) {
    showToast('Error saving record', 'error');
    console.error(err);
  }
}

// ─── MODULE 3: OTHER COLLECTIONS ──────────────────────
function renderOther() {
  const other      = getOther();
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
    (!typeFilter || o.type   === typeFilter) &&
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
            <button class="btn-icon-sm del"  onclick="deleteOther('${o.id}')">✕</button>
          </div>
        </div>`).join('')
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

  document.getElementById('collectionQuickAdd').classList.add('hidden');

  if (id) {
    const o = getOther().find(x => x.id === id);
    if (!o) return;
    document.getElementById('otherEditId').value   = id;
    document.getElementById('otherModalTitle').textContent = 'Edit Collection';
    document.getElementById('otherDate').value     = o.date;
    typeSelect.value = o.type;
    flatSelect.value = o.flatId;
    document.getElementById('otherAmount').value   = o.amount;
    document.getElementById('otherNotes').value    = o.notes || '';
  } else {
    document.getElementById('otherEditId').value   = '';
    document.getElementById('otherModalTitle').textContent = 'Add Collection';
    document.getElementById('otherDate').value     = today();
    typeSelect.value = '';
    flatSelect.value = '';
    document.getElementById('otherAmount').value   = '';
    document.getElementById('otherNotes').value    = '';
  }
  openModal('otherModal');
}

async function saveOther() {
  const id       = document.getElementById('otherEditId').value;
  const date     = document.getElementById('otherDate').value;
  const flatId   = document.getElementById('otherFlat').value;
  const type     = document.getElementById('otherType').value;
  const amount   = Number(document.getElementById('otherAmount').value);
  const notes    = document.getElementById('otherNotes').value.trim();

  if (!date)   { showToast('Please select a date', 'error'); return; }
  if (!flatId) { showToast('Please select a flat', 'error'); return; }
  if (!type)   { showToast('Please select a collection type', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

  const flat = getFlats().find(f => f.id === flatId);
  if (!flat) { showToast('Flat not found', 'error'); return; }

  const data = { date, flatId, flatNumber: flat.number, type, amount, notes };

  try {
    if (id) {
      await db.collection('otherCollections').doc(id).update(data);
    } else {
      await db.collection('otherCollections').add(data);
    }
    closeModal('otherModal');
    showToast(id ? 'Collection updated' : 'Collection added', 'success');
  } catch (err) {
    showToast('Error saving collection', 'error');
    console.error(err);
  }
}

function deleteOther(id) {
  confirmDelete('Delete this collection record?', async () => {
    try {
      await db.collection('otherCollections').doc(id).delete();
      showToast('Collection deleted', 'success');
    } catch (err) {
      showToast('Error deleting', 'error');
      console.error(err);
    }
  });
}

function toggleQuickType(divId) {
  document.getElementById(divId).classList.toggle('hidden');
}

async function quickAddCollectionType() {
  const input = document.getElementById('quickCollectionTypeInput');
  const val   = input.value.trim();
  if (!val) return;
  const types = getCollectionTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  try {
    await db.collection('config').doc('collectionTypes').update({
      types: firebase.firestore.FieldValue.arrayUnion(val)
    });
    input.value = '';
    document.getElementById('collectionQuickAdd').classList.add('hidden');
    // Refresh modal select
    const sel = document.getElementById('otherType');
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = val; opt.selected = true;
    sel.appendChild(opt);
    showToast(`"${val}" added`, 'success');
  } catch (err) {
    showToast('Error adding type', 'error');
    console.error(err);
  }
}

async function quickAddExpenseType() {
  const input = document.getElementById('quickExpenseTypeInput');
  const val   = input.value.trim();
  if (!val) return;
  const types = getExpenseTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  try {
    await db.collection('config').doc('expenseTypes').update({
      types: firebase.firestore.FieldValue.arrayUnion(val)
    });
    input.value = '';
    document.getElementById('expenseQuickAdd').classList.add('hidden');
    // Refresh modal select
    const sel = document.getElementById('expenseType');
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = val; opt.selected = true;
    sel.appendChild(opt);
    showToast(`"${val}" added`, 'success');
  } catch (err) {
    showToast('Error adding type', 'error');
    console.error(err);
  }
}

// ─── MODULE 4: EXPENSES ───────────────────────────────
function renderExpenses() {
  const expenses   = getExpenses();
  const typeFilter = document.getElementById('expenseTypeFilter').value;

  const types = [...new Set(expenses.map(e => e.type))].sort();
  const tf = document.getElementById('expenseTypeFilter');
  const tfVal = tf.value;
  tf.innerHTML = '<option value="">All Types</option>' +
    types.map(t => `<option value="${t}" ${t === tfVal ? 'selected' : ''}>${t}</option>`).join('');

  const filtered = expenses
    .filter(e => !typeFilter || e.type === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  document.getElementById('expenseList').innerHTML = filtered.length
    ? `<div class="stat-card full-width" style="margin-bottom:12px">
        <div class="stat-label">Total (filtered)</div>
        <div class="stat-value danger">${formatCurrency(total)}</div>
       </div>` +
      filtered.map(e =>
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
            <button class="btn-icon-sm del"  onclick="deleteExpense('${e.id}')">✕</button>
          </div>
        </div>`).join('')
    : emptyState('No expenses yet', 'Add expenses using the + Add button');
}

function openExpenseModal(id) {
  const types = getExpenseTypes();
  const typeSelect = document.getElementById('expenseType');
  typeSelect.innerHTML = '<option value="">Select type</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');

  document.getElementById('expenseQuickAdd').classList.add('hidden');

  if (id) {
    const e = getExpenses().find(x => x.id === id);
    if (!e) return;
    document.getElementById('expenseEditId').value  = id;
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    document.getElementById('expenseDate').value    = e.date;
    typeSelect.value = e.type;
    document.getElementById('expenseAmount').value  = e.amount;
    document.getElementById('expenseNotes').value   = e.notes || '';
  } else {
    document.getElementById('expenseEditId').value  = '';
    document.getElementById('expenseModalTitle').textContent = 'Add Expense';
    document.getElementById('expenseDate').value    = today();
    typeSelect.value = '';
    document.getElementById('expenseAmount').value  = '';
    document.getElementById('expenseNotes').value   = '';
  }
  openModal('expenseModal');
}

async function saveExpense() {
  const id     = document.getElementById('expenseEditId').value;
  const date   = document.getElementById('expenseDate').value;
  const type   = document.getElementById('expenseType').value;
  const amount = Number(document.getElementById('expenseAmount').value);
  const notes  = document.getElementById('expenseNotes').value.trim();

  if (!date)   { showToast('Please select a date', 'error'); return; }
  if (!type)   { showToast('Please select an expense type', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

  const data = { date, type, amount, notes };

  try {
    if (id) {
      await db.collection('expenses').doc(id).update(data);
    } else {
      await db.collection('expenses').add(data);
    }
    closeModal('expenseModal');
    showToast(id ? 'Expense updated' : 'Expense added', 'success');
  } catch (err) {
    showToast('Error saving expense', 'error');
    console.error(err);
  }
}

function deleteExpense(id) {
  confirmDelete('Delete this expense?', async () => {
    try {
      await db.collection('expenses').doc(id).delete();
      showToast('Expense deleted', 'success');
    } catch (err) {
      showToast('Error deleting', 'error');
      console.error(err);
    }
  });
}

// ─── MODULE 5: REPORTS ────────────────────────────────
let reportFilter = 'monthly';
let reportData   = null;

function initReports() {
  setReportFilter(reportFilter);
}

function setReportFilter(f) {
  reportFilter = f;
  ['monthly','yearly','custom'].forEach(id => {
    document.getElementById('filter' + id.charAt(0).toUpperCase() + id.slice(1))
      .classList.toggle('active-filter', id === f);
  });

  let html = '';
  if (f === 'monthly') {
    html = `<input type="month" id="reportMonth" value="${currentMonth()}" />`;
  } else if (f === 'yearly') {
    const yr = new Date().getFullYear();
    const opts = Array.from({length:5}, (_,i) => yr - i).map(y => `<option value="${y}">${y}</option>`).join('');
    html = `<select id="reportYear">${opts}</select>`;
  } else {
    html = `<input type="date" id="reportFrom" value="${currentMonth()}-01" />
            <input type="date" id="reportTo"   value="${today()}" />`;
  }
  document.getElementById('reportFilterInputs').innerHTML = html;
}

function generateReport() {
  const maintenance = getMaintenance();
  const other       = getOther();
  const expenses    = getExpenses();
  let label = '', filteredMaint = [], filteredOther = [], filteredExpenses = [];

  if (reportFilter === 'monthly') {
    const month = document.getElementById('reportMonth').value;
    if (!month) { showToast('Please select a month', 'error'); return; }
    label = formatMonth(month);
    filteredMaint    = maintenance.filter(m => m.month === month);
    filteredOther    = other.filter(o => o.date.startsWith(month));
    filteredExpenses = expenses.filter(e => e.date.startsWith(month));
  } else if (reportFilter === 'yearly') {
    const year = document.getElementById('reportYear').value;
    label = 'Year ' + year;
    filteredMaint    = maintenance.filter(m => m.month.startsWith(year));
    filteredOther    = other.filter(o => o.date.startsWith(year));
    filteredExpenses = expenses.filter(e => e.date.startsWith(year));
  } else {
    const from = document.getElementById('reportFrom').value;
    const to   = document.getElementById('reportTo').value;
    if (!from || !to) { showToast('Please select date range', 'error'); return; }
    label = `${formatDate(from)} – ${formatDate(to)}`;
    filteredMaint    = maintenance.filter(m => { const d = m.date || m.month + '-01'; return d >= from && d <= to; });
    filteredOther    = other.filter(o => o.date >= from && o.date <= to);
    filteredExpenses = expenses.filter(e => e.date >= from && e.date <= to);
  }

  const paidMaint    = filteredMaint.filter(m => m.status === 'paid');
  const pendingMaint = filteredMaint.filter(m => m.status === 'pending');
  const maintenancePaid = paidMaint.reduce((s, m) => s + Number(m.amount), 0);
  const otherTotal      = filteredOther.reduce((s, o) => s + Number(o.amount), 0);
  const expenseTotal    = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit     = maintenancePaid + otherTotal;
  const availableFund   = totalCredit - expenseTotal;
  const pendingAmount   = pendingMaint.reduce((s, m) => s + Number(m.amount), 0);

  reportData = { label, filteredMaint, filteredOther, filteredExpenses, pendingMaint, maintenancePaid, otherTotal, expenseTotal, totalCredit, availableFund, pendingAmount };

  const html = `
    <div class="section-card">
      <div class="section-title">Summary — ${label}</div>
      <div class="report-summary">
        <div class="stat-card"><div class="stat-label">Maintenance Collected</div><div class="stat-value accent">${formatCurrency(maintenancePaid)}</div></div>
        <div class="stat-card"><div class="stat-label">Other Collections</div><div class="stat-value accent">${formatCurrency(otherTotal)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Credit</div><div class="stat-value success">${formatCurrency(totalCredit)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value danger">${formatCurrency(expenseTotal)}</div></div>
        <div class="stat-card full-width"><div class="stat-label">Available Fund</div><div class="stat-value ${availableFund >= 0 ? 'success' : 'danger'}">${formatCurrency(availableFund)}</div></div>
        <div class="stat-card full-width"><div class="stat-label">Pending Maintenance</div><div class="stat-value warning">${formatCurrency(pendingAmount)}</div></div>
      </div>
    </div>

    <div class="section-card report-section">
      <div class="report-section-title">Maintenance Collection (${paidMaint.length} paid)</div>
      ${paidMaint.length ? `
      <table class="report-table">
        <thead><tr><th>Flat</th><th>Owner</th><th>Month</th><th>Amount</th></tr></thead>
        <tbody>${paidMaint.map(m => `
          <tr><td>Flat ${m.flatNumber}</td><td>${m.flatOwner}</td>
          <td>${formatMonth(m.month)}</td><td><b>${formatCurrency(m.amount)}</b></td></tr>`).join('')}
        </tbody>
      </table>` : '<p class="text-muted" style="font-size:0.875rem;padding:8px 0">No paid maintenance in this period</p>'}
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
  `;

  document.getElementById('reportResult').innerHTML = html;
  document.getElementById('reportActions').classList.remove('hidden');
}

function printReport() { window.print(); }

function exportCSV() {
  if (!reportData) { showToast('Please generate a report first', 'error'); return; }
  const { label, filteredMaint, filteredOther, filteredExpenses, pendingMaint } = reportData;
  const rows = [
    ['Building Maintenance Report - ' + label], [],
    ['=== MAINTENANCE COLLECTION ==='],
    ['Flat No', 'Owner', 'Month', 'Date', 'Amount', 'Status'],
    ...filteredMaint.filter(m => m.status === 'paid').map(m => [`Flat ${m.flatNumber}`, m.flatOwner, formatMonth(m.month), m.date, m.amount, 'Paid']),
    [], ['=== OTHER COLLECTIONS ==='],
    ['Date', 'Flat', 'Type', 'Amount', 'Notes'],
    ...filteredOther.map(o => [o.date, `Flat ${o.flatNumber}`, o.type, o.amount, o.notes || '']),
    [], ['=== EXPENSES ==='],
    ['Date', 'Type', 'Amount', 'Notes'],
    ...filteredExpenses.map(e => [e.date, e.type, e.amount, e.notes || '']),
    [], ['=== PENDING MAINTENANCE ==='],
    ['Flat No', 'Owner', 'Month', 'Amount'],
    ...pendingMaint.map(m => [`Flat ${m.flatNumber}`, m.flatOwner, formatMonth(m.month), m.amount]),
    [], ['=== SUMMARY ==='],
    ['Maintenance Collected', reportData.maintenancePaid],
    ['Other Collections',     reportData.otherTotal],
    ['Total Credit',          reportData.totalCredit],
    ['Total Expenses',        reportData.expenseTotal],
    ['Available Fund',        reportData.availableFund],
    ['Pending Amount',        reportData.pendingAmount],
  ];

  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-report-${label.replace(/\s+/g,'-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported', 'success');
}

// ─── MODULE 6: FLATS ──────────────────────────────────
function renderFlats() {
  const query  = (document.getElementById('flatSearch').value || '').toLowerCase();
  const flats  = getFlats().filter(f =>
    !query || f.number.toLowerCase().includes(query) || (f.owner || '').toLowerCase().includes(query)
  );

  document.getElementById('flatList').innerHTML = flats.length
    ? flats.map(f => `
        <div class="list-item">
          <div class="list-item-main">
            <div class="list-item-title">Flat ${f.number} — ${f.owner}</div>
            <div class="list-item-sub">${f.mobile || 'No mobile'}  · <span class="badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}">${f.status}</span></div>
          </div>
          <div class="list-item-actions">
            <button class="btn-icon-sm edit" onclick="openFlatModal('${f.id}')">✎</button>
            <button class="btn-icon-sm del"  onclick="deleteFlat('${f.id}')">✕</button>
          </div>
        </div>`).join('')
    : emptyState('No flats found', 'Add flats using the + Add button');
}

function openFlatModal(id) {
  if (id) {
    const f = getFlats().find(x => x.id === id);
    if (!f) return;
    document.getElementById('flatEditId').value    = id;
    document.getElementById('flatModalTitle').textContent = 'Edit Flat';
    document.getElementById('flatNumber').value    = f.number;
    document.getElementById('flatOwner').value     = f.owner;
    document.getElementById('flatMobile').value    = f.mobile || '';
    document.getElementById('flatStatus').value    = f.status;
  } else {
    document.getElementById('flatEditId').value    = '';
    document.getElementById('flatModalTitle').textContent = 'Add Flat';
    document.getElementById('flatNumber').value    = '';
    document.getElementById('flatOwner').value     = '';
    document.getElementById('flatMobile').value    = '';
    document.getElementById('flatStatus').value    = 'active';
  }
  openModal('flatModal');
}

async function saveFlat() {
  const id     = document.getElementById('flatEditId').value;
  const number = document.getElementById('flatNumber').value.trim().toUpperCase();
  const owner  = document.getElementById('flatOwner').value.trim();
  const mobile = document.getElementById('flatMobile').value.trim();
  const status = document.getElementById('flatStatus').value;

  if (!number) { showToast('Please enter flat number', 'error'); return; }
  if (!owner)  { showToast('Please enter owner name', 'error'); return; }

  const data = { number, owner, mobile, status };

  try {
    if (id) {
      await db.collection('flats').doc(id).update(data);

      // Update denormalized flat info in maintenance records
      const affected = getMaintenance().filter(m => m.flatId === id && (m.flatNumber !== number || m.flatOwner !== owner));
      if (affected.length > 0) {
        const batch = db.batch();
        affected.forEach(m => batch.update(db.collection('maintenance').doc(m.id), { flatNumber: number, flatOwner: owner }));
        await batch.commit();
      }

      // Update denormalized flat info in other collections
      const affectedOther = getOther().filter(o => o.flatId === id && o.flatNumber !== number);
      if (affectedOther.length > 0) {
        const batch2 = db.batch();
        affectedOther.forEach(o => batch2.update(db.collection('otherCollections').doc(o.id), { flatNumber: number }));
        await batch2.commit();
      }
    } else {
      // Check for duplicate flat number
      const exists = getFlats().find(f => f.number === number);
      if (exists) { showToast(`Flat ${number} already exists`, 'error'); return; }
      await db.collection('flats').add(data);
    }
    closeModal('flatModal');
    showToast(id ? 'Flat updated' : 'Flat added', 'success');
  } catch (err) {
    showToast('Error saving flat', 'error');
    console.error(err);
  }
}

function deleteFlat(id) {
  const f = getFlats().find(x => x.id === id);
  if (!f) return;
  const mCount = getMaintenance().filter(m => m.flatId === id).length;
  const oCount = getOther().filter(o => o.flatId === id).length;
  const msg = `Delete Flat ${f.number}${mCount + oCount > 0 ? ` and its ${mCount + oCount} linked records` : ''}? This cannot be undone.`;

  confirmDelete(msg, async () => {
    try {
      const batch = db.batch();
      batch.delete(db.collection('flats').doc(id));
      getMaintenance().filter(m => m.flatId === id).forEach(m => batch.delete(db.collection('maintenance').doc(m.id)));
      getOther().filter(o => o.flatId === id).forEach(o => batch.delete(db.collection('otherCollections').doc(o.id)));
      await batch.commit();
      showToast('Flat deleted', 'success');
    } catch (err) {
      showToast('Error deleting flat', 'error');
      console.error(err);
    }
  });
}

// ─── MODULE 7: SETTINGS ───────────────────────────────
function renderSettings() {
  const s = getSettings();
  document.getElementById('settingBuildingName').value    = s.buildingName || '';
  document.getElementById('settingBuildingAddress').value = s.buildingAddress || '';
  document.getElementById('settingDefaultAmount').value   = s.defaultAmount || 1500;

  const collTypes = getCollectionTypes();
  document.getElementById('collectionTypesList').innerHTML = collTypes.map(t =>
    `<span class="tag">${t}<button class="tag-del" onclick="deleteCollectionType('${t}')">✕</button></span>`
  ).join('');

  const expTypes = getExpenseTypes();
  document.getElementById('expenseTypesList').innerHTML = expTypes.map(t =>
    `<span class="tag">${t}<button class="tag-del" onclick="deleteExpenseType('${t}')">✕</button></span>`
  ).join('');
}

async function saveSettings() {
  const buildingName    = document.getElementById('settingBuildingName').value.trim();
  const buildingAddress = document.getElementById('settingBuildingAddress').value.trim();
  const defaultAmount   = Number(document.getElementById('settingDefaultAmount').value);

  if (!buildingName) { showToast('Please enter building name', 'error'); return; }

  try {
    await db.collection('config').doc('settings').set({ buildingName, buildingAddress, defaultAmount });
    showToast('Settings saved', 'success');
  } catch (err) {
    showToast('Error saving settings', 'error');
    console.error(err);
  }
}

async function addCollectionType() {
  const val = document.getElementById('newCollectionType').value.trim();
  if (!val) return;
  const types = getCollectionTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  try {
    await db.collection('config').doc('collectionTypes').update({
      types: firebase.firestore.FieldValue.arrayUnion(val)
    });
    document.getElementById('newCollectionType').value = '';
    showToast(`"${val}" added`, 'success');
  } catch (err) {
    showToast('Error adding type', 'error');
    console.error(err);
  }
}

async function deleteCollectionType(type) {
  try {
    await db.collection('config').doc('collectionTypes').update({
      types: firebase.firestore.FieldValue.arrayRemove(type)
    });
    showToast(`"${type}" removed`, 'success');
  } catch (err) {
    showToast('Error removing type', 'error');
    console.error(err);
  }
}

async function addExpenseType() {
  const val = document.getElementById('newExpenseType').value.trim();
  if (!val) return;
  const types = getExpenseTypes();
  if (types.includes(val)) { showToast('Type already exists', 'error'); return; }
  try {
    await db.collection('config').doc('expenseTypes').update({
      types: firebase.firestore.FieldValue.arrayUnion(val)
    });
    document.getElementById('newExpenseType').value = '';
    showToast(`"${val}" added`, 'success');
  } catch (err) {
    showToast('Error adding type', 'error');
    console.error(err);
  }
}

async function deleteExpenseType(type) {
  try {
    await db.collection('config').doc('expenseTypes').update({
      types: firebase.firestore.FieldValue.arrayRemove(type)
    });
    showToast(`"${type}" removed`, 'success');
  } catch (err) {
    showToast('Error removing type', 'error');
    console.error(err);
  }
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
  // Keyboard shortcuts for login
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginUsername').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPassword').focus();
  });

  // Start Firestore listeners immediately (before login)
  // so data is ready by the time the user logs in
  setupListeners();

  // Auto-login if session exists
// Auto-login if session exists
const session = getSession();

if (session && session.loggedIn) {
  if (isAllLoaded()) {
    doShowApp();
  } else {
    showLoadingOverlay('Connecting to database…');
    DB._pendingShow = true;
  }
} else {
  hideLoadingOverlay();
  document.getElementById('loginScreen').classList.add('active');
}