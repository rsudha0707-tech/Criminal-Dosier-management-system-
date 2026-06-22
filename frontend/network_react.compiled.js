// =========================================================
//  CDIMS — ADVANCED RELATIONSHIP NETWORK GRAPH (REACT)
//  Premium Dark Navy / Gold Government Theme
// =========================================================

const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;

// Node Types and their metadata
const NODE_TYPES = {
  subject: {
    label: 'Subject',
    emoji: '👤',
    color: '#ef4444',
    gradient: 'url(#nodeGrad-A)'
  },
  contact: {
    label: 'Contact',
    emoji: '📱',
    color: '#f59e0b',
    gradient: 'url(#nodeGrad-B)'
  },
  vehicle: {
    label: 'Vehicle',
    emoji: '🚗',
    color: '#3b82f6',
    gradient: 'url(#nodeGrad-C)'
  },
  location: {
    label: 'Location',
    emoji: '📍',
    color: '#10b981',
    gradient: 'url(#nodeGrad-D)'
  },
  case: {
    label: 'Case',
    emoji: '📄',
    color: '#8b5cf6',
    gradient: 'url(#nodeGrad-E)'
  },
  group: {
    label: 'Group',
    emoji: '👥',
    color: '#06b6d4',
    gradient: 'url(#nodeGrad-F)'
  }
};

// Initial synthetic dataset centered around Raju Kaana
const INITIAL_SYNTHETIC_NODES = [{
  id: 'center',
  name: 'Rajesh Yadav (Raju Kaana)',
  type: 'subject',
  score: 95,
  connections: 24,
  cases: 14,
  lastActivity: '2 hours ago - Signal Hazratganj',
  risk: 'High',
  details: 'Hardened Gangster, gang leader of D-102. Wanted under UP Gangsters Act and Arms Act.',
  x: 400,
  y: 250,
  fixed: true
},
// Contacts
{
  id: 'contact1',
  name: 'Amit Mishra (Panditji)',
  type: 'contact',
  score: 78,
  connections: 12,
  cases: 4,
  lastActivity: 'Yesterday - Meeting in Aliganj',
  risk: 'Medium',
  details: 'Gang strategist and financier. Handles shell businesses.',
  x: 250,
  y: 150
}, {
  id: 'contact2',
  name: 'Vikram Singh (Vicky Shooter)',
  type: 'contact',
  score: 88,
  connections: 8,
  cases: 9,
  lastActivity: '3 days ago - Spotted Varanasi Cantt',
  risk: 'High',
  details: 'Enforcer/Hitman. Active non-bailable warrant issued.',
  x: 280,
  y: 350
}, {
  id: 'contact3',
  name: 'Sanjay Pal',
  type: 'contact',
  score: 52,
  connections: 5,
  cases: 1,
  lastActivity: '1 week ago - Vehicle depot Chowk',
  risk: 'Low',
  details: 'Logistics facilitator and driver for the syndicate.',
  x: 550,
  y: 150
},
// Vehicles
{
  id: 'veh1',
  name: 'White Fortuner (UP-32-EX-4122)',
  type: 'vehicle',
  score: 62,
  connections: 3,
  cases: 3,
  lastActivity: '12 hours ago - Toll Plaza Ayodhya',
  risk: 'Medium',
  details: 'Registered under spouse Savitri Devi. Used for local transit.',
  x: 450,
  y: 80
}, {
  id: 'veh2',
  name: 'Black Scorpio (UP-42-AA-9999)',
  type: 'vehicle',
  score: 70,
  connections: 2,
  cases: 1,
  lastActivity: '4 days ago - Spotted Noida Sec-20',
  risk: 'High',
  details: 'Registered under frontman Pal. Used in contract extortion.',
  x: 520,
  y: 320
},
// Locations
{
  id: 'loc1',
  name: 'Hazratganj Safehouse',
  type: 'location',
  score: 65,
  connections: 6,
  cases: 2,
  lastActivity: 'Today - Signal triangulated',
  risk: 'High',
  details: 'Key meeting spot. Suspected weapons cache stored in basement.',
  x: 380,
  y: 110
}, {
  id: 'loc2',
  name: 'Noida Sec-58 Hideout',
  type: 'location',
  score: 58,
  connections: 4,
  cases: 0,
  lastActivity: '2 weeks ago - Raid completed',
  risk: 'Medium',
  details: 'Associated with Satish Gujjar extortion operations.',
  x: 580,
  y: 220
}, {
  id: 'loc3',
  name: 'Varanasi Logistics Center',
  type: 'location',
  score: 72,
  connections: 7,
  cases: 3,
  lastActivity: '5 days ago - Phone ping verified',
  risk: 'High',
  details: 'Storage point for illegal ordnance coming from Bihar boundary.',
  x: 220,
  y: 260
},
// Cases
{
  id: 'case1',
  name: 'FIR-324/2024 (Murder Charge)',
  type: 'case',
  score: 90,
  connections: 4,
  cases: 1,
  lastActivity: 'Under Trial - High Court Lucknow',
  risk: 'High',
  details: 'Murder, Attempt to murder, and Conspiracy. Bail rejected.',
  x: 310,
  y: 210
}, {
  id: 'case2',
  name: 'FIR-12/2025 (UP Gangsters Act)',
  type: 'case',
  score: 85,
  connections: 6,
  cases: 1,
  lastActivity: 'Absconding - Charge sheet filed',
  risk: 'High',
  details: 'Special Gangsters Court Noida. Non-bailable arrest warrant active.',
  x: 480,
  y: 220
},
// Group
{
  id: 'group1',
  name: 'Raju Kaana Gang (D-102)',
  type: 'group',
  score: 92,
  connections: 18,
  cases: 12,
  lastActivity: 'Active Operations Statewide',
  risk: 'High',
  details: 'Active syndicate involved in contract killing and land grabbing.',
  x: 480,
  y: 160
}];
const INITIAL_SYNTHETIC_LINKS = [{
  source: 'center',
  target: 'contact1',
  relation: 'Syndicate Lieutenant'
}, {
  source: 'center',
  target: 'contact2',
  relation: 'Primary Hitman'
}, {
  source: 'center',
  target: 'contact3',
  relation: 'Logistics Driver'
}, {
  source: 'center',
  target: 'veh1',
  relation: 'Transit Vehicle'
}, {
  source: 'center',
  target: 'veh2',
  relation: 'Tactical Vehicle'
}, {
  source: 'center',
  target: 'loc1',
  relation: 'Primary Safehouse'
}, {
  source: 'center',
  target: 'loc2',
  relation: 'Regional Hideout'
}, {
  source: 'center',
  target: 'loc3',
  relation: 'Ordnance Depot'
}, {
  source: 'center',
  target: 'case1',
  relation: 'Named Accused'
}, {
  source: 'center',
  target: 'case2',
  relation: 'Gang Leader'
}, {
  source: 'center',
  target: 'group1',
  relation: 'Gang Leader'
},
// Cross relationships
{
  source: 'contact1',
  target: 'group1',
  relation: 'Member'
}, {
  source: 'contact2',
  target: 'group1',
  relation: 'Member'
}, {
  source: 'contact3',
  target: 'group1',
  relation: 'Member'
}, {
  source: 'contact2',
  target: 'loc3',
  relation: 'Frequents'
}, {
  source: 'contact1',
  target: 'loc1',
  relation: 'Manager'
}, {
  source: 'contact3',
  target: 'veh2',
  relation: 'Custodian'
}];

// Timeline events mapped to selected nodes
const SYNTHETIC_TIMELINES = {
  center: [{
    id: 1,
    date: '2026-06-08',
    time: '18:42',
    title: 'Cell Ping Hazratganj',
    desc: 'Encrypted call trace pinged towers in Hazratganj, Lucknow.',
    severity: 'critical'
  }, {
    id: 2,
    date: '2026-06-06',
    time: '11:15',
    title: 'Asset Attached',
    desc: 'DM order executed: Gomti Nagar mansion worth 2.5cr attached.',
    severity: 'warning'
  }, {
    id: 3,
    date: '2026-06-03',
    time: '09:00',
    title: 'Assault Incident',
    desc: 'Suspect named in contractor threat incident at Hazratganj site.',
    severity: 'critical'
  }],
  contact1: [{
    id: 1,
    date: '2026-06-08',
    time: '14:20',
    title: 'Weekly Reporting',
    desc: 'Reported at Hazratganj Station as per High Court bail conditions.',
    severity: 'info'
  }, {
    id: 2,
    date: '2026-06-04',
    time: '17:30',
    title: 'Bank Account Frozen',
    desc: 'Account with SBIKapoor frozen by order of Intelligence Unit.',
    severity: 'warning'
  }],
  contact2: [{
    id: 1,
    date: '2026-06-05',
    time: '23:10',
    title: 'Spotted at Railway Stn',
    desc: 'Informants report Vicky spotted near Varanasi Cantt station platform 4.',
    severity: 'critical'
  }, {
    id: 2,
    date: '2026-06-01',
    time: '10:00',
    title: 'Non Bailable Warrant Issued',
    desc: 'Special court Varanasi issued NBW for failure to present on trial.',
    severity: 'critical'
  }],
  contact3: [{
    id: 1,
    date: '2026-06-02',
    time: '08:45',
    title: 'Logistics Interception',
    desc: 'Swift hatchback searched by police beat. No illegal goods found.',
    severity: 'info'
  }],
  loc1: [{
    id: 1,
    date: '2026-06-08',
    time: '18:00',
    title: 'Thermal Signal Triangulated',
    desc: 'Active heat signatures matching 4 suspects observed via satellite Intel.',
    severity: 'warning'
  }, {
    id: 2,
    date: '2026-05-28',
    time: '04:00',
    title: 'Late Night Meeting',
    desc: 'Local police vehicle logged 3 luxury SUVs arriving at location.',
    severity: 'info'
  }],
  veh1: [{
    id: 1,
    date: '2026-06-08',
    time: '08:30',
    title: 'Toll Logged',
    desc: 'Ayodhya Toll Plaza camera captured license plate UP-32-EX-4122.',
    severity: 'info'
  }]
};

