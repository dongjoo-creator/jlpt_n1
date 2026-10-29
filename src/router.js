// 해시 라우터. #/이름/파라미터 형식이고, 화면을 바꿔도 페이지는 새로고침하지 않는다.
import home from './views/home.js';
import practice from './views/practice.js';
import quiz from './views/quiz.js';
import wrong from './views/wrong.js';
import wordbook from './views/wordbook.js';
import cards from './views/cards.js';
import guide from './views/guide.js';
import settings from './views/settings.js';
import { updateNav } from './ui/nav.js';
import { keepScroll } from './ui/scroll.js';

const views = { home, practice, quiz, wrong, words: wordbook, cards, guide, settings };

let viewEl;
let cleanup = null;

function parse() {
  const [name = 'home', ...params] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: views[name] ? name : 'home', params };
}

function render() {
  const { name, params } = parse();
  const view = views[name];
  cleanup?.();
  viewEl.innerHTML = '';
  viewEl.scrollTop = 0;
  document.body.dataset.route = name;
  document.body.dataset.chrome = view.chrome ?? 'full';
  updateNav(view.nav ?? name);
  const viewCleanup = view.render(viewEl, params);
  // 풀이·카드 화면은 자체 스크롤 영역을 쓰고, 나머지는 #view가 스크롤된다.
  const releaseScroll = view.chrome === 'none' ? null : keepScroll(viewEl, [viewEl], `view:${name}`);
  cleanup = () => {
    viewCleanup?.();
    releaseScroll?.();
  };
}

export function go(path, { replace = false } = {}) {
  const hash = `#/${path}`;
  if (replace) {
    history.replaceState(null, '', hash);
    render();
  } else if (location.hash === hash) {
    render();
  } else {
    location.hash = hash;
  }
}

// 화면을 다시 그리지 않고 주소만 바꾼다 (탭 전환 등).
export function setHash(path) {
  history.replaceState(null, '', `#/${path}`);
}

export function startRouter(el) {
  viewEl = el;
  window.addEventListener('hashchange', render);
  render();
}
