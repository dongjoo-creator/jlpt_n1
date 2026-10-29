// 문제 풀이. 선택한 보기·열린 탭·진행 위치는 세션에 바로 저장해서
// 화면 크기가 바뀌거나 앱을 다시 열어도 그대로 이어진다.
import { state, recordAnswer, saveSession, toggleWord, isSaved, wordKey, startSession } from '../store.js';
import { questions } from '../questions.js';
import { SECTIONS } from '../../config/exam.js';
import { go } from '../router.js';
import { icons } from '../ui/icons.js';
import { esc, markWords, renderStem, plainStem } from '../ui/text.js';
import { keepScroll, forgetScroll } from '../ui/scroll.js';
import { toast } from '../ui/toast.js';

const choiceState = (q, picked, n) => {
  if (picked == null) return { cls: '', tag: '' };
  if (n === q.answer) return { cls: 'is-correct', tag: `<span class="tag tag-ok">${icons.check}정답</span>` };
  if (n === picked) return { cls: 'is-wrong', tag: `<span class="tag tag-ng">${icons.x}오답</span>` };
  return { cls: '', tag: '' };
};

function choicesHtml(q, picked) {
  return q.choices.map((c, i) => {
    const n = i + 1;
    const { cls, tag } = choiceState(q, picked, n);
    return `<li><button class="choice ${cls}" data-choice="${n}" ${picked != null ? 'disabled' : ''}>
      <span class="choice-no">${n}</span><span class="choice-text">${esc(c)}</span>${tag}
    </button></li>`;
  }).join('');
}

function wordListHtml(q) {
  if (!q.words.length) return '<p class="sub">이 문제에는 정리된 단어가 없어요.</p>';
  return `<ul class="wlist">${q.words.map((w, i) => {
    const saved = isSaved(w);
    return `<li class="word">
      <div class="word-main">
        <span class="word-surface">${esc(w.surface)}</span><span class="word-reading">${esc(w.reading)}</span>
        <span class="word-meaning">${esc(w.meaning_ko)}</span>
      </div>
      <button class="icon-btn bm" data-bm="${i}" data-key="${esc(wordKey(w))}" aria-pressed="${saved}"
        aria-label="${esc(w.surface)} 단어장에 ${saved ? '저장됨' : '저장'}">${saved ? icons.bookmarkFilled : icons.bookmark}</button>
    </li>`;
  }).join('')}</ul>`;
}

function resultHtml(q, picked) {
  if (picked == null) return '';
  const correct = picked === q.answer;
  return correct
    ? `<div class="result-banner ok">${icons.check}정답이에요</div>`
    : `<div class="result-banner ng">${icons.x}오답이에요 <span>정답은 ${q.answer}번 「${esc(q.choices[q.answer - 1])}」</span></div>`;
}

function panelHtml(q, picked, tab) {
  if (picked == null) return '';
  const order = Array.isArray(q.correct_order)
    ? `<p class="order">정답 순서 <b>${q.correct_order.join(' → ')}</b>${q.star_position ? ` · ★는 ${q.star_position}번째 칸` : ''}</p>`
    : '';
  return `<section class="card panel" data-anchor="panel" data-tab="${tab}">
    <div class="tabs" role="tablist">
      <button class="tab tab-expl" role="tab" data-tab="expl" aria-selected="${tab === 'expl'}">해설</button>
      <button class="tab tab-words" role="tab" data-tab="words" aria-selected="${tab === 'words'}">어려운 단어<span class="n">${q.words.length}</span></button>
    </div>
    <div class="pane pane-expl" role="tabpanel"><p class="expl">${esc(q.explanation_ko || '해설이 아직 없어요.')}</p>${order}</div>
    <div class="pane pane-words" role="tabpanel">${wordListHtml(q)}</div>
  </section>`;
}

function dynamicHtml(q, s) {
  const picked = s.answers[q.id];
  return `<ol class="choices" data-anchor="choices">${choicesHtml(q, picked)}</ol>
    <div aria-live="polite" data-anchor="result">${resultHtml(q, picked)}</div>
    ${panelHtml(q, picked, s.tabs[q.id] ?? 'expl')}`;
}

function topHtml(s, label, ratio) {
  return `<header class="quiz-top"><div class="bar-inner">
    <button class="icon-btn" data-act="close" aria-label="풀이 닫기">${icons.x}</button>
    <span class="quiz-title">${esc(s.title)}</span>
    <span class="quiz-count">${label}</span>
    <div class="progress" role="progressbar" aria-label="진행" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio * 100)}"><span style="width:${ratio * 100}%"></span></div>
  </div></header>`;
}

