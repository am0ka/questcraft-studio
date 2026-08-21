import { create } from 'zustand';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
} from '@xyflow/react';
import { DialogueNodeData, ConditionNodeData, ActionNodeData, AnyNodeData } from '@/types';
import { WITCHER_CONTRACT_TEMPLATE } from './templates';

export type CustomNode = Node<DialogueNodeData | ConditionNodeData | ActionNodeData>;

interface GraphHistorySnapshot {
    nodes: CustomNode[];
    edges: Edge[];
}

interface GraphState {
    nodes: CustomNode[];
    edges: Edge[];
    selectedNodeId: string | null;
    activeSimulatorNodeId: string | null;
    past: GraphHistorySnapshot[];
    future: GraphHistorySnapshot[];

    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    selectNode: (id: string | null) => void;
    addDialogueNode: (pos?: { x: number; y: number }) => void;
    addConditionNode: (pos?: { x: number; y: number }) => void;
    addActionNode: (pos?: { x: number; y: number }) => void;
    loadTemplate: () => void;
    updateNodeData: (nodeId: string, data: Partial<AnyNodeData> | Record<string, unknown>) => void;
    deleteNode: (nodeId: string) => void;
    setActiveSimulatorNode: (id: string | null) => void;

    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: WITCHER_CONTRACT_TEMPLATE.nodes,
    edges: WITCHER_CONTRACT_TEMPLATE.edges,
    selectedNodeId: null,
    activeSimulatorNodeId: null,
    past: [],
    future: [],

    takeSnapshot: () => {
        const { nodes, edges, past } = get();
        set({
            past: [...past.slice(-20), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
            future: [],
        });
    },

    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as CustomNode[] });
    },

    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    onConnect: (connection) => {
        get().takeSnapshot();
        set({
            edges: addEdge({ ...connection, animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } }, get().edges),
        });
    },

    selectNode: (id) => set({ selectedNodeId: id }),
    setActiveSimulatorNode: (id) => set({ activeSimulatorNodeId: id }),

    addDialogueNode: (pos = { x: 300, y: 200 }) => {
        get().takeSnapshot();
        const id = `dialogue-${Date.now()}`;
        const newNode: CustomNode = {
            id,
            type: 'dialogueNode',
            position: pos,
            data: {
                label: 'New Dialogue',
                speakerName: 'NPC',
                messageText: 'What is your desire, stranger?',
                options: [{ id: `opt-${Date.now()}-1`, text: 'Continue...' }],
            },
        };
        set({ nodes: [...get().nodes, newNode] });
    },

    addConditionNode: (pos = { x: 350, y: 250 }) => {
        get().takeSnapshot();
        const id = `condition-${Date.now()}`;
        const newNode: CustomNode = {
            id,
            type: 'conditionNode',
            position: pos,
            data: {
                label: 'Check Inventory',
                logic: 'AND',
                rules: [{ variableKey: 'inventory.gold', operator: '>=', value: 50 }],
            },
        };
        set({ nodes: [...get().nodes, newNode] });
    },

    addActionNode: (pos = { x: 400, y: 300 }) => {
        get().takeSnapshot();
        const id = `action-${Date.now()}`;
        const newNode: CustomNode = {
            id,
            type: 'actionNode',
            position: pos,
            data: {
                label: 'Give Reward',
                actions: [{ type: 'give_item', targetKey: 'gold', value: 50 }],
            },
        };
        set({ nodes: [...get().nodes, newNode] });
    },

    loadTemplate: () => {
        get().takeSnapshot();
        set({
            nodes: WITCHER_CONTRACT_TEMPLATE.nodes,
            edges: WITCHER_CONTRACT_TEMPLATE.edges,
            activeSimulatorNodeId: null,
        });
    },

    updateNodeData: (nodeId, dataUpdate) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...dataUpdate } };
                }
                return node;
            }),
        });
    },

    deleteNode: (nodeId) => {
        get().takeSnapshot();
        set({
            nodes: get().nodes.filter((n) => n.id !== nodeId),
            edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        });
    },

    undo: () => {
        const { past, future, nodes, edges } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
            past: past.slice(0, past.length - 1),
            future: [{ nodes, edges }, ...future],
            nodes: previous.nodes,
            edges: previous.edges,
        });
    },

    redo: () => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
            past: [...past, { nodes, edges }],
            future: future.slice(1),
            nodes: next.nodes,
            edges: next.edges,
        });
    },
}));