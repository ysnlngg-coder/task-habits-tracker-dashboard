/* ============================================================================
   js/app/02-timer-effects.js
   WHAT IT DOES : Small animations and the focus timer logic.
   EDIT HERE    : timer behaviour, confetti on completion.
   ============================================================================ */

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const all = () => { const i = items(D); return i.length > 0 && i.every(h => st(h.id, D) === 2); };
/** Plays a small CSS animation on an element after a render. */
function fx() { FX.forEach(([s, c, u]) => { const e = $(s), g = e && (u ? e.closest(u) : e); if (!g)
    return; if (c === 'burst')
    burst(g);
else
    g.classList.add(c); }); FX = []; const b = $('.bar i'); if (b) {
    LP = +b.dataset.w;
    requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = b.dataset.w + '%'; }));
} }
/** Confetti burst used when a habit is completed. */
function burst(g) { if (RM)
    return; const r = g.getBoundingClientRect(); for (let i = 0; i < 28; i++) {
    const p = document.createElement('i');
    p.className = 'pt';
    p.style.cssText = `left:${r.left + Math.random() * r.width}px;top:${r.top}px;background:${i % 3 ? 'var(--ac)' : 'var(--ok)'}`;
    document.body.appendChild(p);
    const a = -Math.PI * Math.random(), v = 70 + Math.random() * 130;
    p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px,${Math.sin(a) * v}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }], { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(.15,.8,.3,1)' }).onfinish = () => p.remove();
} }
/** Toast message. */
function tt() { const r = document.documentElement; r.classList.add('tt'); clearTimeout(tt.t); tt.t = setTimeout(() => r.classList.remove('tt'), 500); }
const fm = () => Math.min(180, Math.max(1, +S.fmin || 25));
let MC = null, TD = false;
let T = { run: false, end: 0, left: fm() * 60, task: '' };
const tl = () => T.run ? Math.max(0, Math.round((T.end - Date.now()) / 1000)) : T.left;
/** Draws the focus timer every 250 ms. */
function tdraw() {
    const t = $('#rt');
    if (!t)
        return;
    const l = tl(), tot = fm() * 60;
    if (T.run && l === 0) {
        T.run = false;
        T.left = tot;
        const k = key(new Date());
        (S.sess = S.sess || {})[k] = (S.sess[k] || 0) + 1;
        save();
        burst($('.ring'));
        render();
        return;
    }
    t.textContent = p2(Math.floor(l / 60)) + ':' + p2(l % 60);
    $('#rf').style.strokeDashoffset = 327 * (1 - l / tot);
    $('#tgo').textContent = T.run ? 'Pause' : l < tot ? 'Resume' : 'Start';
    $('.tmr').classList.toggle('run', T.run);
    document.title = T.run ? t.textContent + ' Focus' : 'Daily Habit Tracker';
}
setInterval(tdraw, 250);
