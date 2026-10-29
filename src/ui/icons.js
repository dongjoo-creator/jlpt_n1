// SVG 선 아이콘. currentColor를 따르므로 글자색으로 색을 바꾼다.
const svg = (paths, fill = 'none') => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${fill}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const icons = {
  home: svg('<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>'),
  pencil: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  book: svg('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 7.5h6M9 11h4"/>'),
  note: svg('<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>'),
  sliders: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>'),
  bookmark: svg('<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>'),
  bookmarkFilled: svg('<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>', 'currentColor'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  refresh: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4v4.5H15"/>'),
  arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chevronRight: svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>'),
  chevronLeft: svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
  cards: svg('<rect x="3.5" y="7" width="13" height="13.5" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2V17"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  trash: svg('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
  minus: svg('<path d="M6 12h12"/>'),
  plus: svg('<path d="M12 6v12M6 12h12"/>'),
  alert: svg('<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17v.1"/>'),
};
