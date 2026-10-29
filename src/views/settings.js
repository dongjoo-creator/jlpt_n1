import { state, setSetting, resetAll } from '../store.js';
import { questions, loadErrors } from '../questions.js';
import { go } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc } from '../ui/text.js';
import { toast } from '../ui/toast.js';

const STEP = 5;
const MIN = 5;
const MAX = 300;

export default {
  nav: 'home',
  render(el) {
    el.innerHTML = `<div class="page">
      <header class="page-head">
        <a class="icon-btn" href="#/home" aria-label="홈으로">${icons.chevronLeft}</a>
        <h1 class="h1">설정</h1>
      </header>
      <section class="card" data-anchor="goal">
        <div class="set-row">
          <div><p><b>하루 목표</b></p><p class="sub">홈 화면 링에 표시돼요</p></div>
          <div class="stepper">
            <button class="icon-btn" data-step="-1" aria-label="${STEP}문제 줄이기">${icons.minus}</button>
            <output aria-live="polite">${state.settings.dailyGoal}</output>
            <button class="icon-btn" data-step="1" aria-label="${STEP}문제 늘리기">${icons.plus}</button>
          </div>
        </div>
      </section>
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
        const goal = Math.min(MAX, Math.max(MIN, state.settings.dailyGoal + Number(btn.dataset.step) * STEP));
        setSetting('dailyGoal', goal);
        el.querySelector('output').textContent = goal;
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
