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
    version?: number;
    rootNodeId?: string;
    nodes: QuestNode[];
    edges: QuestEdge[];
    metadata?: {
        createdAt?: string;
        updatedAt?: string;
        author?: string;
    };
}

export type GraphValidationErrorCode =
    | 'CYCLIC_DEPENDENCY'
    | 'UNREACHABLE_NODE'
    | 'DANGLING_EDGE'
    | 'EMPTY_ROOT'
    | 'EMPTY_GRAPH'
    | 'NO_ROOT_NODE'
    | 'DETECTED_CYCLE'
    | 'EMPTY_CHOICES';

export interface GraphValidationError {
    nodeId?: string;
    edgeId?: string;
    severity: 'error' | 'warning';
    code: GraphValidationErrorCode | string;
    message: string;
}

export interface GraphValidationResult {
    isValid: boolean;
    nodesCount?: number;
    edgesCount?: number;
    errors: GraphValidationError[];
}

export type TargetEngine = 'unity_csharp' | 'godot_gdscript' | 'json';

export interface ExportRequest {
    graph: QuestGraph;
    targetEngine: TargetEngine;
    namespace?: string;
}

export interface ExportResponse {
    fileName: string;
    targetEngine: TargetEngine;
    code: string;
}

export interface AIGenerateRequest {
    prompt: string;
    speakerName?: string;
}

export interface AIGenerateResponse {
    speaker: string;
    message: string;
    options: string[];
}