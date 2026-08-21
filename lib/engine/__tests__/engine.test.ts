import { describe, it, expect } from 'vitest';
import * as CoreEngineModule from '../index';
import { QuestInterpreter } from '../interpreter';
import { GraphValidator } from '../validator';
import { GraphSerializer } from '../serializers';
import { QuestGraph } from '@questcraft/shared-types';

const baseGraph: QuestGraph = {
    id: 'main-graph',
    title: 'Epic Adventure',
    version: 1,
    rootNodeId: 'node-start',
    nodes: [
        {
            id: 'node-start',
            type: 'dialogue',
            position: { x: 0, y: 0 },
            data: {
                label: 'Start Node',
                speakerName: 'Narrator',
                messageText: 'Welcome!',
                options: [
                    { id: 'opt-cond', text: 'To Condition' },
                    { id: 'opt-dead', text: 'Dead End' },
                ],
            },
        },
        {
            id: 'node-cond',
            type: 'condition',
            position: { x: 100, y: 0 },
            data: {
                label: 'Check Inventory',
                logic: 'AND',
                rules: [
                    { variableKey: 'inventory.gold', operator: '>=', value: 50 },
                    { variableKey: 'inventory.potion', operator: '==', value: 2 },
                    { variableKey: 'inventory.poison', operator: '!=' as any, value: 1 },
                    { variableKey: 'player.level', operator: '>' as any, value: 5 },
                    { variableKey: 'raw_risk', operator: '<' as any, value: 10 },
                    { variableKey: 'inventory.mana', operator: '<=' as any, value: 100 },
                    { variableKey: 'inventory.keys', operator: 'has_item', value: 'iron_key' },
                ],
            },
        },
        {
            id: 'node-actions',
            type: 'action',
            position: { x: 200, y: 0 },
            data: {
                label: 'Grant Rewards',
                actions: [
                    { type: 'give_item', targetKey: 'gold', value: 20 },
                    { type: 'remove_item', targetKey: 'potion', value: 1 },
                    { type: 'set_variable', targetKey: 'quest_step', value: 'completed' },
                    { type: 'trigger_event', targetKey: 'gate_opened', value: true },
                ],
            },
        },
        {
            id: 'node-end',
            type: 'dialogue',
            position: { x: 300, y: 0 },
            data: {
                label: 'End Dialogue',
                speakerName: 'Elder',
                messageText: 'Farewell!',
                options: [{ id: 'opt-finish', text: 'Goodbye' }],
            },
        },
        {
            id: 'node-fallback-branch',
            type: 'dialogue',
            position: { x: 100, y: 100 },
            data: {
                label: 'Condition False',
                speakerName: 'Guard',
                messageText: 'Denied!',
                options: [],
            },
        },
    ],
    edges: [
        { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-cond' },
        { id: 'e2', source: 'node-cond', sourceHandle: 'true', target: 'node-actions' },
        { id: 'e3', source: 'node-cond', sourceHandle: 'false', target: 'node-fallback-branch' },
        { id: 'e4', source: 'node-actions', target: 'node-end' },
    ],
    metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Amir Sarsen',
    },
};

describe('Module Exports', () => {
    it('should export all engine members', () => {
        expect(CoreEngineModule.QuestInterpreter).toBeDefined();
        expect(CoreEngineModule.GraphValidator).toBeDefined();
        expect(CoreEngineModule.GraphSerializer).toBeDefined();
    });
});

