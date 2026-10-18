import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useMe } from '../lib/me';
import { changeName, checkName } from '../lib/names';
import { rankOf } from '../data/ranks';
import PlayerTag from '../components/PlayerTag.jsx';

export default function Profile() {
  const { uid, me } = useMe();
  const [name, setName] = useState(me.name);
  const [msg, setMsg] = useState('');
  const r = rankOf(me.rankPoints);

  async function save() {
    const bad = checkName(name);
    if (bad) return setMsg(bad);
    try {
      await changeName(uid, me.name, name);
      setMsg('Name saved.');
    } catch (e) {
      setMsg(e.message);
    }
  }
  return (
    <div className="card">
      <h2>Your profile</h2>
      <PlayerTag u={me} size={56} />
      <p className="mut">ID {me.pid} · {(me.games ?? 10) < 10 ? `Placement ${me.games}/10` : `${r.icon} ${r.label}`} · {me.owned.length} items owned · Season {me.season || '-'}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
      <p className="mut">{msg || 'Equip avatars, frames, titles and name styles in the shop.'}</p>
      <div className="row">
        <button onClick={save}>Save name</button>
        <button className="ghost" onClick={() => signOut(auth)}>Sign out</button>
      </div>
    </div>
  );
}
