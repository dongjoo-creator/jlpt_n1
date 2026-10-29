// 통계 계산과 풀이 세트 시작. 여러 화면이 같이 쓴다.
import { state, startSession } from './store.js';
import { questions } from './questions.js';
import { SECTIONS, EXAM } from '../config/exam.js';
import { go } from './router.js';
import { toast } from './ui/toast.js';

export function sectionStats(section) {
  const qs = questions.bySection(section);
  let solved = 0;
  let tries = 0;
  let correct = 0;
  for (const q of qs) {
    const a = state.attempts.get(q.id);
    if (!a) continue;
    solved += 1;
    tries += a.tries;
    correct += a.correct;
  }
  return { total: qs.length, solved, accuracy: tries ? correct / tries : null };
}

export function wrongEntries() {
  return [...state.attempts.values()]
    .filter((a) => a.wrong > 0 && questions.get(a.id))
    .sort((a, b) => b.lastAt - a.lastAt);
}

export function openSession() {
  const s = state.session;
  return s && s.index < s.ids.length ? s : null;
}

const isSolved = (q) => state.attempts.has(q.id);
const enabled = (q) => SECTIONS[q.section]?.enabled;

export function startSection(section, { onlyUnsolved = false, returnTo = 'home' } = {}) {
  const qs = questions.bySection(section);
  const unsolved = qs.filter((q) => !isSolved(q));
  const picked = onlyUnsolved ? unsolved : [...unsolved, ...qs.filter(isSolved)];
  if (!picked.length) {
    toast(onlyUnsolved ? '안 푼 문제가 없어요' : '아직 문제가 없어요');
    return;
  }
  startSession({ title: SECTIONS[section].label, ids: picked.map((q) => q.id), returnTo });
  go('quiz');
}

export function startIds(title, ids, returnTo) {
  if (!ids.length) return;
  startSession({ title, ids, returnTo });
  go('quiz');
}

// "이어서 풀기": 풀던 세트가 있으면 그대로, 없으면 안 푼 문제부터.
export function continueStudy() {
  if (openSession()) return go('quiz');
  const all = questions.all().filter(enabled);
  const unsolved = all.filter((q) => !isSolved(q));
  if (unsolved.length) return startIds('안 푼 문제', unsolved.map((q) => q.id), 'home');
  return startIds('전체 복습', all.map((q) => q.id), 'home');
}

export function continueLabel() {
  const s = openSession();
  if (s) return { title: '이어서 풀기', sub: `${s.title} ${s.index + 1}/${s.ids.length}` };
  const unsolved = questions.all().filter((q) => enabled(q) && !isSolved(q)).length;
  if (unsolved) return { title: '이어서 풀기', sub: `안 푼 문제 ${unsolved}개` };
  return { title: '전체 복습하기', sub: `${questions.all().filter(enabled).length}문제` };
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
