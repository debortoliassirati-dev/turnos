// Modo TV: display passivo. Só o toque inicial para liberar o som é necessário.
const A = $('#app'); let ctx, osc;
const snd = document.createElement('div'); snd.className = 'snd'; snd.textContent = 'TOQUE NA TELA PARA ATIVAR O SOM';
snd.onclick = () => { ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); snd.remove(); wake(); };
document.body.appendChild(snd);
const wake = () => { try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {} };
document.addEventListener('visibilitychange', wake);

function siren(on) {
  if (!ctx) return;
  if (on && !osc) {
    osc = ctx.createOscillator(); const l = ctx.createOscillator(), g = ctx.createGain(), o = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 900; l.type = 'square'; l.frequency.value = 3; g.gain.value = 350;
    l.connect(g); g.connect(osc.frequency); o.gain.value = .5; osc.connect(o); o.connect(ctx.destination);
    osc.start(); l.start(); osc.l = l;
  }
  if (!on && osc) { osc.stop(); osc.l.stop(); osc = null; }
}

const hb = () => db.ref('tv').set(TS); hb(); setInterval(hb, 20000);   // sinal de vida para o celular

function draw() {
  const x = S.shift, n = now(), on = !!(x && x.on), al = alarm(), w = cur(); let h;
  if (on) {
    const nx = x.rb + x.rm * 6e4 - n, st = x.ph === 'f' ? 'FOLLOW-UPS' : x.c >= x.meta ? 'MODO RESPOSTA' : x.k === 'd' ? 'TURNO DE DÍVIDA' : 'PROSPECTANDO';
    h = `<div class="clock">${clock()}</div><div class="score">${x.c} / ${x.meta}</div>
      <div class="bar"><i style="width:${Math.min(100, x.c / x.meta * 100)}%"></i></div>
      <div class="mid yel">${st}${x.ph !== 'f' ? ' · RONDA EM ' + fmt(nx).slice(3) : ''}${x.xl > 0 ? ' · EXTRAS ' + x.xl : ''}</div>`;
  } else {
    const last = x && x.t ? `<div class="mid ${x.ok ? 'grn' : 'red'}">${x.ok ? 'ÚLTIMO TURNO: CUMPRIDO' : 'ÚLTIMO TURNO: ENCERRADO NA GUILHOTINA'}</div>` : '';
    const late = w && n >= w.s + 3e5;
    h = `<div class="clock">${clock()}</div>${last}` + (late ? `<div class="warn">VOCÊ ESTÁ ATRASADO. BATA O PONTO</div>`
      : `<div class="mid">${w ? 'PRÓXIMO TURNO ÀS ' + p2(new Date(w.s).getHours()) + ':' + p2(new Date(w.s).getMinutes()) : 'SEM TURNO AGORA'}</div>`);
  }
  h += `<div class="foot"><span class="red">HORAS JOGADAS FORA: ${hrs(S.h)}</span><span class="grn">SEQUÊNCIA: ${S.streak || 0}</span></div>`;
  if (al) h += `<div class="alarm">RONDA DE RESPOSTAS!<br>OLHE O INSTAGRAM</div>`;
  A.innerHTML = h; siren(al);
}
setInterval(() => { check(); draw(); }, 1000);   // só redesenha: os tempos vêm do servidor
