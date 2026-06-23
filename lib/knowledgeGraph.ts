import type { JournalEntry, EntryAnalysis } from '@/types/journal';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  weight: number;
  entryIds: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Computes the dot product of two vectors.
 */
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes the magnitude (L2 norm) of a vector.
 */
function magnitude(a: number[]): number {
  return Math.sqrt(dotProduct(a, a));
}

/**
 * Normalizes a vector.
 */
function normalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0) return a;
  return a.map(v => v / mag);
}

/**
 * Computes the cosine similarity between two vectors.
 * Higher is more similar. Range [-1, 1], usually [0, 1] for embeddings.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const normA = normalize(a);
  const normB = normalize(b);
  return dotProduct(normA, normB);
}

/**
 * Builds a knowledge graph from a list of user entries.
 * Extracts nodes (themes, people, concepts) and computes semantic similarity edges
 * using the average embedding of the entries they appear in.
 * 
 * @param entries The user's entries, including analysis and embedding.
 * @param tier 'basic' (free) or 'full' (pro). Basic limits node count.
 */
export function buildKnowledgeGraph(entries: (JournalEntry & { analysis?: EntryAnalysis })[], tier: 'basic' | 'full' = 'full'): GraphData {
  const nodeMap = new Map<string, { label: string, type: string, weight: number, embeddings: number[][], entryIds: string[] }>();
  
  // 1. Extract nodes and accumulate embeddings
  entries.forEach(entry => {
    if (!entry.analysis) return;
    
    // Ensure embedding exists and is an array of numbers
    const entryEmbedding = Array.isArray(entry.embedding) ? entry.embedding : null;
    
    // Process themes
    if (Array.isArray(entry.analysis.themes)) {
      entry.analysis.themes.forEach(theme => {
        if (!theme || typeof theme !== 'string') return;
        const id = `theme_${theme.toLowerCase().replace(/\s+/g, '_')}`;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label: theme, type: 'theme', weight: 0, embeddings: [], entryIds: [] });
        }
        const node = nodeMap.get(id)!;
        node.weight++;
        if (!node.entryIds.includes(entry.id)) node.entryIds.push(entry.id);
        if (entryEmbedding) node.embeddings.push(entryEmbedding);
      });
    }
    
    // Process entities
    if (Array.isArray(entry.analysis.entities)) {
      entry.analysis.entities.forEach(entity => {
        if (!entity || typeof entity !== 'object' || !entity.name || typeof entity.name !== 'string') return;
        const type = entity.type || 'concept';
        const id = `entity_${type}_${entity.name.toLowerCase().replace(/\s+/g, '_')}`;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label: entity.name, type: type, weight: 0, embeddings: [], entryIds: [] });
        }
        const node = nodeMap.get(id)!;
        node.weight++;
        if (!node.entryIds.includes(entry.id)) node.entryIds.push(entry.id);
        if (entryEmbedding) node.embeddings.push(entryEmbedding);
      });
    }
  });
  
  // 2. Sort nodes by weight (frequency) and filter by tier
  const nodeEntries = Array.from(nodeMap.entries());
  nodeEntries.sort((a, b) => b[1].weight - a[1].weight);
  
  // Apply limits based on tier logic (temporary PRD handling)
  const maxNodes = tier === 'basic' ? 30 : 150;
  if (nodeEntries.length > maxNodes) {
    nodeEntries.splice(maxNodes);
  }
  
  // 3. Compute synthetic embedding for each node
  const nodesWithEmbeddings = nodeEntries.map(([id, data]) => {
    let avgVector: number[] | null = null;
    if (data.embeddings.length > 0) {
      const dims = data.embeddings[0].length;
      avgVector = new Array(dims).fill(0);
      for (const vec of data.embeddings) {
        for (let i = 0; i < dims; i++) {
          avgVector[i] += vec[i];
        }
      }
      for (let i = 0; i < dims; i++) {
        avgVector[i] /= data.embeddings.length;
      }
    }
    
    return {
      id,
      label: data.label,
      type: data.type,
      weight: data.weight,
      entryIds: data.entryIds,
      vector: avgVector
    };
  });
  
  // 4. Compute Edges based on cosine similarity
  const edges: GraphEdge[] = [];
  const nodes: GraphNode[] = nodesWithEmbeddings.map(n => ({ id: n.id, label: n.label, type: n.type, weight: n.weight, entryIds: n.entryIds }));
  
  // Only compute edges for nodes that successfully formed a vector
  const validNodes = nodesWithEmbeddings.filter(n => n.vector !== null);
  
  const SIMILARITY_THRESHOLD = 0.70; // Connect nodes that are semantically close
  
  for (let i = 0; i < validNodes.length; i++) {
    for (let j = i + 1; j < validNodes.length; j++) {
      const sim = cosineSimilarity(validNodes[i].vector!, validNodes[j].vector!);
      
      // If above threshold, add edge
      if (sim >= SIMILARITY_THRESHOLD) {
        edges.push({
          source: validNodes[i].id,
          target: validNodes[j].id,
          // Store actual similarity as weight (0.7 -> 1.0)
          weight: sim
        });
      }
    }
  }
  
  // 5. Clean up graph (remove orphaned nodes if strict filtering is desired, 
  // but keeping them might be fine for visualization as floating points)
  
  return { nodes, edges };
}