// Helper function to dynamically construct the gang relationship network from live CSV dossiers
function buildNetworkFromCSV(dossiers) {
  const allNodes = [];
  const allLinks = [];
  const nodeIds = new Set();
  const gangNames = new Set();

  // Fixed coordinates for the 4 main gangs to keep the layout clean, structured, and clustered
  const GANG_COORDS = {
    'Gujjar Syndicate (G-110)': {
      x: 220,
      y: 150
    },
    'Purvanchal Cartel (P-51)': {
      x: 220,
      y: 350
    },
    'Western UP Syndicate (W-88)': {
      x: 580,
      y: 150
    },
    'Raju Kaana Gang (D-102)': {
      x: 580,
      y: 350
    }
  };
  let unknownGangCount = 0;

  // 1. Gather all unique gangs to create Group nodes
  dossiers.forEach(d => {
    const gName = d.gangInfo && d.gangInfo.gangName;
    if (gName && gName !== 'Independent' && gName !== 'N/A' && gName !== 'Independent / None') {
      gangNames.add(gName);
    }
  });

  // 2. Create Group nodes
  gangNames.forEach(gName => {
    const members = dossiers.filter(d => d.gangInfo && d.gangInfo.gangName === gName);
    const totalCases = members.reduce((sum, d) => sum + (d.history ? d.history.length : 0), 0);

    // Assign dynamic coordinate if not in predefined coordinates
    if (!GANG_COORDS[gName]) {
      unknownGangCount++;
      GANG_COORDS[gName] = {
        x: 400 + Math.cos(unknownGangCount) * 160,
        y: 250 + Math.sin(unknownGangCount) * 160
      };
    }
    allNodes.push({
      id: gName,
      name: gName,
      type: 'group',
      score: 85,
      connections: members.length,
      cases: totalCases,
      lastActivity: 'Active operations across multiple districts',
      risk: 'High',
      details: `Syndicate active in Uttar Pradesh. Total mapped members: ${members.length}. Total cases: ${totalCases}.`,
      x: GANG_COORDS[gName].x,
      y: GANG_COORDS[gName].y,
      fixed: true
    });
    nodeIds.add(gName);
  });

  // Keep track of member counts and placement indices in each gang for clustering
  const gangMemberCounts = {};
  const gangMemberIndices = {};
  dossiers.forEach(d => {
    const gName = d.gangInfo && d.gangInfo.gangName;
    if (gName && GANG_COORDS[gName]) {
      gangMemberCounts[gName] = (gangMemberCounts[gName] || 0) + 1;
      gangMemberIndices[gName] = 0;
    }
  });

  // 3. Create Subject nodes (Criminals)
  dossiers.forEach((d, idx) => {
    const name = d.personalInfo && d.personalInfo.name;
    if (!name) return;
    const gName = d.gangInfo && d.gangInfo.gangName;
    let x, y;

    // Cluster members in a circle around their respective Gang Group node
    if (gName && GANG_COORDS[gName]) {
      const center = GANG_COORDS[gName];
      const count = gangMemberCounts[gName] || 1;
      const mIdx = gangMemberIndices[gName]++;
      const angle = mIdx / count * Math.PI * 2;
      const radius = 95;
      x = center.x + Math.cos(angle) * radius;
      y = center.y + Math.sin(angle) * radius;
    } else {
      // Independent/Other subjects placed in a large outer ring
      const angle = idx / dossiers.length * Math.PI * 2;
      x = 400 + Math.cos(angle) * 210;
      y = 250 + Math.sin(angle) * 210;
    }
    const numCases = d.history ? d.history.length : 0;
    const scoreVal = d.status === 'Wanted' ? 92 : d.status === 'Active' ? 82 : d.status === 'In Jail' ? 70 : 55;
    allNodes.push({
      id: d.id,
      name: name,
      type: 'subject',
      score: scoreVal,
      connections: d.gangInfo && d.gangInfo.gangMembers ? d.gangInfo.gangMembers.length : 1,
      cases: numCases,
      lastActivity: d.surveillance && d.surveillance.surveillanceNotes ? d.surveillance.surveillanceNotes : 'Recent movements verified by intelligence beat',
      risk: d.surveillance && d.surveillance.surveillanceCategory && d.surveillance.surveillanceCategory.includes('Category A') ? 'High' : d.surveillance && d.surveillance.surveillanceCategory && d.surveillance.surveillanceCategory.includes('Category B') ? 'Medium' : 'Low',
      details: d.surveillance && d.surveillance.intelligenceInputs ? d.surveillance.intelligenceInputs : d.personalInfo.address || 'Under intelligence watch.',
      x: x,
      y: y
    });
    nodeIds.add(d.id);

    // Link subject to their gang (if any)
    if (gName && gName !== 'Independent' && gName !== 'N/A' && GANG_COORDS[gName]) {
      const isLeader = d.gangInfo.gangLeader && d.gangInfo.gangLeader.toLowerCase().includes(name.toLowerCase());
      allLinks.push({
        source: d.id,
        target: gName,
        relation: isLeader ? 'Gang Leader' : 'Syndicate Member'
      });

      // Link members directly to their leader to establish the hierarchy
      const leaderName = d.gangInfo.gangLeader;
      if (leaderName && leaderName !== 'N/A' && leaderName !== '') {
        const leaderDossier = dossiers.find(o => {
          const oName = (o.personalInfo && o.personalInfo.name || '').toLowerCase();
          return oName.includes(leaderName.toLowerCase()) || leaderName.toLowerCase().includes(oName);
        });
        if (leaderDossier && leaderDossier.id !== d.id) {
          allLinks.push({
            source: leaderDossier.id,
            target: d.id,
            relation: 'Gang Commander'
          });
        }
      }
    }

    // 4. Create child nodes (vehicles, properties, cases) linked to this subject.
    // These will remain virtualized/hidden until double-clicked.
    const angleOffset = idx * 1.5;

    // Vehicles
    if (d.vehicleDetails && Array.isArray(d.vehicleDetails)) {
      d.vehicleDetails.forEach((veh, vIdx) => {
        const vId = `${d.id}-veh-${vIdx}`;
        allNodes.push({
          id: vId,
          name: veh.vehicleNumber || 'Vehicle',
          type: 'vehicle',
          score: 60,
          connections: 1,
          cases: 0,
          lastActivity: 'Toll plaza logging verified',
          risk: 'Medium',
          details: `Vehicle used by ${name}. Spec: ${veh.vehicleType || 'Unknown'} - ${veh.registrationDetails || 'Registered'}`,
          x: x + Math.cos(angleOffset + 0.6) * 60,
          y: y + Math.sin(angleOffset + 0.6) * 60,
          parentId: d.id
        });
        nodeIds.add(vId);
        allLinks.push({
          source: d.id,
          target: vId,
          relation: 'Vehicle User'
        });
      });
    }

    // Properties (Locations)
    if (d.propertyDetails && Array.isArray(d.propertyDetails)) {
      d.propertyDetails.forEach((prop, pIdx) => {
        const pId = `${d.id}-prop-${pIdx}`;
        allNodes.push({
          id: pId,
          name: prop.address || 'Property Location',
          type: 'location',
          score: 65,
          connections: 1,
          cases: 0,
          lastActivity: 'Asset audit logged',
          risk: 'High',
          details: `Property asset of ${name}. ${prop.type || 'Plot'}. Estimated Value: ${prop.estimatedValue || 'N/A'}. Status: ${prop.status || 'Active'}.`,
          x: x + Math.cos(angleOffset - 0.6) * 60,
          y: y + Math.sin(angleOffset - 0.6) * 60,
          parentId: d.id
        });
        nodeIds.add(pId);
        allLinks.push({
          source: d.id,
          target: pId,
          relation: 'Asset Location'
        });
      });
    }

    // Cases (FIRs)
    if (d.history && Array.isArray(d.history)) {
      d.history.forEach((fir, cIdx) => {
        const cId = `${d.id}-case-${cIdx}`;
        allNodes.push({
          id: cId,
          name: fir.firNumber || 'FIR Case',
          type: 'case',
          score: 80,
          connections: 1,
          cases: 1,
          lastActivity: 'Under trial review',
          risk: 'High',
          details: `FIR Charge Sheet filed against ${name}. Law sections: ${fir.sections || 'IPC'}. PS: ${fir.policeStation || 'N/A'}. Status: ${fir.chargeSheetStatus || 'Active'}.`,
          x: x + Math.cos(angleOffset + 1.2) * 70,
          y: y + Math.sin(angleOffset + 1.2) * 70,
          parentId: d.id
        });
        nodeIds.add(cId);
        allLinks.push({
          source: d.id,
          target: cId,
          relation: 'FIR Accused'
        });
      });
    }
  });
  return {
    allNodes,
    allLinks
  };
}

// Pre-seeded Ravi Kumar mock data matching the reference image layout and districts
const RAVI_KUMAR_HUD_DATA = {
  id: 'ravi_kumar',
  personalInfo: {
    name: 'Ravi Kumar',
    age: 32,
    aliasName: 'R. Kumar | RK',
    photograph: 'criminals/crm_0012.jpg',
    mobile: '9XXXXXXXX4'
  },
  districts: [{
    id: 'saharanpur',
    name: 'Saharanpur',
    x: 28,
    y: 15
  }, {
    id: 'lucknow',
    name: 'Lucknow',
    x: 48,
    y: 40
  }, {
    id: 'prayagraj',
    name: 'Prayagraj',
    x: 68,
    y: 62
  }],
  path: ['saharanpur', 'lucknow', 'prayagraj'],
  cards: [{
    id: 'suspect',
    type: 'suspect',
    label: 'Suspect',
    title: 'RAVI KUMAR',
    meta: 'AGE: 32 | ALIASES: R. KUMAR | RK',
    left: 41,
    top: 6,
    connectTo: {
      x: 48,
      y: 40
    },
    photo: 'criminals/crm_0012.jpg'
  }, {
    id: 'vehicle1',
    type: 'vehicle',
    label: 'Vehicle',
    title: 'UP32 KT 7684',
    meta: 'WHITE SWIFT DZIRE\nFIRST SEEN: 12 MAY 2024',
    left: 7,
    top: 15,
    connectTo: {
      x: 28,
      y: 15
    },
    photo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=150'
  }, {
    id: 'co_accused',
    type: 'co_accused',
    label: 'Co-Accused',
    title: 'AMIT YADAV',
    meta: 'AGE: 28\nKNOWN TO RAVI KUMAR SINCE 2019',
    left: 7,
    top: 45,
    connectTo: {
      x: 48,
      y: 40
    }
  }, {
    id: 'mobile1',
    type: 'mobile',
    label: 'Mobile Number',
    title: '8XXXXXXXX1',
    meta: 'OPERATOR: AIRTEL\nLOCATION HISTORY: 2 DISTRICTS',
    left: 7,
    top: 68,
    connectTo: {
      x: 48,
      y: 40
    }
  }, {
    id: 'case1',
    type: 'case',
    label: 'Case File',
    title: 'FIR NO. 215/2024',
    meta: 'U/S 379/411 IPC\nPS: ASHIANA, LUCKNOW\nDATE: 12 MAY 2024',
    status: 'ACTIVE',
    statusClass: 'badge-active',
    left: 38,
    top: 55,
    connectTo: {
      x: 48,
      y: 40
    }
  }, {
    id: 'mobile2',
    type: 'mobile',
    label: 'Mobile Number',
    title: '9XXXXXXXX4',
    meta: 'OPERATOR: JIO\nLOCATION HISTORY: 3 DISTRICTS',
    left: 75,
    top: 10,
    connectTo: {
      x: 48,
      y: 40
    }
  }, {
    id: 'case2',
    type: 'case',
    label: 'Case File',
    title: 'FIR NO. 478/2023',
    meta: 'U/S 392/397 IPC\nPS: CIVIL LINES, PRAYAGRAJ\nDATE: 03 SEP 2023',
    status: 'CHARGESHEETED',
    statusClass: 'badge-active',
    left: 75,
    top: 38,
    connectTo: {
      x: 68,
      y: 62
    }
  }, {
    id: 'vehicle2',
    type: 'vehicle',
    label: 'Vehicle',
    title: 'UP70 GT 1212',
    meta: 'MAHINDRA SCORPIO\nRECOVERED: 04 SEP 2023',
    left: 69,
    top: 68,
    connectTo: {
      x: 68,
      y: 62
    },
    photo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=150'
  }],
  aiQuery: 'Has this suspect appeared in previous cases?',
  aiResponse: {
    title: 'Yes. 3 matched cases found.',
    cases: ['FIR No. 478/2023 — U/S 392/397 IPC — Prayagraj — Chargesheeted', 'FIR No. 215/2024 — U/S 379/411 IPC — Lucknow — Active', 'FIR No. 102/2022 — U/S 457/380 IPC — Kanpur — Closed']
  }
};

