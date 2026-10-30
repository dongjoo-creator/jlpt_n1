// 통계 계산과 풀이 세트 시작. 여러 화면이 같이 쓴다.
// 새 문제는 '오늘의 문제' 세트 안에서만 푼다. 세트 밖은 오답노트 복습뿐이다.
import { state, startSession, todayKey, setDailyIds } from './store.js';
import { questions } from './questions.js';
import { SECTIONS, EXAM } from '../config/exam.js';
import { go } from './router.js';
import { toast } from './ui/toast.js';

export function wrongEntries() {
  return [...state.attempts.values()]
    .filter((a) => a.wrong > 0 && questions.get(a.id))
    .sort((a, b) => b.lastAt - a.lastAt);
}

export function openSession() {
  const s = state.session;
  return s && s.index < s.ids.length ? s : null;
}

export function startIds(title, ids, returnTo, daily = null) {
  if (!ids.length) return;
  startSession({ title, ids, returnTo, daily });
  go('quiz');
}

// ── 오늘의 문제 ──────────────────────────────────────────
// 날짜마다 한 번 뽑아 저장하므로 하루 동안은 같은 세트가 나온다.
// 뽑는 순서: 안 푼 문제 → 마지막에 틀린 문제 → 맞힌 지 오래된 문제.
// 같은 지문을 쓰는 독해 문제는 떨어뜨리지 않고 함께 넣는다.
export const DAILY_SECTIONS = ['vocab', 'grammar', 'reading'];

export const isWeekend = (d = new Date()) => d.getDay() === 0 || d.getDay() === 6;
export const todayPlan = () => state.settings.dailyPlan[isWeekend() ? 'weekend' : 'weekday'];

const startOfToday = () => new Date().setHours(0, 0, 0, 0);
const doneToday = (id) => (state.attempts.get(id)?.lastAt ?? 0) >= startOfToday();

// 날짜 문자열로 정해지는 난수. 같은 날에는 같은 순서로 섞인다.
function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSection(section, n, rand) {
  const groups = new Map();
  for (const q of questions.bySection(section)) {
    const key = q.passage ?? q.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  const units = [...groups.values()].map((qs) => {
    const as = qs.map((q) => state.attempts.get(q.id));
    const rank = as.some((a) => !a) ? 0 : as.some((a) => a.last === 'wrong') ? 1 : 2;
    return { qs, rank, lastAt: Math.min(...as.map((a) => a?.lastAt ?? 0)), r: rand() };
  });
  units.sort((a, b) => a.rank - b.rank || (a.rank ? a.lastAt - b.lastAt : a.r - b.r));
  const picked = [];
  for (const u of units) {
    if (picked.length + u.qs.length <= n) picked.push(...u.qs);
    if (picked.length === n) break;
  }
  return picked.map((q) => q.id);
}

function buildDaily(date) {
  const rand = seededRandom(date);
  const plan = todayPlan();
  return DAILY_SECTIONS.flatMap((s) => (SECTIONS[s].enabled ? pickSection(s, plan[s] ?? 0, rand) : []));
}

export function dailySet() {
  const date = todayKey();
  let ids = (state.daily.get(date)?.ids ?? []).filter((id) => questions.get(id));
  // 문제가 모자랄 때 뽑아 둔 세트는, 아직 안 풀었으면 문제가 늘어난 뒤 다시 뽑는다.
  const planned = DAILY_SECTIONS.reduce((sum, s) => sum + (todayPlan()[s] ?? 0), 0);
  if (ids.length < planned && !ids.some(doneToday)) ids = [];
  if (!ids.length) {
    ids = buildDaily(date);
    if (ids.join() !== (state.daily.get(date)?.ids ?? []).join()) setDailyIds(date, ids);
  }
  const bySection = Object.fromEntries(DAILY_SECTIONS.map((s) => [s, 0]));
  for (const id of ids) bySection[questions.get(id).section] += 1;
  return { date, ids, bySection, total: ids.length, done: ids.filter(doneToday).length, weekend: isWeekend() };
}

// 설정을 바꿨을 때: 오늘 세트를 아직 하나도 안 풀었으면 새 설정으로 다시 뽑는다.
export function refreshDailyIfUntouched() {
  const date = todayKey();
  const ids = state.daily.get(date)?.ids;
  if (!ids?.some(doneToday)) setDailyIds(date, buildDaily(date));
}

// 오늘 세트 안의 한 영역: 몇 문제 중 몇 문제를 풀었고, 푼 것 중 몇 %를 맞혔는지.
export function dailySection(set, section) {
  const ids = set.ids.filter((id) => questions.get(id).section === section);
  const done = ids.filter(doneToday);
  const correct = done.filter((id) => state.attempts.get(id).last === 'correct').length;
  return { ids, done, left: ids.filter((id) => !doneToday(id)), accuracy: done.length ? correct / done.length : null };
}

// 오늘 세트의 문제 목록을 연다. 오늘 고른 답은 미리 채우고, 처음 안 푼 문제에서 시작한다.
// 그래서 10문제 중 3문제를 풀고 나갔다 오면 "4 / 10"부터 이어진다.
function openDaily(title, ids, returnTo, date, fromStart = false) {
  const saved = state.daily.get(date)?.answers ?? {};
  const answers = {};
  const results = {};
  for (const id of ids) {
    if (saved[id] == null) continue;
    answers[id] = saved[id];
    results[id] = saved[id] === questions.get(id).answer;
  }
  const first = ids.findIndex((id) => answers[id] == null && !doneToday(id));
  const index = fromStart || first < 0 ? 0 : first;
  startSession({ title, ids, returnTo, daily: date, index, answers, results });
  go('quiz');
}

export function startDailySection(section, { fromStart = false, returnTo = 'home' } = {}) {
  const set = dailySet();
  const { ids, left } = dailySection(set, section);
  if (!ids.length) return toast('오늘은 이 영역 문제가 없어요');
  // 다 푼 영역을 다시 누르면 답을 비운 채 처음부터 복습한다.
  if (!left.length && !fromStart) return startIds(`${SECTIONS[section].label} · 복습`, ids, returnTo);
  return openDaily(`${SECTIONS[section].label} · 오늘`, ids, returnTo, set.date, fromStart);
}

// 홈의 큰 버튼: 남은 오늘 문제 → 풀던 복습 세트 이어서 → 오늘 문제 다시 풀기.
export function mainAction(set = dailySet()) {
  const left = set.ids.filter((id) => !doneToday(id));
  const s = openSession();
  if (left.length) {
    return {
      title: set.done ? '오늘의 문제 이어서 풀기' : '오늘의 문제 풀기',
      left,
      run: () => openDaily('오늘의 문제', set.ids, 'home', set.date),
    };
  }
  if (s && !s.daily) return { title: '이어서 풀기', sub: `${s.title} ${s.index + 1}/${s.ids.length}`, run: () => go('quiz') };
  return {
    title: '오늘 문제 다시 풀기',
    sub: set.total ? `오늘 목표 달성 · ${set.total}문제` : '아직 문제가 없어요',
    run: () => (set.total ? startIds('오늘의 문제 복습', set.ids, 'home') : toast('아직 문제가 없어요')),
  };
}

export function daysUntilExam(now = new Date()) {
  const [y, m, d] = EXAM.date.split('-').map(Number);
  const exam = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((exam - today) / 86400000);
}

export function examDateLabel() {
  const [y, m, d] = EXAM.date.split('-').map(Number);
  const wd = '일월화수목금토'[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${wd})`;
}
