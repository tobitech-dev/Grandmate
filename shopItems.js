// Prices are in coins. Cosmetics only: nothing here changes who wins.
// minTier: rank needed (0 Pawn ... 5 King). until: limited-time. achievement: earned, not bought.
const board = (id, name, price, light, dark, x = {}) => ({ id, type: 'board', name, price, light, dark, ...x });
const piece = (slot, name, price, glyph) => ({ id: 'piece_' + slot, type: 'piece', slot, name, price, glyph });
const simple = (type, id, name, price, x) => ({ id, type, name, price, ...x });
const gold = { background: 'linear-gradient(90deg,#f6e27a,#e07b39)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const flame = { background: 'linear-gradient(90deg,#ff5722,#ffc107)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export const SHOP = [
  board('board_classic', 'Classic Wood', 0, '#f0d9b5', '#b58863'),
  board('board_forest', 'Forest', 150, '#e8edc9', '#6b8f4e'),
  board('board_marble', 'Marble', 300, '#e9ecef', '#8d99ae'),
  board('board_neon', 'Neon Night', 300, '#3a3d7a', '#14153a'),
  board('board_gold', 'Royal Gold', 600, '#f6e27a', '#a9741b', { minTier: 3 }),
  board('board_haunted', 'Haunted Manor', 300, '#d9c7a3', '#3b2a45', { until: '2026-11-05' }),

  piece('p', 'Soldier (pawn)', 50, '🪖'),
  piece('n', 'Stallion (knight)', 80, '🐎'),
  piece('b', 'Wizard (bishop)', 80, '🧙'),
  piece('r', 'Tower (rook)', 90, '🏯'),
  piece('q', 'Queen', 100, '👸'),
  piece('k', 'King', 120, '🤴'),

  simple('bundle', 'bundle_royal', 'Royal Set (all 6 pieces)', 400, { glyph: '🎁', contents: ['piece_p', 'piece_n', 'piece_b', 'piece_r', 'piece_q', 'piece_k'] }),
  simple('bundle', 'bundle_night', 'Neon Night Pack', 450, { glyph: '🎁', contents: ['board_neon', 'fin_lightning', 'avatar_wolf'] }),

  simple('finisher', 'fin_lightning', 'Lightning Strike', 200, { glyph: '⚡' }),
  simple('finisher', 'fin_fireworks', 'Fireworks', 400, { glyph: '🎆' }),
  simple('finisher', 'fin_shatter', 'Shatter', 800, { glyph: '💥', minTier: 4 }),

  simple('avatar', 'avatar_fox', 'Fox', 100, { glyph: '🦊' }),
  simple('avatar', 'avatar_owl', 'Owl', 100, { glyph: '🦉' }),
  simple('avatar', 'avatar_wolf', 'Wolf', 100, { glyph: '🐺' }),
  simple('avatar', 'avatar_lion', 'Lion', 150, { glyph: '🦁' }),
  simple('avatar', 'avatar_dragon', 'Dragon', 300, { glyph: '🐉', minTier: 2 }),
  simple('avatar', 'avatar_pumpkin', 'Pumpkin', 100, { glyph: '🎃', until: '2026-11-05' }),

  simple('frame', 'frame_gold', 'Gold frame', 150, { color: '#c9964a' }),
  simple('frame', 'frame_emerald', 'Emerald frame', 150, { color: '#2ecc71' }),
  simple('frame', 'frame_fire', 'Fire frame', 300, { color: '#ff5722', minTier: 2 }),

  simple('title', 'title_tactician', 'Tactician', 200),
  simple('title', 'title_wizard', 'Endgame Wizard', 200),
  simple('title', 'title_fire', 'Grandmaster of Fire', 400, { minTier: 5 }),
  simple('title', 'title_unstoppable', 'Unstoppable', 0, { achievement: 'Win 10 online games in a row' }),
  simple('title', 'title_firstwin', 'First Blood', 0, { achievement: 'Win your first online game' }),

  simple('nameStyle', 'name_gold', 'Golden name', 250, { style: gold }),
  simple('nameStyle', 'name_aqua', 'Aqua name', 250, { style: { color: '#4de2e2' } }),
  simple('nameStyle', 'name_flame', 'Flame name', 250, { style: flame }),

  simple('emote', 'emote_gg', 'Good game', 75, { glyph: '👏' }),
  simple('emote', 'emote_wow', 'Wow', 75, { glyph: '😮' }),
  simple('emote', 'emote_nice', 'Nice move', 75, { glyph: '🔥' }),
  simple('emote', 'emote_luck', 'Good luck', 75, { glyph: '🤝' }),
];
export const ITEM = Object.fromEntries(SHOP.map((i) => [i.id, i]));

// Season reward titles look like "title:season:2026-Q3:Queen" and are created on the fly.
export function getItem(id) {
  if (!id) return undefined;
  if (ITEM[id]) return ITEM[id];
  if (typeof id === 'string' && id.startsWith('title:season:')) {
    const [, , s, rank] = id.split(':');
    return { id, type: 'title', name: `Season ${s} ${rank}`, price: 0, achievement: 'Season reward' };
  }
}
export const isLive = (i) => !i.until || Date.now() < new Date(i.until).getTime();
export function rarityOf(i) {
  if (i.achievement) return 'legendary';
  return i.price < 100 ? 'common' : i.price < 250 ? 'rare' : i.price < 500 ? 'epic' : 'legendary';
}
