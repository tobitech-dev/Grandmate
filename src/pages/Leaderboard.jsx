import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PlayerTag from '../components/PlayerTag.jsx';
import { rankOf, GM_RP } from '../data/ranks';
).
export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    getDocs(query(collection(db, 'users'), orderBy('rankPoints', 'desc'), limit(500))).then((s) =>
      setRows(s.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => (u.games ?? 10) >= 10))
    );
  }, []);
  if (!rows) return <p className="mut">Loading…</p>;
  if (!rows.length) return <p className="mut">No ranked players yet. Finish 10 online games to appear here.</p>;
  return (
    <>
      <h2>Leaderboard</h2>
      {rows.map((u, i) => {
        const gm = u.rankPoints >= GM_RP;
        const r = rankOf(u.rankPoints);
        return (
          <div className="card row" key={u.uid} style={{ justifyContent: 'space-between' }}>
            <span className="mut">#{i + 1}</span>
            <PlayerTag u={u} />
            <span className="badge">{gm ? '♔ Grandmaster' : `${r.icon} ${r.label}`}</span>
          </div>
        );
      })}
    </>
  );
}
