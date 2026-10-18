import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { Chess } from 'chess.js';
import { db } from '../firebase';
import Board from '../components/Board.jsx';
import { useMe } from '../lib/me';
import { ITEM, getItem } from '../data/shopItems';
import { rankOf } from '../data/ranks';
import { joinQueue, leaveQueue, touchQueue, watchQueue, tryMatch, sendMove, resign, settle, timeoutGame, sendEmote } from '../lib/online';

export default function PlayOnline() {
  const { id } = useParams();
  return id ? <Game id={id} key={id} /> : <Lobby />;
}

function Lobby() {
  const { uid, me } = useMe();
  const nav = useNavigate();
  const [searching, setSearching] = useState(false);
  const placing = (me.games ?? 10) < 10;

  useEffect(() => {
    if (!searching) return;
    let done = false;
    const go = (gid) => {
      if (done) return;
      done = true;
      nav('/online/' + gid);
    };
    const unsub = watchQueue(uid, (d) => d?.gameId && go(d.gameId));
    const poll = async () => {
      await touchQueue(uid);
      const gid = await tryMatch(uid, me);
      if (gid) go(gid);
    };
    joinQueue(uid, me).then(poll);
    const t = setInterval(poll, 3000);
    return () => {
      clearInterval(t);
      unsub();
      leaveQueue(uid);
    };
  }, [searching]);

  return (
    <div className="card">
      <h2>Play online</h2>
      {placing && <p className="coin">Placement: {me.games ?? 0} of 10 games played. Finish 10 to get your starting rank.</p>}
      {!searching ? (
        <>
          <p className="mut">10 minutes each. We pair you with a player at your level. Win 300 coins, draw 100, lose 50. Coins are never taken from your opponent.</p>
          <button onClick={() => setSearching(true)}>Find a match</button>
        </>
      ) : (
        <>
          <p>Looking for an opponent…</p>
          <div className="row">
            <button className="ghost" onClick={() => setSearching(false)}>Cancel</button>
            <Link className="btn ghost" to="/play">Play the computer instead</Link>
          </div>
        </>
      )}
    </div>
  );
}

const fmt = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Game({ id }) {
  const { uid, me } = useMe();
  const [g, setG] = useState(null);
  const [sel, setSel] = useState(null);
  const [res, setRes] = useState(null);
  const [now, setNow] = useState(Date.now());
  const flagged = useRef(false);

  useEffect(() => onSnapshot(doc(db, 'games', id), (s) => setG(s.exists() ? s.data() : false)), [id]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (g && g.status === 'done') settle(uid, id).then((r) => r && setRes(r)).catch(() => {});
  }, [g && g.status]);
  useEffect(() => {
    if (!g || g.status !== 'active' || flagged.current) return;
    const turn = g.moves.length % 2 === 0 ? 'w' : 'b';
    if (g.clock[turn] - (now - g.turnStartedAt) <= 0) {
      flagged.current = true;
      timeoutGame(id, turn);
    }
  }, [now, g]);

  if (g === null) return <div className="mut">Loading game…</div>;
  if (g === false) return <div className="card">Game not found. <Link to="/online">Back</Link></div>;

  const chess = new Chess();
  g.moves.forEach((m) => chess.move(m));
  const mine = g.white === uid ? 'w' : 'b';
  const theirs = mine === 'w' ? 'b' : 'w';
  const oppName = g.names[g.white === uid ? g.black : g.white];
  const done = g.status === 'done';
  const turn = g.moves.length % 2 === 0 ? 'w' : 'b';
  const myTurn = !done && turn === mine;
  const won = done && g.winnerColor === mine;
  const targets = sel ? chess.moves({ square: sel, verbose: true }).map((m) => m.to) : [];
  const fin = won && ITEM[me.equipped?.finisher];
  const left = (c) => Math.max(0, g.clock[c] - (!done && turn === c ? now - g.turnStartedAt : 0));
  const emotes = (me.owned || []).map(getItem).filter((i) => i?.type === 'emote');
  const em = g.emote && now - g.emote.ts < 4000 ? ITEM[g.emote.id] : null;

  function onSquare(sq) {
    if (!myTurn) return;
    if (sel && sel !== sq) {
      try {
        const m = chess.move({ from: sel, to: sq, promotion: 'q' });
        if (m) {
          setSel(null);
          sendMove(id, chess, [...g.moves, m.san], g);
          return;
        }
      } catch {}
    }
    const p = chess.get(sq);
    setSel(p && p.color === mine ? sq : null);
  }

  const status = done
    ? g.winnerColor == null ? 'Draw.'
      : won ? (g.result === 'timeout' ? 'You won on time!' : g.result === 'resign' ? 'Your opponent resigned. You won!' : 'You won!')
      : g.result === 'timeout' ? 'You ran out of time.' : 'You lost.'
    : myTurn ? 'Your move' : `Waiting for ${oppName}…`;

  return (
    <>
      <div className="row">
        <strong>{oppName}</strong>
        <span className="badge">{fmt(left(theirs))}</span>
      </div>
      <Board game={chess} sel={sel} targets={targets} onSquare={onSquare} equipped={me.equipped} myColor={mine} flip={mine === 'b'} />
      <div className="row">
        <strong>You ({mine === 'w' ? 'white' : 'black'})</strong>
        <span className="badge">{fmt(left(mine))}</span>
        <span className="mut">{status}</span>
      </div>
      {em && <div className="bubble">{g.names[g.emote.uid]}: {em.glyph} {em.name}</div>}
      {!done && (
        <div className="row">
          {emotes.map((e) => <button key={e.id} className="ghost" title={e.name} onClick={() => sendEmote(id, uid, e.id)}>{e.glyph}</button>)}
          <button className="ghost" onClick={() => resign(id, mine)}>Resign</button>
        </div>
      )}
      {done && (
        <div className="card">
          <strong>{status}</strong>
          {res && (
            <p>
              {res.coins ? `+${res.coins} coins` : 'Games under 5 moves earn no coins'}
              {res.placing ? ` · Placement ${res.games} of 10` : ` · ${res.dRp > 0 ? '+' : ''}${res.dRp} rank points`}
              {res.placed ? ` · You are placed at ${rankOf(res.rp).label}!` : ''}
              {res.bonus ? ` · Rank up! +${res.bonus} coins` : ''}
              {res.unlock?.length ? ` · Unlocked: ${res.unlock.map((u) => getItem(u).name).join(', ')}` : ''}
            </p>
          )}
          <Link className="btn" to="/online">Play again</Link>
        </div>
      )}
      {fin && <div className="fin">{fin.glyph}</div>}
    </>
  );
}
