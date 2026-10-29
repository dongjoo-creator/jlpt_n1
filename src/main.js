import { loadStore, state } from './store.js';
import { loadQuestions } from './questions.js';
import { startRouter } from './router.js';
import { renderNav } from './ui/nav.js';
import { toast } from './ui/toast.js';

async function boot() {
  renderNav(document.getElementById('nav'));
  const view = document.getElementById('view');
  try {
    await Promise.all([loadStore(), loadQuestions()]);
  } catch (err) {
    console.error(err);
    view.innerHTML = '<p class="boot">문제를 불러오지 못했어요. 인터넷에 연결한 뒤 다시 열어 주세요.</p>';
    return;
  }
  startRouter(view);
  if (!state.persistent) toast('이 브라우저에서는 기록을 저장할 수 없어요');
  registerServiceWorker();
}

// 개발 중(localhost)에는 캐시 때문에 수정이 안 보이는 일을 막으려고 기본으로 끈다.
// localhost에서 오프라인을 시험하려면 주소 뒤에 ?sw=1 을 붙여 한 번 연다.
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (new URLSearchParams(location.search).has('sw')) localStorage.setItem('sw-dev', '1');
  if (local && !localStorage.getItem('sw-dev')) return;
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[sw] 등록 실패', err));
}

boot();
