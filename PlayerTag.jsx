import { getItem } from '../data/shopItems';

// Shows a player's avatar (with frame), styled name and title.
export default function PlayerTag({ u, size = 44 }) {
  const eq = u.equipped || {};
  const av = getItem(eq.avatar);
  const fr = getItem(eq.frame);
  const ns = getItem(eq.nameStyle);
  const ti = getItem(eq.title);
  return (
    <div className="tag">
      <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.55, ...(fr ? { borderColor: fr.color, boxShadow: `0 0 8px ${fr.color}` } : {}) }}>
        {av ? av.glyph : '♟'}
      </div>
      <div>
        <div className="pname" style={ns?.style}>{u.name}</div>
        {ti && <div className="mut small">{ti.name}</div>}
      </div>
    </div>
  );
}
