// =========================================================
//  CDIMS — Criminal Association Network Graph
//  Using D3.js Force-Directed Layout
// =========================================================

window.renderNetworkGraph = function(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const dossiers = getDossiers();
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  // Build nodes and links from dossier networkMapping data
  const nodes = dossiers.map(d => ({
    id: d.id,
    name: d.personalInfo.name,
    alias: d.personalInfo.aliasName,
    status: d.status,
    gang: d.gangInfo.gangName,
    category: d.surveillance.surveillanceCategory,
    risk: calculateRiskScore(d)
  }));

  const links = [];
  dossiers.forEach(d => {
    if (d.gangInfo.networkMapping) {
      d.gangInfo.networkMapping.forEach(rel => {
        const targetExists = dossiers.find(t => t.id === rel.targetId);
        if (targetExists) {
          links.push({
            source: d.id,
            target: rel.targetId,
            relation: rel.relation
          });
        }
      });
    }
  });

  // Resolve duplicate links (keep one direction only)
  const uniqueLinks = links.filter((link, idx) =>
    links.findIndex(l =>
      (l.source === link.source && l.target === link.target) ||
      (l.source === link.target && l.target === link.source)
    ) === idx
  );

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('class', 'network-svg')
    .attr('width', width)
    .attr('height', height);

  // Gradient defs
  const defs = svg.append('defs');
  const gradient = defs.append('radialGradient').attr('id', 'nodeGrad-A');
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444');
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#991b1b');

  const gradient2 = defs.append('radialGradient').attr('id', 'nodeGrad-B');
  gradient2.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
  gradient2.append('stop').attr('offset', '100%').attr('stop-color', '#92400e');

  const gradient3 = defs.append('radialGradient').attr('id', 'nodeGrad-C');
  gradient3.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e');
  gradient3.append('stop').attr('offset', '100%').attr('stop-color', '#166534');

  // Arrow marker
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 28).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'rgba(238,185,2,0.6)');

  // Background
  svg.append('rect')
    .attr('width', width).attr('height', height)
    .attr('fill', 'transparent');

  // Title
  svg.append('text')
    .attr('x', 16).attr('y', 28)
    .attr('fill', 'rgba(238,185,2,0.7)')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .attr('font-family', 'Inter, sans-serif')
    .text('⬡ Criminal Association Network — UP CDIMS');

  // Legend
  const legendData = [
    { label: 'Cat A (High Risk)', color: '#ef4444' },
    { label: 'Cat B (Medium)', color: '#f59e0b' },
    { label: 'Cat C (Low)', color: '#22c55e' }
  ];
  const legend = svg.append('g').attr('transform', `translate(${width - 180}, 16)`);
  legendData.forEach((l, i) => {
    legend.append('circle').attr('cx', 6).attr('cy', 14 + i * 20).attr('r', 6).attr('fill', l.color).attr('opacity', 0.85);
    legend.append('text').attr('x', 18).attr('y', 18 + i * 20)
      .attr('fill', 'rgba(255,255,255,0.7)').attr('font-size', '11px')
      .attr('font-family', 'Inter, sans-serif').text(l.label);
  });

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(uniqueLinks).id(d => d.id).distance(130))
    .force('charge', d3.forceManyBody().strength(-350))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40));

  // Links
  const link = svg.append('g')
    .selectAll('.link')
    .data(uniqueLinks)
    .enter().append('line')
    .attr('class', 'link')
    .attr('stroke', 'rgba(238,185,2,0.4)')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrow)');

  // Link labels
  const linkLabel = svg.append('g')
    .selectAll('.link-label')
    .data(uniqueLinks)
    .enter().append('text')
    .attr('fill', 'rgba(255,255,255,0.4)')
    .attr('font-size', '9px')
    .attr('font-family', 'Inter, sans-serif')
    .attr('text-anchor', 'middle')
    .text(d => d.relation.split('/')[0].trim());

  // Node groups
  const node = svg.append('g')
    .selectAll('.node')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded))
    .on('click', (event, d) => {
      event.stopPropagation();
      // Show dossier modal
      const dossier = getDossiers().find(dos => dos.id === d.id);
      if (dossier) openDossierModal(dossier);
    })
    .on('mouseover', function(event, d) {
      d3.select(this).select('circle').attr('stroke-width', 4);
    })
    .on('mouseout', function(event, d) {
      d3.select(this).select('circle').attr('stroke-width', 2.5);
    });

  // Node circles
  node.append('circle')
    .attr('r', d => {
      if (d.risk >= 70) return 22;
      if (d.risk >= 40) return 18;
      return 14;
    })
    .attr('fill', d => {
      if (d.category.includes('Category A')) return 'url(#nodeGrad-A)';
      if (d.category.includes('Category B')) return 'url(#nodeGrad-B)';
      return 'url(#nodeGrad-C)';
    })
    .attr('stroke', d => {
      if (d.status === 'Wanted') return '#ef4444';
      if (d.status === 'In Jail') return '#8b5cf6';
      return 'rgba(238,185,2,0.6)';
    })
    .attr('stroke-width', 2.5);

  // Risk pulse for wanted criminals
  node.filter(d => d.status === 'Wanted').append('circle')
    .attr('r', d => d.risk >= 70 ? 28 : 22)
    .attr('fill', 'none')
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 1)
    .attr('opacity', 0.4)
    .style('animation', 'pulse-ring 2s ease-out infinite');

  // Node labels
  node.append('text')
    .attr('dy', d => (d.risk >= 70 ? 32 : 26))
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255,255,255,0.9)')
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .attr('font-family', 'Inter, sans-serif')
    .text(d => d.name.split(' ')[0]);

  // Risk score badge
  node.append('text')
    .attr('dy', 4)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '10px')
    .attr('font-weight', '800')
    .attr('font-family', 'Inter, sans-serif')
    .text(d => d.risk);

  // Simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    linkLabel
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2);

    node.attr('transform', d => `translate(${Math.max(30, Math.min(width - 30, d.x))}, ${Math.max(30, Math.min(height - 30, d.y))})`);
  });

  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x; d.fy = event.y;
  }
  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
  }
};