describe('QuestInterpreter Engine - Complete Coverage', () => {
    it('should handle empty graph on start', () => {
        const state = QuestInterpreter.startQuest({ ...baseGraph, nodes: [] });
        expect(state.isCompleted).toBe(true);
        expect(state.currentNodeId).toBeNull();
    });

    it('should fallback to first node if rootNodeId is invalid', () => {
        const state = QuestInterpreter.startQuest({ ...baseGraph, rootNodeId: 'invalid-id' });
        expect(state.currentNodeId).toBe('node-start');
    });

    it('should execute full path with conditions and actions', () => {
        const startState = QuestInterpreter.startQuest(baseGraph, {
            inventory: { gold: 100, potion: 2, poison: 0, mana: 50, iron_key: 1 },
            variables: { level: 10, raw_risk: 5 },
        });

        const nextState = QuestInterpreter.makeChoice(baseGraph, startState, 'opt-cond');
        expect(nextState.currentNodeId).toBe('node-end');
        expect(nextState.playerState.inventory['gold']).toBe(120);
        expect(nextState.playerState.inventory['potion']).toBe(1);
        expect(nextState.playerState.variables['quest_step']).toBe('completed');
        expect(nextState.playerState.questFlags['gate_opened']).toBe(true);
    });

    it('should take false condition branch when rule fails', () => {
        const startState = QuestInterpreter.startQuest(baseGraph, { inventory: { gold: 10 } });
        const nextState = QuestInterpreter.makeChoice(baseGraph, startState, 'opt-cond');
        expect(nextState.currentNodeId).toBe('node-fallback-branch');
    });

    it('should support OR condition logic and empty rules', () => {
        const orGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                baseGraph.nodes[0]!,
                {
                    id: 'node-cond-or',
                    type: 'condition',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'OR Check',
                        logic: 'OR',
                        rules: [
                            { variableKey: 'variables.has_vip', operator: '==', value: true },
                            { variableKey: 'inventory.gold', operator: '>=', value: 1000 },
                        ],
                    },
                },
                baseGraph.nodes[3]!,
            ],
            edges: [
                { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-cond-or' },
                { id: 'e2', source: 'node-cond-or', sourceHandle: 'true', target: 'node-end' },
            ],
        };

        const state = QuestInterpreter.startQuest(orGraph, {
            inventory: { gold: 0 },
            variables: { has_vip: true },
        });
        const nextState = QuestInterpreter.makeChoice(orGraph, state, 'opt-cond');
        expect(nextState.currentNodeId).toBe('node-end');
    });

    it('should handle edge missing on condition branch', () => {
        const isolatedCondGraph: QuestGraph = {
            ...baseGraph,
            edges: [{ id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-cond' }],
        };
        const state = QuestInterpreter.startQuest(isolatedCondGraph, { inventory: { gold: 100 } });
        const nextState = QuestInterpreter.makeChoice(isolatedCondGraph, state, 'opt-cond');
        expect(nextState.isCompleted).toBe(true);
    });

    it('should handle edge missing on action node', () => {
        const isolatedActionGraph: QuestGraph = {
            ...baseGraph,
            nodes: [baseGraph.nodes[0]!, baseGraph.nodes[2]!],
            edges: [{ id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-actions' }],
        };
        const state = QuestInterpreter.startQuest(isolatedActionGraph);
        const nextState = QuestInterpreter.makeChoice(isolatedActionGraph, state, 'opt-cond');
        expect(nextState.isCompleted).toBe(true);
    });

    it('should handle makeChoice when state is already completed or invalid node', () => {
        const doneState = { currentNodeId: null, isCompleted: true, playerState: { inventory: {}, variables: {}, questFlags: {} }, history: [] };
        expect(QuestInterpreter.makeChoice(baseGraph, doneState, 'any')).toEqual(doneState);

        const wrongNodeState = { ...doneState, currentNodeId: 'node-cond', isCompleted: false };
        expect(QuestInterpreter.makeChoice(baseGraph, wrongNodeState, 'any')).toEqual(wrongNodeState);
    });

    it('should safely handle edge connecting to non-existent target node', () => {
        const brokenGraph: QuestGraph = {
            ...baseGraph,
            edges: [{ id: 'e-bad', source: 'node-start', sourceHandle: 'opt-cond', target: 'ghost-node' }],
        };
        const state = QuestInterpreter.startQuest(brokenGraph);
        const nextState = QuestInterpreter.makeChoice(brokenGraph, state, 'opt-cond');
        expect(nextState.isCompleted).toBe(true);
    });

    it('should safely handle action nodes with empty actions and custom nodes', () => {
        const emptyActGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                baseGraph.nodes[0]!,
                { id: 'node-empty-act', type: 'action', position: { x: 0, y: 0 }, data: { label: 'Empty', actions: [] } },
                { id: 'node-custom', type: 'custom_type' as any, position: { x: 0, y: 0 }, data: { label: 'Custom' } as any },
            ],
            edges: [
                { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-empty-act' },
                { id: 'e2', source: 'node-empty-act', target: 'node-custom' },
            ],
        };
        const state = QuestInterpreter.startQuest(emptyActGraph);
        const nextState = QuestInterpreter.makeChoice(emptyActGraph, state, 'opt-cond');
        expect(nextState.currentNodeId).toBe('node-custom');
    });

    it('should safely prevent inventory from dropping below zero and handle default operator', () => {
        const actionGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                baseGraph.nodes[0]!,
                {
                    id: 'node-cond-def',
                    type: 'condition',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Def Op',
                        logic: 'AND',
                        rules: [{ variableKey: 'unknown', operator: 'invalid_op' as any, value: 1 }],
                    },
                },
            ],
            edges: [{ id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-cond-def' }],
        };
        const state = QuestInterpreter.startQuest(actionGraph);
        const nextState = QuestInterpreter.makeChoice(actionGraph, state, 'opt-cond');
        expect(nextState.isCompleted).toBe(true);
    });

    it('should handle startQuest when graph has undefined/falsy node in array', () => {
        const state = QuestInterpreter.startQuest({ ...baseGraph, nodes: [undefined as any] });
        expect(state.isCompleted).toBe(true);
        expect(state.currentNodeId).toBeNull();
    });

    it('should handle makeChoice when chosen option has no outgoing edge', () => {
        const startState = QuestInterpreter.startQuest(baseGraph);
        const nextState = QuestInterpreter.makeChoice(baseGraph, startState, 'opt-dead');
        expect(nextState.isCompleted).toBe(true);
        expect(nextState.currentNodeId).toBeNull();
        expect(nextState.history.length).toBe(1);
        expect(nextState.history[0]?.chosenOptionId).toBe('opt-dead');
    });

    it('should handle makeChoice when currentNode does not exist in graph nodes', () => {
        const state = {
            currentNodeId: 'non-existent-node-id',
            isCompleted: false,
            playerState: { inventory: {}, variables: {}, questFlags: {} },
            history: [],
        };
        const nextState = QuestInterpreter.makeChoice(baseGraph, state, 'any-opt');
        expect(nextState).toEqual(state);
    });

    it('should support root node type and edge without sourceHandle', () => {
        const rootGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                {
                    id: 'node-root-type',
                    type: 'root',
                    position: { x: 0, y: 0 },
                    data: { label: 'Start' } as any,
                },
                baseGraph.nodes[3]!,
            ],
            edges: [{ id: 'e-root', source: 'node-root-type', target: 'node-end' }],
        };
        const startState = QuestInterpreter.startQuest(rootGraph);
        expect(startState.currentNodeId).toBe('node-root-type');
        const nextState = QuestInterpreter.makeChoice(rootGraph, startState, 'any-opt');
        expect(nextState.currentNodeId).toBe('node-end');
    });

    it('should handle condition has_item false and variable fallback', () => {
        const condGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                baseGraph.nodes[0]!,
                {
                    id: 'node-cond-missing',
                    type: 'condition',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Missing Checks',
                        logic: 'AND',
                        rules: [
                            { variableKey: 'inventory.nonexistent', operator: 'has_item', value: 'secret' },
                            { variableKey: 'variables.unset_var', operator: '==', value: undefined as any },
                            { variableKey: '', operator: '==', value: 0 },
                        ],
                    },
                },
                baseGraph.nodes[4]!,
            ],
            edges: [
                { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-cond-missing' },
                { id: 'e2', source: 'node-cond-missing', sourceHandle: 'false', target: 'node-fallback-branch' },
            ],
        };
        const state = QuestInterpreter.startQuest(condGraph);
        const nextState = QuestInterpreter.makeChoice(condGraph, state, 'opt-cond');
        expect(nextState.currentNodeId).toBe('node-fallback-branch');

        // Test condition node with undefined rules array
        const undefRulesGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                baseGraph.nodes[0]!,
                {
                    id: 'node-cond-undef-rules',
                    type: 'condition',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'No Rules',
                    } as any,
                },
                baseGraph.nodes[3]!,
            ],
            edges: [
                { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-cond-undef-rules' },
                { id: 'e2', source: 'node-cond-undef-rules', sourceHandle: 'true', target: 'node-end' },
            ],
        };
        const state2 = QuestInterpreter.startQuest(undefRulesGraph);
        const nextState2 = QuestInterpreter.makeChoice(undefRulesGraph, state2, 'opt-cond');
        expect(nextState2.currentNodeId).toBe('node-end');
    });

    it('should handle action node when actions array is undefined or has unknown action type', () => {
        const actGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                baseGraph.nodes[0]!,
                {
                    id: 'node-actions-misc',
                    type: 'action',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Misc Actions',
                        actions: [{ type: 'unknown_type' as any, targetKey: 'test', value: 123 }],
                    },
                },
                baseGraph.nodes[3]!,
            ],
            edges: [
                { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-actions-misc' },
                { id: 'e2', source: 'node-actions-misc', target: 'node-end' },
            ],
        };
        const state = QuestInterpreter.startQuest(actGraph);
        const nextState = QuestInterpreter.makeChoice(actGraph, state, 'opt-cond');
        expect(nextState.currentNodeId).toBe('node-end');

        const noActionsGraph: QuestGraph = {
            ...actGraph,
            nodes: [
                baseGraph.nodes[0]!,
                {
                    id: 'node-no-actions',
                    type: 'action',
                    position: { x: 0, y: 0 },
                    data: { label: 'No Actions' } as any,
                },
                baseGraph.nodes[3]!,
            ],
            edges: [
                { id: 'e1', source: 'node-start', sourceHandle: 'opt-cond', target: 'node-no-actions' },
                { id: 'e2', source: 'node-no-actions', target: 'node-end' },
            ],
        };
        const state2 = QuestInterpreter.startQuest(noActionsGraph);
        const nextState2 = QuestInterpreter.makeChoice(noActionsGraph, state2, 'opt-cond');
        expect(nextState2.currentNodeId).toBe('node-end');
    });
});

