// 단어 카드 복습. 덱과 위치는 sessionStorage에 두어 화면 크기가 바뀌어도 이어진다.
import { state, setWordStatus } from '../store.js';
import { SECTIONS } from '../../config/exam.js';
import { go } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc } from '../ui/text.js';

const DECK_KEY = 'cards:deck';

function loadDeck() {
  try {
    const deck = JSON.parse(sessionStorage.getItem(DECK_KEY));
    if (deck && deck.keys.every((k) => state.words.has(k))) return deck;
  } catch { /* 새로 만든다 */ }
  const words = [...state.words.values()].sort((a, b) => a.addedAt - b.addedAt);
  const learning = words.filter((w) => w.status === 'learning');
  return { keys: (learning.length ? learning : words).map((w) => w.key), index: 0, flipped: false, known: 0 };
}

export default {
  chrome: 'none',
  nav: 'words',
  render(el) {
    let deck = loadDeck();
    const root = document.createElement('div');
    root.className = 'quiz';
    el.append(root);

    const save = () => {
      try { sessionStorage.setItem(DECK_KEY, JSON.stringify(deck)); } catch { /* 무시 */ }
    };
    const top = (label, ratio) => `<header class="quiz-top"><div class="bar-inner">
      <button class="icon-btn" data-act="close" aria-label="복습 닫기">${icons.x}</button>
      <span class="quiz-title">단어 카드</span><span class="quiz-count">${label}</span>
      <div class="progress" role="progressbar" aria-label="진행" aria-valuenow="${Math.round(ratio * 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${ratio * 100}%"></span></div>
    </div></header>`;

    const draw = () => {
      const n = deck.keys.length;
      if (!n) {
        root.innerHTML = `${top('0 / 0', 0)}<div class="flash-body"><div class="empty">${icons.bookmark}<p>복습할 단어가 없어요.</p></div></div>`;
        return;
      }
      if (deck.index >= n) {
        root.innerHTML = `${top('완료', 1)}
          <div class="flash-body"><div class="card flash-card" style="cursor:default">
            <p class="sub">복습 완료</p><p class="flash-surface">${n}장</p><p class="flash-meaning">이번에 외움으로 표시한 단어 ${deck.known}개</p>
          </div></div>
          <footer class="quiz-actions"><div class="bar-inner">
            <button class="btn btn-secondary btn-lg" data-act="restart">${icons.refresh}처음부터</button>
            <button class="btn btn-primary btn-lg" data-act="close">단어장으로</button>
          </div></footer>`;
        return;
      }
      const w = state.words.get(deck.keys[deck.index]);
      root.innerHTML = `${top(`${deck.index + 1} / ${n}`, deck.index / n)}
        <div class="flash-body">
          <button class="card flash-card" data-act="flip" aria-label="${deck.flipped ? '앞면 보기' : '뜻 보기'}">
            <span class="chip">${esc(SECTIONS[w.section]?.label ?? '')} · ${esc(w.type)}</span>
            <span class="flash-surface">${esc(w.surface)}</span>
            ${deck.flipped
              ? `<span class="flash-reading">${esc(w.reading)}</span><span class="flash-meaning">${esc(w.meaning_ko)}</span>`
              : '<span class="flash-hint">탭하면 읽기와 뜻이 보여요</span>'}
          </button>
        </div>
        <footer class="quiz-actions"><div class="bar-inner">
          <button class="btn btn-secondary btn-lg" data-act="again">다시 볼게요</button>
          <button class="btn btn-primary btn-lg" data-act="known">${icons.check}외웠어요</button>
        </div></footer>`;
    };

    const next = () => {
      deck.index += 1;
      deck.flipped = false;
      save();
      draw();
    };
    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'flip':
          deck.flipped = !deck.flipped;
          save();
          draw();
          break;
        case 'again':
          next();
          break;
        case 'known':
          setWordStatus(deck.keys[deck.index], 'known');
          deck.known += 1;
          next();
          break;
        case 'restart':
          try { sessionStorage.removeItem(DECK_KEY); } catch { /* 무시 */ }
          deck = loadDeck();
          save();
          draw();
          break;
        case 'close':
          try { sessionStorage.removeItem(DECK_KEY); } catch { /* 무시 */ }
          go('words');
          break;
        default:
      }
    };
    root.addEventListener('click', onClick);
    save();
    draw();
    return null;
  },
};
