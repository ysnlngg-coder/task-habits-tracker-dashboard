/* ============================================================================
   js/app/03-screens.js
   WHAT IT DOES : Sidebar and the screens: Today, Habits, Focus, popup, right panel.
   EDIT HERE    : layout/markup of each screen, texts, the add-item popup.
   ============================================================================ */

/** Applies theme and accent colour to the page (CSS variables). */
const apply = () => { const r = document.documentElement; r.dataset.theme = S.theme; if (!S.rb)
    r.style.setProperty('--ac', S.accent); };
const vis = (h, k) => h.once ? h.once === k : h.days.includes((new Date(k + 'T00:00:00').getDay() + 6) % 7);
/** Habits/tasks scheduled for a given date. */
const items = k => S.habits.filter(h => vis(h, k)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
/** Status of one habit on one date: 0 not started, 1 in progress, 2 done. */
const st = (id, k) => (S.log[k] || {})[id] || 0, setSt = (id, k, v) => { (S.log[k] = S.log[k] || {})[id] = v; };
/** Streak counter used by the sidebar. */
function streak(h) { let n = 0, d = new Date(); for (let i = 0; i < 400; i++) {
    if (vis(h, key(d))) {
        if (st(h.id, key(d)) === 2)
            n++;
        else if (i > 0)
            break;
    }
    d.setDate(d.getDate() - 1);
} return n; }
const nav = [['today', '◷', 'Today'], ['habits', '☰', 'Habits'], ['music', '♪', 'Music'], ['focus', '✦', 'Focus and motivation']];
/** Left sidebar: navigation, quote, week bars. */
function side() {
    const q = S.quotes.length ? S.quotes[(Math.floor(Date.now() / 864e5) + qo) % S.quotes.length].text : '';
    return `<aside class="side"><div class="logo"><b>◆</b> Habit tracker</div><nav>${nav.map(n => `<button class="nv ${V === n[0] ? 'on' : ''}" data-a="view" data-v="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join('')}</nav><button class="qt" data-a="quote">${q ? '“' + esc(q) + '”' : ''}</button></aside>`;
}
/** The Today screen. */
function today() {
    const its = items(D), dn = its.filter(h => st(h.id, D) === 2).length, pc = its.length ? Math.round(dn / its.length * 100) : 0, td = key(new Date()), isT = D === td, dt = new Date(D + 'T00:00:00');
    const rows = its.map((h, i) => { const s = st(h.id, D), sk = h.once ? 0 : streak(h); return `<div class="row" style="--i:${i}"><button class="ck s${s}" data-a="tick" data-id="${h.id}" aria-label="Mark done"></button><span class="nm ${s === 2 ? 'dn' : ''}">${esc(h.name)}${sk > 1 ? ` <small>🔥${sk}</small>` : ''}</span><button class="pill p${PR[h.pri]}" data-a="pri" data-id="${h.id}">${h.pri}</button><button class="pill z${s}" data-a="cyc" data-id="${h.id}">${SL[s]}</button><span class="tm mu">${h.time || ''}</span>${h.once ? `<button class="x" data-a="del" data-l="habits" data-id="${h.id}" aria-label="Remove">✕</button>` : '<span></span>'}</div>`; }).join('') || '<p class="mu pad">Nothing scheduled for this day. Add a habit or task below.</p>';
    const tp = [...its].sort((a, b) => (st(a.id, D) === 2) - (st(b.id, D) === 2) || PR[a.pri] - PR[b.pri]).slice(0, 5), fl = S.fl[D] || {};
    return `<section class="hero"><div><div class="ttl"><span class="ic">▣</span><h1>${isT ? 'Today' : dt.toLocaleDateString('en-US', { weekday: 'long' })}</h1></div><p class="mu">${dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. ${esc(S.tagline)}</p></div><div class="prog"><b>${dn}/${its.length}</b> done<div class="bar"><i style="width:${LP}%" data-w="${pc}"></i></div>${isT ? '' : `<button class="lnk" data-a="pick" data-k="${td}">Back to today</button>`}</div></section>
<div class="card"><div class="row hd"><span></span><span>Task</span><span>Priority</span><span>Status</span><span class="tm">Time</span><span></span></div>${rows}</div>
<div class="cards"><div class="card"><h3><span>◎</span> Top priorities</h3>${tp.map((h, i) => `<div class="pl"><span class="num">${i + 1}</span><span class="${st(h.id, D) === 2 ? 'nm dn' : ''}">${esc(h.name)}</span></div>`).join('') || '<p class="mu">Add a habit to set priorities.</p>'}</div>
<div class="card"><h3><span>◎</span> Today's focus</h3>${S.focus.map(f => `<div class="fk"><button class="ck s${fl[f.id] ? 2 : 0}" data-a="fk" data-id="${f.id}" aria-label="Toggle"></button>${esc(f.text)}</div>`).join('') || '<p class="mu">Add focus items under Focus and motivation.</p>'}</div>
<div class="card">${cal()}</div></div>
<div class="card"><h3><span>⚡</span> Quick capture</h3><div class="cap"><button data-a="open" data-t="task">New task</button><button data-a="open" data-t="habit">New habit</button><button data-a="open" data-t="note">New note</button><button data-a="open" data-t="goal">New goal</button></div></div>`;
}
/** Month calendar widget. */
function cal() {
    const y = CM.getFullYear(), m = CM.getMonth(), f = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), td = key(new Date());
    let c = 'MTWTFSS'.split('').map(l => `<b class="mu">${l}</b>`).join('') + '<i></i>'.repeat(f);
    for (let d = 1; d <= n; d++) {
        const k = y + '-' + p2(m + 1) + '-' + p2(d), its = items(k), r = its.length ? its.filter(h => st(h.id, k) === 2).length / its.length : 0;
        c += `<button class="cd ${k === D ? 'sel' : ''} ${k === td ? 'td' : ''}" style="--r:${r}" data-a="pick" data-k="${k}">${d}</button>`;
    }
    return `<div class="cm"><b>${CM.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b><span><button class="x" data-a="cm" data-d="-1" aria-label="Previous month">‹</button><button class="x" data-a="cm" data-d="1" aria-label="Next month">›</button></span></div><div class="cal">${c}</div>`;
}
/** Page title block used by every screen. */
const head = (t, s) => `<section class="hero"><div><h1>${t}</h1><p class="mu">${s}</p></div></section>`;
/** The Habits screen. */
function habitsV() {
    const hs = S.habits.filter(h => !h.once);
    return head('Habits', 'Rename, reschedule, reprioritise or remove anything. Changes save instantly.') + `<div class="card">${hs.map((h, i) => `<div class="mr" style="--i:${i}"><input data-l="habits" data-id="${h.id}" data-k="name" value="${esc(h.name)}" aria-label="Habit name"><input type="time" data-l="habits" data-id="${h.id}" data-k="time" value="${h.time || ''}" aria-label="Time"><select data-l="habits" data-id="${h.id}" data-k="pri" aria-label="Priority">${PL.map(p => `<option ${p === h.pri ? 'selected' : ''}>${p}</option>`).join('')}</select><span>${'MTWTFSS'.split('').map((c, i) => `<button class="dy ${h.days.includes(i) ? 'on' : ''}" data-a="day" data-id="${h.id}" data-d="${i}">${c}</button>`).join(' ')}</span><button class="x ${armed === h.id ? 'arm' : ''}" data-a="del" data-l="habits" data-id="${h.id}">${armed === h.id ? 'Delete?' : '✕'}</button></div>`).join('') || '<p class="mu pad">No habits yet. Add your first one.</p>'}<button class="add" data-a="open" data-t="habit">+ Add habit</button></div>`;
}
/** One editable text row (used for notes, quotes, focus items). */
const ed = (l, x) => `<div class="mr"><input data-l="${l}" data-id="${x.id}" data-k="text" value="${esc(x.text)}"><button class="x" data-a="del" data-l="${l}" data-id="${x.id}" aria-label="Remove">✕</button></div>`;
/** One custom category card (Reasons, Rules, Rewards...). */
const catV = c => `<div class="card cat"><div class="chd"><input class="ct" data-l="cats" data-id="${c.id}" data-k="name" value="${esc(c.name)}" aria-label="Category name"><button class="x ${armed === c.id ? 'arm' : ''}" data-a="del" data-l="cats" data-id="${c.id}">${armed === c.id ? 'Delete?' : '✕'}</button></div>${catBar(c)}${c.items.map(x => `<div class="mr"><button class="ck s${((S.cl || {})[key(new Date())] || {})[x.id] ? 2 : 0}" data-a="cck" data-c="${c.id}" data-id="${x.id}" aria-label="Done today"></button><input data-l="ci" data-c="${c.id}" data-id="${x.id}" data-k="text" value="${esc(x.text)}"><button class="x" data-a="del" data-l="ci" data-c="${c.id}" data-id="${x.id}" aria-label="Remove">✕</button></div>`).join('')}<button class="add" data-a="open" data-t="citem" data-c="${c.id}">+ Add</button></div>`;
/** The Focus and motivation screen. */
function focusV() {
    const sec = (t, s, b, a) => `<div class="card"><h3>${t}</h3><p class="mu">${s}</p>${b}${a ? `<button class="add" data-a="open" data-t="${a}">+ Add</button>` : ''}</div>`;
    return head('Focus and motivation', 'Shape what keeps you moving.') + momentum() + `<div class="g2">` +
        sec('Tagline', 'Shown under the page title.', `<input class="w" data-l="_" data-k="tagline" value="${esc(S.tagline)}">`) +
        sec('Daily focus', 'A checklist on Today that resets each day.', S.focus.map(x => ed('focus', x)).join(''), 'focus') +
        sec('Motivation lines', 'Shown in the sidebar. Tap one to shuffle.', S.quotes.map(x => ed('quotes', x)).join(''), 'quote') +
        sec('Goals', 'Long-term targets to check off.', S.goals.map(g => `<div class="mr"><button class="ck s${g.done ? 2 : 0}" data-a="goal" data-id="${g.id}" aria-label="Toggle"></button><input data-l="goals" data-id="${g.id}" data-k="text" value="${esc(g.text)}"><button class="x" data-a="del" data-l="goals" data-id="${g.id}" aria-label="Remove">✕</button></div>`).join(''), 'goal') +
        S.cats.map(catV).join('') +
        sec('Notes', 'Notes from quick capture.', S.notes.map(x => ed('notes', x)).join(''), 'note') +
        sec('Appearance', 'Pick an accent colour and theme.', `<div class="sw">${['#e5252a', '#f97316', '#a855f7', '#22c55e', '#3b82f6'].map(c => `<button class="swb ${S.accent === c ? 'on' : ''}" style="background:${c}" data-a="accent" data-c="${c}" aria-label="Accent ${c}"></button>`).join('')}<input type="color" value="${S.accent}" data-l="_" data-k="accent" aria-label="Custom accent"></div><button class="g" data-a="theme">Switch to ${S.theme === 'dark' ? 'light' : 'dark'} theme</button>${bgfx()}`) + `<button class="add" data-a="open" data-t="cat">+ New category</button></div>`;
}
/** Titles and placeholders for the "add item" popup. */
const MT = { task: ['New task for this day', 'What needs doing?', 1], habit: ['New daily habit', 'Habit name', 1], note: ['New note', 'Write a note', 0], goal: ['New goal', 'Your goal', 0], focus: ['New focus item', 'For example: no phone before noon', 0], cat: ['New category', 'Name it, for example Reasons, Rules or Rewards', 0], citem: ['New item', 'Write it here', 0], quote: ['New motivation line', 'A line that keeps you going', 0] };
/** The "add item" popup. */
function modal() { const c = MT[M]; return `<div class="ov" data-a="close"><div class="md"><h3>${c[0]}</h3><input id="mt" placeholder="${c[1]}" maxlength="120">${c[2] ? `<div class="two"><input id="mtm" type="time"><select id="mpr">${PL.map(p => `<option ${p === 'Medium' ? 'selected' : ''}>${p}</option>`).join('')}</select></div>` : ''}<div class="btns"><button class="g" data-a="cancel">Cancel</button><button class="pr" data-a="save">Save</button></div></div></div>`; }
/** Saves what was typed in the popup (checks the limits first). */
function saveModal() {
    const tx = $('#mt').value.trim();
    if (!tx)
        return;
    if (capHit())
        return;
    const tm = $('#mtm') ? $('#mtm').value : '', pr = $('#mpr') ? $('#mpr').value : 'Medium', id = uid();
    if (M === 'task')
        S.habits.push({ id, name: tx, time: tm, pri: pr, days: [], once: D });
    else if (M === 'habit')
        S.habits.push({ id, name: tx, time: tm, pri: pr, days: [...ALL] });
    else if (M === 'note')
        S.notes.unshift({ id, text: tx });
    else if (M === 'goal')
        S.goals.push({ id, text: tx, done: false });
    else if (M === 'focus')
        S.focus.push({ id, text: tx });
    else if (M === 'cat')
        S.cats.push({ id, name: tx, items: [] });
    else if (M === 'citem')
        S.cats.find(c => c.id === MC).items.push({ id, text: tx });
    else
        S.quotes.push({ id, text: tx });
    FX = [[`[data-id="${id}"]`, 'new', '.row,.mr,.fk,.cat']];
    M = null;
    save();
    render();
}
/** Right panel: week, timer, upcoming. */
function rail() {
    const td = key(new Date()), dt = new Date(D + 'T00:00:00'), mon = new Date(dt);
    mon.setDate(dt.getDate() - (dt.getDay() + 6) % 7);
    let dn = 0, tot = 0, bars = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        const k = key(d), it = items(k), c = it.filter(h => st(h.id, k) === 2).length;
        dn += c;
        tot += it.length;
        bars += `<button class="wb ${k === D ? 'sel' : ''} ${k === td ? 'td' : ''}" data-a="pick" data-k="${k}" aria-label="${d.toLocaleDateString('en-US', { weekday: 'long' })}"><span class="tk"><i style="--r:${it.length ? c / it.length : 0};--n:${i}"></i></span><span>${'MTWTFSS'[i]}</span></button>`;
    }
    const pend = items(D).filter(h => st(h.id, D) !== 2), now = p2(new Date().getHours()) + ':' + p2(new Date().getMinutes()), nx = pend.find(h => (h.time || '') >= now) || pend[0], n = (S.sess || {})[td] || 0, m = fm(), l = tl(), T0 = m * 60;
    return `<aside class="rail ${EN ? 'in' : ''}"><div class="card tmr ${T.run ? 'run' : ''}"><h3><span>◎</span> Focus timer</h3><div class="ring"><svg viewBox="0 0 120 120"><circle class="rb" cx="60" cy="60" r="52"/><circle class="rf" id="rf" cx="60" cy="60" r="52" style="stroke-dashoffset:${327 * (1 - l / T0)}"/></svg><div class="rt" id="rt">${p2(Math.floor(l / 60))}:${p2(l % 60)}</div></div><div class="tsel"><input class="tsk" id="ttask" placeholder="What are you focusing on?" value="${esc(T.task)}" maxlength="80" aria-label="Timer task"><button class="x tdb" data-a="tdrop" aria-label="Show tasks">▾</button>${TD ? `<div class="tdl">${items(D).map(h => `<button data-a="tpick" data-id="${h.id}"><span>${esc(h.name)}</span><small>${h.time || ''}</small></button>`).join('') || '<p class="mu pad">No tasks for this day.</p>'}</div>` : ''}</div><div class="tb"><button class="pr" id="tgo" data-a="tgo">${T.run ? 'Pause' : l < T0 ? 'Resume' : 'Start'}</button><button class="g" data-a="trs">Reset</button></div><div class="pre">${[15, 25, 50].map(x => `<button class="pill ${x === m ? 'p0' : ''}" data-a="tpre" data-m="${x}">${x} min</button>`).join('')}<input id="fmin" type="number" min="1" max="180" value="${m}" aria-label="Custom minutes"></div><p class="mu c">${n} focus session${n === 1 ? '' : 's'} today</p></div>
<div class="card"><h3><span>♪</span> Music</h3>${mctl()}</div>
<div class="card"><h3><span>▥</span> This week</h3><div class="wk">${bars}</div><p class="mu">${tot ? Math.round(dn / tot * 100) : 0}% complete (${dn} of ${tot})</p></div>
<div class="card"><h3><span>➜</span> Up next</h3>${nx ? `<div class="nx"><b>${esc(nx.name)}</b><span class="mu">${nx.time || 'Any time'}</span><button class="g" data-a="now" data-id="${nx.id}">Start focusing on this</button></div>` : '<p class="mu">Everything for this day is done. Nicely done.</p>'}</div></aside>`;
}