function questionHtml(s, q) {
  const picked = s.answers[q.id];
  const last = s.index === s.ids.length - 1;
  const left = q.passage ? `<section class="q-left">
      <article class="card" data-anchor="passage">
        <p class="card-label">지문</p>
        <div class="passage jp">${markWords(q.passage, q.words)}</div>
      </article>
      <section class="card words-side" data-anchor="words-side">
        <h3>어려운 단어 ${q.words.length}</h3>${wordListHtml(q)}
      </section>
    </section>` : '';
  return `${topHtml(s, `${s.index + 1} / ${s.ids.length}`, (s.index + (picked != null ? 1 : 0)) / s.ids.length)}
    <div class="quiz-body">
      ${left}
      <section class="q-right">
        <article class="card" data-anchor="stem">
          <div class="q-meta">
            <span class="chip">${esc(SECTIONS[q.section].label)} · ${esc(q.type)}</span>
            ${q.verified ? '' : `<span class="badge-draft">${icons.alert}검수 전</span>`}
            <span class="q-id">${esc(q.id)}</span>
          </div>
          <p class="stem jp">${renderStem(q)}</p>
        </article>
        <div class="q-dyn">${dynamicHtml(q, s)}</div>
      </section>
    </div>
    <div class="word-tip" hidden></div>
    <footer class="quiz-actions"><div class="bar-inner">
      <button class="btn btn-secondary btn-lg" data-act="retry" ${picked == null ? 'disabled' : ''}>${icons.refresh}다시 풀기</button>
      <button class="btn btn-primary btn-lg" data-act="next">${last ? '결과 보기' : '다음 문제'}${icons.arrowRight}</button>
    </div></footer>`;
}

function summaryHtml(s) {
  const items = s.ids.map((id) => questions.get(id)).filter(Boolean);
  const correct = items.filter((q) => s.results[q.id] === true).length;
  const wrong = items.filter((q) => s.results[q.id] === false).length;
  const row = (q) => {
    const r = s.results[q.id];
    const tag = r === true ? `<span class="tag tag-ok">${icons.check}정답</span>`
      : r === false ? `<span class="tag tag-ng">${icons.x}오답</span>`
        : '<span class="tag tag-skip">건너뜀</span>';
    return `<li class="card sum-item">${tag}<p>${esc(plainStem(q))}</p></li>`;
  };
  return `${topHtml(s, '완료', 1)}
    <div class="quiz-body"><div class="q-right">
      <section class="card summary-score" data-anchor="score">
        <p class="sub">이번 세트 정답</p>
        <strong>${correct} / ${items.length}</strong>
        <p class="sub">오답 ${wrong}개 · 건너뜀 ${items.length - correct - wrong}개</p>
      </section>
      <ul class="list" data-anchor="sum-list">${items.map(row).join('')}</ul>
    </div></div>
    <footer class="quiz-actions"><div class="bar-inner">
      <button class="btn btn-secondary btn-lg" data-act="retry-wrong" ${wrong ? '' : 'disabled'}>${icons.refresh}오답 다시 풀기</button>
      <button class="btn btn-primary btn-lg" data-act="done">완료</button>
    </div></footer>`;
}

