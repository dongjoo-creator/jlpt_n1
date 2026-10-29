// 접기/펼치기·회전으로 레이아웃이 바뀌어도 보던 위치를 유지한다.
// scrollTop 숫자 대신 "화면 맨 위에 걸친 [data-anchor] 요소와 그 오프셋"을 기억했다가 되돌린다.
const memo = {
  get(key) {
    try { return JSON.parse(sessionStorage.getItem(`scroll:${key}`)); } catch { return null; }
  },
  set(key, value) {
    try { sessionStorage.setItem(`scroll:${key}`, JSON.stringify(value)); } catch { /* 저장 못 해도 동작에는 지장 없음 */ }
  },
};

function scrolls(el) {
  const oy = getComputedStyle(el).overflowY;
  return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight;
}

function measure(scroller) {
  const top = scroller.getBoundingClientRect().top;
  for (const el of scroller.querySelectorAll('[data-anchor]')) {
    const r = el.getBoundingClientRect();
    if (r.height && r.bottom > top + 1) return { id: el.dataset.anchor, offset: Math.round(r.top - top) };
  }
  return null;
}

// scrollers는 안쪽 영역부터 바깥 영역 순서로 넘긴다.
export function keepScroll(root, scrollers, key) {
  let anchor = memo.get(key);
  let resizing = false;
  let timer;

  const restore = () => {
    if (!anchor) return;
    const el = root.querySelector(`[data-anchor="${CSS.escape(anchor.id)}"]`);
    if (!el || !el.getClientRects().length) return;
    const scroller = scrollers.find((s) => s.contains(el) && scrolls(s));
    if (!scroller) return;
    scroller.scrollTop += el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchor.offset;
  };

  const onScroll = (e) => {
    if (resizing) return;
    const next = measure(e.currentTarget);
    if (next) {
      anchor = next;
      memo.set(key, anchor);
    }
  };

  const onResize = () => {
    resizing = true;
    requestAnimationFrame(restore);
    clearTimeout(timer);
    timer = setTimeout(() => {
      restore();
      resizing = false;
    }, 160);
  };

  scrollers.forEach((s) => s.addEventListener('scroll', onScroll, { passive: true }));
  window.addEventListener('resize', onResize);
  requestAnimationFrame(restore);

  return () => {
    clearTimeout(timer);
    scrollers.forEach((s) => s.removeEventListener('scroll', onScroll));
    window.removeEventListener('resize', onResize);
  };
}

export function forgetScroll(key) {
  try { sessionStorage.removeItem(`scroll:${key}`); } catch { /* 무시 */ }
}