// Generates suspect list for dropdown
const getHudSuspectsList = dossiers => {
  const list = [{
    id: 'ravi_kumar',
    name: 'Ravi Kumar (Reference Suspect)'
  }];
  dossiers.forEach(d => {
    list.push({
      id: d.id,
      name: `${d.personalInfo.name} (${d.personalInfo.aliasName || d.id})`
    });
  });
  return list;
};

// Compiles dynamic HUD data for any select suspect in dossiers database
const getHudData = (suspectId, dossiers) => {
  if (suspectId === 'ravi_kumar') {
    return RAVI_KUMAR_HUD_DATA;
  }
  const d = dossiers.find(x => x.id === suspectId);
  if (!d) return RAVI_KUMAR_HUD_DATA;
  const activeDistricts = [];
  const districtCoords = {
    lucknow: {
      name: 'Lucknow',
      x: 48,
      y: 40
    },
    noida: {
      name: 'Noida',
      x: 14,
      y: 35
    },
    varanasi: {
      name: 'Varanasi',
      x: 80,
      y: 50
    },
    prayagraj: {
      name: 'Prayagraj',
      x: 68,
      y: 62
    },
    ghaziabad: {
      name: 'Ghaziabad',
      x: 18,
      y: 30
    },
    kanpur: {
      name: 'Kanpur',
      x: 42,
      y: 48
    }
  };
  const compiledDistSet = new Set();
  if (d.history) {
    d.history.forEach(h => {
      if (h.district) {
        compiledDistSet.add(h.district.toLowerCase().trim());
      }
    });
  }
  const dists = Array.from(compiledDistSet).map(distKey => {
    const coords = districtCoords[distKey] || {
      name: distKey.toUpperCase(),
      x: 50,
      y: 50
    };
    return {
      id: distKey,
      ...coords
    };
  });
  if (dists.length === 0) {
    dists.push({
      id: 'lucknow',
      name: 'Lucknow',
      x: 48,
      y: 40
    });
  }
  const primaryDist = dists[0];
  const secondaryDist = dists[1] || dists[0];
  const cards = [];

  // 1. Suspect Card
  cards.push({
    id: 'suspect',
    type: 'suspect',
    label: 'Suspect',
    title: (d.personalInfo.name || '').toUpperCase(),
    meta: `AGE: ${d.personalInfo.age || 35} | ALIASES: ${d.personalInfo.aliasName || 'NONE'}`,
    left: 41,
    top: 6,
    connectTo: {
      x: primaryDist.x,
      y: primaryDist.y
    },
    photo: d.personalInfo.photograph || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
  });

  // 2. Case File Cards
  if (d.history) {
    d.history.slice(0, 2).forEach((h, idx) => {
      const isPrimary = idx === 0;
      const distCoords = h.district && districtCoords[h.district.toLowerCase()] || primaryDist;
      cards.push({
        id: `case_${idx}`,
        type: 'case',
        label: 'Case File',
        title: h.firNumber || 'PENDING FIR',
        meta: `${h.sections}\nPS: ${(h.policeStation || '').toUpperCase()}\nDATE: ${h.date || 'RECENT'}`,
        status: (d.status || '').toUpperCase(),
        statusClass: d.status === 'Wanted' ? 'badge-wanted' : 'badge-active',
        badge: (d.status || '').toUpperCase(),
        left: isPrimary ? 38 : 75,
        top: isPrimary ? 55 : 38,
        connectTo: {
          x: distCoords.x,
          y: distCoords.y
        }
      });
    });
  }

  // 3. Vehicle Cards
  if (d.vehicleDetails && d.vehicleDetails.length > 0) {
    d.vehicleDetails.slice(0, 2).forEach((v, idx) => {
      const isPrimary = idx === 0;
      const targetDist = isPrimary ? primaryDist : secondaryDist;
      cards.push({
        id: `vehicle_${idx}`,
        type: 'vehicle',
        label: 'Vehicle',
        title: v.vehicleNumber,
        meta: `${v.vehicleType}\nREGISTRATION: ${v.registrationDetails}`,
        left: isPrimary ? 7 : 69,
        top: isPrimary ? 15 : 68,
        connectTo: {
          x: targetDist.x,
          y: targetDist.y
        },
        photo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=150'
      });
    });
  }

  // 4. Co-Accused Card
  if (d.gangInfo && d.gangInfo.gangMembers && d.gangInfo.gangMembers.length > 0) {
    cards.push({
      id: 'co_accused',
      type: 'co_accused',
      label: 'Co-Accused',
      title: (d.gangInfo.gangMembers[0] || '').toUpperCase(),
      meta: `ASSOCIATE IN ${d.gangInfo.gangName || 'SYNDICATE'}`,
      left: 7,
      top: 45,
      connectTo: {
        x: primaryDist.x,
        y: primaryDist.y
      }
    });
  }

  // 5. Mobile Cards
  cards.push({
    id: 'mobile1',
    type: 'mobile',
    label: 'Mobile Number',
    title: d.personalInfo.mobile && d.personalInfo.mobile !== 'N/A' ? d.personalInfo.mobile.substring(0, 4) + 'XXXXXX' : '9XXXXXXXX5',
    meta: `OPERATOR: JIO / AIRTEL\nSTATUS: ACTIVE SURVEILLANCE`,
    left: 7,
    top: 68,
    connectTo: {
      x: primaryDist.x,
      y: primaryDist.y
    }
  });
  if (dists.length > 1) {
    cards.push({
      id: 'mobile2',
      type: 'mobile',
      label: 'Mobile Number',
      title: '9XXXXXXXX8',
      meta: 'CELL TOWER TRIANGULATED\nLOCATION PINGS LOGGED',
      left: 75,
      top: 10,
      connectTo: {
        x: secondaryDist.x,
        y: secondaryDist.y
      }
    });
  }
  const path = dists.map(di => di.id);
  const casesMatches = d.history ? d.history.map((h, i) => `${i + 1}. ${h.firNumber || 'FIR'} — ${h.sections || 'IPC'} — ${(h.district || '').toUpperCase()} — ${h.chargeSheetStatus}`) : [];
  return {
    id: d.id,
    personalInfo: {
      name: d.personalInfo.name,
      age: d.personalInfo.age,
      aliasName: d.personalInfo.aliasName || d.id,
      photograph: d.personalInfo.photograph,
      mobile: d.personalInfo.mobile
    },
    districts: dists,
    path,
    cards,
    aiQuery: `Has this suspect appeared in previous cases?`,
    aiResponse: {
      title: `Yes. ${d.history ? d.history.length : 0} matched cases found.`,
      cases: casesMatches
    }
  };
};

