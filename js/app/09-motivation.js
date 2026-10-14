/* ============================================================================
   js/app/09-motivation.js
   WHAT IT DOES : Duolingo-style motivation: streak, XP, level, daily checks, "I don't feel like it".
   EDIT HERE    : XP rules, encouraging messages, the rescue popup.
   ============================================================================ */

/** Confetti animation. */
function confetti(x, y) { for (let i = 0; i < 28; i++) {
    const p = document.createElement('i');
    p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:8px;height:12px;border-radius:2px;background:${['var(--ac)', 'var(--ok)', '#eab308', '#3b82f6', '#a855f7'][i % 5]};z-index:130;pointer-events:none`;
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 190;
    p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px,${Math.sin(a) * v + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
} }
/** Confetti + toast + sound for achievements. */
function celebrate(msg) { confetti(innerWidth / 2, innerHeight / 3); if (window.SFX)
    SFX.play('success'); const t = document.createElement('div'); t.className = 'ht-toast'; t.innerHTML = `<div class="nw-av">★</div><div><b>${esc(msg)}</b></div>`; document.body.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3500); }
/** Computes streak, XP, level and today progress from your logs. */
function momStats() {
    const k0 = key(new Date());
    let streak = 0, risk = false, stop = false;
    for (let i = 0; i < 400 && !stop; i++) {
        const k = key(new Date(Date.now() - i * 864e5)), it = items(k), n = it.filter(h => st(h.id, k) === 2).length;
        if (n > 0)
            streak++;
        else if (i === 0)
            risk = true;
        else if (it.length)
            stop = true;
    }
    const it0 = items(k0), tot = it0.length, done = it0.filter(h => st(h.id, k0) === 2).length;
    let xp = 0;
    for (const k in S.log)
        for (const id in S.log[k])
            if (S.log[k][id] === 2)
                xp += 10;
    xp += S.goals.filter(g => g.done).length * 50;
    for (const k in (S.cl || {}))
        xp += Object.keys(S.cl[k]).length * 5;
    xp += S.bonus || 0;
    const lv = 1 + Math.floor(Math.sqrt(xp / 40)), lo = 40 * (lv - 1) * (lv - 1), hi = 40 * lv * lv;
    return { streak, risk, tot, done, xp, lv, pr: (xp - lo) / (hi - lo), need: hi - xp };
}
let MQ = Math.floor(Math.random() * 50);
/** Picks the encouraging message on the momentum card. */
function momMsg(m) {
    const h = new Date().getHours(), M = { 3: 1, 7: 1, 14: 1, 30: 1, 50: 1, 100: 1 };
    if (M[m.streak] && m.done > 0)
        return `🔥 ${m.streak} days in a row! You are on fire.`;
    if (!m.tot)
        return 'Nothing scheduled today. Add one tiny habit and start a streak.';
    if (m.done === m.tot)
        return `Perfect day! Everything is done.${m.streak ? ` Come back tomorrow to keep your ${m.streak}-day streak.` : ''}`;
    if (!m.done && m.risk && m.streak > 0 && h >= 17)
        return `Your ${m.streak}-day streak is at risk tonight. One habit saves it!`;
    if (!m.done)
        return h < 12 ? "Fresh start! One small habit gets today's streak going." : 'No pressure. Start with the easiest one.';
    return `${m.tot - m.done} to go. You are ${Math.round(m.done / m.tot * 100)}% there, keep it rolling!`;
}
/** The momentum card on the Focus screen. */
function momentum() {
    const m = momStats(), q = S.quotes.length ? S.quotes[MQ % S.quotes.length].text : '', p = m.tot ? m.done / m.tot : 0;
    return `<div class="mom"><div class="mom-top"><div class="mom-fl"><span class="fl${m.streak ? '' : ' off'}">🔥</span><b>${m.streak}</b><small>day streak</small></div><div class="mom-rg"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" class="mb"/><circle cx="18" cy="18" r="15.5" class="mf" style="stroke-dasharray:${(97.4 * p).toFixed(1)} 97.4"/></svg><b>${m.done}/${m.tot}</b></div><div class="mom-lv"><div>Level <b>${m.lv}</b> <small>${m.xp} XP</small></div><div class="xpb"><i style="width:${Math.round(m.pr * 100)}%"></i></div><small>${m.need} XP to level ${m.lv + 1}</small></div></div><p class="mom-msg">${momMsg(m)}</p>${q ? `<div class="mom-q">“${esc(q)}” <button class="pill" data-a="mq">Another</button></div>` : ''}<button class="pr mom-btn" data-a="rescue">I don't feel like it</button></div>`;
}
/** Daily progress bar of a category. */
function catBar(c) { const k = key(new Date()), mk = (S.cl || {})[k] || {}, n = c.items.filter(x => mk[x.id]).length, t = c.items.length; return t ? `<div class="cbar"><i style="width:${n / t * 100}%"></i></div><p class="mu cmsg">${n === t ? '✨ All done today. Nice!' : n + ' of ' + t + ' today'}</p>` : ''; }
/** The "I don't feel like it" 2-minute popup. */
function rescue() {
    const cat = S.cats.find(c => /reason|why/i.test(c.name) && c.items.length), pool = cat ? cat.items.map(x => x.text) : S.quotes.map(x => x.text), why = pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'Start small. Two minutes is enough to begin.';
    let left = 120, iv = null;
    pmodal(`<div class="cf-i d" style="font-size:24px">🔥</div><h3>Just 2 minutes</h3><p class="mu" style="margin-bottom:6px">${cat ? 'You told yourself this matters:' : 'Remember:'}</p><p class="rq">${esc(why)}</p><div class="resc-time" id="rt">2:00</div><div class="cf-a"><button class="ad-b" data-x="0">Not now</button><button class="ad-b pri" id="rgo">Start</button></div>`, (e, close, d) => { const b = e.target.closest('button'); if (!b)
        return; if (b.dataset.x === '0') {
        close();
        return;
    } if (b.id === 'rgo' && !iv) {
        b.textContent = 'Keep going…';
        b.disabled = true;
        iv = setInterval(() => { left--; const t = d.querySelector('#rt'); if (t)
            t.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (left <= 0) {
            clearInterval(iv);
            iv = null;
            S.bonus = (S.bonus || 0) + 10;
            save();
            close();
            celebrate('You showed up! +10 XP');
            render();
        } }, 1000);
    } }, () => { if (iv)
        clearInterval(iv); });
}
document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b)
        return;
    const a = b.dataset.a;
    if (a === 'cck') {
        const k = key(new Date());
        S.cl = S.cl || {};
        const m = (S.cl[k] = S.cl[k] || {}), was = !!m[b.dataset.id];
        if (was)
            delete m[b.dataset.id];
        else
            m[b.dataset.id] = 1;
        const c = S.cats.find(x => x.id === b.dataset.c);
        if (!was && c && c.items.length > 1 && c.items.every(x => m[x.id]))
            celebrate('All of ' + c.name + ' done! +' + c.items.length * 5 + ' XP');
    }
    else if (a === 'mq')
        MQ++;
    else if (a === 'rescue')
        rescue();
    else if (a === 'plnew') {
        if ((S.pls || []).length >= LIM.pls)
            notice('Playlist limit reached (' + LIM.pls + ').');
        else
            askName('New playlist', '', v => { S.pls = S.pls || []; const p = { id: uid(), name: v.slice(0, LIM.name), ids: [] }; S.pls.push(p); P.tab = 'pl_' + p.id; save(); render(); });
    }
    else if (a === 'pladd')
        plAdd(b.dataset.id);
    else if (a === 'plrm') {
        const p = (S.pls || []).find(x => 'pl_' + x.id === P.tab);
        if (p) {
            p.ids = p.ids.filter(i => i !== b.dataset.id);
            save();
        }
    }
    else if (a === 'plren') {
        const p = (S.pls || []).find(x => 'pl_' + x.id === P.tab);
        if (p)
            askName('Rename playlist', p.name, v => { p.name = v.slice(0, LIM.name); save(); render(); });
    }
    else if (a === 'pldel') {
        const p = (S.pls || []).find(x => 'pl_' + x.id === P.tab);
        if (p)
            pmodal(`<div class="cf-i d">!</div><h3>Delete “${esc(p.name)}”?</h3><p>The tracks stay in your library. Only the playlist is removed.</p><div class="cf-a"><button class="ad-b" data-x="0">Cancel</button><button class="ad-b dng-fill" data-x="1">Delete</button></div>`, (e2, close) => { const x = e2.target.closest('button'); if (!x)
                return; if (x.dataset.x === '1') {
                S.pls = S.pls.filter(y => y !== p);
                P.tab = 'all';
                save();
                render();
            } close(); });
    }
}, true);
/** The flame streak button in the top bar. */
function momPill() { const bar = document.getElementById('htbar'); if (!bar)
    return; let p = document.getElementById('hstreak'); if (!p) {
    p = document.createElement('button');
    p.id = 'hstreak';
    p.title = 'Your streak';
    p.onclick = () => { const b = [...document.querySelectorAll('.nv')].find(x => /focus/i.test(x.textContent)); if (b)
        b.click(); };
    bar.prepend(p);
} const m = momStats(); p.textContent = '🔥 ' + m.streak; p.classList.toggle('risk', m.risk && m.streak > 0); }
setInterval(momPill, 2500);
setTimeout(momPill, 1200);
