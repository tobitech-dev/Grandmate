export const RANKS = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
export const ICONS = ['♟', '♞', '♝', '♜', '♛', '♚'];
const DIV = ['III', 'II', 'I']
export function rankOf(rp = 0) {
  const tier = Math.min(Math.floor(rp / 300), 5);
  const div = DIV[Math.min(Math.floor((rp % 300) / 100), 2)];
  return { icon: ICONS[tier], label: `${RANKS[tier]} ${div}` };
}

export const tierOf = (rp = 0) => Math.min(Math.floor(rp / 300), 5);

export const GM_RP = 1700; 
export const placementRp = (hr) => Math.round(Math.min(899, Math.max(0, (hr - 800) * 2.5)));
