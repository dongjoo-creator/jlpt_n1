// 앱 상태. 시작할 때 IndexedDB에서 한 번 읽어 메모리에 두고, 바뀔 때마다 바로 저장한다.
import { db } from './db.js';
import { DAILY_PLAN_DEFAULT } from '../config/exam.js';

const defaultSettings = () => ({ dailyPlan: structuredClone(DAILY_PLAN_DEFAULT) });

export const state = {
  attempts: new Map(), // 문제 id → { tries, correct, wrong, last, lastAt }
  words: new Map(), // 단어 키 → 단어장 항목
  daily: new Map(), // 'YYYY-MM-DD' → { count, ids, answers } (ids: 그날의 '오늘의 문제')
  settings: defaultSettings(),
  session: null, // 지금 풀고 있는 세트
  persistent: true,
};

const save = (store, value) => {
  if (!state.persistent) return;
  db.put(store, value).catch((err) => console.warn('[store] 저장 실패', err));
};
const remove = (store, key) => {
  if (!state.persistent) return;
  db.del(store, key).catch((err) => console.warn('[store] 삭제 실패', err));
};

export async function loadStore() {
  try {
    const [attempts, words, daily, kv] = await Promise.all(db.stores.map((s) => db.all(s)));
    attempts.forEach((a) => state.attempts.set(a.id, a));
    words.forEach((w) => state.words.set(w.key, w));
    daily.forEach((d) => state.daily.set(d.date, d));
    for (const { key, value } of kv) {
      // 예전 버전의 dailyGoal 같은 값은 무시하고, 아는 칸만 덮어쓴다.
      if (key === 'settings') {
        for (const day of ['weekday', 'weekend']) Object.assign(state.settings.dailyPlan[day], value.dailyPlan?.[day]);
      }
      if (key === 'session') state.session = value;
    }
  } catch (err) {
    // 사생활 보호 모드 등에서 IndexedDB를 못 쓰면 메모리에서만 동작한다.
    console.warn('[store] IndexedDB 사용 불가', err);
    state.persistent = false;
  }
}

const pad = (n) => String(n).padStart(2, '0');
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function recordAnswer(q, choice) {
  const correct = choice === q.answer;
  const a = state.attempts.get(q.id) ?? { id: q.id, section: q.section, type: q.type, tries: 0, correct: 0, wrong: 0 };
  a.tries += 1;
  if (correct) a.correct += 1; else a.wrong += 1;
  a.last = correct ? 'correct' : 'wrong';
  a.lastAt = Date.now();
  state.attempts.set(q.id, a);
  save('attempts', a);

  const date = todayKey();
  const prev = state.daily.get(date);
  // answers: 오늘 고른 보기. 오늘 세트를 다시 열 때 푼 자리를 그대로 보여 준다.
  const d = { ...prev, date, count: (prev?.count ?? 0) + 1, answers: { ...prev?.answers, [q.id]: choice } };
  state.daily.set(date, d);
  save('daily', d);
  return correct;
}

export function setDailyIds(date, ids) {
  const d = { count: 0, ...state.daily.get(date), date, ids };
  state.daily.set(date, d);
  save('daily', d);
}

// 같은 표기·읽기의 단어는 한 번만 저장한다.
export const wordKey = (w) => `${w.surface.trim()}｜${(w.reading ?? '').trim()}`;
export const isSaved = (w) => state.words.has(wordKey(w));

export function toggleWord(w, q) {
  const key = wordKey(w);
  if (state.words.has(key)) {
    removeWord(key);
    return false;
  }
  const item = {
    key,
    surface: w.surface.trim(),
    reading: (w.reading ?? '').trim(),
    meaning_ko: w.meaning_ko ?? '',
    sourceId: q.id,
    section: q.section,
    type: q.type,
    status: 'learning',
    addedAt: Date.now(),
  };
  state.words.set(key, item);
  save('words', item);
  return true;
}

export function setWordStatus(key, status) {
  const item = state.words.get(key);
  if (!item) return;
  item.status = status;
  save('words', item);
}

export function removeWord(key) {
  state.words.delete(key);
  remove('words', key);
}

export function startSession({ title, ids, returnTo = 'home', daily = null, index = 0, answers = {}, results = {} }) {
  state.session = { title, ids, returnTo, daily, index, answers, results, tabs: {}, startedAt: Date.now() };
  saveSession();
}

export function saveSession() {
  save('kv', { key: 'session', value: state.session });
}

export function setSetting(name, value) {
  state.settings[name] = value;
  save('kv', { key: 'settings', value: state.settings });
}

export async function resetAll() {
  state.attempts.clear();
  state.words.clear();
  state.daily.clear();
  state.session = null;
  state.settings = defaultSettings();
  if (state.persistent) await Promise.all(db.stores.map((s) => db.clear(s)));
}
