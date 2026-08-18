import { QuestGraph, GraphValidationResult, GraphValidationError } from '@questcraft/shared-types';

export class GraphValidator {
    public static validate(graph: QuestGraph): GraphValidationResult {
        const errors: GraphValidationError[] = [];

        if (!graph.nodes || graph.nodes.length === 0) {
            errors.push({
                severity: 'error',
                code: 'EMPTY_ROOT',
                message: 'Graph contains no nodes.',
            });
            return { isValid: false, errors };
        }

        // 1. Check that Root node exists
        const rootNode = graph.nodes.find((n) => n?.id === graph.rootNodeId) || graph.nodes[0];
        if (!rootNode) {
            errors.push({
                severity: 'error',
                code: 'EMPTY_ROOT',
                message: 'Root node is not defined.',
            });
        }

        // 2. Check for unreachable nodes (DFS)
        const reachableNodes = new Set<string>();
        if (rootNode) {
            const stack = [rootNode.id];
            reachableNodes.add(rootNode.id);

            while (stack.length > 0) {
                const curr = stack.pop()!;
                const targets = graph.edges.filter((e) => e.source === curr).map((e) => e.target);

                for (const targetId of targets) {
                    if (!reachableNodes.has(targetId)) {
                        reachableNodes.add(targetId);
                        stack.push(targetId);
                    }
                }
            }
        }

        for (const node of graph.nodes) {
            if (node && !reachableNodes.has(node.id)) {
                errors.push({
                    nodeId: node.id,
                    severity: 'warning',
                    code: 'UNREACHABLE_NODE',
                    message: `Node "${node.id}" cannot be reached from root.`,
                });
            }
        }

        // 3. Check for dangling edges
        const nodeIds = new Set(graph.nodes.filter(Boolean).map((n) => n.id));
        for (const edge of graph.edges) {
            if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
                errors.push({
                    edgeId: edge.id,
                    severity: 'error',
                    code: 'DANGLING_EDGE',
                    message: `Edge connects to a non-existent node (${edge.source} -> ${edge.target}).`,
                });
            }
        }

        return {
            isValid: errors.filter((e) => e.severity === 'error').length === 0,
            errors,
        };
    }
}