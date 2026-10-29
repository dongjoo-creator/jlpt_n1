import { state } from '../store.js';
import { questions } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import {
  daysUntilExam, examDateLabel, dailySet, dailySection, startDailySection, mainAction, DAILY_SECTIONS,
} from '../study.js';
import { icons } from '../ui/icons.js';
import { esc, percent } from '../ui/text.js';

function ddayText(days) {
  if (days > 0) return `D-${days}`;
  if (days === 0) return 'D-DAY';
  return '시험 종료';
}

function ringHtml(done, goal, caption) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const ratio = goal ? Math.min(done / goal, 1) : 0;
  return `<div class="ring">
    <div class="ring-wrap">
      <svg class="ring-svg" viewBox="0 0 104 104" role="img" aria-label="오늘 목표 ${goal}문제 중 ${done}문제">
        <circle class="ring-track" cx="52" cy="52" r="${r}" fill="none" stroke-width="10"/>
        <circle class="ring-bar" cx="52" cy="52" r="${r}" fill="none" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - ratio)}" transform="rotate(-90 52 52)"/>
      </svg>
      <div class="ring-text" aria-hidden="true"><div><strong>${done}</strong><span>/ ${goal}문제</span></div></div>
    </div>
    <span class="ring-caption">${goal && done >= goal ? '오늘 목표 달성' : caption}</span>
  </div>`;
}

function sectionCard(daily, key, meta) {
  if (!meta.enabled) {
    return `<div class="card sec-card is-disabled" data-anchor="sec-${key}">
      <div class="sec-top"><span class="sec-name">${esc(meta.label)}</span></div>
      <p class="sec-note">${esc(meta.note ?? '준비 중이에요')}</p>
    </div>`;
  }
  const st = dailySection(daily, key);
  const total = st.ids.length;
  const progress = total ? st.done.length / total : 0;
  return `<button class="card sec-card" data-section="${key}" data-anchor="sec-${key}" aria-label="오늘의 ${esc(meta.label)} ${total}문제 중 ${st.done.length}문제 풀이, 풀기 시작">
    <div class="sec-top"><span class="sec-name">${esc(meta.label)}</span><span class="sec-count">${st.done.length}/${total}문제</span></div>
    <div class="meter" aria-hidden="true"><span style="width:${progress * 100}%"></span></div>
    <dl class="sec-stats">
      <div><dt>진행률</dt><dd>${percent(total ? progress : null)}</dd></div>
      <div><dt>정답률</dt><dd>${percent(st.accuracy)}</dd></div>
    </dl>
  </button>`;
}

export default {
  render(el) {
    const days = daysUntilExam();
    const daily = dailySet();
    const cta = mainAction(daily);
    if (cta.left) {
      const leftBy = (s) => cta.left.filter((id) => questions.get(id).section === s).length;
      const mix = DAILY_SECTIONS.filter(leftBy).map((s) => `${SECTIONS[s].label} ${leftBy(s)}`).join(' · ');
      cta.sub = `남은 ${cta.left.length}문제 · ${mix}`;
    }
    const headline = daily.total ? `오늘도 ${daily.total}문제 풀자` : '오늘도 한 문제씩';
    el.innerHTML = `<div class="page home">
      <header class="home-head" data-anchor="head">
        <div><p class="eyebrow">JLPT N1 연습</p><h1 class="h1">${headline}</h1></div>
        <a class="icon-btn" href="#/settings" aria-label="설정">${icons.sliders}</a>
      </header>
      <section class="card hero" data-anchor="hero">
        <div>
          <span class="dday-label">시험까지</span>
          <strong class="dday-num">${ddayText(days)}</strong>
          <span class="dday-date">${examDateLabel()}</span>
        </div>
        ${ringHtml(daily.done, daily.total, daily.weekend ? '주말 목표' : '평일 목표')}
      </section>
      <div class="quick" data-anchor="quick">
        <a class="card quick-item" href="#/guide">${icons.info}<span>시험 안내<small>구성·시간·채점</small></span>${icons.chevronRight}</a>
        <a class="card quick-item" href="#/words">${icons.book}<span>단어장<small>${state.words.size}개 저장</small></span>${icons.chevronRight}</a>
      </div>
      <h2 class="section-title">오늘의 영역별 문제</h2>
      <div class="sec-grid">${Object.entries(SECTIONS).map(([k, m]) => sectionCard(daily, k, m)).join('')}</div>
      <div class="sticky-cta">
        <button class="btn btn-primary btn-lg btn-block" data-act="continue">
          <span class="stack"><span>${cta.title}</span><small>${esc(cta.sub)}</small></span>${icons.arrowRight}
        </button>
      </div>
    </div>`;

    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.section) startDailySection(btn.dataset.section, { returnTo: 'home' });
      if (btn.dataset.act === 'continue') cta.run();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
