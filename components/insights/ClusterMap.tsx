'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { JournalEntry, EntryAnalysis } from '@/types/journal';
import { kMeans, ClusterResult } from '@/lib/clustering';

interface ClusteredEntry extends JournalEntry {
  analysis?: EntryAnalysis;
}

interface ClusterNode extends d3.SimulationNodeDatum {
  id: string;
  clusterIndex: number;
  entry: ClusteredEntry;
  radius: number;
}

export function ClusterMap() {
  const { user } = useAuth();
  const { data: entries, loading: entriesLoading } = useFirestore<JournalEntry>(
    user ? `users/${user.uid}/entries` : '',
    orderBy('createdAt', 'desc')
  );

  const [analyses, setAnalyses] = useState<Record<string, EntryAnalysis>>({});
  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);
  const [selectedClusterIndex, setSelectedClusterIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Filter entries (include completed ones even if they lack embeddings yet)
  const validEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => e.analysisStatus === 'complete');
  }, [entries]);

  // 2. Fetch missing analyses for the filtered entries
  useEffect(() => {
    if (!user || validEntries.length === 0) return;

    const fetchMissing = async () => {
      setFetchingAnalysis(true);
      try {
        const missing = validEntries.filter(e => !analyses[e.id]);
        if (missing.length === 0) {
          setFetchingAnalysis(false);
          return;
        }

        const promises = missing.map(async (entry) => {
          const q = query(collection(db, `users/${user.uid}/entries/${entry.id}/analysis`), limit(1));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            return { entryId: entry.id, analysis: snapshot.docs[0].data() as EntryAnalysis };
          }
          return null;
        });

        const results = await Promise.all(promises);
        
        setAnalyses(prev => {
          const next = { ...prev };
          let changed = false;
          results.forEach(res => {
            if (res) {
              next[res.entryId] = res.analysis;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
      } finally {
        setFetchingAnalysis(false);
      }
    };

    fetchMissing();
  }, [validEntries, user, analyses]);

  // 3. Perform K-Means Clustering
  const clusters = useMemo(() => {
    if (validEntries.length === 0 || Object.keys(analyses).length < validEntries.length) return [];

    const enrichedEntries: ClusteredEntry[] = validEntries.map(e => ({
      ...e,
      analysis: analyses[e.id]
    }));

    // Dynamic K based on entry count (between 2 and 6)
    const k = Math.max(2, Math.min(6, Math.floor(Math.sqrt(enrichedEntries.length))));

    const result = kMeans(
      enrichedEntries,
      (entry) => {
        // Handle VectorValue from Firestore correctly (it has a toArray method)
        if (typeof entry.embedding?.toArray === 'function') {
          return entry.embedding.toArray();
        }
        if (Array.isArray(entry.embedding) && entry.embedding.length > 0) {
          return entry.embedding;
        }
        
        // Faux embedding for old entries that don't have embeddings yet
        // We use their themes to hash into a vector so similar themes cluster together
        const faux = new Array(768).fill(0);
        if (entry.analysis?.themes) {
          entry.analysis.themes.forEach(theme => {
            let hash = 0;
            for (let i = 0; i < theme.length; i++) hash = (hash << 5) - hash + theme.charCodeAt(i);
            faux[Math.abs(hash) % 768] = 1;
          });
        }
        return faux;
      },
      k
    );

    return result;
  }, [validEntries, analyses]);

  // 4. Derive cluster labels
  const clusterData = useMemo(() => {
    return clusters.map((cluster, i) => {
      const themeCounts = new Map<string, number>();
      
      cluster.items.forEach(item => {
        item.analysis?.themes?.forEach(theme => {
          themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
        });
      });

      const dominantTheme = Array.from(themeCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Uncategorized';

      return {
        ...cluster,
        index: i,
        label: dominantTheme
      };
    });
  }, [clusters]);

  // 5. D3 Visualization
  useEffect(() => {
    if (clusterData.length === 0 || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    const svg = d3.select(containerRef.current).select('svg');
    svg.selectAll('*').remove();

    // Prepare nodes
    const nodes: ClusterNode[] = [];
    clusterData.forEach((cluster) => {
      cluster.items.forEach(entry => {
        nodes.push({
          id: entry.id,
          clusterIndex: cluster.index,
          entry,
          radius: Math.max(6, Math.min(12, entry.wordCount / 50)) // size by word count
        });
      });
    });

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Calculate cluster centers manually to spread them out
    const numClusters = clusterData.length;
    const angleStep = (Math.PI * 2) / numClusters;
    const centerRadius = Math.min(width, height) * 0.25;

    const clusterCenters = Array.from({ length: numClusters }, (_, i) => ({
      x: width / 2 + Math.cos(i * angleStep) * centerRadius,
      y: height / 2 + Math.sin(i * angleStep) * centerRadius,
    }));

    const simulation = d3.forceSimulation<ClusterNode>(nodes)
      .force('x', d3.forceX<ClusterNode>(d => clusterCenters[d.clusterIndex].x).strength(0.1))
      .force('y', d3.forceY<ClusterNode>(d => clusterCenters[d.clusterIndex].y).strength(0.1))
      .force('collide', d3.forceCollide<ClusterNode>(d => d.radius + 2).iterations(4))
      .force('charge', d3.forceManyBody().strength(-5));

    // Draw cluster labels
    const labels = svg.append('g')
      .selectAll('text')
      .data(clusterData)
      .join('text')
      .attr('class', 'text-sm font-medium fill-muted-foreground transition-all')
      .attr('text-anchor', 'middle')
      .attr('style', 'pointer-events: none;')
      .text(d => d.label);

    const nodeElements = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => colorScale(d.clusterIndex.toString()))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('class', 'cursor-pointer transition-all hover:stroke-foreground/50')
      .on('click', (event, d) => {
        setSelectedClusterIndex(d.clusterIndex);
      });

    nodeElements.append('title')
      .text(d => d.entry.title || new Date(d.entry.createdAt).toLocaleDateString());

    simulation.on('tick', () => {
      nodeElements
        .attr('cx', d => Math.max(d.radius, Math.min(width - d.radius, d.x || 0)))
        .attr('cy', d => Math.max(d.radius, Math.min(height - d.radius, d.y || 0)));

      // Position labels near the cluster center of mass
      labels
        .attr('x', d => {
          const clusterNodes = nodes.filter(n => n.clusterIndex === d.index);
          if (!clusterNodes.length) return width / 2;
          return d3.mean(clusterNodes, n => n.x || 0)!;
        })
        .attr('y', d => {
          const clusterNodes = nodes.filter(n => n.clusterIndex === d.index);
          if (!clusterNodes.length) return height / 2;
          return d3.min(clusterNodes, n => n.y || 0)! - 20; // Above the cluster
        });
    });

    return () => {
      simulation.stop();
    };
  }, [clusterData, selectedClusterIndex]);

  if (entriesLoading) {
    return <div className="animate-pulse h-96 bg-secondary/30 rounded-xl" />;
  }

  const selectedCluster = selectedClusterIndex !== null ? clusterData[selectedClusterIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-display text-foreground mb-1">Semantic Cluster Map</h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            This map clusters your entries automatically based on their underlying semantic meaning using AI embeddings. 
            Bubbles that group together share deeper thematic similarities. Explore these clusters to uncover recurring 
            patterns or hidden connections in your thoughts that you might not have explicitly tagged.
          </p>
        </div>
        {fetchingAnalysis && <span className="text-xs text-muted-foreground animate-pulse">Loading vectors...</span>}
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm overflow-hidden" ref={containerRef}>
        {clusterData.length > 0 ? (
          <svg className="w-full h-[400px]" />
        ) : (
          <div className="w-full h-[400px] flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-2xl mb-2">✨</span>
            <p>Write more entries to see your semantic clusters form.</p>
          </div>
        )}
      </div>

      {selectedCluster && (
        <div className="bg-surface-2 border border-border/40 rounded-xl p-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-display text-foreground">
              Theme: <span className="text-primary">{selectedCluster.label}</span>
            </h4>
            <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-md">
              {selectedCluster.items.length} Entries
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {selectedCluster.items.map(entry => (
              <a 
                key={entry.id} 
                href={`/journal/${entry.id}`}
                className="block p-4 rounded-lg bg-background border border-border/40 hover:border-primary/40 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-foreground">{entry.title || 'Untitled Entry'}</h5>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {entry.analysis?.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.analysis.summary}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.analysis?.themes?.slice(0, 3).map((theme, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground">
                      {theme}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
