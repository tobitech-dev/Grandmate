import { rankOf } from '../data/ranks';
export default function RankBadge({ rp, games }) {
  if ((games ?? 10) < 10) return <span className="badge">Placement {games}/10</span>;
  const r = rankOf(rp);
  return <span className="badge">{r.icon} {r.label}</span>;
}
