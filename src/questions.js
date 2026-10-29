// 문제는 questions/index.json에 적힌 JSON 파일에서 읽는다. 코드는 문제 내용을 모른다.
import { SECTIONS } from '../config/exam.js';

const list = [];
const byId = new Map();
export const loadErrors = [];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function validate(q) {
  if (!q || typeof q !== 'object') return '문제 객체가 아니에요';
  if (!q.id) return 'id가 없어요';
  if (byId.has(q.id)) return 'id가 중복돼요';
  if (!SECTIONS[q.section]) return `알 수 없는 section "${q.section}"`;
  if (!q.stem) return 'stem이 없어요';
  if (!Array.isArray(q.choices) || q.choices.length < 2) return 'choices가 2개 미만이에요';
  if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > q.choices.length) {
    return 'answer는 1부터 보기 개수 사이의 정수여야 해요';
  }
  return null;
}

function normalize(q) {
  return {
    ...q,
    passage: q.passage || null,
    words: Array.isArray(q.words) ? q.words.filter((w) => w && w.surface) : [],
    verified: q.verified === true,
  };
}

export async function loadQuestions() {
  const index = await fetchJson('./questions/index.json');
  const files = await Promise.all(index.files.map((file) => fetchJson(`./questions/${file}`)
    .then((data) => [file, data])
    .catch((err) => {
      loadErrors.push(`${file}: ${err.message}`);
      return [file, []];
    })));

  for (const [file, data] of files) {
    for (const raw of Array.isArray(data) ? data : data.questions ?? []) {
      const error = validate(raw);
      if (error) {
        loadErrors.push(`${file} ${raw?.id ?? '(id 없음)'}: ${error}`);
        continue;
      }
      const q = normalize(raw);
      byId.set(q.id, q);
      list.push(q);
    }
  }
  if (loadErrors.length) console.warn('[questions]', loadErrors);
}

export const questions = {
  all: () => list,
  get: (id) => byId.get(id),
  bySection: (section) => list.filter((q) => q.section === section),
};
