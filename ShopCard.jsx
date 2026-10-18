import { rarityOf } from '../data/shopItems';

function Preview({ item }) {
  if (item.type === 'board')
    return <div className="mini" style={{ background: `linear-gradient(135deg, ${item.light} 50%, ${item.dark} 50%)` }} />;
  if (item.type === 'frame')
    return <div className="mini"><div className="avatar" style={{ borderColor: item.color, boxShadow: `0 0 8px ${item.color}` }}>♟</div></div>;
  if (item.type === 'title') return <div className="mini small">{item.name}</div>;
  if (item.type === 'nameStyle') return <div className="mini"><strong style={item.style}>Player</strong></div>;
  return <div className="mini glyph">{item.glyph}</div>;
}

export default function ShopCard({ item, state, onAct }) {
  const rar = rarityOf(item);
  return (
    <div className={'card item r-' + rar}>
      <Preview item={item} />
      <div>{item.name}</div>
      <div className="mut small">{item.achievement ? 'Achievement' : rar}{item.until ? ` · until ${item.until}` : ''}</div>
      <button className={state.ghost ? 'ghost' : ''} disabled={state.disabled} onClick={() => onAct(item)}>{state.label}</button>
    </div>
  );
}
