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

export function renderStem(q) {
  const m = q.stem.match(UNDERLINE_NOTE);
  const stem = m ? q.stem.slice(0, m.index) : q.stem;
  const target = q.underline || m?.[1];
  const at = target ? stem.indexOf(target) : -1;
  if (at < 0) return esc(stem);
  return `${esc(stem.slice(0, at))}<u class="stem-ul">${esc(target)}</u>${esc(stem.slice(at + target.length))}`;
}
