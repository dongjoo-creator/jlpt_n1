// 배포 전 점검. 실행: npm run check
// 1) 문제 JSON: 앱(src/questions.js)과 같은 규칙 + 단어·밑줄 표기 확인
// 2) sw.js SHELL_FILES: 빠진 앱 파일이나 없는 파일이 있는지 확인
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from '../config/exam.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const errors = [];
const warnings = [];

const readJson = async (rel) => JSON.parse(await readFile(join(root, rel), 'utf8'));

async function checkQuestions() {
  const { files } = await readJson('questions/index.json');
  const ids = new Set();
  let count = 0;
  for (const file of files) {
    let data;
    try {
      data = await readJson(`questions/${file}`);
    } catch (err) {
      errors.push(`${file}: 읽을 수 없어요 (${err.message})`);
      continue;
    }
    for (const q of Array.isArray(data) ? data : data.questions ?? []) {
      const at = `${file} ${q?.id ?? '(id 없음)'}`;
      if (!q || typeof q !== 'object') { errors.push(`${at}: 문제 객체가 아니에요`); continue; }
      if (!q.id) errors.push(`${at}: id가 없어요`);
      else if (ids.has(q.id)) errors.push(`${at}: id가 중복돼요`);
      ids.add(q.id);
      if (!SECTIONS[q.section]) errors.push(`${at}: 알 수 없는 section "${q.section}"`);
      if (!q.stem) errors.push(`${at}: stem이 없어요`);
      if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${at}: choices가 2개 미만이에요`);
      else if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > q.choices.length) {
        errors.push(`${at}: answer는 1부터 보기 개수 사이의 정수여야 해요`);
      }
      if (!q.translation_ko) warnings.push(`${at}: translation_ko(본문 번역)가 없어요`);
      count++;

      const text = `${q.passage ?? ''}\n${q.stem ?? ''}`;
      const mark = /（밑줄[:：]\s*(.+?)）\s*$/.exec(q.stem ?? '');
      const underline = q.underline ?? mark?.[1];
      if (underline && !text.replace(mark?.[0] ?? '', '').includes(underline)) {
        warnings.push(`${at}: 밑줄 "${underline}" 이 문장에 없어요`);
      }
      for (const w of Array.isArray(q.words) ? q.words : []) {
        if (!w?.surface) { warnings.push(`${at}: surface 없는 단어는 건너뛰어요`); continue; }
        if (q.passage && !q.passage.includes(w.surface)) {
          warnings.push(`${at}: 단어 "${w.surface}" 가 지문에 표기 그대로 없어 밑줄이 안 그어져요`);
        }
      }
    }
  }
  return count;
}

async function listFiles(dir) {
  const out = [];
  for (const ent of await readdir(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`;
    if (ent.isDirectory()) out.push(...await listFiles(rel));
    else out.push(rel);
  }
  return out;
}

async function checkShell() {
  const sw = await readFile(join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]).filter((p) => !p.startsWith('questions/')));
  const actual = ['index.html', 'manifest.webmanifest',
    ...(await Promise.all(['src', 'styles', 'config', 'icons'].map(listFiles))).flat()];
  for (const f of actual) if (!listed.has(f)) errors.push(`sw.js SHELL_FILES 에 빠졌어요: ./${f}`);
  for (const f of listed) if (!actual.includes(f)) errors.push(`sw.js SHELL_FILES 에 있는데 파일이 없어요: ./${f}`);
}

const count = await checkQuestions();
await checkShell();
for (const w of warnings) console.log(`주의  ${w}`);
for (const e of errors) console.log(`오류  ${e}`);
console.log(`문제 ${count}개, 오류 ${errors.length}개, 주의 ${warnings.length}개`);
process.exitCode = errors.length ? 1 : 0;
