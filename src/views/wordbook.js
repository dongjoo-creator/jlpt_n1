import { state, setWordStatus, removeWord } from '../store.js';
import { SECTIONS } from '../../config/exam.js';
import { go } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc } from '../ui/text.js';
import { toast } from '../ui/toast.js';

const FILTER_KEY = 'words:filter';
const FILTERS = [['all', '전체'], ['learning', '학습 중'], ['known', '외움']];
const readFilter = () => {
  try { return sessionStorage.getItem(FILTER_KEY) || 'all'; } catch { return 'all'; }
};

function card(w) {
  const known = w.status === 'known';
  return `<li class="card word-card" data-anchor="wd-${esc(w.key)}">
    <div class="wc-head">
      <span class="chip">${esc(SECTIONS[w.section]?.label ?? '')} · ${esc(w.type)}</span>
      <button class="icon-btn" data-remove="${esc(w.key)}" aria-label="${esc(w.surface)} 단어장에서 삭제">${icons.trash}</button>
    </div>
    <p class="wc-surface">${esc(w.surface)}</p>
    <p class="wc-reading">${esc(w.reading)}</p>
    <p class="wc-meaning">${esc(w.meaning_ko)}</p>
    <button class="known-toggle" data-known="${esc(w.key)}" aria-pressed="${known}">${known ? icons.check : icons.plus}외움</button>
  </li>`;
}

export default {
  nav: 'words',
  render(el) {
    let filter = readFilter();

    const draw = () => {
      const all = [...state.words.values()].sort((a, b) => b.addedAt - a.addedAt);
      const count = (k) => (k === 'all' ? all.length : all.filter((w) => w.status === k).length);
      const shown = filter === 'all' ? all : all.filter((w) => w.status === filter);
      el.innerHTML = `<div class="page">
        <header class="page-head" style="margin-left:0"><h1 class="h1">단어장</h1></header>
        <div class="seg" role="group" aria-label="단어 필터" style="margin-bottom:16px">
          ${FILTERS.map(([k, label]) => `<button data-filter="${k}" aria-pressed="${filter === k}">${label} ${count(k)}</button>`).join('')}
        </div>
        ${shown.length
          ? `<ul class="word-grid">${shown.map(card).join('')}</ul>`
          : `<div class="empty">${icons.bookmark}<p>${all.length ? '이 필터에 해당하는 단어가 없어요.' : '아직 저장한 단어가 없어요.<br>문제를 푼 뒤 [어려운 단어] 탭에서 저장해 보세요.'}</p></div>`}
        ${all.length ? `<div class="sticky-cta">
          <button class="btn btn-primary btn-lg btn-block" data-act="cards">${icons.cards}단어 카드로 복습하기</button>
        </div>` : ''}
      </div>`;
    };

    draw();
    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.filter) {
        filter = btn.dataset.filter;
        try { sessionStorage.setItem(FILTER_KEY, filter); } catch { /* 무시 */ }
        draw();
      } else if (btn.dataset.known) {
        const w = state.words.get(btn.dataset.known);
        setWordStatus(w.key, w.status === 'known' ? 'learning' : 'known');
        draw();
      } else if (btn.dataset.remove) {
        const w = state.words.get(btn.dataset.remove);
        removeWord(w.key);
        toast(`「${w.surface}」을(를) 삭제했어요`);
        draw();
      } else if (btn.dataset.act === 'cards') {
        go('cards');
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
