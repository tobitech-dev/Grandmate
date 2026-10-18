import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

export default function Login() {
  const [err, setErr] = useState('');
  const go = () => signInWithPopup(auth, provider).catch((e) => setErr(e.message));
  return (
    <div className="center">
      <div>
        <h1>Chess Arena</h1>
        <p className="mut">Play, earn coins, and make your pieces your own.</p>
        <button onClick={go}>Sign in with Google</button>
        {err && <p className="err">{err}</p>}
      </div>
    </div>
  );
}
