'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { MessageSquare, Plus, Trash2, User } from 'lucide-react';
import { DialogueNodeData } from '@/types';
import { useGraphStore } from '@/store/useGraphStore';

export const DialogueNode = memo(({ id, data, selected }: NodeProps<Node<DialogueNodeData>>) => {
    const updateNodeData = useGraphStore((s) => s.updateNodeData);
    const deleteNode = useGraphStore((s) => s.deleteNode);
    const activeSimulatorNodeId = useGraphStore((s) => s.activeSimulatorNodeId);

    const isActiveInSimulator = activeSimulatorNodeId === id;

    const handleSpeakerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { speakerName: e.target.value });
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData(id, { messageText: e.target.value });
    };

    const handleAddOption = () => {
        const newOptions = [
            ...data.options,
            { id: `opt-${Date.now()}`, text: 'New choice response' },
        ];
        updateNodeData(id, { options: newOptions });
    };

    const handleOptionTextChange = (optId: string, text: string) => {
        const newOptions = data.options.map((opt) =>
            opt.id === optId ? { ...opt, text } : opt
        );
        updateNodeData(id, { options: newOptions });
    };

    const handleDeleteOption = (optId: string) => {
        if (data.options.length <= 1) return;
        const newOptions = data.options.filter((opt) => opt.id !== optId);
        updateNodeData(id, { options: newOptions });
    };

    return (
        <div
            className={`relative w-80 rounded-xl bg-zinc-900/95 border transition-all duration-200 shadow-2xl backdrop-blur-md ${isActiveInSimulator
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                    : selected
                        ? 'border-sky-400 ring-2 ring-sky-400/30'
                        : 'border-zinc-800 hover:border-zinc-700'
                }`}
        >
            {/* Input Handle (Target) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-zinc-900 rounded-full hover:scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-800/60 rounded-t-xl border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">Dialogue Node</span>
                </div>
                <button
                    onClick={() => deleteNode(id)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                    title="Delete Node"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-3">
                {/* Speaker Name */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
                    <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={data.speakerName}
                        onChange={handleSpeakerChange}
                        placeholder="Speaker (e.g. NPC Name)"
                        className="w-full bg-transparent text-xs font-medium text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                </div>

                {/* Message Input */}
                <div>
                    <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">NPC Dialogue Line</label>
                    <textarea
                        rows={3}
                        value={data.messageText}
                        onChange={handleMessageChange}
                        placeholder="Enter dialogue text..."
                        className="w-full p-2 text-xs bg-zinc-950/70 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 resize-none outline-none focus:border-sky-500/50 transition-colors"
                    />
                </div>

                {/* Player Choices (Options) */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-semibold uppercase text-zinc-500">Player Choices ({data.options.length})</label>
                        <button
                            onClick={handleAddOption}
                            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium"
                        >
                            <Plus className="w-3 h-3" /> Add Choice
                        </button>
                    </div>

                    <div className="space-y-2">
                        {data.options.map((opt, idx) => (
                            <div key={opt.id} className="relative flex items-center gap-1.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60">
                                <span className="text-[10px] font-mono text-zinc-500 w-4">{idx + 1}.</span>
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                                    className="flex-1 bg-transparent text-xs text-zinc-300 outline-none focus:text-white"
                                />
                                {data.options.length > 1 && (
                                    <button
                                        onClick={() => handleDeleteOption(opt.id)}
                                        className="text-zinc-600 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Output port for this specific choice (Source Handle) */}
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={opt.id}
                                    className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-zinc-900 rounded-full -right-3.5 hover:scale-125 transition-transform"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

DialogueNode.displayName = 'DialogueNode';