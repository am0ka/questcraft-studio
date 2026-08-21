# ⚔️ QuestCraft Studio

> **High-Performance Visual Quest & Dialogue Graph IDE with Live Runtime Simulator and Native Game Engine Compilers.**

[![CI & Tests](https://github.com/am0ka/questcraft-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/am0ka/questcraft-studio/actions)
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](https://github.com/am0ka/questcraft-studio)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react)](https://react.dev/)
[![Coolify](https://img.shields.io/badge/Coolify-Railpack%20Ready-6B21A8.svg)](https://coolify.io/)

## 🌟 Overview

**QuestCraft Studio** is an end-to-end narrative game-tooling platform built for game designers, writers, and technical directors. It enables visual authoring of non-linear branching dialogue trees, condition-based branching logic, state mutations, real-time algorithmic linting via directed graph analysis, and instant compilation into **Unity (C# ScriptableObjects)** and **Godot 4 (GDScript)**.

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 16 FULLSTACK APPLICATION                     │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      Frontend Web Studio                       │   │
│   │ • React Flow (@xyflow/react) Canvas • Zustand (Undo / Redo)    │   │
│   │ • Interactive Live RPG Simulator   • Web Audio FX Synthesizer  │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────┴────────────────────────────────┐   │
│   │                     Next.js API Routes (/api)                  │   │
│   │ • /api/v1/graph/validate  • /api/v1/graph/export               │   │
│   │ • /api/v1/graph/generate-ai • /api/health                      │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────┴────────────────────────────────┐   │
│   │                 Headless Core Engine (lib/engine)              │   │
│   │ • Deterministic State Machine     • Graph Cycle & Dead-End     │   │
│   │ • Step-by-Step Narrative Runtime  • Unity & Godot Compilers    │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features & Engineering Highlights

### 1. 🎨 Visual Graph IDE (`components/canvas`)
* **Custom Interactive Nodes**:
  * **Dialogue Node**: Dynamic multi-choice branching, character avatars, speaker metadata.
  * **Condition Node**: Logical gate checking variables and inventory rules (`>=`, `==`, `has_item`) with dedicated `True` / `False` output ports.
  * **Action Node**: State mutators (rewards, gold payouts, inventory drops, event triggers).
* **State Architecture**: Reactive **Zustand** store with optimized 20-step snapshot **Undo / Redo** history stack.
* **Modern Tooling UI**: Cyberpunk / Unreal Engine dark theme with hardware-accelerated SVG connections.

### 2. ⚡ Deterministic Runtime Engine (`lib/engine`)
* **Zero-dependency State Machine**: Standalone TypeScript interpreter simulating player inventory, quest flags, and variable routing without UI rendering dependencies.
* **Live Simulator**:
  * Integrated RPG dialogue player with streaming **Typewriter Effect**.
  * Dynamic sound synthesis via **Web Audio API** (zero external mp3 assets required).
  * Real-time active node highlighting on the canvas.

### 3. 🔍 Algorithmic Graph Analysis & Validation
* **Cycle Detection**: Detects infinite cyclic dialogue loops without valid exit transitions.
* **Reachability (DFS/BFS)**: Identifies dangling nodes and dead branches disconnected from the root node.
* **Port Validation**: Ensures all condition handles and dialogue choices target existing nodes.

### 4. 🎮 Native Game Engine Compilers
* **Unity 3D / Unity 6**: Generates full `ScriptableObject` C# scripts with pre-baked graph node structures, serialized nested choices, and O(1) fast dictionary lookup (`GetNode(string id)`).
* **Godot 4.x**: Compiles graphs into native GDScript `Resource` classes with pre-structured dictionaries and transition lookups.
* **Compact JSON**: Clean standardized interchange format.

## 📂 Repository Structure

```text
questcraft-studio/
├── app/                         # Next.js 16 App Router & API Endpoints
│   ├── api/
│   │   ├── health/              # Healthcheck route (/api/health)
│   │   └── v1/graph/            # Validate, Export, and AI endpoints
│   ├── layout.tsx               # Root layout & theme configuration
│   └── page.tsx                 # Studio editor page
│
├── components/                  # React components
│   ├── canvas/                  # React Flow Canvas & Custom Nodes
│   └── simulator/               # Live RPG Simulator & Audio Engine
│
├── lib/
│   └── engine/                  # Headless Deterministic Engine & Compilers
│       ├── interpreter.ts       # RPG Runtime State Machine
│       ├── serializers.ts       # Unity C# & Godot GDScript Compilers
│       ├── validator.ts         # Algorithmic Graph Linter (DFS/BFS/Cycles)
│       └── __tests__/           # Vitest Unit Tests (100% Coverage)
│
├── types/                       # Canonical TypeScript Contracts & DTOs
├── store/                       # Zustand Store & Preset Templates
├── public/                      # Static Assets
└── package.json                 # Project scripts & dependencies
```

## 🛠️ Quickstart Guide

### Prerequisites
- Node.js: `v20+` (or `v24`)
- pnpm: `v9+` / `v11` (`corepack enable pnpm`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/am0ka/questcraft-studio.git
cd questcraft-studio

# Install dependencies
pnpm install
```

### 2. Run Locally in Development Mode
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Tests & Coverage
```bash
# Run unit tests
pnpm test

# Run tests with coverage report
pnpm test:coverage
```

### 4. Build & Start for Production
```bash
pnpm build
pnpm start
```

### 5. Deploy with Coolify (Railpack / Nixpacks)
Connect your repository in **Coolify**:
- **Build Pack**: Railpack / Nixpacks / Node.js
- **Install Command**: `pnpm install`
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Healthcheck Path**: `/api/health`
- **Port**: `3000`

## 🧪 Tech Stack Summary

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI & State**: React 19, React Flow (@xyflow/react), Zustand, Tailwind CSS v4, Lucide Icons
- **Engine & Compilers**: TypeScript 5.9, Directed Graph DFS/BFS Analyzer, Unity C# / Godot GDScript Serializers
- **Testing**: Vitest, V8 Coverage Provider
- **Deployment**: Coolify (Railpack / Nixpacks), GitHub Actions CI/CD

## 👨‍💻 Author
- 💼 [LinkedIn](https://www.linkedin.com/in/am0ka/)
- 🌐 [Portfolio](https://sarsen.dev/)
- 📧 [Email](mailto:amir@sarsen.dev)