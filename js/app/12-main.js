/* ============================================================================
   js/app/12-main.js
   WHAT IT DOES : Redraw, click handling, typing handling and the first render. Keep this last.
   EDIT HERE    : what each button (data-a) does.
   ============================================================================ */

/** Redraws the whole screen from the current state. */
function render() { apply(); $('#app').innerHTML = side() + `<main class="main ${EN ? 'in' : ''}">${V === 'today' ? today() : V === 'habits' ? habitsV() : V === 'music' ? musicV() : focusV()}</main>` + rail(); $('#modal').innerHTML = M ? modal() : ''; if (M)
    setTimeout(() => $('#mt') && $('#mt').focus(), 0); fx(); EN = false; mui(); }
/** Handles every button click (data-a="..." attributes). */
function act(a, d, t, e) {
    const h = () => S.habits.find(x => x.id === d.id), was = all(), pf = (s, c, u) => FX.push([s, c, u]);
    if (a === 'close' && e.target !== t)
        return;
    if (a === 'view') {
        V = d.v;
        EN = true;
    }
    else if (a === 'tick') {
        const n = st(d.id, D) === 2 ? 0 : 2;
        setSt(d.id, D, n);
        const q = `[data-a="tick"][data-id="${d.id}"]`;
        pf(q, 'pop');
        if (n === 2)
            pf(q, 'flash', '.row');
        pf('.prog b', 'bump');
    }
    else if (a === 'cyc') {
        setSt(d.id, D, (st(d.id, D) + 1) % 3);
        pf(`[data-a="cyc"][data-id="${d.id}"]`, 'pop');
        pf('.prog b', 'bump');
    }
    else if (a === 'pri') {
        const o = h();
        o.pri = PL[(PR[o.pri] + 1) % 3];
        pf(`[data-a="pri"][data-id="${d.id}"]`, 'pop');
    }
    else if (a === 'pick') {
        D = d.k;
        CM = new Date(d.k + 'T00:00:00');
        CM.setDate(1);
        pf('.cd.sel', 'pop');
        pf('.hero', 'fadeq');
        pf('.card', 'fadeq');
    }
    else if (a === 'cm') {
        CM.setMonth(CM.getMonth() + +d.d);
        pf('.cal', +d.d > 0 ? 'slr' : 'sll');
    }
    else if (a === 'fk') {
        const f = S.fl[D] = S.fl[D] || {};
        f[d.id] = f[d.id] ? 0 : 1;
        pf(`[data-a="fk"][data-id="${d.id}"]`, 'pop');
    }
    else if (a === 'day') {
        const o = h(), i = +d.d;
        o.days = o.days.includes(i) ? o.days.filter(x => x !== i) : [...o.days, i];
        pf(`.dy[data-id="${d.id}"][data-d="${d.d}"]`, 'pop');
    }
    else if (a === 'del') {
        if ((d.l === 'cats' || d.l === 'habits' && !h().once) && armed !== d.id) {
            armed = d.id;
            render();
            return;
        }
        const go = () => { if (d.l === 'ci') {
            const c = S.cats.find(c => c.id === d.c);
            c.items = c.items.filter(x => x.id !== d.id);
        }
        else
            S[d.l] = S[d.l].filter(x => x.id !== d.id); armed = null; if (d.l === 'music')
            mrm(d.id); save(); render(); }, el = t.closest('.row,.mr,.cat');
        if (el && !RM) {
            el.classList.add('out');
            setTimeout(go, 220);
        }
        else
            go();
        return;
    }
    else if (a === 'goal') {
        const g = S.goals.find(x => x.id === d.id);
        g.done = !g.done;
        if (g.done)
            celebrate('Goal reached! +50 XP');
        pf(`[data-a="goal"][data-id="${d.id}"]`, 'pop');
    }
    else if (a === 'open') {
        M = d.t;
        MC = d.c;
    }
    else if (a === 'close' || a === 'cancel')
        M = null;
    else if (a === 'save') {
        saveModal();
        return;
    }
    else if (a === 'quote') {
        qo++;
        pf('.qt', 'fadeq');
    }
    else if (a === 'tdrop') {
        TD = !TD;
    }
    else if (a === 'tpick') {
        const o = h();
        T.task = o ? o.name : '';
        TD = false;
    }
    else if (a === 'mpl') {
        if (P.id === d.id)
            mtog();
        else
            mplay(d.id);
        return;
    }
    else if (a === 'mtog') {
        mtog();
        return;
    }
    else if (a === 'mprev') {
        mstep(-1);
        return;
    }
    else if (a === 'mnext') {
        mstep(1);
        return;
    }
    else if (a === 'mfav') {
        S.favs[d.id] = !S.favs[d.id];
    }
    else if (a === 'mtab') {
        P.tab = d.t;
    }
    else if (a === 'mshuf') {
        P.shuf = !P.shuf;
    }
    else if (a === 'mrep') {
        P.rep = !P.rep;
    }
    else if (a === 'tgo') {
        if (T.run) {
            T.left = tl();
            T.run = false;
        }
        else {
            if (T.left <= 0)
                T.left = fm() * 60;
            T.end = Date.now() + T.left * 1000;
            T.run = true;
        }
        tdraw();
        return;
    }
    else if (a === 'trs') {
        T.run = false;
        T.left = fm() * 60;
        render();
        return;
    }
    else if (a === 'tpre') {
        S.fmin = +d.m;
        T.run = false;
        T.left = fm() * 60;
    }
    else if (a === 'now') {
        const o = h();
        if (D === key(new Date()) && st(d.id, D) === 0)
            setSt(d.id, D, 1);
        T.task = o.name;
        T.left = fm() * 60;
        T.end = Date.now() + T.left * 1000;
        T.run = true;
    }
    else if (a === 'accent') {
        tt();
        S.accent = d.c;
        apply();
        save();
        document.querySelectorAll('.swb').forEach(b => b.classList.toggle('on', b.dataset.c === S.accent));
        const ci = $('input[type=color]');
        if (ci)
            ci.value = S.accent;
        return;
    }
    else if (a === 'theme') {
        tt();
        S.theme = S.theme === 'dark' ? 'light' : 'dark';
        apply();
        save();
        t.textContent = 'Switch to ' + (S.theme === 'dark' ? 'light' : 'dark') + ' theme';
        return;
    }
    if (!was && all() && (a === 'tick' || a === 'cyc'))
        pf('.bar', 'burst');
    save();
    render();
}
/** Handles typing in editable fields. */
function upd(t) { const d = t.dataset, o = d.l === '_' ? S : d.l === 'ci' ? S.cats.find(c => c.id === d.c).items.find(x => x.id === d.id) : S[d.l].find(x => x.id === d.id); if (o) {
    o[d.k] = t.value;
    save();
    apply();
} }
document.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (t)
    act(t.dataset.a, t.dataset, t, e); });
document.addEventListener('input', e => { const t = e.target; if (t.dataset.l && t.type !== 'time' && t.tagName !== 'SELECT')
    upd(t); });
document.addEventListener('change', e => { const t = e.target; if (t.dataset.l && (t.type === 'time' || t.tagName === 'SELECT')) {
    upd(t);
    render();
} });
document.addEventListener('input', e => { if (e.target.id === 'ttask')
    T.task = e.target.value; });
document.addEventListener('change', e => { if (e.target.id === 'fmin') {
    S.fmin = Math.min(180, Math.max(1, Math.round(+e.target.value) || 25));
    T.run = false;
    T.left = fm() * 60;
    save();
    render();
} });
document.addEventListener('click', e => { if (TD && !e.target.closest('.tsel')) {
    TD = false;
    render();
} });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'mt')
    saveModal(); if (e.key === 'Escape' && M) {
    M = null;
    render();
} });
render();
