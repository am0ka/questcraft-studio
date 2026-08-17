'use client';

import { useGraphStore } from '@/store/useGraphStore';
import {
    BookOpen,
    Download,
    GitBranch,
    MessageSquarePlus,
    Redo,
    ShieldAlert,
    Undo,
    Zap
} from 'lucide-react';
import { useState } from 'react';

export const CanvasToolbar = () => {
    const {
        addDialogueNode,
        addConditionNode,
        addActionNode,
        loadTemplate,
        undo,
        redo,
        past,
        future,
    } = useGraphStore();

    const [isLinting, setIsLinting] = useState(false);


    return (
        <>
            <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur px-4 flex items-center justify-between select-none">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
                    <h1 className="font-bold text-sm text-zinc-100 tracking-wider flex items-center gap-1.5">
                        QUESTCRAFT <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono">STUDIO</span>
                    </h1>
                </div>

                {/* Node Creation Tools */}
                <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800/80">
                    <button
                        onClick={() => addDialogueNode()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5 text-sky-400" /> Dialogue
                    </button>

                    <button
                        onClick={() => addConditionNode()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                    >
                        <GitBranch className="w-3.5 h-3.5 text-amber-400" /> Condition
                    </button>

                    <button
                        onClick={() => addActionNode()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                    >
                        <Zap className="w-3.5 h-3.5 text-purple-400" /> Action
                    </button>

                    <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

                    <button
                        onClick={undo}
                        disabled={past.length === 0}
                        className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors"
                        title="Undo"
                    >
                        <Undo className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={future.length === 0}
                        className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors"
                        title="Redo"
                    >
                        <Redo className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Global Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadTemplate}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <BookOpen className="w-3.5 h-3.5" /> Load Preset
                    </button>

                    <button
                        onClick={() => null}
                        disabled={isLinting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors"
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {isLinting ? 'Linting...' : 'Lint Graph'}
                    </button>

                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                            <Download className="w-3.5 h-3.5" /> Export Code
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 w-44 z-50">
                            <button
                                onClick={() => null}
                                className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                                Unity C# ScriptableObject
                            </button>
                            <button
                                onClick={() => null}
                                className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                                Godot 4 GDScript
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};