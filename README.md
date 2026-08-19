# ⚔️ QuestCraft Studio

> **High-Performance Visual Quest & Dialogue Graph IDE with Live Runtime Simulator and Native Game Engine Compilers.**

[![CI & Tests](https://github.com/am0ka/questcraft-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/am0ka/questcraft-studio/actions)
[![Coverage](https://img.shields.io/badge/Coverage-98%25-brightgreen.svg)](https://github.com/am0ka/questcraft-studio)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444.svg?logo=turborepo)](https://turbo.build/)
[![uv](https://img.shields.io/badge/uv-Fast%20Python%20Tooling-purple.svg)](https://github.com/astral-sh/uv)

## 🌟 Overview

**QuestCraft Studio** is an end-to-end narrative game-tooling platform built for game designers, writers, and technical directors. It enables visual authoring of non-linear branching dialogue trees, condition-based branching logic, state mutations, real-time algorithmic linting via directed graph analysis, and instant compilation into **Unity (C# ScriptableObjects)** and **Godot 4 (GDScript)**.

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 (WEB STUDIO)                         │
│   • React Flow (@xyflow/react) Canvas  • Zustand Store (Undo / Redo)   │
│   • Interactive Live RPG Simulator     • Web Audio FX Synthesizer      │
└───────────────────┬─────────────────────────────────┬──────────────────┘
                    │                                 │
                    ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       @questcraft/core-engine        │  │       FASTAPI BACKEND        │
│ • Deterministic State Machine        │  │ • NetworkX Graph Analysis    │
│ • Step-by-Step Narrative Interpreter │  │ • Cycle & Dead-End Linter    │
│ • Multi-condition Boolean Evaluator  │  │ • Unity C# & Godot Compiler  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

## 🚀 Key Features & Engineering Highlights

### 1. 🎨 Visual Graph IDE (`apps/web`)
* **Custom Interactive Nodes**:
  * **Dialogue Node**: Dynamic multi-choice branching, character avatars, speaker metadata.
  * **Condition Node**: Logical gate checking variables and inventory rules (`>=`, `==`, `has_item`) with dedicated `True` / `False` output ports.
  * **Action Node**: State mutators (rewards, gold payouts, inventory drops, event triggers).
* **State Architecture**: Reactive **Zustand** store with optimized 20-step snapshot **Undo / Redo** history stack.
* **Modern Tooling UI**: Cyberpunk / Unreal Engine dark theme with hardware-accelerated SVG connections.

### 2. ⚡ Deterministic Runtime Engine (`packages/core-engine`)
* **Zero-dependency State Machine**: Standalone TypeScript interpreter simulating player inventory, quest flags, and variable routing without UI rendering dependencies.
* **Live Simulator**:
  * Integrated RPG dialogue player with streaming **Typewriter Effect**.
  * Dynamic sound synthesis via **Web Audio API** (zero external mp3 assets required).
  * Real-time active node highlighting on the canvas.

### 3. 🔍 Algorithmic Graph Analysis (`apps/api`)
* Uses **`NetworkX`** on the Python backend to convert user payloads into Directed Graphs (DiGraph).
* **Cycle Detection**: Detects infinite cyclic dialogue loops without valid exit transitions.
* **Reachability (DFS/BFS)**: Identifies dangling nodes and dead branches disconnected from the root node.
* **Port Validation**: Ensures all condition handles and dialogue choices target existing nodes.

### 4. 🎮 Native Game Engine Compilers
* **Unity 3D / Unity 6**: Generates full `ScriptableObject` C# scripts with pre-baked graph node structures, serialized nested choices, and O(1) fast dictionary lookup (`GetNode(string id)`).
* **Godot 4.x**: Compiles graphs into native GDScript `Resource` classes with pre-structured dictionaries and transition lookups.

## 📂 Repository Structure

```text
questcraft-studio/
├── apps/
│   ├── web/                     # Next.js 16 App Router, React Flow, Zustand, Tailwind
│   │   ├── app/                 # Main editor layout & styling
│   │   ├── components/          # Canvas, Nodes (Dialogue, Condition, Action), Simulator
│   │   └── store/               # Zustand store with template presets & history stack
│   │
│   └── api/                     # FastAPI Backend orchestrated with Astral uv
│       ├── app/
│       │   ├── api/v1/          # REST endpoints (/validate, /export, /generate-ai)
│       │   ├── schemas/         # Pydantic v2 data models
│       │   └── services/        # NetworkX graph linter & C# / GDScript codegen
│       └── main.py
│
├── packages/
│   ├── core-engine/             # Headless State Machine Interpreter & Serializers
│   ├── shared-types/            # Canonical TypeScript domain contracts & DTOs
│   ├── tsconfig/                # Strict TypeScript configuration presets
│   └── ui/                      # Shared design system primitives
│
├── pnpm-workspace.yaml          # Monorepo package boundary configuration
├── turbo.json                   # Turborepo task pipeline with intelligent caching
└── package.json                 # Root script orchestration
```
## 🛠️ Quickstart Guide
### Prerequisites
- Node.js: `v24`
- pnpm: `v11` (`corepack enable pnpm`)
- Python: `3.12`
- uv: `brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/am0ka/questcraft-studio.git
cd questcraft-studio

# Install monorepo JS/TS dependencies
pnpm install

# Setup isolated Python virtualenv and backend dependencies
cd apps/api && uv sync && cd ../..
```

### 2. Run All Services with a Single Command

```bash
pnpm dev
```

- 🌐 Web Studio: http://localhost:3000
- 📡 FastAPI Docs (Swagger UI): http://localhost:8000/docs

## 🧪 Tech Stack Summary

### Frontend
- TypeScript 5.4
- Next.js 14
- React Flow (@xyflow/react)
- Zustand
- Tailwind CSS
- Lucide Icons

### Backend API
- Python 3.11+
- FastAPI
- Pydantic v2
- Uvicorn
- NetworkX
- Astral uv

### Tooling & Monorepo
- Turborepo
- pnpm workspaces
- Web Audio API
- ESLint
- Prettier

### Code Generation
- C# (Unity 2022+ / Unity 6)
- GDScript (Godot 4.x)
- Compact JSON

## 👨‍💻 Author
- 💼 [LinkedIn](https://www.linkedin.com/in/am0ka/)
- 🌐 [Portfolio](https://sarsen.dev/)
- 📧 [Email](mailto:amir@sarsen.dev)