// Ролик «Свой отель с нуля». Всё рисуется на canvas как функция времени t (сек).
const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c'), g = cv.getContext('2d');

// ---------- палитра ----------
const C = { or: '#ff9f1c', gr: '#3ddc84', rd: '#ff4d5e', ye: '#ffd76a', cream: '#f4ecd8',
  ink: '#0b1024', card: '#151b3a', mute: '#8f98c7', win: '#1a2040' };

// ---------- математика ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const p = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const fmt = n => { const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return s; };
const sgn = n => (Math.round(n) < 0 ? '−' : '+') + fmt(n);
function mix(a, b, x) {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(x))).toString(16).padStart(2, '0')).join('');
}

// ---------- примитивы ----------
function T(s, x, y, size, color = '#fff', o = {}) {
  g.save();
  g.font = `${o.italic ? 'italic ' : ''}${o.w || 800} ${size}px Inter`;
  g.textAlign = o.al || 'center'; g.textBaseline = o.bl || 'middle';
  g.globalAlpha *= (o.a ?? 1);
  if (o.stroke) { g.lineWidth = o.sw || size * 0.18; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(s, x, y); }
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.gb || 30; }
  g.fillStyle = color; g.fillText(s, x, y);
  g.restore();
}
function R(x, y, w, h, r, fill, o = {}) {
  g.save(); g.globalAlpha *= (o.a ?? 1);
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.gb || 30; }
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (o.stroke) { g.shadowBlur = 0; g.lineWidth = o.sw || 4; g.strokeStyle = o.stroke; g.stroke(); }
  g.restore();
}
function pill(txt, cx, cy, size, bg, fg, o = {}) {
  g.font = `800 ${size}px Inter`;
  const w = g.measureText(txt).width + size * 1.3, h = size * 1.9;
  R(cx - w / 2, cy - h / 2, w, h, h / 2, bg, o);
  T(txt, cx, cy + 2, size, fg, { a: o.a });
  return w;
}
function tf(cx, cy, s, rot, fn) { g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.scale(s, s); g.translate(-cx, -cy); fn(); g.restore(); }
function poly(pts, fill, a = 1) { g.save(); g.globalAlpha *= a; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fillStyle = fill; g.fill(); g.restore(); }
function circ(x, y, r, fill, a = 1) { g.save(); g.globalAlpha *= a; g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); g.restore(); }
function line(x1, y1, x2, y2, col, w, a = 1) { g.save(); g.globalAlpha *= a; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); g.restore(); }
function bg(c1, c2) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, W, H); }

