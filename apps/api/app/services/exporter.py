import json
import random
from typing import Dict, Any, List
from app.schemas.graph import ExportRequest, ExportResponse

class CodeGeneratorService:
    @classmethod
    def export(cls, req: ExportRequest) -> ExportResponse:
        target = req.targetEngine
        graph = req.graph

        if target == "unity_csharp":
            code = cls._to_unity_csharp(graph, req.namespace or "QuestCraft")
            filename = f"{cls._sanitize_name(graph.title)}QuestData.cs"
        elif target == "godot_gdscript":
            code = cls._to_godot_gdscript(graph)
            filename = f"{cls._sanitize_name(graph.title).lower()}_quest.gd"
        else:
            code = cls._to_compact_json(graph)
            filename = f"{cls._sanitize_name(graph.title).lower()}_quest.json"

        return ExportResponse(
            fileName=filename,
            targetEngine=target,
            code=code
        )

    @staticmethod
    def _sanitize_name(name: str) -> str:
        clean = "".join(c for c in name.title() if c.isalnum())
        return clean or "MyQuest"

    @staticmethod
    def _escape_csharp(text: str) -> str:
        if not text:
            return ""
        return text.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '')

    @classmethod
    def _to_unity_csharp(cls, graph, namespace: str) -> str:
        class_name = f"{cls._sanitize_name(graph.title)}Quest"
        root_id = graph.rootNodeId or (graph.nodes[0].id if graph.nodes else "root")

        # Generate C# node initialization code
        node_initializers: List[str] = []

        for node in graph.nodes:
            n_id = cls._escape_csharp(node.id)
            n_type = node.type
            data = node.data or {}
            label = cls._escape_csharp(data.get("label", n_id))

            # 1. Dialogue Node
            if "dialogue" in n_type.lower() or n_type == "root":
                speaker = cls._escape_csharp(data.get("speakerName", "Narrator"))
                message = cls._escape_csharp(data.get("messageText", ""))
                options = data.get("options", [])

                opt_inits = []
                for opt in options:
                    opt_id = opt.get("id", "")
                    opt_text = cls._escape_csharp(opt.get("text", ""))

                    # Find the target node via edge lookup
                    target_edge = next((e for e in graph.edges if e.source == node.id and e.sourceHandle == opt_id), None)
                    if not target_edge:
                        target_edge = next((e for e in graph.edges if e.source == node.id), None)
                    
                    target_id = cls._escape_csharp(target_edge.target) if target_edge else ""

                    opt_inits.append(
                        f'                    new DialogueOption {{ optionId = "{opt_id}", text = "{opt_text}", targetNodeId = "{target_id}" }}'
                    )

                opt_block = ",\n".join(opt_inits)
                node_code = f"""            // --- Dialogue Node: {label} ---
            var node_{cls._sanitize_name(node.id)} = new QuestNode
            {{
                id = "{n_id}",
                nodeType = QuestNodeType.Dialogue,
                label = "{label}",
                speakerName = "{speaker}",
                messageText = "{message}",
                options = new List<DialogueOption>
                {{
{opt_block}
                }}
            }};
            nodes.Add(node_{cls._sanitize_name(node.id)});"""
                node_initializers.append(node_code)

            # 2. Condition Node
            elif "condition" in n_type.lower():
                rules = data.get("rules", [{}])
                rule = rules[0] if rules else {}
                var_key = cls._escape_csharp(rule.get("variableKey", "inventory.gold"))
                op = cls._escape_csharp(rule.get("operator", ">="))
                val = cls._escape_csharp(str(rule.get("value", "50")))

                true_edge = next((e for e in graph.edges if e.source == node.id and e.sourceHandle == "true"), None)
                false_edge = next((e for e in graph.edges if e.source == node.id and e.sourceHandle == "false"), None)

                true_target = cls._escape_csharp(true_edge.target) if true_edge else ""
                false_target = cls._escape_csharp(false_edge.target) if false_edge else ""

                node_code = f"""            // --- Condition Node: {label} ---
            var node_{cls._sanitize_name(node.id)} = new QuestNode
            {{
                id = "{n_id}",
                nodeType = QuestNodeType.Condition,
                label = "{label}",
                condition = new ConditionRule
                {{
                    variableKey = "{var_key}",
                    op = "{op}",
                    compareValue = "{val}",
                    trueTargetNodeId = "{true_target}",
                    falseTargetNodeId = "{false_target}"
                }}
            }};
            nodes.Add(node_{cls._sanitize_name(node.id)});"""
                node_initializers.append(node_code)

            # 3. Action Node
            elif "action" in n_type.lower():
                actions = data.get("actions", [{}])
                act = actions[0] if actions else {}
                act_type = cls._escape_csharp(act.get("type", "give_item"))
                target_key = cls._escape_csharp(act.get("targetKey", "gold"))
                val = cls._escape_csharp(str(act.get("value", "50")))

                next_edge = next((e for e in graph.edges if e.source == node.id), None)
                next_target = cls._escape_csharp(next_edge.target) if next_edge else ""

                node_code = f"""            // --- Action Node: {label} ---
            var node_{cls._sanitize_name(node.id)} = new QuestNode
            {{
                id = "{n_id}",
                nodeType = QuestNodeType.Action,
                label = "{label}",
                actions = new List<ActionPayload>
                {{
                    new ActionPayload
                    {{
                        actionType = "{act_type}",
                        targetKey = "{target_key}",
                        value = "{val}",
                        nextNodeId = "{next_target}"
                    }}
                }}
            }};
            nodes.Add(node_{cls._sanitize_name(node.id)});"""
                node_initializers.append(node_code)

        all_nodes_code = "\n\n".join(node_initializers)

        csharp_template = f"""// Generated by QuestCraft Studio for Unity 2022+ / Unity 6
// Architecture: ScriptableObject Graph Asset with O(1) Fast Node Lookup

using System;
using System.Collections.Generic;
using UnityEngine;

namespace {namespace}
{{
    public enum QuestNodeType
    {{
        Dialogue,
        Condition,
        Action
    }}

    [Serializable]
    public class DialogueOption
    {{
        public string optionId;
        public string text;
        public string targetNodeId;
    }}

    [Serializable]
    public class ConditionRule
    {{
        public string variableKey;
        public string op;
        public string compareValue;
        public string trueTargetNodeId;
        public string falseTargetNodeId;
    }}

    [Serializable]
    public class ActionPayload
    {{
        public string actionType;
        public string targetKey;
        public string value;
        public string nextNodeId;
    }}

    [Serializable]
    public class QuestNode
    {{
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
    }}

    [CreateAssetMenu(fileName = "{class_name}", menuName = "QuestCraft/Quests/{class_name}")]
    public class {class_name} : ScriptableObject
    {{
        [Header("Quest Metadata")]
        public string questId = "{graph.id}";
        public string questTitle = "{graph.title}";
        public string rootNodeId = "{root_id}";

        [Space(10)]
        [SerializeField]
        public List<QuestNode> nodes = new List<QuestNode>();

        private Dictionary<string, QuestNode> _lookup;

        private void OnEnable()
        {{
            BuildLookup();
        }}

        public void BuildLookup()
        {{
            _lookup = new Dictionary<string, QuestNode>();
            if (nodes == null) return;

            foreach (var node in nodes)
            {{
                if (!string.IsNullOrEmpty(node.id) && !_lookup.ContainsKey(node.id))
                {{
                    _lookup.Add(node.id, node);
                }}
            }}
        }}

        public QuestNode GetNode(string nodeId)
        {{
            if (_lookup == null || _lookup.Count == 0) BuildLookup();
            if (string.IsNullOrEmpty(nodeId)) return null;

            _lookup.TryGetValue(nodeId, out var node);
            return node;
        }}

        public QuestNode GetRootNode()
        {{
            return GetNode(rootNodeId);
        }}

        /// <summary>
        /// Populates the ScriptableObject with pre-baked data from QuestCraft Web Editor
        /// </summary>
        [ContextMenu("Load Pre-baked Graph Data")]
        public void LoadDefaultGraphData()
        {{
            nodes = new List<QuestNode>();

{all_nodes_code}

            BuildLookup();
            Debug.Log($"[{class_name}] Successfully loaded {{nodes.Count}} nodes from QuestCraft export.");
        }}

        private void Reset()
        {{
            LoadDefaultGraphData();
        }}
    }}
}}
"""
        return csharp_template

    @classmethod
    def _to_godot_gdscript(cls, graph) -> str:
        nodes_dict = {}
        for n in graph.nodes:
            out_edges = [e for e in graph.edges if e.source == n.id]
            nodes_dict[n.id] = {
                "type": n.type,
                "data": n.data,
                "transitions": [{"handle": e.sourceHandle or "default", "target": e.target} for e in out_edges]
            }

        gdscript = f"""# Generated by QuestCraft Studio for Godot 4.x
class_name {cls._sanitize_name(graph.title)}Quest
extends Resource

@export var quest_id: String = "{graph.id}"
@export var title: String = "{graph.title}"
@export var root_node_id: String = "{graph.rootNodeId or (graph.nodes[0].id if graph.nodes else '')}"

const GRAPH_DATA = {json.dumps(nodes_dict, indent=4, ensure_ascii=False)}

func get_node_data(node_id: String) -> Dictionary:
    return GRAPH_DATA.get(node_id, {{}})
"""
        return gdscript

    @classmethod
    def _to_compact_json(cls, graph) -> str:
        return json.dumps(graph.model_dump(), indent=2, ensure_ascii=False)


class AIQuestNarrativeService:
    @classmethod
    def generate_next_dialogue(cls, prompt: str, speaker: str) -> dict:
        scenarios = [
            {
                "speaker": speaker or "Shadowy Informant",
                "message": f"Regarding '{prompt}': The syndicate has already dispatched hunters to your location. Take the hidden tunnel!",
                "options": ["Take the tunnel", "Draw weapons and fight", "Bribe them with 100 gold"]
            },
            {
                "speaker": speaker or "Cyber-Doc",
                "message": f"Your neural scan indicates severe memory loss about '{prompt}'. I can repair it, but the bio-chip costs 150 credits.",
                "options": ["Pay credits", "Refuse procedure", "Demand answers"]
            },
            {
                "speaker": speaker or "Tavern Keeper",
                "message": f"Keep your voice down about '{prompt}'! The Baron's guards are listening in the corner.",
                "options": ["Lower voice and order ale", "Confront the guards", "Leave through the back door"]
            }
        ]
        return random.choice(scenarios)