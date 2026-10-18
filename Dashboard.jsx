import { Link } from 'react-router-dom';
import { useMe } from '../lib/me';
import { rankOf } from '../data/ranks';
import PlayerTag from '../components/PlayerTag.jsx';

export default function Dashboard() {
  const { me } = useMe();
  const r = rankOf(me.rankPoints);
  const placing = (me.games ?? 10) < 10;
  return (
    <>
      <div className="card">
        <PlayerTag u={me} size={56} />
        <p className="mut">Your ID: {me.pid} · {placing ? `Placement ${me.games}/10` : `${r.icon} ${r.label} · ${me.rankPoints} rank points`}</p>
        <p>You have <strong className="coin">🪙 {me.coins} coins</strong> to spend in the shop.</p>
      </div>
      <div className="row">
        <Link className="btn" to="/online">Play online</Link>
        <Link className="btn ghost" to="/play">Play the computer</Link>
        <Link className="btn ghost" to="/shop">Open shop</Link>
      </div>
    </>
  );
}