// ---------- окружение ----------
function stars(a = 1) { for (let i = 0; i < 70; i++) circ(rnd(i) * W, 220 + rnd(i + 99) * 700, 1.5 + rnd(i + 7) * 2.5, '#fff', a * (.3 + rnd(i + 3) * .6)); }
function snow(t, a = 1) { for (let i = 0; i < 90; i++) { const x = (rnd(i) * W + Math.sin(t * 1.2 + i) * 24 + W) % W, y = (rnd(i + 50) * 1500 + t * (90 + rnd(i + 9) * 130)) % 1500 + 150; circ(x, y, 3 + rnd(i + 4) * 4, '#fff', a * .8); } }
function rain(t, a = 1) { for (let i = 0; i < 130; i++) { const x = (rnd(i) * (W + 200) - t * 160 + 5000) % (W + 200) - 100, y = (rnd(i + 31) * 1700 + t * (900 + rnd(i + 2) * 500)) % 1700 + 100; line(x, y, x - 10, y + 46, '#9fb4ff', 3, a * .45); } }
function mountains(by, c1, c2, snowA, ground) {
  const pk = [[-60, by], [150, by - 430], [330, by - 250], [560, by - 540], [800, by - 290], [985, by - 440], [1140, by]];
  poly(pk, c1);
  if (snowA > 0) [[150, by - 430], [560, by - 540], [985, by - 440]].forEach(([x, y]) => poly([[x, y], [x - 62, y + 96], [x - 22, y + 78], [x + 6, y + 108], [x + 30, y + 80], [x + 64, y + 98]], '#eef3ff', snowA));
  g.beginPath(); g.moveTo(-10, by - 60);
  g.bezierCurveTo(200, by - 230, 380, by - 40, 560, by - 130);
  g.bezierCurveTo(760, by - 230, 900, by - 60, 1090, by - 150);
  g.lineTo(1090, by + 10); g.lineTo(-10, by + 10); g.closePath(); g.fillStyle = c2; g.fill();
  g.fillStyle = ground; g.fillRect(0, by - 6, W, H - by + 6);
}
const RANK = [2, 7, 0, 9, 4, 5, 1, 8, 3, 6];
function hotel(cx, by, s, lit, o = {}) {
  g.save(); g.translate(cx, by); g.scale(s, s);
  const wall = o.wall || '#2e376b';
  poly([[-360, -520], [-255, -650], [255, -650], [360, -520]], o.roof || '#b0483a');
  if (o.snow) poly([[-360, -520], [-255, -650], [255, -650], [360, -520], [330, -545], [240, -628], [-240, -628], [-330, -545]], '#f3f6ff', o.snow);
  R(-320, -520, 640, 520, 10, wall);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-320, -175, 640, 10);
  for (let i = 0; i < 10; i++) {
    const b = clamp(lit - RANK[i]), x = -262 + (i % 5) * 124, y = i < 5 ? -480 : -325;
    R(x, y, 84, 108, 8, mix(C.win, C.ye, b), b > .4 && !o.day ? { glow: C.ye, gb: 34 * b } : {});
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 40, y, 4, 108); g.fillRect(x, y + 50, 84, 4);
  }
  R(-52, -128, 104, 128, 8, '#141936');
  circ(30, -62, 6, C.ye);
  const sg = o.sign ?? 1;
  R(-120, -168, 240, 44, 10, mix('#3a2a20', C.or, sg), sg > .5 ? { glow: C.or, gb: 22 } : {});
  T('ОТЕЛЬ', 0, -145, 30, mix('#6b5a4a', '#1b1200', sg), { w: 900 });
  g.restore();
}
function person(cx, by, s, col, o = {}) {
  g.save(); g.translate(cx, by); g.scale(s, s);
  R(-62, -210, 124, 210, 46, col);
  circ(0, -272, 58, o.skin || '#f1c9a5');
  g.beginPath(); g.arc(0, -284, 60, Math.PI, 0); g.fillStyle = o.hair || '#3a2a22'; g.fill();
  if (o.face) {
    circ(-20, -270, 6.5, '#1a1a1a'); circ(20, -270, 6.5, '#1a1a1a');
    g.beginPath(); g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = '#7a3b2e';
    if (o.face === 'happy') g.arc(0, -252, 20, .15 * Math.PI, .85 * Math.PI);
    else if (o.face === 'sad') g.arc(0, -222, 20, 1.2 * Math.PI, 1.8 * Math.PI);
    else { g.moveTo(-14, -240); g.lineTo(14, -240); }
    g.stroke();
  }
  g.restore();
}
function crown(cx, cy, s, rot, a = 1) { tf(cx, cy, s, rot, () => { poly([[cx - 60, cy + 30], [cx - 66, cy - 34], [cx - 30, cy - 4], [cx, cy - 50], [cx + 30, cy - 4], [cx + 66, cy - 34], [cx + 60, cy + 30]], '#ffcc33', a); circ(cx, cy - 50, 8, '#ff6b6b', a); }); }
function badge(val, cx, cy, col, a = 1, s = 1) { tf(cx, cy, s, 0, () => { R(cx - 250, cy - 78, 500, 156, 34, 'rgba(8,11,30,.82)', { stroke: col, sw: 5, a }); T('ЗАГРУЗКА', cx - 218, cy + 2, 34, C.mute, { al: 'left', a, w: 700 }); T(Math.round(val) + '%', cx + 222, cy + 4, 92, col, { al: 'right', a, w: 900 }); }); }
function ledger(title, rows, lt, t0, step, total, totalCol, totalAt) {
  const a0 = eo(p(lt, 0, .35));
  R(80, 300, 920, 900, 40, C.card, { a: a0, stroke: '#2a3266', sw: 3 });
  T(title, 130, 372, 40, C.or, { al: 'left', a: a0, w: 900 });
  rows.forEach((r, i) => {
    const a = eo(p(lt, t0 + i * step, t0 + i * step + .3)), y = 480 + i * 112;
    T(r[0], 130 + (1 - a) * 40, y, 44, '#dfe4ff', { al: 'left', a, w: 600 });
    T(r[1], 950, y, 50, r[2], { al: 'right', a, w: 800 });
    line(130, y + 54, 950, y + 54, '#2a3266', 2, a);
  });
  const at = p(lt, totalAt, totalAt + .4);
  if (at > 0) tf(540, 1100, lerp(.6, 1, back(at)), 0, () => { T('ЧИСТЫМИ', 130, 1062, 34, C.mute, { al: 'left', a: at, w: 700 }); T(total, 950, 1108, 104, totalCol, { al: 'right', a: at, w: 900, glow: totalCol, gb: 26 }); });
}
function napkin(lt, tear) {
  const dx = eo(tear) * 330, rot = eo(tear) * .22;
  const draw = (clipL, off, r) => { g.save(); g.translate(540 + off, 800 + Math.abs(off) * .5); g.rotate(-.05 + r); g.beginPath(); if (clipL) { g.moveTo(-430, -330); g.lineTo(-10, -330); g.lineTo(26, -150); g.lineTo(-22, 20); g.lineTo(18, 190); g.lineTo(-8, 330); g.lineTo(-430, 330); } else { g.moveTo(430, -330); g.lineTo(-10, -330); g.lineTo(26, -150); g.lineTo(-22, 20); g.lineTo(18, 190); g.lineTo(-8, 330); g.lineTo(430, 330); } g.closePath(); g.clip();
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40; R(-410, -310, 820, 620, 14, C.cream); g.shadowBlur = 0;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) circ(-360 + i * 90, -260 + j * 88, 3, '#e3d9bf');
    const ink = '#27305e', l = (i) => p(lt, .8 + i * 1.15, 1.2 + i * 1.15);
    T('10 номеров', -330, -200, 66, ink, { al: 'left', a: l(0), italic: true, w: 700 });
    T('× 2 500 ₴ за ночь', -330, -100, 66, ink, { al: 'left', a: l(1), italic: true, w: 700 });
    T('× 30 дней', -330, 0, 66, ink, { al: 'left', a: l(2), italic: true, w: 700 });
    line(-330, 62, 330, 62, ink, 5, l(3));
    T('= 750 000 ₴', 0, 150, 104, '#d6402b', { a: l(3), italic: true, w: 900 });
    T('в месяц', 0, 240, 44, ink, { a: l(3), italic: true, w: 600 });
    g.restore(); };
  if (tear <= 0) { g.save(); g.translate(540, 800); g.rotate(-.05); g.restore(); }
  draw(true, -dx, -rot); draw(false, dx, rot);
}

