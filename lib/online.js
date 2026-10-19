import {
  doc, collection, getDocs, query, orderBy, limit, runTransaction,
  setDoc, deleteDoc, updateDoc, onSnapshot, serverTimestamp, increment, arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import { tierOf, placementRp } from '../data/ranks';

const qref = (uid) => doc(db, 'queue', uid);
const CLOCK = 10 * 60 * 1000; 

export const joinQueue = (uid, me) =>
  setDoc(qref(uid), { uid, name: me.name, hr: me.hr ?? 1000, ts: Date.now(), gameId: null });
export const leaveQueue = (uid) => deleteDoc(qref(uid)).catch(() => {});
export const touchQueue = (uid) => updateDoc(qref(uid), { ts: Date.now() }).catch(() => {});
export const watchQueue = (uid, cb) => onSnapshot(qref(uid), (s) => cb(s.data()));
export async function tryMatch(uid, me) {
  const snap = await getDocs(query(collection(db, 'queue'), orderBy('ts'), limit(25)));
  const now = Date.now();
  const myHr = me.hr ?? 1000;
  const list = snap.docs
    .map((d) => d.data())
    .filter((d) => d.uid !== uid && !d.gameId && now - d.ts < 60000)
    .sort((a, b) => Math.abs(a.hr - myHr) - Math.abs(b.hr - myHr));
  if (!list.length) return null;
  const opp = list[0];
  const gref = doc(collection(db, 'games'));
  try {
    await runTransaction(db, async (tx) => {
      const mine = await tx.get(qref(uid));
      const theirs = await tx.get(qref(opp.uid));
      if (!mine.exists() || mine.data().gameId || !theirs.exists() || theirs.data().gameId) throw new Error('gone');
      const white = Math.random() < 0.5 ? uid : opp.uid;
      tx.set(gref, {
        white,
        black: white === uid ? opp.uid : uid,
        names: { [uid]: me.name, [opp.uid]: opp.name },
        hr: { [uid]: myHr, [opp.uid]: opp.hr },
        moves: [],
        clock: { w: CLOCK, b: CLOCK },
        turnStartedAt: Date.now(),
        status: 'active',
        result: null,
        winnerColor: null,
        emote: null,
        rewarded: {},
        createdAt: serverTimestamp(),
      });
      tx.update(qref(uid), { gameId: gref.id });
      tx.update(qref(opp.uid), { gameId: gref.id });
    });
    return gref.id;
  } catch {
    return null;
  }
}

export function sendMove(gid, chess, moves, gd) {
  const mover = gd.moves.length % 2 === 0 ? 'w' : 'b';
  const now = Date.now();
  const left = Math.max(0, gd.clock[mover] - (now - gd.turnStartedAt));
  const patch = { moves, clock: { ...gd.clock, [mover]: left }, turnStartedAt: now };
  if (chess.isGameOver()) {
    patch.status = 'done';
    if (chess.isCheckmate()) {
      patch.result = 'checkmate';
      patch.winnerColor = chess.turn() === 'w' ? 'b' : 'w';
    } else patch.result = 'draw';
  }
  return updateDoc(doc(db, 'games', gid), patch);
}

export const resign = (gid, myColor) =>
  updateDoc(doc(db, 'games', gid), { status: 'done', result: 'resign', winnerColor: myColor === 'w' ? 'b' : 'w' });

export const timeoutGame = (gid, loserColor) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, 'games', gid);
    const g = (await tx.get(ref)).data();
    if (!g || g.status !== 'active') return;
    tx.update(ref, { status: 'done', result: 'timeout', winnerColor: loserColor === 'w' ? 'b' : 'w' });
  }).catch(() => {});

export const sendEmote = (gid, uid, id) =>
  updateDoc(doc(db, 'games', gid), { emote: { uid, id, ts: Date.now() } });

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function settle(uid, gid) {
  return runTransaction(db, async (tx) => {
    const gref = doc(db, 'games', gid);
    const uref = doc(db, 'users', uid);
    const g = (await tx.get(gref)).data();
    const u = (await tx.get(uref)).data();
    if (!g || g.status !== 'done' || g.rewarded?.[uid]) return null;

    const mine = g.white === uid ? 'w' : 'b';
    const oppUid = g.white === uid ? g.black : g.white;
    const outcome = g.winnerColor == null ? 'draw' : g.winnerColor === mine ? 'win' : 'loss';
    const myHr = u.hr ?? 1000;
    const oppHr = g.hr?.[oppUid] ?? 1000;
    const games = u.games ?? 10;
    const placing = games < 10;
    const expected = 1 / (1 + 10 ** ((oppHr - myHr) / 400));
    const score = { win: 1, draw: 0.5, loss: 0 }[outcome];
    const hr = Math.round(myHr + (placing ? 64 : 24) * (score - expected));
    const d = oppHr - myHr;
    let dRp = outcome === 'win' ? Math.round(clamp(25 + d / 20, 15, 35)) : outcome === 'draw' ? 5 : -Math.round(clamp(20 - d / 40, 10, 30));
    const oldRp = u.rankPoints || 0;
    let rp = oldRp;
    let bonus = 0;
    if (placing) {
      if (games + 1 >= 10) rp = placementRp(hr);
    } else {
      rp = Math.max(0, oldRp + dRp);
      if (tierOf(rp) > tierOf(oldRp)) bonus = 500;
    }
    dRp = rp - oldRp;

    const coins = g.moves.length >= 10 ? { win: 300, draw: 100, loss: 50 }[outcome] : 0;
    const streak = outcome === 'win' ? (u.streak || 0) + 1 : 0;
    const owned = u.owned || [];
    const unlock = [];
    if (outcome === 'win' && !owned.includes('title_firstwin')) unlock.push('title_firstwin');
    if (streak >= 10 && !owned.includes('title_unstoppable')) unlock.push('title_unstoppable');

    const patch = { coins: increment(coins + bonus), rankPoints: rp, peakRp: Math.max(u.peakRp || 0, rp), hr, games: games + 1, streak };
    if (unlock.length) patch.owned = arrayUnion(...unlock);
    tx.update(uref, patch);
    tx.update(gref, { ['rewarded.' + uid]: true });
    return { outcome, coins, bonus, dRp, placing, placed: placing && games + 1 >= 10, rp, games: games + 1, unlock };
  });
}
