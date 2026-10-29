import { state } from '../store.js';
import { questions } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import { sectionStats, startSection } from '../study.js';
import { esc, percent } from '../ui/text.js';

function typeChips(section) {
  const counts = new Map();
  for (const q of questions.bySection(section)) counts.set(q.type, (counts.get(q.type) ?? 0) + 1);
  return [...counts].map(([type, n]) => `<span class="chip">${esc(type)} ${n}</span>`).join('');
}

function card(key, meta) {
  if (!meta.enabled) {
    return `<li class="card prac-card" data-anchor="p-${key}">
      <div class="prac-head"><h2>${esc(meta.label)}</h2></div>
      <p class="sub">${esc(meta.note ?? '준비 중이에요')}</p>
    </li>`;
  }
  const st = sectionStats(key);
  const unsolved = st.total - st.solved;
  return `<li class="card prac-card" data-anchor="p-${key}">
    <div class="prac-head"><h2>${esc(meta.label)}</h2><span class="sub">${st.solved}/${st.total} 풀이 · 정답률 ${percent(st.accuracy)}</span></div>
    <div class="meter" aria-hidden="true"><span style="width:${st.total ? (st.solved / st.total) * 100 : 0}%"></span></div>
    ${st.total ? `<div class="prac-types">${typeChips(key)}</div>` : ''}
    <div class="prac-actions">
      <button class="btn btn-secondary" data-section="${key}" ${st.total ? '' : 'disabled'}>전체 ${st.total}문제</button>
      <button class="btn btn-primary" data-section="${key}" data-only="1" ${unsolved ? '' : 'disabled'}>안 푼 문제 ${unsolved}</button>
    </div>
  </li>`;
}

export default {
  render(el) {
    const total = questions.all().length;
    const solved = questions.all().filter((q) => state.attempts.has(q.id)).length;
    el.innerHTML = `<div class="page">
      <header class="page-head" style="margin-left:0"><h1 class="h1">연습</h1></header>
      <p class="sub" style="margin:-8px 0 16px">전체 ${total}문제 중 ${solved}문제를 풀었어요</p>
      <ul class="list">${Object.entries(SECTIONS).map(([k, m]) => card(k, m)).join('')}</ul>
    </div>`;
    const onClick = (e) => {
      const btn = e.target.closest('button[data-section]');
      if (btn) startSection(btn.dataset.section, { onlyUnsolved: !!btn.dataset.only, returnTo: 'practice' });
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
