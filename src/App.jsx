import { useState } from 'react';
import HeroCover from './components/HeroCover';
import ControlsBar from './components/ControlsBar';
import GameBoard from './components/GameBoard';
import FooterMagic from './components/FooterMagic';

export default function App() {
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [api, setApi] = useState({ newGame: () => {}, undo: () => {}, auto: () => {} });

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-amber-50 text-gray-800">
      <HeroCover />
      <ControlsBar 
        onNewGame={() => api.newGame?.()} 
        onUndo={() => api.undo?.()} 
        onAuto={() => api.auto?.()} 
        moves={moves} 
        score={score} 
      />
      <main className="py-8">
        <GameBoard 
          onStats={(m, s) => { setMoves(m); setScore(s); }}
          provideApi={(handlers) => setApi(handlers)}
        />
      </main>
      <FooterMagic />
    </div>
  );
}
