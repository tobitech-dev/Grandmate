import { ITEM } from '../data/shopItems';

const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

// myColor: whose pieces get your equipped skins. flip: show the board from black's side.
export default function Board({ game, sel, targets, onSquare, equipped, myColor = 'w', flip = false }) {
  const theme = ITEM[equipped?.board] || ITEM.board_classic;
  const cells = [];
  game.board().forEach((row, r) =>
    row.forEach((p, c) => {
      const sq = 'abcdefgh'[c] + (8 - r);
      const light = (r + c) % 2 === 0;
      const skin = p && p.color === myColor ? ITEM[equipped?.pieces?.[p.type]] : null;
      cells.push(
        <div
          key={sq}
          className={'sq' + (sel === sq ? ' sel' : '') + (targets.includes(sq) ? ' tgt' : '')}
          style={{ background: light ? theme.light : theme.dark }}
          onClick={() => onSquare(sq)}
        >
          {p && <span className={p.color}>{skin ? skin.glyph : GLYPH[p.type]}</span>}
        </div>
      );
    })
  );
  if (flip) cells.reverse();
  return <div className="board">{cells}</div>;
}