describe('GraphValidator - Complete Coverage', () => {
    it('should pass valid complete graph', () => {
        const res = GraphValidator.validate(baseGraph);
        expect(res.isValid).toBe(true);
        expect(res.nodesCount).toBe(baseGraph.nodes.length);
        expect(res.edgesCount).toBe(baseGraph.edges.length);
    });

    it('should flag empty graph', () => {
        expect(GraphValidator.validate({ ...baseGraph, nodes: [] }).isValid).toBe(false);
        expect(GraphValidator.validate({ ...baseGraph, nodes: undefined as any }).isValid).toBe(false);
    });

    it('should flag graph when rootNode is undefined in non-empty nodes list', () => {
        const res = GraphValidator.validate({ ...baseGraph, rootNodeId: 'non-existent', nodes: [{ id: 'node-1', type: 'dialogue', position: { x: 0, y: 0 }, data: { label: 'Node', speakerName: 'NPC', messageText: '', options: [{ id: '1', text: 'hi' }] } }], edges: [] });
        expect(res.isValid).toBe(false);
        expect(res.errors.some((e) => e.code === 'NO_ROOT_NODE')).toBe(true);
    });

    it('should detect unreachable nodes, dangling edges, empty choices and cycles', () => {
        const invalidGraph: QuestGraph = {
            ...baseGraph,
            nodes: [
                ...baseGraph.nodes,
                { id: 'lost-node', type: 'dialogue', position: { x: 0, y: 0 }, data: { label: 'Lost', speakerName: 'NPC', messageText: '', options: [] } },
                { id: 'cycle-1', type: 'action', position: { x: 0, y: 0 }, data: { label: 'C1', actions: [] } },
                { id: 'cycle-2', type: 'action', position: { x: 0, y: 0 }, data: { label: 'C2', actions: [] } },
            ],
            edges: [
                ...baseGraph.edges,
                { id: 'dangling', source: 'node-start', target: 'ghost-node' },
                { id: 'dangling-source', source: 'ghost-source', target: 'node-start' },
                { id: 'c-edge-1', source: 'cycle-1', target: 'cycle-2' },
                { id: 'c-edge-2', source: 'cycle-2', target: 'cycle-1' },
            ],
        };
        const res = GraphValidator.validate(invalidGraph);
        expect(res.isValid).toBe(false);
        expect(res.errors.some((e) => e.code === 'UNREACHABLE_NODE')).toBe(true);
        expect(res.errors.some((e) => e.code === 'DANGLING_EDGE')).toBe(true);
        expect(res.errors.some((e) => e.code === 'EMPTY_CHOICES')).toBe(true);
        expect(res.errors.some((e) => e.code === 'DETECTED_CYCLE')).toBe(true);
    });
});

