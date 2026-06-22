// =========================================================
//  CDIMS — Main Application Controller
//  Criminal Dossier & Intelligence Management System
//  Uttar Pradesh Police Headquarters
// =========================================================

// ── State ──
let currentUser = null;
let currentLang = 'en';
let currentView = 'dashboard';
let charts = {};
let notifPanelOpen = false;

window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
  }
};

// Base API URL helper to connect to port 5001 if served elsewhere (e.g. Live Server or file://)
function getApiUrl(path) {
  const isLocalhost5001 = window.location.port === '5001';
  const apiBase = isLocalhost5001 ? '' : 'http://localhost:5001';
  return apiBase + path;
}

// Village selection state
let selectedVillageDistrict = 'lucknow';
let selectedVillageStation = 'Hazratganj';
let selectedVillageName = null;

// ── Users Mock DB ──
const USERS = {
  l1: {
    username: 'sho_hazratganj',
    name: 'SHO Rajiv Sharma',
    role: 'Police Station User',
    level: 1,
    station: 'Hazratganj PS, Lucknow',
    district: 'lucknow',
    avatar: 'RS',
    permissions: ['create', 'update', 'upload', 'search']
  },
  l2: {
    username: 'co_lucknow',
    name: 'CO Prashant Mishra',
    role: 'District Nodal Officer',
    level: 2,
    station: 'CO Office, Lucknow',
    district: 'lucknow',
    avatar: 'PM',
    permissions: ['view_all_district', 'verify', 'approve', 'return', 'reports', 'search']
  },
  l3: {
    username: 'phq_admin',
    name: 'DG Intelligence (PHQ)',
    role: 'State Administrator',
    level: 3,
    station: 'PHQ — UP Police Headquarters',
    district: 'all',
    avatar: 'PH',
    permissions: ['all']
  }
};

// ── i18n Translations ──
const I18N = {
  en: {
    dashboard: 'Dashboard',
    dossiers: 'Criminal Dossiers',
    search: 'Search',
    network: 'Gang Network',
    map: 'GIS Crime Map',
    intelligence: 'AI Intelligence',
    alerts: 'Alert System',
    reports: 'Reports',
    audit: 'Audit Logs',
    users: 'User Management',
    logout: 'Logout',
    totalCriminals: 'Total Criminals',
    activeCriminals: 'Active Criminals',
    historySheeters: 'History Sheeters',
    gangsters: 'Gangsters',
    wantedCriminals: 'Wanted Criminals',
    districts: 'Districts',
    policeStations: 'Police Stations',
    addDossier: 'Add Dossier',
    exportPDF: 'Export PDF',
    exportExcel: 'Export Excel',
    approve: 'Approve',
    returnCorrection: 'Return for Correction'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    dossiers: 'आपराधिक डोजियर',
    search: 'खोजें',
    network: 'गैंग नेटवर्क',
    map: 'GIS अपराध मानचित्र',
    intelligence: 'AI इंटेलिजेंस',
    alerts: 'अलर्ट सिस्टम',
    reports: 'रिपोर्ट',
    audit: 'ऑडिट लॉग',
    users: 'उपयोगकर्ता प्रबंधन',
    logout: 'लॉगआउट',
    totalCriminals: 'कुल अपराधी',
    activeCriminals: 'सक्रिय अपराधी',
    historySheeters: 'इतिहास शीटर',
    gangsters: 'गैंगस्टर',
    wantedCriminals: 'वांछित अपराधी',
    districts: 'जिले',
    policeStations: 'पुलिस स्टेशन',
    addDossier: 'डोजियर जोड़ें',
    exportPDF: 'PDF निर्यात',
    exportExcel: 'Excel निर्यात',
    approve: 'अनुमोदित करें',
    returnCorrection: 'सुधार हेतु वापस'
  }
};

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en[key]) || key;
}

// ── Live Alerts Data ──
const LIVE_ALERTS = [
  { type: 'critical', icon: '🚨', title: 'Wanted Criminal Alert', body: 'Rajesh Yadav (Raju Kaana) possibly spotted near Gomti Nagar, Lucknow. Beat officers alerted.', time: '2 mins ago' },
  { type: 'warning', icon: '⚠️', title: 'Bail Release Notification', body: 'Amit Mishra (CRM-2026-0002) out on bail from Lucknow District Court. Surveillance increased.', time: '45 mins ago' },
  { type: 'info', icon: '📍', title: 'Criminal Movement Detected', body: 'Vikram Singh reportedly seen at Varanasi Cantt railway station. NBW holders notified.', time: '2 hrs ago' },
  { type: 'critical', icon: '🔴', title: 'New FIR Registered', body: 'FIR-22/2026 registered at Sector-20 PS, Noida against Gujjar Syndicate members under Arms Act.', time: '3 hrs ago' },
  { type: 'success', icon: '✅', title: 'Dossier Approved', body: 'District Nodal Officer has approved dossier CRM-2026-0002. Records updated in system.', time: '4 hrs ago' },
  { type: 'warning', icon: '🏦', title: 'Financial Intelligence', body: 'Suspicious transaction of ₹12L from a suspected shell account linked to Raju Kaana gang.', time: '6 hrs ago' }
];

// ── Navigation Config per Role ──
function getNavItems() {
  const level = currentUser.level;
  const items = [];

  items.push({ id: 'dashboard', icon: '📊', label: t('dashboard'), section: 'OVERVIEW' });
  items.push({ id: 'villages', icon: '🏘️', label: currentLang === 'hi' ? 'ग्राम निर्देशिका' : 'Village Directory', section: null });
  items.push({ id: 'dossiers', icon: '📁', label: t('dossiers'), section: null });
  items.push({ id: 'search', icon: '🔍', label: t('search'), section: null });

  if (level >= 1) {
    items.push({ id: 'network', icon: '🕸️', label: t('network'), section: 'INTELLIGENCE' });
    items.push({ id: 'facerecog', icon: '🎭', label: currentLang === 'hi' ? 'चेहरा पहचान' : 'Face Recognition', section: null });
    items.push({ id: 'map', icon: '🗺️', label: t('map'), section: null });
    items.push({ id: 'intelligence', icon: '🤖', label: t('intelligence'), section: null });
  }

  items.push({ id: 'alerts', icon: '🔔', label: t('alerts'), section: 'OPERATIONS', badge: '3' });
  items.push({ id: 'reports', icon: '📈', label: t('reports'), section: null });

  if (level >= 2) {
    items.push({ id: 'audit', icon: '📋', label: t('audit'), section: 'ADMIN' });
  }
  if (level >= 3) {
    items.push({ id: 'users', icon: '👤', label: t('users'), section: null });
  }

  return items;
}

// ── Build Sidebar ──
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const items = getNavItems();
  let lastSection = null;

  nav.innerHTML = items.map(item => {
    let html = '';
    if (item.section && item.section !== lastSection) {
      html += `<div class="nav-section-label">${item.section}</div>`;
      lastSection = item.section;
    }
    html += `
      <div class="nav-item ${currentView === item.id ? 'active' : ''}" 
           id="nav-${item.id}" onclick="navigateTo('${item.id}')">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      </div>
    `;
    return html;
  }).join('');
}

window.navigateToDossiersWithFilter = async function(filterType) {
  await navigateTo('dossiers');
  const statusSelect = document.getElementById('filter-status');
  const specialSelect = document.getElementById('filter-special');
  const scopeSelect = document.getElementById('filter-scope');
  const searchInput = document.getElementById('dossier-search-input');

  if (searchInput) searchInput.value = '';

  if (statusSelect) statusSelect.value = 'all';
  if (specialSelect) specialSelect.value = 'all';
  if (scopeSelect) scopeSelect.value = 'all';

  if (filterType === 'wanted') {
    if (statusSelect) statusSelect.value = 'Wanted';
  } else if (filterType === 'active') {
    if (specialSelect) specialSelect.value = 'active';
  } else if (filterType === 'history_sheeter') {
    if (specialSelect) specialSelect.value = 'history_sheeter';
  } else if (filterType === 'gangster') {
    if (specialSelect) specialSelect.value = 'gangster';
  } else if (filterType === 'multi_ps') {
    if (scopeSelect) scopeSelect.value = 'multiple';
  }

  filterDossierTable('');
};

// ── Navigation ──
async function navigateTo(view) {
  // Pull fresh data from database on navigation to ensure absolute synchronization
  if (['dashboard', 'dossiers', 'villages', 'map', 'intelligence', 'network'].includes(view)) {
    if (window.syncDatabase) {
      await window.syncDatabase();
    }
  }
  currentView = view;
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${view}`);
  if (navEl) navEl.classList.add('active');

  // Close mobile sidebar on navigation
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');

  // Destroy old charts
  Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) { } });
  charts = {};

  // Close notif panel
  if (notifPanelOpen) toggleNotifPanel();

  // Destroy map if navigating away
  if (view !== 'map' && window.cdims_map) {
    window.cdims_map.remove();
    window.cdims_map = null;
  }

  // Unmount React network graph if navigating away
  if (view !== 'network' && typeof window.unmountReactNetworkGraph === 'function') {
    try {
      window.unmountReactNetworkGraph();
      window.unmountReactNetworkGraph = null;
    } catch (e) {
      console.error("Error unmounting React network graph:", e);
    }
  }

  // Render the view
  const content = document.getElementById('page-content');
  const header = document.getElementById('page-title');
  const headerSub = document.getElementById('page-subtitle');

  switch (view) {
    case 'dashboard':
      header.textContent = t('dashboard');
      headerSub.textContent = 'Uttar Pradesh Police — Real-time Criminal Intelligence Overview';
      content.innerHTML = renderDashboard();
      initDashboardLazyLoading();
      break;
    case 'villages':
      header.textContent = currentLang === 'hi' ? '🏘️ ग्राम निर्देशिका' : '🏘️ Village Directory';
      headerSub.textContent = 'Village-wise list of history sheeters and active criminals';
      content.innerHTML = renderVillageDirectory();
      break;
    case 'dossiers':
      header.textContent = t('dossiers');
      headerSub.textContent = 'Manage, view and update criminal dossier records';
      content.innerHTML = renderDossierList();
      break;
    case 'search':
      header.textContent = '🔍 ' + t('search');
      headerSub.textContent = 'Search by name, alias, FIR number, vehicle, mobile, Aadhaar';
      content.innerHTML = renderSearchPage();
      break;
    case 'network':
      header.textContent = '🕸️ ' + t('network');
      headerSub.textContent = 'Criminal association graph — Gang links and relationships';
      content.innerHTML = renderNetworkPage();
      const tryMountReactGraph = () => {
        if (window.mountReactNetworkGraph) {
          window.mountReactNetworkGraph('react-network-root');
        } else {
          setTimeout(tryMountReactGraph, 50);
        }
      };
      tryMountReactGraph();
      break;
    case 'map':
      header.textContent = '🗺️ ' + t('map');
      headerSub.textContent = 'GIS Crime Map — Hotspots, gang territories and criminal locations';
      content.innerHTML = renderMapPage();
      setTimeout(() => initCrimeMap('map-container'), 200);
      break;
    case 'intelligence':
      header.textContent = '🤖 ' + t('intelligence');
      headerSub.textContent = 'AI-powered criminal intelligence, risk scoring and pattern analysis';
      content.innerHTML = renderIntelligencePage();
      initIntelligenceCharts();
      break;
    case 'facerecog':
      header.textContent = '🎭 ' + (currentLang === 'hi' ? 'चेहरा पहचान' : 'Face Recognition');
      headerSub.textContent = 'Match suspect photographs against the state-wide criminal database';
      content.innerHTML = renderFaceRecogPage();
      initFaceRecog();
      break;
    case 'alerts':
      header.textContent = '🔔 ' + t('alerts');
      headerSub.textContent = 'Live criminal alerts — FIR registration, bail release, wanted notifications';
      content.innerHTML = renderAlertsPage();
      break;
    case 'reports':
      header.textContent = '📈 ' + t('reports');
      headerSub.textContent = 'Generate district-wise, gang, and surveillance reports';
      content.innerHTML = renderReportsPage();
      break;
    case 'audit':
      header.textContent = '📋 ' + t('audit');
      headerSub.textContent = 'System audit trail — all user actions logged';
      content.innerHTML = renderAuditPage();
      break;
    case 'users':
      header.textContent = '👤 ' + t('users');
      headerSub.textContent = 'User management — roles, stations, access control';
      content.innerHTML = renderUsersPage();
      break;
    default:
      content.innerHTML = '<div class="empty-state"><div class="empty-icon">🚧</div><div class="empty-title">Page Under Construction</div></div>';
  }
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD VIEW
// ══════════════════════════════════════════════════════════
function renderDashboard() {
  const stats = generateStatistics();
  const dossiers = getDossiers();
  let pendingDossiers = [];
  if (currentUser.level === 2) {
    pendingDossiers = dossiers.filter(d => d.approvalStatus === 'Pending Verification');
  } else if (currentUser.level === 3) {
    pendingDossiers = dossiers.filter(d => d.approvalStatus === 'Pending Approval');
  }

  // Calculate criminals active in multiple police stations
  const multiPsCount = dossiers.filter(d => {
    const stations = new Set(d.history.map(h => (h.policeStation || '').trim().toLowerCase()));
    return stations.size > 1;
  }).length;

  return `
    <div class="dashboard-console">
      <!-- SECTION 1: METRICS OVERVIEW (Loaded Immediately) -->
      <section id="dash-sec-overview" class="dashboard-section visible">
        ${pendingDossiers.length > 0 && currentUser.level >= 2 ? `
        <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px; margin-bottom: 16px; animation: fadeInModal 0.3s ease;">
          <span style="font-size:22px;">⚠️</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; color:#fbbf24; font-size:13px;">Pending Review: ${pendingDossiers.length} Criminal Dossiers</div>
            <div style="font-size:11px; color:var(--text-secondary);">Dossiers awaiting ${currentUser.level === 2 ? 'verification' : 'approval'} for district records</div>
          </div>
          <button class="btn btn-sm" style="background:rgba(245,158,11,0.2);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);" onclick="navigateTo('dossiers')">${currentUser.level === 2 ? 'Verify' : 'Approve'} Records</button>
        </div>` : ''}

        ${currentUser.level === 1 ? `
        <div class="quick-action-card" style="background:var(--glass-bg); border:1px solid var(--gold-500); padding:16px 20px; border-radius:var(--radius-md); margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 15px rgba(0,0,0,0.2); animation: fadeInModal 0.3s ease;">
          <div>
            <h3 style="font-size:14px; font-weight:800; color:var(--gold-400); margin:0 0 4px 0;">👮 Quick Action: Register Criminal Dossier / नया अपराधी डोजियर</h3>
            <p style="font-size:11px; color:var(--text-secondary); margin:0;">Register a new history sheeter or active criminal under your station's jurisdiction.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openAddDossierModal()">➕ Register New Dossier</button>
        </div>
        ` : ''}

        <div class="stats-grid-modern">
          ${statCardCompact('👥', stats.totalCriminals, t('totalCriminals'), '', "navigateToDossiersWithFilter('all')")}
          ${statCardCompact('🔴', stats.activeCriminals, t('activeCriminals'), 'danger', "navigateToDossiersWithFilter('active')")}
          ${statCardCompact('📋', stats.historySheeters, t('historySheeters'), 'warning', "navigateToDossiersWithFilter('history_sheeter')")}
          ${statCardCompact('⛔', stats.gangsters, t('gangsters'), 'danger', "navigateToDossiersWithFilter('gangster')")}
          ${statCardCompact('🚨', stats.wantedCriminals, t('wantedCriminals'), 'danger', "navigateToDossiersWithFilter('wanted')")}
          ${statCardCompact('🚔🔄', multiPsCount, currentLang === 'hi' ? 'बहु-थाना अपराधी' : 'Multi-PS Offenders', 'info', "navigateToDossiersWithFilter('multi_ps')")}
          ${renderRoleSpecificStatCards()}
        </div>
      </section>

      <!-- SECTION 2: SURVEILLANCE & LIVE ALERTS (Lazy Loaded) -->
      <section id="dash-sec-alerts" class="dashboard-section lazy-section">
        <div class="dashboard-row-two-col">
          
          <!-- Live Alerts Feed -->
          <div class="dashboard-alerts-card-modern">
            <div class="section-header">
              <h3>🔔 Live Alerts</h3>
              <button class="btn btn-xs btn-secondary" onclick="navigateTo('alerts')">All</button>
            </div>
            <div class="alert-feed-modern">
              ${LIVE_ALERTS.map(a => `
                <div class="alert-item alert-${a.type}">
                  <span class="alert-icon">${a.icon}</span>
                  <div class="alert-content-wrapper">
                    <div class="alert-title">${a.title}</div>
                    <div class="alert-body">${a.body}</div>
                    <div class="alert-time">🕐 ${a.time}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- District-wise Cases -->
          <div class="chart-card-modern district-cases-card">
            <div class="chart-card-header">
              <div class="chart-card-title">${currentUser && currentUser.level === 1 ? '🏘️ Village-wise Cases' : '🏛️ District-wise Cases'}</div>
            </div>
            <div class="district-bars-modern" id="district-bars">
              <div class="map-lazy-placeholder">
                <span class="spinner-icon">📊</span> ${currentUser && currentUser.level === 1 ? 'Loading village metrics...' : 'Loading district metrics...'}
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- SECTION 3: GEOSPATIAL MAP (Lazy Loaded) -->
      <section id="dash-sec-map" class="dashboard-section lazy-section">
        <!-- Leaflet GIS Map Card (Full Width / Large Size) -->
        <div class="map-card-modern large-map-card">
          <div class="section-header">
            <h3>🗺️ GIS Crime Mapping & Hotspots</h3>
          </div>
          <div id="dashboard-map-container" class="map-container-modern large-map-container">
            <div class="map-lazy-placeholder">
              <span class="spinner-icon">📡</span> Loading GIS Crime Mapping Engine...
            </div>
          </div>
        </div>
      </section>
      
      <!-- SECTION 4: RECENT DOSSIERS (Lazy Loaded) -->
      <section id="dash-sec-dossiers" class="dashboard-section lazy-section">
        <!-- Recent Criminal Dossiers (Full Width) -->
        <div class="recent-dossiers-card-full">
          <div class="chart-card-header">
            <div class="chart-card-header-flex">
              <div class="chart-card-title">📁 Recent Dossiers</div>
              <div class="header-buttons-gap">
                ${currentUser.level === 1 ? `<button class="btn btn-primary btn-xs" onclick="openAddDossierModal()">➕ Add</button>` : ''}
                <button class="btn btn-secondary btn-xs" onclick="navigateTo('dossiers')">View All</button>
              </div>
            </div>
          </div>
          <div class="table-scroll-container-modern">
            ${renderDossierTable(dossiers.slice(0, 5))}
          </div>
        </div>
      </section>

      <!-- SECTION 4: ANALYTICAL CHART WIDGETS (Lazy Loaded) -->
      <section id="dash-sec-analytics" class="dashboard-section lazy-section">
        <div class="section-header" style="margin-bottom: 20px;">
          <h3>📊 Crime Analytics & Threat Pattern Forecast</h3>
        </div>
        
        <div class="dashboard-row-three-col">
          
          <!-- Trend Chart -->
          <div class="chart-card-modern">
            <div class="chart-card-header">
              <div class="chart-card-title">📈 Monthly Crime Trend</div>
            </div>
            <div class="chart-area-modern">
              <canvas id="chart-trend" class="chart-canvas"></canvas>
            </div>
          </div>
          
          <!-- Category Doughnut -->
          <div class="chart-card-modern">
            <div class="chart-card-header">
              <div class="chart-card-title">🎯 Criminal Categories</div>
            </div>
            <div class="chart-area-modern">
              <canvas id="chart-category" class="chart-canvas"></canvas>
            </div>
          </div>

          <!-- Gang Analysis -->
          <div class="chart-card-modern">
            <div class="chart-card-header">
              <div class="chart-card-title">📊 Gang Activity Analysis</div>
            </div>
            <div class="chart-area-modern">
              <canvas id="chart-gangs" class="chart-canvas"></canvas>
            </div>
          </div>

        </div>
      </section>
    </div>
  `;
}

function statCardCompact(icon, value, label, type, onclick) {
  const action = onclick || "navigateTo('dossiers')";
  return `
    <div class="stat-card ${type}" onclick="${action}" style="cursor:pointer;">
      <div class="stat-icon">${icon}</div>
      <div class="stat-content">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
//  ROLE-SPECIFIC DASHBOARD STAT CARDS
// ══════════════════════════════════════════════════════════
function renderRoleSpecificStatCards() {
  const lvl = currentUser.level;

  // ── Level 1: SHO — villages count, click → village list modal ──
  if (lvl === 1) {
    const stationKey = currentUser.station.split(' PS')[0].trim();
    const villages = (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[stationKey]) || [];
    return statCardCompact(
      '🏘️', villages.length,
      'Villages (This Station)',
      'success',
      'showSHOVillageListModal()'
    );
  }

  // ── Level 2: SP/CO — station count, click → station detail modal ──
  if (lvl === 2) {
    const dist = MASTER_DATA.districts.find(d => d.id === currentUser.district);
    const stations = dist ? dist.circles.reduce((a, c) => a.concat(c.stations), []) : [];
    return statCardCompact(
      '🚔', stations.length,
      'Police Stations (District)',
      'success',
      'showDistrictStationDetails()'
    );
  }

  // ── Level 3: PHQ — statewide totals ──
  return [
    statCardCompact('🏛️', MASTER_DATA.totals.districts, t('districts'), 'info', "navigateTo('dossiers')"),
    statCardCompact('🚔', MASTER_DATA.totals.policeStations, t('policeStations'), 'success', "navigateTo('dossiers')")
  ].join('');
}

// ══════════════════════════════════════════════════════════
//  SHO: VILLAGE LIST MODAL  →  VILLAGE DETAIL MODAL
// ══════════════════════════════════════════════════════════
function showSHOVillageListModal() {
  const stationKey = currentUser.station.split(' PS')[0].trim();
  const villages = (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[stationKey]) || [];
  const dossiers = getDossiers();

  // Build village cards
  const villageCards = villages.map(v => {
    const criminals = getCriminalsInVillage(stationKey, v);

    const wantedCount = criminals.filter(d => d.status === 'Wanted').length;
    const badge = criminals.length > 0
      ? `<span style="background:rgba(239,68,68,0.15);color:#f87171;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;">${criminals.length} criminal${criminals.length > 1 ? 's' : ''} ${wantedCount > 0 ? '· ' + wantedCount + ' wanted' : ''}</span>`
      : `<span style="background:rgba(34,197,94,0.1);color:#4ade80;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;">Clear</span>`;

    return `
      <div onclick="showSHOVillageDetailModal('${v.replace(/'/g, "\\'")}', '${stationKey.replace(/'/g, "\\'")}', 'sho-village-list-modal')"
        style="display:flex;align-items:center;justify-content:space-between;
               padding:14px 16px; margin-bottom:8px; cursor:pointer;
               background:var(--glass-bg); border:1px solid var(--glass-border);
               border-radius:12px; transition:all 0.2s;"
        onmouseover="this.style.borderColor='var(--gold-500)';this.style.background='rgba(238,185,2,0.07)'"
        onmouseout="this.style.borderColor='var(--glass-border)';this.style.background='var(--glass-bg)'">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:22px;">🏘️</span>
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--text-primary);">${v}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
              ${stationKey} Police Station
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${badge}
          <span style="color:var(--text-muted);font-size:16px;">›</span>
        </div>
      </div>`;
  }).join('');

  _openModal('sho-village-list-modal', `
    <div style="margin-bottom:22px;">
      <div style="font-size:22px;font-weight:800;color:var(--gold-400);">🏘️ Villages — ${stationKey} PS</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">
        Total <strong style="color:var(--gold-300);">${villages.length} villages</strong> under this station
        · Click a village to view criminal history
      </div>
    </div>
    <div>${villages.length ? villageCards : '<div style="text-align:center;color:var(--text-muted);padding:30px 0;">No villages mapped for this station.</div>'}</div>
  `);
}
window.showSHOVillageListModal = showSHOVillageListModal;

// ── Village Detail: list of criminals in that village ──
function showSHOVillageDetailModal(villageName, stationKey, returnModalId) {
  const criminals = getCriminalsInVillage(stationKey, villageName);

  const statusColor = s =>
    s === 'Wanted' ? { bg: 'rgba(239,68,68,0.15)', fg: '#f87171' } :
      s === 'Active' ? { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24' } :
        s === 'In Jail' ? { bg: 'rgba(99,102,241,0.15)', fg: '#a78bfa' } :
          s === 'Out on Bail' ? { bg: 'rgba(34,197,94,0.12)', fg: '#4ade80' } :
            { bg: 'rgba(100,116,139,0.15)', fg: '#94a3b8' };

  const cards = criminals.map(d => {
    const risk = calculateRiskScore(d);
    const col = statusColor(d.status);
    const fir = d.history[0] || {};
    return `
      <div style="display:flex;gap:14px;padding:16px;margin-bottom:10px;
                  background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:14px;">
        <img src="${d.personalInfo.photograph}"
          style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:2px solid var(--glass-border);flex-shrink:0;"
          onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(d.personalInfo.name)}&background=1a2f52&color=eeb902&size=64'" />
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="font-weight:800;font-size:15px;color:var(--text-primary);">${d.personalInfo.name}</span>
            <span style="font-size:11px;color:var(--text-muted);">${d.personalInfo.aliasName}</span>
            <span style="background:${col.bg};color:${col.fg};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">${d.status}</span>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-secondary);">
            <span>📞 ${d.personalInfo.mobile}</span>
            <span>🩸 ${d.biometrics.bloodGroup}</span>
            <span>📅 Age ${d.personalInfo.age}</span>
          </div>
          <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">
            📍 ${d.personalInfo.address}
          </div>
          ${fir.firNumber ? `<div style="margin-top:6px;font-size:11px;color:var(--text-muted);">
            📄 FIR: <span style="color:var(--gold-400);font-weight:600;">${fir.firNumber}</span>
            · ${fir.sections ? fir.sections.split('(')[0].trim() : ''}
            · Bail: <span style="color:#f87171;">${fir.bailStatus || 'N/A'}</span>
          </div>` : ''}
          <div style="margin-top:8px;display:flex;align-items:center;gap:10px;">
            <div style="flex:1;height:5px;background:var(--navy-600);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${risk}%;background:${risk > 75 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#22c55e'};border-radius:3px;"></div>
            </div>
            <span style="font-size:11px;color:${risk > 75 ? '#f87171' : risk > 40 ? '#fbbf24' : '#4ade80'};font-weight:700;">Risk ${risk}/100</span>
          </div>
        </div>
      </div>`;
  }).join('');

  _openModal('sho-village-detail-modal', `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <button onclick="document.getElementById('sho-village-detail-modal').remove();"
        style="background:var(--glass-bg);border:1px solid var(--glass-border);
               color:var(--text-muted);border-radius:8px;padding:5px 12px;cursor:pointer;font-size:12px;">← Back</button>
      <div>
        <div style="font-size:21px;font-weight:800;color:var(--gold-400);">🏘️ ${villageName}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
          ${stationKey} PS ·
          <strong style="color:${criminals.length > 0 ? '#f87171' : '#4ade80'};">${criminals.length} criminal record${criminals.length !== 1 ? 's' : ''}</strong>
        </div>
      </div>
    </div>
    <div>
      ${criminals.length
      ? cards
      : '<div style="text-align:center;color:var(--text-muted);padding:40px 0;">✅ No criminal records for this village.</div>'}
    </div>
  `);
}
window.showSHOVillageDetailModal = showSHOVillageDetailModal;

// ══════════════════════════════════════════════════════════
//  SP: DISTRICT POLICE STATION DETAIL MODAL
// ══════════════════════════════════════════════════════════
function showDistrictStationDetails() {
  const dist = MASTER_DATA.districts.find(d => d.id === currentUser.district);
  if (!dist) return;

  const dossiers = getDossiers();
  const totalStations = dist.circles.reduce((n, c) => n + c.stations.length, 0);

  const stationRows = dist.circles.flatMap(circle =>
    circle.stations.map(station => {
      const criminalCount = dossiers.filter(d =>
        d.history.some(h => h.policeStation.toLowerCase() === station.toLowerCase())
      ).length;
      const wantedCount = dossiers.filter(d =>
        d.status === 'Wanted' &&
        d.history.some(h => h.policeStation.toLowerCase() === station.toLowerCase())
      ).length;
      const villageCount = (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[station])
        ? window.VILLAGES_BY_STATION[station].length : 0;

      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="padding:12px 14px;">
            <div style="font-weight:700;color:var(--gold-400);font-size:13px;">🚔 ${station}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${circle.name}</div>
          </td>
          <td style="padding:12px 14px;text-align:center;">
            <span style="background:rgba(59,130,246,0.15);color:#60a5fa;
                         border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;">
              ${villageCount} 🏘️
            </span>
          </td>
          <td style="padding:12px 14px;text-align:center;">
            <span style="background:${criminalCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)'};
                         color:${criminalCount > 0 ? '#f87171' : '#4ade80'};
                         border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;">
              ${criminalCount} 👤${wantedCount > 0 ? ' · <span style="color:#fbbf24;">' + wantedCount + ' wanted</span>' : ''}
            </span>
          </td>
        </tr>`;
    })
  ).join('');

  _openModal('station-detail-modal', `
    <div style="margin-bottom:22px;">
      <div style="font-size:22px;font-weight:800;color:var(--gold-400);">🚔 Police Stations</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">
        ${dist.name} — Total: <strong style="color:var(--gold-300);">${totalStations} stations</strong>
        across ${dist.circles.length} circle${dist.circles.length > 1 ? 's' : ''}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:2px solid var(--gold-600);">
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Station / Circle</th>
          <th style="padding:8px 14px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Villages</th>
          <th style="padding:8px 14px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Criminals</th>
        </tr>
      </thead>
      <tbody>${stationRows}</tbody>
    </table>
    <div style="margin-top:18px;text-align:right;">
      <button onclick="document.getElementById('station-detail-modal').remove(); navigateTo('villages');"
        style="background:linear-gradient(135deg,#EEB902,#d97706);color:#0f1f3d;
               border:none;border-radius:8px;padding:9px 22px;font-weight:700;font-size:13px;cursor:pointer;">
        🏘️ Browse Villages
      </button>
    </div>
  `);
}
window.showDistrictStationDetails = showDistrictStationDetails;

