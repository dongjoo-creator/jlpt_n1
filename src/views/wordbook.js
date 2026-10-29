import { state, setWordStatus, removeWord } from '../store.js';
import { questions } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import { go } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc, exampleFor } from '../ui/text.js';
import { toast } from '../ui/toast.js';

const FILTER_KEY = 'words:filter';
const FILTERS = [['all', '전체'], ['learning', '학습 중'], ['known', '외움']];
const readFilter = () => {
  try { return sessionStorage.getItem(FILTER_KEY) || 'all'; } catch { return 'all'; }
};

// 가리기 설정은 이 기기에서 계속 기억한다. 가린 칸은 카드를 누르면 그 카드만 잠깐 보인다.
const HIDE_KEY = 'words:hide';
const HIDES = [['ja', '일본어'], ['kana', '후리가나'], ['ko', '한글']];
const readHide = () => {
  try { return { ja: false, kana: false, ko: false, ...JSON.parse(localStorage.getItem(HIDE_KEY)) }; } catch { return { ja: false, kana: false, ko: false }; }
};

const mask = (part, html) => `<span class="mask" data-part="${part}">${html}</span>`;

function exampleHtml({ text, word }) {
  const at = text.indexOf(word);
  return `${esc(text.slice(0, at))}${mask('ja', `<b class="ex-word">${esc(word)}</b>`)}${esc(text.slice(at + word.length))}`;
}

function card(w) {
  const known = w.status === 'known';
  const ex = exampleFor(questions.get(w.sourceId), w.surface);
  const word = w.reading && w.reading !== w.surface
    ? `<ruby>${mask('ja', esc(w.surface))}<rt>${mask('kana', esc(w.reading))}</rt></ruby>`
    : mask('ja', esc(w.surface));
  return `<li class="card word-card" data-anchor="wd-${esc(w.key)}">
    <div class="wc-head">
      <span class="chip">${esc(SECTIONS[w.section]?.label ?? '')} · ${esc(w.type)}</span>
      <button class="icon-btn" data-remove="${esc(w.key)}" aria-label="${esc(w.surface)} 단어장에서 삭제">${icons.trash}</button>
    </div>
    <div class="wc-body" role="button" tabindex="0" aria-pressed="false" aria-label="가린 내용 보기">
      <p class="wc-surface jp">${word}</p>
      <p class="wc-meaning">${mask('ko', esc(w.meaning_ko))}</p>
      ${ex ? `<p class="wc-example jp"><span class="wc-ex-label">예문</span>${exampleHtml(ex)}</p>` : ''}
    </div>
    <button class="known-toggle" data-known="${esc(w.key)}" aria-pressed="${known}">${known ? icons.check : icons.plus}외움</button>
  </li>`;
}

export default {
  nav: 'words',
  render(el) {
    let filter = readFilter();
    const hide = readHide();

    const draw = () => {
      const all = [...state.words.values()].sort((a, b) => b.addedAt - a.addedAt);
      const count = (k) => (k === 'all' ? all.length : all.filter((w) => w.status === k).length);
      const shown = filter === 'all' ? all : all.filter((w) => w.status === filter);
      const hideClass = HIDES.filter(([k]) => hide[k]).map(([k]) => ` hide-${k}`).join('');
      el.innerHTML = `<div class="page words${hideClass}">
        <header class="page-head" style="margin-left:0"><h1 class="h1">단어장</h1></header>
        <div class="seg" role="group" aria-label="단어 필터" style="margin-bottom:10px">
          ${FILTERS.map(([k, label]) => `<button data-filter="${k}" aria-pressed="${filter === k}">${label} ${count(k)}</button>`).join('')}
        </div>
        <div class="seg hide-bar" role="group" aria-label="가리기" style="margin-bottom:${hideClass ? 8 : 16}px">
          ${HIDES.map(([k, label]) => `<button data-hide="${k}" aria-pressed="${hide[k]}">${label} 가리기</button>`).join('')}
        </div>
        ${hideClass ? '<p class="sub" style="margin:0 4px 16px">카드를 누르면 가린 내용이 보여요.</p>' : ''}
        ${shown.length
          ? `<ul class="word-grid">${shown.map(card).join('')}</ul>`
          : `<div class="empty">${icons.bookmark}<p>${all.length ? '이 필터에 해당하는 단어가 없어요.' : '아직 저장한 단어가 없어요.<br>문제를 푼 뒤 [어려운 단어] 탭에서 저장해 보세요.'}</p></div>`}
        ${all.length ? `<div class="sticky-cta">
          <button class="btn btn-primary btn-lg btn-block" data-act="cards">${icons.cards}단어 카드로 복습하기</button>
        </div>` : ''}
      </div>`;
    };

    draw();
    const peek = (body) => {
      const on = body.getAttribute('aria-pressed') !== 'true';
      body.setAttribute('aria-pressed', String(on));
      body.closest('.word-card').classList.toggle('peek', on);
    };
    const onKey = (e) => {
      const body = e.target.closest('.wc-body');
      if (body && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); peek(body); }
    };
    const onClick = (e) => {
      const body = e.target.closest('.wc-body');
      if (body) return peek(body);
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.hide) {
        hide[btn.dataset.hide] = !hide[btn.dataset.hide];
        try { localStorage.setItem(HIDE_KEY, JSON.stringify(hide)); } catch { /* 무시 */ }
        draw();
      } else if (btn.dataset.filter) {
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
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('keydown', onKey);
    };
  },
};
