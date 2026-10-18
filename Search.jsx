import { useState } from 'react';
import { searchUsers } from '../lib/names';
import { rankOf } from '../data/ranks';
import PlayerTag from '../components/PlayerTag.jsx';

export default function Search() {
  const [text, setText] = useState('');
  const [list, setList] = useState(null);
  const go = async () => setList(await searchUsers(text));
  return (
    <>
      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} placeholder="Player ID or name" style={{ flex: 1 }} />
        <button onClick={go}>Search</button>
      </div>
      {list && list.length === 0 && <p className="mut">No players found. Names must match from the first letter, including case.</p>}
      {list?.map((u) => {
        const r = rankOf(u.rankPoints);
        return (
          <div className="card" key={u.uid}>
            <PlayerTag u={u} />
            <span className="mut">ID {u.pid} · {(u.games ?? 10) < 10 ? 'In placement' : `${r.icon} ${r.label}`}</span>
          </div>
        );
      })}
    </>
  );
}