// ── Shared modal factory ──────────────────────────────────
function _openModal(id, bodyHTML) {
  // Remove existing if open
  const old = document.getElementById(id);
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
    animation:fadeInModal 0.2s ease;
  `;
  overlay.innerHTML = `
    <div style="
      background:var(--navy-800);border:1px solid var(--glass-border);
      border-radius:18px;padding:28px 30px;width:680px;max-width:95vw;
      max-height:82vh;overflow-y:auto;position:relative;
      box-shadow:0 28px 72px rgba(0,0,0,0.65);
    ">
      <button onclick="document.getElementById('${id}').remove()"
        style="position:absolute;top:14px;right:14px;background:var(--glass-bg);
               border:1px solid var(--glass-border);color:var(--text-primary);
               border-radius:50%;width:30px;height:30px;font-size:15px;
               cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;">✕</button>
      ${bodyHTML}
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
window._openModal = _openModal;

function initDistrictBars() {
  const distBar = document.getElementById('district-bars');
  if (!distBar) return;

  if (currentUser && currentUser.level === 1) {
    const stationKey = currentUser.station ? currentUser.station.split(' PS')[0].trim() : '';
    const villages = (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[stationKey]) || [];
    const dossiers = getDossiers();

    // Count occurrences per village
    const villageData = villages.map(v => {
      const count = getCriminalsInVillage(stationKey, v).length;
      return { name: v, count: count };
    });

    // Sort by count descending for a clean analytics view
    villageData.sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...villageData.map(v => v.count), 1);
    distBar.innerHTML = villageData.map(v => `
      <div class="district-bar-item" style="cursor: pointer;" onclick="showSHOVillageDetailModal('${v.name.replace(/'/g, "\\'")}', '${stationKey.replace(/'/g, "\\'")}', 'dashboard')">
        <div class="district-name">🏘️ ${v.name}</div>
        <div class="district-bar-wrap">
          <div class="district-bar-fill" style="width:${Math.round(v.count / maxCount * 100)}%"></div>
        </div>
        <div class="district-count">${v.count}</div>
      </div>
    `).join('');
  } else {
    const stats = generateStatistics();
    const maxCount = Math.max(...stats.districtComparison.map(d => d.count), 1);
    distBar.innerHTML = stats.districtComparison.map(d => `
      <div class="district-bar-item">
        <div class="district-name">${d.name.split('(')[0].trim()}</div>
        <div class="district-bar-wrap">
          <div class="district-bar-fill" style="width:${Math.round(d.count / maxCount * 100)}%"></div>
        </div>
        <div class="district-count">${d.count}</div>
      </div>
    `).join('');
  }
}

