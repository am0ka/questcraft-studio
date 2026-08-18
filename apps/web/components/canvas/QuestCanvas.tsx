'use client';

import { useGraphStore } from '@/store/useGraphStore';
import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { DialogueNode } from './nodes/DialogueNode';

export const QuestCanvas = () => {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        selectNode,
    } = useGraphStore();

    const nodeTypes = useMemo(
        () => ({
            dialogueNode: DialogueNode,
            conditionNode: ConditionNode,
            actionNode: ActionNode,
        }),
        []
    );

    return (
        <div className="w-full h-full bg-zinc-950 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => selectNode(node.id)}
                onPaneClick={() => selectNode(null)}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[16, 16]}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: '#38bdf8', strokeWidth: 2 },
                }}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#27272a" />
                <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400 [&>button]:!border-zinc-800" />
                <MiniMap
                    nodeColor={(n) => {
                        if (n.type === 'conditionNode') return '#f59e0b';
                        if (n.type === 'actionNode') return '#c084fc';
                        return '#38bdf8';
                    }}
                    maskColor="rgba(9, 9, 11, 0.75)"
                    className="!bg-zinc-900 !border-zinc-800 !rounded-xl overflow-hidden"
                />
            </ReactFlow>
        </div>
    );
};