export default {
  chrome: 'none',
  nav: 'practice',
  render(el) {
    const s = state.session;
    if (!s) {
      go('home', { replace: true });
      return null;
    }
    const root = document.createElement('div');
    el.append(root);
    let release = null;
    const current = () => questions.get(s.ids[s.index]);

    const draw = () => {
      release?.();
      if (s.index >= s.ids.length) {
        root.className = 'quiz';
        root.innerHTML = summaryHtml(s);
        release = keepScroll(root, [root.querySelector('.quiz-body')], `quiz:summary:${s.startedAt}`);
        return;
      }
      const q = current();
      if (!q) { // 문제 파일에서 빠진 문제는 건너뛴다
        s.index += 1;
        saveSession();
        draw();
        return;
      }
      root.className = `quiz${q.passage ? ' has-passage' : ''}`;
      root.innerHTML = questionHtml(s, q);
      const scrollers = [...root.querySelectorAll('.q-left, .q-right'), root.querySelector('.quiz-body')];
      release = keepScroll(root, scrollers, `quiz:${s.startedAt}:${q.id}`);
    };

    const refresh = (q) => {
      root.querySelector('.q-dyn').innerHTML = dynamicHtml(q, s);
      root.querySelector('[data-act="retry"]').disabled = s.answers[q.id] == null;
      const picked = s.answers[q.id];
      const bar = root.querySelector('.progress');
      const ratio = (s.index + (picked != null ? 1 : 0)) / s.ids.length;
      bar.firstElementChild.style.width = `${ratio * 100}%`;
      bar.setAttribute('aria-valuenow', Math.round(ratio * 100));
    };

    const tip = () => root.querySelector('.word-tip');
    const hideTip = () => {
      if (tip()) tip().hidden = true;
      root.querySelectorAll('.wmark.is-flash').forEach((m) => m.classList.remove('is-flash'));
    };
    const showTip = (q, mark) => {
      hideTip();
      const i = Number(mark.dataset.word);
      const w = q.words[i];
      // 넓은 화면에서는 왼쪽 단어 카드에 이미 있으니 해당 줄로 이동만 한다.
      const side = root.querySelector('.words-side');
      if (side && side.getClientRects().length) {
        side.querySelectorAll('.word')[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        mark.classList.add('is-flash');
        setTimeout(() => mark.classList.remove('is-flash'), 1200);
        return;
      }
      const saved = isSaved(w);
      const t = tip();
      t.innerHTML = `<div class="word-main">
          <span class="word-surface">${esc(w.surface)}</span><span class="word-reading">${esc(w.reading)}</span>
          <span class="word-meaning">${esc(w.meaning_ko)}</span>
        </div>
        <button class="icon-btn bm" data-bm="${i}" data-key="${esc(wordKey(w))}" aria-pressed="${saved}" aria-label="${esc(w.surface)} 단어장에 ${saved ? '저장됨' : '저장'}">${saved ? icons.bookmarkFilled : icons.bookmark}</button>
        <button class="icon-btn" data-act="tip-close" aria-label="닫기">${icons.x}</button>`;
      t.hidden = false;
      mark.classList.add('is-flash');
    };

    const onClick = (e) => {
      const mark = e.target.closest('.wmark');
      const btn = e.target.closest('button');
      const q = current();
      if (mark && q) return showTip(q, mark);
      if (!btn) return hideTip();
      if (!btn.closest('.word-tip')) hideTip();

      if (btn.dataset.choice && q) {
        if (s.answers[q.id] != null) return;
        const n = Number(btn.dataset.choice);
        s.answers[q.id] = n;
        s.results[q.id] = recordAnswer(q, n);
        s.tabs[q.id] = 'expl';
        saveSession();
        refresh(q);
        root.querySelector('[data-anchor="result"]').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      if (btn.dataset.tab && q) {
        s.tabs[q.id] = btn.dataset.tab;
        saveSession();
        const panel = root.querySelector('.panel');
        panel.dataset.tab = btn.dataset.tab;
        panel.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t === btn)));
        return;
      }
      if (btn.dataset.bm && q) {
        const w = q.words[Number(btn.dataset.bm)];
        const saved = toggleWord(w, q);
        root.querySelectorAll(`.bm[data-key="${CSS.escape(wordKey(w))}"]`).forEach((b) => {
          b.setAttribute('aria-pressed', String(saved));
          b.setAttribute('aria-label', `${w.surface} 단어장에 ${saved ? '저장됨' : '저장'}`);
          b.innerHTML = saved ? icons.bookmarkFilled : icons.bookmark;
        });
        toast(saved ? `「${w.surface}」 단어장에 저장했어요` : `「${w.surface}」 저장을 해제했어요`);
        return;
      }
      switch (btn.dataset.act) {
        case 'close':
          go(s.returnTo || 'home');
          break;
        case 'tip-close':
          hideTip();
          break;
        case 'retry':
          delete s.answers[q.id];
          delete s.tabs[q.id];
          saveSession();
          refresh(q);
          root.querySelector('[data-anchor="stem"]').scrollIntoView({ block: 'start', behavior: 'smooth' });
          break;
        case 'next':
          s.index += 1;
          saveSession();
          draw();
          break;
        case 'retry-wrong': {
          const ids = s.ids.filter((id) => s.results[id] === false);
          startSession({ title: '이번 세트 오답', ids, returnTo: s.returnTo });
          go('quiz');
          break;
        }
        case 'done':
          forgetScroll(`quiz:summary:${s.startedAt}`);
          go(s.returnTo || 'home');
          break;
        default:
      }
      return undefined;
    };

    const onKey = (e) => {
      const mark = e.target.closest?.('.wmark');
      if (mark && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        showTip(current(), mark);
      }
    };

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    draw();
    return () => release?.();
  },
};
