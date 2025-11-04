import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Card helpers
const SUITS = ['♠', '♥', '♦', '♣'];
const COLORS = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' };
const VALUES = [
  { v: 1, l: 'A' },
  { v: 2, l: '2' },
  { v: 3, l: '3' },
  { v: 4, l: '4' },
  { v: 5, l: '5' },
  { v: 6, l: '6' },
  { v: 7, l: '7' },
  { v: 8, l: '8' },
  { v: 9, l: '9' },
  { v: 10, l: '10' },
  { v: 11, l: 'J' },
  { v: 12, l: 'Q' },
  { v: 13, l: 'K' },
];

function newDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const { v, l } of VALUES) {
      deck.push({ id: `${s}${v}`, suit: s, value: v, label: l, faceUp: false });
    }
  }
  // shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function serializeState(state) {
  return JSON.stringify(state);
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function cardBg(suit, faceUp) {
  if (!faceUp) return 'bg-gradient-to-br from-violet-500 to-fuchsia-500';
  return COLORS[suit] === 'red'
    ? 'bg-gradient-to-br from-rose-50 to-pink-100 border-rose-300'
    : 'bg-gradient-to-br from-sky-50 to-cyan-100 border-cyan-300';
}

function canMoveToFoundation(card, foundations) {
  const f = foundations[card.suit];
  const needed = (f.length === 0) ? 1 : f[f.length - 1].value + 1;
  return card.value === needed;
}

function canPlaceOnTableau(card, column) {
  if (column.length === 0) return card.value === 13; // King on empty
  const top = column[column.length - 1];
  if (!top.faceUp) return false;
  const alternating = COLORS[top.suit] !== COLORS[card.suit];
  return alternating && card.value === top.value - 1;
}

