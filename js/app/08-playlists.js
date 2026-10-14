/* ============================================================================
   js/app/08-playlists.js
   WHAT IT DOES : Playlists: tabs, create / rename / delete, add tracks.
   EDIT HERE    : playlist behaviour and popups.
   ============================================================================ */

/** Is a track inside a playlist? */
const plHas = (tab, id) => { const p = (S.pls || []).find(x => 'pl_' + x.id === tab); return !!p && p.ids.includes(id); };
/** Playlist buttons in the Music tabs. */
const plTabs = () => (S.pls || []).map(p => `<button class="pill ${P.tab === 'pl_' + p.id ? 'p0' : ''}" data-a="mtab" data-t="pl_${p.id}">${esc(p.name)}</button>`).join('') + `<button class="pill" data-a="plnew">＋ Playlist</button>`;
/** Rename / delete buttons for the open playlist. */
const plManage = () => { const p = (S.pls || []).find(x => 'pl_' + x.id === P.tab); return p ? `<div class="plm"><span class="mu">${p.ids.length} track${p.ids.length === 1 ? '' : 's'}</span><button class="pill" data-a="plren">Rename</button><button class="pill" data-a="pldel">Delete playlist</button></div>` : ''; };
const plEmpty = () => P.tab === 'fav' ? '<p class="mu pad">No favourites yet. Tap the heart on any track.</p>' : P.tab.startsWith('pl_') ? '<p class="mu pad">This playlist is empty. Open All and tap ＋ on a track to add it.</p>' : '<p class="mu pad">No tracks yet.</p>';
/** Small reusable popup. */
function pmodal(html, onclick, onclose) { const d = document.createElement('div'); d.className = 'cf'; d.innerHTML = `<div class="cf-c">${html}</div>`; document.body.appendChild(d); const close = () => { if (onclose)
    onclose(); d.classList.add('out'); setTimeout(() => d.remove(), 180); }; d.onclick = e => { if (e.target === d)
    close();
else
    onclick(e, close, d); }; return { close, d }; }
/** Popup asking for a playlist name. */
function askName(title, def, ok) { const m = pmodal(`<h3>${esc(title)}</h3><p><input id="pln" maxlength="30" placeholder="Playlist name" value="${esc(def || '')}" style="width:100%;box-sizing:border-box"></p><div class="cf-a"><button class="ad-b" data-x="0">Cancel</button><button class="ad-b pri" data-x="1">Save</button></div>`, (e, close, d) => { const b = e.target.closest('button'); if (!b)
    return; if (b.dataset.x === '1') {
    const v = d.querySelector('#pln').value.trim();
    if (v) {
        ok(v);
        close();
    }
}
else
    close(); }); setTimeout(() => { const i = m.d.querySelector('#pln'); i.focus(); i.select(); i.onkeydown = e => { if (e.key === 'Enter')
    m.d.querySelector('[data-x="1"]').click(); }; }, 60); }
/** Popup to add a track to playlists. */
function plAdd(tid) {
    S.pls = S.pls || [];
    let m;
    const draw = () => { m.d.querySelector('.cf-c').innerHTML = `<h3>Add to playlist</h3><div class="pll">${S.pls.map(p => `<button class="plopt ${p.ids.includes(tid) ? 'on' : ''}" data-p="${p.id}"><span>${esc(p.name)}</span><b>${p.ids.includes(tid) ? '✓' : ''}</b></button>`).join('') || '<p class="mu">No playlists yet. Create your first one.</p>'}</div><div class="cf-a"><button class="ad-b pri" data-new="1">＋ New playlist</button><button class="ad-b" data-x="0">Done</button></div>`; };
    m = pmodal('', (e, close) => { const b = e.target.closest('button'); if (!b)
        return; if (b.dataset.p) {
        const p = S.pls.find(x => x.id === b.dataset.p);
        if (p.ids.includes(tid))
            p.ids = p.ids.filter(i => i !== tid);
        else
            toPl(tid, p);
        save();
        draw();
        render();
    }
    else if (b.dataset.new) {
        if (S.pls.length >= LIM.pls)
            notice('Playlist limit reached (' + LIM.pls + ').');
        else
            askName('New playlist', '', v => { const p = { id: uid(), name: v.slice(0, LIM.name), ids: [tid] }; S.pls.push(p); save(); draw(); render(); });
    }
    else
        close(); });
    draw();
}
