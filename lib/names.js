import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { currentSeason } from './season';

const key = (n) => encodeURIComponent(n);
const TAKEN = 'That exact name is taken. Style it differently (letters, symbols or case) to use it.';

export function checkName(n) {
  if (n.length < 3 || n.length > 20) return 'Use 3 to 20 characters.';
  if (n.trim() !== n) return 'Remove spaces at the start and end.';
  return null;
}

const newPid = () => String(Math.floor(100000 + Math.random() * 900000));

export async function claimName(uid, name) {
  await runTransaction(db, async (tx) => {
    const nref = doc(db, 'names', key(name));
    if ((await tx.get(nref)).exists()) throw new Error(TAKEN);
    tx.set(nref, { uid });
    tx.set(doc(db, 'users', uid), {
      name,
      pid: newPid(),
      coins: 500,
      rankPoints: 0,
      hr: 1000,
      games: 0,
      streak: 0,
      peakRp: 0,
      season: currentSeason(),
      owned: ['board_classic'],
      equipped: { board: 'board_classic', finisher: null, pieces: {}, avatar: null, frame: null, title: null, nameStyle: null },
      createdAt: serverTimestamp(),
    });
  });
}

export async function changeName(uid, oldName, name) {
  await runTransaction(db, async (tx) => {
    const nref = doc(db, 'names', key(name));
    const s = await tx.get(nref);
    if (s.exists() && s.data().uid !== uid) throw new Error(TAKEN);
    if (oldName !== name) tx.delete(doc(db, 'names', key(oldName)));
    tx.set(nref, { uid });
    tx.update(doc(db, 'users', uid), { name });
  });
}

// Search by 6-digit ID (exact) or by name (starts with, case-sensitive).
export async function searchUsers(text) {
  const t = text.trim();
  if (!t) return [];
  const users = collection(db, 'users');
  const q = /^\d{6}$/.test(t)
    ? query(users, where('pid', '==', t), limit(10))
    : query(users, where('name', '>=', t), where('name', '<=', t + '\uf8ff'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
