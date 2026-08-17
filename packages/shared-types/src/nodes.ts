export type NodeType = 'root' | 'dialogue' | 'condition' | 'action' | 'llm_choice';

export interface BaseNodeData extends Record<string, unknown> {
    label: string;
    description?: string;
}

export interface DialogueOption {
    id: string;
    text: string;
    targetNodeId?: string;
    conditionId?: string;
}

export interface DialogueNodeData extends BaseNodeData {
    speakerName: string;
    avatarUrl?: string;
    messageText: string;
    audioClipUrl?: string;
    options: DialogueOption[];
}

export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'has_item';

export interface ConditionRule {
    variableKey: string;
    operator: ConditionOperator;
    value: string | number | boolean;
}

export interface ConditionNodeData extends BaseNodeData {
    rules: ConditionRule[];
    logic: 'AND' | 'OR';
    trueBranchNodeId?: string;
    falseBranchNodeId?: string;
}

export type ActionType = 'give_item' | 'remove_item' | 'set_variable' | 'trigger_event';

export interface ActionPayload {
    type: ActionType;
    targetKey: string;
    value: string | number | boolean;
}

export interface ActionNodeData extends BaseNodeData {
    actions: ActionPayload[];
    nextNodeId?: string;
}