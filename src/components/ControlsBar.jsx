import { Undo2, Wand2, Sparkles, RotateCcw } from 'lucide-react';

export default function ControlsBar({ onNewGame, onUndo, onAuto, moves, score }) {
  return (
    <div className="sticky top-0 z-20 w-full backdrop-blur bg-white/70 border-b border-white/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-md"><Sparkles size={18} /></span>
          <div>
            <p className="text-sm text-gray-500">Moves</p>
            <p className="-mt-1 text-xl font-bold text-gray-800">{moves}</p>
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Score</p>
            <p className="-mt-1 text-xl font-bold text-gray-800">{score}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onNewGame} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 shadow hover:shadow-md">
            <RotateCcw size={16} /> New Game
          </button>
          <button onClick={onUndo} className="inline-flex items-center gap-2 rounded-md bg-white text-gray-700 px-3 py-2 shadow border">
            <Undo2 size={16} /> Undo
          </button>
          <button onClick={onAuto} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-amber-400 to-pink-500 text-white px-3 py-2 shadow hover:shadow-md">
            <Wand2 size={16} /> Auto-Move
          </button>
        </div>
      </div>
    </div>
  );
}
