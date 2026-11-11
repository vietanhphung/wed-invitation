(() => {
'use strict';
const W = window.WEDDING;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const make = (tag, props = {}) => Object.assign(document.createElement(tag), props);
const pad = n => String(n).padStart(2, '0');
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const [Y, M, D] = W.date.split('-').map(Number);
const due = new Date(`${W.date}T${W.time}:00${W.utcOffset || '+07:00'}`);
const initial = s => (s.trim().split(/\s+/).pop()[0] || '');

/* Personal links: …/intimate/?name=anh%20Tuấn → "Thân mời anh Tuấn". Only ever set via textContent. */
const guestName = (new URLSearchParams(location.search).get('name') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
const guest = guestName || W.defaultGuest;

/* ---------- text ---------- */
const bindings = {
  guest,
  guestLower: guestName || 'quý vị',
  groomShort: W.groomShort, brideShort: W.brideShort,
  seal: initial(W.groom) + initial(W.bride),
  initialG: initial(W.groom), initialB: initial(W.bride),
  dateDots: `${pad(D)}.${pad(M)}.${Y}`,
  monthTitle: `Tháng ${pad(M)} · ${Y}`,
  weekday: WEEKDAYS[new Date(Y, M - 1, D).getDay()],
  day: pad(D),
  monthYear: `${pad(M)}.${Y}`,
  time: W.time,
  lunarCaps: W.lunar ? `(${W.lunar})` : '',
  eventTitle: W.event.title,
  venue: W.event.venue, hall: W.event.hall || '', address: W.event.address
};
function bindText() {
  $$('[data-bind]').forEach(el => { if (el.dataset.bind in bindings) el.textContent = bindings[el.dataset.bind]; });
  $$('[data-bind="hall"], [data-bind="lunarCaps"]').forEach(el => { if (!el.textContent) el.remove(); });
  document.title = (guestName ? `Thân mời ${guestName} | ` : 'Thiệp mời | ') + `${W.groomShort} & ${W.brideShort}`;
  $('#parents-groom').append(...W.parents.groom.flatMap((n, i) => i ? [make('br'), n] : [n]));
  $('#parents-bride').append(...W.parents.bride.flatMap((n, i) => i ? [make('br'), n] : [n]));
}
function bindPhotos() {
  $$('img[data-photo]').forEach(img => {
    const src = W.photos[img.dataset.photo];
    if (src) img.src = src; else (img.closest('figure, .polaroid, .thanks') || img).remove();
  });
}

/* ---------- countdown ---------- */
function tick() {
  const s = Math.max(0, Math.floor((due - Date.now()) / 1000));
  const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
  $$('[data-cd]').forEach(el => { el.textContent = el.dataset.cd === 'd' ? v.d : pad(v[el.dataset.cd]); });
}

/* ---------- calendar ---------- */
function renderCalendar() {
  const grid = $('#cal-grid');
  ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(t => grid.appendChild(make('div', { className: 'dh', textContent: t })));
  const lead = (new Date(Y, M - 1, 1).getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) grid.appendChild(make('div'));
  for (let d = 1; d <= new Date(Y, M, 0).getDate(); d++) grid.appendChild(make('div', { textContent: d, className: d === D ? 'target' : '' }));
}

/* ---------- event links ---------- */
const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
function renderEvent() {
  const maps = safeUrl(W.event.mapsUrl);
  if (maps) $('#maps-link').href = maps; else $('#maps-link').remove();
  const fmt = dt => dt.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = new Date(due.getTime() + 3 * 3600e3);
  $('#gcal-link').href = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE',
    text: `${W.event.title} · ${W.groomShort} & ${W.brideShort}`,
    dates: `${fmt(due)}/${fmt(end)}`,
    location: [W.event.venue, W.event.hall, W.event.address].filter(Boolean).join(', '),
    details: location.href.split('#')[0]
  });
}

/* ---------- schedule + dress code ---------- */
function renderSchedule() {
  const ol = $('#timeline');
  W.schedule.forEach(([t, what]) => {
    const li = make('li');
    li.append(make('time', { textContent: t }), make('i'), make('span', { textContent: what }));
    ol.appendChild(li);
  });
  const dress = $('#dress');
  if (!W.dressCode || !W.dressCode.length) { dress.remove(); return; }
  W.dressCode.forEach(c => { const i = make('i'); i.style.background = c; dress.appendChild(i); });
}

/* ---------- album + viewer ---------- */
const album = W.photos.album || [];
let vIndex = -1, vReturn = null;
function renderAlbum() {
  const grid = $('#album');
  album.forEach((src, i) => {
    const b = make('button', { type: 'button', className: 'reveal' });
    b.setAttribute('aria-label', `Xem ảnh ${i + 1}`);
    b.appendChild(make('img', { src, alt: '', loading: 'lazy' }));
    b.addEventListener('click', () => { vReturn = b; showPhoto(i); openModal('#viewer'); });
    grid.appendChild(b);
  });
}
function showPhoto(i) { vIndex = (i + album.length) % album.length; $('#viewer-img').src = album[vIndex]; }

/* ---------- modals ---------- */
let modalReturn = null;
function openModal(sel) {
  modalReturn = document.activeElement;
  $(sel).classList.add('show');
  document.documentElement.classList.add('locked');
  setTimeout(() => $(`${sel} [data-close]`).focus(), 50);
}
function closeModals() {
  const open = $$('.modal.show');
  if (!open.length) return;
  open.forEach(m => m.classList.remove('show'));
  vIndex = -1;
  document.documentElement.classList.remove('locked');
  (vReturn || modalReturn)?.focus?.();
  vReturn = null;
}

/* ---------- gifts ---------- */
const giftLabel = b => b.who === 'bride' ? 'Nhà gái' : 'Nhà trai';
function showBank(i) {
  const bank = W.banks[i];
  $$('#gift-tabs button').forEach((t, j) => t.setAttribute('aria-selected', String(i === j)));
  const body = $('#gift-body');
  body.innerHTML = '';
  if (bank.qr) {
    const img = make('img', { className: 'qr', src: bank.qr, alt: 'Mã QR chuyển khoản' });
    img.onerror = () => img.remove();
    body.appendChild(img);
  }
  body.append(
    make('p', { className: 'bank-name', textContent: bank.name || '—' }),
    make('p', { className: 'bank-number', textContent: bank.number || '—' }),
    make('p', { className: 'bank-owner', textContent: bank.owner || '' })
  );
  if (bank.number) {
    const c = make('button', { type: 'button', className: 'pill outline', textContent: 'Sao chép số tài khoản' });
    c.addEventListener('click', () => copy(bank.number, 'Đã sao chép số tài khoản'));
    body.appendChild(c);
  }
}
function setupGifts() {
  const tabs = $('#gift-tabs');
  W.banks.forEach((b, i) => {
    const t = make('button', { type: 'button', textContent: giftLabel(b) });
    t.setAttribute('role', 'tab');
    t.addEventListener('click', () => showBank(i));
    tabs.appendChild(t);
  });
  $('#gift-btn').addEventListener('click', () => { showBank(0); openModal('#gift-modal'); });
}

/* ---------- RSVP ---------- */
function setupRsvp() {
  const form = $('#rsvp-form'), count = $('#guests'), out = $('#guests-out');
  if (guestName) $('#rsvp-name').value = guestName;
  $$('[data-step]', form).forEach(b => b.addEventListener('click', () => {
    const n = Math.min(10, Math.max(1, Number(count.value) + Number(b.dataset.step)));
    count.value = n; out.textContent = n;
  }));
  form.addEventListener('change', () => { $('#guests-field').hidden = form.attend.value !== 'Có'; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get('attend') !== 'Có') data.set('guests', '0');
    data.set('submitted', new Date().toISOString());
    const done = $('#rsvp-done');
    const thanks = data.get('attend') === 'Có'
      ? 'Cảm ơn bạn! Hẹn gặp bạn trong ngày vui của chúng mình.'
      : 'Cảm ơn bạn đã báo cho chúng mình biết. Mong sớm gặp lại bạn!';
    if (W.rsvp.endpoint) {
      // Google Apps Script / Formspree: fire-and-forget form post
      try { await fetch(W.rsvp.endpoint, { method: 'POST', body: new URLSearchParams(data), mode: 'no-cors' }); }
      catch { toast('Không gửi được, vui lòng thử lại.'); return; }
      form.querySelector('[type=submit]').disabled = true;
      done.textContent = thanks; done.hidden = false;
      return;
    }
    // no endpoint: hand the reply over by Zalo
    const msg = `Xác nhận tham dự — ${data.get('name')} (khách ${data.get('side')}): ${data.get('attend') === 'Có' ? `có, ${data.get('guests')} người` : 'không tham dự được'}.${data.get('message') ? ' Lời chúc: ' + data.get('message') : ''}`;
    await copy(msg, W.rsvp.zalo ? 'Đã sao chép lời nhắn — dán vào Zalo để gửi cho chúng mình nhé' : 'Đã sao chép lời nhắn xác nhận');
    if (W.rsvp.zalo) window.open('https://zalo.me/' + encodeURIComponent(W.rsvp.zalo.replace(/\D/g, '')), '_blank', 'noopener');
    done.textContent = thanks; done.hidden = false;
  });
}

