export interface PlayerState {
    inventory: Record<string, number>;
    variables: Record<string, string | number | boolean>;
    questFlags: Record<string, boolean>;
}

export interface ExecutionHistoryStep {
    nodeId: string;
    timestamp: number;
    chosenOptionId?: string;
}

export interface SimulatorRuntimeState {
    currentNodeId: string | null;
    isCompleted: boolean;
    playerState: PlayerState;
    history: ExecutionHistoryStep[];
}