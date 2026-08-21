import {
    QuestGraph,
    TargetEngine,
    ExportResponse,
    DialogueNodeData,
    ConditionNodeData,
    ActionNodeData,
} from '@questcraft/shared-types';

export class GraphSerializer {
    /**
     * Optimized JSON for Game Engines
     */
    public static toGameEngineJSON(graph: QuestGraph): string {
        const payload = {
            meta: {
                schema_version: '1.0',
                title: graph.title,
                exported_at: new Date().toISOString(),
            },
            initial_node_id: graph.rootNodeId || graph.nodes[0]?.id,
            nodes: (graph.nodes || []).reduce((acc, node) => {
                const outEdges = (graph.edges || []).filter((e) => e.source === node.id);
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

    public static exportCode(
        graph: QuestGraph,
        target: TargetEngine,
        namespace = 'QuestCraft'
    ): ExportResponse {
        if (target === 'unity_csharp') {
            const code = this.toUnityCSharp(graph, namespace);
            const fileName = `${this.sanitizeName(graph.title)}QuestData.cs`;
            return { fileName, targetEngine: target, code };
        } else if (target === 'godot_gdscript') {
            const code = this.toGodotGDScript(graph);
            const fileName = `${this.sanitizeName(graph.title).toLowerCase()}_quest.gd`;
            return { fileName, targetEngine: target, code };
        } else {
            const code = JSON.stringify(graph, null, 2);
            const fileName = `${this.sanitizeName(graph.title).toLowerCase()}_quest.json`;
            return { fileName, targetEngine: 'json', code };
        }
    }

    public static sanitizeName(name: string): string {
        if (!name) return 'MyQuest';
        const clean = name
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join('');
        return clean || 'MyQuest';
    }

    private static escapeCSharp(text: string): string {
        if (!text) return '';
        return String(text)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '');
    }

    public static toUnityCSharp(graph: QuestGraph, namespace = 'QuestCraft'): string {
        const className = `${this.sanitizeName(graph.title)}Quest`;
        const rootId = graph.rootNodeId || (graph.nodes?.[0]?.id ?? 'root');
        const nodeInitializers: string[] = [];

        for (const node of graph.nodes || []) {
            const nId = this.escapeCSharp(node.id);
            const nType = (node.type || '').toLowerCase();
            const data = (node.data || {}) as any;
            const label = this.escapeCSharp(data.label || nId);

            // 1. Dialogue Node
            if (nType.includes('dialogue') || nType === 'root') {
                const speaker = this.escapeCSharp(data.speakerName || 'Narrator');
                const message = this.escapeCSharp(data.messageText || '');
                const options = (data.options || []) as Array<{ id?: string; text?: string }>;

                const optInits = options.map((opt) => {
                    const optId = opt.id || '';
                    const optText = this.escapeCSharp(opt.text || '');

                    // Find target edge
                    let targetEdge = graph.edges?.find(
                        (e) => e.source === node.id && e.sourceHandle === optId
                    );
                    if (!targetEdge) {
                        targetEdge = graph.edges?.find((e) => e.source === node.id);
                    }
                    const targetId = targetEdge ? this.escapeCSharp(targetEdge.target) : '';

                    return `                    new DialogueOption { optionId = "${optId}", text = "${optText}", targetNodeId = "${targetId}" }`;
                });

                const optBlock = optInits.join(',\n');
                const nodeCode = `            // --- Dialogue Node: ${label} ---
            var node_${this.sanitizeName(node.id)} = new QuestNode
            {
                id = "${nId}",
                nodeType = QuestNodeType.Dialogue,
                label = "${label}",
                speakerName = "${speaker}",
                messageText = "${message}",
                options = new List<DialogueOption>
                {
${optBlock}
                }
            };
            nodes.Add(node_${this.sanitizeName(node.id)});`;
                nodeInitializers.push(nodeCode);
            }
            // 2. Condition Node
            else if (nType.includes('condition')) {
                const rules = data.rules || [{}];
                const rule = rules[0] || {};
                const varKey = this.escapeCSharp(rule.variableKey || 'inventory.gold');
                const op = this.escapeCSharp(rule.operator || '>=');
                const val = this.escapeCSharp(String(rule.value ?? '50'));

                const trueEdge = graph.edges?.find(
                    (e) => e.source === node.id && e.sourceHandle === 'true'
                );
                const falseEdge = graph.edges?.find(
                    (e) => e.source === node.id && e.sourceHandle === 'false'
                );

                const trueTarget = trueEdge ? this.escapeCSharp(trueEdge.target) : '';
                const falseTarget = falseEdge ? this.escapeCSharp(falseEdge.target) : '';

                const nodeCode = `            // --- Condition Node: ${label} ---
            var node_${this.sanitizeName(node.id)} = new QuestNode
            {
                id = "${nId}",
                nodeType = QuestNodeType.Condition,
                label = "${label}",
                condition = new ConditionRule
                {
                    variableKey = "${varKey}",
                    op = "${op}",
                    compareValue = "${val}",
                    trueTargetNodeId = "${trueTarget}",
                    falseTargetNodeId = "${falseTarget}"
                }
            };
            nodes.Add(node_${this.sanitizeName(node.id)});`;
                nodeInitializers.push(nodeCode);
            }
            // 3. Action Node
            else if (nType.includes('action')) {
                const actions = data.actions || [{}];
                const act = actions[0] || {};
                const actType = this.escapeCSharp(act.type || 'give_item');
                const targetKey = this.escapeCSharp(act.targetKey || 'gold');
                const val = this.escapeCSharp(String(act.value ?? '50'));

                const nextEdge = graph.edges?.find((e) => e.source === node.id);
                const nextTarget = nextEdge ? this.escapeCSharp(nextEdge.target) : '';

                const nodeCode = `            // --- Action Node: ${label} ---
            var node_${this.sanitizeName(node.id)} = new QuestNode
            {
                id = "${nId}",
                nodeType = QuestNodeType.Action,
                label = "${label}",
                actions = new List<ActionPayload>
                {
                    new ActionPayload
                    {
                        actionType = "${actType}",
                        targetKey = "${targetKey}",
                        value = "${val}",
                        nextNodeId = "${nextTarget}"
                    }
                }
            };
            nodes.Add(node_${this.sanitizeName(node.id)});`;
                nodeInitializers.push(nodeCode);
            }
        }

        const allNodesCode = nodeInitializers.join('\n\n');

        return `// Generated by QuestCraft Studio for Unity 2022+ / Unity 6
// Architecture: ScriptableObject Graph Asset with O(1) Fast Node Lookup

using System;
using System.Collections.Generic;
using UnityEngine;

namespace ${namespace}
{
    public enum QuestNodeType
    {
        Dialogue,
        Condition,
        Action
    }

    [Serializable]
    public class DialogueOption
    {
        public string optionId;
        public string text;
        public string targetNodeId;
    }

    [Serializable]
    public class ConditionRule
    {
        public string variableKey;
        public string op;
        public string compareValue;
        public string trueTargetNodeId;
        public string falseTargetNodeId;
    }

    [Serializable]
    public class ActionPayload
    {
        public string actionType;
        public string targetKey;
        public string value;
        public string nextNodeId;
    }

    [Serializable]
    public class QuestNode
    {
        public string id;
        public QuestNodeType nodeType;
        public string label;

        [Header("Dialogue Payload")]
        public string speakerName;
        [TextArea(2, 5)] public string messageText;
        public List<DialogueOption> options = new List<DialogueOption>();

        [Header("Condition Payload")]
        public ConditionRule condition;

        [Header("Action Payload")]
        public List<ActionPayload> actions = new List<ActionPayload>();
    }

    [CreateAssetMenu(fileName = "${className}", menuName = "QuestCraft/Quests/${className}")]
    public class ${className} : ScriptableObject
    {
        [Header("Quest Metadata")]
        public string questId = "${this.escapeCSharp(graph.id)}";
        public string questTitle = "${this.escapeCSharp(graph.title)}";
        public string rootNodeId = "${this.escapeCSharp(rootId)}";

        [Space(10)]
        [SerializeField]
        public List<QuestNode> nodes = new List<QuestNode>();

        private Dictionary<string, QuestNode> _lookup;

        private void OnEnable()
        {
            BuildLookup();
        }

        public void BuildLookup()
        {
            _lookup = new Dictionary<string, QuestNode>();
            if (nodes == null) return;

            foreach (var node in nodes)
            {
                if (!string.IsNullOrEmpty(node.id) && !_lookup.ContainsKey(node.id))
                {
                    _lookup.Add(node.id, node);
                }
            }
        }

        public QuestNode GetNode(string nodeId)
        {
            if (_lookup == null || _lookup.Count == 0) BuildLookup();
            if (string.IsNullOrEmpty(nodeId)) return null;

            _lookup.TryGetValue(nodeId, out var node);
            return node;
        }

        public QuestNode GetRootNode()
        {
            return GetNode(rootNodeId);
        }

        /// <summary>
        /// Populates the ScriptableObject with pre-baked data from QuestCraft Web Editor
        /// </summary>
        [ContextMenu("Load Pre-baked Graph Data")]
        public void LoadDefaultGraphData()
        {
            nodes = new List<QuestNode>();

${allNodesCode}

            BuildLookup();
            Debug.Log($"[{className}] Successfully loaded {nodes.Count} nodes from QuestCraft export.");
        }

        private void Reset()
        {
            LoadDefaultGraphData();
        }
    }
}
`;
    }

    public static toGodotGDScript(graph: QuestGraph): string {
        const nodesDict: Record<string, any> = {};
        for (const n of graph.nodes || []) {
            const outEdges = (graph.edges || []).filter((e) => e.source === n.id);
            nodesDict[n.id] = {
                type: n.type,
                data: n.data,
                transitions: outEdges.map((e) => ({
                    handle: e.sourceHandle || 'default',
                    target: e.target,
                })),
            };
        }

        const className = `${this.sanitizeName(graph.title)}Quest`;
        const rootId = graph.rootNodeId || graph.nodes?.[0]?.id || '';

        return `# Generated by QuestCraft Studio for Godot 4.x
class_name ${className}
extends Resource

@export var quest_id: String = "${this.escapeCSharp(graph.id)}"
@export var title: String = "${this.escapeCSharp(graph.title)}"
@export var root_node_id: String = "${this.escapeCSharp(rootId)}"

const GRAPH_DATA = ${JSON.stringify(nodesDict, null, 4)}

func get_node_data(node_id: String) -> Dictionary:
    return GRAPH_DATA.get(node_id, {})
`;
    }
}