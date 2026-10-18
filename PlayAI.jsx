import { useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Board from '../components/Board.jsx';
import { bestMove } from '../lib/engine';
import { addCoins } from '../lib/coins';
import { useMe } from '../lib/me';
import { ITEM } from '../data/shopItems';

const LEVELS = {
  Easy: { skill: 1, coins: 100 },
  Medium: { skill: 8, coins: 150 },
  Hard: { skill: 15, coins: 200 },
  Impossible: { skill: 20, coins: 200 },
};

export default function PlayAI() {
  const { uid, me } = useMe();
  const game = useRef(new Chess());
  const [, tick] = useState(0);
  const [level, setLevel] = useState('Medium');
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const refresh = () => tick((n) => n + 1);

  function end() {
    const g = game.current;
    if (!g.isGameOver()) return false;
    if (g.isCheckmate() && g.turn() === 'b') {
      const reward = g.history().length >= 10 ? LEVELS[level].coins : 0;
      if (reward) addCoins(uid, reward);
      setResult({ won: true, text: reward ? `You won! +${reward} coins` : 'You won! Games under 5 moves earn no coins.' });
    } else if (g.isCheckmate()) setResult({ text: 'You lost this one. Try again!' });
    else setResult({ text: 'Draw.' });
    return true;
  }

  async function reply() {
    setBusy(true);
    const g = game.current;
    const uci = await bestMove(g.fen(), LEVELS[level].skill);
    let ok = false;
    if (uci) {
      try {
        ok = !!g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' });
      } catch {}
    }
    if (!ok) {
      const ms = g.moves();
      g.move(ms[Math.floor(Math.random() * ms.length)]);
    }
    setBusy(false);
    refresh();
    end();
  }

  function onSquare(sq) {
    const g = game.current;
    if (busy || result || g.turn() !== 'w') return;
    if (sel && sel !== sq) {
      try {
        if (g.move({ from: sel, to: sq, promotion: 'q' })) {
          setSel(null);
          refresh();
          if (!end()) reply();
          return;
        }
      } catch {}
    }
    const p = g.get(sq);
    setSel(p && p.color === 'w' ? sq : null);
  }

  function reset() {
    game.current = new Chess();
    setSel(null);
    setResult(null);
    refresh();
  }

  const targets = sel ? game.current.moves({ square: sel, verbose: true }).map((m) => m.to) : [];
  const fin = result?.won && ITEM[me.equipped?.finisher];

  return (
    <>
      <div className="row">
        <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={game.current.history().length > 0 && !result} style={{ width: 'auto' }}>
          {Object.keys(LEVELS).map((l) => <option key={l}>{l}</option>)}
        </select>
        <button className="ghost" onClick={reset}>New game</button>
        <span className="mut">{busy ? 'Computer is thinking…' : result ? '' : 'Your move (white)'}</span>
      </div>
      <Board game={game.current} sel={sel} targets={targets} onSquare={onSquare} equipped={me.equipped} />
      {result && <div className="card"><strong>{result.text}</strong></div>}
      {fin && <div className="fin">{fin.glyph}</div>}
    </>
  );
}
