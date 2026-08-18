import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { QuestCanvas } from '@/components/canvas/QuestCanvas';
import { QuestSimulator } from '@/components/simulator/QuestSimulator';

export default function Home() {
  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden bg-zinc-950">
      <CanvasToolbar />
      <div className="flex-1 w-full h-full flex overflow-hidden">
        {/* Left Side: Node Canvas Editor (65%) */}
        <section className="flex-1 h-full relative">
          <QuestCanvas />
        </section>

        {/* Right Side: Interactive RPG Simulator (35%) */}
        <aside className="w-[380px] lg:w-[420px] h-full shrink-0">
          <QuestSimulator />
        </aside>
      </div>
    </main>
  );
}