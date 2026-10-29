import { state, todayCount } from '../store.js';
import { SECTIONS } from '../../config/exam.js';
import { sectionStats, startSection, continueStudy, continueLabel, daysUntilExam, examDateLabel } from '../study.js';
import { icons } from '../ui/icons.js';
import { esc, percent } from '../ui/text.js';

function ddayText(days) {
  if (days > 0) return `D-${days}`;
  if (days === 0) return 'D-DAY';
  return '시험 종료';
}

function ringHtml(done, goal) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(done / goal, 1);
  return `<div class="ring">
    <div class="ring-wrap">
      <svg class="ring-svg" viewBox="0 0 104 104" role="img" aria-label="오늘 목표 ${goal}문제 중 ${done}문제">
        <circle class="ring-track" cx="52" cy="52" r="${r}" fill="none" stroke-width="10"/>
        <circle class="ring-bar" cx="52" cy="52" r="${r}" fill="none" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - ratio)}" transform="rotate(-90 52 52)"/>
      </svg>
      <div class="ring-text" aria-hidden="true"><div><strong>${done}</strong><span>/ ${goal}문제</span></div></div>
    </div>
    <span class="ring-caption">${done >= goal ? '오늘 목표 달성' : '오늘 목표'}</span>
  </div>`;
}

function sectionCard(key, meta) {
  if (!meta.enabled) {
    return `<div class="card sec-card is-disabled" data-anchor="sec-${key}">
      <div class="sec-top"><span class="sec-name">${esc(meta.label)}</span></div>
      <p class="sec-note">${esc(meta.note ?? '준비 중이에요')}</p>
    </div>`;
  }
  const st = sectionStats(key);
  const progress = st.total ? st.solved / st.total : 0;
  return `<button class="card sec-card" data-section="${key}" data-anchor="sec-${key}" aria-label="${esc(meta.label)} 연습 시작">
    <div class="sec-top"><span class="sec-name">${esc(meta.label)}</span><span class="sec-count">${st.total}문제</span></div>
    <div class="meter" aria-hidden="true"><span style="width:${progress * 100}%"></span></div>
    <dl class="sec-stats">
      <div><dt>진행률</dt><dd>${percent(st.total ? progress : null)}</dd></div>
      <div><dt>정답률</dt><dd>${percent(st.accuracy)}</dd></div>
    </dl>
  </button>`;
}

export default {
  render(el) {
    const days = daysUntilExam();
    const goal = state.settings.dailyGoal;
    const cta = continueLabel();
    el.innerHTML = `<div class="page home">
      <header class="home-head" data-anchor="head">
        <div><p class="eyebrow">JLPT N1 연습</p><h1 class="h1">오늘도 한 문제씩</h1></div>
        <a class="icon-btn" href="#/settings" aria-label="설정">${icons.sliders}</a>
      </header>
      <section class="card hero" data-anchor="hero">
        <div>
          <span class="dday-label">시험까지</span>
          <strong class="dday-num">${ddayText(days)}</strong>
          <span class="dday-date">${examDateLabel()}</span>
        </div>
        ${ringHtml(todayCount(), goal)}
      </section>
      <div class="quick" data-anchor="quick">
        <a class="card quick-item" href="#/guide">${icons.info}<span>시험 안내<small>구성·시간·채점</small></span>${icons.chevronRight}</a>
        <a class="card quick-item" href="#/words">${icons.book}<span>단어장<small>${state.words.size}개 저장</small></span>${icons.chevronRight}</a>
      </div>
      <h2 class="section-title">유형별 연습</h2>
      <div class="sec-grid">${Object.entries(SECTIONS).map(([k, m]) => sectionCard(k, m)).join('')}</div>
      <div class="sticky-cta">
        <button class="btn btn-primary btn-lg btn-block" data-act="continue">
          <span class="stack"><span>${cta.title}</span><small>${esc(cta.sub)}</small></span>${icons.arrowRight}
        </button>
      </div>
    </div>`;

    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.section) startSection(btn.dataset.section, { returnTo: 'home' });
      if (btn.dataset.act === 'continue') continueStudy();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
