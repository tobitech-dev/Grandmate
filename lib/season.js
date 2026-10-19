import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { RANKS, tierOf } from '../data/ranks';


export const currentSeason = () => {
  const d = new Date();
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
};

export async function rolloverSeason(uid, me) {
  const cur = currentSeason();
  const ref = doc(db, 'users', uid);
  if (me.season === cur) return;
  if (!me.season || (me.games ?? 10) < 10) return updateDoc(ref, { season: cur });
  const rp = me.rankPoints || 0;
  const tier = tierOf(Math.max(me.peakRp || 0, rp));
  const soft = Math.round(rp * 0.6 + 180);
  return updateDoc(ref, {
    season: cur,
    rankPoints: soft,
    peakRp: soft,
    coins: increment(100 * (tier + 1)),
    owned: arrayUnion(`title:season:${me.season}:${RANKS[tier]}`),
  });
}
