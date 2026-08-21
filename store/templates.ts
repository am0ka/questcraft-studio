import { CustomNode } from './useGraphStore';
import { Edge } from '@xyflow/react';

export const WITCHER_CONTRACT_TEMPLATE: { nodes: CustomNode[]; edges: Edge[] } = {
    nodes: [
        {
            id: 'node-start',
            type: 'dialogueNode',
            position: { x: 50, y: 150 },
            data: {
                label: 'Tavern Introduction',
                speakerName: 'Olgierd (Village Elder)',
                messageText: 'Traveler! The crypt beneath the ruined tower is cursed. We need a blade, but our purse is tight.',
                options: [
                    { id: 'opt-1', text: 'I require 100 gold upfront for monster preparation.' },
                    { id: 'opt-2', text: 'Tell me about the creature first.' },
                ],
            },
        },
        {
            id: 'node-condition-gold',
            type: 'conditionNode',
            position: { x: 500, y: 50 },
            data: {
                label: 'Check Player Gold',
                logic: 'AND',
                rules: [{ variableKey: 'inventory.gold', operator: '>=', value: 100 }],
            },
        },
        {
            id: 'node-lore',
            type: 'dialogueNode',
            position: { x: 500, y: 350 },
            data: {
                label: 'Monster Lore',
                speakerName: 'Olgierd (Village Elder)',
                messageText: 'It is a Grave Hag. It lures children with illusions. Silver and necrophage oil will do the job.',
                options: [
                    { id: 'opt-lore-accept', text: 'I will cleanse the crypt. (Accept Quest)' },
                ],
            },
        },
        {
            id: 'node-reward',
            type: 'actionNode',
            position: { x: 920, y: 50 },
            data: {
                label: 'Pay Contract Fee',
                actions: [{ type: 'give_item', targetKey: 'silver_trophy', value: 1 }],
            },
        },
        {
            id: 'node-finish-rich',
            type: 'dialogueNode',
            position: { x: 1300, y: 50 },
            data: {
                label: 'Quest Complete: Bribed',
                speakerName: 'Olgierd',
                messageText: 'Fair deal! Take this trophy and may the gods protect you in the crypt.',
                options: [{ id: 'opt-end-1', text: 'Farewell.' }],
            },
        },
        {
            id: 'node-fail-gold',
            type: 'dialogueNode',
            position: { x: 920, y: 220 },
            data: {
                label: 'Refusal',
                speakerName: 'Olgierd',
                messageText: 'You lack the funds and tools! Come back when you are prepared, beggar.',
                options: [{ id: 'opt-end-2', text: 'I will return.' }],
            },
        },
    ],
    edges: [
        { id: 'e1', source: 'node-start', sourceHandle: 'opt-1', target: 'node-condition-gold', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } },
        { id: 'e2', source: 'node-start', sourceHandle: 'opt-2', target: 'node-lore', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } },
        { id: 'e3', source: 'node-condition-gold', sourceHandle: 'true', target: 'node-reward', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e4', source: 'node-condition-gold', sourceHandle: 'false', target: 'node-fail-gold', animated: true, style: { stroke: '#f43f5e', strokeWidth: 2 } },
        { id: 'e5', source: 'node-reward', target: 'node-finish-rich', animated: true, style: { stroke: '#c084fc', strokeWidth: 2 } },
    ],
};