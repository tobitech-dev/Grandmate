import { useState } from 'react';
import { SHOP, getItem, isLive } from '../data/shopItems';
import { RANKS, tierOf } from '../data/ranks';
import { buy, equip } from '../lib/coins';
import { useMe } from '../lib/me';
import ShopCard from '../components/ShopCard.jsx';

const TABS = {
  piece: 'Pieces', board: 'Boards', finisher: 'Finishers', avatar: 'Avatars', frame: 'Frames',
  title: 'Titles', nameStyle: 'Names', emote: 'Emotes', bundle: 'Bundles',
};

export default function Shop() {
  const { uid, me } = useMe();
  const [tab, setTab] = useState('piece');
  const [msg, setMsg] = useState('');
  const tier = tierOf(me.rankPoints);
  const owned = me.owned || [];

  const isEquipped = (i) =>
    i.type === 'board' ? me.equipped?.board === i.id
    : i.type === 'piece' ? me.equipped?.pieces?.[i.slot] === i.id
    : me.equipped?.[i.type] === i.id;

  function stateOf(i) {
    const has = i.type === 'bundle' ? i.contents.every((c) => owned.includes(c)) : owned.includes(i.id);
    if (has) {
      if (i.type === 'emote' || i.type === 'bundle') return { label: 'Owned', disabled: true, ghost: true };
      return isEquipped(i) ? { label: 'Equipped' } : { label: 'Equip', ghost: true };
    }
    if (i.achievement) return { label: i.achievement, disabled: true, ghost: true };
    if (i.minTier && tier < i.minTier) return { label: `Reach ${RANKS[i.minTier]}`, disabled: true, ghost: true };
    return { label: `Buy · ${i.price} coins` };
  }

  async function act(item) {
    setMsg('');
    if (owned.includes(item.id) || (item.type !== 'bundle' && stateOf(item).label === 'Equip')) return equip(uid, item, me);
    if (me.coins < item.price) return setMsg(`You need ${item.price - me.coins} more coins. Win games to earn them.`);
    await buy(uid, item);
  }

  // Limited items disappear when they expire, unless you already own them.
  let items = SHOP.filter((i) => i.type === tab && (isLive(i) || owned.includes(i.id)));
  if (tab === 'title') items = items.concat(owned.filter((o) => o.startsWith('title:season:')).map(getItem));

  return (
    <>
      <div className="row">
        {Object.entries(TABS).map(([k, v]) => (
          <button key={k} className={tab === k ? '' : 'ghost'} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>
      <p className="err">{msg}</p>
      <div className="grid">
        {items.map((i) => <ShopCard key={i.id} item={i} state={stateOf(i)} onAct={act} />)}
      </div>
    </>
  );
}
