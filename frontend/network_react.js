// =========================================================
//  CDIMS — ADVANCED RELATIONSHIP NETWORK GRAPH (REACT)
//  Premium Dark Navy / Gold Government Theme
// =========================================================

const { useState, useEffect, useRef, useMemo } = React;

// Node Types and their metadata
const NODE_TYPES = {
  subject: { label: 'Subject', emoji: '👤', color: '#ef4444', gradient: 'url(#nodeGrad-A)' },
  contact: { label: 'Contact', emoji: '📱', color: '#f59e0b', gradient: 'url(#nodeGrad-B)' },
  vehicle: { label: 'Vehicle', emoji: '🚗', color: '#3b82f6', gradient: 'url(#nodeGrad-C)' },
  location: { label: 'Location', emoji: '📍', color: '#10b981', gradient: 'url(#nodeGrad-D)' },
  case: { label: 'Case', emoji: '📄', color: '#8b5cf6', gradient: 'url(#nodeGrad-E)' },
  group: { label: 'Group', emoji: '👥', color: '#06b6d4', gradient: 'url(#nodeGrad-F)' }
};

// Initial synthetic dataset centered around Raju Kaana
const INITIAL_SYNTHETIC_NODES = [
  { id: 'center', name: 'Rajesh Yadav (Raju Kaana)', type: 'subject', score: 95, connections: 24, cases: 14, lastActivity: '2 hours ago - Signal Hazratganj', risk: 'High', details: 'Hardened Gangster, gang leader of D-102. Wanted under UP Gangsters Act and Arms Act.', x: 400, y: 250, fixed: true },
  
  // Contacts
  { id: 'contact1', name: 'Amit Mishra (Panditji)', type: 'contact', score: 78, connections: 12, cases: 4, lastActivity: 'Yesterday - Meeting in Aliganj', risk: 'Medium', details: 'Gang strategist and financier. Handles shell businesses.', x: 250, y: 150 },
  { id: 'contact2', name: 'Vikram Singh (Vicky Shooter)', type: 'contact', score: 88, connections: 8, cases: 9, lastActivity: '3 days ago - Spotted Varanasi Cantt', risk: 'High', details: 'Enforcer/Hitman. Active non-bailable warrant issued.', x: 280, y: 350 },
  { id: 'contact3', name: 'Sanjay Pal', type: 'contact', score: 52, connections: 5, cases: 1, lastActivity: '1 week ago - Vehicle depot Chowk', risk: 'Low', details: 'Logistics facilitator and driver for the syndicate.', x: 550, y: 150 },
  
  // Vehicles
  { id: 'veh1', name: 'White Fortuner (UP-32-EX-4122)', type: 'vehicle', score: 62, connections: 3, cases: 3, lastActivity: '12 hours ago - Toll Plaza Ayodhya', risk: 'Medium', details: 'Registered under spouse Savitri Devi. Used for local transit.', x: 450, y: 80 },
  { id: 'veh2', name: 'Black Scorpio (UP-42-AA-9999)', type: 'vehicle', score: 70, connections: 2, cases: 1, lastActivity: '4 days ago - Spotted Noida Sec-20', risk: 'High', details: 'Registered under frontman Pal. Used in contract extortion.', x: 520, y: 320 },
  
  // Locations
  { id: 'loc1', name: 'Hazratganj Safehouse', type: 'location', score: 65, connections: 6, cases: 2, lastActivity: 'Today - Signal triangulated', risk: 'High', details: 'Key meeting spot. Suspected weapons cache stored in basement.', x: 380, y: 110 },
  { id: 'loc2', name: 'Noida Sec-58 Hideout', type: 'location', score: 58, connections: 4, cases: 0, lastActivity: '2 weeks ago - Raid completed', risk: 'Medium', details: 'Associated with Satish Gujjar extortion operations.', x: 580, y: 220 },
  { id: 'loc3', name: 'Varanasi Logistics Center', type: 'location', score: 72, connections: 7, cases: 3, lastActivity: '5 days ago - Phone ping verified', risk: 'High', details: 'Storage point for illegal ordnance coming from Bihar boundary.', x: 220, y: 260 },
  
  // Cases
  { id: 'case1', name: 'FIR-324/2024 (Murder Charge)', type: 'case', score: 90, connections: 4, cases: 1, lastActivity: 'Under Trial - High Court Lucknow', risk: 'High', details: 'Murder, Attempt to murder, and Conspiracy. Bail rejected.', x: 310, y: 210 },
  { id: 'case2', name: 'FIR-12/2025 (UP Gangsters Act)', type: 'case', score: 85, connections: 6, cases: 1, lastActivity: 'Absconding - Charge sheet filed', risk: 'High', details: 'Special Gangsters Court Noida. Non-bailable arrest warrant active.', x: 480, y: 220 },
  
  // Group
  { id: 'group1', name: 'Raju Kaana Gang (D-102)', type: 'group', score: 92, connections: 18, cases: 12, lastActivity: 'Active Operations Statewide', risk: 'High', details: 'Active syndicate involved in contract killing and land grabbing.', x: 480, y: 160 }
];

