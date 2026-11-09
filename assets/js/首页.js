/* 展开/收起「更多关于我」 */
const toggle = document.getElementById('profile-toggle');
const details = document.getElementById('profile-details');
toggle.addEventListener('click', e => {
  e.preventDefault();
  const open = details.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.firstChild.textContent = open ? '收起 ' : '更多关于我 ';
});
details.classList.add('reveal');

/* 滚动出现动画 */
const revealItems = document.querySelectorAll('.project-card, .download-link, .info-card, .profile-row, .section-title');
if (typeof IntersectionObserver === 'function') {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .15 });
  revealItems.forEach(el => { el.classList.add('reveal'); io.observe(el); });
  io.observe(details);
} else {
  revealItems.forEach(el => el.classList.add('in'));
  details.classList.add('in');
}

/* Toast */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* 下载使用原生链接，不以配置请求阻断下载。 */
document.querySelectorAll('.download-link').forEach(a => {
  a.addEventListener('click', () => {
    showToast(location.protocol === 'file:'
      ? '本地打开时，浏览器可能直接预览 PDF，可从预览页保存。'
      : '已发起作品集下载，请查看浏览器下载列表。');
  });
});

/* 导航平滑滚动 */
document.querySelectorAll('.nav-links a, .site-footer a').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    if (id && id.startsWith('#')) {
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* 头像视差 */
const stage = document.querySelector('.portrait-stage');
if (stage && matchMedia('(pointer:fine)').matches) {
  const wrap = document.querySelector('.portrait-wrap');
  stage.style.transition = 'transform .3s ease-out';
  wrap.addEventListener('mousemove', e => {
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    stage.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  wrap.addEventListener('mouseleave', () => { stage.style.transform = ''; });
}

/* 独立页面保留真实链接，首页增强为内嵌体验。 */
const DEMO_PATHS = {
  commerce: 'demos/电商活动.html',
  trip: 'demos/旅行规划.html',
  identity: 'demos/第五人格.html'
};
const mask = document.getElementById('modal-mask');
const frameWrap = document.getElementById('modal-frame-wrap');
const frame = document.getElementById('modal-frame');
const frameLabel = document.getElementById('modal-frame-label');
const openLink = document.getElementById('modal-open-demo');
const closeButton = document.getElementById('modal-close');
const backgroundElements = [document.querySelector('.site-header'), document.querySelector('main'), document.querySelector('.site-footer')];
let activeKey = null;
let previousFocus = null;
let loadTimer = null;
let openRevision = 0;
let previousOverflow = '';
function setBackgroundInert(value) {
  backgroundElements.forEach(el => { if (el) el.inert = value; });
}
function handleModalKey(e) {
  if (!mask.classList.contains('show')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeDemo(); return; }
  if (e.key !== 'Tab' || e.currentTarget !== document) return;
  const controls = Array.from(mask.querySelectorAll('button, a[href], iframe, [tabindex="0"]'))
    .filter(el => el.getClientRects().length && !el.disabled);
  const first = controls[0], last = controls[controls.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
}
frame.addEventListener('load', () => {
  if (!activeKey || frame.getAttribute('src') === 'about:blank') return;
  clearTimeout(loadTimer);
  try {
    const child = frame.contentDocument;
    if (child && child.querySelector('body > *') && !child.querySelector('h1')?.textContent.includes('Error response')) {
      frameLabel.textContent = '交互 DEMO · 可直接操作';
      child.addEventListener('keydown', handleModalKey);
      frame.contentWindow.dispatchEvent(new Event('resize'));
    } else frameLabel.textContent = '如未显示原型，请点击独立打开 DEMO';
  } catch (_) {
    frameLabel.textContent = '交互 DEMO · 可直接操作（亦可独立打开）';
  }
});
function openDemo(key) {
  const d = DEMOS[key]; if (!d) return;
  previousFocus = document.activeElement;
  if (!mask.classList.contains('show')) previousOverflow = document.body.style.overflow;
  const revision = ++openRevision;
  activeKey = key;
  clearTimeout(loadTimer);
  document.getElementById('modal-tag').textContent = d.tag;
  document.getElementById('modal-title').textContent = d.title;
  document.getElementById('modal-sub').textContent = d.sub;
  document.getElementById('modal-bg').innerHTML = d.bg;
  document.getElementById('modal-flows').innerHTML = d.flows.map(f => `<li>${f}</li>`).join('');
  document.getElementById('modal-hl').innerHTML = d.hl.map(h => `<span>${h}</span>`).join('');
  frame.src = 'about:blank';
  frameWrap.hidden = !DEMO_PATHS[d.embed];
  mask.classList.add('show');
  mask.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setBackgroundInert(true);
  mask.querySelector('.demo-modal').scrollTop = 0;
  closeButton.focus({ preventScroll: true });
  if (DEMO_PATHS[d.embed]) {
    frameLabel.textContent = '正在载入交互 DEMO';
    frame.title = `${d.title} · 交互 DEMO`;
    openLink.href = DEMO_PATHS[d.embed];
    requestAnimationFrame(() => {
      if (revision !== openRevision) return;
      frame.src = DEMO_PATHS[d.embed];
      loadTimer = setTimeout(() => {
        if (revision === openRevision) frameLabel.textContent = '如未显示原型，请点击独立打开 DEMO';
      }, 8000);
    });
  } else openLink.removeAttribute('href');
}
function closeDemo() {
  if (!mask.classList.contains('show')) return;
  ++openRevision;
  activeKey = null;
  clearTimeout(loadTimer);
  mask.classList.remove('show');
  mask.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousOverflow;
  setBackgroundInert(false);
  frame.src = 'about:blank';
  previousFocus?.focus({ preventScroll: true });
}
document.querySelectorAll('.project-card').forEach(card => {
  const key = card.dataset.demo;
  card.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const trigger = card.querySelector('a') || card;
    trigger.focus({ preventScroll: true });
    openDemo(key);
  });
  if (card.getAttribute('role') === 'button') {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDemo(key); }
    });
  }
});
closeButton.addEventListener('click', closeDemo);
document.getElementById('modal-close-btn').addEventListener('click', closeDemo);
mask.addEventListener('click', e => { if (e.target === mask) closeDemo(); });
document.addEventListener('keydown', handleModalKey);
