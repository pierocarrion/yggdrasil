'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { JournalEntry } from '@/types/journal';
import type { GraphNode, GraphEdge, GraphData } from '@/lib/knowledgeGraph';
import { logKnowledgeGraphViewed } from '@/lib/analytics/client';
import Link from 'next/link';

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
    const svg = d3.select(containerRef.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();

    // Setup zoom container
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // D3 Data copies since forceSimulation mutates them
    const nodes = data.nodes.map(d => ({ ...d })) as (GraphNode & d3.SimulationNodeDatum)[];
    const links = data.edges.map(d => ({ ...d })) as (GraphEdge & d3.SimulationLinkDatum<GraphNode & d3.SimulationNodeDatum>)[];

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => Math.max(10, d.weight * 5 + 5)));

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
      .selectAll<SVGCircleElement, unknown>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => Math.max(8, Math.min(25, d.weight * 3 + 5)))
      .attr('fill', d => colorScale(d.type) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'cursor-pointer transition-all hover:stroke-foreground/50')
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        // Find the original node to pass cleanly to state
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) setSelectedNode(originalNode);
      });

    // Draw labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('class', 'fill-foreground/80 pointer-events-none font-medium');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
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
          <svg className="w-full h-[500px] cursor-grab active:cursor-grabbing" />
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