const INITIAL_SYNTHETIC_LINKS = [
  { source: 'center', target: 'contact1', relation: 'Syndicate Lieutenant' },
  { source: 'center', target: 'contact2', relation: 'Primary Hitman' },
  { source: 'center', target: 'contact3', relation: 'Logistics Driver' },
  { source: 'center', target: 'veh1', relation: 'Transit Vehicle' },
  { source: 'center', target: 'veh2', relation: 'Tactical Vehicle' },
  { source: 'center', target: 'loc1', relation: 'Primary Safehouse' },
  { source: 'center', target: 'loc2', relation: 'Regional Hideout' },
  { source: 'center', target: 'loc3', relation: 'Ordnance Depot' },
  { source: 'center', target: 'case1', relation: 'Named Accused' },
  { source: 'center', target: 'case2', relation: 'Gang Leader' },
  { source: 'center', target: 'group1', relation: 'Gang Leader' },
  
  // Cross relationships
  { source: 'contact1', target: 'group1', relation: 'Member' },
  { source: 'contact2', target: 'group1', relation: 'Member' },
  { source: 'contact3', target: 'group1', relation: 'Member' },
  { source: 'contact2', target: 'loc3', relation: 'Frequents' },
  { source: 'contact1', target: 'loc1', relation: 'Manager' },
  { source: 'contact3', target: 'veh2', relation: 'Custodian' }
];

// Timeline events mapped to selected nodes
const SYNTHETIC_TIMELINES = {
  center: [
    { id: 1, date: '2026-06-08', time: '18:42', title: 'Cell Ping Hazratganj', desc: 'Encrypted call trace pinged towers in Hazratganj, Lucknow.', severity: 'critical' },
    { id: 2, date: '2026-06-06', time: '11:15', title: 'Asset Attached', desc: 'DM order executed: Gomti Nagar mansion worth 2.5cr attached.', severity: 'warning' },
    { id: 3, date: '2026-06-03', time: '09:00', title: 'Assault Incident', desc: 'Suspect named in contractor threat incident at Hazratganj site.', severity: 'critical' }
  ],
  contact1: [
    { id: 1, date: '2026-06-08', time: '14:20', title: 'Weekly Reporting', desc: 'Reported at Hazratganj Station as per High Court bail conditions.', severity: 'info' },
    { id: 2, date: '2026-06-04', time: '17:30', title: 'Bank Account Frozen', desc: 'Account with SBIKapoor frozen by order of Intelligence Unit.', severity: 'warning' }
  ],
  contact2: [
    { id: 1, date: '2026-06-05', time: '23:10', title: 'Spotted at Railway Stn', desc: 'Informants report Vicky spotted near Varanasi Cantt station platform 4.', severity: 'critical' },
    { id: 2, date: '2026-06-01', time: '10:00', title: 'Non Bailable Warrant Issued', desc: 'Special court Varanasi issued NBW for failure to present on trial.', severity: 'critical' }
  ],
  contact3: [
    { id: 1, date: '2026-06-02', time: '08:45', title: 'Logistics Interception', desc: 'Swift hatchback searched by police beat. No illegal goods found.', severity: 'info' }
  ],
  loc1: [
    { id: 1, date: '2026-06-08', time: '18:00', title: 'Thermal Signal Triangulated', desc: 'Active heat signatures matching 4 suspects observed via satellite Intel.', severity: 'warning' },
    { id: 2, date: '2026-05-28', time: '04:00', title: 'Late Night Meeting', desc: 'Local police vehicle logged 3 luxury SUVs arriving at location.', severity: 'info' }
  ],
  veh1: [
    { id: 1, date: '2026-06-08', time: '08:30', title: 'Toll Logged', desc: 'Ayodhya Toll Plaza camera captured license plate UP-32-EX-4122.', severity: 'info' }
  ]
};