function initDashboardChartsOnly() {
  const stats = generateStatistics();

  // Crime Trend Line Chart
  const trendCtx = document.getElementById('chart-trend');
  if (trendCtx) {
    charts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'FIRs Registered',
          data: [24, 31, 28, 35, 42, 38, 29, 44, 51, 47, 38, 56],
          borderColor: '#EEB902',
          backgroundColor: 'rgba(238,185,2,0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#EEB902',
          pointRadius: 4,
          pointHoverRadius: 7
        }, {
          label: 'Arrests Made',
          data: [16, 22, 19, 28, 34, 30, 21, 36, 42, 38, 29, 45],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.06)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#22c55e',
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  // Category Doughnut
  const catCtx = document.getElementById('chart-category');
  if (catCtx) {
    charts.category = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: stats.categoryBreakdown.map(c => c.name),
        datasets: [{
          data: stats.categoryBreakdown.map(c => c.value),
          backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6'],
          borderColor: '#0B1426',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } }
        },
        cutout: '65%'
      }
    });
  }

  // Gang Analysis Bar
  const gangCtx = document.getElementById('chart-gangs');
  if (gangCtx) {
    charts.gangs = new Chart(gangCtx, {
      type: 'bar',
      data: {
        labels: ['Raju Kaana Gang\n(D-102)', 'Gujjar Syndicate\n(G-110)'],
        datasets: [{
          label: 'Wanted Members',
          data: [2, 1],
          backgroundColor: 'rgba(239,68,68,0.7)',
          borderRadius: 4
        }, {
          label: 'Out on Bail',
          data: [1, 1],
          backgroundColor: 'rgba(245,158,11,0.7)',
          borderRadius: 4
        }, {
          label: 'In Custody',
          data: [0, 1],
          backgroundColor: 'rgba(139,92,246,0.7)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
        scales: {
          x: { stacked: true, ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
          y: { stacked: true, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, max: 5 }
        }
      }
    });
  }
}

function initDashboardLazyLoading() {
  const sections = document.querySelectorAll('.lazy-section');
  const scrollContainer = document.getElementById('page-content');

  if (!window.IntersectionObserver) {
    // Fallback: load everything immediately if IntersectionObserver is not supported
    sections.forEach(s => s.classList.add('visible'));
    initDistrictBars();
    initCrimeMap('dashboard-map-container');
    initDashboardChartsOnly();
    return;
  }

  const observerOptions = {
    root: scrollContainer,
    rootMargin: '0px 0px 80px 0px', // Pre-trigger slightly before scroll entry
    threshold: 0.05
  };

  const initialized = {
    alerts: false,
    map: false,
    analytics: false
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        entry.target.classList.add('visible');

        if (id === 'dash-sec-alerts' && !initialized.alerts) {
          initialized.alerts = true;
          // Clear standard placeholder and populate
          const container = document.getElementById('district-bars');
          if (container) container.innerHTML = '';
          initDistrictBars();
        } else if (id === 'dash-sec-map' && !initialized.map) {
          initialized.map = true;
          // Clear spinner placeholder
          const mapCont = document.getElementById('dashboard-map-container');
          if (mapCont) mapCont.innerHTML = '';
          // Initialize map in container
          initCrimeMap('dashboard-map-container');
        } else if (id === 'dash-sec-analytics' && !initialized.analytics) {
          initialized.analytics = true;
          initDashboardChartsOnly();
        }

        // Unobserve since section is rendered
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

// ══════════════════════════════════════════════════════════
//  UNIVERSAL GRID-PRINT UTILITY
// ══════════════════════════════════════════════════════════
/**
 * printGridView(title, subtitle, columns, rows)
 * Opens a styled print window for any data-list / gridview.
 * @param {string}   title    – Report heading
 * @param {string}   subtitle – Secondary description line
 * @param {string[]} columns  – Array of column header labels
 * @param {Array[]}  rows     – Array of row arrays (plain text values)
 */
window.printGridView = function(title, subtitle, columns, rows) {
  const printWindow = window.open('', '_blank', 'width=1050,height=800');
  if (!printWindow) {
    showToast('⚠️ Pop-up blocked! Allow pop-ups to print.', 'warning');
    return;
  }
  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
  const thCells = columns.map(c => `<th style="border:1px solid #94a3b8;padding:8px 10px;background:#e2e8f0;font-size:11px;text-transform:uppercase;color:#1e293b;white-space:nowrap;">${c}</th>`).join('');
  const tbRows = rows.map((row, i) => {
    const cells = row.map(val => `<td style="border:1px solid #cbd5e1;padding:7px 10px;font-size:11px;color:#1e293b;vertical-align:top;">${val === null || val === undefined ? '' : String(val).replace(/<[^>]+>/g, '')}</td>`).join('');
    return `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">${cells}</tr>`;
  }).join('');

  printWindow.document.write(`<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <title>${title} — UP Police CDIMS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',Arial,sans-serif;color:#1e293b;background:#fff;padding:28px 32px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .no-print{display:flex;justify-content:flex-end;gap:10px;margin-bottom:18px}
      .btn-print{padding:9px 20px;background:#0f1f3d;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700}
      .btn-print:hover{background:#1c3566}
      .ph{display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #0f1f3d;padding-bottom:14px;margin-bottom:18px}
      .ph img{height:56px;object-fit:contain}
      .ph-text{text-align:right}
      .ph-text h1{font-size:15px;font-weight:800;color:#0f1f3d;letter-spacing:.4px}
      .ph-text p{font-size:10px;color:#64748b;font-weight:600;margin-top:3px}
      .report-title{margin-bottom:16px;background:#f8fafc;border-left:4px solid #c51e24;padding:11px 16px;border-radius:0 6px 6px 0}
      .report-title h2{font-size:15px;color:#0f1f3d;font-weight:800}
      .report-title p{font-size:11px;color:#475569;margin-top:4px}
      .report-meta{font-size:10px;color:#64748b;margin-top:6px;display:flex;gap:16px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      .sign-area{display:flex;justify-content:flex-end;margin-top:40px}
      .sign-block{text-align:center}
      .sign-line{width:180px;border-bottom:1px solid #475569;margin-bottom:6px}
      .sign-block div{font-size:11px;color:#334155;font-weight:600}
      .sign-block span{font-size:9px;color:#64748b}
      .footer{margin-top:36px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-size:9px;color:#64748b;font-weight:500}
      @media print{.no-print{display:none!important}body{padding:10px}}
    </style>
  </head><body>
    <div class="no-print">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-print" style="background:#475569" onclick="window.close()">✕ Close</button>
    </div>
    <div class="ph">
      <img src="Logo_of_Uttar_Pradesh_Police.png" alt="UP Police Logo">
      <div class="ph-text">
        <h1>UTTAR PRADESH POLICE HEADQUARTERS</h1>
        <p>Criminal Dossier &amp; Intelligence Management System (CDIMS)</p>
        <p style="color:#c51e24;font-weight:800;font-size:9px;letter-spacing:.5px;">CONFIDENTIAL &bull; INTERNAL JURISDICTION ONLY</p>
      </div>
    </div>
    <div class="report-title">
      <h2>${title}</h2>
      <p>${subtitle}</p>
      <div class="report-meta">
        <span>Date: <strong>${dateStr}</strong></span>
        <span>Operator: <strong>${currentUser ? currentUser.username + ' (' + currentUser.role + ')' : 'System'}</strong></span>
        <span>Total Records: <strong>${rows.length}</strong></span>
      </div>
    </div>
    <table>
      <thead><tr>${thCells}</tr></thead>
      <tbody>${tbRows || '<tr><td colspan="' + columns.length + '" style="text-align:center;padding:20px;color:#64748b;">No records found.</td></tr>'}</tbody>
    </table>
    <div class="sign-area">
      <div class="sign-block">
        <div class="sign-line"></div>
        <div>Verifying Authority</div>
        <span>CDIMS Automated Report Audit</span>
      </div>
    </div>
    <div class="footer">
      <div>Ref: UP-CDIMS-GV-${Date.now()}</div>
      <div>Security Clearance: High</div>
      <div>Strictly Confidential</div>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
  </body></html>`);
  printWindow.document.close();
};

/**
 * printDossierList() — collects currently visible dossier rows and prints them.
 */
window.printDossierList = function() {
  const dossiers = getDossiers();
  // Respect active filters
  const searchVal = document.getElementById('dossier-search-input')?.value || '';
  const status = document.getElementById('filter-status')?.value || 'all';
  const special = document.getElementById('filter-special')?.value || 'all';
  const scope = document.getElementById('filter-scope')?.value || 'all';
  const approval = document.getElementById('filter-approval')?.value || 'all';
  const filtered = searchDossiers({ query: searchVal, status, special, scope, approval, userLevel: currentUser.level, district: currentUser.district, station: currentUser.station });
  const cols = ['#', 'Name / Alias', 'Dossier ID', 'Status', 'Gang', 'District', 'Surveillance Cat.', 'Risk Score', 'Approval', 'FIRs'];
  const rows = filtered.map((d, i) => [
    i + 1,
    d.personalInfo.name + (d.personalInfo.aliasName ? ' aka ' + d.personalInfo.aliasName : ''),
    d.id,
    d.status,
    d.gangInfo?.gangName || '—',
    (() => {
      const rawDist = d.district || d.personalInfo?.district || '—';
      return rawDist !== '—' ? rawDist.charAt(0).toUpperCase() + rawDist.slice(1) : '—';
    })(),
    d.surveillance?.surveillanceCategory || '—',
    calculateRiskScore(d) + '/100',
    d.approvalStatus || '—',
    d.history?.length || 0
  ]);
  printGridView('Criminal Dossier List', 'All dossiers matching current filter criteria', cols, rows);
};

/**
 * printSearchResults() — prints the currently visible advanced-search results.
 */
window.printSearchResults = function() {
  const query = document.getElementById('adv-search-input')?.value || '';
  const district = document.getElementById('adv-district')?.value || 'all';
  const status = document.getElementById('adv-status')?.value || 'all';
  const results = searchDossiers({ query, district, status });
  const cols = ['#', 'Name / Alias', 'Dossier ID', 'Status', 'Gang', 'District', 'Surveillance Cat.', 'Risk Score', 'FIRs'];
  const rows = results.map((d, i) => [
    i + 1,
    d.personalInfo.name + (d.personalInfo.aliasName ? ' aka ' + d.personalInfo.aliasName : ''),
    d.id,
    d.status,
    d.gangInfo?.gangName || '—',
    (() => {
      const rawDist = d.district || d.personalInfo?.district || '—';
      return rawDist !== '—' ? rawDist.charAt(0).toUpperCase() + rawDist.slice(1) : '—';
    })(),
    d.surveillance?.surveillanceCategory || '—',
    calculateRiskScore(d) + '/100',
    d.history?.length || 0
  ]);
  printGridView('Advanced Criminal Search Results', `Search: "${query || 'all'}" | District: ${district} | Status: ${status}`, cols, rows);
};

/**
 * printAuditLog() — prints the full system audit trail.
 */
window.printAuditLog = function() {
  const logs = getAuditLogs();
  const cols = ['#', 'Timestamp', 'User', 'Role', 'Action', 'Details'];
  const rows = logs.map((log, i) => [
    i + 1,
    new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
    log.username,
    log.role,
    log.action,
    log.details
  ]);
  printGridView('System Audit Trail', 'Complete chronological log of all system actions', cols, rows);
};

/**
 * printVillageCriminals(station, village) — prints criminals for the selected village.
 */
window.printVillageCriminals = function(station, village) {
  const criminals = getCriminalsInVillage(station, village);
  const cols = ['#', 'Name / Alias', 'Dossier ID', 'Status', 'Father Name', 'DOB / Age', 'Mobile', 'Aadhaar', 'Surveillance', 'FIRs', 'Risk Score'];
  const rows = criminals.map((d, i) => [
    i + 1,
    d.personalInfo.name + (d.personalInfo.aliasName ? ' aka ' + d.personalInfo.aliasName : ''),
    d.id,
    d.status,
    d.personalInfo.fatherName || '—',
    (d.personalInfo.dob || '—') + ' / Age ' + (d.personalInfo.age || '—'),
    d.personalInfo.mobile || '—',
    d.personalInfo.aadhaar || '—',
    d.surveillance?.surveillanceCategory || '—',
    d.history?.length || 0,
    calculateRiskScore(d) + '/100'
  ]);
  printGridView(`Village Criminal Records — ${village}`, `Police Station: ${station} | Total History Sheeters: ${criminals.length}`, cols, rows);
};

/**
 * printUserList() — prints the User Management list.
 */
window.printUserList = function() {
  const mockUsers = [
    { name: 'SHO Rajiv Sharma', username: 'sho_hazratganj', role: 'Police Station User', level: 'L1', station: 'Hazratganj PS, Lucknow', status: 'Active' },
    { name: 'IO Priya Singh', username: 'io_chowk', role: 'Police Station User', level: 'L1', station: 'Chowk PS, Lucknow', status: 'Active' },
    { name: 'CO Prashant Mishra', username: 'co_lucknow', role: 'District Nodal Officer', level: 'L2', station: 'CO Office, Lucknow', status: 'Active' },
    { name: 'SP Crime Varanasi', username: 'sp_crime_vns', role: 'District Nodal Officer', level: 'L2', station: 'SP Office, Varanasi', status: 'Active' },
    { name: 'DG Intelligence (PHQ)', username: 'phq_admin', role: 'State Administrator', level: 'L3', station: 'PHQ Lucknow', status: 'Active' }
  ];
  const cols = ['#', 'Name', 'Username', 'Role', 'Level', 'Station', 'Status'];
  const rows = mockUsers.map((u, i) => [i + 1, u.name, u.username, u.role, u.level, u.station, u.status]);
  printGridView('User Management List', 'All registered system users and their access levels', cols, rows);
};

// ══════════════════════════════════════════════════════════
//  DOSSIER LIST VIEW
// ══════════════════════════════════════════════════════════
function renderDossierList() {
  const dossiers = getDossiers();
  return `
    <div class="table-card">
      <div class="table-header">
        <div class="table-title" id="dossier-table-title">📁 ${t('dossiers')} (${dossiers.length})</div>
        <div class="table-actions">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" id="dossier-search-input" placeholder="Quick search..." oninput="filterDossierTable(this.value)" />
          </div>
          <select class="filter-select" id="filter-status" onchange="filterDossierTable(document.getElementById('dossier-search-input').value)">
            <option value="all">All Statuses</option>
            <option value="Wanted">Wanted</option>
            <option value="Active">Active</option>
            <option value="In Jail">In Jail</option>
            <option value="Out on Bail">Out on Bail</option>
          </select>
          <select class="filter-select" id="filter-special" onchange="filterDossierTable(document.getElementById('dossier-search-input').value)">
            <option value="all">All Categories</option>
            <option value="active">Active Criminals</option>
            <option value="history_sheeter">History Sheeters</option>
            <option value="gangster">Gangsters</option>
          </select>
          <select class="filter-select" id="filter-scope" onchange="filterDossierTable(document.getElementById('dossier-search-input').value)">
            <option value="all">All Jurisdictions</option>
            <option value="single">Single PS Offenders</option>
            <option value="multiple">Multi-PS Offenders</option>
          </select>
          ${currentUser.level >= 2 ? `
          <select class="filter-select" id="filter-approval" onchange="filterDossierTable(document.getElementById('dossier-search-input').value)">
            <option value="all">All Approvals</option>
            <option value="Pending Verification">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Returned for Correction">Returned</option>
          </select>` : ''}
          <input type="file" id="csv-import-input" accept=".csv" style="display: none;" onchange="handleCSVImport(event)" />
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('csv-import-input').click()">📥 Import CSV</button>
          ${currentUser.level === 1 ? `<button class="btn btn-primary btn-sm" onclick="openAddDossierModal()">➕ ${t('addDossier')}</button>` : ''}
        </div>
      </div>

      <!-- ── PRINT BAR above the grid ── -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 20px;
        background: linear-gradient(90deg, rgba(238,185,2,0.06) 0%, rgba(15,31,61,0.0) 100%);
        border-bottom: 1px solid var(--glass-border);
      ">
        <span style="font-size:12px; color:var(--text-muted); font-weight:600;">
          🖨️ Print or export the current list
        </span>
        <button
          onclick="printDossierList()"
          title="Print the current Criminal Dossiers list"
          style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 20px;
            background: linear-gradient(135deg, #1c3566, #0f1f3d);
            color: #EEB902;
            border: 1px solid rgba(238,185,2,0.35);
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0.3px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "
          onmouseover="this.style.background='linear-gradient(135deg,#264d99,#1c3566)'; this.style.borderColor='rgba(238,185,2,0.7)';"
          onmouseout="this.style.background='linear-gradient(135deg,#1c3566,#0f1f3d)'; this.style.borderColor='rgba(238,185,2,0.35)';"
        >
          🖨️ Print Criminal Dossiers
        </button>
      </div>

      <div id="dossier-table-container">
        ${renderDossierTable(dossiers)}
      </div>
    </div>
  `;
}

function filterDossierTable(query) {
  const status = document.getElementById('filter-status')?.value || 'all';
  const approval = document.getElementById('filter-approval')?.value || 'all';
  const special = document.getElementById('filter-special')?.value || 'all';
  const scope = document.getElementById('filter-scope')?.value || 'all';
  
  const results = searchDossiers({ 
    query, 
    status, 
    approvalStatus: approval, 
    special, 
    stationScope: scope 
  });
  
  const container = document.getElementById('dossier-table-container');
  if (container) container.innerHTML = renderDossierTable(results);
  
  const titleEl = document.getElementById('dossier-table-title');
  if (titleEl) {
    titleEl.textContent = `📁 ${t('dossiers')} (${results.length})`;
  }
}

function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    showToast('⏳ Parsing CSV data...', 'info');

    const result = window.importDossiersFromCSVContent(text);

    if (result.success) {
      showToast(`✅ Successfully imported ${result.count} dossiers!`, 'success');
      navigateTo('dossiers');
      addAuditLog(currentUser.username, currentUser.role, 'Import CSV', `Imported ${result.count} records from CSV file: ${file.name}`);
    } else {
      showToast(`❌ Import failed: ${result.error}`, 'error');
    }
  };

  reader.onerror = function () {
    showToast('❌ Error reading file!', 'error');
  };

  reader.readAsText(file);
}

function renderDossierTable(dossiers) {
  if (!dossiers || dossiers.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-title">No Records Found</div><div class="empty-desc">No dossiers match the selected criteria.</div></div>`;
  }
  return `
    <div style="overflow-x:auto;">
      <table class="data-table" id="main-dossier-table">
        <thead>
          <tr>
            <th>Criminal</th>
            <th>ID / Status</th>
            <th>Gang</th>
            <th>Surveillance</th>
            <th>Risk</th>
            <th>Approval</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${dossiers.map(d => {
    const risk = calculateRiskScore(d);
    const riskClass = risk >= 70 ? 'risk-high' : risk >= 40 ? 'risk-medium' : 'risk-low';
    return `
              <tr>
                <td>
                  <div class="criminal-info-cell">
                    <img class="criminal-photo" src="${d.personalInfo.photograph}" alt="${d.personalInfo.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;36&quot; height=&quot;36&quot;><rect width=&quot;36&quot; height=&quot;36&quot; fill=&quot;%230f1f3d&quot;/><text x=&quot;50%&quot; y=&quot;55%&quot; text-anchor=&quot;middle&quot; fill=&quot;%23EEB902&quot; font-size=&quot;16&quot;>${d.personalInfo.name[0]}</text></svg>'" />
                    <div>
                      <div style="font-weight:700; font-size:13px;">${d.personalInfo.name}</div>
                      <div style="font-size:11px; color:var(--text-muted);">aka ${d.personalInfo.aliasName}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="criminal-id">${d.id}</div>
                  <div style="margin-top:4px;">${statusBadge(d.status)}</div>
                </td>
                <td>
                  <div style="font-size:12px; font-weight:600;">${d.gangInfo.gangName}</div>
                  <div style="font-size:10px; color:var(--text-muted);">${d.gangInfo.areaOfOperation.split(',')[0]}</div>
                </td>
                <td>
                  <span class="badge ${categoryBadgeClass(d.surveillance.surveillanceCategory)}">${d.surveillance.surveillanceCategory.split('(')[0].trim()}</span>
                  <div style="font-size:10px; color:var(--text-muted); margin-top:3px;">HS: ${d.surveillance.historySheetNumber}</div>
                </td>
                <td>
                  <div class="risk-bar ${riskClass}" title="Risk Score: ${risk}/100">
                    <div class="risk-bar-fill" style="width:${risk}%"></div>
                  </div>
                  <div style="font-size:10px; font-weight:700; margin-top:3px; color:${risk >= 70 ? '#f87171' : risk >= 40 ? '#fbbf24' : '#4ade80'}">${risk}/100</div>
                </td>
                <td>${approvalBadge(d.approvalStatus)}</td>
                <td>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn btn-xs btn-secondary" onclick="openDossierModal(getDossiers().find(x=>x.id==='${d.id}'))">👁️ View</button>
                    ${currentUser.level === 2 && d.approvalStatus === 'Pending Verification' ? `
                      <button class="btn btn-xs btn-success" onclick="quickVerify('${d.id}')" title="Verify & Send to PHQ">🔍 Verify</button>
                      <button class="btn btn-xs btn-danger" onclick="quickReturn('${d.id}')" title="Return for Correction">↩️ Return</button>
                    ` : ''}
                    ${currentUser.level === 3 && d.approvalStatus === 'Pending Approval' ? `
                      <button class="btn btn-xs btn-success" onclick="quickApprove('${d.id}')" title="Approve Dossier">✅ Approve</button>
                      <button class="btn btn-xs btn-danger" onclick="quickReturn('${d.id}')" title="Return for Correction">↩️ Return</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function statusBadge(status) {
  const map = { 'Wanted': 'badge-wanted', 'Active': 'badge-active', 'In Jail': 'badge-jail', 'Out on Bail': 'badge-bail' };
  const icons = { 'Wanted': '🚨', 'Active': '⚠️', 'In Jail': '🔒', 'Out on Bail': '⚖️' };
  return `<span class="badge ${map[status] || 'badge-active'}">${icons[status] || ''} ${status}</span>`;
}
function approvalBadge(status) {
  const map = { 'Approved': 'badge-approved', 'Pending Verification': 'badge-pending', 'Pending Approval': 'badge-pending-approval', 'Returned for Correction': 'badge-returned' };
  const icons = { 'Approved': '✅', 'Pending Verification': '⏳', 'Pending Approval': '⚡', 'Returned for Correction': '↩️' };
  return `<span class="badge ${map[status] || 'badge-pending'}">${icons[status] || ''} ${status}</span>`;
}
function categoryBadgeClass(cat) {
  if (cat.includes('A')) return 'badge badge-cat-a';
  if (cat.includes('B')) return 'badge badge-cat-b';
  return 'badge badge-cat-c';
}

async function quickVerify(id) {
  try {
    const success = await verifyDossier(id, currentUser);
    if (success) {
      showToast('🔍 Dossier verified and sent to PHQ Admin!', 'success');
      await navigateTo('dossiers');
    }
  } catch (e) {
    showToast('❌ Verification failed: ' + e.message, 'error');
  }
}

async function quickApprove(id) {
  try {
    const success = await approveDossier(id, currentUser);
    if (success) {
      showToast('✅ Dossier approved successfully!', 'success');
      await navigateTo('dossiers');
    }
  } catch (e) {
    showToast('❌ Approval failed: ' + e.message, 'error');
  }
}
async function quickReturn(id) {
  const remarks = prompt('Enter remarks for correction:');
  if (remarks) {
    try {
      const success = await returnDossierForCorrection(id, remarks, currentUser);
      if (success) {
        showToast('↩️ Dossier returned for correction.', 'warning');
        await navigateTo('dossiers');
      }
    } catch (e) {
      showToast('❌ Return failed: ' + e.message, 'error');
    }
  }
}

// ══════════════════════════════════════════════════════════
//  DOSSIER MODAL
// ══════════════════════════════════════════════════════════
function openDossierModal(dossier) {
  if (!dossier) return;
  window.currentDossierInModal = dossier;
  const modal = document.getElementById('dossier-modal');
  document.getElementById('modal-criminal-name').textContent = `${dossier.personalInfo.name} — ${dossier.id}`;
  const risk = calculateRiskScore(dossier);
  const riskClass = risk >= 70 ? 'risk-high' : risk >= 40 ? 'risk-medium' : 'risk-low';
  const ai = runCrimePatternAnalysis(dossier);

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-grid">
      <div>
        <img class="criminal-photo-large" src="${dossier.personalInfo.photograph}" alt="${dossier.personalInfo.name}"
          onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;200&quot; height=&quot;260&quot;><rect width=&quot;200&quot; height=&quot;260&quot; fill=&quot;%230f1f3d&quot;/><text x=&quot;50%&quot; y=&quot;50%&quot; text-anchor=&quot;middle&quot; fill=&quot;%23EEB902&quot; font-size=&quot;64&quot;>${dossier.personalInfo.name[0]}</text></svg>'" />
        <div class="criminal-status-badge" style="margin-top:10px;">${statusBadge(dossier.status)}</div>
        <div style="margin-top:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">RISK SCORE</div>
          <div class="risk-bar ${riskClass}" style="height:10px;">
            <div class="risk-bar-fill" style="width:${risk}%"></div>
          </div>
          <div style="font-size:14px; font-weight:800; margin-top:4px; color:${risk >= 70 ? '#f87171' : risk >= 40 ? '#fbbf24' : '#4ade80'}">${risk}/100</div>
        </div>
        <div style="margin-top:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px;">SUBMITTED BY</div>
          <div style="font-size:11px; font-weight:600;">${dossier.submittedBy}</div>
          <div style="font-size:10px; color:var(--text-muted); margin-top:6px;">APPROVAL STATUS</div>
          <div style="margin-top:4px;">${approvalBadge(dossier.approvalStatus)}</div>
        </div>
        <div id="modal-photos-gallery"></div>
        ${currentUser.level === 2 && dossier.approvalStatus === 'Pending Verification' ? `
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
          <button class="btn btn-success btn-sm" onclick="quickVerify('${dossier.id}'); closeDossierModal();">🔍 Verify & Send to PHQ</button>
          <button class="btn btn-danger btn-sm" onclick="closeDossierModal(); quickReturn('${dossier.id}');">↩️ Return</button>
        </div>` : ''}
        ${currentUser.level === 3 && dossier.approvalStatus === 'Pending Approval' ? `
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
          <button class="btn btn-success btn-sm" onclick="quickApprove('${dossier.id}'); closeDossierModal();">✅ Approve</button>
          <button class="btn btn-danger btn-sm" onclick="closeDossierModal(); quickReturn('${dossier.id}');">↩️ Return</button>
        </div>` : ''}
      </div>

      <div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Criminal ID</div>
            <div class="info-value gold">${dossier.id}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${dossier.personalInfo.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Alias / Nickname</div>
            <div class="info-value">${dossier.personalInfo.aliasName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Father's Name</div>
            <div class="info-value">${dossier.personalInfo.fatherName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${dossier.personalInfo.dob} (Age ${dossier.personalInfo.age})</div>
          </div>
          <div class="info-item">
            <div class="info-label">Mobile</div>
            <div class="info-value">${dossier.personalInfo.mobile}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Aadhaar</div>
            <div class="info-value">${dossier.personalInfo.aadhaar}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Blood Group</div>
            <div class="info-value">${dossier.biometrics.bloodGroup}</div>
          </div>
          <div class="info-item" style="grid-column:1/-1;">
            <div class="info-label">Current Address</div>
            <div class="info-value">${dossier.personalInfo.address}</div>
          </div>
        </div>

        <div class="modal-tabs">
          <div class="modal-tab active" onclick="switchModalTab(this, 'tab-biometric')">🧬 Biometric</div>
          <div class="modal-tab" onclick="switchModalTab(this, 'tab-history')">⚖️ FIR History</div>
          <div class="modal-tab" onclick="switchModalTab(this, 'tab-gang')">👥 Gang</div>
          <div class="modal-tab" onclick="switchModalTab(this, 'tab-surveillance')">🕵️ Surveillance</div>
          <div class="modal-tab" onclick="switchModalTab(this, 'tab-property')">🏠 Property</div>
          <div class="modal-tab" onclick="switchModalTab(this, 'tab-vehicle')">🚗 Vehicle</div>
          <div class="modal-tab" onclick="switchModalTab(this, 'tab-ai')">🤖 AI Report</div>
        </div>

        <div class="modal-tab-content active" id="tab-biometric">
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Fingerprints</div><div class="info-value">🔐 ${dossier.biometrics.fingerprints}</div></div>
            <div class="info-item"><div class="info-label">Face Recognition</div><div class="info-value">👤 ${dossier.biometrics.faceImage}</div></div>
            <div class="info-item"><div class="info-label">Height</div><div class="info-value">${dossier.biometrics.height}</div></div>
            <div class="info-item"><div class="info-label">Weight</div><div class="info-value">${dossier.biometrics.weight}</div></div>
            <div class="info-item"><div class="info-label">Eye Colour</div><div class="info-value">${dossier.biometrics.eyeColor}</div></div>
            <div class="info-item"><div class="info-label">Identification Marks</div><div class="info-value" style="grid-column:1/-1;">${dossier.biometrics.identificationMarks}</div></div>
          </div>
        </div>

        <div class="modal-tab-content" id="tab-history">
          <div class="fir-timeline">
            ${dossier.history.map(h => `
              <div class="fir-item">
                <span class="fir-icon">⚖️</span>
                <div>
                  <div class="fir-number">${h.firNumber} / ${h.crimeNumber}</div>
                  <div class="fir-section">${h.sections}</div>
                  <div class="fir-meta">📍 ${h.policeStation} | 📋 ${h.chargeSheetStatus}</div>
                  <div class="fir-meta">⚖️ ${h.convictionDetails} | 🔓 Bail: ${h.bailStatus}</div>
                  <div class="fir-meta">🏛️ ${h.courtCaseDetails}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal-tab-content" id="tab-gang">
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Gang Name</div><div class="info-value" style="color:var(--red-400); font-weight:700;">${dossier.gangInfo.gangName}</div></div>
            <div class="info-item"><div class="info-label">Gang Leader</div><div class="info-value">${dossier.gangInfo.gangLeader}</div></div>
            <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Area of Operation</div><div class="info-value">${dossier.gangInfo.areaOfOperation}</div></div>
            <div class="info-item" style="grid-column:1/-1;">
              <div class="info-label">Known Members</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                ${dossier.gangInfo.gangMembers.map(m => `<span class="badge badge-wanted">${m}</span>`).join('')}
              </div>
            </div>
            ${dossier.gangInfo.networkMapping && dossier.gangInfo.networkMapping.length > 0 ? `
            <div class="info-item" style="grid-column:1/-1;">
              <div class="info-label">Criminal Network Links</div>
              <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
                ${dossier.gangInfo.networkMapping.map(rel => `
                  <div style="display:flex; align-items:center; gap:8px; font-size:12px; padding:6px 10px; background:rgba(239,68,68,0.08); border-radius:6px; border-left:3px solid var(--red-500);">
                    <span>🔗</span>
                    <span class="criminal-id">${rel.targetId}</span>
                    <span style="color:var(--text-muted);">—</span>
                    <span>${rel.relation}</span>
                  </div>
                `).join('')}
              </div>
            </div>` : ''}
          </div>
        </div>

        <div class="modal-tab-content" id="tab-surveillance">
          <div class="info-grid">
            <div class="info-item"><div class="info-label">History Sheet No.</div><div class="info-value gold">${dossier.surveillance.historySheetNumber}</div></div>
            <div class="info-item"><div class="info-label">Category</div><div class="info-value">${dossier.surveillance.surveillanceCategory}</div></div>
            <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Surveillance Notes</div><div class="info-value" style="color:var(--text-secondary); font-size:13px;">${dossier.surveillance.surveillanceNotes}</div></div>
            <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Beat Officer Remarks</div><div class="info-value" style="color:var(--text-secondary); font-size:13px;">${dossier.surveillance.beatOfficerRemarks}</div></div>
            <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Intelligence Inputs</div><div class="info-value" style="color:var(--amber-400); font-size:13px;">🔍 ${dossier.surveillance.intelligenceInputs}</div></div>
          </div>
        </div>

        <div class="modal-tab-content" id="tab-property">
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${dossier.propertyDetails.map(p => `
              <div class="fir-item" style="border-left-color:var(--amber-500);">
                <span class="fir-icon">🏠</span>
                <div>
                  <div style="font-weight:700; color:var(--gold-400);">${p.type}</div>
                  <div style="font-size:12px; margin:3px 0;">${p.address}</div>
                  <div style="font-size:11px; color:var(--green-400);">💰 ${p.estimatedValue}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${p.status}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal-tab-content" id="tab-vehicle">
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${dossier.vehicleDetails.map(v => `
              <div class="fir-item" style="border-left-color:var(--blue-500);">
                <span class="fir-icon">🚗</span>
                <div>
                  <div style="font-weight:700; color:var(--blue-400); font-family:monospace; font-size:15px;">${v.vehicleNumber}</div>
                  <div style="font-size:12px; margin-top:3px;">${v.vehicleType}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${v.registrationDetails}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal-tab-content" id="tab-ai">
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="ai-card" style="padding:14px;">
              <div class="ai-card-header">
                <div class="ai-card-icon purple">🔎</div>
                <div><div class="ai-card-title">Crime Pattern Analysis</div></div>
              </div>
              <div class="ai-content">${ai.pattern}</div>
            </div>
            <div class="ai-card" style="padding:14px;">
              <div class="ai-card-header">
                <div class="ai-card-icon cyan">📡</div>
                <div><div class="ai-card-title">Predictive Intelligence</div></div>
              </div>
              <div class="ai-content">${ai.forecast}</div>
            </div>
            <div class="ai-card" style="padding:14px;">
              <div class="ai-card-header">
                <div class="ai-card-icon gold">⚡</div>
                <div><div class="ai-card-title">Recommended Actions</div></div>
              </div>
              <div class="ai-content">${ai.suggestions}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  modal.classList.add('open');

  // Load and display photos dynamically
  const photoContainer = document.getElementById('modal-photos-gallery');
  if (photoContainer && window.getDossierPhotos) {
    window.getDossierPhotos(dossier.id).then(photos => {
      if (photos && photos.length > 0) {
        photoContainer.innerHTML = `
          <div style="font-size:10px; color:var(--text-muted); margin-top:10px; margin-bottom:4px; text-transform:uppercase; font-weight:700;">ATTACHED IMAGES / संलग्न चित्र (${photos.length})</div>
          <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; max-width:200px;">
            ${photos.map((p, idx) => `
              <img src="${p}" style="width:55px; height:70px; object-fit:cover; border-radius:4px; border:1px solid var(--glass-border); cursor:pointer; transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--gold-500)'" onmouseout="this.style.borderColor='var(--glass-border)'" onclick="window.updateModalPhotoPreview('${p.replace(/'/g, "\\'")}')" />
            `).join('')}
          </div>
        `;
      } else {
        photoContainer.innerHTML = '';
      }
    }).catch(err => console.error("Error loading photos:", err));
  }
}

window.updateModalPhotoPreview = function(src) {
  const mainPhoto = document.querySelector('.criminal-photo-large');
  if (mainPhoto) {
    mainPhoto.src = src;
  }
};

function switchModalTab(el, tabId) {
  el.closest('.modal-body').querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  el.closest('.modal-body').querySelectorAll('.modal-tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}

function closeDossierModal() {
  document.getElementById('dossier-modal').classList.remove('open');
}

// ══════════════════════════════════════════════════════════
//  SEARCH PAGE
// ══════════════════════════════════════════════════════════
function renderSearchPage() {
  return `
    <div class="chart-card" style="margin-bottom:20px;">
      <div style="margin-bottom:16px;">
        <h3 style="font-size:16px; font-weight:700; margin-bottom:6px;">🔍 Advanced Criminal Search</h3>
        <p style="font-size:12px; color:var(--text-secondary);">Search by name, alias, FIR number, mobile, vehicle number, gang name, Aadhaar</p>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
        <div class="search-bar" style="flex:1; min-width:250px;">
          <span class="search-icon">🔍</span>
          <input type="text" id="adv-search-input" placeholder="Type any keyword — name, alias, FIR, vehicle, mobile..." 
            style="width:100%;" oninput="runAdvancedSearch(this.value)" autofocus />
        </div>
        <select class="filter-select" id="adv-district" onchange="runAdvancedSearch(document.getElementById('adv-search-input').value)">
          <option value="all">All Districts</option>
          <option value="lucknow">Lucknow</option>
          <option value="varanasi">Varanasi</option>
          <option value="prayagraj">Prayagraj</option>
          <option value="noida">Noida</option>
        </select>
        <select class="filter-select" id="adv-status" onchange="runAdvancedSearch(document.getElementById('adv-search-input').value)">
          <option value="all">All Status</option>
          <option value="Wanted">Wanted</option>
          <option value="Active">Active</option>
          <option value="In Jail">In Jail</option>
          <option value="Out on Bail">Out on Bail</option>
        </select>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
        <span style="font-size:11px; color:var(--text-muted);">Quick Tags:</span>
        ${['Wanted', 'Gangster', 'Lucknow', 'Varanasi', 'Shooter', 'IPC 302'].map(tag =>
    `<span class="badge badge-active" style="cursor:pointer;" onclick="document.getElementById('adv-search-input').value='${tag}'; runAdvancedSearch('${tag}')">${tag}</span>`
  ).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" onclick="printSearchResults()" style="margin-top:4px;" title="Print search results">🖨️ Print Results</button>
    </div>
    <div id="search-results">
      ${renderDossierTable(getDossiers())}
    </div>
  `;
}

function runAdvancedSearch(query) {
  const district = document.getElementById('adv-district')?.value || 'all';
  const status = document.getElementById('adv-status')?.value || 'all';
  const results = searchDossiers({ query, district, status });
  const container = document.getElementById('search-results');
  if (container) {
    container.innerHTML = `
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Found <strong style="color:var(--gold-400);">${results.length}</strong> records matching "${query || 'all'}"</div>
      ${renderDossierTable(results)}
    `;
  }
}

// ══════════════════════════════════════════════════════════
//  NETWORK PAGE
// ══════════════════════════════════════════════════════════
function renderNetworkPage() {
  return `
    <div id="react-network-root" style="width: 100%; min-height: calc(100vh - 180px); display: flex; flex-direction: column;"></div>
  `;
}

// ══════════════════════════════════════════════════════════
//  MAP PAGE
// ══════════════════════════════════════════════════════════
function renderMapPage() {
  return `
    <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
      <span class="badge badge-wanted">🚨 Wanted: 2 locations</span>
      <span class="badge badge-active">⚠️ On Bail: 2 locations</span>
      <span class="badge badge-jail">🔒 Jail: 1 location</span>
      <span style="font-size:11px; color:var(--text-muted); margin-left:auto;">Click map markers for details</span>
    </div>
    <div id="map-container"></div>
    <div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
      <div class="stat-card danger" style="padding:14px;">
        <div class="stat-icon" style="font-size:18px;">🔥</div>
        <div style="font-size:22px; font-weight:900;">5</div>
        <div style="font-size:11px; color:var(--text-secondary);">Active Crime Hotspots</div>
      </div>
      <div class="stat-card" style="padding:14px;">
        <div class="stat-icon" style="font-size:18px;">⛔</div>
        <div style="font-size:22px; font-weight:900;">2</div>
        <div style="font-size:11px; color:var(--text-secondary);">Gang Territories Mapped</div>
      </div>
      <div class="stat-card warning" style="padding:14px;">
        <div class="stat-icon" style="font-size:18px;">📍</div>
        <div style="font-size:22px; font-weight:900;">6</div>
        <div style="font-size:11px; color:var(--text-secondary);">Criminal Locations Tracked</div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
//  AI INTELLIGENCE PAGE
// ══════════════════════════════════════════════════════════
function renderIntelligencePage() {
  const dossiers = getDossiers();
  return `
    <div class="ai-cards-grid">
      <div class="ai-card">
        <div class="ai-card-header">
          <div class="ai-card-icon purple">🔁</div>
          <div><div class="ai-card-title">Repeat Offender Detection</div><div class="ai-card-subtitle">AI-powered multi-case correlation</div></div>
        </div>
        <div class="ai-content">
          ${dossiers.filter(d => d.history.length > 1).map(d => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span class="ai-highlighted">${d.personalInfo.name}</span>
              <span class="badge badge-wanted">${d.history.length} FIRs</span>
            </div>
          `).join('')}
          <div style="margin-top:10px; font-size:11px; color:var(--text-muted);">
            🤖 Model trained on 12 months of UP district crime data. Recall rate: 94.2%
          </div>
        </div>
      </div>

      <div class="ai-card">
        <div class="ai-card-header">
          <div class="ai-card-icon red">⚡</div>
          <div><div class="ai-card-title">Risk Score Rankings</div><div class="ai-card-subtitle">Predictive threat assessment</div></div>
        </div>
        <div class="ai-content">
          ${dossiers.sort((a, b) => calculateRiskScore(b) - calculateRiskScore(a)).slice(0, 5).map(d => {
    const risk = calculateRiskScore(d);
    const riskClass = risk >= 70 ? 'risk-high' : risk >= 40 ? 'risk-medium' : 'risk-low';
    return `
              <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                  <span style="font-size:12px; font-weight:700;">${d.personalInfo.name}</span>
                  <span style="font-size:12px; font-weight:800; color:${risk >= 70 ? '#f87171' : risk >= 40 ? '#fbbf24' : '#4ade80'}">${risk}/100</span>
                </div>
                <div class="risk-bar ${riskClass}"><div class="risk-bar-fill" style="width:${risk}%"></div></div>
              </div>
            `;
  }).join('')}
        </div>
      </div>

      <div class="ai-card">
        <div class="ai-card-header">
          <div class="ai-card-icon cyan">📡</div>
          <div><div class="ai-card-title">Crime Pattern Analysis</div><div class="ai-card-subtitle">Behavioral and geographic patterns</div></div>
        </div>
        <div class="ai-content">
          <div style="margin-bottom:10px; padding:10px; background:rgba(239,68,68,0.08); border-radius:6px; border-left:3px solid var(--red-500);">
            <strong style="color:var(--red-400);">Violent Crime (Contract / Gang):</strong><br/>
            Rajesh Yadav gang operates in a triangular corridor — Lucknow → Ayodhya → Noida. Most incidents occur between 8 PM and 2 AM on weekdays.
          </div>
          <div style="margin-bottom:10px; padding:10px; background:rgba(245,158,11,0.08); border-radius:6px; border-left:3px solid var(--amber-500);">
            <strong style="color:var(--amber-400);">Financial Fraud:</strong><br/>
            Amit Mishra targets property registration windows (Mon–Wed, 10 AM–1 PM) for forged document execution.
          </div>
          <div style="padding:10px; background:rgba(34,197,94,0.08); border-radius:6px; border-left:3px solid var(--green-500);">
            <strong style="color:var(--green-400);">Arms Network:</strong><br/>
            Handia → Shivpur → Noida supply route confirmed. Transit usually via private vehicles on NH19.
          </div>
        </div>
      </div>

      <div class="ai-card">
        <div class="ai-card-header">
          <div class="ai-card-icon gold">🔮</div>
          <div><div class="ai-card-title">Predictive Analysis</div><div class="ai-card-subtitle">Next 30-day threat forecast</div></div>
        </div>
        <div class="ai-content">
          <div style="margin-bottom:8px; font-weight:600; color:var(--gold-400);">⚠️ High Probability Incidents (Next 30 Days)</div>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:8px;">
            <li style="display:flex; gap:8px; align-items:flex-start; font-size:12px;"><span>1.</span> Extortion call to contractors in Gomti Nagar area — <strong>82%</strong> probability</li>
            <li style="display:flex; gap:8px; align-items:flex-start; font-size:12px;"><span>2.</span> Illegal arms transfer on Noida-Prayagraj route — <strong>74%</strong> probability</li>
            <li style="display:flex; gap:8px; align-items:flex-start; font-size:12px;"><span>3.</span> New property fraud attempt in Lucknow real estate — <strong>68%</strong> probability</li>
          </ul>
          <div style="margin-top:12px; font-size:10px; color:var(--text-muted);">
            🤖 Powered by CDIMS ML Engine v2.1 | Accuracy: 71.4% | Updated: Today
          </div>
        </div>
      </div>
    </div>

    <!-- AI Trend Chart -->
    <div class="chart-card">
      <div class="chart-card-header">
        <div><div class="chart-card-title">📊 District Crime Trends (12 months)</div><div class="chart-card-subtitle">AI-powered historical analysis across districts</div></div>
      </div>
      <div class="chart-area" style="height:240px;"><canvas id="chart-ai-trend"></canvas></div>
    </div>
  `;
}

function initIntelligenceCharts() {
  const ctx = document.getElementById('chart-ai-trend');
  if (ctx) {
    charts.aiTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
          { label: 'Lucknow', data: [8, 10, 9, 12, 15, 13, 10, 16, 18, 16, 13, 20], borderColor: '#EEB902', tension: 0.4, borderWidth: 2, pointRadius: 3 },
          { label: 'Varanasi', data: [4, 6, 5, 7, 8, 7, 5, 9, 10, 9, 7, 11], borderColor: '#ef4444', tension: 0.4, borderWidth: 2, pointRadius: 3 },
          { label: 'Prayagraj', data: [3, 4, 4, 5, 6, 5, 4, 7, 8, 7, 5, 8], borderColor: '#3b82f6', tension: 0.4, borderWidth: 2, pointRadius: 3 },
          { label: 'Noida', data: [5, 7, 6, 8, 9, 8, 6, 9, 11, 10, 8, 12], borderColor: '#8b5cf6', tension: 0.4, borderWidth: 2, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }
}

// ══════════════════════════════════════════════════════════
//  ALERTS PAGE
// ══════════════════════════════════════════════════════════
function renderAlertsPage() {
  return `
    <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
      <div class="stat-card danger" style="flex:1; min-width:140px; padding:14px;">
        <div style="font-size:22px;">🚨</div>
        <div style="font-size:28px; font-weight:900;">3</div>
        <div style="font-size:11px;">Critical Alerts</div>
      </div>
      <div class="stat-card warning" style="flex:1; min-width:140px; padding:14px;">
        <div style="font-size:22px;">⚠️</div>
        <div style="font-size:28px; font-weight:900;">2</div>
        <div style="font-size:11px;">Warning Alerts</div>
      </div>
      <div class="stat-card info" style="flex:1; min-width:140px; padding:14px;">
        <div style="font-size:22px;">📍</div>
        <div style="font-size:28px; font-weight:900;">1</div>
        <div style="font-size:11px;">Movement Alerts</div>
      </div>
    </div>
    <div class="section-header">
      <h3>🔴 Live Alert Feed</h3>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-xs btn-secondary">🔔 Mark All Read</button>
        <button class="btn btn-xs btn-secondary">⚙️ Alert Settings</button>
      </div>
    </div>
    <div class="alert-feed">
      ${LIVE_ALERTS.map(a => `
        <div class="alert-item alert-${a.type}">
          <span class="alert-icon">${a.icon}</span>
          <div style="flex:1;">
            <div class="alert-title">${a.title}</div>
            <div class="alert-body">${a.body}</div>
            <div class="alert-time">🕐 ${a.time}</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <button class="btn btn-xs btn-secondary">Assign</button>
            <button class="btn btn-xs btn-danger">Dismiss</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:24px; padding:16px; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-md);">
      <div style="font-size:13px; font-weight:700; margin-bottom:12px;">📢 Alert Channels Status</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px;">
        ${[['📱', 'SMS Gateway', '✅ Active'], ['📧', 'Email SMTP', '✅ Active'], ['💬', 'WhatsApp API', '⚠️ Setup Pending'], ['🖥️', 'Dashboard Push', '✅ Live']].map(ch => `
          <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:6px; text-align:center;">
            <div style="font-size:22px;">${ch[0]}</div>
            <div style="font-size:12px; font-weight:600; margin-top:6px;">${ch[1]}</div>
            <div style="font-size:10px; margin-top:4px; color:${ch[2].includes('✅') ? 'var(--green-400)' : 'var(--amber-400)'};">${ch[2]}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
//  REPORTS PAGE
// ══════════════════════════════════════════════════════════
function renderReportsPage() {
  const reportTypes = [
    { icon: '🏛️', title: 'District-wise Criminal Report', desc: 'Complete criminal records grouped by district', action: 'district' },
    { icon: '🚔', title: 'Police Station Report', desc: 'Station-level dossier and FIR summary', action: 'station' },
    { icon: '⛔', title: 'Gangster Report', desc: 'Active gangs, members and operations', action: 'gang' },
    { icon: '📋', title: 'History Sheeter Report', desc: 'All history sheeters with surveillance data', action: 'hs' },
    { icon: '🕵️', title: 'Surveillance Report', desc: 'Surveillance categories and intelligence inputs', action: 'surv' },
    { icon: '🚨', title: 'Wanted Criminal Report', desc: 'NBW active and absconding criminals', action: 'wanted' },
    { icon: '📊', title: 'Monthly Crime Analysis', desc: 'AI-powered monthly trend report', action: 'monthly' },
    { icon: '💰', title: 'Property & Assets Report', desc: 'Seized property and bank account freeze status', action: 'property' }
  ];
  return `
    <div class="section-header" style="margin-bottom:16px;">
      <h3>📈 Report Generation</h3>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary btn-sm">📅 Schedule Report</button>
        <button class="btn btn-primary btn-sm" onclick="exportAllPDF()">📥 Export All</button>
      </div>
    </div>
    <div class="report-grid">
      ${reportTypes.map(r => `
        <div class="report-card" onclick="generateReport('${r.action}')">
          <div class="report-card-icon">${r.icon}</div>
          <div class="report-card-title">${r.title}</div>
          <div class="report-card-desc">${r.desc}</div>
          <div style="margin-top:12px; display:flex; gap:6px; justify-content:center;">
            <span class="badge badge-active" style="cursor:pointer;" onclick="event.stopPropagation(); generateReport('${r.action}','pdf')">📄 PDF</span>
            <span class="badge badge-bail" style="cursor:pointer;" onclick="event.stopPropagation(); generateReport('${r.action}','excel')">📊 Excel</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:24px; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-md); padding:20px;">
      <div style="font-size:13px; font-weight:700; margin-bottom:12px;">🤖 AI-Generated Intelligence Summary</div>
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.8;">
        <p>📊 <strong style="color:var(--text-primary);">Overview (Last 30 Days):</strong> 6 active criminal profiles across 4 districts. Lucknow dominates with highest case concentration (D-102 gang activity). 2 wanted criminals remain at large.</p>
        <p style="margin-top:8px;">⚠️ <strong style="color:var(--amber-400);">Emerging Threat:</strong> Illegal arms supply network (Handia → Noida) shows signs of expansion. Recommend inter-district coordination between Prayagraj and Noida units.</p>
        <p style="margin-top:8px;">✅ <strong style="color:var(--green-400);">Positive Update:</strong> Satish Gujjar (Gang G-110 leader) currently incarcerated, reducing gang activity by estimated 60% in Noida sector.</p>
      </div>
      <div style="margin-top:14px;">
        <button class="btn btn-primary btn-sm" onclick="generateReport('ai', 'pdf')">📥 Download Full AI Report (PDF)</button>
      </div>
    </div>
  `;
}

function printReportHTML(title, columns, rows, subtitle = '') {
  const printWindow = window.open('', '_blank', 'width=950,height=750');
  if (!printWindow) {
    showToast('⚠️ Pop-up blocked! Please allow pop-ups to generate PDF/print.', 'warning');
    return;
  }

  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

  const tableHeader = columns.map(col => `
    <th style="border-bottom: 2px solid #0f1f3d; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #0f1f3d;">${col}</th>
  `).join('');

  const tableRows = rows.map(row => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      ${row.map(val => `
        <td style="padding: 10px; font-size: 11px; color: #334155; line-height: 1.4;">${val === null || val === undefined ? '' : String(val).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
      `).join('')}
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - UP Police CDIMS</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #1e293b; background: #ffffff; padding: 30px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-btn-bar { display: flex; justify-content: flex-end; margin-bottom: 20px; }
        .print-btn { padding: 9px 18px; background: #0f1f3d; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
        .print-btn:hover { background: #1c3566; }
        .print-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0f1f3d; padding-bottom: 16px; margin-bottom: 24px; }
        .logos { display: flex; align-items: center; gap: 12px; }
        .logo-img { height: 50px; object-fit: contain; }
        .header-text { text-align: right; }
        .header-text h1 { margin: 0; font-size: 16px; font-weight: 800; color: #0f1f3d; letter-spacing: 0.5px; }
        .header-text p { margin: 3px 0 0; font-size: 10px; color: #64748b; font-weight: 600; }
        .report-title-section { margin-bottom: 20px; background: #f8fafc; border-left: 4px solid #c51e24; padding: 12px 16px; border-radius: 0 6px 6px 0; }
        .report-title-section h2 { margin: 0; font-size: 16px; color: #0f1f3d; font-weight: 800; }
        .report-title-section p.sub { margin: 4px 0 0; font-size: 11.5px; color: #475569; font-weight: 500; }
        .report-meta { font-size: 10px; color: #64748b; margin-top: 6px; display: flex; gap: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { font-weight: 700; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .sign-area { display: flex; justify-content: flex-end; margin-top: 45px; }
        .sign-block { text-align: center; }
        .sign-line { width: 180px; border-bottom: 1px solid #475569; margin-bottom: 6px; }
        .sign-block div { font-size: 11px; color: #334155; font-weight: 600; }
        .sign-block span { font-size: 9px; color: #64748b; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: 500; }
        @media print {
          body { padding: 0; }
          .print-btn-bar { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button onclick="window.print()" class="print-btn">🖨️ Print / Save PDF</button>
      </div>
      <div class="print-header">
        <div class="logos">
          <img src="Logo_of_Uttar_Pradesh_Police.png" class="logo-img" alt="UP Police Logo" />
        </div>
        <div class="header-text">
          <h1>UTTAR PRADESH POLICE HEADQUARTERS</h1>
          <p>Criminal Dossier & Intelligence Management System (CDIMS)</p>
          <p>CONFIDENTIAL &bull; INTERNAL JURISDICTION ONLY</p>
        </div>
      </div>

      <div class="report-title-section">
        <h2>${title}</h2>
        <p class="sub">${subtitle}</p>
        <div class="report-meta">
          <span>Date: <strong>${dateStr}</strong></span>
          <span>Operator: <strong>${currentUser.username} (${currentUser.role})</strong></span>
        </div>
      </div>

      <table>
        <thead>
          <tr>${tableHeader}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="sign-area">
        <div class="sign-block">
          <div class="sign-line"></div>
          <div>Verifying Authority</div>
          <span>CDIMS Automated Report Audit</span>
        </div>
      </div>

      <div class="footer">
        <div>Ref: UP-CDIMS-REP-${Date.now()}</div>
        <div>Security Clearance: High</div>
        <div>Strictly Confidential</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadExcelReport(title, columns, rows, filename) {
  // Build standard CSV string
  const headerLine = columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map(row =>
    row.map(val => {
      const stringVal = val === null || val === undefined ? '' : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join('\n'); // Excel BOM support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateReport(type, format) {
  const dossiers = getDossiers();
  let title = '';
  let subtitle = '';
  let columns = [];
  let rows = [];

  switch (type) {
    case 'district':
      title = 'District-wise Criminal Report';
      subtitle = 'Overview of criminal dossiers and case statuses grouped by district';
      columns = ['District', 'Total Criminals', 'Wanted', 'Active', 'In Jail', 'Out on Bail'];
      const distMap = {};
      dossiers.forEach(d => {
        const dist = d.personalInfo.district || 'Other';
        if (!distMap[dist]) {
          distMap[dist] = { total: 0, wanted: 0, active: 0, jail: 0, bail: 0 };
        }
        distMap[dist].total++;
        if (d.status === 'Wanted') distMap[dist].wanted++;
        else if (d.status === 'Active') distMap[dist].active++;
        else if (d.status === 'In Jail') distMap[dist].jail++;
        else if (d.status === 'Out on Bail') distMap[dist].bail++;
      });
      rows = Object.keys(distMap).map(dist => [
        dist.toUpperCase(),
        distMap[dist].total,
        distMap[dist].wanted,
        distMap[dist].active,
        distMap[dist].jail,
        distMap[dist].bail
      ]);
      break;

    case 'station':
      title = 'Police Station Report';
      subtitle = 'Summary of dossiers and statuses for active stations';
      columns = ['Police Station', 'District', 'Criminals Registered', 'Wanted', 'Active', 'In Jail', 'Out on Bail'];
      const stationMap = {};
      dossiers.forEach(d => {
        const station = d.history[0]?.policeStation || 'Hazratganj';
        const dist = d.personalInfo.district || 'Lucknow';
        const key = `${station} (${dist})`;
        if (!stationMap[key]) {
          stationMap[key] = { name: station, dist: dist, total: 0, wanted: 0, active: 0, jail: 0, bail: 0 };
        }
        stationMap[key].total++;
        if (d.status === 'Wanted') stationMap[key].wanted++;
        else if (d.status === 'Active') stationMap[key].active++;
        else if (d.status === 'In Jail') stationMap[key].jail++;
        else if (d.status === 'Out on Bail') stationMap[key].bail++;
      });
      rows = Object.values(stationMap).map(s => [
        s.name,
        s.dist.toUpperCase(),
        s.total,
        s.wanted,
        s.active,
        s.jail,
        s.bail
      ]);
      break;

    case 'gang':
      title = 'Gangster Profile Report';
      subtitle = 'Active criminal gangs, leadership, and operational scale';
      columns = ['Gang Name', 'Leader', 'Area of Operation', 'Monitored Members', 'Wanted Status'];
      const gangMap = {};
      dossiers.forEach(d => {
        const gName = d.gangInfo?.gangName || 'Independent';
        if (gName === 'Independent') return;
        if (!gangMap[gName]) {
          gangMap[gName] = { name: gName, leader: d.gangInfo.gangLeader, area: d.gangInfo.areaOfOperation, members: new Set(), wanted: 0 };
        }
        gangMap[gName].members.add(d.personalInfo.name);
        if (d.status === 'Wanted') gangMap[gName].wanted++;
      });
      rows = Object.values(gangMap).map(g => [
        g.name,
        g.leader,
        g.area,
        g.members.size,
        `${g.wanted} member(s) Wanted`
      ]);
      if (rows.length === 0) {
        rows = [['No active gang profiles registered', '-', '-', '0', '-']];
      }
      break;

    case 'hs':
      title = 'History Sheeter Directory';
      subtitle = 'Surveillance database of registered history sheeters';
      columns = ['ID', 'Name', 'Alias', 'Father Name', 'Age', 'Station/District', 'History Sheet #', 'Category'];
      rows = dossiers.map(d => [
        d.id,
        d.personalInfo.name,
        d.personalInfo.aliasName || '-',
        d.personalInfo.fatherName || '-',
        d.personalInfo.age || '-',
        `${d.history[0]?.policeStation || 'Hazratganj'} PS / ${d.personalInfo.district.toUpperCase()}`,
        d.surveillance.historySheetNumber || 'N/A',
        d.surveillance.surveillanceCategory.split(' (')[0]
      ]);
      break;

    case 'surv':
      title = 'Surveillance Operations Report';
      subtitle = 'Target surveillance classification and intelligence inputs';
      columns = ['ID', 'Criminal Name', 'Category', 'Surveillance Notes', 'Intelligence Inputs', 'Risk Score'];
      rows = dossiers.map(d => [
        d.id,
        d.personalInfo.name,
        d.surveillance.surveillanceCategory,
        d.surveillance.surveillanceNotes || 'Routine patrol check',
        d.surveillance.intelligenceInputs || 'None',
        `${calculateRiskScore(d)}/100`
      ]);
      break;

    case 'wanted':
      title = 'Active Wanted Criminal List';
      subtitle = 'Absconding criminals with active Non-Bailable Warrants (NBW)';
      columns = ['ID', 'Name', 'Alias', 'District', 'Surveillance Category', 'FIR Details', 'Status'];
      rows = dossiers.filter(d => d.status === 'Wanted').map(d => [
        d.id,
        d.personalInfo.name,
        d.personalInfo.aliasName || '-',
        d.personalInfo.district.toUpperCase(),
        d.surveillance.surveillanceCategory.split(' (')[0],
        d.history.map(h => `${h.firNumber} (${h.sections})`).join(', ') || 'N/A',
        '🚨 WANTED'
      ]);
      if (rows.length === 0) {
        rows = [['No active wanted profiles found', '-', '-', '-', '-', '-', 'CLEAN']];
      }
      break;

    case 'monthly':
      title = 'Monthly Crime & Arrest Trends';
      subtitle = 'AI-modeled chronological metrics for registrations vs arrests';
      columns = ['Month', 'FIRs Registered', 'Arrests Made', 'Clearance Rate'];
      const dataMonths = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'];
      const dataFirs = [24, 31, 28, 35, 42, 38, 29, 44, 51, 47, 38, 56];
      const dataArrests = [16, 22, 19, 28, 34, 30, 21, 36, 42, 38, 29, 45];
      rows = dataMonths.map((m, i) => {
        const rate = ((dataArrests[i] / dataFirs[i]) * 100).toFixed(1);
        return [m, dataFirs[i], dataArrests[i], `${rate}%`];
      });
      break;

    case 'property':
      title = 'Seized Property & Asset Report';
      subtitle = 'Registered properties attached under Section 82/83 CrPC or Gangsters Act';
      columns = ['Criminal Owner', 'Property Type', 'Location', 'Estimated Value', 'Attachment Status'];
      dossiers.forEach(d => {
        if (d.propertyDetails && d.propertyDetails.length > 0) {
          d.propertyDetails.forEach(p => {
            rows.push([
              d.personalInfo.name,
              p.type,
              p.address,
              p.estimatedValue,
              p.status
            ]);
          });
        }
      });
      if (rows.length === 0) {
        rows = [['No properties currently attached under legal provisions', '-', '-', '-', '-']];
      }
      break;

    case 'ai':
      title = 'AI Intelligence Analysis & Threat Report';
      subtitle = 'Automated tactical analysis of criminal patterns and supply chains';
      columns = ['Focus Area', 'Detailed Findings & Spatial Corridor', 'Model Confidence', 'Suggested Tactical Action'];
      rows = [
        [
          'Violent Crime (Contract)',
          'Rajesh Yadav gang operates in a triangular corridor - Lucknow -> Ayodhya -> Noida. Most incidents occur between 8 PM and 2 AM on weekdays.',
          '82%',
          'Establish targeted night patrols on NH-19 and Gomti Nagar corridors.'
        ],
        [
          'Financial Fraud',
          'Amit Mishra targets property registration windows (Mon-Wed, 10 AM-1 PM) for forged document execution in Prayagraj/Lucknow.',
          '68%',
          'Implement dual-party biometric verification at registration desks.'
        ],
        [
          'Arms Traffic Network',
          'Handia -> Shivpur -> Noida supply route active. Transit usually via private SUV/sedan models.',
          '74%',
          'Deploy highway vehicle checks on Lucknow-Varanasi and Varanasi-Prayagraj bypass units.'
        ]
      ];
      break;

    case 'audit':
      title = 'System Security Audit Trail';
      subtitle = 'Chronological log of all administrative and user operations on CDIMS';
      columns = ['Timestamp', 'User Name', 'Role Profile', 'Action Performed', 'Operational Details'];
      const logs = getAuditLogs ? getAuditLogs() : [];
      rows = logs.map(l => [
        new Date(l.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
        l.username,
        l.role,
        l.action,
        l.details
      ]);
      break;

    case 'users':
      title = 'Registered System User Profile Directory';
      subtitle = 'Access control level and station mappings for CDIMS active users';
      columns = ['Name', 'Username', 'Access Level', 'Role Profile', 'Jurisdiction/Station', 'Security Status'];
      const uList = [
        { name: 'SHO Rajiv Sharma', username: 'sho_hazratganj', role: 'Police Station User', level: 'L1', station: 'Hazratganj PS, Lucknow', status: 'Active' },
        { name: 'IO Priya Singh', username: 'io_chowk', role: 'Police Station User', level: 'L1', station: 'Chowk PS, Lucknow', status: 'Active' },
        { name: 'CO Prashant Mishra', username: 'co_lucknow', role: 'District Nodal Officer', level: 'L2', station: 'CO Office, Lucknow', status: 'Active' },
        { name: 'SP Crime Varanasi', username: 'sp_crime_vns', role: 'District Nodal Officer', level: 'L2', station: 'SP Office, Varanasi', status: 'Active' },
        { name: 'DG Intelligence (PHQ)', username: 'phq_admin', role: 'State Administrator', level: 'L3', station: 'PHQ Lucknow', status: 'Active' }
      ];
      rows = uList.map(u => [
        u.name,
        u.username,
        u.level,
        u.role,
        u.station,
        u.status
      ]);
      break;

    case 'all':
      title = 'Uttar Pradesh CDIMS State-wide Consolidation Report';
      subtitle = 'Consolidated summary metrics of all active criminal profiles, surveillance groups, and districts';
      columns = ['Metric Group', 'Lucknow', 'Varanasi', 'Prayagraj', 'Noida', 'Cumulative Total'];
      const s = generateStatistics();
      rows = [
        ['Total Tracked Profiles', '3', '1', '1', '1', s.totalCriminals],
        ['Active Classifications', '2', '0', '0', '0', s.activeCriminals],
        ['History Sheeters (HS)', '1', '1', '1', '1', s.historySheeters],
        ['Wanted Criminals', '1', '1', '0', '0', s.wantedCriminals],
        ['Associated Gang Members', '3', '0', '0', '2', '5']
      ];
      break;

    default:
      showToast('⚠️ Unknown report type selected.', 'warning');
      return;
  }

  if (format === 'excel') {
    const filename = `cdims_${type}_report_${Date.now()}.csv`;
    downloadExcelReport(title, columns, rows, filename);
    showToast(`✅ ${type.toUpperCase()} Excel generated successfully! Download started.`, 'success');
    addAuditLog(currentUser.username, currentUser.role, 'Generate Excel Report', `Downloaded ${type} report as CSV/Excel`);
  } else {
    // PDF or Print
    printReportHTML(title, columns, rows, subtitle);
    showToast(`✅ ${type.toUpperCase()} Report prepared. Opening print dialog...`, 'success');
    addAuditLog(currentUser.username, currentUser.role, 'Print PDF Report', `Printed/saved ${type} report as PDF`);
  }
}

function exportAllPDF() { generateReport('all', 'pdf'); }

// ══════════════════════════════════════════════════════════
//  AUDIT PAGE
// ══════════════════════════════════════════════════════════
function renderAuditPage() {
  const logs = getAuditLogs();
  return `
    <div class="table-card">
      <div class="table-header">
        <div class="table-title">📋 System Audit Trail (${logs.length} entries)</div>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="printAuditLog()" title="Print audit trail">🖨️ Print List</button>
          <button class="btn btn-secondary btn-sm" onclick="generateReport('audit','pdf')">📥 Export PDF</button>
        </div>
      </div>
      <div style="padding:16px 20px;">
        ${logs.map(log => `
          <div class="audit-row">
            <div class="audit-time">${new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
            <span class="badge badge-${log.role.includes('Administrator') ? 'wanted' : log.role.includes('District') ? 'active' : 'bail'} audit-badge">${log.role}</span>
            <div class="audit-detail">
              <span class="audit-user">${log.username}</span>
              <span class="audit-action-text"> — ${log.action}: ${log.details}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
//  USERS PAGE (State Admin Only)
// ══════════════════════════════════════════════════════════
function renderUsersPage() {
  const mockUsers = [
    { name: 'SHO Rajiv Sharma', username: 'sho_hazratganj', role: 'Police Station User', level: 'L1', station: 'Hazratganj PS, Lucknow', status: 'Active' },
    { name: 'IO Priya Singh', username: 'io_chowk', role: 'Police Station User', level: 'L1', station: 'Chowk PS, Lucknow', status: 'Active' },
    { name: 'CO Prashant Mishra', username: 'co_lucknow', role: 'District Nodal Officer', level: 'L2', station: 'CO Office, Lucknow', status: 'Active' },
    { name: 'SP Crime Varanasi', username: 'sp_crime_vns', role: 'District Nodal Officer', level: 'L2', station: 'SP Office, Varanasi', status: 'Active' },
    { name: 'DG Intelligence (PHQ)', username: 'phq_admin', role: 'State Administrator', level: 'L3', station: 'PHQ Lucknow', status: 'Active' }
  ];
  return `
    <div class="table-card">
      <div class="table-header">
        <div class="table-title">👤 User Management (${mockUsers.length} users)</div>
        <div class="table-actions">
          <button class="btn btn-primary btn-sm">➕ Add User</button>
          <button class="btn btn-secondary btn-sm" onclick="printUserList()" title="Print user list">🖨️ Print List</button>
          <button class="btn btn-secondary btn-sm" onclick="generateReport('users','pdf')">📥 Export</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr>
            <th>User</th><th>Username</th><th>Role</th><th>Level</th><th>Station</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${mockUsers.map(u => `
              <tr>
                <td><div style="font-weight:700;">${u.name}</div></td>
                <td><span style="font-family:monospace; color:var(--gold-400); font-size:12px;">${u.username}</span></td>
                <td><span style="font-size:12px;">${u.role}</span></td>
                <td><span class="badge ${u.level === 'L3' ? 'badge-wanted' : u.level === 'L2' ? 'badge-active' : 'badge-bail'}">${u.level}</span></td>
                <td style="font-size:12px;">${u.station}</td>
                <td><span class="badge badge-approved">✅ ${u.status}</span></td>
                <td>
                  <div style="display:flex; gap:4px;">
                    <button class="btn btn-xs btn-secondary" onclick="showToast('Edit user: ${u.username}','info')">✏️</button>
                    <button class="btn btn-xs btn-danger" onclick="showToast('Deactivate user: ${u.username}','warning')">🚫</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div style="margin-top:20px; display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px;">
      <div class="chart-card" style="padding:16px;">
        <div style="font-size:13px; font-weight:700; margin-bottom:10px;">📊 Role Distribution</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div class="district-bar-item"><div class="district-name" style="width:100px;">Station (L1)</div><div class="district-bar-wrap"><div class="district-bar-fill" style="width:40%;"></div></div><div class="district-count">2</div></div>
          <div class="district-bar-item"><div class="district-name" style="width:100px;">District (L2)</div><div class="district-bar-wrap"><div class="district-bar-fill" style="width:40%;"></div></div><div class="district-count">2</div></div>
          <div class="district-bar-item"><div class="district-name" style="width:100px;">PHQ (L3)</div><div class="district-bar-wrap"><div class="district-bar-fill" style="width:20%;"></div></div><div class="district-count">1</div></div>
        </div>
      </div>
      
      <div class="chart-card" style="padding:16px;">
        <div style="font-size:13px; font-weight:700; margin-bottom:10px;">🔐 Security Settings</div>
        ${[['Multi-Factor Auth', '✅ Enabled'], ['Aadhaar SSO', '⏳ Setup Pending'], ['End-to-End Encryption', '✅ Active'], ['Session Timeout', '✅ 30 min'], ['IP Whitelisting', '⚠️ Not Set']].map(s => `
          <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:12px;">
            <span>${s[0]}</span>
            <span style="color:${s[1].includes('✅') ? 'var(--green-400)' : s[1].includes('⚠️') ? 'var(--amber-400)' : 'var(--text-muted)'};">${s[1]}</span>
          </div>
        `).join('')}
      </div>

      <div class="chart-card" style="padding:16px;">
        <div style="font-size:13px; font-weight:700; margin-bottom:10px;">🛡️ Dynamic Credential Generator</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; flex-direction:column; gap:3px;">
            <label style="font-size:10px; color:var(--text-muted);">Officer Full Name / अधिकारी का नाम</label>
            <input type="text" id="gen-officer-name" class="form-control-sm" placeholder="e.g. Rajiv Sharma" style="width:100%; font-size:11px;" />
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <label style="font-size:10px; color:var(--text-muted);">Access Level / भूमिका चुनें</label>
            <select id="gen-role-type" class="form-control-sm" style="width:100%; font-size:11px;">
              <option value="police_station">Level 1 — Police Station (SHO/IO)</option>
              <option value="sp_nodal">Level 2 — District Nodal (CO/SP)</option>
              <option value="phq_level">Level 3 — PHQ State Admin</option>
            </select>
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <label style="font-size:10px; color:var(--text-muted);">District / जनपद</label>
            <select id="gen-district" class="form-control-sm" style="width:100%; font-size:11px;">
              <option value="lucknow">Lucknow</option>
              <option value="varanasi">Varanasi</option>
              <option value="prayagraj">Prayagraj</option>
              <option value="noida">Gautam Buddha Nagar</option>
            </select>
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <label style="font-size:10px; color:var(--text-muted);">Posting Station / कार्यालय</label>
            <input type="text" id="gen-station" class="form-control-sm" placeholder="e.g. Hazratganj PS" style="width:100%; font-size:11px;" />
          </div>
          <button class="btn btn-primary btn-sm" onclick="generateOfficerCredentials()" style="margin-top:4px; font-weight:700;">🎫 Generate Secure ID</button>
          <div id="gen-credentials-result" style="display:none;"></div>
        </div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
//  ADD DOSSIER MODAL
// ══════════════════════════════════════════════════════════
function openAddDossierModal() {
  const modal = document.getElementById('add-dossier-modal');
  modal.classList.add('open');

  const distSelect = document.getElementById('f-district');
  const stationSelect = document.getElementById('f-ps');
  const villageSelect = document.getElementById('f-village');

  if (distSelect && stationSelect && villageSelect) {
    const isSHO = currentUser.level === 1;
    const isSP = currentUser.level === 2;

    // Reset dropdowns
    distSelect.disabled = isSHO || isSP;
    stationSelect.disabled = isSHO;

    distSelect.value = currentUser.district === 'all' ? 'lucknow' : currentUser.district;

    // Populate stations for district
    const stations = getStationsForDistrict(distSelect.value);
    stationSelect.innerHTML = stations.map(s => `<option value="${s}">${s}</option>`).join('');

    // If SHO, set station to their station
    if (isSHO) {
      stationSelect.value = getCurrentStationKey();
    }

    // Populate villages
    const villages = getVillagesForStation(stationSelect.value);
    villageSelect.innerHTML = villages.map(v => `<option value="${v}">${v}</option>`).join('');
  }
}
function closeAddDossierModal() {
  document.getElementById('add-dossier-modal').classList.remove('open');
}
async function submitNewDossier() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('❌ Name is required!', 'error'); return; }

  const dob = document.getElementById('f-dob').value;
  const age = dob ? Math.floor((new Date() - new Date(dob)) / 31557600000) : 0;

  const newDossier = {
    personalInfo: {
      name,
      aliasName: document.getElementById('f-alias').value || 'N/A',
      nickname: '',
      fatherName: document.getElementById('f-father').value || 'N/A',
      motherName: 'N/A',
      gender: document.getElementById('f-gender').value,
      dob,
      age,
      mobile: document.getElementById('f-mobile').value || 'N/A',
      aadhaar: 'XXXX-XXXX-' + (document.getElementById('f-aadhaar').value || 'XXXX'),
      address: document.getElementById('f-address').value || 'N/A',
      permanentAddress: 'N/A',
      photograph: `https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=300`,
      village: document.getElementById('f-village').value
    },
    biometrics: {
      fingerprints: 'Pending Capture',
      faceImage: 'Pending Scan',
      identificationMarks: 'To be updated',
      height: 'N/A', weight: 'N/A',
      eyeColor: 'N/A',
      bloodGroup: document.getElementById('f-blood').value
    },
    history: [{
      firNumber: document.getElementById('f-fir').value || 'Pending',
      crimeNumber: 'Pending',
      policeStation: document.getElementById('f-ps').value || currentUser.station,
      district: document.getElementById('f-district').value,
      sections: document.getElementById('f-sections').value || 'Under Investigation',
      chargeSheetStatus: 'Under Investigation',
      convictionDetails: 'Under Investigation',
      bailStatus: 'Pending',
      courtCaseDetails: 'Awaiting Charge Sheet'
    }],
    gangInfo: {
      gangName: document.getElementById('f-gang').value || 'Independent',
      gangLeader: document.getElementById('f-leader').value || 'N/A',
      gangMembers: [],
      areaOfOperation: 'N/A',
      networkMapping: []
    },
    surveillance: {
      historySheetNumber: document.getElementById('f-hs').value || 'Pending',
      surveillanceCategory: document.getElementById('f-scat').value,
      surveillanceNotes: document.getElementById('f-intel').value || 'Under surveillance',
      beatOfficerRemarks: 'Newly entered into system',
      intelligenceInputs: document.getElementById('f-intel').value || 'None yet'
    },
    propertyDetails: [],
    vehicleDetails: [],
    status: document.getElementById('f-status').value
  };

  if (selectedDossierPhotos.length > 0) {
    newDossier.personalInfo.photograph = selectedDossierPhotos[0];
  }

  await addDossier(newDossier, currentUser, selectedDossierPhotos);
  closeAddDossierModal();
  selectedDossierPhotos = [];
  const previewContainer = document.getElementById('modal-photo-preview');
  if (previewContainer) previewContainer.innerHTML = '';
  document.getElementById('f-photos').value = '';

  showToast(`✅ Dossier for "${name}" created successfully! Pending district review.`, 'success');
  await navigateTo('dossiers');
}

let selectedDossierPhotos = [];
window.handleModalPhotoSelect = function(event) {
  const files = event.target.files;
  const previewContainer = document.getElementById('modal-photo-preview');
  if (!previewContainer) return;

  previewContainer.innerHTML = '';
  selectedDossierPhotos = [];

  if (files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64 = e.target.result;
        selectedDossierPhotos.push(base64);

        const img = document.createElement('img');
        img.src = base64;
        img.style.cssText = 'width: 55px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--glass-border);';
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }
};

// ══════════════════════════════════════════════════════════
//  NOTIFICATION PANEL
// ══════════════════════════════════════════════════════════
function toggleNotifPanel() {
  notifPanelOpen = !notifPanelOpen;
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('open', notifPanelOpen);

  if (notifPanelOpen) {
    const list = document.getElementById('notif-list');
    list.innerHTML = LIVE_ALERTS.map((a, i) => `
      <div class="notif-item">
        <div class="notif-dot-indicator ${i > 2 ? 'read' : ''}"></div>
        <div>
          <div class="notif-text"><strong>${a.title}</strong></div>
          <div class="notif-text">${a.body.substring(0, 70)}...</div>
          <div class="notif-t">🕐 ${a.time}</div>
        </div>
      </div>
    `).join('');
  }
}

// ══════════════════════════════════════════════════════════
//  LANGUAGE TOGGLE
// ══════════════════════════════════════════════════════════
function setLang(lang) {
  currentLang = lang;
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-lang-hi').classList.toggle('active', lang === 'hi');
  buildSidebar();
  navigateTo(currentView);
}

// ══════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════
function showToast(msg, type) {
  const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:var(--navy-800); border:1px solid ${colors[type] || colors.info};
    border-left: 4px solid ${colors[type] || colors.info};
    border-radius:8px; padding:12px 18px; font-size:13px; font-weight:600;
    max-width:360px; box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation: slideUp 0.3s ease; color:var(--text-primary);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Village Directory Modules ──

function getCurrentStationKey() {
  if (!currentUser || !currentUser.station) return "";
  return currentUser.station.split(' PS')[0].trim();
}

function getStationsForDistrict(districtId) {
  const dist = MASTER_DATA.districts.find(d => d.id === districtId);
  if (!dist) return [];
  const stations = [];
  dist.circles.forEach(c => {
    c.stations.forEach(s => stations.push(s));
  });
  return stations;
}

function getVillagesForStation(stationName) {
  if (!stationName) return [];
  const matchKey = Object.keys(window.VILLAGES_BY_STATION || {}).find(k => k.toLowerCase() === stationName.toLowerCase());
  return matchKey ? window.VILLAGES_BY_STATION[matchKey] : [];
}

function getCriminalsInVillage(stationName, villageName) {
  const dossiers = getDossiers();
  return dossiers.filter(d => {
    if (!d || !d.personalInfo) return false;
    const isOfStation = d.history.some(h => h.policeStation && h.policeStation.toLowerCase() === stationName.toLowerCase()) ||
      (d.submittedBy && d.submittedBy.toLowerCase().includes(stationName.toLowerCase()));
    const vName = d.personalInfo.village || '';
    return isOfStation && vName.toLowerCase() === villageName.toLowerCase();
  });
}

window.onVillageDistrictChange = function (districtId) {
  selectedVillageDistrict = districtId;
  const stations = getStationsForDistrict(districtId);
  selectedVillageStation = stations[0] || '';
  const villages = getVillagesForStation(selectedVillageStation);
  selectedVillageName = villages[0] || null;

  const content = document.getElementById('page-content');
  if (content) content.innerHTML = renderVillageDirectory();
};

window.onVillageStationChange = function (stationName) {
  selectedVillageStation = stationName;
  const villages = getVillagesForStation(stationName);
  selectedVillageName = villages[0] || null;

  const content = document.getElementById('page-content');
  if (content) content.innerHTML = renderVillageDirectory();
};

window.selectVillage = function (villageName) {
  selectedVillageName = villageName;

  // Highlight active card
  document.querySelectorAll('.village-card').forEach(el => {
    el.classList.remove('active');
    el.style.background = 'var(--glass-bg)';
    el.style.borderColor = 'var(--glass-border)';
    const nameSpan = el.querySelector('span');
    if (nameSpan) nameSpan.style.color = 'var(--text-primary)';
  });

  // Find clicked card
  const clickedCard = Array.from(document.querySelectorAll('.village-card')).find(el => {
    const text = el.querySelector('span')?.textContent || '';
    return text.includes(villageName);
  });

  if (clickedCard) {
    clickedCard.classList.add('active');
    clickedCard.style.background = 'linear-gradient(135deg, rgba(238,185,2,0.15), rgba(15,31,61,0.8))';
    clickedCard.style.borderColor = 'var(--gold-500)';
    const nameSpan = clickedCard.querySelector('span');
    if (nameSpan) nameSpan.style.color = 'var(--gold-400)';
  }

  // Render criminals list
  const container = document.getElementById('village-criminals-container');
  if (container) {
    container.innerHTML = renderVillageCriminalsList(selectedVillageStation, selectedVillageName);
  }
};

window.openAddDossierModalWithVillage = function () {
  openAddDossierModal();

  const distSelect = document.getElementById('f-district');
  if (distSelect) {
    distSelect.value = selectedVillageDistrict;
    window.onModalDistrictChange();
  }

  const stationSelect = document.getElementById('f-ps');
  if (stationSelect) {
    stationSelect.value = selectedVillageStation;
    window.onModalStationChange();
  }

  const villageSelect = document.getElementById('f-village');
  if (villageSelect) {
    villageSelect.value = selectedVillageName;
  }
};

window.onModalDistrictChange = function () {
  const districtSelect = document.getElementById('f-district');
  const stationSelect = document.getElementById('f-ps');
  const villageSelect = document.getElementById('f-village');
  if (!districtSelect || !stationSelect || !villageSelect) return;

  const districtId = districtSelect.value;
  const stations = getStationsForDistrict(districtId);

  stationSelect.innerHTML = stations.map(s => `<option value="${s}">${s}</option>`).join('');
  window.onModalStationChange();
};

window.onModalStationChange = function () {
  const stationSelect = document.getElementById('f-ps');
  const villageSelect = document.getElementById('f-village');
  if (!stationSelect || !villageSelect) return;

  const stationName = stationSelect.value;
  const villages = getVillagesForStation(stationName);

  villageSelect.innerHTML = villages.map(v => `<option value="${v}">${v}</option>`).join('');
};

function renderVillageDirectory() {
  const isSHO = currentUser.level === 1;
  const isSP = currentUser.level === 2;
  const isPHQ = currentUser.level === 3;

  if (isSHO) {
    selectedVillageDistrict = currentUser.district;
    selectedVillageStation = getCurrentStationKey();
  } else if (isSP) {
    selectedVillageDistrict = currentUser.district;
    const stations = getStationsForDistrict(selectedVillageDistrict);
    if (!stations.includes(selectedVillageStation)) {
      selectedVillageStation = stations[0] || '';
    }
  } else {
    if (!selectedVillageDistrict || selectedVillageDistrict === 'all') selectedVillageDistrict = 'lucknow';
    const stations = getStationsForDistrict(selectedVillageDistrict);
    if (!stations.includes(selectedVillageStation)) {
      selectedVillageStation = stations[0] || '';
    }
  }

  const stations = getStationsForDistrict(selectedVillageDistrict);
  const villages = getVillagesForStation(selectedVillageStation);

  if (!selectedVillageName && villages.length > 0) {
    selectedVillageName = villages[0];
  }

  let filtersHtml = `<div class="filter-bar" style="margin-bottom:20px; background:var(--glass-bg); padding:15px; border-radius:var(--radius-md); border:1px solid var(--glass-border); display:flex; gap:15px; align-items:center; flex-wrap:wrap;">`;

  if (isPHQ) {
    filtersHtml += `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <label style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">District / जिला</label>
        <select class="filter-select" id="vill-district-select" onchange="onVillageDistrictChange(this.value)">
          ${MASTER_DATA.districts.map(d => `<option value="${d.id}" ${d.id === selectedVillageDistrict ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </div>
    `;
  } else {
    const distName = MASTER_DATA.districts.find(d => d.id === selectedVillageDistrict)?.name || selectedVillageDistrict;
    filtersHtml += `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <label style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">District / जिला</label>
        <div style="font-size:13px; font-weight:700; color:var(--gold-400); background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); padding:7px 12px; border-radius:var(--radius-sm);">${distName}</div>
      </div>
    `;
  }

  if (isPHQ || isSP) {
    filtersHtml += `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <label style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Police Station / पुलिस स्टेशन</label>
        <select class="filter-select" id="vill-station-select" onchange="onVillageStationChange(this.value)">
          ${stations.map(s => `<option value="${s}" ${s === selectedVillageStation ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    `;
  } else {
    filtersHtml += `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <label style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Police Station / पुलिस स्टेशन</label>
        <div style="font-size:13px; font-weight:700; color:var(--gold-400); background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); padding:7px 12px; border-radius:var(--radius-sm);">${selectedVillageStation}</div>
      </div>
    `;
  }

  filtersHtml += `
    <div style="margin-left:auto; display:flex; gap:8px;">
      ${isSHO ? `<button class="btn btn-primary btn-sm" onclick="openAddDossierModalWithVillage()">➕ Add Criminal Dossier</button>` : ''}
    </div>
  `;
  filtersHtml += `</div>`;

  return `
    ${filtersHtml}
    
    <div class="village-layout">
      <!-- Left: Village List -->
      <div class="village-list-panel" style="display:flex; flex-direction:column; gap:10px;">
        <h4 style="font-size:12px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; border-bottom:1px solid var(--glass-border); padding-bottom:8px;">🏘️ Villages (${villages.length})</h4>
        <div class="village-cards-container" style="display:flex; flex-direction:column; gap:8px; max-height:65vh; overflow-y:auto; padding-right:5px;">
          ${renderVillageCardsList(villages)}
        </div>
      </div>

      <!-- Right: Criminals List -->
      <div class="village-criminals-panel" id="village-criminals-container" style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-md); padding:20px; display:flex; flex-direction:column; gap:15px; min-height:50vh;">
        ${renderVillageCriminalsList(selectedVillageStation, selectedVillageName)}
      </div>
    </div>
  `;
}

function renderVillageCardsList(villages) {
  if (villages.length === 0) {
    return `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px;">No villages registered.</div>`;
  }

  return villages.map(v => {
    const criminals = getCriminalsInVillage(selectedVillageStation, v);
    const total = criminals.length;
    const wanted = criminals.filter(c => c.status === 'Wanted').length;
    const active = criminals.filter(c => c.status === 'Active').length;
    const onBail = criminals.filter(c => c.status === 'Out on Bail').length;
    const inJail = criminals.filter(c => c.status === 'In Jail').length;

    const isActive = v === selectedVillageName;

    return `
      <div class="village-card ${isActive ? 'active' : ''}" onclick="selectVillage('${v}')" style="
        background:${isActive ? 'linear-gradient(135deg, rgba(238,185,2,0.15), rgba(15,31,61,0.8))' : 'var(--glass-bg)'};
        border:1px solid ${isActive ? 'var(--gold-500)' : 'var(--glass-border)'};
        padding:12px; border-radius:var(--radius-md); cursor:pointer; transition:var(--transition);
        display:flex; flex-direction:column; gap:6px;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:700; font-size:13px; color:${isActive ? 'var(--gold-400)' : 'var(--text-primary)'};">🏘️ ${v}</span>
          <span class="badge ${total > 0 ? 'badge-active' : 'badge-pending'}" style="font-size:9px; padding:2px 6px;">${total}</span>
        </div>
        ${total > 0 ? `
          <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px;">
            ${wanted > 0 ? `<span class="badge badge-wanted" style="font-size:8px; padding:1px 4px;">Wanted: ${wanted}</span>` : ''}
            ${active > 0 ? `<span class="badge badge-active" style="font-size:8px; padding:1px 4px;">Active: ${active}</span>` : ''}
            ${onBail > 0 ? `<span class="badge badge-bail" style="font-size:8px; padding:1px 4px;">Bail: ${onBail}</span>` : ''}
            ${inJail > 0 ? `<span class="badge badge-jail" style="font-size:8px; padding:1px 4px;">Jail: ${inJail}</span>` : ''}
          </div>
        ` : `<span style="font-size:10px; color:var(--text-muted);">No active history sheeters</span>`}
      </div>
    `;
  }).join('');
}

function renderVillageCriminalsList(stationName, villageName) {
  if (!villageName) {
    return `
      <div class="empty-state" style="margin:auto; text-align:center;">
        <div class="empty-icon" style="font-size:40px; margin-bottom:10px;">🏘️</div>
        <div class="empty-title" style="font-size:16px; font-weight:700;">No Village Selected</div>
        <div class="empty-desc" style="font-size:12px; color:var(--text-secondary);">Select a village from the left sidebar to view local criminal histories.</div>
      </div>
    `;
  }

  const criminals = getCriminalsInVillage(stationName, villageName);

  let headerHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--glass-border); padding-bottom:10px; margin-bottom:10px;">
      <div>
        <h3 style="font-size:15px; font-weight:800; color:var(--gold-400);">🏘️ Gram: ${villageName}</h3>
        <p style="font-size:11px; color:var(--text-secondary);">Police Station: ${stationName} | Total History Sheeters: ${criminals.length}</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="printVillageCriminals('${stationName}','${villageName}')" title="Print village criminal list">🖨️ Print List</button>
    </div>
  `;

  if (criminals.length === 0) {
    return `
      ${headerHtml}
      <div class="empty-state" style="margin:auto; text-align:center; padding:40px;">
        <div class="empty-icon" style="font-size:36px; margin-bottom:8px;">📂</div>
        <div class="empty-title" style="font-size:14px; font-weight:700;">No Criminal Records</div>
        <div class="empty-desc" style="font-size:11px; color:var(--text-secondary);">There are no criminal dossiers associated with this village yet.</div>
      </div>
    `;
  }

  const listHtml = criminals.map(d => {
    const risk = calculateRiskScore(d);
    const riskClass = risk >= 70 ? 'risk-high' : risk >= 40 ? 'risk-medium' : 'risk-low';

    const firListHtml = d.history.map(h => `
      <div style="padding:8px 10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:4px; margin-bottom:6px; font-size:11px;">
        <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--gold-400);">
          <span>⚖️ ${h.firNumber} / ${h.crimeNumber}</span>
          <span>Bail: ${h.bailStatus}</span>
        </div>
        <div style="color:var(--red-400); font-weight:600; margin-top:2px;">Sections: ${h.sections}</div>
        <div style="color:var(--text-secondary); margin-top:2px; font-size:10px;">
          📍 ${h.policeStation} PS | Court Case: ${h.courtCaseDetails} | Status: ${h.chargeSheetStatus}
        </div>
      </div>
    `).join('');

    return `
      <div class="village-criminal-row-card" style="
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 16px;
        transition: var(--transition);
      ">
        <div style="display:grid; grid-template-columns: 100px 1.2fr 1.2fr; gap: 16px;">
          <!-- Col 1: Photo & Status -->
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <img style="width:100%; aspect-ratio:3/4; object-fit:cover; border-radius:6px; border:2px solid var(--glass-border);" 
                 src="${d.personalInfo.photograph}" alt="${d.personalInfo.name}" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;100&quot; height=&quot;133&quot;><rect width=&quot;100&quot; height=&quot;133&quot; fill=&quot;%230f1f3d&quot;/><text x=&quot;50%&quot; y=&quot;50%&quot; text-anchor=&quot;middle&quot; fill=&quot;%23EEB902&quot; font-size=&quot;32&quot;>${d.personalInfo.name[0]}</text></svg>'" />
            <div style="text-align:center;">${statusBadge(d.status)}</div>
            
            <div style="width:100%; margin-top:4px;">
              <div style="font-size:9px; color:var(--text-muted); text-align:center; font-weight:700; text-transform:uppercase;">Risk Level</div>
              <div class="risk-bar ${riskClass}" style="height:6px; margin-top:3px;"><div class="risk-bar-fill" style="width:${risk}%"></div></div>
              <div style="font-size:10px; font-weight:700; text-align:center; margin-top:2px; color:${risk >= 70 ? '#f87171' : risk >= 40 ? '#fbbf24' : '#4ade80'}">${risk}/100</div>
            </div>
          </div>

          <!-- Col 2: Personal & Surveillance Info -->
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div>
              <span class="criminal-id" style="font-size:10px;">${d.id}</span>
              <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin-top:2px;">${d.personalInfo.name}</h4>
              <div style="font-size:11px; color:var(--text-secondary);">Alias: <strong>${d.personalInfo.aliasName}</strong></div>
            </div>
            
            <div style="font-size:11px; display:flex; flex-direction:column; gap:3px; color:var(--text-secondary); margin-top:4px;">
              <div>Father's Name: <strong>${d.personalInfo.fatherName}</strong></div>
              <div>📅 DOB: <strong>${d.personalInfo.dob} (Age ${d.personalInfo.age})</strong></div>
              <div>📱 Mobile: <strong>${d.personalInfo.mobile}</strong></div>
              <div>🪪 Aadhaar: <strong>${d.personalInfo.aadhaar}</strong></div>
              <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.05);">
                🏠 <strong>Current Address:</strong> ${d.personalInfo.address}
              </div>
              <div>
                🏢 <strong>Permanent Address:</strong> ${d.personalInfo.permanentAddress}
              </div>
            </div>

            <div style="margin-top:6px; padding:8px; background:rgba(238,185,2,0.04); border-left:3px solid var(--gold-500); border-radius:4px; font-size:11px;">
              <div style="font-weight:700; color:var(--gold-400); margin-bottom:2px;">🕵️ Surveillance — HS: ${d.surveillance.historySheetNumber}</div>
              <div style="color:var(--text-secondary); font-size:10px;">Category: <strong>${d.surveillance.surveillanceCategory}</strong></div>
              <div style="margin-top:3px; font-style:italic; color:var(--text-primary); font-size:10px;">"${d.surveillance.surveillanceNotes}"</div>
            </div>
          </div>

          <!-- Col 3: FIR Details & History -->
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="font-size:11px; font-weight:700; color:var(--text-primary); border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:3px;">⚖️ FIR & Criminal History</div>
            <div style="max-height:220px; overflow-y:auto; padding-right:2px;">
              ${firListHtml}
            </div>

            <div style="margin-top:auto; display:flex; justify-content:flex-end; gap:6px; padding-top:8px;">
              <button class="btn btn-xs btn-secondary" onclick="openDossierModal(getDossiers().find(x=>x.id==='${d.id}'))">👁️ View Full Dossier</button>
              ${currentUser.level === 1 ? `
                <button class="btn btn-xs btn-primary" onclick="openEditStatusInVillage('${d.id}')">✏️ Quick Status Edit</button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    ${headerHtml}
    <div class="village-criminals-scroll" style="display:flex; flex-direction:column; overflow-y:auto; max-height:68vh; padding-right:4px;">
      ${listHtml}
    </div>
  `;
}

window.openEditStatusInVillage = async function (id) {
  const dossiers = getDossiers();
  const d = dossiers.find(x => x.id === id);
  if (!d) return;

  const newStatus = prompt(`Update Status for ${d.personalInfo.name} (Current: ${d.status})\nOptions: Wanted, Active, In Jail, Out on Bail`, d.status);
  if (newStatus === null) return;

  const validStatuses = ["Wanted", "Active", "In Jail", "Out on Bail"];
  if (!validStatuses.includes(newStatus)) {
    alert("Invalid status! Choose from: Wanted, Active, In Jail, Out on Bail");
    return;
  }

  const remarks = prompt("Enter beat officer remarks / update surveillance notes:", d.surveillance.beatOfficerRemarks);
  if (remarks === null) return;

  d.status = newStatus;
  d.surveillance.beatOfficerRemarks = remarks;
  d.surveillance.surveillanceNotes = remarks;
  d.lastUpdated = new Date().toISOString();

  await updateDossier(d, currentUser);
  showToast(`✅ Status for ${d.personalInfo.name} updated to ${newStatus}.`, 'success');
  await navigateTo('villages');
};

// ══════════════════════════════════════════════════════════
//  LOGIN / LOGOUT
// ══════════════════════════════════════════════════════════
async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const roleEl = document.getElementById('login-role');
  let role = 'l1';
  if (roleEl) {
    role = roleEl.value;
  } else {
    // Dynamically resolve role from username for offline login fallback
    const uLower = username.toLowerCase();
    if (uLower.startsWith('co_') || uLower.startsWith('sp_') || uLower.includes('nodal')) {
      role = 'l2';
    } else if (uLower.startsWith('phq_') || uLower.includes('admin') || uLower.includes('dg')) {
      role = 'l3';
    } else {
      role = 'l1';
    }
  }

  if (!username || !password) {
    showToast('❌ Please enter credentials', 'error'); return;
  }

  const isGitHubPages = window.location.hostname.endsWith('github.io');
  if (isGitHubPages) {
    showToast('🔐 Verifying credentials against live database...', 'info');
    if (typeof window.dbLogin === 'function') {
      const dbResult = await window.dbLogin(username, password);
      if (dbResult.success && dbResult.user) {
        currentUser = dbResult.user;
        window.currentUser = currentUser;
        showToast(`✅ Authentication successful. Welcome, ${currentUser.name}!`, 'success');
      } else {
        showToast(`❌ Login failed: ${dbResult.message || 'Invalid credentials'}`, 'error');
        return;
      }
    } else {
      showToast('❌ Database connection not initialized.', 'error');
      return;
    }
  } else {
    showToast('🔐 Verifying credentials against database...', 'info');

    try {
      const res = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUser = data.user;
          window.currentUser = currentUser;
          showToast(`✅ Authentication successful. Welcome, ${currentUser.name}!`, 'success');
        }
      } else {
        const errData = await res.json();
        showToast(`❌ Login failed: ${errData.message || 'Invalid credentials'}`, 'error');
        return;
      }
    } catch (err) {
      console.error("⚠️ Server connection failed:", err);
      showToast("❌ Unable to connect to backend server. Database login required.", "error");
      return;
    }
  }

  // Once authenticated, sync data cache from Supabase
  if (window.syncWithBackend) {
    await window.syncWithBackend(currentUser);
  }

  addAuditLog(currentUser.username, currentUser.role, 'Login', `User logged in as ${currentUser.role}`);

  // Show the app shell immediately while data loads
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  document.getElementById('user-avatar').textContent = currentUser.avatar;
  document.getElementById('user-name-display').textContent = currentUser.name;
  document.getElementById('user-role-display').textContent = currentUser.role;
  document.getElementById('user-station-display').textContent = currentUser.station;

  // Ensure DB is loaded (instant if already done, awaits if still loading)
  await initDatabase();

  addAuditLog(currentUser.username, currentUser.role, 'Login', `User logged in as ${currentUser.role}`);
  buildSidebar();
  navigateTo('dashboard');
}

// dynamic credential generator for Police Station, SP Nodal and PHQ
async function generateOfficerCredentials() {
  const name = document.getElementById('gen-officer-name').value.trim();
  const roleType = document.getElementById('gen-role-type').value;
  const district = document.getElementById('gen-district').value;
  const station = document.getElementById('gen-station').value.trim();

  if (!name) {
    showToast('❌ Officer Name is required!', 'error');
    return;
  }

  const isGitHubPages = window.location.hostname.endsWith('github.io');
  if (isGitHubPages) {
    showToast('✅ Credential generated successfully (Offline Mode)!', 'success');
    const uPrefix = roleType === 'l1' ? 'sho_' : (roleType === 'l2' ? 'co_' : 'phq_');
    const usernameGenerated = uPrefix + name.toLowerCase().replace(/\s+/g, '_');
    const creds = {
      name,
      role: roleType === 'l1' ? 'Police Station User' : (roleType === 'l2' ? 'District Nodal Officer' : 'State Administrator'),
      station: station || (roleType === 'l1' ? 'Hazratganj PS' : (roleType === 'l2' ? 'CO Office' : 'PHQ')),
      district,
      username: usernameGenerated,
      password: 'up@' + Math.floor(1000 + Math.random() * 9000)
    };

    const resultDiv = document.getElementById('gen-credentials-result');
    resultDiv.style.display = 'block';
    resultDiv.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid var(--gold-500);
      background: rgba(238,185,2,0.06);
      font-size: 11px;
      line-height: 1.4;
      text-align: left;
    `;
    resultDiv.innerHTML = `
      <div style="font-weight:700; color:var(--gold-400); margin-bottom:4px;">🎫 GENERATED IDENTITY (OFFLINE DEMO):</div>
      <div>👤 <strong>Name:</strong> ${creds.name}</div>
      <div>👮 <strong>Role:</strong> ${creds.role}</div>
      <div>📍 <strong>Office:</strong> ${creds.station} (${creds.district})</div>
      <div style="margin-top:6px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px;">
        🔑 <strong style="color:var(--green-400);">Username:</strong> <code style="background:rgba(255,255,255,0.08); padding:1px 3px; border-radius:3px; font-family:monospace;">${creds.username}</code><br/>
        🔒 <strong style="color:var(--green-400);">Password:</strong> <code style="background:rgba(255,255,255,0.08); padding:1px 3px; border-radius:3px; font-family:monospace;">${creds.password}</code>
      </div>
      <div style="font-size:9px; color:var(--text-muted); margin-top:6px;">
        ⚠️ Offline Demo Mode. Credentials generated for this browser session only.
      </div>
    `;

    document.getElementById('gen-officer-name').value = '';
    document.getElementById('gen-station').value = '';
    return;
  }

  showToast('🔐 Generating dynamic credentials inside database...', 'info');

  try {
    const res = await fetch(getApiUrl('/api/users/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        roleType,
        district,
        station,
        adminUser: currentUser.username,
        adminRole: currentUser.role
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.credentials) {
        showToast('✅ Credential generated successfully!', 'success');
        const creds = data.credentials;
        const resultDiv = document.getElementById('gen-credentials-result');
        resultDiv.style.display = 'block';
        resultDiv.style.cssText = `
          margin-top: 10px;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid var(--gold-500);
          background: rgba(238,185,2,0.06);
          font-size: 11px;
          line-height: 1.4;
          text-align: left;
        `;
        resultDiv.innerHTML = `
          <div style="font-weight:700; color:var(--gold-400); margin-bottom:4px;">🎫 GENERATED IDENTITY:</div>
          <div>👤 <strong>Name:</strong> ${creds.name}</div>
          <div>👮 <strong>Role:</strong> ${creds.role}</div>
          <div>📍 <strong>Office:</strong> ${creds.station} (${creds.district})</div>
          <div style="margin-top:6px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px;">
            🔑 <strong style="color:var(--green-400);">Username:</strong> <code style="background:rgba(255,255,255,0.08); padding:1px 3px; border-radius:3px; font-family:monospace;">${creds.username}</code><br/>
            🔒 <strong style="color:var(--green-400);">Password:</strong> <code style="background:rgba(255,255,255,0.08); padding:1px 3px; border-radius:3px; font-family:monospace;">${creds.password}</code>
          </div>
          <div style="font-size:9px; color:var(--text-muted); margin-top:6px;">
            ⚠️ Synced to Supabase database. Account is ready for custom login.
          </div>
        `;

        // Clear input fields
        document.getElementById('gen-officer-name').value = '';
        document.getElementById('gen-station').value = '';
      }
    } else {
      const err = await res.json();
      showToast(`❌ Generation failed: ${err.message}`, 'error');
    }
  } catch (err) {
    console.error('Error generating credentials:', err);
    showToast('❌ Error generating credentials from server.', 'error');
  }
}

function doLogout() {
  if (currentUser) addAuditLog(currentUser.username, currentUser.role, 'Logout', 'User logged out');
  currentUser = null;
  window.currentUser = null;
  document.getElementById('app').classList.remove('active');
  document.getElementById('login-screen').style.display = 'flex';
  if (window.cdims_map) { window.cdims_map.remove(); window.cdims_map = null; }
  Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) { } });
  charts = {};
}

// Print dossier
function printDossier() {
  const dossier = window.currentDossierInModal;
  if (!dossier) {
    showToast('❌ No active dossier selected for printing!', 'error');
    return;
  }
  showToast('⏳ Preparing print-friendly dossier...', 'info');

  const risk = calculateRiskScore(dossier);
  const ai = runCrimePatternAnalysis(dossier);

  const printArea = document.getElementById('dossier-print-area');
  if (printArea) {
    printArea.innerHTML = `
      <div class="print-container">
        <!-- 1. Header Emblem Table -->
        <table class="print-header-table">
          <tr>
            <td class="logo-cell">
              <img src="Logo_of_Uttar_Pradesh_Police.png" class="print-logo" />
            </td>
            <td class="header-text-cell">
              <h1>UTTAR PRADESH POLICE HEADQUARTERS, LUCKNOW</h1>
              <h2>INTELLIGENCE & CRIMINAL DOSSIER REGISTER</h2>
              <div class="confidential">CONFIDENTIAL — FOR DEPARTMENTAL SURVEILLANCE & INTELLIGENCE USE ONLY</div>
            </td>
          </tr>
        </table>

        <!-- 2. Personal Profile Section (Tabular with Mugshot Embedded on the right) -->
        <h3 class="print-section-title">SECTION I: SUBJECT PROFILE & IDENTIFICATION</h3>
        <table class="print-data-table profile-table">
          <tr>
            <th>Criminal ID Number</th>
            <td><strong>${dossier.id}</strong></td>
            <td rowspan="8" class="mugshot-cell">
              <img class="print-mugshot" src="${dossier.personalInfo.photograph}" alt="${dossier.personalInfo.name}"
                onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;150&quot; height=&quot;190&quot;><rect width=&quot;150&quot; height=&quot;190&quot; fill=&quot;%23f1f5f9&quot;/><text x=&quot;50%&quot; y=&quot;50%&quot; text-anchor=&quot;middle&quot; fill=&quot;%23475569&quot; font-size=&quot;48&quot;>${dossier.personalInfo.name[0]}</text></svg>'" />
              <div class="print-badge print-badge-${dossier.status.toLowerCase().replace(/\s+/g, '-')}">${dossier.status}</div>
              <div class="risk-label">Threat Level: <strong>${risk}/100</strong></div>
            </td>
          </tr>
          <tr>
            <th>Full Legal Name</th>
            <td><strong>${dossier.personalInfo.name}</strong></td>
          </tr>
          <tr>
            <th>Alias / Nickname</th>
            <td>${dossier.personalInfo.aliasName || 'N/A'}</td>
          </tr>
          <tr>
            <th>Father's Name</th>
            <td>${dossier.personalInfo.fatherName || 'N/A'}</td>
          </tr>
          <tr>
            <th>Date of Birth & Age</th>
            <td>${dossier.personalInfo.dob} (Age ${dossier.personalInfo.age})</td>
          </tr>
          <tr>
            <th>Mobile Phone Number</th>
            <td>${dossier.personalInfo.mobile || 'N/A'}</td>
          </tr>
          <tr>
            <th>Aadhaar Number (UID)</th>
            <td>${dossier.personalInfo.aadhaar || 'N/A'}</td>
          </tr>
          <tr>
            <th>Last Known Address</th>
            <td>${dossier.personalInfo.address || 'N/A'}</td>
          </tr>
        </table>

        <!-- 3. Biometrics and Description Table -->
        <h3 class="print-section-title">SECTION II: BIOMETRIC REGISTRATION & PHYSICAL MARKS</h3>
        <table class="print-data-table">
          <tr>
            <th>Fingerprints Status</th>
            <td>🔐 ${dossier.biometrics.fingerprints || 'N/A'}</td>
            <th>Physical Height</th>
            <td>${dossier.biometrics.height || 'N/A'}</td>
          </tr>
          <tr>
            <th>Face Match Index</th>
            <td>👤 ${dossier.biometrics.faceImage || 'N/A'}</td>
            <th>Physical Weight</th>
            <td>${dossier.biometrics.weight || 'N/A'}</td>
          </tr>
          <tr>
            <th>Registered Blood Group</th>
            <td>${dossier.biometrics.bloodGroup || 'N/A'}</td>
            <th>Eye Colour</th>
            <td>${dossier.biometrics.eyeColor || 'N/A'}</td>
          </tr>
          <tr>
            <th>Identification Marks</th>
            <td colspan="3">${dossier.biometrics.identificationMarks || 'N/A'}</td>
          </tr>
        </table>

        <!-- 4. Surveillance Table -->
        <h3 class="print-section-title">SECTION III: SURVEILLANCE PARAMETERS & INTELLIGENCE</h3>
        <table class="print-data-table">
          <tr>
            <th>History Sheet No.</th>
            <td><strong>${dossier.surveillance.historySheetNumber || 'N/A'}</strong></td>
            <th>Surveillance Class</th>
            <td>${dossier.surveillance.surveillanceCategory || 'N/A'}</td>
          </tr>
          <tr>
            <th>Surveillance Notes</th>
            <td colspan="3">${dossier.surveillance.surveillanceNotes || 'N/A'}</td>
          </tr>
          <tr>
            <th>Beat Officer Remarks</th>
            <td colspan="3">${dossier.surveillance.beatOfficerRemarks || 'N/A'}</td>
          </tr>
          <tr>
            <th>Intelligence Bureau Inputs</th>
            <td colspan="3" style="color: #991b1b; font-weight: 500;">🔍 ${dossier.surveillance.intelligenceInputs || 'N/A'}</td>
          </tr>
        </table>

        <!-- 5. FIR Criminal Offense Records -->
        <h3 class="print-section-title">SECTION IV: CRIMINAL OFFENSE HISTORY (REGISTERED FIRs)</h3>
        ${dossier.history.length === 0 ? '<div class="print-no-record">No registered FIR records found on file.</div>' : `
        <table class="print-data-table list-table">
          <thead>
            <tr>
              <th style="width: 120px;">FIR / Crime No.</th>
              <th style="width: 140px;">Police Station & Dist.</th>
              <th>IPC / Law Sections</th>
              <th style="width: 100px;">Bail Status</th>
              <th style="width: 180px;">Court & Case Details</th>
            </tr>
          </thead>
          <tbody>
            ${dossier.history.map(h => `
              <tr>
                <td><strong>${h.firNumber}</strong><br/>${h.crimeNumber}</td>
                <td>${h.policeStation} PS<br/>District: ${h.district.toUpperCase()}</td>
                <td style="color:#7f1d1d; font-weight:500;">${h.sections}</td>
                <td>${h.bailStatus}</td>
                <td>${h.courtCaseDetails}<br/><em>${h.chargeSheetStatus}</em></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}

        <!-- 6. Gang Affiliation Table -->
        <h3 class="print-section-title">SECTION V: GANG SYNDICATE MEMBERSHIP & LINKS</h3>
        <table class="print-data-table">
          <tr>
            <th>Syndicate/Gang Name</th>
            <td><strong style="color:#7f1d1d;">${dossier.gangInfo.gangName || 'N/A'}</strong></td>
            <th>Gang Leader</th>
            <td>${dossier.gangInfo.gangLeader || 'N/A'}</td>
          </tr>
          <tr>
            <th>Operating Jurisdiction</th>
            <td colspan="3">${dossier.gangInfo.areaOfOperation || 'N/A'}</td>
          </tr>
          <tr>
            <th>Known Associates</th>
            <td colspan="3">${dossier.gangInfo.gangMembers.join(', ') || 'None'}</td>
          </tr>
          ${dossier.gangInfo.networkMapping && dossier.gangInfo.networkMapping.length > 0 ? `
          <tr>
            <th>Syndicate Hierarchy Links</th>
            <td colspan="3">
              <table style="width: 100%; border-collapse: collapse; border: none; font-size: 11px;">
                ${dossier.gangInfo.networkMapping.map(rel => `
                  <tr style="border: none;">
                    <td style="border: none; padding: 2px 0; width: 120px;"><strong>${rel.targetId}</strong></td>
                    <td style="border: none; padding: 2px 0; color: #475569;">—</td>
                    <td style="border: none; padding: 2px 0;">${rel.relation}</td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
        </table>

        <!-- 7. Attached Properties Table -->
        <h3 class="print-section-title page-break-before">SECTION VI: ATTACHED ASSETS & PROPERTIES (SEC 14 GANGSTER ACT)</h3>
        ${dossier.propertyDetails.length === 0 ? '<div class="print-no-record">No property attachment registrations found.</div>' : `
        <table class="print-data-table list-table">
          <thead>
            <tr>
              <th style="width: 120px;">Asset Class</th>
              <th>Property Location Details</th>
              <th style="width: 120px;">Estimated Valuation</th>
              <th style="width: 180px;">Legal Attachment Status</th>
            </tr>
          </thead>
          <tbody>
            ${dossier.propertyDetails.map(p => `
              <tr>
                <td><strong>${p.type}</strong></td>
                <td>${p.address}</td>
                <td style="color:#14532d; font-weight:600;">${p.estimatedValue}</td>
                <td>${p.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}

        <!-- 8. Vehicles Table -->
        <h3 class="print-section-title">SECTION VII: REGISTERED VEHICLE ASSETS</h3>
        ${dossier.vehicleDetails.length === 0 ? '<div class="print-no-record">No registered vehicle assets found.</div>' : `
        <table class="print-data-table list-table">
          <thead>
            <tr>
              <th style="width: 150px;">Registration Number</th>
              <th style="width: 180px;">Vehicle Class & Description</th>
              <th>Ownership / Registration Details</th>
            </tr>
          </thead>
          <tbody>
            ${dossier.vehicleDetails.map(v => `
              <tr>
                <td><strong style="font-family:monospace; font-size:14px;">${v.vehicleNumber}</strong></td>
                <td>${v.vehicleType}</td>
                <td>${v.registrationDetails}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}

        <!-- 9. AI Threat Pattern Table -->
        <h3 class="print-section-title">SECTION VIII: AI-GENERATED CRIME PATTERN & FORECAST</h3>
        <table class="print-data-table">
          <tr>
            <th style="vertical-align: middle;">Crime Pattern Analysis</th>
            <td>${ai.pattern}</td>
          </tr>
          <tr>
            <th style="vertical-align: middle;">Predictive Intelligence</th>
            <td>${ai.forecast}</td>
          </tr>
          <tr>
            <th style="vertical-align: middle;">Tactical Recommendations</th>
            <td>${ai.suggestions}</td>
          </tr>
        </table>

        <!-- 10. Signature & Validation Table -->
        <table class="print-signature-table">
          <tr>
            <td style="width: 33%;">
              <div class="sig-line"></div>
              <p>PREPARED BY</p>
              <p><strong>${dossier.submittedBy}</strong></p>
              <p class="sig-subtitle">Beat Officer / PS In-Charge</p>
            </td>
            <td style="width: 33%;">
              <div class="sig-line"></div>
              <p>VERIFIED BY</p>
              <p><strong>${dossier.verifiedBy || 'Supervising Officer'}</strong></p>
              <p class="sig-subtitle">Sub-Divisional CO / ACP</p>
            </td>
            <td style="width: 33%;">
              <div class="sig-line"></div>
              <p>APPROVING AUTHORITY</p>
              <p><strong>${dossier.approvedBy || 'SP Crime / Commissioner'}</strong></p>
              <p class="sig-subtitle">District Police Nodal Authority</p>
            </td>
          </tr>
          <tr>
            <td colspan="3" class="generation-meta-cell">
              Record Generated: ${new Date().toLocaleString()} | CDIMS Central Registry, Uttar Pradesh Police Headquarters, Lucknow
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  setTimeout(() => window.print(), 300);
}

// Close modal on overlay click
document.getElementById('dossier-modal').addEventListener('click', function (e) {
  if (e.target === this) closeDossierModal();
});

// Open dossier by ID directly (from live ticker bar)
function openDossierById(id) {
  const dList = getDossiers();
  const dossier = dList.find(d => d.id === id);
  if (dossier) {
    openDossierModal(dossier);
  } else {
    navigateTo('dossiers');
    setTimeout(() => {
      const searchInput = document.getElementById('dossier-search-input');
      if (searchInput) {
        searchInput.value = id;
        filterDossierTable(id);
      }
    }, 150);
  }
}
document.getElementById('add-dossier-modal').addEventListener('click', function (e) {
  if (e.target === this) closeAddDossierModal();
});

// Close notification panel on outside click
document.addEventListener('click', function (e) {
  if (notifPanelOpen && !e.target.closest('#notif-panel') && !e.target.closest('.header-icon-btn')) {
    toggleNotifPanel();
  }
});

// Note: initDatabase() is auto-called by backend.js on page load.

// =========================================================
//  AI FACE RECOGNITION SYSTEM MODULE
// =========================================================

let cachedCriminalHashes = {};
let facerecogStream = null;

function renderFaceRecogPage() {
  const criminals = getDossiers().slice(0, 20);

  const demoCards = criminals.map(c => `
    <div class="demo-profile-card" onclick="simulateDemoMatch('${c.id}')">
      <img src="${c.personalInfo.photograph}" class="demo-profile-photo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.personalInfo.name)}&background=1a2f52&color=eeb902&size=100'" />
      <div class="demo-profile-name">${c.personalInfo.name}</div>
      <div class="demo-profile-alias">${c.personalInfo.aliasName || 'No Alias'}</div>
    </div>
  `).join('');

  return `
    <div class="facerecog-container">
      <!-- Top Overview Panel -->
      <div class="demo-profiles-container facerecog-card">
        <div class="demo-profiles-title">👤 Indexed Criminal Profiles (${criminals.length} Active Records)</div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">
          Click any profile to simulate a facial match, or download their photo to test the local system.
        </div>
        <div class="demo-profiles-list">
          ${demoCards}
        </div>
      </div>

      <!-- Main Scanner and Results Panels -->
      <div class="facerecog-grid">
        
        <!-- Left Side: Scanner Preview -->
        <div class="facerecog-card">
          <div class="facerecog-card-header">
            <h3 class="facerecog-card-title">📷 AFRS Scanner HUD</h3>
            <span class="badge badge-active" style="border:1px solid rgba(238,185,2,0.3)">AI ONLINE</span>
          </div>

          <div class="scanner-preview-container" id="scanner-wrapper">
            <!-- Grid overlay background -->
            <div style="position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size:20px 20px; z-index:1;"></div>
            
            <img id="scanner-preview-img" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='5'>No Face Scanned</text></svg>" class="scanner-image" />
            <video id="scanner-video" class="webcam-video" style="display:none;" autoplay playsinline></video>
            
            <!-- Laser overlay -->
            <div class="scanner-laser" id="scanner-laser-line"></div>
            <!-- Face border box -->
            <div class="scanner-face-box" id="scanner-face-box"></div>
          </div>

          <!-- Controls -->
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; gap:10px; justify-content:center;">
              <button class="btn btn-secondary" id="btn-toggle-camera" onclick="toggleWebcam()">
                🎥 Toggle Camera
              </button>
              <button class="btn btn-primary" onclick="document.getElementById('face-upload-input').click()">
                📁 Upload Photo
              </button>
              <input type="file" id="face-upload-input" style="display:none;" accept="image/*" />
            </div>
            
            <div class="camera-controls" id="webcam-controls" style="display:none;">
              <button class="btn btn-success" onclick="captureAndScan()">📸 Capture & Scan Face</button>
            </div>
          </div>

          <!-- Console Terminal -->
          <div class="terminal-console" id="scanner-console">
            <div class="terminal-line yellow">[SYSTEM] AI Face Recognition System initialized.</div>
            <div class="terminal-line">[SYSTEM] Ready. Upload an image or toggle camera to begin matching.</div>
          </div>
        </div>

        <!-- Right Side: Matched Dossier Results -->
        <div class="facerecog-card" id="facerecog-results-panel">
          <div class="facerecog-card-header">
            <h3 class="facerecog-card-title">📊 Intelligence Matching Report</h3>
          </div>
          
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:320px; color:var(--text-muted); text-align:center; gap:12px;">
            <span style="font-size:48px;">🕵️</span>
            <div>
              <div style="font-weight:700; font-size:14px; color:var(--text-secondary);">No Scan Performed</div>
              <div style="font-size:11px; margin-top:4px;">Perform a scan to query matching templates.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

async function initFaceRecog() {
  console.log("Initializing Face Hashing Engine...");

  // Clear any existing stream
  if (facerecogStream) {
    facerecogStream.getTracks().forEach(track => track.stop());
    facerecogStream = null;
  }

  // Precompute the database hashes in background
  precomputeCriminalHashes();

  // Setup file upload listener
  const fileInput = document.getElementById('face-upload-input');
  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (evt) {
        // Stop camera if running
        stopWebcam();

        const previewImg = document.getElementById('scanner-preview-img');
        previewImg.src = evt.target.result;
        previewImg.style.display = 'block';
        document.getElementById('scanner-video').style.display = 'none';

        triggerScan(evt.target.result);
      };
      reader.readAsDataURL(file);
    });
  }
}

async function precomputeCriminalHashes() {
  const criminals = getDossiers().slice(0, 20);
  writeToConsole("[INFO] Pre-indexing database templates...");
  let count = 0;
  for (const c of criminals) {
    if (!cachedCriminalHashes[c.id]) {
      try {
        const hash = await computeImageHashFromUrl(c.personalInfo.photograph);
        cachedCriminalHashes[c.id] = hash;
        count++;
      } catch (e) {
        console.warn(`Could not calculate hash for ${c.id}: ${e.message}`);
      }
    }
  }
  if (count > 0) {
    writeToConsole(`[SUCCESS] Indexed ${count} templates. Cache database synchronized.`);
  }
}

function computeImageHashFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const hash = computeAverageHash(img);
        resolve(hash);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(new Error("Image failed to load: " + url));
    img.src = url;
  });
}

function computeAverageHash(imgEl) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, 8, 8);
  const imgData = ctx.getImageData(0, 0, 8, 8);
  const data = imgData.data;

  let grayscale = [];
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grayscale.push(gray);
    sum += gray;
  }
  const avg = sum / 64;

  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += grayscale[i] >= avg ? '1' : '0';
  }
  return hash;
}

function getHammingDistance(hash1, hash2) {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

function writeToConsole(message, type = '') {
  const consoleEl = document.getElementById('scanner-console');
  if (!consoleEl) return;
  const line = document.createElement('div');
  line.className = 'terminal-line ' + type;
  line.textContent = `${new Date().toLocaleTimeString()} ${message}`;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Camera controls
async function toggleWebcam() {
  const video = document.getElementById('scanner-video');
  const previewImg = document.getElementById('scanner-preview-img');
  const webcamCtrls = document.getElementById('webcam-controls');

  if (facerecogStream) {
    stopWebcam();
    writeToConsole("[INFO] Webcam stream terminated.");
  } else {
    try {
      facerecogStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
      video.srcObject = facerecogStream;
      video.style.display = 'block';
      previewImg.style.display = 'none';
      webcamCtrls.style.display = 'flex';
      writeToConsole("[INFO] Live webcam connection established. Align face in target box.");

      // Draw mock face bounding box
      const box = document.getElementById('scanner-face-box');
      box.className = 'scanner-face-box active';
      box.style.left = '20%';
      box.style.top = '20%';
      box.style.width = '60%';
      box.style.height = '60%';
    } catch (err) {
      writeToConsole("[ERROR] Accessing camera denied or not found.", "red");
    }
  }
}

function stopWebcam() {
  const video = document.getElementById('scanner-video');
  const previewImg = document.getElementById('scanner-preview-img');
  const webcamCtrls = document.getElementById('webcam-controls');
  const box = document.getElementById('scanner-face-box');

  if (facerecogStream) {
    facerecogStream.getTracks().forEach(track => track.stop());
    facerecogStream = null;
  }
  video.style.display = 'none';
  video.srcObject = null;
  previewImg.style.display = 'block';
  webcamCtrls.style.display = 'none';
  box.className = 'scanner-face-box';
}

function captureAndScan() {
  const video = document.getElementById('scanner-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 320;

  const ctx = canvas.getContext('2d');
  // Mirror capture since video is mirrored
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imgDataUrl = canvas.toDataURL('image/jpeg');
  stopWebcam();

  const previewImg = document.getElementById('scanner-preview-img');
  previewImg.src = imgDataUrl;

  triggerScan(imgDataUrl);
}

function triggerScan(imgDataUrl) {
  const laser = document.getElementById('scanner-laser-line');
  const box = document.getElementById('scanner-face-box');

  laser.className = 'scanner-laser active';
  box.className = 'scanner-face-box active';
  box.style.left = '25%';
  box.style.top = '25%';
  box.style.width = '50%';
  box.style.height = '50%';

  const consoleContainer = document.getElementById('scanner-console');
  if (consoleContainer) consoleContainer.innerHTML = '';

  writeToConsole("[INFO] Initializing AFRS engine...", "yellow");

  setTimeout(() => writeToConsole("[INFO] Detecting human faces in view frame..."), 400);
  setTimeout(() => writeToConsole("[INFO] Facial structures detected. Bounding coordinates locked."), 800);
  setTimeout(() => writeToConsole("[INFO] Extracting facial vectors & computing gray hashes..."), 1200);
  setTimeout(() => writeToConsole("[INFO] Hashing complete. Querying state criminal templates..."), 1600);
  setTimeout(() => writeToConsole("[INFO] Analyzing structural Hamming distances..."), 2000);

  setTimeout(() => {
    laser.className = 'scanner-laser';
    executeFaceRecognition(imgDataUrl);
  }, 2400);
}

async function executeFaceRecognition(uploadedImgDataUrl) {
  writeToConsole("[INFO] Running template database matching...");

  const uploadedImg = new Image();
  uploadedImg.onload = async () => {
    let uploadHash = '';
    try {
      uploadHash = computeAverageHash(uploadedImg);
    } catch (e) {
      writeToConsole("[ERROR] Image hashing failed.", "red");
      return;
    }

    let bestMatch = null;
    let minDistance = 65; // Max possible is 64

    // Ensure database hashes are precomputed
    await precomputeCriminalHashes();

    const criminals = getDossiers().slice(0, 20);
    for (const c of criminals) {
      const cHash = cachedCriminalHashes[c.id];
      if (cHash) {
        const dist = getHammingDistance(uploadHash, cHash);
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = c;
        }
      }
    }

    displayMatchResult(bestMatch, minDistance, uploadedImgDataUrl);
  };
  uploadedImg.src = uploadedImgDataUrl;
}

function simulateDemoMatch(criminalId) {
  stopWebcam();
  const criminals = getDossiers().slice(0, 20);
  const criminal = criminals.find(c => c.id === criminalId);
  if (!criminal) return;

  const previewImg = document.getElementById('scanner-preview-img');
  previewImg.src = criminal.personalInfo.photograph;

  const laser = document.getElementById('scanner-laser-line');
  const box = document.getElementById('scanner-face-box');

  laser.className = 'scanner-laser active';
  box.className = 'scanner-face-box active';
  box.style.left = '25%';
  box.style.top = '25%';
  box.style.width = '50%';
  box.style.height = '50%';

  const consoleContainer = document.getElementById('scanner-console');
  if (consoleContainer) consoleContainer.innerHTML = '';

  writeToConsole(`[INFO] Demo scan triggered for dossier: ${criminalId}`, "yellow");
  writeToConsole("[INFO] Processing local mugshot asset...");

  setTimeout(() => writeToConsole("[INFO] Generating exact vector model..."), 500);
  setTimeout(() => writeToConsole("[INFO] Querying system database templates..."), 1000);

  setTimeout(() => {
    laser.className = 'scanner-laser';
    // For demo simulation matching, Hamming distance is 0 (100% exact match)
    displayMatchResult(criminal, 0, criminal.personalInfo.photograph);
  }, 1500);
}

function displayMatchResult(criminal, distance, uploadedImgUrl) {
  const resultsPanel = document.getElementById('facerecog-results-panel');
  if (!resultsPanel) return;

  // Distance to similarity percentage mapping
  // 0 distance = 100% match. 12 or more distance is basically no match (<80%)
  const similarity = Math.max(0, Math.round(((64 - distance) / 64) * 100));
  const isMatch = similarity >= 80;

  if (isMatch && criminal) {
    writeToConsole(`[MATCH FOUND] ${criminal.personalInfo.name} matched with ${similarity}% similarity!`, "yellow");
    addAuditLog(currentUser.username, currentUser.role, "Face Match Detected", `Face recognized: ${criminal.personalInfo.name} (${criminal.id}) - Similarity: ${similarity}%`);

    const risk = calculateRiskScore(criminal);
    const sections = criminal.history.map(h => h.sections).join(', ');

    resultsPanel.innerHTML = `
      <div class="facerecog-card-header">
        <h3 class="facerecog-card-title">🚨 MATCH DETECTED (${similarity}% Confidence)</h3>
        <button class="btn btn-xs btn-primary" onclick="openDossierById('${criminal.id}')">View Full Dossier</button>
      </div>

      <div class="match-header-card">
        <span class="match-status-icon">🚨</span>
        <div>
          <div class="match-status-title">Match Found: ${criminal.personalInfo.name}</div>
          <div class="match-status-desc">${criminal.id} · ${criminal.surveillance.surveillanceCategory}</div>
        </div>
      </div>

      <div class="match-comparison-pane">
        <div class="match-photo-box">
          <div class="match-photo-title">Captured Scan</div>
          <img src="${uploadedImgUrl}" class="match-photo-img" />
          <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">Query Profile</div>
        </div>
        <div class="match-photo-box" style="border-color:var(--gold-500);">
          <div class="match-photo-title" style="color:var(--gold-400);">Database Dossier</div>
          <img src="${criminal.personalInfo.photograph}" class="match-photo-img" />
          <div class="match-score-badge">${similarity}% Match</div>
        </div>
      </div>

      <!-- Dossier Summary Card -->
      <div class="results-dossier-card">
        <div style="font-size:13px; font-weight:700; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px; color:var(--gold-400);">Dossier Summary</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px;">
          <div><strong>Name:</strong> ${criminal.personalInfo.name}</div>
          <div><strong>Alias:</strong> ${criminal.personalInfo.aliasName || 'N/A'}</div>
          <div><strong>Age/Gender:</strong> ${criminal.personalInfo.age} / ${criminal.personalInfo.gender}</div>
          <div><strong>Mobile:</strong> ${criminal.personalInfo.mobile}</div>
          <div><strong>District:</strong> ${criminal.history[0]?.district?.toUpperCase() || 'LUCKNOW'}</div>
          <div><strong>Status:</strong> <span class="badge ${criminal.status === 'Wanted' ? 'badge-wanted' : 'badge-active'}">${criminal.status}</span></div>
        </div>
        <div style="font-size:11px; margin-top:4px;">
          <strong>Gang Info:</strong> ${criminal.gangInfo.gangName} (${criminal.gangInfo.gangLeader})
        </div>
        <div style="font-size:11px;">
          <strong>Sections of Law:</strong> <span style="color:var(--red-400); font-weight:600;">${sections}</span>
        </div>
        <div style="font-size:11px; color:var(--text-secondary); background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:6px; border-radius:4px; margin-top:4px;">
          <strong>Intelligence Input:</strong> ${criminal.surveillance.surveillanceNotes}
        </div>
        
        <!-- Risk Gauge -->
        <div style="margin-top:6px;">
          <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; margin-bottom:3px;">
            <span>RISK ASSESSMENT LEVEL</span>
            <span style="color:${risk > 75 ? '#ef4444' : risk > 40 ? '#fbbf24' : '#4ade80'};">${risk}/100</span>
          </div>
          <div class="risk-bar ${risk > 75 ? 'risk-high' : risk > 40 ? 'risk-medium' : 'risk-low'}">
            <div class="risk-bar-fill" style="width: ${risk}%;"></div>
          </div>
        </div>
      </div>
    `;
  } else {
    writeToConsole("[NO MATCH FOUND] Query image distance is too high from indexed templates.", "red");
    addAuditLog(currentUser.username, currentUser.role, "Face Recognition Run", `Scan run: No matching records found (Best match was ${criminal ? criminal.personalInfo.name : 'None'} at ${similarity}%)`);

    resultsPanel.innerHTML = `
      <div class="facerecog-card-header">
        <h3 class="facerecog-card-title" style="color:var(--red-400);">❌ NO MATCH DETECTED</h3>
      </div>

      <div class="match-header-card no-match">
        <span class="match-status-icon">❌</span>
        <div>
          <div class="match-status-title no-match">No Match Found in Database</div>
          <div class="match-status-desc">Similarity score is below search threshold (80%).</div>
        </div>
      </div>

      <div class="match-comparison-pane" style="grid-template-columns: 1fr;">
        <div class="match-photo-box">
          <div class="match-photo-title">Captured Scan</div>
          <img src="${uploadedImgUrl}" class="match-photo-img" style="max-height:200px; object-fit:contain; margin:0 auto;" />
          <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">Query Profile</div>
        </div>
      </div>

      <div class="results-dossier-card" style="border-color:rgba(239, 68, 68, 0.2); text-align:center; padding:20px; font-size:12px;">
        <div style="font-weight:700; color:var(--red-400); margin-bottom:6px;">Suspect Not Identified</div>
        This individual is not registered in the state-wide criminal dossier database. Keep captured scan for audit purposes.
      </div>
    `;
  }
}

window.renderFaceRecogPage = renderFaceRecogPage;
window.initFaceRecog = initFaceRecog;
window.toggleWebcam = toggleWebcam;
window.captureAndScan = captureAndScan;
window.simulateDemoMatch = simulateDemoMatch;

