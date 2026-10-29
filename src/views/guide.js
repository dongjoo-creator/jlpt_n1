import { COMPOSITION, TIME_PLAN, SCORING } from '../../config/exam.js';
import { setHash } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc } from '../ui/text.js';

const TABS = [['compose', '구성'], ['time', '시간 배분'], ['score', '채점']];
const SEG_COLORS = [
  ['var(--accent-2)', '#fff'],
  ['var(--accent-3)', 'var(--text)'],
  ['var(--accent)', '#fff'],
  ['var(--accent-4)', 'var(--text)'],
];

function compose() {
  const star = (on) => (on ? '<span class="star" aria-label="주의">*</span>' : '');
  return `<section class="card" data-anchor="parts">
      ${COMPOSITION.parts.map((p) => `<div class="part-row"><span>${esc(p.label)}${star(p.star)}</span><strong>${p.minutes}분</strong></div>`).join('')}
    </section>
    ${COMPOSITION.sections.map((s, i) => `<section class="card" data-anchor="comp-${i}">
      <div class="comp-head"><h3>${esc(s.label)}${star(s.star)}</h3><span>약 ${s.approx}문</span></div>
      <ul class="comp-list">${s.items.map(([name, n]) => `<li><span>${esc(name)}</span><b>${n}</b></li>`).join('')}</ul>
    </section>`).join('')}
    <p class="note" data-anchor="comp-note"><span class="star">*</span> ${esc(COMPOSITION.note)}</p>`;
}

function time() {
  const { total, segments } = TIME_PLAN;
  let acc = 0;
  const rows = segments.map((s, i) => {
    const start = acc;
    acc += s.minutes;
    return { ...s, start, end: acc, color: SEG_COLORS[i % SEG_COLORS.length] };
  });
  // 눈금끼리 너무 붙으면 글자가 겹치므로 중간 눈금은 건너뛴다 (범례에 구간이 모두 나온다).
  const ticks = [0];
  for (const r of rows.slice(0, -1)) {
    if (r.end - ticks.at(-1) >= total * 0.08 && total - r.end >= total * 0.08) ticks.push(r.end);
  }
  ticks.push(total);
  return `<section class="card" data-anchor="bar">
      <div class="comp-head"><h3>언어지식·독해 ${total}분</h3><span>누적</span></div>
      <div class="stack-bar" role="img" aria-label="${rows.map((r) => `${r.label} ${r.minutes}분`).join(', ')}">
        ${rows.map((r) => `<div style="flex:${r.minutes};background:${r.color[0]};color:${r.color[1]}">${r.minutes / total >= 0.1 ? `<span>${esc(r.label)}</span><span>${r.minutes}분</span>` : ''}</div>`).join('')}
      </div>
      <div class="stack-ticks" aria-hidden="true">${ticks.map((t) => `<span style="left:${(t / total) * 100}%">${t}</span>`).join('')}</div>
      <ul class="legend">${rows.map((r) => `<li><i style="background:${r.color[0]}"></i>${esc(r.label)} ${r.minutes}분<span class="range">${r.start}–${r.end}분</span></li>`).join('')}</ul>
    </section>
    <section class="card" data-anchor="tips">
      <div class="comp-head"><h3>꿀팁</h3></div>
      <ol class="tips">${TIME_PLAN.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    </section>
    <p class="note" data-anchor="time-note">${esc(TIME_PLAN.disclaimer)}</p>`;
}

function scoreBar(label, max, min) {
  const at = (min / max) * 100;
  return `<div class="score-row">
    <div class="score-row-head"><span>${esc(label)}</span><b>${max}점</b></div>
    <div class="score-track" role="img" aria-label="${esc(label)} ${max}점 만점, 기준점 ${min}점">
      <div class="pass-zone" style="left:${at}%"></div>
      <div class="score-line" style="left:${at}%"><span>기준점 ${min}</span></div>
    </div>
    <div class="score-scale" aria-hidden="true"><span>0</span><span>${max}</span></div>
  </div>`;
}

function score() {
  const minLabel = SCORING.sections[0].min;
  return `<section class="card" data-anchor="total">
      <div class="score-total"><strong>${SCORING.total}점</strong><span class="sub">만점 (영역당 ${SCORING.sections[0].max}점)</span></div>
      <p class="score-rule">합격 조건: 총점 <b>${SCORING.pass}점 이상</b> + 세 영역 각각 <b>${minLabel}점 이상</b></p>
    </section>
    <section class="card" data-anchor="bars">
      <div class="comp-head"><h3>영역별 기준점</h3></div>
      ${SCORING.sections.map((s) => scoreBar(s.label, s.max, s.min)).join('')}
      ${scoreBar('총점', SCORING.total, SCORING.pass).replace(/기준점 (\d+)/, '합격선 $1')}
    </section>
    <p class="note" data-anchor="score-note">한 영역이라도 기준점(${minLabel}점)에 못 미치면 총점이 높아도 불합격이에요. 진한 구간이 기준점 이상이에요.</p>`;
}

const PANES = { compose, time, score };

export default {
  nav: 'home',
  render(el, [tab0]) {
    let tab = PANES[tab0] ? tab0 : 'compose';
    el.innerHTML = `<div class="page guide">
      <header class="page-head">
        <a class="icon-btn" href="#/home" aria-label="홈으로">${icons.chevronLeft}</a>
        <h1 class="h1">시험 안내</h1>
      </header>
      <div class="seg" role="tablist" aria-label="시험 안내">
        ${TABS.map(([k, label]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${label}</button>`).join('')}
      </div>
      <div class="guide-pane" role="tabpanel"></div>
    </div>`;
    const pane = el.querySelector('.guide-pane');
    const draw = () => {
      pane.innerHTML = PANES[tab]();
      el.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    };
    draw();
    const onClick = (e) => {
      const btn = e.target.closest('[role="tab"]');
      if (!btn || btn.dataset.tab === tab) return;
      tab = btn.dataset.tab;
      setHash(`guide/${tab}`);
      draw();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
