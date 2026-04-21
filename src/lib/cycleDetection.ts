import type { Dependency } from '../types/outcome';

// Returns true if adding edge from->to would create a cycle
export function wouldCreateCycle(
  dependencies: Dependency[],
  fromId: string,
  toId: string
): boolean {
  // If from === to, immediate cycle
  if (fromId === toId) return true;

  // Build adjacency list: for each node, which nodes does it point to (as 'from')
  // An edge from->to means: to depends on from
  // We need to check: starting from 'toId', can we reach 'fromId'?
  // If yes, adding from->to creates a cycle
  const adj: Map<string, string[]> = new Map();
  for (const dep of dependencies) {
    if (!adj.has(dep.from_outcome_id)) adj.set(dep.from_outcome_id, []);
    adj.get(dep.from_outcome_id)!.push(dep.to_outcome_id);
  }

  // DFS from toId - can we reach fromId?
  const visited = new Set<string>();
  const stack = [toId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === fromId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = adj.get(current) || [];
    for (const n of neighbors) {
      stack.push(n);
    }
  }
  return false;
}
