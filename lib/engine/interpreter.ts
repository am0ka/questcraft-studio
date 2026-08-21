import {
    ActionNodeData,
    ConditionNodeData,
    ConditionRule,
    PlayerState,
    QuestGraph,
    SimulatorRuntimeState
} from '@questcraft/shared-types';

export class QuestInterpreter {
    public static startQuest(
        graph: QuestGraph,
        initialPlayerState?: Partial<PlayerState>
    ): SimulatorRuntimeState {
        const playerState: PlayerState = {
            inventory: {},
            variables: {},
            questFlags: {},
            ...initialPlayerState,
        };

        if (!graph.nodes || graph.nodes.length === 0) {
            return {
                currentNodeId: null,
                isCompleted: true,
                playerState,
                history: [],
            };
        }

        const startNode = graph.nodes.find((n) => n?.id === graph.rootNodeId) || graph.nodes[0];
        if (!startNode) {
            return {
                currentNodeId: null,
                isCompleted: true,
                playerState,
                history: [],
            };
        }
        return this.processNode(startNode.id, graph, playerState, []);
    }

    public static makeChoice(
        graph: QuestGraph,
        currentState: SimulatorRuntimeState,
        optionId: string
    ): SimulatorRuntimeState {
        if (currentState.isCompleted || !currentState.currentNodeId) {
            return currentState;
        }

        const currentNode = graph.nodes.find((n) => n.id === currentState.currentNodeId);
        if (!currentNode || (currentNode.type !== 'dialogue' && currentNode.type !== 'root')) {
            return currentState;
        }

        const outgoingEdge = graph.edges.find(
            (e) => e.source === currentNode.id && (e.sourceHandle === optionId || !e.sourceHandle)
        );

        const history = [
            ...currentState.history,
            {
                nodeId: currentNode.id,
                timestamp: Date.now(),
                chosenOptionId: optionId,
            },
        ];

        if (!outgoingEdge) {
            return {
                ...currentState,
                currentNodeId: null,
                isCompleted: true,
                history,
            };
        }

        return this.processNode(outgoingEdge.target, graph, currentState.playerState, history);
    }

    private static processNode(
        nodeId: string,
        graph: QuestGraph,
        playerState: PlayerState,
        history: SimulatorRuntimeState['history']
    ): SimulatorRuntimeState {
        const node = graph.nodes.find((n) => n.id === nodeId);

        if (!node) {
            return {
                currentNodeId: null,
                isCompleted: true,
                playerState,
                history,
            };
        }

        if (node.type === 'dialogue' || node.type === 'root') {
            return {
                currentNodeId: node.id,
                isCompleted: false,
                playerState,
                history,
            };
        }

        if (node.type === 'condition') {
            const data = node.data as ConditionNodeData;
            const isPassed = this.evaluateCondition(data, playerState);

            const targetHandle = isPassed ? 'true' : 'false';
            const branchEdge = graph.edges.find(
                (e) => e.source === node.id && (e.sourceHandle === targetHandle || !e.sourceHandle)
            );

            if (!branchEdge) {
                return { currentNodeId: null, isCompleted: true, playerState, history };
            }

            return this.processNode(branchEdge.target, graph, playerState, history);
        }

        if (node.type === 'action') {
            const data = node.data as ActionNodeData;
            const updatedPlayerState = this.applyActions(data, playerState);

            const nextEdge = graph.edges.find((e) => e.source === node.id);
            if (!nextEdge) {
                return {
                    currentNodeId: null,
                    isCompleted: true,
                    playerState: updatedPlayerState,
                    history,
                };
            }

            return this.processNode(nextEdge.target, graph, updatedPlayerState, history);
        }

        return {
            currentNodeId: node.id,
            isCompleted: false,
            playerState,
            history,
        };
    }

    private static evaluateCondition(data: ConditionNodeData, playerState: PlayerState): boolean {
        if (!data.rules || data.rules.length === 0) return true;

        const results = data.rules.map((rule) => this.checkRule(rule, playerState));
        return data.logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
    }

    private static checkRule(rule: ConditionRule, playerState: PlayerState): boolean {
        let actualValue: any;
        const rawKey = rule.variableKey || '';

        if (rawKey.startsWith('inventory.')) {
            const itemKey = rawKey.replace('inventory.', '');
            actualValue = playerState.inventory[itemKey] ?? 0;
        } else if (rawKey.startsWith('variables.')) {
            const varKey = rawKey.replace('variables.', '');
            actualValue = playerState.variables[varKey];
        } else if (rawKey.startsWith('player.')) {
            const varKey = rawKey.replace('player.', '');
            actualValue = playerState.variables[varKey] ?? playerState.inventory[varKey] ?? 0;
        } else {
            actualValue = playerState.variables[rawKey] ?? playerState.inventory[rawKey] ?? 0;
        }

        switch (rule.operator) {
            case '==':
                return actualValue === rule.value;
            case '!=':
                return actualValue !== rule.value;
            case '>=':
                return Number(actualValue) >= Number(rule.value);
            case '<=':
                return Number(actualValue) <= Number(rule.value);
            case '>':
                return Number(actualValue) > Number(rule.value);
            case '<':
                return Number(actualValue) < Number(rule.value);
            case 'has_item':
                return (playerState.inventory[String(rule.value)] || 0) > 0;
            default:
                return false;
        }
    }

    private static applyActions(data: ActionNodeData, playerState: PlayerState): PlayerState {
        const updated: PlayerState = {
            inventory: { ...playerState.inventory },
            variables: { ...playerState.variables },
            questFlags: { ...playerState.questFlags },
        };

        if (!data.actions) return updated;

        for (const act of data.actions) {
            if (act.type === 'give_item') {
                const key = act.targetKey;
                updated.inventory[key] = (updated.inventory[key] || 0) + Number(act.value);
            } else if (act.type === 'remove_item') {
                const key = act.targetKey;
                updated.inventory[key] = Math.max(0, (updated.inventory[key] || 0) - Number(act.value));
            } else if (act.type === 'set_variable') {
                updated.variables[act.targetKey] = act.value;
            } else if (act.type === 'trigger_event') {
                updated.questFlags[act.targetKey] = Boolean(act.value);
            }
        }

        return updated;
    }
}