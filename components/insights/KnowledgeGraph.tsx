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

export function KnowledgeGraph() {
  const { user } = useAuth();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drill-down state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // We need the raw entries to show drilldown details. We can just fetch them locally.
  const { data: entries } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : ''
  );

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
    const height = 500;
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

    // Setup zoom container
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 2.5])
      .filter((event: Event) => event.type === 'wheel')
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // D3 Data copies since forceSimulation mutates them
    const nodes: SimulationNode[] = data.nodes.map(d => ({ ...d }));
    const links: SimulationLink[] = data.edges.map(d => ({ ...d }));

    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimulationNode>().radius(d => Math.max(10, d.weight * 5 + 5)));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#a1a1aa') // muted-foreground equivalent
      .attr('stroke-opacity', d => Math.max(0.2, d.weight)) // Cosine similarity
      .attr('stroke-width', d => Math.max(1, d.weight * 3));

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
      .attr('class', 'cursor-pointer')
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
        // Find the original node to pass cleanly to state
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) setSelectedNode(originalNode);
      });

    node.append('circle')
      .attr('r', d => Math.max(8, Math.min(25, d.weight * 3 + 5)))
      .attr('fill', d => colorScale(d.type) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'hover:stroke-foreground/50');

    // Draw labels
    node.append('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('class', 'fill-foreground/80 pointer-events-none font-medium');

    simulation.on('tick', () => {
      nodes.forEach(clampNodePosition);

      link
        .attr('x1', d => typeof d.source === 'object' ? d.source.x ?? 0 : 0)
        .attr('y1', d => typeof d.source === 'object' ? d.source.y ?? 0 : 0)
        .attr('x2', d => typeof d.target === 'object' ? d.target.x ?? 0 : 0)
        .attr('y2', d => typeof d.target === 'object' ? d.target.y ?? 0 : 0);

      node
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data]);

  if (loading) {
    return <div className="animate-pulse h-[500px] bg-secondary/30 rounded-xl" />;
  }

  if (error) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-surface-2 rounded-xl border border-border/50 text-red-400">
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
          <div className="w-full h-[500px] flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-2xl mb-2">🌱</span>
            <p>Your mind map is growing. Write more entries to see the connections form.</p>
          </div>
        ) : (
          <svg className="w-full h-[500px]" />
        )}

        {/* Legend */}
        {data && data.nodes.length > 0 && (
          <div className="absolute top-6 left-6 bg-background/80 backdrop-blur border border-border/50 rounded-lg p-3 text-xs flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div>Themes</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>People</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>Concepts</div>
          </div>
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
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {entry.content.replace(/<[^>]+>/g, '')}
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
