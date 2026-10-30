// 오프라인 지원.
// - 앱 코드(SHELL): 캐시 우선. 코드를 고쳐 배포할 때는 VERSION을 올린다.
// - 문제(questions/): 네트워크 우선, 실패하면 캐시. 문제만 추가할 때는 VERSION을 안 올려도 된다.
// - 글꼴(Google Fonts): 한 번 받은 파일을 캐시에 두고 쓴다.
const VERSION = 'v4';
const SHELL = `shell-${VERSION}`;
const DATA = 'questions';
const FONTS = 'fonts';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './config/exam.js',
  './src/main.js',
  './src/db.js',
  './src/store.js',
  './src/questions.js',
  './src/study.js',
  './src/router.js',
  './src/ui/icons.js',
  './src/ui/nav.js',
  './src/ui/scroll.js',
  './src/ui/text.js',
  './src/ui/toast.js',
  './src/views/home.js',
  './src/views/practice.js',
  './src/views/quiz.js',
  './src/views/wrong.js',
  './src/views/wordbook.js',
  './src/views/cards.js',
  './src/views/guide.js',
  './src/views/settings.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

async function cacheQuestions() {
  const cache = await caches.open(DATA);
  const res = await fetch('./questions/index.json', { cache: 'no-cache' });
  await cache.put('./questions/index.json', res.clone());
  const { files } = await res.json();
  await cache.addAll(files.map((f) => `./questions/${f}`));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(SHELL_FILES);
    await cacheQuestions().catch(() => { /* 다음 접속 때 다시 받는다 */ });
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL, DATA, FONTS];
    for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(DATA);
  try {
    const res = await fetch(request, { cache: 'no-cache' });
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    throw new Error('offline');
  }
}

async function fontCache(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

async function shellFirst(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  try {
    return await fetch(request);
  } catch (err) {
    if (request.mode === 'navigate') return caches.match('./index.html');
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(fontCache(request));
  } else if (url.origin === location.origin) {
    event.respondWith(url.pathname.includes('/questions/') ? networkFirst(request) : shellFirst(request));
  }
});
