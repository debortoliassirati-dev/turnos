// Núcleo compartilhado: Firebase, relógio do servidor, regras de turno, guilhotina e dívida.
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database(), R = db.ref('st'), TS = firebase.database.ServerValue.TIMESTAMP;
let off = 0, S = {}, loaded = false, pend = false;
db.ref('.info/serverTimeOffset').on('value', v => off = v.val() || 0);
R.on('value', v => { loaded = true; S = v.val() || {}; if (window.draw) draw(); });

const now = () => Date.now() + off;                       // hora do servidor
const $ = q => document.querySelector(q), p2 = n => String(n).padStart(2, '0');
const DEF = { rate: 6, ronda: 20, m: ['09:00', '14:00'], t: ['15:00', '19:00'], d: ['19:00', '23:00'] };
const dk = (t = now()) => { const d = new Date(t); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
const at = (hm, t = now()) => { const d = new Date(t), [h, m] = hm.split(':'); d.setHours(+h, +m, 0, 0); return d.getTime(); };
const cfg = () => { const p = S.pending; return p && dk() >= p.from ? p.cfg : (S.cfg || DEF); };   // mudanças valem só a partir do dia seguinte
const fmt = ms => { const s = Math.floor(Math.max(0, ms) / 1e3); return p2(Math.floor(s / 3600)) + ':' + p2(Math.floor(s % 3600 / 60)) + ':' + p2(s % 60); };
const clock = () => { const d = new Date(now()); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); };
const hrs = h => { h = h || 0; return Math.floor(h) + 'h' + p2(Math.round(h % 1 * 60)); };

// Janelas do dia: manhã, tarde e (fim de semana, com dívida) Turno de Dívida.
function wins() {
  const c = cfg(), n = now(), d = dk(n), L = [['m', c.m], ['t', c.t]];
  if ([0, 6].includes(new Date(n).getDay()) && (S.h || 0) > 0) L.push(['d', c.d]);
  return L.map(([k, [a, b]]) => { const s = at(a); let e = at(b); if (e <= s) e += 864e5; return { k, s, e, key: d + k }; });   // vira a meia-noite
}
const cur = () => wins().find(w => now() < w.e && !(S.done || {})[w.key]);
// Alarme: ronda estourou (relógio do servidor) e ainda não confirmada.
const alarm = () => { const x = S.shift; return !!(x && x.on && x.ph !== 'f' && !x.rc && now() >= x.rb + x.rm * 6e4); };

const tx = f => R.transaction(s => { s = s || {}; return f(s) === false ? undefined : s; });

// Encerra o turno. 1 lead faltante = 1/rate hora perdida. Dívida paga em 12 leads/hora.
function close(s, why) {
  const x = s.shift, ok = x.c >= x.meta; x.on = false; x.ok = ok; x.t = why;
  if (x.k === 'd') s.h = Math.max(0, (s.h || 0) - x.snap) + (ok ? 0 : (x.meta - x.c) / 12 * 1.5);
  else { s.h = (s.h || 0) + (ok ? 0 : (x.meta - x.c) / x.rate); s.streak = ok ? (s.streak || 0) + 1 : 0; }
}

// Rodado por TV e celular a cada segundo; as transações impedem duplicidade.
function check() {
  if (!loaded) return;
  // Marca o início do sistema: turnos anteriores a este momento nunca são cobrados.
  if (S.arm == null) { if (!pend) { pend = true; R.child('arm').set(TS).then(() => pend = false); } return; }
  const n = now(), mo = dk(n).slice(0, 7), x = S.shift;
  if (new Date(n).getDate() === 3 && S.rk !== mo) tx(s => { s.perd = s.h || 0; s.h = 0; s.rk = mo; });   // zera dia 3
  if (x && x.on) { if (n >= x.e) tx(s => s.shift && s.shift.on ? close(s, 'fim') : false); return; }      // guilhotina
  for (const w of wins()) if (n >= w.e && w.s >= S.arm && !(S.done || {})[w.key]) tx(s => {                               // faltou ao turno
    s.done = s.done || {}; if (s.done[w.key]) return false; s.done[w.key] = 1;
    if (w.k === 'd') s.h = (s.h || 0) * 1.5; else { s.streak = 0; s.h = (s.h || 0) + (w.e - w.s) / 36e5; }
  });
}
