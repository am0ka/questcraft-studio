import { QuestGraph } from '@questcraft/shared-types';

export class GraphSerializer {
    /**
     * Optimized JSON for Godot 4 / Unity
     */
    public static toGameEngineJSON(graph: QuestGraph): string {
        const payload = {
            meta: {
                schema_version: '1.0',
                title: graph.title,
                exported_at: new Date().toISOString(),
            },
            initial_node_id: graph.rootNodeId || graph.nodes[0]?.id,
            nodes: graph.nodes.reduce((acc, node) => {
                const outEdges = graph.edges.filter((e) => e.source === node.id);
                acc[node.id] = {
                    type: node.type,
                    data: node.data,
                    transitions: outEdges.map((e) => ({
                        handle: e.sourceHandle || 'default',
                        target: e.target,
                    })),
                };
                return acc;
            }, {} as Record<string, any>),
        };

        return JSON.stringify(payload, null, 2);
    }
}