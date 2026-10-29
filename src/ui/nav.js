import { icons } from './icons.js';

const TABS = [
  { name: 'home', label: '홈', icon: icons.home },
  { name: 'practice', label: '연습', icon: icons.pencil },
  { name: 'words', label: '단어장', icon: icons.book },
  { name: 'wrong', label: '오답노트', icon: icons.note },
];

let navEl;

export function renderNav(el) {
  navEl = el;
  el.innerHTML = `<div class="nav-inner">
    <span class="nav-brand">JLPT N1 연습</span>
    ${TABS.map((t) => `<a class="nav-item" href="#/${t.name}" data-tab="${t.name}">${t.icon}<span>${t.label}</span></a>`).join('')}
  </div>`;
}

export function updateNav(active) {
  navEl?.querySelectorAll('.nav-item').forEach((a) => {
    if (a.dataset.tab === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
