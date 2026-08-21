'use client';

import { useGraphStore } from '@/store/useGraphStore';
import { ActionNodeData, ActionPayload, ActionType } from '@questcraft/shared-types';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { Trash2, Zap } from 'lucide-react';
import { memo } from 'react';

export const ActionNode = memo(({ id, data, selected }: NodeProps<Node<ActionNodeData>>) => {
    const updateNodeData = useGraphStore((s) => s.updateNodeData);
    const deleteNode = useGraphStore((s) => s.deleteNode);
    const activeSimulatorNodeId = useGraphStore((s) => s.activeSimulatorNodeId);

    const isActive = activeSimulatorNodeId === id;
    const action: ActionPayload = data.actions?.[0] || { type: 'give_item', targetKey: 'gold', value: 50 };

    const handleActionChange = <K extends keyof ActionPayload>(field: K, val: ActionPayload[K]) => {
        const newActions: ActionPayload[] = [{ ...action, [field]: val }];
        updateNodeData(id, { actions: newActions });
    };

    return (
        <div
            className={`relative w-72 rounded-xl bg-zinc-900/95 border transition-all duration-200 shadow-2xl backdrop-blur-md ${isActive
                ? 'border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/20'
                : selected
                    ? 'border-purple-400 ring-2 ring-purple-400/30'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-purple-400 !border-2 !border-zinc-900 rounded-full"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-purple-500/10 rounded-t-xl border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold tracking-wide uppercase text-purple-300">Action / Reward</span>
                </div>
                <button onClick={() => deleteNode(id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-3 text-xs">
                <div>
                    <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">Action Type</label>
                    <select
                        value={action.type}
                        onChange={(e) => handleActionChange('type', e.target.value as ActionType)}
                        className="w-full p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 outline-none"
                    >
                        <option value="give_item">Give Item / Gold</option>
                        <option value="remove_item">Remove Item / Gold</option>
                        <option value="set_variable">Set Quest Variable</option>
                        <option value="trigger_event">Trigger Game Event</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">Item / Key</label>
                        <input
                            type="text"
                            value={action.targetKey || ''}
                            onChange={(e) => handleActionChange('targetKey', e.target.value)}
                            placeholder="e.g. gold"
                            className="w-full p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">Amount / Value</label>
                        <input
                            type="text"
                            value={String(action.value ?? '')}
                            onChange={(e) => handleActionChange('value', isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                            placeholder="50"
                            className="w-full p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 outline-none"
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-zinc-400">
                    <span className="text-[11px]">Pass to next node:</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-zinc-900 rounded-full -right-3"
                    />
                </div>
            </div>
        </div>
    );
});

ActionNode.displayName = 'ActionNode';