/* ===== Misi Penyelamatan di Labirin Ajaib ===== */
const $ = s => document.querySelector(s);
const show = id => document.querySelectorAll('.scr').forEach(e => e.hidden = e.id !== id);
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

/* ---------- Suara ---------- */
let soundOn = true, AC;
function say(t) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'id-ID'; u.rate = 0.85; u.pitch = 1.3;
  const v = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith('id'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function beep(f = 440, d = 0.12, type = 'sine') {
  if (!soundOn) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = 0.15;
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + d);
  } catch (e) {}
}
$('#snd').onclick = () => { soundOn = !soundOn; $('#snd').textContent = soundOn ? '🔊' : '🔇'; if (!soundOn) speechSynthesis.cancel(); };

/* ---------- Bank soal (semua visual + suara) ---------- */
const ANIMALS = [{ e: '🐱', s: 'meong' }, { e: '🐶', s: 'guk guk' }, { e: '🐔', s: 'kukuruyuk' }, { e: '🐮', s: 'moo' }];
const SHAPES = [{ e: '🔴', n: 'lingkaran' }, { e: '🔺', n: 'segitiga' }, { e: '🟦', n: 'persegi' }];
const COL = ['🔴', '🔵', '🟢', '🟡'];
function qAnimal() {
  const a = ANIMALS[rnd(4)], o = shuffle([a, ...shuffle(ANIMALS.filter(x => x !== a)).slice(0, 2)]);
  return { say: `Hewan apa yang bersuara ${a.s}?`, prompt: `🗣️ ${a.s}!`, opts: o.map(x => ({ h: x.e, ok: x === a })) };
}
function qShape() {
  const a = SHAPES[rnd(3)];
  return { say: `Pilih bentuk ${a.n}!`, prompt: a.n, opts: shuffle(SHAPES).map(x => ({ h: x.e, ok: x === a })) };
}
function qPattern() {
  const [a, b] = shuffle(COL), c = COL.find(x => x !== a && x !== b);
  return { say: 'Lanjutkan pola warnanya!', prompt: `${a}${b}${a}❓`, opts: shuffle([a, b, c]).map(x => ({ h: x, ok: x === a })) };
}
function qCount() {
  const n = 1 + rnd(5); let w = [n];
  while (w.length < 3) { const x = 1 + rnd(5); if (!w.includes(x)) w.push(x); }
  return { say: 'Ada berapa apel? Hitung ya!', prompt: '🍎'.repeat(n), opts: shuffle(w).map(x => ({ h: String(x), ok: x === n })) };
}
const DOORQ = [[qAnimal, qShape], [qPattern, qCount, qPattern]];
const PUJI = ['Hebat!', 'Pintar sekali!', 'Betul! Bagus!'];

/* ---------- Mesin kuis ---------- */
let steps, stepI, onWin, cur, locked = false, mistakes = 0;
function runQuiz(list, cb) { steps = list; stepI = 0; onWin = cb; nextStep(); }
function nextStep() {
  locked = false;
  if (stepI >= steps.length) { $('#quiz').hidden = true; onWin(); return; }
  cur = steps[stepI]();
  $('#qdots').textContent = steps.map((_, i) => i < stepI ? '⭐' : '⚪').join(' ');
  $('#qprompt').textContent = cur.prompt;
  $('#qopts').innerHTML = cur.opts.map((o, i) => `<button class="opt" data-i="${i}">${o.h}</button>`).join('');
  $('#quiz').hidden = false; say(cur.say);
}
$('#qopts').onclick = e => {
  const b = e.target.closest('.opt'); if (!b || locked) return;
  if (cur.opts[b.dataset.i].ok) {
    locked = true; stepI++; beep(880, 0.15); b.style.borderColor = '#2fb344'; say(PUJI[rnd(3)]);
    setTimeout(nextStep, 1400);
  } else {
    mistakes++; beep(220, 0.25, 'triangle'); say('Coba lagi ya!');
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  }
};
$('#qsay').onclick = () => cur && say(cur.say);

/* ---------- Penyelesaian level ---------- */
function done(title, voice, next) {
  const st = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
  $('#dstars').innerHTML = [0, 1, 2].map(i => `<span style="animation-delay:${i * 0.35}s">${i < st ? '⭐' : '☆'}</span>`).join('');
  $('#dtitle').textContent = title; $('#done').hidden = false; beep(784, 0.3); say(voice);
  $('#dnext').onclick = () => { $('#done').hidden = true; next(); };
}