// Helper function to dynamically construct the gang relationship network from live CSV dossiers
function buildNetworkFromCSV(dossiers) {
  const allNodes = [];
  const allLinks = [];
  const nodeIds = new Set();
  const gangNames = new Set();

  // Fixed coordinates for the 4 main gangs to keep the layout clean, structured, and clustered
  const GANG_COORDS = {
    'Gujjar Syndicate (G-110)': { x: 220, y: 150 },
    'Purvanchal Cartel (P-51)': { x: 220, y: 350 },
    'Western UP Syndicate (W-88)': { x: 580, y: 150 },
    'Raju Kaana Gang (D-102)': { x: 580, y: 350 }
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
      const angle = (mIdx / count) * Math.PI * 2;
      const radius = 95;
      x = center.x + Math.cos(angle) * radius;
      y = center.y + Math.sin(angle) * radius;
    } else {
      // Independent/Other subjects placed in a large outer ring
      const angle = (idx / dossiers.length) * Math.PI * 2;
      x = 400 + Math.cos(angle) * 210;
      y = 250 + Math.sin(angle) * 210;
    }

    const numCases = d.history ? d.history.length : 0;
    const scoreVal = d.status === 'Wanted' ? 92 : (d.status === 'Active' ? 82 : (d.status === 'In Jail' ? 70 : 55));

    allNodes.push({
      id: d.id,
      name: name,
      type: 'subject',
      score: scoreVal,
      connections: d.gangInfo && d.gangInfo.gangMembers ? d.gangInfo.gangMembers.length : 1,
      cases: numCases,
      lastActivity: d.surveillance && d.surveillance.surveillanceNotes ? d.surveillance.surveillanceNotes : 'Recent movements verified by intelligence beat',
      risk: d.surveillance && d.surveillance.surveillanceCategory && d.surveillance.surveillanceCategory.includes('Category A') ? 'High' : (d.surveillance && d.surveillance.surveillanceCategory && d.surveillance.surveillanceCategory.includes('Category B') ? 'Medium' : 'Low'),
      details: d.surveillance && d.surveillance.intelligenceInputs ? d.surveillance.intelligenceInputs : (d.personalInfo.address || 'Under intelligence watch.'),
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

  return { allNodes, allLinks };
}

// React Main Component
function ReactNetworkGraph() {
  const [nodes, setNodes] = useState(INITIAL_SYNTHETIC_NODES);
  const [links, setLinks] = useState(INITIAL_SYNTHETIC_LINKS);
  
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Draggable nodes state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  
  const boardRef = useRef(null);

  // Poll and fetch live dossiers from the CSV database cache
  useEffect(() => {
    const loadData = () => {
      if (typeof window.getDossiers === 'function') {
        const dossiersList = window.getDossiers() || [];
        if (dossiersList.length > 0) {
          const { allNodes, allLinks } = buildNetworkFromCSV(dossiersList);
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
      
      const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n.details && n.details.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = filterType === 'all' || n.type === filterType;
      
      // If search query is typed, override expansion settings to display matches immediately
      return matchType && (isSearchActive ? matchSearch : (isVisibleByExpansion && matchSearch));
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
  const isLinkConnected = (link) => {
    if (!selectedNodeId) return false;
    return link.source === selectedNodeId || link.target === selectedNodeId;
  };

  // Canvas zoom/drag mouse handlers
  const handleCanvasMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'canvas-grid') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggedNodeId) {
      // Node dragging logic (convert screen coords back to SVG local space)
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        // local coordinate calculations factoring in zoom and pan
        const localX = (e.clientX - rect.left - pan.x) / zoom;
        const localY = (e.clientY - rect.top - pan.y) / zoom;
        
        setNodes(prev => prev.map(n => {
          if (n.id === draggedNodeId && !n.fixed) {
            return { ...n, x: localX, y: localY };
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

  const handleWheel = (e) => {
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
    if (e.button === 0) { // Left click: select and drag
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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
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
  const idxHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return hash;
  };

  // Reset graph layout
  const resetLayout = () => {
    if (typeof window.getDossiers === 'function') {
      const dossiersList = window.getDossiers() || [];
      if (dossiersList.length > 0) {
        const { allNodes, allLinks } = buildNetworkFromCSV(dossiersList);
        setNodes(allNodes);
        setLinks(allLinks);
        
        const firstSubject = allNodes.find(n => n.type === 'subject');
        if (firstSubject) {
          setSelectedNodeId(firstSubject.id);
        }
      }
    }
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setExpandedNodeIds(new Set());
  };

  // Timeline Event click
  const handleTimelineEventClick = (event) => {
    setActiveTimelineEvent(event);
  };

  // Generate dynamic timeline for selected node
  const activeTimeline = useMemo(() => {
    if (selectedNode.type === 'subject') {
      const nodeName = selectedNode.name;
      const nodeStatus = selectedNode.status || 'Active';
      const nodeScore = selectedNode.score || 80;
      
      return [
        { id: 1, date: '2026-06-08', time: '18:42', title: `Movement Logged`, desc: `Intelligence reports verify movement of suspect ${nodeName} in their district area. Status is currently ${nodeStatus}.`, severity: nodeScore >= 80 ? 'critical' : 'warning' },
        { id: 2, date: '2026-06-06', time: '11:15', title: `Dossier Verified`, desc: `PHQ Intelligence Unit synchronized dossier for ${nodeName} (Score: ${nodeScore}/100).`, severity: 'info' },
        { id: 3, date: '2026-06-03', time: '09:00', title: `FIR History Check`, desc: `System verified active legal cases. Total mapped cases: ${selectedNode.cases || 0}.`, severity: 'warning' }
      ];
    } else if (selectedNode.type === 'group') {
      return [
        { id: 1, date: '2026-06-08', time: '12:00', title: `Syndicate Watch Alert`, desc: `PHQ launched state-wide observation on ${selectedNode.name}. Mapped members: ${selectedNode.connections}.`, severity: 'critical' },
        { id: 2, date: '2026-06-01', time: '14:30', title: `Extortion Ring Identified`, desc: `Intelligence reports link group operations to major extortion activities.`, severity: 'warning' }
      ];
    } else {
      return [
        { id: 1, date: '2026-06-08', time: '10:00', title: `Metadata Verified`, desc: `Associated dossier link verified for ${selectedNode.name}. Details: ${selectedNode.details}`, severity: 'info' }
      ];
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

  return (
    <div style={mainDivStyle}>
      {/* TOP BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(6, 19, 41, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🕸️</span>
          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Network Overview
          </span>
          {virtualizedCount > 0 && (
            <span style={{
              background: 'rgba(238, 185, 2, 0.12)',
              border: '1px solid var(--gold-500)',
              color: 'var(--gold-400)',
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '20px',
              fontWeight: '700',
              marginLeft: '8px'
            }}>
              Virtualized: {virtualizedCount} nodes hidden
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            padding: '4px 10px',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search suspect nodes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '160px'
              }}
            />
          </div>

          {/* Filter icon dropdown */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">🔍 All Nodes</option>
            <option value="subject">👤 Subjects</option>
            <option value="contact">📱 Contacts</option>
            <option value="vehicle">🚗 Vehicles</option>
            <option value="location">📍 Locations</option>
            <option value="case">📄 Cases</option>
            <option value="group">👥 Groups</option>
          </select>

          {/* Reset button */}
          <button 
            onClick={resetLayout}
            title="Reset Zoom & Pan"
            style={{
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
            }}
          >
            🔄
          </button>

          {/* Expand button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
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
            }}
          >
            {isExpanded ? 'Collapse' : '🖥️ Expand'}
          </button>
        </div>
      </div>

      {/* BODY SECTION (Split in same DIV) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* LEFT (70%): Interactive Relationship Graph */}
        <div 
          ref={boardRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{
            flex: '0 0 70%',
            height: '100%',
            background: 'var(--navy-950)',
            borderRight: '1px solid var(--glass-border)',
            position: 'relative',
            cursor: isDraggingCanvas ? 'grabbing' : 'grab',
            userSelect: 'none',
            overflow: 'hidden'
          }}
        >
          <svg style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            {/* Definitions for node drop shadows and gradients */}
            <defs>
              <radialGradient id="nodeGrad-A"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#991b1b" /></radialGradient>
              <radialGradient id="nodeGrad-B"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#92400e" /></radialGradient>
              <radialGradient id="nodeGrad-C"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1d4ed8" /></radialGradient>
              <radialGradient id="nodeGrad-D"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#065f46" /></radialGradient>
              <radialGradient id="nodeGrad-E"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#5b21b6" /></radialGradient>
              <radialGradient id="nodeGrad-F"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#0891b2" /></radialGradient>
              
              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid pattern background */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect id="canvas-grid" width="3000" height="3000" x="-1500" y="-1500" fill="url(#grid)" />
            </g>

            {/* Render curved edges paths */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {visibleLinks.map((link, i) => {
                const sourceNode = visibleNodes.find(n => n.id === link.source);
                const targetNode = visibleNodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;
                
                // Perpendicular offset for curved control points
                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;
                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const len = Math.sqrt(dx*dx + dy*dy) || 1;
                // Control point offset
                const ctrlX = midX - (dy / len) * 20;
                const ctrlY = midY + (dx / len) * 20;
                
                const isHighlighted = isLinkConnected(link);
                const strokeColor = isHighlighted ? 'var(--gold-500)' : 'rgba(255,255,255,0.08)';
                const strokeWidth = isHighlighted ? 2.5 : 1.2;
                const opacity = hoveredNodeId ? (link.source === hoveredNodeId || link.target === hoveredNodeId ? 1.0 : 0.2) : (selectedNodeId ? (isLinkConnected(link) ? 1.0 : 0.3) : 0.6);

                return (
                  <g key={`link-${i}`}>
                    <path
                      d={`M ${sourceNode.x} ${sourceNode.y} Q ${ctrlX} ${ctrlY} ${targetNode.x} ${targetNode.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      style={{ opacity, transition: 'opacity 0.2s, stroke 0.2s' }}
                    />
                    {isHighlighted && (
                      <text
                        x={ctrlX}
                        y={ctrlY - 4}
                        fill="var(--gold-400)"
                        fontSize="9px"
                        fontWeight="700"
                        textAnchor="middle"
                        style={{ opacity: 0.8 }}
                      >
                        {link.relation}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Render Nodes */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {visibleNodes.map((node) => {
                const metadata = NODE_TYPES[node.type];
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                
                // Highlight color rings
                const isNodeHighlighted = isHovered || isSelected || (selectedNodeId && links.some(l => 
                  (l.source === selectedNodeId && l.target === node.id) || 
                  (l.target === selectedNodeId && l.source === node.id)
                ));

                const opacity = hoveredNodeId ? (hoveredNodeId === node.id || links.some(l => 
                  (l.source === hoveredNodeId && l.target === node.id) || 
                  (l.target === hoveredNodeId && l.source === node.id)
                ) ? 1.0 : 0.3) : 1.0;

                const radius = node.id === 'center' ? 24 : 18;

                return (
                  <g 
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: node.fixed ? 'default' : 'move', opacity, transition: 'opacity 0.25s' }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                    onContextMenu={(e) => handleNodeContextMenu(e, node)}
                    onMouseOver={(e) => handleNodeMouseOver(e, node.id)}
                    onMouseOut={() => setHoveredNodeId(null)}
                  >
                    {/* Ring highlight */}
                    {isNodeHighlighted && (
                      <circle
                        r={radius + 6}
                        fill="none"
                        stroke={isSelected ? 'var(--gold-500)' : 'rgba(238,185,2,0.4)'}
                        strokeWidth="2.5"
                        strokeDasharray={isSelected ? 'none' : '4,2'}
                        style={{ filter: 'drop-shadow(0 0 4px var(--gold-500))' }}
                      />
                    )}
                    
                    {/* Base Node Circle */}
                    <circle
                      r={radius}
                      fill={metadata.gradient}
                      stroke={node.risk === 'High' ? 'var(--red-400)' : 'rgba(255,255,255,0.2)'}
                      strokeWidth="2"
                    />

                    {/* Emoji representation */}
                    <text
                      dy="4"
                      textAnchor="middle"
                      fontSize={node.id === 'center' ? '18px' : '14px'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {metadata.emoji}
                    </text>

                    {/* Suspect Name label */}
                    <text
                      dy={radius + 14}
                      textAnchor="middle"
                      fill={isSelected ? 'var(--gold-400)' : '#f8fafc'}
                      fontSize="9.5px"
                      fontWeight={isSelected ? '700' : '500'}
                      style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                    >
                      {node.name.split(' ')[0]} {node.name.split(' ')[1] || ''}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* SVG Controls Overlay */}
          <div style={{
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
          }}>
            <div style={{ fontWeight: '700', color: 'var(--gold-400)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', marginBottom: '4px' }}>🖱️ CONTROLS</div>
            <div>• Drag Canvas to Pan</div>
            <div>• Scroll wheel to Zoom</div>
            <div>• Drag nodes to reposition</div>
            <div>• Double click to Expand links</div>
            <div>• Right click for Intelligence Drawer</div>
          </div>

          {/* Hover Tooltip Overlay */}
          {hoveredNodeId && (
            <div style={{
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
            }}>
              {(() => {
                const node = nodes.find(n => n.id === hoveredNodeId);
                if (!node) return null;
                const metadata = NODE_TYPES[node.type];
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: metadata.color, textTransform: 'uppercase' }}>
                        {metadata.emoji} {metadata.label}
                      </span>
                      <span style={{
                        background: node.risk === 'High' ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)',
                        color: node.risk === 'High' ? 'var(--red-400)' : 'var(--green-400)',
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: '700'
                      }}>
                        {node.risk} Risk
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>{node.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{node.details}</div>
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', marginTop: '6px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
                      <span>Score: {node.score}/100</span>
                      <span>Conns: {node.connections}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* RIGHT (30%): Compact Info Panel */}
        <div style={{
          flex: '0 0 30%',
          height: '100%',
          background: 'rgba(6, 19, 41, 0.9)',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto'
        }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px' }}>
              Selected Subject Node
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px' }}>{NODE_TYPES[selectedNode.type].emoji}</span>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedNode.name}</h4>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.4' }}>
              "{selectedNode.details}"
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Network Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Network Score</span>
              <span style={{
                color: selectedNode.score >= 80 ? 'var(--red-400)' : 'var(--gold-400)',
                fontWeight: '800',
                fontSize: '15px'
              }}>
                {selectedNode.score} / 100
              </span>
            </div>

            {/* Risk Indicator bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>Risk Indicator</span>
                <span style={{ color: selectedNode.risk === 'High' ? 'var(--red-400)' : 'var(--green-400)', fontWeight: '700' }}>
                  {selectedNode.risk} Threat
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${selectedNode.score}%`,
                  background: selectedNode.risk === 'High' ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #f59e0b)',
                  borderRadius: '3px'
                }}></div>
              </div>
            </div>

            {/* Connections */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Total Connections</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{selectedNode.connections} nodes</span>
            </div>

            {/* Cases */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>FIR/Case Files</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{selectedNode.cases} cases</span>
            </div>

            {/* Last Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Last Intelligence Activity</span>
              <span style={{ color: 'var(--gold-400)', fontWeight: '600', fontSize: '11px' }}>{selectedNode.lastActivity}</span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div style={{
            marginTop: 'auto',
            padding: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1.5px dashed var(--glass-border)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--gold-400)', marginBottom: '4px' }}>💡 NODE INTELLIGENCE</div>
            <div>Double-click this node to scan adjacent syndicate networks. Right-click to inspect full records logs.</div>
          </div>
        </div>
      </div>

      {/* BOTTOM (inside same DIV): Horizontal Timeline */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid var(--glass-border)',
        background: 'rgba(6, 19, 41, 0.9)',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-gold)', fontWeight: '800', letterSpacing: '0.5px' }}>
          ⏳ Intelligence Activity Timeline: {selectedNode.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '600px', paddingBottom: '4px' }}>
          {activeTimeline.map((evt, idx) => {
            const severityColor = evt.severity === 'critical' ? 'var(--red-400)' : evt.severity === 'warning' ? 'var(--amber-400)' : 'var(--blue-400)';
            return (
              <React.Fragment key={evt.id}>
                {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: '14px' }}>➔</span>}
                <div 
                  onClick={() => handleTimelineEventClick(evt)}
                  style={{
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
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    <span>{evt.date} | {evt.time}</span>
                    <span style={{ color: severityColor, fontWeight: '800', textTransform: 'uppercase', fontSize: '8px' }}>{evt.severity}</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverlap: 'ellipsis' }}>
                    {evt.title}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Timeline Event Details Popover Modal */}
      {activeTimelineEvent && (
        <div 
          onClick={() => setActiveTimelineEvent(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(4,9,26,0.65)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#071328',
              border: '1px solid var(--gold-500)',
              borderRadius: '10px',
              padding: '16px 20px',
              maxWidth: '360px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              animation: 'fadeInModal 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-400)', textTransform: 'uppercase' }}>
                Event Log Details
              </span>
              <button 
                onClick={() => setActiveTimelineEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>{activeTimelineEvent.title}</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>{activeTimelineEvent.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>Time: {activeTimelineEvent.time}</span>
              <span>Date: {activeTimelineEvent.date}</span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT-CLICK DRAWER OVERLAY (Slide out drawer) */}
      {isDrawerOpen && drawerContent && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(4,9,26,0.5)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
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
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--gold-400)', textTransform: 'uppercase' }}>
                📁 Intelligence Dossier
              </span>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--red-400)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <div>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{NODE_TYPES[drawerContent.type].emoji}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>{drawerContent.name}</h3>
              <span style={{
                background: 'rgba(238, 185, 2, 0.12)',
                color: 'var(--gold-400)',
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '700',
                display: 'inline-block',
                marginTop: '4px'
              }}>
                ID: {drawerContent.id}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <div><strong>Association Type:</strong> {NODE_TYPES[drawerContent.type].label}</div>
              <div><strong>Threat Index:</strong> {drawerContent.score}/100</div>
              <div><strong>Surveillance Category:</strong> {drawerContent.risk} Category</div>
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', lineHeight: '1.4' }}>
                <strong>Intelligence logs:</strong> {drawerContent.details}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
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
                }}
                style={{
                  flex: 1,
                  background: 'var(--gold-500)',
                  color: 'var(--navy-950)',
                  fontWeight: '700',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                👁️ Full Profile
              </button>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Global bootstrap mounting helper function for vanilla JS integration
window.mountReactNetworkGraph = function(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(ReactNetworkGraph));
  
  // Save unmount function to clean up correctly on route changes
  window.unmountReactNetworkGraph = () => {
    try {
      root.unmount();
    } catch(e) {}
  };
};
