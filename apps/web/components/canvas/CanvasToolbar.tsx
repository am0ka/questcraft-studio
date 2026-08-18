'use client';

import { useGraphStore } from '@/store/useGraphStore';
import { GraphValidationError, GraphValidationResult } from '@questcraft/shared-types';
import {
    AlertTriangle,
    BookOpen,
    Check,
    CheckCircle2,
    Copy,
    Download,
    GitBranch,
    MessageSquarePlus,
    Redo,
    ShieldAlert,
    Sparkles,
    Undo,
    X,
    Zap,
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
        nodes,
        edges,
    } = useGraphStore();

    const [isLinting, setIsLinting] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [lintResults, setLintResults] = useState<GraphValidationResult | null>(null);
    const [exportModal, setExportModal] = useState<{ fileName: string; code: string; engine: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const getPayload = () => ({
        id: 'quest-main',
        title: 'The Witcher Contract Arc',
        rootNodeId: 'node-start',
        nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data, position: n.position })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    });

    const handleLintGraph = async () => {
        setIsLinting(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/graph/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(getPayload()),
            });
            const data = await res.json();
            setLintResults(data);
        } catch {
            alert('FastAPI server is offline. Run: uv run uvicorn main:app --reload in apps/api');
        } finally {
            setIsLinting(false);
        }
    };

    const handleGenerateAI = async () => {
        setIsGeneratingAI(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/graph/generate-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Cyberpunk illegal augments deal', speakerName: 'Fixer Jack' }),
            });
            const aiData = await res.json();
            addDialogueNode();
            alert(`AI generated branch from ${aiData.speaker}: "${aiData.message}"`);
        } catch {
            addDialogueNode();
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleExport = async (engine: string) => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/graph/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ graph: getPayload(), targetEngine: engine }),
            });
            const data = await res.json();
            setExportModal({ fileName: data.fileName, code: data.code, engine });
        } catch {
            alert('Export failed. Ensure backend is running.');
        }
    };

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

                    <button
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/30 hover:bg-fuchsia-900/40 rounded-md transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> {isGeneratingAI ? 'AI...' : 'AI Branch'}
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
                        onClick={handleLintGraph}
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
                                onClick={() => handleExport('unity_csharp')}
                                className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                                Unity C# ScriptableObject
                            </button>
                            <button
                                onClick={() => handleExport('godot_gdscript')}
                                className="text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                                Godot 4 GDScript
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Lint Modal */}
            {lintResults && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {lintResults.isValid ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                                <h3 className="text-sm font-bold text-zinc-100">
                                    {lintResults.isValid ? 'Graph is Valid & Production-Ready' : 'Graph Validation Warnings'}
                                </h3>
                            </div>
                            <button onClick={() => setLintResults(null)} className="text-zinc-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {lintResults.errors?.length === 0 ? (
                                <p className="text-xs text-zinc-400">All paths, conditions and edges are valid.</p>
                            ) : (
                                lintResults.errors?.map((err: GraphValidationError, i: number) => (
                                    <div
                                        key={i}
                                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${err.severity === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                            }`}
                                    >
                                        <span className="font-mono font-bold uppercase shrink-0">[{err.code}]</span>
                                        <span>{err.message}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setLintResults(null)}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {exportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-100">Exported Asset: {exportModal.fileName}</h3>
                                <span className="text-[11px] text-zinc-500 uppercase tracking-wide">Target: {exportModal.engine}</span>
                            </div>
                            <button onClick={() => setExportModal(null)} className="text-zinc-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative">
                            <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 select-all">
                                {exportModal.code}
                            </pre>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(exportModal.code);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <button
                            onClick={() => setExportModal(null)}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};