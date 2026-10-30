// 연습 탭: 오늘의 문제 세트를 영역별로 나눠 푼다. 세트 밖의 문제는 여기서 풀 수 없다.
import { questions } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import { dailySet, dailySection, startDailySection } from '../study.js';
import { esc, percent } from '../ui/text.js';

function typeChips(ids) {
  const counts = new Map();
  for (const id of ids) {
    const { type } = questions.get(id);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts].map(([type, n]) => `<span class="chip">${esc(type)} ${n}</span>`).join('');
}

function card(daily, key, meta) {
  if (!meta.enabled) {
    return `<li class="card prac-card" data-anchor="p-${key}">
      <div class="prac-head"><h2>${esc(meta.label)}</h2></div>
      <p class="sub">${esc(meta.note ?? '준비 중이에요')}</p>
    </li>`;
  }
  const st = dailySection(daily, key);
  const total = st.ids.length;
  return `<li class="card prac-card" data-anchor="p-${key}">
    <div class="prac-head"><h2>${esc(meta.label)}</h2><span class="sub">${st.done.length}/${total} 풀이 · 정답률 ${percent(st.accuracy)}</span></div>
    <div class="meter" aria-hidden="true"><span style="width:${total ? (st.done.length / total) * 100 : 0}%"></span></div>
    ${total ? `<div class="prac-types">${typeChips(st.ids)}</div>` : ''}
    <div class="prac-actions">
      <button class="btn btn-secondary" data-section="${key}" data-from-start="1" ${total ? '' : 'disabled'}>처음부터 보기</button>
      <button class="btn btn-primary" data-section="${key}" ${total ? '' : 'disabled'}>${st.left.length ? `이어서 풀기 · ${st.left.length}문제 남음` : '다시 풀기'}</button>
    </div>
  </li>`;
}

export default {
  render(el) {
    const daily = dailySet();
    el.innerHTML = `<div class="page">
      <header class="page-head" style="margin-left:0"><h1 class="h1">오늘의 연습</h1></header>
      <p class="sub" style="margin:-8px 0 16px">오늘 ${daily.total}문제 중 ${daily.done}문제를 풀었어요. 새 문제는 내일 다시 나와요.</p>
      <ul class="list">${Object.entries(SECTIONS).map(([k, m]) => card(daily, k, m)).join('')}</ul>
    </div>`;
    const onClick = (e) => {
      const btn = e.target.closest('button[data-section]');
      if (btn) startDailySection(btn.dataset.section, { fromStart: !!btn.dataset.fromStart, returnTo: 'practice' });
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