export default function GameBoard({ onStats, provideApi }) {
  const [state, setState] = useState(() => dealGame());
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null); // { from: 'waste'|'tX'|'f♠', card }
  const [moves, setMoves] = useState(0);
  const score = useMemo(() => calcScore(state), [state]);

  useEffect(() => {
    if (typeof onStats === 'function') onStats(moves, score);
  }, [moves, score, onStats]);

  useEffect(() => {
    if (typeof provideApi === 'function') {
      provideApi({ newGame, undo, auto: autoMove });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dealGame() {
    const deck = newDeck();
    const tableaus = Array.from({ length: 7 }, () => []);
    // deal 1..7, last card face up
    for (let col = 0; col < 7; col++) {
      for (let r = 0; r <= col; r++) {
        const card = deck.pop();
        card.faceUp = r === col;
        tableaus[col].push(card);
      }
    }
    return {
      stock: deck, // remaining cards
      waste: [],
      foundations: { '♠': [], '♥': [], '♦': [], '♣': [] },
      tableaus,
    };
  }

  function pushHistory(s) {
    setHistory((h) => [...h, serializeState(s)]);
  }

  function newGame() {
    const ng = dealGame();
    setState(ng);
    setHistory([]);
    setSelected(null);
    setMoves(0);
  }

  function undo() {
    setSelected(null);
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = JSON.parse(h[h.length - 1]);
      setState(prev);
      setMoves((m) => Math.max(0, m - 1));
      return h.slice(0, -1);
    });
  }

  function drawFromStock() {
    if (state.stock.length === 0) {
      if (state.waste.length === 0) return;
      // recycle waste back to stock (face down)
      const newS = cloneState(state);
      newS.stock = state.waste.map((c) => ({ ...c, faceUp: false })).reverse();
      newS.waste = [];
      pushHistory(state);
      setState(newS);
      setSelected(null);
      setMoves((m) => m + 1);
      return;
    }
    const newS = cloneState(state);
    const card = newS.stock.pop();
    card.faceUp = true;
    newS.waste.push(card);
    pushHistory(state);
    setState(newS);
    setSelected({ from: 'waste', card });
    setMoves((m) => m + 1);
  }

  function tryMoveToFoundation(source) {
    const newS = cloneState(state);
    let card;
    if (source === 'waste') {
      card = newS.waste[newS.waste.length - 1];
      if (!card) return false;
      if (!canMoveToFoundation(card, newS.foundations)) return false;
      newS.waste.pop();
    } else if (source.startsWith('t')) {
      const idx = parseInt(source.slice(1));
      const col = newS.tableaus[idx];
      if (col.length === 0) return false;
      card = col[col.length - 1];
      if (!card.faceUp || !canMoveToFoundation(card, newS.foundations)) return false;
      col.pop();
      // flip next card if needed
      const next = col[col.length - 1];
      if (next && !next.faceUp) next.faceUp = true;
    } else {
      return false;
    }
    newS.foundations[card.suit].push(card);
    pushHistory(state);
    setState(newS);
    setSelected(null);
    setMoves((m) => m + 1);
    return true;
  }

  function selectFromWaste() {
    if (state.waste.length === 0) return;
    const card = state.waste[state.waste.length - 1];
    setSelected({ from: 'waste', card });
  }

  function selectFromTableau(colIdx, cardIdx) {
    const col = state.tableaus[colIdx];
    const card = col[cardIdx];
    if (!card.faceUp) {
      // flip top facedown if clicked
      if (cardIdx === col.length - 1) {
        const newS = cloneState(state);
        newS.tableaus[colIdx][cardIdx].faceUp = true;
        pushHistory(state);
        setState(newS);
        setMoves((m) => m + 1);
      }
      return;
    }
    // Only allow moving the top face-up card for simplicity
    if (cardIdx !== col.length - 1) return;
    setSelected({ from: `t${colIdx}`, card });
  }

  function placeOnTableau(targetIdx) {
    if (!selected) return;
    const newS = cloneState(state);
    const target = newS.tableaus[targetIdx];
    if (!canPlaceOnTableau(selected.card, target)) return;

    if (selected.from === 'waste') {
      newS.waste.pop();
    } else if (selected.from.startsWith('t')) {
      const srcIdx = parseInt(selected.from.slice(1));
      newS.tableaus[srcIdx].pop();
      const next = newS.tableaus[srcIdx][newS.tableaus[srcIdx].length - 1];
      if (next && !next.faceUp) next.faceUp = true;
    } else {
      return;
    }
    target.push(selected.card);
    pushHistory(state);
    setState(newS);
    setSelected(null);
    setMoves((m) => m + 1);
  }

  function autoMove() {
    // simple auto: try moving waste and all tableau tops to foundations where possible
    let moved = false;
    let newS = cloneState(state);
    function attempt() {
      // waste first
      const w = newS.waste[newS.waste.length - 1];
      if (w && canMoveToFoundation(w, newS.foundations)) {
        newS.waste.pop();
        newS.foundations[w.suit].push(w);
        return true;
      }
      // tableaus
      for (let i = 0; i < 7; i++) {
        const col = newS.tableaus[i];
        const top = col[col.length - 1];
        if (top && top.faceUp && canMoveToFoundation(top, newS.foundations)) {
          col.pop();
          newS.foundations[top.suit].push(top);
          const next = col[col.length - 1];
          if (next && !next.faceUp) next.faceUp = true;
          return true;
        }
      }
      return false;
    }
    while (attempt()) {
      moved = true;
    }
    if (moved) {
      pushHistory(state);
      setState(newS);
      setSelected(null);
      setMoves((m) => m + 1);
    }
  }

  const won = useMemo(() => {
    const total = Object.values(state.foundations).reduce((a, f) => a + f.length, 0);
    return total === 52;
  }, [state.foundations]);

  useEffect(() => {
    if (won) {
      // simple celebratory glow via class toggle
      const t = setTimeout(() => {}, 2000);
      return () => clearTimeout(t);
    }
  }, [won]);

  return (
    <section id="game" className="relative mx-auto max-w-6xl px-4">
      <div className="mt-10 grid grid-cols-12 gap-4">
        {/* Top row: Stock, Waste, Foundations */}
        <div className="col-span-12 grid grid-cols-12 gap-4">
          <div className="col-span-4 flex items-start gap-4">
            <CardSlot onClick={drawFromStock} highlight className="w-24 h-36" label="Stock">
              <CardBack />
              {state.stock.length === 0 && (
                <div className="absolute inset-0 grid place-items-center text-xs text-gray-500">Recycle</div>
              )}
            </CardSlot>
            <CardSlot onClick={selectFromWaste} className="w-24 h-36" label="Waste">
              <AnimatePresence>
                {state.waste.length > 0 && (
                  <motion.div key={state.waste[state.waste.length - 1].id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card card={state.waste[state.waste.length - 1]} selected={selected?.from === 'waste'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardSlot>
          </div>
          <div className="col-span-8 grid grid-cols-4 gap-4 justify-items-end">
            {SUITS.map((s) => (
              <CardSlot key={s} className="w-24 h-36" label={`Foundation ${s}`}>
                <AnimatePresence>
                  {state.foundations[s].length > 0 && (
                    <motion.div key={state.foundations[s][state.foundations[s].length - 1].id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <Card card={state.foundations[s][state.foundations[s].length - 1]} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardSlot>
            ))}
          </div>
        </div>

        {/* Tableaus */}
        <div className="col-span-12 grid grid-cols-7 gap-3 mt-4">
          {state.tableaus.map((col, i) => (
            <div key={i} className="relative">
              <CardSlot className="w-24" tall onClick={() => placeOnTableau(i)} label={`T${i + 1}`}>
                <div className="relative" style={{ height: Math.max(144, 24 * col.length + 144) }}>
                  {col.map((card, idx) => (
                    <motion.div
                      key={card.id}
                      layout
                      className="absolute left-0 right-0"
                      style={{ top: idx * 24 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div onClick={() => selectFromTableau(i, idx)}>
                        <Card card={card} selected={selected?.from === `t${i}` && selected.card.id === card.id} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardSlot>
            </div>
          ))}
        </div>

        {/* Quick actions under board */}
        <div className="col-span-12 mt-6 flex flex-wrap items-center gap-3">
          <button onClick={() => tryMoveToFoundation('waste')} className="rounded-md bg-white px-3 py-2 border shadow text-sm">Move Waste → Foundation</button>
          <button onClick={() => {
            for (let i = 0; i < 7; i++) { if (tryMoveToFoundation(`t${i}`)) break; }
          }} className="rounded-md bg-white px-3 py-2 border shadow text-sm">Move Tableau → Foundation</button>
          <button onClick={autoMove} className="rounded-md bg-gradient-to-r from-amber-400 to-pink-500 text-white px-3 py-2 shadow text-sm">Auto-Move</button>
        </div>

        {won && (
          <div className="col-span-12 mt-8 rounded-2xl bg-gradient-to-r from-fuchsia-500/90 to-violet-500/90 p-8 text-white text-center shadow-xl">
            <h2 className="text-3xl font-extrabold">You won!✨</h2>
            <p className="mt-2 text-white/90">A cascade of joy fills the realm. Shuffle and play again?</p>
            <div className="mt-4">
              <button onClick={newGame} className="rounded-md bg-white/10 px-4 py-2 ring-1 ring-white/50">New Game</button>
            </div>
          </div>
        )}
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <Fab onClick={undo} label="Undo" />
        <Fab onClick={newGame} label="Shuffle" />
      </div>

      {/* Stats badges */}
      <div className="mt-8 flex items-center gap-4">
        <Badge label={`Moves: ${moves}`} />
        <Badge label={`Score: ${score}`} />
      </div>
    </section>
  );
}

function calcScore(state) {
  // Simple score: 10 per foundation card + 2 per face-up tableau card
  const foundationCount = Object.values(state.foundations).reduce((a, f) => a + f.length, 0);
  const faceUp = state.tableaus.reduce((a, col) => a + col.filter((c) => c.faceUp).length, 0);
  return foundationCount * 10 + faceUp * 2;
}

function CardSlot({ children, className = '', label, onClick, highlight = false, tall = false }) {
  return (
    <div className={`relative ${tall ? 'min-h-[360px] h-full' : ''}`}>
      <div
        onClick={onClick}
        className={`relative ${className} select-none rounded-xl border-2 border-dashed bg-white/60 backdrop-blur p-2 shadow-sm transition hover:border-violet-400 ${highlight ? 'border-violet-300' : 'border-white/70'}`}
      >
        <div className="relative w-full h-full grid place-items-start">
          {children}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function Card({ card, selected }) {
  const isRed = COLORS[card.suit] === 'red';
  const faceUp = card.faceUp;
  return (
    <div
      className={`relative w-24 h-36 rounded-xl border ${cardBg(card.suit, faceUp)} ${faceUp ? 'border-opacity-80' : 'border-transparent'} shadow-md overflow-hidden`}
    >
      {faceUp ? (
        <div className="absolute inset-0 p-2">
          <div className="flex items-start justify-between">
            <div className={`text-sm font-bold ${isRed ? 'text-rose-600' : 'text-gray-800'}`}>{card.label}</div>
            <div className={`text-sm ${isRed ? 'text-rose-600' : 'text-gray-800'}`}>{card.suit}</div>
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <div className={`text-3xl ${isRed ? 'text-rose-500' : 'text-gray-700'}`}>{card.suit}</div>
          </div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">{card.id}</div>
          {selected && <div className="absolute inset-0 ring-2 ring-fuchsia-500 rounded-xl pointer-events-none" />}
        </div>
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
        </div>
      )}
    </div>
  );
}

function CardBack() {
  return (
    <div className="relative w-24 h-36 rounded-xl border border-white/80 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 shadow-md overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,white,transparent_40%),radial-gradient(circle_at_70%_70%,white,transparent_40%)]" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-3xl text-white drop-shadow">✦</span>
      </div>
    </div>
  );
}

function Fab({ onClick, label }) {
  return (
    <button onClick={onClick} className="rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white px-4 py-2 shadow-lg">
      {label}
    </button>
  );
}

function Badge({ label }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-sm text-gray-700 shadow border">
      {label}
    </span>
  );
}
