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

// ── Navigation ──
function navigateTo(view) {
  currentView = view;
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${view}`);
  if (navEl) navEl.classList.add('active');

  // Destroy old charts
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};

  // Close notif panel
  if (notifPanelOpen) toggleNotifPanel();

  // Destroy map if navigating away
  if (view !== 'map' && window.cdims_map) {
    window.cdims_map.remove();
    window.cdims_map = null;
  }

  // Render the view
  const content = document.getElementById('page-content');
  const header = document.getElementById('page-title');
  const headerSub = document.getElementById('page-subtitle');

  switch(view) {
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
      setTimeout(() => renderNetworkGraph('network-container'), 100);
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
  const pendingDossiers = dossiers.filter(d => d.approvalStatus === 'Pending Verification');

  return `
    <div class="dashboard-console">
      <!-- SECTION 1: METRICS OVERVIEW (Loaded Immediately) -->
      <section id="dash-sec-overview" class="dashboard-section visible">
        ${pendingDossiers.length > 0 && currentUser.level >= 2 ? `
        <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px; margin-bottom: 16px; animation: fadeInModal 0.3s ease;">
          <span style="font-size:22px;">⚠️</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; color:#fbbf24; font-size:13px;">Pending Review: ${pendingDossiers.length} Criminal Dossiers</div>
            <div style="font-size:11px; color:var(--text-secondary);">Dossiers awaiting verification & approval for district records</div>
          </div>
          <button class="btn btn-sm" style="background:rgba(245,158,11,0.2);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);" onclick="navigateTo('dossiers')">Verify Records</button>
        </div>` : ''}

        <div class="stats-grid-modern">
          ${statCardCompact('👥', stats.totalCriminals, t('totalCriminals'), '', "navigateTo('dossiers')")}
          ${statCardCompact('🔴', stats.activeCriminals, t('activeCriminals'), 'danger', "navigateTo('dossiers')")}
          ${statCardCompact('📋', stats.historySheeters, t('historySheeters'), 'warning', "navigateTo('dossiers')")}
          ${statCardCompact('⛔', stats.gangsters, t('gangsters'), 'danger', "navigateTo('dossiers')")}
          ${statCardCompact('🚨', stats.wantedCriminals, t('wantedCriminals'), 'danger', "navigateTo('dossiers')")}
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
              <div class="chart-card-title">🏛️ District-wise Cases</div>
            </div>
            <div class="district-bars-modern" id="district-bars">
              <div class="map-lazy-placeholder">
                <span class="spinner-icon">📊</span> Loading district metrics...
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- SECTION 3: GEOSPATIAL MAP & RECENT DOSSIERS (Lazy Loaded) -->
      <section id="dash-sec-map" class="dashboard-section lazy-section">
        <div class="dashboard-row-two-col map-dossiers-row">
          
          <!-- Leaflet GIS Map Card -->
          <div class="map-card-modern">
            <div class="section-header">
              <h3>🗺️ GIS Crime Mapping & Hotspots</h3>
            </div>
            <div id="dashboard-map-container" class="map-container-modern">
              <div class="map-lazy-placeholder">
                <span class="spinner-icon">📡</span> Loading GIS Crime Mapping Engine...
              </div>
            </div>
          </div>
          
          <!-- Recent Criminal Dossiers -->
          <div class="recent-dossiers-card">
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
    const villages   = (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[stationKey]) || [];
    return statCardCompact(
      '🏘️', villages.length,
      'Villages (This Station)',
      'success',
      'showSHOVillageListModal()'
    );
  }

  // ── Level 2: SP/CO — station count, click → station detail modal ──
  if (lvl === 2) {
    const dist     = MASTER_DATA.districts.find(d => d.id === currentUser.district);
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
    statCardCompact('🏛️', MASTER_DATA.totals.districts,      t('districts'),      'info',    "navigateTo('dossiers')"),
    statCardCompact('🚔', MASTER_DATA.totals.policeStations, t('policeStations'),  'success', "navigateTo('dossiers')")
  ].join('');
}

