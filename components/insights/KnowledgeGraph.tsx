'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { JournalEntry } from '@/types/journal';
import type { GraphNode, GraphEdge, GraphData } from '@/lib/knowledgeGraph';
import { logKnowledgeGraphViewed } from '@/lib/analytics/client';
import Link from 'next/link';

type SimulationNode = GraphNode & d3.SimulationNodeDatum;
type SimulationLink = Omit<GraphEdge, 'source' | 'target'> & d3.SimulationLinkDatum<SimulationNode>;

// Force Simulation Tuning Constants — Obsidian-like airy layout
const FORCE = {
  linkDistanceMin: 60,
  linkDistanceMax: 220,
  linkStrengthMultiplier: 0.6,
  chargeStrength: -120,
  chargeDistanceMax: 350,
  collidePadding: 8,
  centerGravity: 0.04
};

export function KnowledgeGraph() {
  const { user } = useAuth();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drill-down state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Hover/Popup state
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const currentTransform = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  
  const initialRender = useRef(true);
  const seenNodeIds = useRef(new Set<string>());
  const seenEdgeIds = useRef(new Set<string>());
  
  // We need the raw entries to show drilldown details. We can just fetch them locally.
  const { data: entries } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : ''
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHoveredNode(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/knowledge-graph', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          let errDetails = '';
          try {
            const errData = await res.json();
            errDetails = errData.details || errData.error || '';
          } catch (e) {}
          console.error('Backend Knowledge Graph Error:', errDetails);
          throw new Error('Failed to load knowledge graph');
        }
        const graphData: GraphData = await res.json();
        setData(graphData);
        logKnowledgeGraphViewed();
      } catch (err) {
        console.error(err);
        setError('Unable to load graph data.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [user]);

  // Render D3 Simulation
  useEffect(() => {
    if (!data || !containerRef.current) return;
    if (data.nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 600;
    const graphPadding = 36;
    const svg = d3.select(containerRef.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();

    const clampCoordinate = (value: number | undefined, min: number, max: number) => {
      const fallback = (min + max) / 2;
      const coordinate = value ?? fallback;
      return Math.max(min, Math.min(max, coordinate));
    };

    const clampNodePosition = (d: SimulationNode) => {
      const minX = Math.min(graphPadding, width / 2);
      const maxX = Math.max(width - graphPadding, width / 2);
      const minY = graphPadding;
      const maxY = height - graphPadding;
      const nextX = clampCoordinate(d.x, minX, maxX);
      const nextY = clampCoordinate(d.y, minY, maxY);

      if (nextX !== d.x) {
        d.x = nextX;
        d.vx = 0;
      }

      if (nextY !== d.y) {
        d.y = nextY;
        d.vy = 0;
      }

      if (d.fx !== undefined && d.fx !== null) {
        d.fx = clampCoordinate(d.fx, minX, maxX);
      }

      if (d.fy !== undefined && d.fy !== null) {
        d.fy = clampCoordinate(d.fy, minY, maxY);
      }
    };
    
    const isInitial = initialRender.current;
    if (isInitial) initialRender.current = false;
    
    const isNewNode = (d: any) => !isInitial && !seenNodeIds.current.has(d.id);
    const isNewEdge = (d: any) => {
      const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
      const targetId = typeof d.target === 'object' ? d.target.id : d.target;
      const edgeId = `${sourceId}-${targetId}`;
      return !isInitial && !seenEdgeIds.current.has(edgeId);
    };

    // Update sets
    data.nodes.forEach(n => seenNodeIds.current.add(n.id));
    data.edges.forEach(e => {
      const sourceId = typeof e.source === 'object' ? (e.source as any).id : e.source;
      const targetId = typeof e.target === 'object' ? (e.target as any).id : e.target;
      seenEdgeIds.current.add(`${sourceId}-${targetId}`);
    });

    // Setup zoom container
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((event: Event) => event.type === 'wheel')
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        currentTransform.current = event.transform;
        const scale = event.transform.k;
        
        // Hide labels when zoomed out
        const textOpacity = scale < 0.8 ? 0 : Math.min(1, (scale - 0.8) * 4);
        g.selectAll('.node-label').style('opacity', textOpacity);
        
        // Dim links when zoomed out to reduce visual noise
        const linkOpacity = scale < 0.6 ? 0.3 : Math.min(1, scale);
        g.selectAll('.node-link').style('opacity', linkOpacity);
      });

    svg.call(zoom);

    svg.on('click', (event) => {
      if (event.target.tagName === 'svg') {
        setHoveredNode(null);
      }
    });

    // D3 Data copies since forceSimulation mutates them
    const nodes: SimulationNode[] = data.nodes.map(d => ({ ...d }));
    const links: SimulationLink[] = data.edges.map(d => ({ ...d }));

    // Initialize node positions to prevent NaN from undefined starting coords
    nodes.forEach((n: any) => {
      if (n.x == null || isNaN(n.x)) n.x = width / 2 + (Math.random() - 0.5) * 100;
      if (n.y == null || isNaN(n.y)) n.y = height / 2 + (Math.random() - 0.5) * 100;
    });

    const simulation = d3.forceSimulation(nodes)
      .alphaDecay(0.03)
      .velocityDecay(0.4)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => {
          const weight = d.weight || 0;
          return FORCE.linkDistanceMax - (weight * (FORCE.linkDistanceMax - FORCE.linkDistanceMin));
        })
        .strength((d: any) => Math.max(0.1, (d.weight || 0)) * FORCE.linkStrengthMultiplier)
      )
      .force('charge', d3.forceManyBody()
        .strength(FORCE.chargeStrength)
        .distanceMax(FORCE.chargeDistanceMax)
      )
      .force('x', d3.forceX(width / 2).strength(FORCE.centerGravity))
      .force('y', d3.forceY(height / 2).strength(FORCE.centerGravity))
      .force('collide', d3.forceCollide().radius((d: any) => {
        const nodeRadius = Math.max(5, Math.min(18, (d.weight || 0) * 2.5 + 4));
        return nodeRadius + FORCE.collidePadding;
      }));

    // Draw links — thin, subtle purple lines like Obsidian
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', (d: any) => isNewEdge(d) ? 'node-link animate-in fade-in duration-1000' : 'node-link')
      .style('animation-fill-mode', 'both')
      .attr('stroke', (d: any) => d.weak ? 'rgba(123, 174, 138, 0.15)' : 'rgba(123, 174, 138, 0.35)')
      .attr('stroke-dasharray', (d: any) => d.weak ? '3,5' : 'none')
      .attr('stroke-width', (d: any) => d.weak ? 1 : 1.5);

    // Color scale by type
    const colorScale = d3.scaleOrdinal()
      .domain(['theme', 'person', 'concept', 'place', 'event'])
      .range(['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']);

    // Draw nodes
    const node = g.append('g')
      .selectAll<SVGGElement, SimulationNode>('g')
      .data(nodes)
      .join('g')
      .attr('data-graph-node', 'true')
      .attr('class', (d: any) => {
        let baseClass = 'cursor-pointer transition-all hover:opacity-80 focus:outline-none';
        return isNewNode(d) ? `${baseClass} animate-in zoom-in fade-in duration-1000` : baseClass;
      })
      .style('animation-fill-mode', 'both')
      .attr('tabindex', 0)
      .call(d3.drag<SVGGElement, SimulationNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          clampNodePosition(d);
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.x = event.x;
          d.y = event.y;
          clampNodePosition(d);
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.x = event.x;
          d.y = event.y;
          clampNodePosition(d);
          d.fx = d.x;
          d.fy = d.y;
          d.vx = 0;
          d.vy = 0;
        })
      )
      .on('click', (event, d) => {
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) {
          setSelectedNode(originalNode);
          const t = currentTransform.current;
          setHoveredNode({ node: originalNode, x: (d.x || 0) * t.k + t.x, y: (d.y || 0) * t.k + t.y });
        }
      })
      .on('mouseenter', (event, d) => {
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) {
          const t = currentTransform.current;
          setHoveredNode({ node: originalNode, x: (d.x || 0) * t.k + t.x, y: (d.y || 0) * t.k + t.y });
        }
        
        // Highlight connected nodes and edges
        const connectedNodeIds = new Set<string>();
        connectedNodeIds.add(d.id);
        
        link.attr('stroke-opacity', (l: any) => {
          if (l.source.id === d.id || l.target.id === d.id) {
            connectedNodeIds.add(l.source.id);
            connectedNodeIds.add(l.target.id);
            return 1;
          }
          return 0.1;
        })
        .attr('stroke', (l: any) => {
          if (l.source.id === d.id || l.target.id === d.id) return '#a855f7'; // Bright purple for highlight
          return l.weak ? 'rgba(167, 139, 250, 0.4)' : 'rgba(167, 139, 250, 0.8)';
        })
        .attr('stroke-width', (l: any) => {
          if (l.source.id === d.id || l.target.id === d.id) return 2.5;
          return l.weak ? 1 : 1.5;
        });

        node.attr('opacity', (n: any) => connectedNodeIds.has(n.id) ? 1 : 0.2);
              })
      .on('focus', (event, d) => {
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) {
          const t = currentTransform.current;
          setHoveredNode({ node: originalNode, x: (d.x || 0) * t.k + t.x, y: (d.y || 0) * t.k + t.y });
        }
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        // Restore styles
        link.attr('stroke-opacity', 1)
            .attr('stroke', (l: any) => l.weak ? 'rgba(167, 139, 250, 0.4)' : 'rgba(167, 139, 250, 0.8)')
            .attr('stroke-width', (l: any) => l.weak ? 1 : 1.5);
            
        node.attr('opacity', 1);
              })
      .on('blur', () => setHoveredNode(null));

    node.append('circle')
      .attr('r', d => Math.max(8, Math.min(25, d.weight * 3 + 5)))
      .attr('fill', d => colorScale(d.type) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'hover:stroke-foreground/50');

    // Draw labels
    node.append('text')
      .text(d => d.label)
      .attr('font-size', '9px')
      .attr('dx', (d: any) => Math.max(5, Math.min(18, d.weight * 2.5 + 4)) + 4)
      .attr('dy', 3)
      .attr('class', (d: any) => {
        const baseClass = 'node-label fill-foreground/70 pointer-events-none';
        return isNewNode(d) ? `${baseClass} animate-in fade-in duration-1000` : baseClass;
      })
      .style('animation-fill-mode', 'both')
      .style('opacity', 0.7);

    // Draw cluster labels
    const clusters = data.clusters || [];
    const clusterLabel = g.append('g')
      .selectAll('g')
      .data(clusters)
      .join('g')
      .attr('class', 'cluster-label pointer-events-none');
    
    clusterLabel.append('rect')
      .attr('fill', 'var(--color-surface-2)')
      .attr('fill-opacity', 0.9)
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 1)
      .attr('rx', 8)
      .attr('ry', 8);
      
    // Line 1
    clusterLabel.append('text')
      .text("This isn't the first time.")
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('y', -6)
      .attr('fill', 'var(--color-muted-foreground)')
      .attr('class', 'font-medium');

    // Line 2
    clusterLabel.append('text')
      .text(d => `${d.entryCount} entries · ${d.timeSpanStr}`)
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('y', 8)
      .attr('fill', 'var(--color-muted-foreground)')
      .attr('class', 'font-normal');

    clusterLabel.each(function() {
      // Find both text elements and the rect
      const texts = (this as SVGGElement).querySelectorAll('text');
      const rect = (this as SVGGElement).querySelector('rect');
      if (texts.length === 2 && rect) {
        // Get bounding box of the entire group of text elements
        const bbox1 = texts[0].getBBox();
        const bbox2 = texts[1].getBBox();
        
        const width = Math.max(bbox1.width, bbox2.width);
        const height = bbox1.height + bbox2.height + 4; // Add a little gap
        
        const paddingX = 12;
        const paddingY = 8;
        
        rect.setAttribute('width', String(width + paddingX * 2));
        rect.setAttribute('height', String(height + paddingY * 2));
        rect.setAttribute('x', String(-width / 2 - paddingX));
        rect.setAttribute('y', String(bbox1.y - paddingY));
      }
    });

    simulation.on('tick', () => {
      // Guard against NaN — if the simulation diverges, clamp to center
      nodes.forEach((n: any) => {
        if (isNaN(n.x)) n.x = width / 2;
        if (isNaN(n.y)) n.y = height / 2;
        clampNodePosition(n);
      });

      link
        .attr('x1', d => typeof d.source === 'object' ? d.source.x ?? 0 : 0)
        .attr('y1', d => typeof d.source === 'object' ? d.source.y ?? 0 : 0)
        .attr('x2', d => typeof d.target === 'object' ? d.target.x ?? 0 : 0)
        .attr('y2', d => typeof d.target === 'object' ? d.target.y ?? 0 : 0);

      node
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

      clusterLabel.attr('transform', d => {
        // Calculate centroid of the cluster's nodes
        const clusterNodes = nodes.filter(n => d.nodeIds.includes(n.id));
        if (clusterNodes.length === 0) return 'translate(0,0)';
        
        const sumX = clusterNodes.reduce((sum, n) => sum + (n.x || 0), 0);
        const sumY = clusterNodes.reduce((sum, n) => sum + (n.y || 0), 0);
        const cx = sumX / clusterNodes.length;
        // Position slightly above the centroid
        const cy = sumY / clusterNodes.length - 25;
        
        return `translate(${cx}, ${cy})`;
      });
    });

    return () => {
      simulation.stop();
    };
  }, [data]);

  if (loading) {
    return <div className="animate-pulse h-[600px] bg-secondary/30 rounded-xl" />;
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-surface-2 rounded-xl border border-border/50 text-red-400">
        {error}
      </div>
    );
  }

  const relatedEntries = selectedNode && entries 
    ? entries.filter(e => selectedNode.entryIds?.includes(e.id))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-display text-foreground mb-1">Knowledge Graph</h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            A living map of your mind. Explore semantic connections between the people, themes, and concepts that frequently appear in your journaling. Drag nodes to move them around, scroll to zoom, and click to drill down into specific patterns.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm overflow-hidden relative" ref={containerRef}>
        {!data || data.nodes.length === 0 ? (
          <div className="w-full h-[600px] flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-2xl mb-2">🌱</span>
            <p>Your mind map is growing. Write more entries to see the connections form.</p>
          </div>
        ) : (
          <svg className="w-full h-[600px] cursor-grab active:cursor-grabbing" />
        )}

        {/* Legend */}
        {data && data.nodes.length > 0 && (
          <div className="absolute top-6 left-6 bg-background/80 backdrop-blur border border-border/50 rounded-lg p-3 text-xs flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div>Themes</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>People</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>Concepts</div>
          </div>
        )}

        {/* Hover Popover */}
        {hoveredNode && entries && (
          <NodePopover 
            node={hoveredNode.node} 
            x={hoveredNode.x} 
            y={hoveredNode.y} 
            entries={entries} 
            containerRef={containerRef}
          />
        )}
      </div>

      {/* Drill-down panel */}
      {selectedNode && (
        <div className="bg-surface-2 border border-border/40 rounded-xl p-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6 border-b border-border/40 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{selectedNode.type}</span>
              <h4 className="text-2xl font-display text-foreground mt-1 capitalize">
                {selectedNode.label}
              </h4>
            </div>
            <span className="text-sm font-medium text-foreground bg-background border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
              {relatedEntries.length} Mentions
            </span>
          </div>

          {relatedEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {relatedEntries.map(entry => (
                <Link 
                  key={entry.id} 
                  href={`/journal/${entry.id}`}
                  className="block p-4 rounded-xl bg-background border border-border/40 hover:border-gold/40 hover:bg-gold/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-foreground group-hover:text-gold transition-colors">{entry.title || 'Untitled Entry'}</h5>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {getRelevantSnippet(entry.content, selectedNode.label)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 text-muted-foreground text-sm">
               No accessible entries found for this node.
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function NodePopover({ node, x, y, entries, containerRef }: { node: GraphNode, x: number, y: number, entries: JournalEntry[], containerRef: React.RefObject<HTMLDivElement | null> }) {
  const relatedEntries = entries
    .filter(e => node.entryIds.includes(e.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const entry = relatedEntries[0];
  if (!entry) return null;

  const dateStr = new Date(entry.entryDate || entry.createdAt).toLocaleDateString();
  const snippet = getRelevantSnippet(entry.content, node.label);

  const containerWidth = containerRef.current?.clientWidth || 800;
  const containerHeight = 500;
  
  const cardWidth = 280;
  const cardHeight = 120; // approximate
  
  // Boundary check
  let left = x + 20;
  let top = y + 20;
  
  if (left + cardWidth > containerWidth) {
    left = x - cardWidth - 20;
  }
  if (top + cardHeight > containerHeight) {
    top = y - cardHeight - 20;
  }

  return (
    <div 
      className="absolute bg-background/95 backdrop-blur border border-border/50 rounded-xl p-4 shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200"
      style={{ left, top, width: cardWidth, zIndex: 50 }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{node.type}</span>
        <span className="text-[10px] text-muted-foreground">{dateStr}</span>
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1 capitalize leading-tight">{node.label}</h4>
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{snippet}</p>
      
      {relatedEntries.length >= 3 ? (() => {
        const sortedDates = relatedEntries.map(e => e.entryDate || e.createdAt).sort((a, b) => a - b);
        const earliest = new Date(sortedDates[0]);
        const latest = new Date(sortedDates[sortedDates.length - 1]);
        const diffDays = Math.max(1, Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)));
        
        let timeSpanStr = `${diffDays} days`;
        if (diffDays >= 30) {
          timeSpanStr = `${Math.round(diffDays / 30)} months`;
        } else if (diffDays >= 14) {
          timeSpanStr = `${Math.round(diffDays / 7)} weeks`;
        }

        return (
          <div className="mt-3 text-[10px] text-gold/90 bg-gold/5 border border-gold/20 rounded-md p-2 font-medium leading-relaxed flex items-start gap-1.5 shadow-[0_0_10px_rgba(212,175,55,0.05)]">
            <span className="text-xs">✨</span>
            <span>You&apos;ve been here before. You&apos;ve explored this {relatedEntries.length} times over {timeSpanStr}.</span>
          </div>
        );
      })() : relatedEntries.length > 1 ? (
        <div className="mt-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2 font-medium">
          + {relatedEntries.length - 1} other mentions
        </div>
      ) : null}
    </div>
  );
}

function getRelevantSnippet(htmlContent: string, keyword: string): React.ReactNode {
  const plainText = htmlContent.replace(/<[^>]+>/g, '');
  if (!keyword) return plainText.length > 120 ? plainText.slice(0, 120) + '...' : plainText;

  // Escape regex characters in the keyword and use word boundaries
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
  
  const match = plainText.match(regex);
  const index = match?.index;

  if (!match || index === undefined) {
    // If the exact word isn't found, fallback to just showing the beginning of the entry.
    return plainText.length > 120 ? plainText.slice(0, 120) + '...' : plainText;
  }

  // Try to extract the sentence containing the keyword
  let startIdx = index;
  while (startIdx > 0 && !['.', '!', '?'].includes(plainText[startIdx])) {
    startIdx--;
  }
  if (startIdx > 0) startIdx++; // skip the punctuation

  let endIdx = index + match[0].length;
  while (endIdx < plainText.length && !['.', '!', '?'].includes(plainText[endIdx])) {
    endIdx++;
  }
  if (endIdx < plainText.length) endIdx++; // include the punctuation

  let snippet = plainText.slice(startIdx, endIdx).trim();
  
  // Fallback to purely character-based if the sentence is insanely long
  if (snippet.length > 200) {
    const s = Math.max(0, index - 60);
    const e = Math.min(plainText.length, index + match[0].length + 60);
    snippet = plainText.slice(s, e).trim();
    return (
      <>
        {s > 0 && '...'}
        {snippet.substring(0, index - s)}
        <strong className="text-foreground font-semibold">{plainText.substring(index, index + match[0].length)}</strong>
        {snippet.substring(index - s + match[0].length)}
        {e < plainText.length && '...'}
      </>
    );
  }

  // Highlight the keyword in the sentence
  const snippetMatch = snippet.match(regex);
  if (snippetMatch && snippetMatch.index !== undefined) {
    const keywordIdx = snippetMatch.index;
    return (
      <>
        {startIdx > 0 && '...'}
        {snippet.substring(0, keywordIdx)}
        <strong className="text-foreground font-semibold">{snippet.substring(keywordIdx, keywordIdx + snippetMatch[0].length)}</strong>
        {snippet.substring(keywordIdx + snippetMatch[0].length)}
        {endIdx < plainText.length && '...'}
      </>
    );
  }

  return startIdx > 0 ? '...' + snippet : snippet;
}
