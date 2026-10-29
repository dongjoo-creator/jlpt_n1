import { state, setSetting, resetAll } from '../store.js';
import { questions, loadErrors } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import { DAILY_SECTIONS, refreshDailyIfUntouched } from '../study.js';
import { go } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc } from '../ui/text.js';
import { toast } from '../ui/toast.js';

const STEP = 5;
const MIN = 0;
const MAX = 100;
const DAYS = [['weekday', '평일', '월–금'], ['weekend', '주말', '토·일']];

const total = (day) => DAILY_SECTIONS.reduce((sum, s) => sum + state.settings.dailyPlan[day][s], 0);

function planCard([day, label, range]) {
  const plan = state.settings.dailyPlan[day];
  return `<section class="card" data-anchor="plan-${day}">
    <div class="comp-head"><h3>${label} <span class="sub">${range}</span></h3><span data-total="${day}">${total(day)}문제</span></div>
    ${DAILY_SECTIONS.map((s) => `<div class="set-row">
      <p><b>${esc(SECTIONS[s].label)}</b></p>
      <div class="stepper">
        <button class="icon-btn" data-day="${day}" data-sec="${s}" data-step="-1" aria-label="${label} ${esc(SECTIONS[s].label)} ${STEP}문제 줄이기">${icons.minus}</button>
        <output aria-live="polite" data-out="${day}-${s}">${plan[s]}</output>
        <button class="icon-btn" data-day="${day}" data-sec="${s}" data-step="1" aria-label="${label} ${esc(SECTIONS[s].label)} ${STEP}문제 늘리기">${icons.plus}</button>
      </div>
    </div>`).join('')}
  </section>`;
}

export default {
  nav: 'home',
  render(el) {
    el.innerHTML = `<div class="page">
      <header class="page-head">
        <a class="icon-btn" href="#/home" aria-label="홈으로">${icons.chevronLeft}</a>
        <h1 class="h1">설정</h1>
      </header>
      <h2 class="section-title">오늘의 문제</h2>
      ${DAYS.map(planCard).join('')}
      <p class="note" data-anchor="plan-note">오늘 세트를 아직 안 풀었으면 바로 반영되고, 풀기 시작했으면 내일 세트부터 반영돼요.</p>
      <h2 class="section-title">문제 데이터</h2>
      <section class="card" data-anchor="data">
        <p>불러온 문제 <b>${questions.all().length}개</b> · 검수 전 ${questions.all().filter((q) => !q.verified).length}개</p>
        ${loadErrors.length ? `<p class="sub" style="margin-top:8px">불러오지 못한 문제</p><ul class="err-list">${loadErrors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      </section>
      <h2 class="section-title">기록</h2>
      <section class="card" data-anchor="reset">
        <p class="sub" style="margin-bottom:12px">풀이 기록·오답노트·단어장은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 함께 사라져요.</p>
        <button class="btn btn-danger btn-block" data-act="reset">${icons.trash}모든 기록 초기화</button>
      </section>
    </div>`;

    const onClick = async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.step) {
        const { day, sec } = btn.dataset;
        const plan = structuredClone(state.settings.dailyPlan);
        plan[day][sec] = Math.min(MAX, Math.max(MIN, plan[day][sec] + Number(btn.dataset.step) * STEP));
        setSetting('dailyPlan', plan);
        refreshDailyIfUntouched();
        el.querySelector(`[data-out="${day}-${sec}"]`).textContent = plan[day][sec];
        el.querySelector(`[data-total="${day}"]`).textContent = `${total(day)}문제`;
      } else if (btn.dataset.act === 'reset') {
        if (!window.confirm('풀이 기록, 오답노트, 단어장을 모두 지울까요? 되돌릴 수 없어요.')) return;
        await resetAll();
        toast('모든 기록을 지웠어요');
        go('home');
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