// ---------- сцены ----------
// a,b — секунды; tag/right — подписи в шапке; vo — текст диктора (слова в *звёздочках* подсвечиваются)
const S = [
  { a: 0, b: 5, tag: 'ИТОГ ГОДА', right: '12 МЕС', vo: 'Ты вложил *три миллиона* гривен в отель на десять номеров. Через год на счету *ноль.* И вот почему.',
    d(lt) { bg('#090d20', '#151a3a'); stars(.5);
      const k = eio(p(lt, 1.5, 3.5)), v = lerp(3e6, 0, k);
      T(k < 1 ? 'ВЛОЖЕНО' : 'ЧЕРЕЗ ГОД НА СЧЕТУ', 540, 470, 40, C.mute, { w: 700 });
      const sh = k >= 1 ? Math.sin(lt * 40) * 8 * (1 - p(lt, 3.5, 4.1)) : 0;
      T(fmt(v) + ' ₴', 540 + sh, 640, k < 1 ? 132 : 220, mix('#ffffff', C.rd, k), { w: 900, glow: k >= 1 ? C.rd : null, gb: 50 });
      hotel(540, 1240, .78, 10 * (1 - k), { sign: 1 - k });
    } },
  { a: 5, b: 12, tag: 'КАРПАТЫ', right: 'СТАРТ', vo: 'Карпаты. Ты берёшь гостевой дом *в аренду.* Купить такой стоит от *двухсот шестидесяти* тысяч долларов. Столько у тебя нет.',
    d(lt) { bg('#1b2150', '#f08a5d'); stars(.35); mountains(1180, '#39407a', '#262c5c', 1, '#1b2046');
      hotel(540, 1180, .8, 1.2, { sign: .2 });
      const a = back(p(lt, 2.6, 3.1));
      if (a > 0) tf(400, 400, a, -.04, () => { R(120, 310, 560, 180, 28, C.cream, { glow: 'rgba(0,0,0,.6)' }); T('КУПИТЬ', 400, 355, 34, '#6a5f45', { w: 800 }); T('$260 000+', 400, 428, 86, '#1b2046', { w: 900 }); });
      const st = eo(p(lt, 4.6, 5.0)); if (st > 0) line(120, 450, 120 + 560 * st, 360, C.rd, 16);
      const r = p(lt, 1.6, 2.1); if (r > 0) { const y = lerp(-200, 0, back(r)); tf(800, 610 + y, 1, .05, () => pill('АРЕНДА', 800, 610 + y, 56, C.gr, '#06251a', { glow: C.gr })); }
    } },
  { a: 12, b: 19, tag: 'ВЛОЖЕНИЯ', right: '2 МЕС', vo: '*Ремонт,* мебель, бельё, котёл, генератор. *Три миллиона* уходят за два месяца.',
    d(lt) { bg('#090d20', '#151a3a');
      const it = [['РЕМОНТ', 1400000], ['МЕБЕЛЬ', 800000], ['БЕЛЬЁ И ТЕХНИКА', 300000], ['КОТЁЛ', 200000], ['ГЕНЕРАТОР', 300000]];
      let left = 3e6;
      it.forEach((x, i) => { const a = p(lt, .2 + i * .78, .2 + i * .78 + .35); left -= x[1] * eo(a); const y = 600 + i * 128, e = back(a);
        if (a > 0) tf(540, y, lerp(.7, 1, e), 0, () => { R(110, y - 52, 860, 104, 24, C.card, { a, stroke: '#2a3266', sw: 3 }); circ(172, y, 14, C.or, a); T(x[0], 214, y + 2, 42, '#dfe4ff', { al: 'left', a, w: 700 }); T('−' + fmt(x[1]), 930, y + 2, 44, C.rd, { al: 'right', a, w: 800 }); }); });
      T('ОСТАЛОСЬ', 540, 330, 36, C.mute, { w: 700 });
      T(fmt(left) + ' ₴', 540, 440, 124, mix('#ffffff', C.rd, 1 - left / 3e6), { w: 900 });
    } },
  { a: 19, b: 27, tag: 'ПЛАН', right: 'МЕЧТЫ', vo: 'Ты считаешь *на салфетке.* Десять номеров по две с половиной тысячи за ночь. *Семьсот пятьдесят* тысяч в месяц. Ты уже выбираешь машину.',
    d(lt) { bg('#2a1c16', '#4a2f22'); napkin(lt, 0);
      const c = eo(p(lt, 6.2, 7.2)); if (c > 0) { const x = lerp(1300, 540, c), y = 1255; R(x - 190, y - 62, 380, 62, 22, C.or); poly([[x - 110, y - 62], [x - 70, y - 118], [x + 80, y - 118], [x + 130, y - 62]], C.or); poly([[x - 84, y - 66], [x - 56, y - 106], [x + 68, y - 106], [x + 104, y - 66]], '#bfe3ff'); circ(x - 110, y, 34, '#1a1a1a'); circ(x + 110, y, 34, '#1a1a1a'); circ(x - 110, y, 14, '#888'); circ(x + 110, y, 14, '#888'); }
    } },
  { a: 27, b: 34, tag: 'ЯНВАРЬ', right: 'МЕСЯЦ 1', vo: '*Январь.* Отель *забит.* Гости стоят в очереди на ресепшене.',
    d(lt) { bg('#0a0f2c', '#27306a'); stars(.9); mountains(1180, '#4a5596', '#dfe6ff', 1, '#eef2ff');
      const lit = 9 * eo(p(lt, .3, 2.2)); hotel(540, 1180, .8, lit, { snow: 1 });
      for (let i = 0; i < 6; i++) { const a = eo(p(lt, 2.6 + i * .28, 3.3 + i * .28)); person(lerp(1250, 610 + i * 82, a), 1262 + (i % 2) * 8 + Math.abs(Math.sin(lt * 6 + i)) * 6 * (a < 1 ? 1 : .3), .42, ['#ff6b6b', '#4dabf7', '#ffd43b', '#b197fc', '#63e6be', '#ffa94d'][i]); }
      snow(lt); badge(lit * 10, 540, 400, C.gr, eo(p(lt, .2, .6)), lerp(.8, 1, back(p(lt, .2, .7))));
    } },
  { a: 34, b: 42, tag: 'ЯНВАРЬ', right: 'МЕСЯЦ 1', vo: 'Минус аренда, зарплаты, коммуналка, комиссия сайтам бронирования. Чистыми *двести сорок* тысяч. *Ты гений.*',
    d(lt) { bg('#090d20', '#151a3a');
      ledger('ЯНВАРЬ · 90%', [['Выручка', '+675 000', '#fff'], ['Аренда', '−120 000', C.rd], ['Зарплаты', '−100 000', C.rd], ['Коммуналка, расходы', '−110 000', C.rd], ['Комиссия сайтов', '−101 000', C.rd]], lt, .2, .85, '+244 000 ₴', C.gr, 4.6);
      const s = p(lt, 6.4, 6.8); if (s > 0) tf(740, 372, lerp(2.4, 1, eo(s)), -.08, () => { R(560, 322, 360, 100, 16, C.card, { stroke: C.or, sw: 8, a: s }); T('ТЫ ГЕНИЙ', 740, 375, 56, C.or, { w: 900, a: s }); });
    } },
  { a: 42, b: 48, tag: 'ФЕВРАЛЬ', right: 'МЕСЯЦ 2', vo: '*Февраль.* То же самое. Ты звонишь маме и говоришь, что бизнес — *это легко.*',
    d(lt) { bg('#3a2a5c', '#6b3f5e'); R(0, 1180, W, 740, 0, '#2a1d3f');
      R(640, 420, 320, 380, 16, '#0f1538', { stroke: '#f4ecd8', sw: 12 }); line(800, 420, 800, 800, '#f4ecd8', 10); line(640, 610, 960, 610, '#f4ecd8', 10);
      g.save(); g.beginPath(); g.rect(646, 426, 308, 368); g.clip(); snow(lt, .9); g.restore();
      person(400, 1260, 1.5, '#2f7d5b', { face: 'happy' });
      R(486, 800, 54, 96, 12, '#111'); R(492, 808, 42, 76, 6, '#4dabf7');
      const c = p(lt, .9, 1.5); if (c > 0) crown(400, lerp(200, 728, back(c)), 1.25, -.12);
      const b = back(p(lt, 2.4, 2.9)); if (b > 0) tf(560, 560, b, 0, () => { R(160, 300, 440, 190, 36, '#fff'); poly([[330, 480], [380, 560], [420, 480]], '#fff'); T('Мам, бизнес —', 380, 362, 46, '#1b2046', { w: 800 }); T('это легко!', 380, 428, 56, '#d6402b', { w: 900 }); });
      const m = eo(p(lt, .3, .8)); pill('+244 000 ₴', 800, 960, 50, 'rgba(8,11,30,.85)', C.gr, { a: m, stroke: C.gr, sw: 4 });
    } },
  { a: 48, b: 56, tag: 'МАРТ', right: 'МЕСЯЦ 3', vo: '*Март.* Снег сошёл. Горят *три окна* из десяти.',
    d(lt) { const m = eio(p(lt, .4, 3)); bg(mix('#0a0f2c', '#1d2a4f', m), mix('#27306a', '#51657e', m)); stars(.9 - m * .6);
      mountains(1180, mix('#4a5596', '#3d5a52', m), mix('#dfe6ff', '#2f4a3c', m), 1 - m, mix('#eef2ff', '#263a30', m));
      const lit = lerp(9, 3, eio(p(lt, 2.6, 6))); hotel(540, 1180, .8, lit, { snow: 1 - m }); snow(lt, 1 - p(lt, 0, 1.6));
      const k = p(lt, 2.6, 6); badge(lit * 10, 540, 400, mix(C.gr, C.rd, k));
    } },
  { a: 56, b: 65, tag: 'МАРТ', right: 'МЕСЯЦ 3', vo: 'А аренда *та же.* Зарплаты *те же.* Пустой номер греть так же дорого, как полный. *Минус сто сорок* тысяч за месяц.',
    d(lt) { bg('#12091a', '#2a1020');
      ledger('МАРТ · 30%', [['Выручка', '+225 000', '#fff'], ['Аренда', '−120 000', C.rd], ['Зарплаты', '−100 000', C.rd], ['Коммуналка, расходы', '−110 000', C.rd], ['Комиссия сайтов', '−34 000', C.rd]], lt, .2, .9, '−139 000 ₴', C.rd, 6.2);
      [1, 2].forEach((i, n) => { const a = back(p(lt, 1.3 + n * 1.3, 1.7 + n * 1.3)); if (a > 0) tf(520, 480 + i * 112, a, -.05, () => pill(n ? 'ТЕ ЖЕ' : 'ТА ЖЕ', 520, 480 + i * 112, 30, C.or, '#1b1200')); });
    } },
  { a: 65, b: 72, tag: 'АПРЕЛЬ — МАЙ', right: 'МЕСЯЦ 5', vo: 'Апрель. *Минус сто сорок.* Май. *Минус сто сорок.* Зимняя прибыль *закончилась.*',
    d(lt) { bg('#090d20', '#151a3a');
      const v = [0, 244, 488, 349, 210, 71], lb = ['', 'ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ'];
      const X = i => 150 + i * 156, Y = n => 1150 - n * 1.3;
      R(80, 300, 920, 960, 40, C.card, { stroke: '#2a3266', sw: 3 }); T('НА СЧЕТУ, ТЫС. ₴', 130, 372, 36, C.mute, { al: 'left', w: 700 });
      line(130, Y(0), 950, Y(0), '#3a4380', 4); [200, 400].forEach(n => line(130, Y(n), 950, Y(n), '#222a55', 2));
      const k = lerp(0, 5, p(lt, .3, 5.6)), n = Math.floor(k), f = k - n; let cur = v[0];
      g.save(); g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 0; i < 5; i++) { if (k <= i) break; const q = i < n ? 1 : f, x2 = lerp(X(i), X(i + 1), q), y2 = lerp(Y(v[i]), Y(v[i + 1]), q); g.beginPath(); g.moveTo(X(i), Y(v[i])); g.lineTo(x2, y2); g.strokeStyle = v[i + 1] > v[i] ? C.gr : C.rd; g.shadowColor = g.strokeStyle; g.shadowBlur = 18; g.stroke(); cur = lerp(v[i], v[i + 1], q); }
      g.restore();
      for (let i = 1; i <= 5; i++) { const a = p(k, i - .2, i); T(lb[i], X(i), 1205, 30, C.mute, { a, w: 700 }); circ(X(i), Y(v[i]), 13, '#fff', a); }
      const cx = lerp(X(n), X(Math.min(n + 1, 5)), f), cy = Y(cur); circ(cx, cy, 18, '#fff');
      T(fmt(Math.round(cur) * 1000) + ' ₴', 540, 470, 92, mix(C.gr, C.rd, p(k, 2, 5)), { w: 900 });
      const c = p(lt, 5.2, 6.8); if (c > 0) crown(820, lerp(540, 1500, c * c), 1.1, c * 3, 1 - p(lt, 6.2, 6.8));
    } },
  { a: 72, b: 80, tag: 'ЛЕТО', right: 'МЕСЯЦ 6–8', vo: '*Лето.* Туристы возвращаются. Но не все. Летом двадцать четвёртого карпатские отели были заполнены на *шестьдесят пять* процентов.',
    d(lt) { bg('#4aa3e8', '#c9ecff'); circ(900, 350, 70, '#fff3b0'); circ(900, 350, 104, '#fff3b0', .25);
      mountains(1180, '#4f8a6b', '#3c7a4e', 0, '#2f6a3f');
      const lit = lerp(3, 6.5, eo(p(lt, .4, 2.6))); hotel(540, 1180, .7, lit, { day: 1, wall: '#39427c' });
      const a = back(p(lt, 3.6, 4.2)); if (a > 0) tf(400, 430, a, 0, () => { T('65%', 400, 420, 230, '#fff', { w: 900, stroke: '#0b1024', sw: 26 }); });
      const b = eo(p(lt, 4.4, 4.9)); pill('КАРПАТЫ · ЛЕТО 2024', 400, 588, 36, '#0b1024', C.or, { a: b });
      T('данные: Экономическая правда', 400, 652, 26, '#0b1024', { a: b * .8, w: 600 });
    } },
  { a: 80, b: 87, tag: 'ЛЕТО', right: 'РЕАЛЬНОСТЬ', vo: 'При такой загрузке у тебя остаётся *восемьдесят тысяч* в месяц. Не семьсот пятьдесят.',
    d(lt) { bg('#2a1c16', '#4a2f22');
      const t = p(lt, 2.6, 3.6);
      const a = eo(p(lt, 2.8, 3.4)); R(170, 600, 740, 400, 40, C.card, { a, stroke: C.gr, sw: 5 }); T('ОСТАЁТСЯ', 540, 680, 38, C.mute, { a, w: 700 }); T('+84 000 ₴', 540, 800, 128, C.gr, { a, w: 900, glow: C.gr, gb: 30 }); T('в месяц · загрузка 65%', 540, 920, 38, '#dfe4ff', { a, w: 600 });
      napkin(99, t);
    } },
  { a: 87, b: 95, tag: 'ОСЕНЬ', right: 'МЕСЯЦ 9–11', vo: '*Осень.* Дожди. Снова три окна. Снова *минус.* И тут гаснет свет, и генератор начинает *есть дизель.*',
    d(lt) { bg('#141826', '#3a3f4f'); mountains(1180, '#3d3a3a', '#4a3b2a', 0, '#2b241c');
      const off = p(lt, 4.4, 4.6); hotel(540, 1180, .8, 3 * (1 - off), { sign: 1 - off, wall: '#2a3055' }); rain(lt);
      badge(30, 540, 400, C.rd, 1 - off);
      if (off > 0) { g.fillStyle = `rgba(0,0,8,${.5 * off})`; g.fillRect(0, 0, W, H);
        const ge = back(p(lt, 4.9, 5.4)), vx = Math.sin(lt * 70) * 4;
        tf(830, 1230, ge, 0, () => { R(700 + vx, 1150, 260, 150, 18, '#d98e1f'); R(720 + vx, 1172, 90, 60, 8, '#3a2a10'); circ(900 + vx, 1202, 26, '#3a2a10'); R(740 + vx, 1300, 30, 22, 4, '#222'); R(900 + vx, 1300, 30, 22, 4, '#222'); for (let i = 0; i < 4; i++) { const q = ((lt * 1.3 + i * .25) % 1); circ(960 + q * 70, 1150 - q * 120, 16 + q * 26, '#888', (1 - q) * .5); } });
        const l = Math.floor(p(lt, 5.4, 8) * 38); T('БЕЗ СВЕТА', 540, 400, 76, C.ye, { w: 900, a: off, glow: C.ye }); pill('ДИЗЕЛЬ: ' + l + ' л', 540, 520, 46, 'rgba(8,11,30,.9)', C.rd, { a: p(lt, 5.4, 5.7), stroke: C.rd, sw: 4 }); }
    } },
  { a: 95, b: 103, tag: 'ДЕКАБРЬ', right: 'МЕСЯЦ 12', vo: '*Декабрь.* Ты складываешь год. Два *жирных* месяца. Четыре *нормальных.* Шесть *пустых.*',
    d(lt) { bg('#090d20', '#151a3a');
      const mn = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'], ty = [0, 0, 2, 2, 2, 1, 1, 1, 2, 2, 2, 1], col = [C.gr, C.ye, C.rd], val = ['+244', '+84', '−139'];
      const when = [2.6, 4.0, 5.4];
      mn.forEach((m, i) => { const x = 110 + (i % 3) * 296, y = 330 + Math.floor(i / 3) * 190, a = eo(p(lt, .2 + i * .09, .5 + i * .09)), k = eo(p(lt, when[ty[i]], when[ty[i]] + .4));
        R(x, y, 268, 164, 24, mix('#1c2347', col[ty[i]], k), { a, glow: k > .5 ? col[ty[i]] : null, gb: 16 }); T(m, x + 134, y + 58, 48, mix('#8f98c7', '#0b1024', k), { a, w: 900 }); T(val[ty[i]], x + 134, y + 116, 38, '#0b1024', { a: k, w: 800 }); });
      [['2 жирных', C.gr], ['4 нормальных', C.ye], ['6 пустых', C.rd]].forEach((q, i) => { const a = back(p(lt, when[i], when[i] + .4)); if (a > 0) tf(200 + i * 340, 1160, a, 0, () => pill(q[0], 200 + i * 340, 1160, 36, q[1], '#0b1024')); });
    } },
  { a: 103, b: 110, tag: 'ИТОГ ГОДА', right: '12 МЕС', vo: 'Итог: *ноль.* Ты год работал без выходных, чтобы остаться при своих. А *три миллиона* так и не вернулись.',
    d(lt) { bg('#07091a', '#11142e');
      [['2 жирных', '+488 000', C.gr], ['4 нормальных', '+338 000', C.ye], ['6 пустых', '−834 000', C.rd]].forEach((r, i) => { const a = eo(p(lt, .1 + i * .3, .4 + i * .3)), y = 360 + i * 96; T(r[0], 150, y, 42, '#dfe4ff', { al: 'left', a, w: 600 }); T(r[1], 930, y, 48, r[2], { al: 'right', a, w: 800 }); });
      line(150, 620, 930, 620, '#3a4380', 4, p(lt, 1, 1.2));
      const z = back(p(lt, 1.1, 1.6)); if (z > 0) tf(540, 740, z, 0, () => T('≈ 0 ₴', 540, 740, 190, '#fff', { w: 900, glow: '#fff', gb: 30 }));
      person(540, 1290, .95, '#2f7d5b', { face: 'sad' }); R(380, 1270, 320, 40, 8, '#1c2347');
      const a = eo(p(lt, 4.6, 5.1)); pill('−3 000 000 ₴ вложений', 540, 900, 42, 'rgba(8,11,30,.9)', C.rd, { a, stroke: C.rd, sw: 4 });
    } },
  { a: 110, b: 118, tag: 'НОЯБРЬ · ВТОРНИК', right: '03:12', vo: 'И тут ты понимаешь. Отель убивает *не аренда.* Отель убивают *пустые номера* во вторник в ноябре.',
    d(lt) { bg('#05070f', '#141826'); mountains(1180, '#1c1f2b', '#191b24', 0, '#101218'); hotel(540, 1180, .8, .8, { sign: .1, wall: '#1f2444', roof: '#5a2a24' }); rain(lt, .9);
      const a = eo(p(lt, 1.4, 1.9)), sw = eio(p(lt, 4.4, 5.0));
      T('ОТЕЛЬ УБИВАЕТ', 540, 370, 84, '#fff', { a: a * (1 - sw * .0), w: 900, stroke: '#05070f', sw: 14 });
      T('НЕ АРЕНДА', 540, 490, 104, C.mute, { a: a * (1 - sw), w: 900, stroke: '#05070f', sw: 14 });
      line(240, 490, 240 + 600 * p(lt, 3.2, 3.6), 490, C.rd, 14, a * (1 - sw));
      tf(540, 500, lerp(1.5, 1, eo(sw)), 0, () => T('ПУСТЫЕ НОМЕРА', 540, 500, 96, C.or, { a: sw, w: 900, glow: C.or, gb: 40, stroke: '#05070f', sw: 14 }));
    } },
  { a: 118, b: 128, tag: 'РЕШЕНИЕ 1', right: 'ГОД 2', vo: 'Ты *меняешь правила.* Будни продаёшь компаниям под выездные встречи. Пустой сезон продаёшь *пакетами:* три ночи, баня, завтраки.',
    d(lt) { bg('#27406b', '#e9a66b'); mountains(1180, '#3d4f6a', '#3a4a3c', 0, '#2a3a2e');
      const lit = lerp(3, 6, eio(p(lt, 3.4, 5.4))); hotel(540, 1180, .8, lit, {});
      const x = lerp(-400, 300, eo(p(lt, 1.6, 3.4))), y = 1270;
      R(x - 230, y - 150, 460, 150, 26, '#f4ecd8'); R(x - 230, y - 60, 460, 26, 0, C.or); for (let i = 0; i < 4; i++) R(x - 200 + i * 104, y - 130, 84, 56, 8, '#4dabf7'); circ(x - 130, y, 34, '#1a1a1a'); circ(x + 130, y, 34, '#1a1a1a'); T('КОМАНДА · ВЫЕЗД', x, y - 46, 24, '#1b1200', { w: 900 });
      const c = back(p(lt, 6.6, 7.1)); if (c > 0) tf(540, 430, c, -.03, () => { R(150, 310, 780, 250, 34, C.card, { stroke: C.or, sw: 5, glow: 'rgba(0,0,0,.6)' }); T('ПАКЕТ · НЕСЕЗОН', 540, 368, 34, C.or, { w: 900 }); T('3 ночи + баня', 540, 440, 62, '#fff', { w: 900 }); T('+ завтраки', 540, 512, 54, '#dfe4ff', { w: 700 }); });
    } },
  { a: 128, b: 135, tag: 'РЕШЕНИЕ 2', right: 'ГОД 2', vo: 'Ставишь бронь *на своём сайте,* чтобы не отдавать *пятнадцать процентов.*',
    d(lt) { bg('#090d20', '#151a3a');
      const e = eo(p(lt, .1, .7)), py = lerp(1600, 70, e);
      R(300, 330 + py, 480, 830, 54, '#0b0e1f', { stroke: '#3a4380', sw: 6 }); R(326, 356 + py, 428, 778, 34, '#f4ecd8');
      R(326, 356 + py, 428, 110, 34, '#2e376b'); T('СВОЙ САЙТ', 540, 414 + py, 38, '#fff', { w: 900 });
      R(356, 500 + py, 368, 220, 20, '#b9c4ff'); poly([[356, 720 + py], [470, 590 + py], [560, 680 + py], [640, 620 + py], [724, 720 + py]], '#3c7a4e');
      R(356, 750 + py, 250, 28, 10, '#c9c0a8'); R(356, 800 + py, 330, 28, 10, '#c9c0a8'); R(356, 850 + py, 190, 28, 10, '#c9c0a8');
      const pu = 1 + Math.sin(lt * 5) * .03; tf(540, 1000 + py, pu, 0, () => { R(356, 950 + py, 368, 100, 28, C.or, { glow: C.or, gb: 24 }); T('ЗАБРОНИРОВАТЬ', 540, 1002 + py, 36, '#1b1200', { w: 900 }); });
      const a = back(p(lt, 2.6, 3.1)); if (a > 0) tf(300, 320, a, -.04, () => { pill('КОМИССИЯ 15%', 300, 320, 44, C.card, C.rd, { stroke: C.rd, sw: 4 }); });
      const s = eo(p(lt, 4.3, 4.7)); if (s > 0) line(100, 336, 100 + 400 * s, 304, C.rd, 12);
      const z = back(p(lt, 4.8, 5.3)); if (z > 0) tf(840, 320, z, .06, () => pill('0%', 840, 320, 60, C.gr, '#06251a', { glow: C.gr }));
    } },
  { a: 135, b: 143, tag: 'НЕСЕЗОН', right: 'ГОД 2', vo: 'Пустые месяцы заполняются *наполовину.* Всего двадцать процентов сверху, и минус сто сорок превращается *почти в ноль.*',
    d(lt) { bg('#0a0f2c', '#27306a'); stars(.7); mountains(1180, '#2f3a5c', '#243043', 0, '#1a2233');
      const k = eio(p(lt, .8, 3.2)), lit = lerp(3, 5, k); hotel(540, 1180, .68, lit, {});
      badge(lit * 10, 540, 400, mix(C.rd, C.ye, k));
      const a = eo(p(lt, 3.6, 4.0)), n = eio(p(lt, 4.6, 6.6)), v = lerp(-139000, -11000, n);
      R(190, 520, 700, 190, 34, 'rgba(8,11,30,.9)', { a, stroke: mix(C.rd, '#8f98c7', n), sw: 5 }); T('ПУСТОЙ МЕСЯЦ', 540, 566, 30, C.mute, { a, w: 700 }); T(sgn(Math.round(v / 1000) * 1000) + ' ₴', 540, 644, 92, mix(C.rd, '#c6cdf0', n), { a, w: 900 });
    } },
  { a: 143, b: 148, tag: 'ИТОГ', right: 'ГОД 2', vo: 'Год второй. *Плюс семьсот шестьдесят* тысяч.',
    d(lt) { bg('#06150f', '#0f2a22'); stars(.4);
      pill('ГОД 2', 540, 380, 54, C.gr, '#06251a', { a: eo(p(lt, 0, .4)), glow: C.gr });
      const v = lerp(0, 760000, eo(p(lt, 1.0, 3.2)));
      T('+' + fmt(v) + ' ₴', 540, 620, 150, C.gr, { w: 900, glow: C.gr, gb: 44 });
      for (let i = 0; i < 16; i++) { const q = ((lt * .6 + rnd(i)) % 1); circ(120 + rnd(i + 5) * 840, 900 - q * 520, 5 + rnd(i + 8) * 6, C.gr, (1 - q) * .7 * p(lt, 1, 2)); }
      hotel(540, 1240, .78, 8, {});
    } },
  { a: 148, b: 150, tag: 'ПРОДОЛЖЕНИЕ', right: 'ЧАСТЬ 2', vo: 'Три миллиона вернутся за *четыре года.* Если переживёшь первый.',
    d(lt) { bg('#090d20', '#151a3a');
      const a = eo(p(lt, 0, .3)); T('3 000 000 ₴ ВЕРНУТСЯ ЗА', 540, 480, 46, '#dfe4ff', { a, w: 800 });
      tf(540, 660, lerp(.6, 1, back(p(lt, .1, .5))), 0, () => T('4 ГОДА', 540, 660, 220, C.or, { a, w: 900, glow: C.or, gb: 40 }));
      const b = back(p(lt, .8, 1.2)); if (b > 0) tf(540, 960, b, 0, () => { pill('ЧАСТЬ 2 →', 540, 940, 64, C.or, '#1b1200', { glow: C.or }); T('что сломалось на второй год', 540, 1060, 40, '#dfe4ff', { w: 700 }); });
    } },
];
const DUR = S[S.length - 1].b;

