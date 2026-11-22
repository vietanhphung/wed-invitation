(() => {
'use strict';
const W = window.WEDDING;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const make = (tag, props = {}) => Object.assign(document.createElement(tag), props);
const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = n => String(n).padStart(2, '0');

const [Y, M, D] = W.date.split('-').map(Number);
const due = new Date(`${W.date}T${W.time}:00${W.utcOffset || '+07:00'}`);
const lastWord = s => s.trim().split(/\s+/).pop();

/* Personal links: …/?name=cháu%20Thái%20Duyên&call=cháu%20và%20gia%20đình
   name → cover ("Thân mời cháu Thái Duyên") and the RSVP name;
   call → how sentences address them ("Sự hiện diện của cháu và gia đình…"), falls back to name.
   Only ever set via textContent. */
const param = k => (new URLSearchParams(location.search).get(k) || '').replace(/\s+/g, ' ').trim().slice(0, 60);
// Capitalise the form of address out of respect — each comma-separated guest:
// "cháu Thái Duyên" → "Cháu Thái Duyên", "chị Tâm, bạn Hà" → "Chị Tâm, Bạn Hà"
// Xưng Danh in sentence case: "Các Bạn" → "Các bạn", "Gia Đình Dì Xoa" → "Gia đình dì Xoa".
// Only common address words are lowercased (names stay as typed); the first letter, and the
// first letter after a comma, are capitalised out of respect ("Chị, Bạn").
const ADDRESS_WORDS = new Set(('và gia đình các những hai ba bạn anh chị em cô chú dì cậu mợ bác thím dượng ' +
  'ông bà cháu con cụ thầy quý khách vợ chồng cùng với người thân').split(' '));
const sentenceCase = s => s.split(/(\s*,\s*)/).map(part => /,/.test(part) ? part : part.split(' ').map((w, i) => {
  const lower = w.toLocaleLowerCase('vi');
  const word = ADDRESS_WORDS.has(lower) ? lower : w;
  return i === 0 ? word.charAt(0).toLocaleUpperCase('vi') + word.slice(1) : word;
}).join(' ')).join('');
const honor = s => s.replace(/(^|,\s*)(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase('vi'));
const guestName = honor(param('name'));
const guest = guestName || 'Bạn';
const guestInText = sentenceCase(param('call')) || guest;
/* How the couple refer to themselves (Xưng hô). "Chúng mình" with friends; when the guest is
   addressed as an elder (anh, chị, thầy, cô, chú…) anywhere in the list, the page switches to "chúng em".
   ?self=chúng%20em (or chúng tôi, chúng cháu…) overrides it for any link. */
const ELDERS = new Set('anh chị thầy cô chú bác dì cậu mợ thím dượng ông bà cụ sếp'.split(' '));
const selfRef = (() => {
  const own = param('self').toLocaleLowerCase('vi');
  if (own) return own;
  const words = (param('call') || param('name')).toLocaleLowerCase('vi').split(/[\s,]+/);
  return words.some(w => ELDERS.has(w)) ? 'chúng em' : 'chúng mình';   // any elder in the list
})();
function applySelfRef() {
  if (selfRef === 'chúng mình') return;
  const cap = selfRef.charAt(0).toLocaleUpperCase('vi') + selfRef.slice(1);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (/húng mình/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Chúng mình/g, cap).replace(/chúng mình/g, selfRef);
  }
}
// shown as written in config, e.g. "17:30"
const timeVN = W.time;

/* ---------- Text bindings ---------- */
const bindings = {
  groom: W.groom,
  bride: W.bride,
  couple: `${W.groom} & ${W.bride}`,
  monogram: `${lastWord(W.groom)[0] || ''} & ${lastWord(W.bride)[0] || ''}`,
  dateDots: `${pad(D)} · ${pad(M)} · ${Y}`,
  dateDotsShort: `${pad(D)}.${pad(M)}.${Y}`,
  weekday: WEEKDAYS[new Date(Y, M - 1, D).getDay()],
  day: `${pad(D)} · `,
  monthYear: `${pad(M)} · ${Y}`,
  calTitle: `Tháng ${M} · ${Y}`,
  time: timeVN,
  dateSlash: `${D}/${M}/${Y}`,
  dateDot: `${D} · ${M} · ${Y}`,
  lunar: W.lunar || '',
  invite: W.invite.replace(/\{guest\}/g, guestInText),
  guestInText,
  guest
};
function bindText() {
  $$('[data-bind]').forEach(el => { if (el.dataset.bind in bindings) el.textContent = bindings[el.dataset.bind]; });
  $('#intro-guest').hidden = !guestName;
  $('#intro-kicker').hidden = !!guestName;   // the invitation sentence already says "lễ thành hôn"
  document.title = (guestName ? `Thân mời ${guestName} | ` : `${W.pageTitle || 'Thiệp cưới'} | `) + `${W.groom} & ${W.bride}`;
}

/* ---------- Photos ---------- */
const photoSrc = p => typeof p === 'string' ? p : p && p.src;
function setPhoto(img, entry, pos) {
  const src = photoSrc(entry);
  if (!src) { img.closest('figure, .wide-photo, .closing-photo, .frame')?.remove(); return; }
  img.src = src;
  img.style.objectPosition = pos || (entry && entry.pos) || '50% 50%';
}
function bindPhotos() {
  $$('img[data-photo]').forEach(img => setPhoto(img, W.photos[img.dataset.photo]));
}

/* ---------- Story chapters ---------- */
function renderChapters() {
  const root = $('#story');
  const tpl = $('#chapter-tpl');
  const sets = [W.photos.city || [], W.photos.forest || []];
  W.chapters.forEach((c, i) => {
    const sec = tpl.content.firstElementChild.cloneNode(true);
    if (i % 2) sec.classList.add('flip');
    const [big, small] = $$('img', sec);
    setPhoto(big, sets[i] && sets[i][0]);
    setPhoto(small, sets[i] && sets[i][1]);
    big.alt = small.alt = `Ảnh cưới tại ${c.place}`;
    big.loading = small.loading = 'lazy';
    $('.fr', sec).textContent = pad(i + 2);
    $$('.place', sec).forEach(el => { el.textContent = c.place; });
    $('.num', sec).textContent = c.number;
    const t = $('.title', sec);
    t.append(c.title[0] + ' ', make('em', { textContent: c.title[1] }));
    $('.body', sec).textContent = c.text;
    root.appendChild(sec);
  });
  const [a, b, accent] = W.quote;
  $('#quote').append(a, make('br'), b + ' ', make('em', { textContent: accent }));
}

/* ---------- Countdown ---------- */
function tick() {
  const s = Math.max(0, Math.floor((due - Date.now()) / 1000));
  const vals = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
  ['#cd-d', '#cd-h', '#cd-m', '#cd-s'].forEach((sel, i) => { $(sel).textContent = pad(vals[i]); });
}

/* ---------- Calendar ---------- */
function renderCalendar() {
  const grid = $('#cal-grid');
  ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(s => grid.appendChild(make('div', { className: 'dayhead', textContent: s })));
  const lead = (new Date(Y, M - 1, 1).getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) grid.appendChild(make('div'));
  const days = new Date(Y, M, 0).getDate();
  for (let d = 1; d <= days; d++) grid.appendChild(make('div', { textContent: d, className: d === D ? 'target' : '' }));
  // Google Calendar link (W.eventHours long, default 2)
  const fmt = dt => dt.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = new Date(due.getTime() + (W.eventHours || 2) * 3600e3);
  const v = W.venues[0] || {};
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${W.calendarTitle || 'Lễ thành hôn'} ${W.groom} & ${W.bride}`,
    dates: `${fmt(due)}/${fmt(end)}`,
    location: [v.name, v.hall, v.address].filter(Boolean).join(', '),
    details: location.href.split('#')[0]
  });
  $('#gcal-link').href = 'https://calendar.google.com/calendar/render?' + params;
}

/* ---------- Gallery + lightbox ---------- */
const gallery = (W.photos.gallery || []).filter(photoSrc);
let lbIndex = -1, lbReturn = null;
function renderGallery() {
  if (!gallery.length) { $('#gallery').remove(); $$('a[href="#gallery"]').forEach(a => a.remove()); return; }
  const grid = $('#gallery-grid');
  gallery.forEach((p, i) => {
    const btn = make('button', { type: 'button', className: 'g-item' });
    btn.style.setProperty('--i', i);
    btn.setAttribute('aria-label', `Xem ảnh ${i + 1}`);
    const img = make('img', { alt: '', loading: 'lazy' });
    setPhoto(img, p);
    btn.appendChild(img);
    btn.addEventListener('click', () => openLightbox(i, btn));
    grid.appendChild(btn);
  });
}
function showLb(i) {
  lbIndex = (i + gallery.length) % gallery.length;
  $('#lb-img').src = photoSrc(gallery[lbIndex]);
}
function openLightbox(i, trigger) {
  lbReturn = trigger;
  showLb(i);
  $('#lightbox').classList.add('show');
  document.body.style.overflow = 'hidden';
  $('#lb-close').focus();
}
function closeLightbox() {
  if (lbIndex < 0) return;
  lbIndex = -1;
  $('#lightbox').classList.remove('show');
  document.body.style.overflow = '';
  if (lbReturn) lbReturn.focus();
}
function setupLightbox() {
  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
  $('#lb-next').addEventListener('click', () => showLb(lbIndex + 1));
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') closeLightbox(); });
  let x0 = null;
  $('#lightbox').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  $('#lightbox').addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) showLb(lbIndex + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

/* ---------- Venues ---------- */
function safeUrl(u) {
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; }
}
function renderVenues() {
  const root = $('#venues');
  W.venues.forEach(v => {
    const el = make('div', { className: 'venue' });
    el.append(
      make('p', { className: 'venue-label', textContent: v.label }),
      make('p', { className: 'venue-name', textContent: v.name })
    );
    if (v.hall) el.appendChild(make('p', { className: 'venue-hall', textContent: v.hall }));
    el.appendChild(make('p', { className: 'venue-address', textContent: v.address }));
    if (v.time) el.appendChild(make('p', { className: 'venue-time', textContent: v.time }));
    const url = safeUrl(v.mapsUrl);
    if (url) el.appendChild(make('a', { className: 'text-link', href: url, target: '_blank', rel: 'noopener noreferrer', innerHTML: 'Chỉ đường <svg class="link-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }));
    root.appendChild(el);
  });
}

/* ---------- Gift photos (bride & groom) ---------- */
function renderGifts() {
  const grid = $('#gift-grid');
  if (!grid) return;
  W.banks.forEach(bank => {
    const card = make('div', { className: 'gift-card' });
    const frame = make('span', { className: 'frame' });
    const img = make('img', { alt: '', loading: 'lazy' });
    frame.appendChild(img);
    card.appendChild(frame);
    setPhoto(img, bank.who === 'bride' ? W.photos.giftBride : W.photos.giftGroom);
    grid.appendChild(card);
  });
}

let toastTimer;
function toast(t) {
  const el = $('#toast');
  el.textContent = t;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ---------- RSVP → Google Form ----------
   Posts straight to the form's formResponse endpoint. Google doesn't let other sites read
   its reply (no-cors), so a sent request is treated as success; network failures still error. */
function setupRsvp() {
  const R = W.rsvp, section = $('#rsvp');
  if (!section) return;   // this page has no RSVP section
  const forms = (R && R.forms) || {};
  const has = k => Object.prototype.hasOwnProperty.call(forms, k) && !!forms[k];
  if (!Object.keys(forms).some(has)) {
    section.remove();
    $$('a[href="#rsvp"]').forEach(a => a.remove());
    return;
  }
  // ?side=groom | bride picks the side's form; without a valid value the guest must choose
  const asked = (new URLSearchParams(location.search).get('side') || '').trim().toLowerCase();
  const linkSide = has(asked) ? asked : null;
  const form = $('#rsvp-form'), done = $('#rsvp-done'), nameInput = $('#rsvp-name');
  const out = $('#rsvp-guests'), submit = $('#rsvp-submit'), sideField = $('#rsvp-side-field');
  const keyFor = side => 'rsvp-sent:' + forms[side];
  const chosenSide = () => linkSide || (form.side && form.side.value) || null;
  sideField.hidden = !!linkSide;
  const maxFor = side => (R.maxGuests && R.maxGuests[side]) || 50;
  const maxNow = () => chosenSide() ? maxFor(chosenSide()) : Math.max(...Object.keys(forms).filter(has).map(maxFor));

  $('[data-rsvp="yes"]').textContent = R.yes;
  $('[data-rsvp="no"]').textContent = R.no;
  if (guestName) nameInput.value = guestName;

  $$('[data-step]', form).forEach(b => b.addEventListener('click', () => {
    const n = (parseInt(out.value, 10) || 0) + Number(b.dataset.step);
    out.value = Math.min(maxNow(), Math.max(1, n));
  }));
  const attending = () => form.attend.value === 'yes';
  form.addEventListener('change', () => {
    $('#rsvp-guests-field').hidden = !attending();
    if (chosenSide()) sideField.classList.remove('invalid');
  });

  const showDone = yes => {
    $('#rsvp-done-sub').textContent = yes
      ? 'Hẹn gặp quý khách trong ngày vui của chúng tôi.'
      : 'Rất tiếc vì quý khách không thể đến. Cảm ơn quý khách đã báo cho chúng tôi.';
    form.hidden = true;
    done.hidden = false;
  };
  try {
    for (const side of linkSide ? [linkSide] : Object.keys(forms).filter(has)) {
      const prev = JSON.parse(localStorage.getItem(keyFor(side)) || 'null');
      if (prev) { showDone(prev.attending); break; }
    }
  } catch { /* storage unavailable: just show the form */ }

  $('#rsvp-again').addEventListener('click', () => { done.hidden = true; form.hidden = false; nameInput.focus(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = nameInput.value.replace(/\s+/g, ' ').trim();
    const side = chosenSide();
    if (!side) {
      sideField.classList.add('invalid');
      toast('Vui lòng chọn quý khách là khách của nhà trai hay nhà gái');
      sideField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.querySelector('input[name="side"]').focus({ preventScroll: true });
      return;
    }
    if (!name) { toast('Vui lòng nhập tên của quý khách'); nameInput.focus(); return; }
    const yes = attending();
    // attending: a whole number from 1 to the side's limit; declining always sends 0
    const raw = out.value.trim(), max = maxFor(side), guests = Number(raw);
    if (yes && !(/^\d+$/.test(raw) && guests >= 1 && guests <= max)) {
      toast(`Vui lòng nhập số người tham dự từ 1 đến ${max}`);
      out.focus();
      return;
    }
    const body = new URLSearchParams({
      [R.fields.name]: name,
      [R.fields.attend]: yes ? R.yes : R.no,
      // attending = at least 1 person; declining = 0 (the form's scale runs 0–10)
      [R.fields.guests]: yes ? String(guests) : '0'
    });
    submit.disabled = true;
    submit.textContent = 'Đang gửi…';
    try {
      await fetch(forms[side], { method: 'POST', mode: 'no-cors', body });
    } catch {
      toast('Không gửi được. Vui lòng kiểm tra kết nối mạng và thử lại.');
      return;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Gửi xác nhận';
    }
    try { localStorage.setItem(keyFor(side), JSON.stringify({ attending: yes, at: Date.now() })); } catch { /* ignore */ }
    showDone(yes);
    toast('Cảm ơn quý khách đã xác nhận!');
  });
}

/* ---------- Lịch trình, Thực đơn, tiện ích villa ---------- */
function renderSchedule() {
  const list = $('#schedule-list');
  if (!list || !W.schedule) return;
  W.schedule.forEach(item => {
    const li = make('li', { className: 'sched-item' + (item.day ? ' next-day' : '') });
    const when = make('div', { className: 'sched-time' });
    when.append(make('b', { textContent: item.time }));
    if (item.day) when.append(make('small', { textContent: item.day }));
    const what = make('div', { className: 'sched-what' });
    what.append(make('p', { className: 'sched-title', textContent: item.title }));
    if (item.note) what.append(make('p', { className: 'sched-note', textContent: item.note }));
    const dot = make('i', { className: 'sched-dot' });
    dot.setAttribute('aria-hidden', 'true');
    li.append(when, dot, what);
    list.appendChild(li);
  });
}
function renderMenu() {
  const root = $('#menu-list');
  if (!root || !W.menu) return;
  W.menu.forEach(group => {
    const sec = make('div', { className: 'menu-group' });
    sec.append(make('h3', { className: 'menu-course', textContent: group.course }));
    const ul = make('ul', { className: 'menu-dishes' });
    group.dishes.forEach(([vi, fr]) => {
      const li = make('li');
      li.append(make('span', { className: 'dish-vi', textContent: vi }));
      if (fr) li.append(make('span', { className: 'dish-fr', textContent: fr }));
      ul.appendChild(li);
    });
    sec.append(ul);
    root.appendChild(sec);
  });
}
function renderAmenities() {
  const grid = $('#amenities');
  if (!grid || !W.amenities) return;
  W.amenities.forEach(a => {
    const fig = make('figure', { className: 'amenity' });
    const frame = make('div', { className: 'frame' });
    const img = make('img', { alt: a.label, loading: 'lazy' });
    setPhoto(img, a.photo);
    frame.append(img);
    fig.append(frame, make('figcaption', { textContent: a.label }));
    grid.appendChild(fig);
  });
}

/* ---------- Music ---------- */
const audio = $('#bg-music');
const musicBtn = $('#music-btn');
function setMusicUI(on) {
  musicBtn.classList.toggle('playing', on);
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  $('#music-state').textContent = on ? 'Đang phát · chạm để tắt' : 'Chạm để bật nhạc';
}
function playMusic() {
  if (!W.music) return;
  if (!audio.src) {
    audio.src = W.music;
    if (W.musicStart) audio.addEventListener('loadedmetadata', () => { audio.currentTime = W.musicStart; }, { once: true });
  }
  audio.volume = 0;
  const fade = setInterval(() => { audio.volume = Math.min(.6, audio.volume + .04); if (audio.volume >= .6) clearInterval(fade); }, 80);
  audio.play().then(() => setMusicUI(true)).catch(() => { clearInterval(fade); setMusicUI(false); });
}
function setupMusic() {
  if (!W.music) return;
  musicBtn.hidden = false;
  $('#music-title').textContent = W.musicTitle || 'Nhạc nền';
  musicBtn.addEventListener('click', () => { if (audio.paused) playMusic(); else { audio.pause(); setMusicUI(false); } });
  audio.addEventListener('error', () => { musicBtn.hidden = true; });
}

/* ---------- Atmosphere ---------- */
const LEAF = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5l1.6 3.6 2.2-1.1-.6 4.4 3.3-2.6.8 2.1 3.2-.6-1.4 3.4 1.4.9-4.6 3.3.7 1.8-4.3-.6-.1 4.4h-.8l-.1-4.4-4.3.6.7-1.8-4.6-3.3 1.4-.9L1.5 9.3l3.2.6.8-2.1 3.3 2.6-.6-4.4 2.2 1.1z"/><path d="M11.6 18.5h.8V23h-.8z"/></svg>';
function setupLeaves() {
  if (!W.leaves || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = $('#leaves');
  const colors = ['#a4502f', '#b9774f', '#c9a27e', '#8a5a3c', '#d4b896', '#a4502f'];
  colors.forEach((c, i) => {
    const el = make('span', { className: 'leaf', innerHTML: LEAF });
    el.style.cssText = `--x:${(i * 41 + 9) % 95}%;--s:${12 + (i * 5) % 9}px;--c:${c};--dur:${26 + (i * 9) % 14}s;--delay:${-((i * 13) % 30)}s;--drift:${i % 2 ? -90 : 110}px`;
    root.appendChild(el);
  });
}
function setupReveal() {
  const targets = $$('.section');
  if (!('IntersectionObserver' in window)) { targets.forEach(s => s.classList.add('reveal-in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  targets.forEach(s => io.observe(s));
}

/* ---------- Chrome: cover screen, header, menu ---------- */
const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
const blockScroll = e => e.preventDefault();
const blockScrollKeys = e => { if (SCROLL_KEYS.has(e.key) && e.target.tagName !== 'BUTTON') e.preventDefault(); };
function lockCover() {
  // overflow:hidden alone doesn't stop iOS Safari, wheel momentum or keyboard scrolling
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  document.documentElement.classList.add('locked');
  addEventListener('wheel', blockScroll, { passive: false });
  addEventListener('touchmove', blockScroll, { passive: false });
  addEventListener('keydown', blockScrollKeys);
}
function unlockCover() {
  removeEventListener('wheel', blockScroll);
  removeEventListener('touchmove', blockScroll);
  removeEventListener('keydown', blockScrollKeys);
  document.documentElement.classList.remove('locked');
  scrollTo(0, 0);
}

function setupChrome() {
  lockCover();
  $('#open-btn').addEventListener('click', () => {
    $('#intro').classList.add('hidden');
    unlockCover();
    setupReveal();
    playMusic();
  });
  const menu = $('#mobile-nav'), menuBtn = $('#menu-btn'), header = $('#header');
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('show');
    menuBtn.setAttribute('aria-expanded', String(open));
    header.classList.toggle('scrolled', open || scrollY > 30);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => { menu.classList.remove('show'); menuBtn.setAttribute('aria-expanded', 'false'); }));
  const onScroll = () => {
    $('#progress').style.width = (100 * scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) + '%';
    $('#backtop').classList.toggle('show', scrollY > 700);
    header.classList.toggle('scrolled', scrollY > 30 || menu.classList.contains('show'));
    musicBtn.classList.toggle('compact', scrollY > 500);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('#backtop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLightbox(); }
    if (lbIndex > -1 && e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (lbIndex > -1 && e.key === 'ArrowLeft') showLb(lbIndex - 1);
  });
}

bindText();
bindPhotos();
renderChapters();
renderCalendar();
renderGallery();
renderVenues();
renderGifts();
renderSchedule();
renderMenu();
renderAmenities();
applySelfRef();   // after everything that renders text
setupRsvp();
setupLightbox();
setupMusic();
setupLeaves();
setupChrome();
tick();
setInterval(tick, 1000);
})();
