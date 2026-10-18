// Stockfish runs in the player's browser (free for you). It loads from a CDN.
// If it can't load, PlayAI falls back to random legal moves.
let worker = null;

function init() {
  if (worker) return;
  try {
    const src = 'importScripts("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");';
    const url = URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
    worker = new Worker(url);
    worker.postMessage('uci');
  } catch {
    worker = null;
  }
}

export function bestMove(fen, skill) {
  return new Promise((resolve) => {
    init();
    if (!worker) return resolve(null);
    const timer = setTimeout(() => resolve(null), 10000);
    const onMsg = (e) => {
      const m = String(e.data).match(/^bestmove (\S+)/);
      if (!m) return;
      clearTimeout(timer);
      worker.removeEventListener('message', onMsg);
      resolve(m[1] === '(none)' ? null : m[1]);
    };
    worker.addEventListener('message', onMsg);
    worker.postMessage('setoption name Skill Level value ' + skill);
    worker.postMessage('position fen ' + fen);
    worker.postMessage('go depth ' + (2 + Math.floor(skill / 2)));
  });
}
