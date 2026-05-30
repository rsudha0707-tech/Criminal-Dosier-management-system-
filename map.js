// =========================================================
//  CDIMS — GIS Crime Map Module (Leaflet.js)
// =========================================================

window.cdims_map = null;

window.initCrimeMap = function(containerId) {
  // Destroy previous map instance if exists
  if (window.cdims_map) {
    window.cdims_map.remove();
    window.cdims_map = null;
  }

  const map = L.map(containerId, {
    center: [26.8467, 80.9462], // Lucknow, UP
    zoom: 7,
    zoomControl: true,
    attributionControl: false
  });

  window.cdims_map = map;

  // Dark CartoDB basemap
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  L.control.attribution({ position: 'bottomright' })
    .addAttribution('© CartoDB | UP CDIMS Intelligence Map')
    .addTo(map);

  // ── Custom Icons ──
  function createIcon(emoji, color, size) {
    return L.divIcon({
      html: `<div style="
        background:${color};
        width:${size || 32}px; height:${size || 32}px;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:${(size || 32) * 0.45}px;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 0 10px ${color}88;
      ">${emoji}</div>`,
      className: '',
      iconSize: [size || 32, size || 32],
      iconAnchor: [(size || 32) / 2, (size || 32) / 2]
    });
  }

  const iconWanted   = createIcon('🚨', '#ef4444', 38);
  const iconBail     = createIcon('⚠️', '#f59e0b', 32);
  const iconJail     = createIcon('🔒', '#8b5cf6', 30);
  const iconActive   = createIcon('👁️', '#3b82f6', 30);
  const iconHotspot  = createIcon('🔥', '#f97316', 44);
  const iconGang     = createIcon('⛔', '#dc2626', 36);

  // ── Criminal Location Markers ──
  const criminalLocations = [
    { lat: 26.8618, lng: 80.9278, name: "Rajesh Yadav (Raju Kaana)", type: "wanted", info: "CRM-2026-0001 | Hazratganj Area | Category A", district: "Lucknow" },
    { lat: 26.8422, lng: 80.9234, name: "Amit Mishra (Panditji)", type: "bail", info: "CRM-2026-0002 | Aliganj | On Bail - Reporting weekly", district: "Lucknow" },
    { lat: 25.3176, lng: 82.9739, name: "Vikram Singh (Vicky Shooter)", type: "wanted", info: "CRM-2026-0003 | Varanasi Cantt | Last Spotted - 5 days ago", district: "Varanasi" },
    { lat: 28.5355, lng: 77.3910, name: "Satish Gujjar (Fauji)", type: "jail", info: "CRM-2026-0004 | Luksar Jail | Under incarceration", district: "Noida" },
    { lat: 25.4358, lng: 81.8463, name: "Rakesh Patel (Raka)", type: "bail", info: "CRM-2026-0005 | Prayagraj | On bail, fortnightly reporting", district: "Prayagraj" },
    { lat: 26.8500, lng: 80.9100, name: "Sanjay Pal", type: "active", info: "CRM-2026-0006 | Chowk, Lucknow | Being tracked", district: "Lucknow" }
  ];

  const iconMap = { wanted: iconWanted, bail: iconBail, jail: iconJail, active: iconActive };

  criminalLocations.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], { icon: iconMap[loc.type] || iconActive });
    marker.addTo(map);
    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif; min-width:180px;">
        <div style="font-size:13px; font-weight:700; color:#1e3a5f; margin-bottom:4px;">${loc.name}</div>
        <div style="font-size:11px; color:#475569;">${loc.info}</div>
        <div style="font-size:10px; margin-top:6px;">
          <span style="background:#1e3a5f; color:white; padding:2px 6px; border-radius:4px;">📍 ${loc.district}</span>
        </div>
      </div>
    `, { maxWidth: 240 });
  });

  // ── Crime Hotspot Circles ──
  const hotspots = [
    { lat: 26.8618, lng: 80.9278, radius: 2500, label: "Hazratganj Hotspot", color: "#ef4444", description: "High extortion and violent crime zone" },
    { lat: 25.3176, lng: 82.9739, radius: 3000, label: "Varanasi Crime Zone", color: "#f97316", description: "Shooting incidents, armed robbery" },
    { lat: 28.5355, lng: 77.3910, radius: 3500, label: "Noida Gang Territory", color: "#dc2626", description: "Gujjar Syndicate operations" },
    { lat: 25.4358, lng: 81.8463, radius: 2800, label: "Prayagraj Network", color: "#f59e0b", description: "Illegal arms supply chain" },
    { lat: 26.7783, lng: 82.1398, radius: 2000, label: "Ayodhya Watch Zone", color: "#8b5cf6", description: "Criminal informer network active" }
  ];

  hotspots.forEach(hs => {
    L.circle([hs.lat, hs.lng], {
      color: hs.color,
      fillColor: hs.color,
      fillOpacity: 0.12,
      weight: 2,
      opacity: 0.7,
      radius: hs.radius
    }).addTo(map)
      .bindPopup(`
        <div style="font-family:'Inter',sans-serif;">
          <div style="font-size:12px; font-weight:700; color:#1e3a5f;">${hs.label}</div>
          <div style="font-size:11px; color:#475569; margin-top:4px;">${hs.description}</div>
        </div>
      `);

    L.marker([hs.lat, hs.lng], { icon: iconHotspot }).addTo(map)
      .bindTooltip(hs.label, { permanent: false, direction: 'top' });
  });

  // ── Gang Territories ──
  const gangZones = [
    {
      coords: [[26.88, 80.91], [26.85, 80.95], [26.82, 80.93], [26.84, 80.89], [26.88, 80.91]],
      name: "Raju Kaana Gang Territory (D-102)",
      color: "#ef4444"
    },
    {
      coords: [[28.55, 77.35], [28.52, 77.42], [28.48, 77.40], [28.50, 77.33], [28.55, 77.35]],
      name: "Gujjar Syndicate Zone (G-110)",
      color: "#f97316"
    }
  ];

  gangZones.forEach(zone => {
    L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8,4'
    }).addTo(map)
      .bindPopup(`<div style="font-family:'Inter',sans-serif; font-size:12px; font-weight:700; color:#991b1b;">${zone.name}</div>`);
  });

  // ── District Boundary Labels ──
  const districtCenters = [
    { lat: 26.8467, lng: 80.9462, name: "Lucknow\n7 Cases", count: 7 },
    { lat: 25.3176, lng: 82.9739, name: "Varanasi\n2 Cases", count: 2 },
    { lat: 25.4358, lng: 81.8463, name: "Prayagraj\n1 Case", count: 1 },
    { lat: 28.5355, lng: 77.3910, name: "Noida\n3 Cases", count: 3 }
  ];

  districtCenters.forEach(d => {
    L.divIcon({
      html: `<div style="font-size:11px; font-weight:700; color:rgba(238,185,2,0.9); white-space:nowrap; text-shadow:0 1px 4px #000;">${d.name}</div>`,
      className: ''
    });
  });

  // ── Map controls overlay ──
  const controlDiv = L.DomUtil.create('div');
  controlDiv.innerHTML = `
    <div style="background:rgba(11,20,38,0.9); border:1px solid rgba(238,185,2,0.3); border-radius:8px; padding:10px; font-family:'Inter',sans-serif; min-width:160px;">
      <div style="font-size:11px; font-weight:700; color:#EEB902; margin-bottom:8px;">🗺️ LEGEND</div>
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;"><span style="font-size:14px;">🚨</span><span style="font-size:11px; color:#f1f5f9;">Wanted Criminal</span></div>
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;"><span style="font-size:14px;">⚠️</span><span style="font-size:11px; color:#f1f5f9;">Out on Bail</span></div>
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;"><span style="font-size:14px;">🔒</span><span style="font-size:11px; color:#f1f5f9;">In Jail</span></div>
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;"><span style="font-size:14px;">🔥</span><span style="font-size:11px; color:#f1f5f9;">Crime Hotspot</span></div>
      <div style="display:flex; align-items:center; gap:6px;"><span style="font-size:14px;">⛔</span><span style="font-size:11px; color:#f1f5f9;">Gang Territory</span></div>
    </div>
  `;
  const CustomControl = L.Control.extend({
    onAdd: () => controlDiv,
    onRemove: () => {}
  });
  new CustomControl({ position: 'bottomleft' }).addTo(map);
};
