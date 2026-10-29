import { questions } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import { wrongEntries, startIds } from '../study.js';
import { icons } from '../ui/icons.js';
import { esc, plainStem } from '../ui/text.js';

const FILTER_KEY = 'wrong:filter';
const readFilter = () => {
  try { return sessionStorage.getItem(FILTER_KEY) || 'all'; } catch { return 'all'; }
};

function item(a) {
  const q = questions.get(a.id);
  return `<li class="card wrong-item" data-anchor="w-${esc(q.id)}">
    <div class="q-meta">
      <span class="chip">${esc(SECTIONS[q.section].label)} · ${esc(q.type)}</span>
      ${q.verified ? '' : `<span class="badge-draft">${icons.alert}검수 전</span>`}
      <span class="miss">틀린 횟수 ${a.wrong}회</span>
    </div>
    <p class="wrong-stem">${esc(plainStem(q))}</p>
    ${a.last === 'correct' ? '<p class="recent-ok">가장 최근에는 맞혔어요</p>' : ''}
    <details class="peek">
      <summary>${icons.chevronRight}정답 미리보기</summary>
      <div class="peek-body"><span class="tag tag-ok">${icons.check}정답</span><span class="jp">${q.answer}. ${esc(q.choices[q.answer - 1])}</span></div>
    </details>
    <div class="wrong-actions"><button class="btn btn-secondary" data-retry="${esc(q.id)}">${icons.refresh}다시 풀기</button></div>
  </li>`;
}

export default {
  render(el) {
    let filter = readFilter();

    const draw = () => {
      const all = wrongEntries();
      const shown = filter === 'all' ? all : all.filter((a) => questions.get(a.id).section === filter);
      const count = (k) => (k === 'all' ? all.length : all.filter((a) => questions.get(a.id).section === k).length);
      const chips = [['all', '전체'], ...Object.entries(SECTIONS).filter(([, m]) => m.enabled).map(([k, m]) => [k, m.label])];
      el.innerHTML = `<div class="page">
        <header class="page-head" style="margin-left:0"><h1 class="h1">오답노트</h1></header>
        <div class="chips" role="group" aria-label="유형 필터" style="margin-bottom:16px">
          ${chips.map(([k, label]) => `<button class="chip-btn" data-filter="${k}" aria-pressed="${filter === k}">${esc(label)}<span class="n">${count(k)}</span></button>`).join('')}
        </div>
        ${shown.length
          ? `<ul class="list">${shown.map(item).join('')}</ul>`
          : `<div class="empty">${icons.note}<p>${all.length ? '이 유형에는 틀린 문제가 없어요.' : '아직 틀린 문제가 없어요.<br>문제를 풀면 틀린 문제가 여기에 모여요.'}</p></div>`}
        ${shown.length ? `<div class="sticky-cta">
          <button class="btn btn-primary btn-lg btn-block" data-act="all">${icons.refresh}오답만 모아 풀기 (${shown.length})</button>
        </div>` : ''}
      </div>`;
      return shown;
    };

    let shown = draw();
    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.filter) {
        filter = btn.dataset.filter;
        try { sessionStorage.setItem(FILTER_KEY, filter); } catch { /* 무시 */ }
        shown = draw();
      } else if (btn.dataset.retry) {
        startIds('오답 다시 풀기', [btn.dataset.retry], 'wrong');
      } else if (btn.dataset.act === 'all') {
        startIds('오답 모아 풀기', shown.map((a) => a.id), 'wrong');
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