// React Main Component
const districtCenters = {
  lucknow: {
    name: 'Lucknow',
    lat: 26.8467,
    lng: 80.9462
  },
  varanasi: {
    name: 'Varanasi',
    lat: 25.3176,
    lng: 82.9739
  },
  prayagraj: {
    name: 'Prayagraj',
    lat: 25.4358,
    lng: 81.8463
  },
  noida: {
    name: 'Noida (GB Nagar)',
    lat: 28.5355,
    lng: 77.3910
  },
  ghaziabad: {
    name: 'Ghaziabad',
    lat: 28.6692,
    lng: 77.4538
  },
  agra: {
    name: 'Agra',
    lat: 27.1767,
    lng: 78.0081
  },
  kanpur: {
    name: 'Kanpur',
    lat: 26.4499,
    lng: 80.3319
  }
};
function ReactNetworkGraph() {
  const [viewMode, setViewMode] = useState('syndicate'); // Default to Syndicate Graph view
  const [hudSuspectId, setHudSuspectId] = useState('ravi_kumar');
  const [nodes, setNodes] = useState(INITIAL_SYNTHETIC_NODES);
  const [links, setLinks] = useState(INITIAL_SYNTHETIC_LINKS);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(true);
  const [telemetryOffsets, setTelemetryOffsets] = useState({
    lat: 0,
    lng: 0,
    lastPing: Date.now()
  });
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryOffsets(prev => ({
        lat: (Math.random() - 0.5) * 0.0006,
        lng: (Math.random() - 0.5) * 0.0006,
        lastPing: Date.now()
      }));
    }, 1500);
    return () => clearInterval(timer);
  }, []);
  const [selectedNodeId, setSelectedNodeId] = useState('center');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);
  const [activeTimelineEvent, setActiveTimelineEvent] = useState(null);

  // Track expanded parent nodes (double click toggles child details visibility)
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Pan and Zoom state
  const [pan, setPan] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0
  });

  // Draggable nodes state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const boardRef = useRef(null);

  // Poll and fetch live dossiers from the CSV database cache
  useEffect(() => {
    const loadData = () => {
      if (typeof window.getDossiers === 'function') {
        const dossiersList = window.getDossiers() || [];
        if (dossiersList.length > 0) {
          const {
            allNodes,
            allLinks
          } = buildNetworkFromCSV(dossiersList);
          setNodes(allNodes);
          setLinks(allLinks);

          // Select the first subject node initially
          const firstSubject = allNodes.find(n => n.type === 'subject');
          if (firstSubject) {
            setSelectedNodeId(firstSubject.id);
          }
          return true;
        }
      }
      return false;
    };
    if (!loadData()) {
      const interval = setInterval(() => {
        if (loadData()) {
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Filter and virtualize nodes (Max 50 visible)
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const isSearchActive = searchQuery.length > 0;

      // Node visibility rules based on expanded parent nodes
      let isVisibleByExpansion = n.type === 'group' || n.type === 'subject';
      if (!isVisibleByExpansion && n.parentId) {
        isVisibleByExpansion = expandedNodeIds.has(n.parentId);
      }
      const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.details && n.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || n.type === filterType;

      // If search query is typed, override expansion settings to display matches immediately
      return matchType && (isSearchActive ? matchSearch : isVisibleByExpansion && matchSearch);
    });
  }, [nodes, searchQuery, filterType, expandedNodeIds]);
  const visibleNodes = useMemo(() => {
    return filteredNodes.slice(0, 50);
  }, [filteredNodes]);
  const virtualizedCount = useMemo(() => {
    return filteredNodes.length - visibleNodes.length;
  }, [filteredNodes, visibleNodes]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0] || {
      name: 'Select Node',
      type: 'subject',
      score: 0,
      connections: 0,
      cases: 0,
      lastActivity: 'N/A',
      risk: 'Low',
      details: 'No node selected.'
    };
  }, [nodes, selectedNodeId]);

  // Links corresponding to visible nodes only
  const visibleLinks = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return links.filter(l => visibleIds.has(l.source) && visibleIds.has(l.target));
  }, [links, visibleNodes]);

  // Highlight links connected to the selected node
  const isLinkConnected = link => {
    if (!selectedNodeId) return false;
    return link.source === selectedNodeId || link.target === selectedNodeId;
  };

  // Canvas zoom/drag mouse handlers
  const handleCanvasMouseDown = e => {
    if (e.target.tagName === 'svg' || e.target.id === 'canvas-grid') {
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };
  const handleCanvasMouseMove = e => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggedNodeId) {
      // Node dragging logic (convert screen coords back to SVG local space)
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        // local coordinate calculations factoring in zoom and pan
        const localX = (e.clientX - rect.left - pan.x) / zoom;
        const localY = (e.clientY - rect.top - pan.y) / zoom;
        setNodes(prev => prev.map(n => {
          if (n.id === draggedNodeId && !n.fixed) {
            return {
              ...n,
              x: localX,
              y: localY
            };
          }
          return n;
        }));
      }
    }
  };
  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
  };
  const handleWheel = e => {
    e.preventDefault();
    const zoomFactor = 0.15;
    let nextZoom = zoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(zoom + zoomFactor, 3.0);
    } else {
      nextZoom = Math.max(zoom - zoomFactor, 0.3);
    }
    setZoom(nextZoom);
  };

  // Node actions
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (e.button === 0) {
      // Left click: select and drag
      setSelectedNodeId(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node && !node.fixed) {
        setDraggedNodeId(nodeId);
      }
    }
  };
  const handleNodeDoubleClick = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    if (node.type !== 'subject') {
      showToast('ℹ️ Details are only available for suspect nodes.', 'info');
      return;
    }
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
        showToast(`📁 Collapsed connection details for ${node.name}`, 'info');
      } else {
        next.add(nodeId);
        showToast(`📂 Expanded vehicle, location, and case files for ${node.name}`, 'success');
      }
      return next;
    });
  };
  const handleNodeContextMenu = (e, node) => {
    e.preventDefault();
    setDrawerContent(node);
    setIsDrawerOpen(true);
  };

  // Tooltip position state
  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0
  });
  const handleNodeMouseOver = (e, nodeId) => {
    setHoveredNodeId(nodeId);
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  };

  // Helper hash function for indexing
  const idxHash = str => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return hash;
  };

  // Reset graph layout
  const resetLayout = () => {
    if (typeof window.getDossiers === 'function') {
      const dossiersList = window.getDossiers() || [];
      if (dossiersList.length > 0) {
        const {
          allNodes,
          allLinks
        } = buildNetworkFromCSV(dossiersList);
        setNodes(allNodes);
        setLinks(allLinks);
        const firstSubject = allNodes.find(n => n.type === 'subject');
        if (firstSubject) {
          setSelectedNodeId(firstSubject.id);
        }
      }
    }
    setPan({
      x: 0,
      y: 0
    });
    setZoom(1);
    setExpandedNodeIds(new Set());
  };

  // Timeline Event click
  const handleTimelineEventClick = event => {
    setActiveTimelineEvent(event);
  };

  // Generate dynamic timeline for selected node
  const activeTimeline = useMemo(() => {
    if (selectedNode.type === 'subject') {
      const nodeName = selectedNode.name;
      const nodeStatus = selectedNode.status || 'Active';
      const nodeScore = selectedNode.score || 80;
      return [{
        id: 1,
        date: '2026-06-08',
        time: '18:42',
        title: `Movement Logged`,
        desc: `Intelligence reports verify movement of suspect ${nodeName} in their district area. Status is currently ${nodeStatus}.`,
        severity: nodeScore >= 80 ? 'critical' : 'warning'
      }, {
        id: 2,
        date: '2026-06-06',
        time: '11:15',
        title: `Dossier Verified`,
        desc: `PHQ Intelligence Unit synchronized dossier for ${nodeName} (Score: ${nodeScore}/100).`,
        severity: 'info'
      }, {
        id: 3,
        date: '2026-06-03',
        time: '09:00',
        title: `FIR History Check`,
        desc: `System verified active legal cases. Total mapped cases: ${selectedNode.cases || 0}.`,
        severity: 'warning'
      }];
    } else if (selectedNode.type === 'group') {
      return [{
        id: 1,
        date: '2026-06-08',
        time: '12:00',
        title: `Syndicate Watch Alert`,
        desc: `PHQ launched state-wide observation on ${selectedNode.name}. Mapped members: ${selectedNode.connections}.`,
        severity: 'critical'
      }, {
        id: 2,
        date: '2026-06-01',
        time: '14:30',
        title: `Extortion Ring Identified`,
        desc: `Intelligence reports link group operations to major extortion activities.`,
        severity: 'warning'
      }];
    } else {
      return [{
        id: 1,
        date: '2026-06-08',
        time: '10:00',
        title: `Metadata Verified`,
        desc: `Associated dossier link verified for ${selectedNode.name}. Details: ${selectedNode.details}`,
        severity: 'info'
      }];
    }
  }, [selectedNode]);

  // Utility styles
  const mainDivStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: isExpanded ? '100vh' : '650px',
    background: 'var(--navy-900)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    position: isExpanded ? 'fixed' : 'relative',
    top: isExpanded ? '0' : 'auto',
    left: isExpanded ? '0' : 'auto',
    zIndex: isExpanded ? '9999' : '1',
    transition: 'height 0.3s ease',
    overflow: 'hidden'
  };
  const dossiersList = useMemo(() => {
    return typeof window.getDossiers === 'function' ? window.getDossiers() : [];
  }, [nodes]);
  const selectedDossier = useMemo(() => {
    return dossiersList.find(d => d.id === selectedNodeId);
  }, [selectedNodeId, dossiersList]);
  const gangMembers = useMemo(() => {
    if (selectedNode.type !== 'group') return [];
    return dossiersList.filter(d => d.gangInfo && d.gangInfo.gangName === selectedNode.name);
  }, [selectedNode, dossiersList]);
  const hudData = useMemo(() => {
    return getHudData(hudSuspectId, dossiersList);
  }, [hudSuspectId, dossiersList]);
  const hudSuspects = useMemo(() => {
    return getHudSuspectsList(dossiersList);
  }, [dossiersList]);
  if (viewMode === 'hud') {
    return /*#__PURE__*/React.createElement("div", {
      className: "hud-container",
      style: {
        minHeight: isExpanded ? 'calc(100vh - 100px)' : '750px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hud-grid-bg"
    }), /*#__PURE__*/React.createElement("div", {
      className: "hud-header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hud-title-wrap"
    }, /*#__PURE__*/React.createElement("h1", null, "Hours to Minutes. Records"), /*#__PURE__*/React.createElement("p", null, "Priority 1 \u2014 Zero Tolerance Towards Crime & Criminals")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '4px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '2px',
        borderRadius: '6px',
        marginRight: '8px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `hud-toggle-btn ${viewMode === 'syndicate' ? 'active' : ''}`,
      onClick: () => setViewMode('syndicate'),
      style: {
        border: 'none',
        background: viewMode === 'syndicate' ? 'var(--gold-500)' : 'transparent',
        color: viewMode === 'syndicate' ? 'var(--navy-950)' : 'var(--text-muted)',
        fontSize: '11px',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }
    }, "\uD83D\uDCCA Syndicate Graph"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `hud-toggle-btn ${viewMode === 'hud' ? 'active' : ''}`,
      onClick: () => setViewMode('hud'),
      style: {
        border: 'none',
        background: viewMode === 'hud' ? 'var(--gold-500)' : 'transparent',
        color: viewMode === 'hud' ? 'var(--navy-950)' : 'var(--text-muted)',
        fontSize: '11px',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }
    }, "\uD83C\uDFAF Cross-District HUD")), /*#__PURE__*/React.createElement("select", {
      value: hudSuspectId,
      onChange: e => setHudSuspectId(e.target.value),
      style: {
        background: '#061329',
        border: '1px solid var(--gold-500)',
        color: '#f8fafc',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        outline: 'none',
        cursor: 'pointer',
        fontWeight: '700',
        boxShadow: '0 0 10px rgba(229,184,57,0.15)',
        marginRight: '8px'
      }
    }, hudSuspects.map(s => /*#__PURE__*/React.createElement("option", {
      key: s.id,
      value: s.id
    }, s.name))), /*#__PURE__*/React.createElement("button", {
      onClick: () => setIsExpanded(!isExpanded),
      style: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-primary)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        cursor: 'pointer',
        fontWeight: '700'
      }
    }, isExpanded ? 'Collapse' : '🖥️ Expand'))), /*#__PURE__*/React.createElement("div", {
      className: "hud-body"
    }, /*#__PURE__*/React.createElement("svg", {
      className: "hud-map-svg",
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none"
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
      id: "map-grad",
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#081e3f",
      stopOpacity: "0.4"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#020914",
      stopOpacity: "0.8"
    })), /*#__PURE__*/React.createElement("filter", {
      id: "neon-glow",
      x: "-20%",
      y: "-20%",
      width: "140%",
      height: "140%"
    }, /*#__PURE__*/React.createElement("feGaussianBlur", {
      stdDeviation: "0.8",
      result: "blur"
    }), /*#__PURE__*/React.createElement("feComposite", {
      in: "SourceGraphic",
      in2: "blur",
      operator: "over"
    })), /*#__PURE__*/React.createElement("marker", {
      id: "hud-arrow",
      viewBox: "0 0 10 10",
      refX: "6",
      refY: "5",
      markerWidth: "6",
      markerHeight: "6",
      orient: "auto-start-reverse"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M 0 2 L 8 5 L 0 8 z",
      fill: "#ff9d00"
    }))), /*#__PURE__*/React.createElement("path", {
      d: "M 12 40 C 14 28, 25 20, 32 22 C 40 24, 42 32, 48 35 C 54 38, 62 35, 68 40 C 74 45, 82 46, 86 52 C 88 56, 84 62, 80 65 C 75 68, 70 70, 62 68 C 56 66, 52 72, 46 70 C 40 68, 35 62, 28 63 C 23 64, 19 58, 17 53 C 15 48, 10 45, 12 40 Z",
      fill: "url(#map-grad)",
      stroke: "rgba(0, 240, 255, 0.2)",
      strokeWidth: "0.8",
      filter: "url(#neon-glow)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "4",
      y: "9",
      fill: "rgba(255,255,255,0.4)",
      fontSize: "1.8",
      fontWeight: "800",
      letterSpacing: "0.2"
    }, "UTTAR PRADESH"), /*#__PURE__*/React.createElement("text", {
      x: "4",
      y: "12.5",
      fill: "rgba(0, 240, 255, 0.6)",
      fontSize: "2.4",
      fontWeight: "900",
      letterSpacing: "0.2",
      filter: "url(#neon-glow)"
    }, "CROSS-DISTRICT ANALYSIS"), hudData.districts.length > 1 && hudData.path.map((distId, idx) => {
      if (idx === 0) return null;
      const prevDist = hudData.districts.find(d => d.id === hudData.path[idx - 1]);
      const currDist = hudData.districts.find(d => d.id === distId);
      if (!prevDist || !currDist) return null;
      const midX = (prevDist.x + currDist.x) / 2;
      const midY = (prevDist.y + currDist.y) / 2;
      const ctrlX = midX;
      const ctrlY = midY - 6;
      return /*#__PURE__*/React.createElement("path", {
        key: `path-${idx}`,
        d: `M ${prevDist.x} ${prevDist.y} Q ${ctrlX} ${ctrlY} ${currDist.x} ${currDist.y}`,
        fill: "none",
        stroke: "#ff9d00",
        strokeWidth: "0.8",
        className: "hud-animated-arrow-path",
        markerEnd: "url(#hud-arrow)"
      });
    }), hudData.districts.map(dist => /*#__PURE__*/React.createElement("g", {
      key: dist.id,
      transform: `translate(${dist.x}, ${dist.y})`
    }, /*#__PURE__*/React.createElement("circle", {
      r: "6",
      className: "hud-pulse-ring",
      fill: "none",
      stroke: "#00f0ff",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("circle", {
      r: "10",
      className: "hud-pulse-ring-slow",
      fill: "none",
      stroke: "#22c55e",
      strokeWidth: "0.3"
    }), /*#__PURE__*/React.createElement("circle", {
      r: "2",
      fill: "#22c55e"
    }), /*#__PURE__*/React.createElement("circle", {
      r: "1",
      fill: "#ffffff"
    }), /*#__PURE__*/React.createElement("text", {
      y: "5.2",
      textAnchor: "middle",
      fill: "#00f0ff",
      fontSize: "1.8",
      fontWeight: "800",
      style: {
        letterSpacing: '0.1px',
        textShadow: '0 0 2px #000'
      }
    }, dist.name.toUpperCase()))), hudData.cards.map(card => {
      const startX = card.connectTo.x;
      const startY = card.connectTo.y;
      const endX = card.left + (card.type === 'suspect' ? 10 : 8);
      const endY = card.top + 4;
      return /*#__PURE__*/React.createElement("g", {
        key: `connector-${card.id}`
      }, /*#__PURE__*/React.createElement("line", {
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        stroke: "rgba(0, 240, 255, 0.4)",
        strokeWidth: "0.2",
        strokeDasharray: "1,1"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: endX,
        cy: endY,
        r: "0.5",
        fill: "#00f0ff"
      }));
    })), hudData.cards.map(card => {
      const glowClass = card.type === 'suspect' ? '' : card.type === 'case' ? card.status === 'CHARGESHEETED' ? 'orange-glow' : 'gold-glow' : card.type === 'vehicle' ? 'gold-glow' : '';
      if (card.type === 'suspect') {
        return /*#__PURE__*/React.createElement("div", {
          key: card.id,
          className: `hud-card hud-card-suspect ${glowClass}`,
          style: {
            left: `${card.left}%`,
            top: `${card.top}%`
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "hud-card-label"
        }, card.label), /*#__PURE__*/React.createElement("div", {
          className: "suspect-header"
        }, /*#__PURE__*/React.createElement("div", {
          className: "suspect-photo-frame"
        }, /*#__PURE__*/React.createElement("img", {
          src: card.photo,
          className: "suspect-photo",
          alt: card.title,
          onError: e => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40"><rect width="30" height="40" fill="%23061329"/><text x="50%" y="55%" text-anchor="middle" fill="%2300f0ff" font-size="12">S</text></svg>';
          }
        })), /*#__PURE__*/React.createElement("div", {
          className: "suspect-meta"
        }, /*#__PURE__*/React.createElement("div", {
          className: "hud-card-title"
        }, card.title), /*#__PURE__*/React.createElement("div", {
          className: "hud-card-detail",
          style: {
            whiteSpace: 'pre-line'
          }
        }, card.meta))));
      }
      return /*#__PURE__*/React.createElement("div", {
        key: card.id,
        className: `hud-card ${glowClass}`,
        style: {
          left: `${card.left}%`,
          top: `${card.top}%`
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "hud-card-label"
      }, card.label), /*#__PURE__*/React.createElement("div", {
        className: "hud-card-title"
      }, card.title), /*#__PURE__*/React.createElement("div", {
        className: "hud-card-detail",
        style: {
          whiteSpace: 'pre-line'
        }
      }, card.meta), card.badge && /*#__PURE__*/React.createElement("span", {
        className: `badge ${card.badge === 'CHARGESHEETED' ? 'badge-active' : 'badge-approved'}`,
        style: {
          fontSize: '7px',
          padding: '1px 4px',
          marginTop: '4px',
          display: 'inline-block'
        }
      }, card.badge), card.photo && /*#__PURE__*/React.createElement("div", {
        className: "hud-card-photo-container"
      }, /*#__PURE__*/React.createElement("img", {
        src: card.photo,
        className: "hud-card-photo",
        alt: card.title,
        onError: e => {
          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect width="100" height="60" fill="%23061329"/><text x="50%" y="55%" text-anchor="middle" fill="%23ffd700" font-size="10">VEHICLE</text></svg>';
        }
      })));
    })), /*#__PURE__*/React.createElement("div", {
      className: "hud-bottom-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-query-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-avatar"
    }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-query-text"
    }, hudData.aiQuery)), /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-response-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-chip"
    }, "\uD83E\uDD16"), /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-response-content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-response-title"
    }, hudData.aiResponse.title), /*#__PURE__*/React.createElement("div", {
      className: "hud-ai-cases-list"
    }, hudData.aiResponse.cases.map((cs, idx) => /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "hud-ai-case-item"
    }, idx + 1, ". ", cs.split(' — ').map((part, pIdx) => {
      if (pIdx === 0) return /*#__PURE__*/React.createElement("strong", {
        key: pIdx
      }, part, " \u2014 ");
      if (pIdx === cs.split(' — ').length - 1) return /*#__PURE__*/React.createElement("span", {
        key: pIdx,
        style: {
          color: 'var(--gold-400)'
        }
      }, part);
      return /*#__PURE__*/React.createElement("span", {
        key: pIdx
      }, part, " \u2014 ");
    })))))), /*#__PURE__*/React.createElement("div", {
      className: "hud-disclaimer"
    }, /*#__PURE__*/React.createElement("strong", null, "SCOPE OF AI:"), " The system does not replace investigation judgment. It assists officers by surfacing linked records, patterns, and summaries \u2014 with full audit trails and source citations.")));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: mainDivStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      borderBottom: '1px solid var(--glass-border)',
      background: 'rgba(6, 19, 41, 0.8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '18px'
    }
  }, "\uD83D\uDD78\uFE0F"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      fontSize: '14px',
      color: 'var(--gold-400)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, "Network Overview"), virtualizedCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(238, 185, 2, 0.12)',
      border: '1px solid var(--gold-500)',
      color: 'var(--gold-400)',
      fontSize: '9px',
      padding: '2px 6px',
      borderRadius: '20px',
      fontWeight: '700',
      marginLeft: '8px'
    }
  }, "Virtualized: ", virtualizedCount, " nodes hidden")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '4px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '2px',
      borderRadius: '6px',
      marginRight: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `hud-toggle-btn ${viewMode === 'syndicate' ? 'active' : ''}`,
    onClick: () => setViewMode('syndicate'),
    style: {
      border: 'none',
      background: viewMode === 'syndicate' ? 'var(--gold-500)' : 'transparent',
      color: viewMode === 'syndicate' ? 'var(--navy-950)' : 'var(--text-muted)',
      fontSize: '11px',
      padding: '5px 10px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  }, "\uD83D\uDCCA Syndicate Graph"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `hud-toggle-btn ${viewMode === 'hud' ? 'active' : ''}`,
    onClick: () => setViewMode('hud'),
    style: {
      border: 'none',
      background: viewMode === 'hud' ? 'var(--gold-500)' : 'transparent',
      color: viewMode === 'hud' ? 'var(--navy-950)' : 'var(--text-muted)',
      fontSize: '11px',
      padding: '5px 10px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  }, "\uD83C\uDFAF Cross-District HUD")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-border)',
      borderRadius: '6px',
      padding: '4px 10px',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--text-muted)'
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search suspect nodes...",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    style: {
      background: 'none',
      border: 'none',
      outline: 'none',
      color: 'var(--text-primary)',
      fontSize: '12px',
      width: '160px'
    }
  })), /*#__PURE__*/React.createElement("select", {
    value: filterType,
    onChange: e => setFilterType(e.target.value),
    style: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-border)',
      color: 'var(--text-primary)',
      padding: '5px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      outline: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "\uD83D\uDD0D All Nodes"), /*#__PURE__*/React.createElement("option", {
    value: "subject"
  }, "\uD83D\uDC64 Subjects"), /*#__PURE__*/React.createElement("option", {
    value: "contact"
  }, "\uD83D\uDCF1 Contacts"), /*#__PURE__*/React.createElement("option", {
    value: "vehicle"
  }, "\uD83D\uDE97 Vehicles"), /*#__PURE__*/React.createElement("option", {
    value: "location"
  }, "\uD83D\uDCCD Locations"), /*#__PURE__*/React.createElement("option", {
    value: "case"
  }, "\uD83D\uDCC4 Cases"), /*#__PURE__*/React.createElement("option", {
    value: "group"
  }, "\uD83D\uDC65 Groups")), /*#__PURE__*/React.createElement("button", {
    onClick: resetLayout,
    title: "Reset Zoom & Pan",
    style: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-border)',
      color: 'var(--text-primary)',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '12px'
    }
  }, "\uD83D\uDD04"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsExpanded(!isExpanded),
    style: {
      background: 'var(--gold-500)',
      color: 'var(--navy-950)',
      fontWeight: '700',
      border: 'none',
      padding: '5px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  }, isExpanded ? 'Collapse' : '🖥️ Expand'))), /*#__PURE__*/React.createElement("div", {
    className: "network-layout-container"
  }, /*#__PURE__*/React.createElement("div", {
    ref: boardRef,
    onMouseDown: handleCanvasMouseDown,
    onMouseMove: handleCanvasMouseMove,
    onMouseUp: handleCanvasMouseUp,
    onWheel: handleWheel,
    className: "network-graph-panel",
    style: {
      cursor: isDraggingCanvas ? 'grabbing' : 'grab'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    style: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "nodeGrad-A"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ef4444"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#991b1b"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "nodeGrad-B"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#f59e0b"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#92400e"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "nodeGrad-C"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#3b82f6"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#1d4ed8"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "nodeGrad-D"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#10b981"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#065f46"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "nodeGrad-E"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#8b5cf6"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#5b21b6"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "nodeGrad-F"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#06b6d4"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#0891b2"
  })), /*#__PURE__*/React.createElement("filter", {
    id: "glow",
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "4",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feComposite", {
    in: "SourceGraphic",
    in2: "blur",
    operator: "over"
  }))), /*#__PURE__*/React.createElement("g", {
    transform: `translate(${pan.x}, ${pan.y}) scale(${zoom})`
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("pattern", {
    id: "grid",
    width: "40",
    height: "40",
    patternUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 40 0 L 0 0 0 40",
    fill: "none",
    stroke: "rgba(255, 255, 255, 0.02)",
    strokeWidth: "1"
  }))), /*#__PURE__*/React.createElement("rect", {
    id: "canvas-grid",
    width: "3000",
    height: "3000",
    x: "-1500",
    y: "-1500",
    fill: "url(#grid)"
  })), /*#__PURE__*/React.createElement("g", {
    transform: `translate(${pan.x}, ${pan.y}) scale(${zoom})`
  }, visibleLinks.map((link, i) => {
    const sourceNode = visibleNodes.find(n => n.id === link.source);
    const targetNode = visibleNodes.find(n => n.id === link.target);
    if (!sourceNode || !targetNode) return null;

    // Perpendicular offset for curved control points
    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Control point offset
    const ctrlX = midX - dy / len * 20;
    const ctrlY = midY + dx / len * 20;
    const isHighlighted = isLinkConnected(link);
    const strokeColor = isHighlighted ? 'var(--gold-500)' : 'rgba(255,255,255,0.08)';
    const strokeWidth = isHighlighted ? 2.5 : 1.2;
    const opacity = hoveredNodeId ? link.source === hoveredNodeId || link.target === hoveredNodeId ? 1.0 : 0.2 : selectedNodeId ? isLinkConnected(link) ? 1.0 : 0.3 : 0.6;
    return /*#__PURE__*/React.createElement("g", {
      key: `link-${i}`
    }, /*#__PURE__*/React.createElement("path", {
      d: `M ${sourceNode.x} ${sourceNode.y} Q ${ctrlX} ${ctrlY} ${targetNode.x} ${targetNode.y}`,
      fill: "none",
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      className: liveTrackingEnabled ? 'live-tracking-link' : '',
      style: {
        opacity,
        transition: 'opacity 0.2s, stroke 0.2s'
      }
    }), isHighlighted && /*#__PURE__*/React.createElement("text", {
      x: ctrlX,
      y: ctrlY - 4,
      fill: "var(--gold-400)",
      fontSize: "9px",
      fontWeight: "700",
      textAnchor: "middle",
      style: {
        opacity: 0.8
      }
    }, link.relation));
  })), /*#__PURE__*/React.createElement("g", {
    transform: `translate(${pan.x}, ${pan.y}) scale(${zoom})`
  }, visibleNodes.map(node => {
    const metadata = NODE_TYPES[node.type];
    const isSelected = selectedNodeId === node.id;
    const isHovered = hoveredNodeId === node.id;

    // Highlight color rings
    const isNodeHighlighted = isHovered || isSelected || selectedNodeId && links.some(l => l.source === selectedNodeId && l.target === node.id || l.target === selectedNodeId && l.source === node.id);
    const opacity = hoveredNodeId ? hoveredNodeId === node.id || links.some(l => l.source === hoveredNodeId && l.target === node.id || l.target === hoveredNodeId && l.source === node.id) ? 1.0 : 0.3 : 1.0;
    const radius = node.id === 'center' ? 24 : 18;
    return /*#__PURE__*/React.createElement("g", {
      key: node.id,
      transform: `translate(${node.x}, ${node.y})`,
      style: {
        cursor: node.fixed ? 'default' : 'move',
        opacity,
        transition: 'opacity 0.25s'
      },
      onMouseDown: e => handleNodeMouseDown(e, node.id),
      onDoubleClick: e => handleNodeDoubleClick(e, node.id),
      onContextMenu: e => handleNodeContextMenu(e, node),
      onMouseOver: e => handleNodeMouseOver(e, node.id),
      onMouseOut: () => setHoveredNodeId(null)
    }, isNodeHighlighted && /*#__PURE__*/React.createElement("circle", {
      r: radius + 6,
      fill: "none",
      stroke: isSelected ? 'var(--gold-500)' : 'rgba(238,185,2,0.4)',
      strokeWidth: "2.5",
      strokeDasharray: isSelected ? 'none' : '4,2',
      style: {
        filter: 'drop-shadow(0 0 4px var(--gold-500))'
      }
    }), liveTrackingEnabled && node.type === 'subject' && (node.risk === 'High' || isSelected) && /*#__PURE__*/React.createElement("circle", {
      r: radius,
      fill: "none",
      stroke: node.risk === 'High' ? 'var(--red-500)' : 'var(--gold-500)',
      strokeWidth: "1.5",
      className: "node-glowing-ring",
      style: {
        pointerEvents: 'none'
      }
    }), (() => {
      const color = metadata.color || '#ffffff';
      const strokeColor = node.risk === 'High' ? 'var(--red-400)' : isSelected ? 'var(--gold-400)' : color;
      switch (node.type) {
        case 'subject':
          // Radar target crosshairs
          return /*#__PURE__*/React.createElement("g", {
            className: "tactical-vector-shape",
            stroke: strokeColor,
            style: {
              color: strokeColor
            }
          }, /*#__PURE__*/React.createElement("circle", {
            r: radius,
            fill: "rgba(6, 19, 41, 0.85)",
            stroke: strokeColor,
            strokeWidth: "1.5"
          }), /*#__PURE__*/React.createElement("circle", {
            r: "4",
            fill: strokeColor,
            stroke: "none"
          }), /*#__PURE__*/React.createElement("circle", {
            r: radius - 5,
            fill: "none",
            stroke: strokeColor,
            strokeWidth: "0.8",
            strokeDasharray: "3,2",
            opacity: "0.6"
          }), /*#__PURE__*/React.createElement("path", {
            d: `M -${radius + 3} 0 L ${radius + 3} 0 M 0 -${radius + 3} L 0 ${radius + 3}`,
            strokeWidth: "1",
            opacity: "0.8"
          }));
        case 'group':
          // Hexagonal polygon with inner dashboard grid
          const points = "-18,-10 -18,10 0,20 18,10 18,-10 0,-20";
          const innerPoints = "-14,-8 -14,8 0,16 14,8 14,-8 0,-16";
          return /*#__PURE__*/React.createElement("g", {
            className: "tactical-vector-shape",
            stroke: strokeColor,
            style: {
              color: strokeColor
            }
          }, /*#__PURE__*/React.createElement("polygon", {
            points: points,
            fill: "rgba(238, 185, 2, 0.15)",
            stroke: strokeColor,
            strokeWidth: "2.2"
          }), /*#__PURE__*/React.createElement("polygon", {
            points: innerPoints,
            fill: "none",
            stroke: strokeColor,
            strokeWidth: "0.8",
            strokeDasharray: "3,1.5",
            opacity: "0.7"
          }), /*#__PURE__*/React.createElement("circle", {
            r: "4",
            fill: strokeColor,
            stroke: "none"
          }));
        case 'case':
          // Legal Case File folder
          return /*#__PURE__*/React.createElement("g", {
            className: "tactical-vector-shape",
            stroke: strokeColor,
            style: {
              color: strokeColor
            }
          }, /*#__PURE__*/React.createElement("rect", {
            x: "-10",
            y: "-12",
            width: "20",
            height: "24",
            rx: "2",
            ry: "2",
            fill: "rgba(139, 92, 246, 0.15)",
            stroke: strokeColor,
            strokeWidth: "1.5"
          }), /*#__PURE__*/React.createElement("line", {
            x1: "-6",
            y1: "-5",
            x2: "6",
            y2: "-5",
            strokeWidth: "1.2"
          }), /*#__PURE__*/React.createElement("line", {
            x1: "-6",
            y1: "0",
            x2: "6",
            y2: "0",
            strokeWidth: "1.2"
          }), /*#__PURE__*/React.createElement("line", {
            x1: "-6",
            y1: "5",
            x2: "2",
            y2: "5",
            strokeWidth: "1.2"
          }));
        case 'location':
          // GPS Locator target
          return /*#__PURE__*/React.createElement("g", {
            className: "tactical-vector-shape",
            stroke: strokeColor,
            style: {
              color: strokeColor
            }
          }, /*#__PURE__*/React.createElement("circle", {
            r: radius,
            fill: "rgba(16, 185, 129, 0.1)",
            stroke: strokeColor,
            strokeWidth: "1.5"
          }), /*#__PURE__*/React.createElement("path", {
            d: "M 0 -11 C -5 -11, -5 -4, 0 0 C 5 -4, 5 -11, 0 -11 Z",
            fill: strokeColor,
            opacity: "0.85"
          }), /*#__PURE__*/React.createElement("circle", {
            cy: "-7",
            r: "2.2",
            fill: "#020914",
            stroke: "none"
          }));
        case 'vehicle':
          // Scanning vehicle box
          return /*#__PURE__*/React.createElement("g", {
            className: "tactical-vector-shape",
            stroke: strokeColor,
            style: {
              color: strokeColor
            }
          }, /*#__PURE__*/React.createElement("rect", {
            x: "-13",
            y: "-10",
            width: "26",
            height: "20",
            rx: "3",
            ry: "3",
            fill: "rgba(59, 130, 246, 0.12)",
            stroke: strokeColor,
            strokeWidth: "1.5"
          }), /*#__PURE__*/React.createElement("line", {
            x1: "-9",
            y1: "-10",
            x2: "-9",
            y2: "10",
            strokeWidth: "2",
            opacity: "0.8"
          }), /*#__PURE__*/React.createElement("line", {
            x1: "9",
            y1: "-10",
            x2: "9",
            y2: "10",
            strokeWidth: "2",
            opacity: "0.8"
          }), /*#__PURE__*/React.createElement("circle", {
            r: "3",
            fill: strokeColor,
            stroke: "none"
          }));
        case 'contact':
          // Beacon wave communications node
          return /*#__PURE__*/React.createElement("g", {
            className: "tactical-vector-shape",
            stroke: strokeColor,
            style: {
              color: strokeColor
            }
          }, /*#__PURE__*/React.createElement("circle", {
            r: radius,
            fill: "rgba(245, 158, 11, 0.08)",
            stroke: strokeColor,
            strokeWidth: "1.5"
          }), /*#__PURE__*/React.createElement("circle", {
            r: "6",
            fill: "none",
            strokeWidth: "1"
          }), /*#__PURE__*/React.createElement("circle", {
            r: "2.2",
            fill: strokeColor,
            stroke: "none"
          }), /*#__PURE__*/React.createElement("path", {
            d: "M -10 -4 A 12 12 0 0 1 -10 4",
            fill: "none",
            strokeWidth: "0.8"
          }), /*#__PURE__*/React.createElement("path", {
            d: "M 10 -4 A 12 12 0 0 0 10 4",
            fill: "none",
            strokeWidth: "0.8"
          }));
        default:
          return /*#__PURE__*/React.createElement("circle", {
            r: radius,
            fill: metadata.gradient,
            stroke: strokeColor,
            strokeWidth: "2"
          });
      }
    })(), /*#__PURE__*/React.createElement("text", {
      dy: radius + 14,
      textAnchor: "middle",
      fill: isSelected ? 'var(--gold-400)' : '#f8fafc',
      fontSize: "8.5px",
      className: "tactical-node-label",
      style: {
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
      }
    }, node.type === 'group' ? node.name : node.name.split(' (')[0]));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: '12px',
      left: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      background: 'rgba(6, 19, 41, 0.85)',
      border: '1px solid var(--glass-border)',
      padding: '8px',
      borderRadius: '8px',
      fontSize: '10px',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      color: 'var(--gold-400)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      paddingBottom: '4px',
      marginBottom: '4px'
    }
  }, "\uD83D\uDDB1\uFE0F CONTROLS"), /*#__PURE__*/React.createElement("div", null, "\u2022 Drag Canvas to Pan"), /*#__PURE__*/React.createElement("div", null, "\u2022 Scroll wheel to Zoom"), /*#__PURE__*/React.createElement("div", null, "\u2022 Drag nodes to reposition"), /*#__PURE__*/React.createElement("div", null, "\u2022 Double click to Expand links"), /*#__PURE__*/React.createElement("div", null, "\u2022 Right click for Intelligence Drawer"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '6px',
      borderTop: '1px dashed rgba(255,255,255,0.06)',
      paddingTop: '6px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: "live-tracking-checkbox",
    checked: liveTrackingEnabled,
    onChange: e => setLiveTrackingEnabled(e.target.checked),
    style: {
      cursor: 'pointer',
      margin: 0
    }
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "live-tracking-checkbox",
    style: {
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '9px',
      color: liveTrackingEnabled ? '#22c55e' : 'var(--text-muted)'
    }
  }, "\uD83D\uDCE1 Live tracking signals"))), hoveredNodeId && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: `${tooltipPos.y}px`,
      left: `${tooltipPos.x}px`,
      background: '#09152a',
      border: '1.5px solid var(--gold-500)',
      borderRadius: '8px',
      padding: '10px 14px',
      zIndex: '1000',
      pointerEvents: 'none',
      maxWidth: '220px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      animation: 'fadeInModal 0.1s ease'
    }
  }, (() => {
    const node = nodes.find(n => n.id === hoveredNodeId);
    if (!node) return null;
    const metadata = NODE_TYPES[node.type];
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '10px',
        fontWeight: '700',
        color: metadata.color,
        textTransform: 'uppercase'
      }
    }, metadata.emoji, " ", metadata.label), /*#__PURE__*/React.createElement("span", {
      style: {
        background: node.risk === 'High' ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)',
        color: node.risk === 'High' ? 'var(--red-400)' : 'var(--green-400)',
        fontSize: '9px',
        padding: '1px 5px',
        borderRadius: '3px',
        fontWeight: '700'
      }
    }, node.risk, " Risk")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: '4px'
      }
    }, node.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        lineHeight: '1.3'
      }
    }, node.details), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px dashed rgba(255,255,255,0.06)',
        marginTop: '6px',
        paddingTop: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9px',
        color: 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "Score: ", node.score, "/100"), /*#__PURE__*/React.createElement("span", null, "Conns: ", node.connections)));
  })())), /*#__PURE__*/React.createElement("div", {
    className: "network-info-panel"
  }, selectedNode.type === 'group' ?
  /*#__PURE__*/
  /* GANG PROFILE VIEW */
  React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      color: 'var(--gold-400)',
      fontWeight: '700',
      letterSpacing: '1px'
    }
  }, "\uD83D\uDCC1 Mapped Syndicate Group"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
      marginBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '24px'
    }
  }, "\uD83D\uDC65"), /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '15px',
      fontWeight: '800',
      color: 'var(--text-primary)',
      margin: 0
    }
  }, selectedNode.name)), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-profile-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Total Mapped Members"), /*#__PURE__*/React.createElement("strong", null, gangMembers.length, " active")), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Area of Operations"), /*#__PURE__*/React.createElement("strong", null, selectedNode.areaOfOperation || 'Uttar Pradesh')), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Total Active Cases"), /*#__PURE__*/React.createElement("strong", null, selectedNode.cases, " cases")), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Risk Level"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--red-400)',
      fontWeight: '700'
    }
  }, selectedNode.risk, " Threat"))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-section-title"
  }, "\uD83D\uDC65 Connected Criminals"), /*#__PURE__*/React.createElement("ul", {
    className: "sidebar-list"
  }, gangMembers.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-muted)'
    }
  }, "No members found in local cache.") : gangMembers.map(m => /*#__PURE__*/React.createElement("li", {
    key: m.id,
    className: "sidebar-list-item clickable",
    onClick: () => setSelectedNodeId(m.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#f8fafc'
    }
  }, m.personalInfo.name)), /*#__PURE__*/React.createElement("span", {
    className: `badge ${m.status === 'Wanted' ? 'badge-danger' : 'badge-warning'}`,
    style: {
      fontSize: '8px',
      padding: '1px 4px'
    }
  }, m.status)))), liveTrackingEnabled && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-section-title"
  }, "\uD83D\uDCE1 Area Telemetry"), /*#__PURE__*/React.createElement("div", {
    className: "telemetry-widget"
  }, /*#__PURE__*/React.createElement("div", {
    className: "telemetry-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "telemetry-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "MONITORING GANG ACTIVITY")), /*#__PURE__*/React.createElement("div", {
    className: "telemetry-row"
  }, /*#__PURE__*/React.createElement("span", null, "Telemetry Mode:"), /*#__PURE__*/React.createElement("span", null, "ACTIVE SECTOR SCAN")), /*#__PURE__*/React.createElement("div", {
    className: "telemetry-row"
  }, /*#__PURE__*/React.createElement("span", null, "Scan Status:"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#86efac'
    }
  }, "SECURED"))))) : selectedNode.type === 'subject' && selectedDossier ?
  /*#__PURE__*/
  /* SUSPECT PROFILE VIEW */
  React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontWeight: '700',
      letterSpacing: '1px'
    }
  }, "\uD83D\uDC64 Mapped Suspect Node"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
      marginBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '24px'
    }
  }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '15px',
      fontWeight: '800',
      color: 'var(--text-primary)',
      margin: 0
    }
  }, selectedDossier.personalInfo.name)), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-profile-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-photo-frame"
  }, /*#__PURE__*/React.createElement("img", {
    src: selectedDossier.personalInfo.photograph,
    className: "sidebar-photo",
    alt: selectedDossier.personalInfo.name,
    onError: e => {
      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="110"><rect width="90" height="110" fill="%23061329"/><text x="50%" y="55%" text-anchor="middle" fill="%2300f0ff" font-size="12">NO IMAGE</text></svg>';
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Alias:"), /*#__PURE__*/React.createElement("strong", null, selectedDossier.personalInfo.aliasName || 'None')), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Age / Gender:"), /*#__PURE__*/React.createElement("strong", null, selectedDossier.personalInfo.age, " yrs / ", selectedDossier.personalInfo.gender)), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Status:"), /*#__PURE__*/React.createElement("span", {
    className: `badge ${selectedDossier.status === 'Wanted' ? 'badge-danger' : 'badge-warning'}`,
    style: {
      fontSize: '8px',
      padding: '1px 4px'
    }
  }, selectedDossier.status)), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Last Location:"), /*#__PURE__*/React.createElement("span", {
    className: "sidebar-info-val",
    title: selectedDossier.personalInfo.address
  }, selectedDossier.personalInfo.address))), liveTrackingEnabled && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-section-title"
  }, "\uD83D\uDEF0\uFE0F Live Telemetry Triangulation"), (() => {
    const distKey = (selectedDossier.history && selectedDossier.history[0] && selectedDossier.history[0].district || 'lucknow').toLowerCase().trim();
    const baseCoords = districtCenters[distKey] || districtCenters.lucknow;
    const lat = (baseCoords.lat + telemetryOffsets.lat).toFixed(6);
    const lng = (baseCoords.lng + telemetryOffsets.lng).toFixed(6);
    const ageSec = Math.floor((Date.now() - telemetryOffsets.lastPing) / 1000);
    return /*#__PURE__*/React.createElement("div", {
      className: "telemetry-widget"
    }, /*#__PURE__*/React.createElement("div", {
      className: "telemetry-header"
    }, /*#__PURE__*/React.createElement("span", {
      className: "telemetry-pulse"
    }), /*#__PURE__*/React.createElement("span", null, "ACTIVE SIGNAL ACQUIRED")), /*#__PURE__*/React.createElement("div", {
      className: "telemetry-row"
    }, /*#__PURE__*/React.createElement("span", null, "Latitude:"), /*#__PURE__*/React.createElement("span", null, lat, "\xB0 N")), /*#__PURE__*/React.createElement("div", {
      className: "telemetry-row"
    }, /*#__PURE__*/React.createElement("span", null, "Longitude:"), /*#__PURE__*/React.createElement("span", null, lng, "\xB0 E")), /*#__PURE__*/React.createElement("div", {
      className: "telemetry-row"
    }, /*#__PURE__*/React.createElement("span", null, "Triangulated:"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#86efac'
      }
    }, baseCoords.name, " sector")), /*#__PURE__*/React.createElement("div", {
      className: "telemetry-row"
    }, /*#__PURE__*/React.createElement("span", null, "Ping Status:"), /*#__PURE__*/React.createElement("span", null, "Stable (", ageSec, "s ago)")));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-section-title"
  }, "\uD83D\uDCCB Biometric Profile"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Height / Weight:"), /*#__PURE__*/React.createElement("strong", null, selectedDossier.biometrics.height || 'N/A', " / ", selectedDossier.biometrics.weight || 'N/A')), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Eye / Blood Group:"), /*#__PURE__*/React.createElement("strong", null, selectedDossier.biometrics.eyeColor || 'N/A', " / ", selectedDossier.biometrics.bloodGroup || 'N/A')), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row",
    style: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      borderBottom: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, "Ident. Marks:"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      marginTop: '2px',
      fontStyle: 'italic'
    }
  }, selectedDossier.biometrics.identificationMarks || 'None reported'))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-section-title"
  }, "\uD83D\uDE97 Mapped Vehicles"), /*#__PURE__*/React.createElement("ul", {
    className: "sidebar-list"
  }, !selectedDossier.vehicleDetails || selectedDossier.vehicleDetails.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-muted)'
    }
  }, "No vehicles registered.") : selectedDossier.vehicleDetails.map((v, vIdx) => /*#__PURE__*/React.createElement("li", {
    key: vIdx,
    className: "sidebar-list-item"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      color: '#f8fafc'
    }
  }, v.vehicleNumber), /*#__PURE__*/React.createElement("span", null, v.vehicleType)))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-section-title"
  }, "\uD83D\uDCC4 Active FIR Case Files"), /*#__PURE__*/React.createElement("ul", {
    className: "sidebar-list",
    style: {
      maxHeight: '120px',
      overflowY: 'auto'
    }
  }, !selectedDossier.history || selectedDossier.history.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-muted)'
    }
  }, "No FIRs on record.") : selectedDossier.history.map((fir, fIdx) => /*#__PURE__*/React.createElement("li", {
    key: fIdx,
    className: "sidebar-list-item",
    style: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '2px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      width: '100%',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      color: '#f8fafc'
    }
  }, fir.firNumber), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '9px',
      color: 'var(--text-muted)'
    }
  }, fir.policeStation, " PS")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      color: 'var(--text-secondary)',
      overflow: 'hidden',
      textOverlap: 'ellipsis',
      whiteSpace: 'nowrap',
      width: '100%'
    }
  }, fir.sections)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '16px',
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      fontSize: '11px',
      width: '100%'
    },
    onClick: () => typeof window.openDossierById === 'function' && window.openDossierById(selectedDossier.id)
  }, "\uD83D\uDC41\uFE0F View Full Dossier"))) :
  /*#__PURE__*/
  /* OTHER ASSET OR FALLBACK VIEW */
  React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontWeight: '700',
      letterSpacing: '1px'
    }
  }, "Selected Node"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '24px'
    }
  }, NODE_TYPES[selectedNode.type]?.emoji || '📍'), /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '15px',
      fontWeight: '800',
      color: 'var(--text-primary)',
      margin: 0
    }
  }, selectedNode.name)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      marginTop: '8px',
      fontStyle: 'italic',
      lineHeight: '1.4'
    }
  }, "\"", selectedNode.details, "\""), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-profile-card",
    style: {
      marginTop: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Type:"), /*#__PURE__*/React.createElement("strong", null, NODE_TYPES[selectedNode.type]?.label || selectedNode.type)), selectedNode.parentId && /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Associated To:"), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--gold-400)',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    onClick: () => setSelectedNodeId(selectedNode.parentId)
  }, "View Suspect Profile")), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-info-row"
  }, /*#__PURE__*/React.createElement("span", null, "Threat Index:"), /*#__PURE__*/React.createElement("strong", null, selectedNode.score || 0, " / 100")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderTop: '1px solid var(--glass-border)',
      background: 'rgba(6, 19, 41, 0.9)',
      overflowX: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      color: 'var(--text-gold)',
      fontWeight: '800',
      letterSpacing: '0.5px'
    }
  }, "\u23F3 Intelligence Activity Timeline: ", selectedNode.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      minWidth: '600px',
      paddingBottom: '4px'
    }
  }, activeTimeline.map((evt, idx) => {
    const severityColor = evt.severity === 'critical' ? 'var(--red-400)' : evt.severity === 'warning' ? 'var(--amber-400)' : 'var(--blue-400)';
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: evt.id
    }, idx > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'rgba(255,255,255,0.08)',
        fontSize: '14px'
      }
    }, "\u2794"), /*#__PURE__*/React.createElement("div", {
      onClick: () => handleTimelineEventClick(evt),
      style: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--glass-border)',
        borderLeft: `3.5px solid ${severityColor}`,
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        flex: '1',
        transition: 'transform 0.15s, border-color 0.15s',
        transform: activeTimelineEvent?.id === evt.id ? 'scale(1.02)' : 'none',
        borderColor: activeTimelineEvent?.id === evt.id ? 'var(--gold-500)' : 'var(--glass-border)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9px',
        color: 'var(--text-muted)',
        marginBottom: '2px'
      }
    }, /*#__PURE__*/React.createElement("span", null, evt.date, " | ", evt.time), /*#__PURE__*/React.createElement("span", {
      style: {
        color: severityColor,
        fontWeight: '800',
        textTransform: 'uppercase',
        fontSize: '8px'
      }
    }, evt.severity)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#f8fafc',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverlap: 'ellipsis'
      }
    }, evt.title)));
  }))), activeTimelineEvent && /*#__PURE__*/React.createElement("div", {
    onClick: () => setActiveTimelineEvent(null),
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(4,9,26,0.65)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: '#071328',
      border: '1px solid var(--gold-500)',
      borderRadius: '10px',
      padding: '16px 20px',
      maxWidth: '360px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      animation: 'fadeInModal 0.2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      fontWeight: '700',
      color: 'var(--gold-400)',
      textTransform: 'uppercase'
    }
  }, "Event Log Details"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setActiveTimelineEvent(null),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: '14px'
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '13px',
      fontWeight: '800',
      color: '#f8fafc',
      marginBottom: '6px'
    }
  }, activeTimelineEvent.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      lineHeight: '1.4',
      marginBottom: '10px'
    }
  }, activeTimelineEvent.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Time: ", activeTimelineEvent.time), /*#__PURE__*/React.createElement("span", null, "Date: ", activeTimelineEvent.date)))), isDrawerOpen && drawerContent && /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsDrawerOpen(false),
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(4,9,26,0.5)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '280px',
      height: '100%',
      background: '#061329',
      borderLeft: '1.5px solid var(--gold-500)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.8)',
      padding: '24px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      paddingBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      fontWeight: '800',
      color: 'var(--gold-400)',
      textTransform: 'uppercase'
    }
  }, "\uD83D\uDCC1 Intelligence Dossier"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsDrawerOpen(false),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--red-400)',
      cursor: 'pointer',
      fontSize: '16px'
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      marginBottom: '6px'
    }
  }, NODE_TYPES[drawerContent.type].emoji), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '16px',
      fontWeight: '800',
      color: '#f8fafc'
    }
  }, drawerContent.name), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(238, 185, 2, 0.12)',
      color: 'var(--gold-400)',
      fontSize: '9px',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '700',
      display: 'inline-block',
      marginTop: '4px'
    }
  }, "ID: ", drawerContent.id)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Association Type:"), " ", NODE_TYPES[drawerContent.type].label), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Threat Index:"), " ", drawerContent.score, "/100"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Surveillance Category:"), " ", drawerContent.risk, " Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px dashed rgba(255,255,255,0.06)',
      marginTop: '8px',
      paddingTop: '8px',
      lineHeight: '1.4'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Intelligence logs:"), " ", drawerContent.details)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setIsDrawerOpen(false);
      if (typeof openDossierById === 'function') {
        let matchedDossierId = 'CRM-2026-0001';
        if (typeof window.getDossiers === 'function') {
          const dossiers = window.getDossiers() || [];
          const match = dossiers.find(d => {
            const dName = (d.name || '').toLowerCase();
            const sName = (drawerContent.name || '').toLowerCase();
            const cleanSName = sName.split(' (')[0].split(' alias ')[0].trim();
            return dName.includes(cleanSName) || cleanSName.includes(dName);
          });
          if (match) {
            matchedDossierId = match.id;
          }
        }
        openDossierById(matchedDossierId);
      } else {
        showToast(`🔍 Opening detail file for ${drawerContent.name}`, 'info');
      }
    },
    style: {
      flex: 1,
      background: 'var(--gold-500)',
      color: 'var(--navy-950)',
      fontWeight: '700',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer'
    }
  }, "\uD83D\uDC41\uFE0F Full Profile"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsDrawerOpen(false),
    style: {
      flex: 1,
      background: 'none',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'var(--text-primary)',
      padding: '8px',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer'
    }
  }, "Close")))));
}

// Global bootstrap mounting helper function for vanilla JS integration
window.mountReactNetworkGraph = function (containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(ReactNetworkGraph));

  // Save unmount function to clean up correctly on route changes
  window.unmountReactNetworkGraph = () => {
    try {
      root.unmount();
    } catch (e) {}
  };
};
