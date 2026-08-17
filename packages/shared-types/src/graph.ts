import { DialogueNodeData, ConditionNodeData, ActionNodeData, NodeType } from './nodes';

export interface GraphCoordinates {
    x: number;
    y: number;
}

export type AnyNodeData = DialogueNodeData | ConditionNodeData | ActionNodeData;

export interface QuestNode<TData = AnyNodeData> {
    id: string;
    type: NodeType;
    position: GraphCoordinates;
    data: TData;
}

export interface QuestEdge {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
    animated?: boolean;
}

export interface QuestGraph {
    id: string;
    title: string;
    version: number;
    rootNodeId: string;
    nodes: QuestNode[];
    edges: QuestEdge[];
    metadata: {
        createdAt: string;
        updatedAt: string;
        author: string;
    };
}

export interface GraphValidationError {
    nodeId?: string;
    edgeId?: string;
    severity: 'error' | 'warning';
    code: 'CYCLIC_DEPENDENCY' | 'UNREACHABLE_NODE' | 'DANGLING_EDGE' | 'EMPTY_ROOT';
    message: string;
}

export interface GraphValidationResult {
    isValid: boolean;
    errors: GraphValidationError[];
}