/* ---------- small helpers ---------- */
async function copy(text, note) {
  try { await navigator.clipboard.writeText(text); }
  catch { const a = make('textarea', { value: text }); document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast(note);
}
let toastTimer;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ---------- music ---------- */
const audio = $('#bg-music'), musicBtn = $('#music-btn');
function setMusic(on) {
  musicBtn.classList.toggle('playing', on);
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
}
function playMusic() {
  if (!W.music) return;
  if (!audio.src) audio.src = W.music;
  audio.volume = 0;
  const fade = setInterval(() => { audio.volume = Math.min(.6, audio.volume + .04); if (audio.volume >= .6) clearInterval(fade); }, 80);
  audio.play().then(() => setMusic(true)).catch(() => { clearInterval(fade); setMusic(false); });
}
function setupMusic() {
  if (!W.music) return;
  musicBtn.hidden = false;
  musicBtn.addEventListener('click', () => { if (audio.paused) playMusic(); else { audio.pause(); setMusic(false); } });
  audio.addEventListener('error', () => { musicBtn.hidden = true; });
}

/* ---------- reveal on scroll ---------- */
function setupReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  els.forEach(e => io.observe(e));
}

/* ---------- envelope cover (scroll is locked until it opens) ---------- */
const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
const block = e => e.preventDefault();
const blockKeys = e => { if (SCROLL_KEYS.has(e.key) && e.target.tagName !== 'BUTTON') e.preventDefault(); };
function setupCover() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  document.documentElement.classList.add('locked');
  addEventListener('wheel', block, { passive: false });
  addEventListener('touchmove', block, { passive: false });
  addEventListener('keydown', blockKeys);
  const cover = $('#cover');
  $('#open-btn').addEventListener('click', () => {
    if (cover.classList.contains('opening')) return;
    cover.classList.add('opening');
    playMusic();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      cover.classList.add('hidden');
      removeEventListener('wheel', block);
      removeEventListener('touchmove', block);
      removeEventListener('keydown', blockKeys);
      document.documentElement.classList.remove('locked');
      scrollTo(0, 0);
      setupReveal();
    }, reduce ? 0 : 1500);
  }, { once: false });
}

function setupKeys() {
  $$('[data-close]').forEach(b => b.addEventListener('click', closeModals));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));
  $$('#viewer [data-step]').forEach(b => b.addEventListener('click', () => showPhoto(vIndex + Number(b.dataset.step))));
  let x0 = null;
  $('#viewer').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  $('#viewer').addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) showPhoto(vIndex + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModals();
    if (vIndex > -1 && e.key === 'ArrowRight') showPhoto(vIndex + 1);
    if (vIndex > -1 && e.key === 'ArrowLeft') showPhoto(vIndex - 1);
  });
}

bindText();
bindPhotos();
renderCalendar();
renderEvent();
renderSchedule();
renderAlbum();
setupGifts();
setupRsvp();
setupMusic();
setupKeys();
setupCover();
tick();
setInterval(tick, 1000);
})();
