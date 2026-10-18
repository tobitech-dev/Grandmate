import { useState } from 'react';
import { claimName, checkName } from '../lib/names';

export default function ChooseName({ uid }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const bad = checkName(name);
    if (bad) return setErr(bad);
    setBusy(true);
    try {
      await claimName(uid, name);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }
  return (
    <div className="center">
      <div className="card" style={{ maxWidth: 360, width: '100%' }}>
        <h2>Choose your game name</h2>
        <p className="mut">This is the only name other players see. You can change it later.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={20} />
        <p className="err">{err}</p>
        <button disabled={busy} onClick={submit}>Start playing</button>
      </div>
    </div>
  );
}
