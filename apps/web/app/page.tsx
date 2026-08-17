import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { QuestCanvas } from '@/components/canvas/QuestCanvas';

export default function Home() {
  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden bg-zinc-950">
      <CanvasToolbar />
      <div className="flex-1 w-full h-full flex overflow-hidden">
        <section className="flex-1 h-full relative">
          <QuestCanvas />
        </section>
      </div>
    </main>
  );
}