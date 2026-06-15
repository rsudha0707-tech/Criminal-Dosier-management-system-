/* =========================================================
   CDIMS — SP Admin Alert Center Component
   Uttar Pradesh Police Headquarters
   Floating real-time alerts panel for District & PHQ Admin
   ========================================================= */

(function () {
  // Global States
  let alertsHistory = [];
  let alertedDossierIds = [];
  let isMuted = false;
  let isLightTheme = false;
  let pollCount = 0;
  let audioCtx = null;

  // Safe getter for currentUser in app.js
  function getCurrentUser() {
    if (typeof currentUser !== 'undefined') {
      return currentUser;
    }
    return null;
  }

  // Load state from localStorage
  function loadState() {
    try {
      const savedList = localStorage.getItem('cdims_sp_alerts_list');
      if (savedList) {
        alertsHistory = JSON.parse(savedList);
      } else {
        // Initialize with default historical alerts
        const now = Date.now();
        alertsHistory = [
          {
            id: 'mock-1',
            type: 'tactical',
            title: 'Toll Crossing Detected',
            message: 'Vehicle UP-32-AA-9999 linked to Vikram Singh (CRM-2026-0003) detected on Purvanchal Expressway.',
            priority: 'warning',
            timestamp: new Date(now - 10 * 60 * 1000).toISOString(),
            acknowledged: true
          },
          {
            id: 'mock-2',
            type: 'dossier',
            dossierId: 'CRM-2026-0002',
            title: 'New Dossier Pending',
            message: 'Dossier for Amit Mishra pending verification review.',
            priority: 'critical',
            timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            acknowledged: true
          },
          {
            id: 'mock-3',
            type: 'system',
            title: 'Database Sync Success',
            message: 'State level database migration and offline replica sync completed successfully.',
            priority: 'info',
            timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
            acknowledged: true
          }
        ];
        saveAlerts();
      }

      const savedIds = localStorage.getItem('cdims_sp_alerted_dossiers');
      if (savedIds) {
        alertedDossierIds = JSON.parse(savedIds);
      } else {
        // Seed default dossiers as alerted to prevent initial spam
        alertedDossierIds = ['CRM-2026-0001', 'CRM-2026-0002', 'CRM-2026-0003'];
        saveAlerts();
      }

      isMuted = localStorage.getItem('cdims_sp_alerts_muted') === 'true';
      isLightTheme = localStorage.getItem('cdims_sp_alerts_light_theme') === 'true';
    } catch (err) {
      console.error("Error loading Alert Center state:", err);
    }
  }

  // Save state to localStorage
  function saveAlerts() {
    try {
      localStorage.setItem('cdims_sp_alerts_list', JSON.stringify(alertsHistory));
      localStorage.setItem('cdims_sp_alerted_dossiers', JSON.stringify(alertedDossierIds));
    } catch (err) {
      console.error("Error saving Alert Center state:", err);
    }
  }

  // Play Warning Beep using Web Audio API (Sine & Triangle waves combination)
  function playBeep() {
    if (isMuted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch (A5)
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime); // Mid pitch (A4)
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.35);
      osc2.stop(audioCtx.currentTime + 0.35);
    } catch (err) {
      console.warn("Audio Context beep failed to play:", err);
    }
  }

  // Inject Styles dynamically into <head>
  function injectStyles() {
    if (document.getElementById('sp-alert-center-styles')) return;

    const style = document.createElement('style');
    style.id = 'sp-alert-center-styles';
    style.textContent = `
      /* Container styling */
      .sp-alert-center-container {
        position: fixed;
        top: 80px;
        right: 24px;
        z-index: 99999;
        font-family: 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        pointer-events: none;
      }
      .sp-alert-center-container * {
        pointer-events: auto;
      }

      /* Trigger Button */
      .sp-alert-trigger {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: var(--navy-900, #061329);
        border: 2px solid var(--gold-500, #e5b839);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.25s ease;
        font-size: 22px;
      }
      .sp-alert-trigger:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(238, 185, 2, 0.35);
      }

      /* Red Pulsing / Blinking border */
      .sp-alert-trigger.blinking {
        border-color: var(--red-500, #dc2626);
        animation: trigger-pulse-red 1.5s infinite;
      }
      @keyframes trigger-pulse-red {
        0% {
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.65), 0 4px 20px rgba(0, 0, 0, 0.4);
          border-color: var(--red-500, #dc2626);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(220, 38, 38, 0), 0 4px 20px rgba(0, 0, 0, 0.4);
          border-color: #ff5c5c;
        }
        100% {
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 4px 20px rgba(0, 0, 0, 0.4);
          border-color: var(--red-500, #dc2626);
        }
      }

      /* Badge Count */
      .sp-alert-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: var(--red-500, #dc2626);
        color: #fff;
        border-radius: 50%;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #fff;
      }

      /* Slide-out Panel */
      .sp-alert-panel {
        width: 350px;
        max-height: 480px;
        margin-top: 10px;
        border-radius: 12px;
        background: rgba(6, 19, 41, 0.95);
        border: 1px solid var(--gold-500, #e5b839);
        box-shadow: var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.55));
        display: none;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(-8px) scale(0.96);
        opacity: 0;
      }
      .sp-alert-panel.active {
        display: flex;
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      /* Header */
      .sp-alert-header {
        padding: 10px 14px;
        background: var(--navy-800, #0b1e3f);
        border-bottom: 1px solid rgba(238, 185, 2, 0.15);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .sp-alert-header h3 {
        font-size: 13px;
        font-weight: 700;
        color: var(--gold-400, #ffd700);
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
      }
      .sp-alert-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sp-alert-header-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary, #cbd5e1);
        font-size: 15px;
        cursor: pointer;
        padding: 3px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .sp-alert-header-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }

      /* Alerts List area */
      .sp-alert-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        max-height: 360px;
      }
      .sp-alert-list::-webkit-scrollbar {
        width: 4px;
      }
      .sp-alert-list::-webkit-scrollbar-thumb {
        background: var(--navy-600, #1b3f7a);
        border-radius: 2px;
      }
      .sp-alert-list::-webkit-scrollbar-thumb:hover {
        background: var(--gold-500, #e5b839);
      }

      .sp-alert-empty {
        padding: 24px 12px;
        text-align: center;
        color: var(--text-muted, #64748b);
        font-size: 12px;
      }

      /* Alert Card */
      .sp-alert-item {
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 6px;
        border-left: 4px solid var(--text-muted, #64748b);
        background: rgba(255, 255, 255, 0.02);
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sp-alert-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      /* Priorities colors */
      .sp-alert-item.priority-critical {
        border-left-color: var(--red-500, #dc2626);
        background: rgba(220, 38, 38, 0.04);
      }
      .sp-alert-item.priority-critical.unread {
        background: rgba(220, 38, 38, 0.09);
      }

      .sp-alert-item.priority-warning {
        border-left-color: var(--amber-500, #f59e0b);
        background: rgba(245, 158, 11, 0.03);
      }
      .sp-alert-item.priority-warning.unread {
        background: rgba(245, 158, 11, 0.08);
      }

      .sp-alert-item.priority-info {
        border-left-color: var(--blue-500, #3b82f6);
        background: rgba(59, 130, 246, 0.02);
      }
      .sp-alert-item.priority-info.unread {
        background: rgba(59, 130, 246, 0.06);
      }

      .sp-alert-item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 6px;
      }
      .sp-alert-title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-primary, #f8fafc);
      }
      .sp-alert-badge-type {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 1px 4px;
        border-radius: 4px;
      }
      .sp-alert-badge-type.critical {
        background: rgba(220, 38, 38, 0.25);
        color: #ff6b6b;
      }
      .sp-alert-badge-type.warning {
        background: rgba(245, 158, 11, 0.25);
        color: #ffd43b;
      }
      .sp-alert-badge-type.info {
        background: rgba(59, 130, 246, 0.25);
        color: #74c0fc;
      }

      .sp-alert-message {
        font-size: 11.5px;
        color: var(--text-secondary, #cbd5e1);
        line-height: 1.35;
      }

      .sp-alert-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 3px;
        font-size: 10.5px;
      }
      .sp-alert-time {
        color: var(--text-muted, #64748b);
      }
      .sp-alert-actions {
        display: flex;
        gap: 4px;
      }
      .sp-alert-action-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary, #f8fafc);
        font-size: 9.5px;
        padding: 2px 7px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .sp-alert-action-btn:hover {
        background: var(--gold-500, #e5b839);
        color: #000;
        border-color: var(--gold-500, #e5b839);
      }
      .sp-alert-action-btn.ack {
        background: rgba(34, 197, 94, 0.12);
        border-color: rgba(34, 197, 94, 0.2);
        color: #4ade80;
      }
      .sp-alert-action-btn.ack:hover {
        background: var(--green-500, #22c55e);
        color: #fff;
        border-color: var(--green-500, #22c55e);
      }

      /* LIGHT MODE OVERRIDES */
      .sp-alert-center-container.light .sp-alert-trigger {
        background: #f8fafc;
        border-color: var(--navy-500, #25549d);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
      }
      .sp-alert-center-container.light .sp-alert-trigger:hover {
        box-shadow: 0 6px 18px rgba(37, 84, 157, 0.22);
      }
      .sp-alert-center-container.light .sp-alert-panel {
        background: #ffffff;
        border-color: #cbd5e1;
        box-shadow: 0 8px 28px rgba(0,0,0,0.12);
      }
      .sp-alert-center-container.light .sp-alert-header {
        background: #f1f5f9;
        border-bottom-color: #e2e8f0;
      }
      .sp-alert-center-container.light .sp-alert-header h3 {
        color: var(--navy-900, #061329);
      }
      .sp-alert-center-container.light .sp-alert-header-btn {
        color: #475569;
      }
      .sp-alert-center-container.light .sp-alert-header-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #0f172a;
      }
      .sp-alert-center-container.light .sp-alert-list::-webkit-scrollbar-thumb {
        background: #cbd5e1;
      }
      .sp-alert-center-container.light .sp-alert-list::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      .sp-alert-center-container.light .sp-alert-empty {
        color: #94a3b8;
      }
      .sp-alert-center-container.light .sp-alert-item {
        background: #f8fafc;
        border-left-color: #cbd5e1;
      }
      .sp-alert-center-container.light .sp-alert-item:hover {
        background: #f1f5f9;
      }

      .sp-alert-center-container.light .sp-alert-item.priority-critical {
        background: #fff5f5;
        border-left-color: var(--red-500, #dc2626);
      }
      .sp-alert-center-container.light .sp-alert-item.priority-critical.unread {
        background: #ffebeb;
      }
      .sp-alert-center-container.light .sp-alert-item.priority-warning {
        background: #fffbeb;
        border-left-color: var(--amber-500, #f59e0b);
      }
      .sp-alert-center-container.light .sp-alert-item.priority-warning.unread {
        background: #fef3c7;
      }
      .sp-alert-center-container.light .sp-alert-item.priority-info {
        background: #eff6ff;
        border-left-color: var(--blue-500, #3b82f6);
      }
      .sp-alert-center-container.light .sp-alert-item.priority-info.unread {
        background: #dbeafe;
      }

      .sp-alert-center-container.light .sp-alert-title {
        color: #0f172a;
      }
      .sp-alert-center-container.light .sp-alert-message {
        color: #334155;
      }
      .sp-alert-center-container.light .sp-alert-time {
        color: #64748b;
      }
      .sp-alert-center-container.light .sp-alert-action-btn {
        background: #ffffff;
        border-color: #cbd5e1;
        color: #334155;
      }
      .sp-alert-center-container.light .sp-alert-action-btn:hover {
        background: var(--navy-500, #25549d);
        color: #ffffff;
        border-color: var(--navy-500, #25549d);
      }
      .sp-alert-center-container.light .sp-alert-action-btn.ack {
        background: #ecfdf5;
        border-color: #a7f3d0;
        color: #059669;
      }
      .sp-alert-center-container.light .sp-alert-action-btn.ack:hover {
        background: var(--green-500, #22c55e);
        color: #ffffff;
        border-color: var(--green-500, #22c55e);
      }

      /* Responsive layout overrides */
      @media (max-width: 576px) {
        .sp-alert-center-container {
          top: auto;
          bottom: 20px;
          right: 20px;
        }
        .sp-alert-panel {
          position: fixed;
          bottom: 85px;
          right: 20px;
          left: 20px;
          width: auto;
          max-height: 55vh;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create the Widget elements in DOM
  function createAlertCenterDOM() {
    loadState();

    const container = document.createElement('div');
    container.id = 'sp-alert-center';
    container.className = 'sp-alert-center-container' + (isLightTheme ? ' light' : '');

    container.innerHTML = `
      <button id="sp-alert-trigger" class="sp-alert-trigger" onclick="toggleAlertPanel()">
        🚨
        <span id="sp-alert-badge" class="sp-alert-badge" style="display: none;">0</span>
      </button>
      <div id="sp-alert-panel" class="sp-alert-panel">
        <div class="sp-alert-header">
          <h3><span>🚨</span> SP Admin Alert Center</h3>
          <div class="sp-alert-header-actions">
            <button class="sp-alert-header-btn" id="sp-alert-mute-btn" onclick="toggleMuteAlerts()" title="Mute/Unmute Beep">
              ${isMuted ? '🔇' : '🔊'}
            </button>
            <button class="sp-alert-header-btn" id="sp-alert-theme-btn" onclick="toggleAlertTheme()" title="Toggle Theme">
              🌓
            </button>
            <button class="sp-alert-header-btn" onclick="toggleAlertPanel()" title="Close">✕</button>
          </div>
        </div>
        <div class="sp-alert-list" id="sp-alert-list"></div>
      </div>
    `;

    document.body.appendChild(container);

    // Bind local handlers to window for inline onclick triggers
    window.toggleAlertPanel = toggleAlertPanel;
    window.toggleMuteAlerts = toggleMuteAlerts;
    window.toggleAlertTheme = toggleAlertTheme;
    window.acknowledgeAlert = acknowledgeAlert;
    window.viewAlertDetails = viewAlertDetails;

    renderAlerts();
  }

  // Render items inside the list view
  function renderAlerts() {
    const listEl = document.getElementById('sp-alert-list');
    const badgeEl = document.getElementById('sp-alert-badge');
    const triggerEl = document.getElementById('sp-alert-trigger');

    if (!listEl) return;

    // Sort: Unread first, then by timestamp descending
    const sortedAlerts = [...alertsHistory].sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const unreadCount = alertsHistory.filter(a => !a.acknowledged).length;

    // Update Floating Badge
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = 'flex';
      triggerEl.classList.add('blinking');
    } else {
      badgeEl.style.display = 'none';
      triggerEl.classList.remove('blinking');
    }

    if (sortedAlerts.length === 0) {
      listEl.innerHTML = '<div class="sp-alert-empty">No alerts in history.</div>';
      return;
    }

    listEl.innerHTML = sortedAlerts.map(alert => {
      const timeStr = formatAlertTime(alert.timestamp);
      const priorityClass = `priority-${alert.priority}`;
      const unreadClass = alert.acknowledged ? '' : 'unread';
      const isDossier = !!alert.dossierId;

      return `
        <div class="sp-alert-item ${priorityClass} ${unreadClass}" id="alert-item-${alert.id}">
          <div class="sp-alert-item-header">
            <span class="sp-alert-title">${alert.title}</span>
            <span class="sp-alert-badge-type ${alert.priority}">${alert.priority}</span>
          </div>
          <div class="sp-alert-message">${alert.message}</div>
          <div class="sp-alert-meta">
            <span class="sp-alert-time">${timeStr}</span>
            <div class="sp-alert-actions">
              ${isDossier ? `<button class="sp-alert-action-btn" onclick="viewAlertDetails('${alert.id}')">👁️ View</button>` : ''}
              ${!alert.acknowledged ? `<button class="sp-alert-action-btn ack" onclick="acknowledgeAlert('${alert.id}')">✓ Ack</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Format Date ISO string to readable HH:MM:SS
  function formatAlertTime(isoStr) {
    try {
      const date = new Date(isoStr);
      const hrs = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    } catch (e) {
      return isoStr;
    }
  }

  // Actions
  function toggleAlertPanel() {
    const panel = document.getElementById('sp-alert-panel');
    if (panel) {
      panel.classList.toggle('active');
    }
  }

  function toggleMuteAlerts() {
    isMuted = !isMuted;
    localStorage.setItem('cdims_sp_alerts_muted', String(isMuted));
    const muteBtn = document.getElementById('sp-alert-mute-btn');
    if (muteBtn) {
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }
  }

  function toggleAlertTheme() {
    isLightTheme = !isLightTheme;
    localStorage.setItem('cdims_sp_alerts_light_theme', String(isLightTheme));
    const container = document.getElementById('sp-alert-center');
    if (container) {
      if (isLightTheme) {
        container.classList.add('light');
      } else {
        container.classList.remove('light');
      }
    }
  }

  function acknowledgeAlert(alertId) {
    const alert = alertsHistory.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      saveAlerts();
      renderAlerts();
    }
  }

  function viewAlertDetails(alertId) {
    const alert = alertsHistory.find(a => a.id === alertId);
    if (alert && alert.dossierId) {
      // Auto ack when clicked to view
      if (!alert.acknowledged) {
        alert.acknowledged = true;
        saveAlerts();
        renderAlerts();
      }

      if (typeof window.getDossiers === 'function' && typeof window.openDossierModal === 'function') {
        const dossier = window.getDossiers().find(d => d.id === alert.dossierId);
        if (dossier) {
          window.openDossierModal(dossier);
          // Close panel to reveal the modal behind
          const panel = document.getElementById('sp-alert-panel');
          if (panel) panel.classList.remove('active');
        } else {
          alert("Dossier profile not found in local cache.");
        }
      }
    }
  }

  // Visibility Check (Shows only for level 2 admins)
  function updateAlertCenterVisibility() {
    const user = getCurrentUser();
    const container = document.getElementById('sp-alert-center');

    if (user && user.level === 2) {
      if (!container) {
        createAlertCenterDOM();
      } else {
        container.style.display = 'flex';
      }
    } else {
      if (container) {
        container.style.display = 'none';
        const panel = document.getElementById('sp-alert-panel');
        if (panel) panel.classList.remove('active');
      }
    }
  }

  // Check if Alert Center widget is active in UI
  function isAlertCenterVisible() {
    const container = document.getElementById('sp-alert-center');
    return container && container.style.display !== 'none';
  }

  // Polling logic run every 5 seconds
  function pollForAlerts() {
    pollCount++;
    let newAlertTriggered = false;

    // 1. Scan live database for new dossiers awaiting verification
    if (typeof window.getDossiers === 'function') {
      const dossiers = window.getDossiers() || [];
      dossiers.forEach(d => {
        if (d.approvalStatus === 'Pending Verification') {
          // Verify if we have already alerted this dossier ID
          if (!alertedDossierIds.includes(d.id)) {
            alertedDossierIds.push(d.id);

            const newAlert = {
              id: 'dossier-' + d.id + '-' + Date.now(),
              type: 'dossier',
              dossierId: d.id,
              title: 'New Dossier Pending',
              message: `Dossier submitted by ${d.submittedBy || 'SHO'} for "${d.personalInfo.name}" requires SP review and signature.`,
              priority: 'critical',
              timestamp: new Date().toISOString(),
              acknowledged: false
            };

            alertsHistory.push(newAlert);
            newAlertTriggered = true;
          }
        }
      });
    }

    // 2. Periodic mock tactical intelligence updates (every 25 seconds on average)
    if (pollCount % 5 === 0) {
      if (Math.random() < 0.4) { // 40% probability every 25s
        const tacticalAlerts = [
          {
            title: 'GPS Boundary Violation',
            message: 'Vehicle UP-32-CD-5678 linked to Gang leader Vikram Singh entered Lucknow District.',
            priority: 'warning'
          },
          {
            title: 'Facial Camera Hit',
            message: 'CCTV face recognition matched Suspect Rajesh Yadav near Hazratganj Metro Station.',
            priority: 'critical'
          },
          {
            title: 'Toll plaza Crossing',
            message: 'Bullet-proof SUV associated with Gangster Amit Mishra crossed Yamuna Expressway toll.',
            priority: 'critical'
          },
          {
            title: 'Tactical Intel Input',
            message: 'Surveillance unit reports active communication links between groups in Prayagraj & Varanasi.',
            priority: 'warning'
          },
          {
            title: 'System Synced',
            message: 'Live database transaction logs synced. All state replicas online and secured.',
            priority: 'info'
          },
          {
            title: 'Network Graph Change',
            message: 'Relationship network score anomaly: Suspect Amit Mishra added 3 new links.',
            priority: 'warning'
          }
        ];

        const selected = tacticalAlerts[Math.floor(Math.random() * tacticalAlerts.length)];

        const newAlert = {
          id: 'tactical-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          type: 'tactical',
          title: selected.title,
          message: selected.message,
          priority: selected.priority,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };

        alertsHistory.push(newAlert);
        newAlertTriggered = true;
      }
    }

    if (newAlertTriggered) {
      saveAlerts();
      renderAlerts();
      playBeep();

      // Automatically open the panel
      const panel = document.getElementById('sp-alert-panel');
      if (panel) {
        panel.classList.add('active');
      }
    }
  }

  // Setup/Start on load
  function initAlertCenter() {
    injectStyles();

    // Wrap doLogin if present globally
    if (window.doLogin) {
      const origDoLogin = window.doLogin;
      window.doLogin = async function (...args) {
        const res = await origDoLogin.apply(this, args);
        updateAlertCenterVisibility();
        return res;
      };
    }

    // Wrap doLogout if present globally
    if (window.doLogout) {
      const origDoLogout = window.doLogout;
      window.doLogout = function (...args) {
        const res = origDoLogout.apply(this, args);
        updateAlertCenterVisibility();
        return res;
      };
    }

    // Wrap quickLogin if present globally
    if (window.quickLogin) {
      const origQuickLogin = window.quickLogin;
      window.quickLogin = function (...args) {
        const res = origQuickLogin.apply(this, args);
        updateAlertCenterVisibility();
        return res;
      };
    }

    // Wrap generateOfficerCredentials if present globally
    if (window.generateOfficerCredentials) {
      const origGen = window.generateOfficerCredentials;
      window.generateOfficerCredentials = async function (...args) {
        const res = await origGen.apply(this, args);
        updateAlertCenterVisibility();
        return res;
      };
    }

    // Initial check
    updateAlertCenterVisibility();

    // Polling Interval every 5 seconds
    setInterval(() => {
      // Keep checking session state in case it changed inside react context or otherwise
      updateAlertCenterVisibility();
      if (isAlertCenterVisible()) {
        pollForAlerts();
      }
    }, 5000);
  }

  // DOMContentLoaded hook
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlertCenter);
  } else {
    initAlertCenter();
  }
})();
