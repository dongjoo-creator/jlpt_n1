const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const percent = (ratio) => (ratio == null ? '–' : `${Math.round(ratio * 100)}%`);

// 지문 안의 어려운 단어에 점선 밑줄을 긋는다. 표기가 그대로 일치하는 곳만 잡는다(활용형은 못 잡음).
export function markWords(text, words) {
  const ranges = [];
  const order = words
    .map((w, i) => ({ surface: w.surface, i }))
    .sort((a, b) => b.surface.length - a.surface.length);
  for (const { surface, i } of order) {
    let at = text.indexOf(surface);
    while (at !== -1) {
      const end = at + surface.length;
      if (!ranges.some((r) => at < r.end && end > r.start)) ranges.push({ start: at, end, i });
      at = text.indexOf(surface, end);
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  let html = '';
  let pos = 0;
  for (const r of ranges) {
    html += esc(text.slice(pos, r.start));
    html += `<span class="wmark" role="button" tabindex="0" data-word="${r.i}">${esc(text.slice(r.start, r.end))}</span>`;
    pos = r.end;
  }
  return html + esc(text.slice(pos));
}

// stem 끝의 「（밑줄: 覆す）」 표기나 underline 필드가 있으면 그 부분에 실선 밑줄을 긋는다.
const UNDERLINE_NOTE = /\s*[（(]\s*밑줄\s*[:：]\s*(.+?)\s*[)）]\s*$/;

export function plainStem(q) {
  return q.stem.replace(UNDERLINE_NOTE, '');
}

// 단어장 예문: 단어를 저장한 문제에서 그 단어가 들어 있는 완성된 문장 하나를 꺼낸다.
// 빈칸은 정답으로, 문장배열 칸은 정답 순서로 채운다. 용법 문제는 정답 보기 문장을 쓴다.
const BLANK = /（\s*）/;
const SLOT = /（\s*[＿★]\s*）/g;
const sentences = (text) => text.split(/(?<=[。！？])|\n+/).map((s) => s.trim()).filter(Boolean);

function filledStem(q) {
  let stem = plainStem(q);
  if (Array.isArray(q.correct_order)) {
    let i = 0;
    stem = stem.replace(SLOT, () => q.choices[q.correct_order[i++] - 1] ?? '');
  } else {
    stem = stem.replace(BLANK, () => q.choices[q.answer - 1]);
  }
  return stem;
}

// 돌려주는 값: { text: 예문, word: 예문 안에서 단어에 해당하는 부분 }. 못 찾으면 null.
// 활용형(見合わせる → 見合わせて)도 잡도록, 안 맞으면 끝의 가나 한 글자를 떼고 한 번 더 찾는다.
export function exampleFor(q, surface) {
  if (!q) return null;
  const sources = (q.type === '용법'
    ? [q.choices[q.answer - 1]]
    : [q.passage, q.passage ? null : filledStem(q)]).filter(Boolean);
  const keys = [surface];
  if (surface.length > 2 && /[ぁ-ん]$/.test(surface)) keys.push(surface.slice(0, -1));
  for (const word of keys) {
    for (const text of sources) {
      const hit = sentences(text).find((s) => s.includes(word));
      if (hit) return { text: hit, word };
    }
  }
  return null;
}

export function renderStem(q) {
  const m = q.stem.match(UNDERLINE_NOTE);
  const stem = m ? q.stem.slice(0, m.index) : q.stem;
  const target = q.underline || m?.[1];
  const at = target ? stem.indexOf(target) : -1;
  if (at < 0) return esc(stem);
  return `${esc(stem.slice(0, at))}<u class="stem-ul">${esc(target)}</u>${esc(stem.slice(at + target.length))}`;
}