describe('GraphSerializer - Complete Coverage', () => {
    it('should serialize graph to JSON', () => {
        const json1 = GraphSerializer.toGameEngineJSON(baseGraph);
        expect(JSON.parse(json1).meta.title).toBe('Epic Adventure');

        const noRootGraph = { ...baseGraph, rootNodeId: '' };
        const json2 = GraphSerializer.toGameEngineJSON(noRootGraph);
        expect(JSON.parse(json2).initial_node_id).toBe('node-start');
    });

    it('should export code for Unity C#', () => {
        const exported = GraphSerializer.exportCode(baseGraph, 'unity_csharp', 'MyGame.Quests');
        expect(exported.targetEngine).toBe('unity_csharp');
        expect(exported.fileName).toContain('QuestData.cs');
        expect(exported.code).toContain('namespace MyGame.Quests');
        expect(exported.code).toContain('ScriptableObject');
        expect(exported.code).toContain('DialogueOption');
    });

    it('should export code for Godot GDScript', () => {
        const exported = GraphSerializer.exportCode(baseGraph, 'godot_gdscript');
        expect(exported.targetEngine).toBe('godot_gdscript');
        expect(exported.fileName).toContain('_quest.gd');
        expect(exported.code).toContain('extends Resource');
        expect(exported.code).toContain('GRAPH_DATA =');
    });

    it('should export code for compact JSON format', () => {
        const exported = GraphSerializer.exportCode(baseGraph, 'json');
        expect(exported.targetEngine).toBe('json');
        expect(exported.fileName).toContain('_quest.json');
        expect(JSON.parse(exported.code).title).toBe('Epic Adventure');
    });

    it('should handle edge cases in serialization and escaping', () => {
        expect(GraphSerializer.sanitizeName('')).toBe('MyQuest');
        expect(GraphSerializer.sanitizeName('   ')).toBe('MyQuest');

        const sparseGraph: QuestGraph = {
            id: 'sparse_quest\n"123"',
            title: '',
            nodes: [
                {
                    id: 'd1',
                    type: 'dialogue',
                    position: { x: 0, y: 0 },
                    data: {
                        label: '',
                        speakerName: '',
                        messageText: 'Line 1\nLine 2\r"quoted"',
                        options: [{ id: '', text: '' }, { id: 'opt2', text: 'Opt2' }],
                    },
                },
                {
                    id: 'c1',
                    type: 'condition',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Condition Node',
                        logic: 'AND',
                        rules: [],
                    },
                },
                {
                    id: 'a1',
                    type: 'action',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Action Node',
                        actions: [],
                    },
                },
            ],
            edges: [
                { id: 'e-fallback', source: 'd1', target: 'c1' },
            ],
        };

        const unity = GraphSerializer.toUnityCSharp(sparseGraph);
        expect(unity).toContain('MyQuest');
        expect(unity).toContain('QuestCraft');

        const godot = GraphSerializer.toGodotGDScript(sparseGraph);
        expect(godot).toContain('class_name MyQuestQuest');
    });
});