/* ---------- Labirin (# dinding, P pemain, D pintu, N teman, X portal) ---------- */
const MAPS = [[
  '#########',
  '#P..#...#',
  '###.#.#.#',
  '#...#.#D#',
  '#.###.#N#',
  '#.....###',
  '#########'
], [
  '###########',
  '#P#.....#.#',
  '#.#.###.#.#',
  '#...#.#...#',
  '###.#.###.#',
  '#...#...#.#',
  '#.#####.#D#',
  '#.......#X#',
  '###########'
]];
const T = 40, cv = $('#cv'), g = cv.getContext('2d');
let grid, pr, pc, lvl = 0;
function loadLevel(i) {
  lvl = i; mistakes = 0;
  grid = MAPS[i].map(r => r.split(''));
  grid.forEach((row, r) => row.forEach((c, k) => { if (c === 'P') { pr = r; pc = k; row[k] = '.'; } }));
  cv.width = grid[0].length * T; cv.height = grid.length * T;
  $('#lvl').textContent = 'Level ' + (i + 1);
  $('#goal').textContent = i === 0 ? '🐰 ?' : '🌀 ?';
  show('maze'); draw();
  say(i === 0 ? 'Ayo selamatkan temanmu! Jalankan monyet ke pintu yang terkunci!' : 'Labirinnya lebih besar! Cari pintu terkunci menuju monster!');
}
function draw() {
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '30px serif';
  grid.forEach((row, r) => row.forEach((c, k) => {
    g.fillStyle = c === '#' ? '#43b05c' : '#f7e7b4'; g.fillRect(k * T, r * T, T, T);
    const ico = c === '#' ? '🌳' : c === 'D' ? '🔒' : c === 'N' ? '🐰' : c === 'X' ? '🌀' : '';
    if (ico) g.fillText(ico, k * T + T / 2, r * T + T / 2 + 2);
  }));
  g.fillText('🐵', pc * T + T / 2, pr * T + T / 2 + 2);
}
function move(dx, dy) {
  if (!$('#quiz').hidden || !$('#done').hidden || $('#maze').hidden) return;
  const nr = pr + dy, nc = pc + dx, c = grid[nr] && grid[nr][nc];
  if (!c || c === '#') { beep(150, 0.08, 'square'); return; }
  if (c === 'D') {
    runQuiz(DOORQ[lvl], () => { grid[nr][nc] = '.'; draw(); say('Pintu terbuka! Ayo masuk!'); });
    return;
  }
  pr = nr; pc = nc; beep(400 + 20 * (pr + pc), 0.05); draw();
  if (c === 'N') done('Temanmu selamat!', 'Hore! Kamu menyelamatkan kelinci! Hebat sekali!', () => loadLevel(1));
  if (c === 'X') done('Jalan ke monster terbuka!', 'Hebat! Sekarang ayo lawan monster!', startBoss);
}
document.querySelectorAll('.dpad .btn').forEach(b => b.onclick = () => move(...b.dataset.d.split(',').map(Number)));
addEventListener('keydown', e => {
  const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (m) move(...m);
});
cv.addEventListener('pointerdown', e => {  /* tap untuk jalan: ketuk arah tujuan */
  const r = cv.getBoundingClientRect(), s = r.width / cv.width;
  const dx = (e.clientX - r.left) / s - (pc * T + T / 2), dy = (e.clientY - r.top) / s - (pr * T + T / 2);
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0); else move(0, dy > 0 ? 1 : -1);
});
$('#go').onclick = () => { say('Selamat datang!'); loadLevel(0); };

/* ---------- Level 3: Boss, gelembung angka ---------- */
let hp, ans, bubs = [], bossRun = false, flying = 0;
function startBoss() {
  lvl = 2; mistakes = 0; hp = 4; show('boss'); bossRun = true;
  const ar = $('#arena'); ar.querySelectorAll('.bub').forEach(b => b.remove()); bubs = [];
  $('#mon').style.opacity = 1; $('#mon').textContent = '👾';
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('button'); el.className = 'bub'; el.innerHTML = '<span></span>'; ar.appendChild(el);
    const o = { el, x: i * (ar.clientWidth / 5), y0: 70 + (i % 3) * 65, ph: i * 1.3, sp: 0.5 + Math.random() * 0.4, n: 0, fly: false };
    el.onclick = () => pop(o); bubs.push(o);
  }
  renderHP(); newQ(); requestAnimationFrame(bloop);
  setTimeout(() => say('Ini monster penjaga! Ledakkan gelembung yang jawabannya benar!'), 100);
}
const renderHP = () => $('#hp').textContent = '👾 ' + '❤️'.repeat(hp) + '🖤'.repeat(4 - hp);
function newQ() {
  const a = 1 + rnd(3), b = 1 + rnd(3); ans = a + b;
  $('#bq').innerHTML = `${'🍎'.repeat(a)} + ${'🍎'.repeat(b)}<br>${a} + ${b} = ❓`;
  const nums = shuffle([ans, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== ans)).slice(0, 4)]);
  bubs.forEach((o, i) => { o.n = nums[i]; o.el.firstChild.textContent = nums[i]; });
  say(`${a} tambah ${b} sama dengan berapa?`);
}
function bloop(t) {
  if (!bossRun) return;
  const w = $('#arena').clientWidth;
  bubs.forEach(o => {
    if (o.fly) return;
    o.x += o.sp; if (o.x > w) o.x = -70;
    o.el.style.transform = `translate(${o.x}px,${o.y0 + Math.sin(t / 600 + o.ph) * 12}px)`;
  });
  requestAnimationFrame(bloop);
}
function pop(o) {
  if (o.fly || flying) return;
  if (o.n !== ans) {
    mistakes++; beep(220, 0.25, 'triangle'); say('Coba lagi ya!');
    const s = o.el.firstChild; s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); return;
  }
  o.fly = true; flying = 1; beep(880, 0.15);
  const ar = $('#arena');
  o.el.style.transition = 'transform .6s ease-in';
  o.el.style.transform = `translate(${ar.clientWidth / 2 - 35}px,${ar.clientHeight - 110}px)`;
  setTimeout(() => {
    o.el.style.transition = ''; o.x = -70; o.fly = false; flying = 0;
    hp--; renderHP(); beep(300, 0.2, 'sawtooth');
    const m = $('#mon'); m.textContent = '🤣'; m.classList.remove('hit'); void m.offsetWidth; m.classList.add('hit');
    if (hp <= 0) {
      bossRun = false; m.style.opacity = 0;
      setTimeout(() => done('Monster kalah!', 'Hore! Monster tertawa dan pergi! Kamu menyelamatkan semua teman! Permainan selesai!', () => show('start')), 900);
    } else { setTimeout(() => { m.textContent = '👾'; }, 600); newQ(); }
  }, 650);
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();
