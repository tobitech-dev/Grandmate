import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

export const addCoins = (uid, n) => updateDoc(doc(db, 'users', uid), { coins: increment(n) });

export const buy = (uid, item) =>
  updateDoc(doc(db, 'users', uid), {
    coins: increment(-item.price),
    owned: arrayUnion(...(item.contents || [item.id])),
  });

const TOGGLE = ['avatar', 'frame', 'title', 'nameStyle', 'finisher'];

export function equip(uid, item, me) {
  const eq = { ...me.equipped, pieces: { ...(me.equipped?.pieces || {}) } };
  if (item.type === 'board') eq.board = item.id;
  else if (item.type === 'piece') {
    if (eq.pieces[item.slot] === item.id) delete eq.pieces[item.slot];
    else eq.pieces[item.slot] = item.id;
  } else if (TOGGLE.includes(item.type)) eq[item.type] = eq[item.type] === item.id ? null : item.id;
  return updateDoc(doc(db, 'users', uid), { equipped: eq });
}
