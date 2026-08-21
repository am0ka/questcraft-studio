'use client';

import { useGraphStore } from '@/store/useGraphStore';
import { QuestInterpreter } from '@questcraft/core-engine';
import { AnyNodeData, DialogueNodeData, QuestGraph, SimulatorRuntimeState } from '@questcraft/shared-types';
import { Backpack, CheckCircle2, Play, RotateCcw, Sparkles, Terminal, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Web Audio API click simulation (Zero External Assets)
const playBeep = () => {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch { }
};

export const QuestSimulator = () => {
    const { nodes, edges, setActiveSimulatorNode } = useGraphStore();

    const [runtimeState, setRuntimeState] = useState<SimulatorRuntimeState>({
        currentNodeId: null,
        isCompleted: false,
        playerState: {
            inventory: { gold: 120 },
            variables: { player_name: 'Geralt' },
            questFlags: {},
        },
        history: [],
    });

    const [isRunning, setIsRunning] = useState(false);
    const [displayedText, setDisplayedText] = useState('');

    // Convert ReactFlow nodes into the core engine format
    const currentGraph: QuestGraph = {
        id: 'runtime-graph',
        title: 'Live Preview',
        version: 1,
        rootNodeId: 'node-start',
        nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type === 'dialogueNode' ? 'dialogue' : n.type === 'conditionNode' ? 'condition' : 'action',
            position: n.position,
            data: n.data as AnyNodeData,
        })),
        edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
        })),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: 'Amir Sarsen',
        },
    };

    const handleStart = () => {
        playBeep();
        setDisplayedText('');
        const initialState = QuestInterpreter.startQuest(currentGraph, {
            inventory: { gold: 120 },
            variables: { player_name: 'Geralt' },
        });
        setRuntimeState(initialState);
        setIsRunning(true);
        setActiveSimulatorNode(initialState.currentNodeId);
    };

    const handleOptionSelect = (optionId: string) => {
        playBeep();
        setDisplayedText('');
        const nextState = QuestInterpreter.makeChoice(currentGraph, runtimeState, optionId);
        setRuntimeState(nextState);
        setActiveSimulatorNode(nextState.currentNodeId);
    };

    const currentNode = nodes.find((n) => n.id === runtimeState.currentNodeId);
    const dialogueData = currentNode?.data as DialogueNodeData | undefined;
    const messageText = dialogueData?.messageText;

    // Typewriter effect
    useEffect(() => {
        if (!messageText) {
            return;
        }
        let idx = 0;
        const timer = setInterval(() => {
            idx++;
            setDisplayedText(messageText.slice(0, idx));
            if (idx >= messageText.length) clearInterval(timer);
        }, 15);
        return () => clearInterval(timer);
    }, [messageText]);

    return (
        <div className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-800 text-zinc-200 select-none">
            {/* Header */}
            <div className="h-14 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">Live Simulator</span>
                    <Volume2 className="w-3.5 h-3.5 text-zinc-600 ml-1" />
                </div>

                <div>
                    {!isRunning ? (
                        <button
                            onClick={handleStart}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-sm"
                        >
                            <Play className="w-3.5 h-3.5 fill-white" /> Start Quest
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-md transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Simulator Body */}
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
                {!isRunning ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-800/80 rounded-2xl">
                        <Sparkles className="w-8 h-8 text-sky-400/80 mb-3 animate-pulse" />
                        <p className="text-sm font-semibold text-zinc-300">Ready to simulate quest</p>
                        <p className="text-xs text-zinc-500 max-w-xs mt-1">
                            Click &quot;Start Quest&quot; to test your dialogue tree in real-time.
                        </p>
                    </div>
                ) : runtimeState.isCompleted ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-emerald-500/20 bg-emerald-950/10 rounded-2xl">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                        <h3 className="text-sm font-bold text-emerald-300">Quest Branch Finished</h3>
                        <p className="text-xs text-zinc-400 mt-1">Reached end of narrative tree.</p>
                        <button
                            onClick={handleStart}
                            className="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            Replay Again
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* NPC Speech Box */}
                        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg min-h-[110px]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400" />
                                <span className="text-xs font-bold text-sky-300 uppercase tracking-wide">
                                    {dialogueData?.speakerName || 'Narrator'}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-zinc-200 font-serif">
                                &ldquo;{displayedText}&rdquo;
                            </p>
                        </div>

                        {/* Player Choice Buttons */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                                Your Response:
                            </span>
                            {dialogueData?.options?.map((opt, idx) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    className="w-full text-left p-3 text-xs font-medium rounded-xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-zinc-300 hover:text-white flex items-center gap-2 group"
                                >
                                    <span className="w-5 h-5 rounded-md bg-zinc-800 group-hover:bg-sky-500 group-hover:text-black flex items-center justify-center text-[10px] font-mono transition-colors">
                                        {idx + 1}
                                    </span>
                                    <span className="flex-1">{opt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Player Inventory & State Display */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold mb-2">
                        <Backpack className="w-3.5 h-3.5" /> Player State & Inventory
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/60 font-mono">
                            <span className="text-zinc-500">Gold: </span>
                            <span className="text-amber-400 font-bold">{runtimeState.playerState.inventory['gold'] ?? 0}g</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/60 font-mono">
                            <span className="text-zinc-500">Trophies/Items: </span>
                            <span className="text-sky-300">
                                {Object.keys(runtimeState.playerState.inventory).filter((k) => k !== 'gold').join(', ') || 'None'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};