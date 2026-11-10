// Modo Mobile: controle ativo, visão de túnel, fricção para silenciar a ronda.
const A = $('#app'); let tv = 0, hs = 0, raf = 0;
db.ref('tv').on('value', v => tv = v.val() || 0);
const hap = () => { try { navigator.vibrate && navigator.vibrate(40); } catch (e) {} $('#hl').click(); };   // iOS 17.4+: switch gera haptic
const up = o => R.update(o), NM = { m: 'MANHÃ', t: 'TARDE', d: 'DÍVIDA' };
const B = (t, id, c = '', d = false) => `<button class="big ${c}" id="${id}" ${d ? 'disabled' : ''}>${t}</button>`;

function panel(on) {
  const c = cfg();
  return `<details class="cf"><summary>⚙ Configurações (valem a partir de amanhã)</summary><fieldset ${on ? 'disabled' : ''}>
  <label>Leads por hora <input id="c_rate" type="number" value="${c.rate}"></label>
  <label>Ronda (min) <input id="c_ronda" type="number" value="${c.ronda}"></label>
  <label>Manhã <input id="c_m0" type="time" value="${c.m[0]}"><input id="c_m1" type="time" value="${c.m[1]}"></label>
  <label>Tarde <input id="c_t0" type="time" value="${c.t[0]}"><input id="c_t1" type="time" value="${c.t[1]}"></label>
  <button class="sm" id="sv">SALVAR</button></fieldset></details>`;
}

function draw() {
  const x = S.shift, on = !!(x && x.on), n = now(); let h, pn = true;
  if (on && n - tv > 9e4) { h = '<h1 class="red">TV OFFLINE<br>LIGUE A TELA</h1>'; pn = false; }
  else if (on && alarm()) { h = '<h1>RONDA!</h1><button class="big red hold" id="hd"><i></i>SEGURE 4s</button>'; pn = false; }
  else if (on && x.rc) { h = '<h2>Quantos leads você respondeu no Instagram?</h2><input id="n" type="number" inputmode="numeric" min="0">' + B('Confirmar', 'ok'); pn = false; }
  else if (on) {
    const cd = Math.ceil((3e4 - (n - (x.la || 0))) / 1e3), wait = cd > 0;
    if (x.ph === 'f') h = `<h2>Follow-ups: ${x.f || 0}</h2>` + B('+1 Follow-up', 'fu') + B('Finalizei Follow-ups', 'ff', 'gray');
    else if (x.ph === 'p') h = `<h2>${x.c} / ${x.meta}</h2>` + B(wait ? 'Aguarde ' + cd + 's' : '+1 Prospecção', 'pp', '', wait);
    else if (x.xl > 0) h = `<h2>Modo resposta · extras: ${x.xl}</h2>` + B(wait ? 'Aguarde ' + cd + 's' : '+1 Prospecção Extra', 'px', '', wait);
    else h = '<h2>Modo resposta<br>Responda seus leads</h2>' + B('Bater ponto — Saída', 'ex', 'red', x.c < x.meta);
  } else {
    const w = cur();
    h = (x && x.t ? `<h2 class="${x.ok ? 'grn' : 'red'}">${x.ok ? 'Turno cumprido' : 'Turno encerrado'}</h2>` : '')
      + (w ? B('Bater ponto — Entrada<br><small>' + NM[w.k] + '</small>', 'pt') : '<h2>Fora de turno</h2>');
  }
  if (pn) h += panel(on);
  if (A.dataset.v !== h) { A.dataset.v = h; A.innerHTML = h; }
}

function punch() {
  const w = cur(); if (!w) return; const c = cfg(), dur = w.e - w.s, late = Math.max(0, now() - w.s);
  tx(s => {
    if (s.shift && s.shift.on) return false;
    s.done = s.done || {}; s.done[w.key] = 1;
    const snap = s.h || 0;
    if (w.k !== 'd') s.h = snap + Math.min(late * 2, dur) / 36e5;   // atraso em dobro, cobrado na hora, sem desconto na meta
    s.shift = { on: true, k: w.k, e: w.e, rate: c.rate, rm: c.ronda, snap, c: 0, f: 0, xl: 0, xt: 0, ans: 0, la: 0, rc: false, rb: now(),
      ph: w.k === 'd' ? 'p' : 'f', meta: w.k === 'd' ? Math.ceil(snap * 12) : Math.round(c.rate * dur / 36e5) };
  }).then(() => up({ 'shift/rb': TS }));
}
function plus(extra) {
  const x = S.shift; if (now() - (x.la || 0) < 3e4) return;           // 30 s mínimos entre registros
  const o = { 'shift/la': TS };
  if (extra) o['shift/xl'] = x.xl - 1; else { o['shift/c'] = x.c + 1; if (x.c + 1 >= x.meta) o['shift/ph'] = 'r'; }
  up(o);
}
function toll() {
  const a = parseInt($('#n').value, 10); if (!(a >= 0)) return; const x = S.shift;
  const o = { 'shift/rc': false, 'shift/rb': TS, 'shift/ans': (x.ans || 0) + a };
  if (a === 0 && x.ph === 'r') { const g = Math.min(3, 12 - (x.xt || 0)); if (g > 0) { o['shift/xl'] = (x.xl || 0) + g; o['shift/xt'] = (x.xt || 0) + g; } }
  up(o);   // reinicia a ronda no timestamp do servidor e devolve os botões
}
function save() {
  const g = i => $('#c_' + i).value, tm = dk(now() + 864e5);
  up({ cfg: cfg(), pending: { from: tm, cfg: { rate: +g('rate') || 6, ronda: +g('ronda') || 20, m: [g('m0'), g('m1')], t: [g('t0'), g('t1')], d: cfg().d } } });
}

A.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return; hap(); const x = S.shift || {};
  ({ pt: punch, fu: () => up({ 'shift/f': (x.f || 0) + 1 }), ff: () => up({ 'shift/ph': 'p', 'shift/rb': TS }),
     pp: () => plus(0), px: () => plus(1), ok: toll, sv: save,
     ex: () => x.c >= x.meta && tx(s => s.shift.on ? close(s, 'saida') : false) })[b.id]?.();
});
// Hold-to-Confirm: 4 s ininterruptos; soltar zera a barra. Ao completar, a TV silencia (rc = true) e o celular segue travado no pedágio.
A.addEventListener('pointerdown', e => {
  if (!e.target.closest('#hd')) return; hap(); hs = performance.now(); const bar = $('#hd i');
  const f = () => { const p = (performance.now() - hs) / 4000; bar.style.width = Math.min(100, p * 100) + '%';
    if (p >= 1) { hs = 0; up({ 'shift/rc': true }); return; } raf = requestAnimationFrame(f); }; f();
});
const rel = () => { if (!hs) return; cancelAnimationFrame(raf); hs = 0; const b = $('#hd i'); if (b) b.style.width = 0; };
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, rel));
document.addEventListener('contextmenu', e => e.preventDefault());
setInterval(() => { check(); draw(); }, 1000);
