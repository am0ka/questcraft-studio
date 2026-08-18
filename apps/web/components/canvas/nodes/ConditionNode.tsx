'use client';

import { useGraphStore } from '@/store/useGraphStore';
import { ConditionNodeData, ConditionOperator, ConditionRule } from '@questcraft/shared-types';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { Check, GitBranch, Trash2, X } from 'lucide-react';
import { memo } from 'react';

export const ConditionNode = memo(({ id, data, selected }: NodeProps<Node<ConditionNodeData>>) => {
    const updateNodeData = useGraphStore((s) => s.updateNodeData);
    const deleteNode = useGraphStore((s) => s.deleteNode);
    const activeSimulatorNodeId = useGraphStore((s) => s.activeSimulatorNodeId);

    const isActive = activeSimulatorNodeId === id;
    const rule: ConditionRule = data.rules?.[0] || { variableKey: 'inventory.gold', operator: '>=', value: 50 };

    const handleRuleChange = <K extends keyof ConditionRule>(field: K, val: ConditionRule[K]) => {
        const newRules: ConditionRule[] = [{ ...rule, [field]: val }];
        updateNodeData(id, { rules: newRules });
    };

    return (
        <div
            className={`relative w-72 rounded-xl bg-zinc-900/95 border transition-all duration-200 shadow-2xl backdrop-blur-md ${isActive
                ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
                : selected
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-zinc-900 rounded-full"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-amber-500/10 rounded-t-xl border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold tracking-wide uppercase text-amber-300">Condition Check</span>
                </div>
                <button onClick={() => deleteNode(id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-3 text-xs">
                <div>
                    <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">Variable / Target</label>
                    <input
                        type="text"
                        value={rule.variableKey || ''}
                        onChange={(e) => handleRuleChange('variableKey', e.target.value)}
                        placeholder="e.g. inventory.gold or player.has_key"
                        className="w-full p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 outline-none focus:border-amber-500/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">Operator</label>
                        <select
                            value={rule.operator}
                            onChange={(e) => handleRuleChange('operator', e.target.value as ConditionOperator)}
                            className="w-full p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 outline-none"
                        >
                            <option value=">=">&gt;= (Greater or Eq)</option>
                            <option value="<=">&lt;= (Less or Eq)</option>
                            <option value="==">== (Exact Match)</option>
                            <option value="!=">!= (Not Equal)</option>
                            <option value="has_item">has item</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">Value</label>
                        <input
                            type="text"
                            value={String(rule.value ?? '')}
                            onChange={(e) => handleRuleChange('value', isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                            placeholder="Value"
                            className="w-full p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 outline-none focus:border-amber-500/50"
                        />
                    </div>
                </div>

                {/* Output Ports True / False */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <div className="relative flex items-center justify-between bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> If TRUE
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="true"
                            className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-zinc-900 rounded-full -right-3"
                        />
                    </div>

                    <div className="relative flex items-center justify-between bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-500/20">
                        <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" /> If FALSE
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="false"
                            className="!w-3 !h-3 !bg-rose-400 !border-2 !border-zinc-900 rounded-full -right-3"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

ConditionNode.displayName = 'ConditionNode';