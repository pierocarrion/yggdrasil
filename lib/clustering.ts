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
 * Normalizes a vector in-place or returns a new one.
 */
function normalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0) return a;
  return a.map(v => v / mag);
}

/**
 * Computes the cosine distance between two vectors.
 * Assumes both vectors are already normalized.
 */
function cosineDistance(a: number[], b: number[]): number {
  return 1 - dotProduct(a, b);
}

export interface ClusterResult<T> {
  centroid: number[];
  items: T[];
}

/**
 * Performs K-Means clustering on a set of items using Cosine Distance.
 * 
 * @param items Array of items to cluster
 * @param getVector Function to extract the numerical vector from an item
 * @param k Number of clusters
 * @param maxIterations Maximum number of iterations to run
 * @returns Array of clusters
 */
export function kMeans<T>(
  items: T[], 
  getVector: (item: T) => number[], 
  k: number, 
  maxIterations = 20
): ClusterResult<T>[] {
  if (items.length === 0) return [];
  if (k <= 0) return [];
  
  // 1. Normalize all vectors up-front to simplify distance calculation
  const normalizedItems = items.map(item => ({
    original: item,
    vec: normalize(getVector(item))
  }));

  // Ensure K does not exceed the number of unique items
  const actualK = Math.min(k, normalizedItems.length);

  // 2. Initialize centroids randomly from the dataset
  const centroids: number[][] = [];
  const initialIndices = new Set<number>();
  while (initialIndices.size < actualK) {
    initialIndices.add(Math.floor(Math.random() * normalizedItems.length));
  }
  initialIndices.forEach(idx => centroids.push([...normalizedItems[idx].vec]));

  const assignments: number[] = new Array(normalizedItems.length).fill(-1);
  let hasChanged = true;
  let iterations = 0;

  // 3. Iteration loop
  while (hasChanged && iterations < maxIterations) {
    hasChanged = false;
    iterations++;

    // Assignment step
    for (let i = 0; i < normalizedItems.length; i++) {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;

      for (let j = 0; j < centroids.length; j++) {
        const dist = cosineDistance(normalizedItems[i].vec, centroids[j]);
        if (dist < minDistance) {
          minDistance = dist;
          closestCentroidIndex = j;
        }
      }

      if (assignments[i] !== closestCentroidIndex) {
        assignments[i] = closestCentroidIndex;
        hasChanged = true;
      }
    }

    // Update step
    const newCentroids: number[][] = Array.from({ length: actualK }, () => 
      new Array(centroids[0].length).fill(0)
    );
    const counts = new Array(actualK).fill(0);

    for (let i = 0; i < normalizedItems.length; i++) {
      const clusterIdx = assignments[i];
      counts[clusterIdx]++;
      for (let d = 0; d < centroids[0].length; d++) {
        newCentroids[clusterIdx][d] += normalizedItems[i].vec[d];
      }
    }

    // Average and re-normalize new centroids
    for (let j = 0; j < actualK; j++) {
      if (counts[j] > 0) {
        for (let d = 0; d < centroids[0].length; d++) {
          newCentroids[j][d] /= counts[j];
        }
        centroids[j] = normalize(newCentroids[j]);
      } else {
        // If a cluster is empty, re-initialize it randomly to fix dead centroids
        const randomIdx = Math.floor(Math.random() * normalizedItems.length);
        centroids[j] = [...normalizedItems[randomIdx].vec];
      }
    }
  }

  // 4. Format results
  const results: ClusterResult<T>[] = centroids.map(centroid => ({
    centroid,
    items: []
  }));

  for (let i = 0; i < normalizedItems.length; i++) {
    results[assignments[i]].items.push(normalizedItems[i].original);
  }

  // Remove empty clusters if any exist despite re-initialization
  return results.filter(c => c.items.length > 0);
}
