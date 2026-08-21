import { QuestGraph, GraphValidationResult, GraphValidationError, DialogueNodeData, AnyNodeData } from '@/types';

export class GraphValidator {
    public static validate(graph: QuestGraph): GraphValidationResult {
        const errors: GraphValidationError[] = [];
        const nodes = (graph.nodes || []).filter(Boolean);
        const edges = (graph.edges || []).filter(Boolean);

        if (nodes.length === 0) {
            errors.push({
                severity: 'error',
                code: 'EMPTY_GRAPH',
                message: 'The graph does not contain any nodes.',
            });
            return {
                isValid: false,
                errors,
                nodesCount: 0,
                edgesCount: 0,
            };
        }

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const rootId = graph.rootNodeId || nodes[0]?.id;

        // 1. Checking starting node
        if (!rootId || !nodeMap.has(rootId)) {
            errors.push({
                severity: 'error',
                code: 'NO_ROOT_NODE',
                message: `Root node '${rootId}' is not found in the graph.`,
            });
        }

        // 2. Checking dangling edges
        for (const edge of edges) {
            if (!nodeMap.has(edge.source)) {
                errors.push({
                    edgeId: edge.id,
                    severity: 'error',
                    code: 'DANGLING_EDGE',
                    message: `Edge [${edge.id}] has non-existent source: ${edge.source}`,
                });
            }
            if (!nodeMap.has(edge.target)) {
                errors.push({
                    edgeId: edge.id,
                    severity: 'error',
                    code: 'DANGLING_EDGE',
                    message: `Edge [${edge.id}] has non-existent target: ${edge.target}`,
                });
            }
        }

        // Building adjacency list
        const adj = new Map<string, string[]>();
        for (const node of nodes) {
            adj.set(node.id, []);
        }
        for (const edge of edges) {
            if (adj.has(edge.source)) {
                adj.get(edge.source)!.push(edge.target);
            }
        }

        // 3. Checking node reachability from root
        if (rootId && nodeMap.has(rootId)) {
            const reachable = new Set<string>();
            const queue = [rootId];
            reachable.add(rootId);

            while (queue.length > 0) {
                const curr = queue.shift()!;
                for (const next of adj.get(curr) || []) {
                    if (!reachable.has(next) && nodeMap.has(next)) {
                        reachable.add(next);
                        queue.push(next);
                    }
                }
            }

            for (const node of nodes) {
                if (!reachable.has(node.id)) {
                    const label = (node.data as AnyNodeData)?.label || node.id;
                    errors.push({
                        nodeId: node.id,
                        severity: 'warning',
                        code: 'UNREACHABLE_NODE',
                        message: `Node [${label}] is unreachable from the starting point.`,
                    });
                }
            }
        }

        // 4. Finding cycles (DFS cycle detection)
        const cycles = this.findSimpleCycles(adj);
        for (const cycle of cycles) {
            const cycleLabels = cycle.map((id) => (nodeMap.get(id)?.data as AnyNodeData)?.label || id);
            errors.push({
                nodeId: cycle[0],
                severity: 'warning',
                code: 'DETECTED_CYCLE',
                message: `Found a cycle: ${cycleLabels.join(' -> ')}`,
            });
        }

        // 5. Checking dialogue nodes without response options
        for (const node of nodes) {
            if (node.type === 'dialogue' || node.type === ('dialogueNode' as string)) {
                const options = (node.data as DialogueNodeData)?.options;
                if (!options || options.length === 0) {
                    const speaker = (node.data as DialogueNodeData)?.speakerName || 'NPC';
                    errors.push({
                        nodeId: node.id,
                        severity: 'warning',
                        code: 'EMPTY_CHOICES',
                        message: `Dialogue [${speaker}] does not contain response options.`,
                    });
                }
            }
        }

        const hasErrors = errors.some((e) => e.severity === 'error');

        return {
            isValid: !hasErrors,
            nodesCount: nodes.length,
            edgesCount: edges.length,
            errors,
        };
    }

    /**
     * Find elementary directed cycles using DFS
     */
    private static findSimpleCycles(adj: Map<string, string[]>): string[][] {
        const cycles: string[][] = [];
        const visitedState = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
        const currentPath: string[] = [];
        const reportedCycles = new Set<string>();

        const dfs = (node: string) => {
            visitedState.set(node, 1);
            currentPath.push(node);

            const neighbors = adj.get(node) || [];
            for (const neighbor of neighbors) {
                const state = visitedState.get(neighbor) || 0;
                if (state === 1) {
                    // Cycle detected! Extract cycle from neighbor to end of currentPath
                    const cycleStartIndex = currentPath.indexOf(neighbor);
                    if (cycleStartIndex !== -1) {
                        const cycle = currentPath.slice(cycleStartIndex);
                        const cycleKey = [...cycle].sort().join(',');
                        if (!reportedCycles.has(cycleKey)) {
                            reportedCycles.add(cycleKey);
                            cycles.push([...cycle, neighbor]);
                        }
                    }
                } else if (state === 0) {
                    dfs(neighbor);
                }
            }

            currentPath.pop();
            visitedState.set(node, 2);
        };

        for (const node of adj.keys()) {
            if ((visitedState.get(node) || 0) === 0) {
                dfs(node);
            }
        }

        return cycles;
    }
}