// ---------- субтитры ----------
function chunks(sc) {
  if (sc._ch) return sc._ch;
  const words = []; let hl = false;
  sc.vo.split(/\s+/).forEach(w => { if (w.startsWith('*')) hl = true; const cl = w.replace(/\*/g, ''); if (cl) words.push({ w: cl, hl }); if (w.indexOf('*', 1) > 0) hl = false; });
  const ch = []; let cur = [];
  const len = a => a.map(x => x.w).join(' ').length;
  words.forEach(x => { if (x.w === '—') { if (cur.length) cur[cur.length - 1].w += ' —'; return; }
    if (cur.length && (cur.length >= 3 || len(cur) + x.w.length + 1 > 17)) { ch.push(cur); cur = []; }
    cur.push(x); if (/[.!?:,]$/.test(x.w) && len(cur) > 6) { ch.push(cur); cur = []; } });
  if (cur.length) ch.push(cur);
  const wt = ch.map(c => len(c) + 4), tot = wt.reduce((a, b) => a + b, 0), span = (sc.b - sc.a) - .25; let t = .08;
  sc._ch = ch.map((c, i) => { const d = span * wt[i] / tot, o = { c, s: t, e: t + d }; t += d; return o; });
  return sc._ch;
}
function subs(sc, lt) {
  const ch = chunks(sc).find(c => lt >= c.s && lt < c.e); if (!ch) return;
  let size = 78; const txt = ch.c.map(x => x.w.toUpperCase());
  const meas = () => { g.font = `900 ${size}px Inter`; return txt.reduce((a, w) => a + g.measureText(w).width, 0) + (txt.length - 1) * size * .28; };
  let w = meas(); while (w > 900) { size -= 4; w = meas(); }
  const k = lerp(.86, 1, back(p(lt, ch.s, ch.s + .12))), y = 1450;
  tf(540, y, k, 0, () => { let x = 540 - w / 2; txt.forEach((s, i) => { const ww = g.measureText(s).width; g.font = `900 ${size}px Inter`; T(s, x, y, size, ch.c[i].hl ? C.or : '#fff', { al: 'left', w: 900, stroke: '#05070f', sw: size * .26 }); x += ww + size * .28; }); });
}
function hud(sc, t) {
  g.save(); g.globalAlpha = .92;
  circ(74, 196, 8, C.rd, .5 + .5 * Math.round((t * 1.5) % 1));
  T(sc.tag, 98, 198, 28, '#dfe4ff', { al: 'left', w: 800 });
  T(sc.right, 1006, 198, 28, C.or, { al: 'right', w: 800 });
  R(60, 228, 960, 4, 2, 'rgba(255,255,255,.14)'); R(60, 228, 960 * t / DUR, 4, 2, C.or);
  g.restore();
}

// ---------- кадр ----------
function render(t) {
  const sc = S.find(s => t >= s.a && t < s.b) || S[S.length - 1], lt = t - sc.a;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, W, H);
  g.save(); const z = 1 + .025 * (lt / (sc.b - sc.a)); g.translate(540, 900); g.scale(z, z); g.translate(-540, -900);
  sc.d(lt); g.restore();
  hud(sc, t); subs(sc, lt);
  const f = 1 - p(lt, 0, .18); if (f > 0 && sc.a > 0) { g.fillStyle = `rgba(5,7,15,${f * .85})`; g.fillRect(0, 0, W, H); }
  const e = p(t, DUR - .01, DUR); if (e > 0) { g.fillStyle = '#05070f'; g.fillRect(0, 0, W, H); }
}
window.render = render; window.SCENES = S.map(s => ({ a: s.a, b: s.b })); window.FPS = FPS;