// ══════════════════════════════════════════════════════════
//  SHO: VILLAGE LIST MODAL  →  VILLAGE DETAIL MODAL
// ══════════════════════════════════════════════════════════
function showSHOVillageListModal() {
  const stationKey = currentUser.station.split(' PS')[0].trim();
  const villages   = (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[stationKey]) || [];
  const dossiers   = getDossiers();

  // Build village cards
  const villageCards = villages.map(v => {
    const criminals = dossiers.filter(d =>
      d.personalInfo.village === v ||
      d.history.some(h => h.policeStation.toLowerCase() === stationKey.toLowerCase())
    ).filter(d => d.personalInfo.village === v);

    const wantedCount = criminals.filter(d => d.status === 'Wanted').length;
    const badge       = criminals.length > 0
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
  const dossiers  = getDossiers();
  const criminals = dossiers.filter(d => d.personalInfo.village === villageName);

  const statusColor = s =>
    s === 'Wanted'      ? { bg: 'rgba(239,68,68,0.15)',    fg: '#f87171' } :
    s === 'Active'      ? { bg: 'rgba(245,158,11,0.15)',   fg: '#fbbf24' } :
    s === 'In Jail'     ? { bg: 'rgba(99,102,241,0.15)',   fg: '#a78bfa' } :
    s === 'Out on Bail' ? { bg: 'rgba(34,197,94,0.12)',    fg: '#4ade80' } :
                          { bg: 'rgba(100,116,139,0.15)',  fg: '#94a3b8' };

  const cards = criminals.map(d => {
    const risk  = calculateRiskScore(d);
    const col   = statusColor(d.status);
    const fir   = d.history[0] || {};
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

  const dossiers       = getDossiers();
  const totalStations  = dist.circles.reduce((n, c) => n + c.stations.length, 0);

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
  const stats = generateStatistics();
  const distBar = document.getElementById('district-bars');
  if (distBar) {
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
//  DOSSIER LIST VIEW
// ══════════════════════════════════════════════════════════
function renderDossierList() {
  const dossiers = getDossiers();
  return `
    <div class="table-card">
      <div class="table-header">
        <div class="table-title">📁 ${t('dossiers')} (${dossiers.length})</div>
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
          ${currentUser.level >= 2 ? `
          <select class="filter-select" id="filter-approval" onchange="filterDossierTable(document.getElementById('dossier-search-input').value)">
            <option value="all">All Approvals</option>
            <option value="Pending Verification">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Returned for Correction">Returned</option>
          </select>` : ''}
          ${currentUser.level === 1 ? `<button class="btn btn-primary btn-sm" onclick="openAddDossierModal()">➕ ${t('addDossier')}</button>` : ''}
        </div>
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
  const results = searchDossiers({ query, status, approvalStatus: approval });
  const container = document.getElementById('dossier-table-container');
  if (container) container.innerHTML = renderDossierTable(results);
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
                  <div style="font-size:10px; font-weight:700; margin-top:3px; color:${risk>=70?'#f87171':risk>=40?'#fbbf24':'#4ade80'}">${risk}/100</div>
                </td>
                <td>${approvalBadge(d.approvalStatus)}</td>
                <td>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn btn-xs btn-secondary" onclick="openDossierModal(getDossiers().find(x=>x.id==='${d.id}'))">👁️ View</button>
                    ${currentUser.level >= 2 && d.approvalStatus === 'Pending Verification' ? `
                      <button class="btn btn-xs btn-success" onclick="quickApprove('${d.id}')">✅</button>
                      <button class="btn btn-xs btn-danger" onclick="quickReturn('${d.id}')">↩️</button>
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
  const map = { 'Approved': 'badge-approved', 'Pending Verification': 'badge-pending', 'Returned for Correction': 'badge-returned' };
  const icons = { 'Approved': '✅', 'Pending Verification': '⏳', 'Returned for Correction': '↩️' };
  return `<span class="badge ${map[status] || 'badge-pending'}">${icons[status] || ''} ${status}</span>`;
}
function categoryBadgeClass(cat) {
  if (cat.includes('A')) return 'badge badge-cat-a';
  if (cat.includes('B')) return 'badge badge-cat-b';
  return 'badge badge-cat-c';
}

function quickApprove(id) {
  if (approveDossier(id, currentUser)) {
    showToast('✅ Dossier approved successfully!', 'success');
    navigateTo('dossiers');
  }
}
function quickReturn(id) {
  const remarks = prompt('Enter remarks for correction:');
  if (remarks) {
    returnDossierForCorrection(id, remarks, currentUser);
    showToast('↩️ Dossier returned for correction.', 'warning');
    navigateTo('dossiers');
  }
}

// ══════════════════════════════════════════════════════════
//  DOSSIER MODAL
// ══════════════════════════════════════════════════════════
function openDossierModal(dossier) {
  if (!dossier) return;
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
          <div style="font-size:14px; font-weight:800; margin-top:4px; color:${risk>=70?'#f87171':risk>=40?'#fbbf24':'#4ade80'}">${risk}/100</div>
        </div>
        <div style="margin-top:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px;">SUBMITTED BY</div>
          <div style="font-size:11px; font-weight:600;">${dossier.submittedBy}</div>
          <div style="font-size:10px; color:var(--text-muted); margin-top:6px;">APPROVAL STATUS</div>
          <div style="margin-top:4px;">${approvalBadge(dossier.approvalStatus)}</div>
        </div>
        ${currentUser.level >= 2 && dossier.approvalStatus === 'Pending Verification' ? `
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
}

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
    <div style="margin-bottom:16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
      <div style="display:flex; gap:10px; align-items:center;">
        <span class="badge badge-wanted">🔴 Cat A: Drag nodes to explore</span>
        <span class="badge badge-active">🟡 Cat B</span>
        <span class="badge badge-approved">🟢 Cat C</span>
        <span class="badge badge-jail">🔵 In Jail</span>
        <span style="font-size:11px; color:var(--text-muted);">Click any node to open dossier</span>
      </div>
      <div style="margin-left:auto;">
        <button class="btn btn-sm btn-secondary" onclick="renderNetworkGraph('network-container')">🔄 Refresh Graph</button>
      </div>
    </div>
    <div id="network-container"></div>
    <div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px;">
      <div class="stat-card" style="padding:14px;">
        <div style="font-size:12px; color:var(--text-muted);">ACTIVE GANGS</div>
        <div style="font-size:28px; font-weight:900; margin-top:4px;">2</div>
        <div style="font-size:11px; color:var(--text-secondary);">D-102 (Raju Kaana), G-110 (Gujjar)</div>
      </div>
      <div class="stat-card" style="padding:14px;">
        <div style="font-size:12px; color:var(--text-muted);">TOTAL LINKS MAPPED</div>
        <div style="font-size:28px; font-weight:900; margin-top:4px;">5</div>
        <div style="font-size:11px; color:var(--text-secondary);">Criminal association graph</div>
      </div>
      <div class="stat-card danger" style="padding:14px;">
        <div style="font-size:12px; color:var(--text-muted);">HIGH-RISK NODES</div>
        <div style="font-size:28px; font-weight:900; margin-top:4px;">2</div>
        <div style="font-size:11px; color:var(--text-secondary);">Risk Score ≥ 70</div>
      </div>
    </div>
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
          ${dossiers.sort((a,b) => calculateRiskScore(b) - calculateRiskScore(a)).slice(0,5).map(d => {
            const risk = calculateRiskScore(d);
            const riskClass = risk >= 70 ? 'risk-high' : risk >= 40 ? 'risk-medium' : 'risk-low';
            return `
              <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                  <span style="font-size:12px; font-weight:700;">${d.personalInfo.name}</span>
                  <span style="font-size:12px; font-weight:800; color:${risk>=70?'#f87171':risk>=40?'#fbbf24':'#4ade80'}">${risk}/100</span>
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
          { label: 'Lucknow', data: [8,10,9,12,15,13,10,16,18,16,13,20], borderColor: '#EEB902', tension: 0.4, borderWidth: 2, pointRadius: 3 },
          { label: 'Varanasi', data: [4,6,5,7,8,7,5,9,10,9,7,11], borderColor: '#ef4444', tension: 0.4, borderWidth: 2, pointRadius: 3 },
          { label: 'Prayagraj', data: [3,4,4,5,6,5,4,7,8,7,5,8], borderColor: '#3b82f6', tension: 0.4, borderWidth: 2, pointRadius: 3 },
          { label: 'Noida', data: [5,7,6,8,9,8,6,9,11,10,8,12], borderColor: '#8b5cf6', tension: 0.4, borderWidth: 2, pointRadius: 3 }
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
            <div style="font-size:10px; margin-top:4px; color:${ch[2].includes('✅')?'var(--green-400)':'var(--amber-400)'};">${ch[2]}</div>
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

function generateReport(type, format) {
  showToast(`📊 Generating ${type.toUpperCase()} report${format ? ' as ' + format.toUpperCase() : ''}...`, 'info');
  setTimeout(() => {
    showToast(`✅ Report generated successfully! Download initiated.`, 'success');
    addAuditLog(currentUser.username, currentUser.role, 'Generate Report', `Generated ${type} report as ${format || 'PDF'}`);
  }, 1500);
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
                <td><span class="badge ${u.level==='L3'?'badge-wanted':u.level==='L2'?'badge-active':'badge-bail'}">${u.level}</span></td>
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
    <div style="margin-top:20px; display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px;">
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
        ${[['Multi-Factor Auth','✅ Enabled'],['Aadhaar SSO','⏳ Setup Pending'],['End-to-End Encryption','✅ Active'],['Session Timeout','✅ 30 min'],['IP Whitelisting','⚠️ Not Set']].map(s=>`
          <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:12px;">
            <span>${s[0]}</span>
            <span style="color:${s[1].includes('✅')?'var(--green-400)':s[1].includes('⚠️')?'var(--amber-400)':'var(--text-muted)'};">${s[1]}</span>
          </div>
        `).join('')}
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
function submitNewDossier() {
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

  addDossier(newDossier, currentUser);
  closeAddDossierModal();
  showToast(`✅ Dossier for "${name}" created successfully! Pending district review.`, 'success');
  navigateTo('dossiers');
}

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
    background:var(--navy-800); border:1px solid ${colors[type]||colors.info};
    border-left: 4px solid ${colors[type]||colors.info};
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
  return window.VILLAGES_BY_STATION[stationName] || [];
}

function getCriminalsInVillage(stationName, villageName) {
  const dossiers = getDossiers();
  return dossiers.filter(d => {
    const isOfStation = d.history.some(h => h.policeStation.toLowerCase() === stationName.toLowerCase()) || 
                         d.submittedBy.toLowerCase().includes(stationName.toLowerCase());
    return isOfStation && d.personalInfo.village === villageName;
  });
}

window.onVillageDistrictChange = function(districtId) {
  selectedVillageDistrict = districtId;
  const stations = getStationsForDistrict(districtId);
  selectedVillageStation = stations[0] || '';
  const villages = getVillagesForStation(selectedVillageStation);
  selectedVillageName = villages[0] || null;
  
  const content = document.getElementById('page-content');
  if (content) content.innerHTML = renderVillageDirectory();
};

window.onVillageStationChange = function(stationName) {
  selectedVillageStation = stationName;
  const villages = getVillagesForStation(stationName);
  selectedVillageName = villages[0] || null;

  const content = document.getElementById('page-content');
  if (content) content.innerHTML = renderVillageDirectory();
};

window.selectVillage = function(villageName) {
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

window.openAddDossierModalWithVillage = function() {
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

window.onModalDistrictChange = function() {
  const districtSelect = document.getElementById('f-district');
  const stationSelect = document.getElementById('f-ps');
  const villageSelect = document.getElementById('f-village');
  if (!districtSelect || !stationSelect || !villageSelect) return;

  const districtId = districtSelect.value;
  const stations = getStationsForDistrict(districtId);
  
  stationSelect.innerHTML = stations.map(s => `<option value="${s}">${s}</option>`).join('');
  window.onModalStationChange();
};

window.onModalStationChange = function() {
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
    
    <div class="village-layout" style="display:grid; grid-template-columns: 280px 1fr; gap: 20px;">
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
              <div style="font-size:10px; font-weight:700; text-align:center; margin-top:2px; color:${risk>=70?'#f87171':risk>=40?'#fbbf24':'#4ade80'}">${risk}/100</div>
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

window.openEditStatusInVillage = function(id) {
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

  updateDossier(d, currentUser);
  showToast(`✅ Status for ${d.personalInfo.name} updated to ${newStatus}.`, 'success');
  navigateTo('villages');
};

// ══════════════════════════════════════════════════════════
//  LOGIN / LOGOUT
// ══════════════════════════════════════════════════════════
async function doLogin() {
  const role = document.getElementById('login-role').value;
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showToast('❌ Please enter credentials', 'error'); return;
  }

  currentUser = { ...USERS[role], username };

  // Show the app shell immediately while data loads
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  document.getElementById('user-avatar').textContent         = currentUser.avatar;
  document.getElementById('user-name-display').textContent   = currentUser.name;
  document.getElementById('user-role-display').textContent   = currentUser.role;
  document.getElementById('user-station-display').textContent = currentUser.station;

  // Ensure DB is loaded (instant if already done, awaits if still loading)
  await initDatabase();

  addAuditLog(currentUser.username, currentUser.role, 'Login', `User logged in as ${currentUser.role}`);
  buildSidebar();
  navigateTo('dashboard');
}

function quickLogin(role) {
  document.getElementById('login-role').value = role;
  const u = USERS[role];
  document.getElementById('login-username').value = u.username;
  document.getElementById('login-password').value = 'up@1234';
  doLogin();
}

function doLogout() {
  if (currentUser) addAuditLog(currentUser.username, currentUser.role, 'Logout', 'User logged out');
  currentUser = null;
  document.getElementById('app').classList.remove('active');
  document.getElementById('login-screen').style.display = 'flex';
  if (window.cdims_map) { window.cdims_map.remove(); window.cdims_map = null; }
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};
}

// Print dossier
function printDossier() {
  showToast('🖨️ Preparing print-friendly dossier...', 'info');
  setTimeout(() => window.print(), 800);
}

// Close modal on overlay click
document.getElementById('dossier-modal').addEventListener('click', function(e) {
  if (e.target === this) closeDossierModal();
});
document.getElementById('add-dossier-modal').addEventListener('click', function(e) {
  if (e.target === this) closeAddDossierModal();
});

// Close notification panel on outside click
document.addEventListener('click', function(e) {
  if (notifPanelOpen && !e.target.closest('#notif-panel') && !e.target.closest('.header-icon-btn')) {
    toggleNotifPanel();
  }
});

// Note: initDatabase() is auto-called by backend.js on page load.
