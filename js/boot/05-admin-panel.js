/* ============================================================================
   js/boot/05-admin-panel.js
   WHAT IT DOES : Admin panel: people list, filters, activity, approve / block / remove, and the news composer.
   EDIT HERE    : columns and filters of the people list, what the admin sees, news posting.
   ============================================================================ */

/** Opens the full-screen admin panel (admins only). */
async function openAdmin() {
    const p = document.createElement('div');
    p.className = 'ad fi';
    setTimeout(() => p.classList.remove('fi'), 1200);
    document.body.appendChild(p);
    document.body.classList.add('lock');
    let fl = 'all', q = '', so = 'recent', L = [];
    const age = t => t ? Date.now() - new Date(t) : 1e15, ago = t => { if (!t)
        return 'never'; const m = age(t) / 6e4; return m < 2 ? 'just now' : m < 60 ? Math.round(m) + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
    const dt = t => t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—', sv = x => x.stats || {};
    const stt = x => x.status === 'blocked' ? ['blocked', 'Blocked'] : x.status === 'pending' ? ['wait', 'Waiting'] : age(x.last_seen) < 3e5 ? ['on', 'Online now'] : age(x.last_seen) < 864e5 ? ['day', 'Active today'] : age(x.last_seen) < 6048e5 ? ['wk', 'This week'] : ['off', x.last_seen ? 'Inactive ' + Math.round(age(x.last_seen) / 864e5) + ' d' : 'Never visited'];
    const b = (a, id, v, t, c, nm) => `<button class="ad-b ${c || ''}" data-${a}="${v}" data-id="${id}" data-nm="${esc(nm || '')}">${t}</button>`;
    const match = x => { const k = stt(x)[0]; return fl === 'all' || (fl === 'on' && k === 'on') || (fl === 'day' && (k === 'on' || k === 'day')) || (fl === 'off' && x.status === 'approved' && (k === 'off')) || (fl === 'wait' && x.status === 'pending') || (fl === 'blocked' && x.status === 'blocked'); };
    const rowOf = (x, i) => {
        const s = sv(x), w = s.week || [], self = x.id === userId, [k, lab] = stt(x), bars = w.map(n => `<i style="display:inline-block;width:6px;margin-right:2px;height:${n < 0 ? 3 : Math.max(3, n * .2)}px;background:${n < 0 ? 'var(--bd)' : 'var(--ac)'};border-radius:2px;vertical-align:bottom"></i>`).join('');
        const act = self ? '<span class="ad-s">You</span>' : (x.status === 'approved' ? b('st', x.id, 'blocked', 'Block') : x.status === 'pending' ? b('st', x.id, 'approved', 'Approve', 'pri') + b('st', x.id, 'blocked', 'Reject') : b('st', x.id, 'approved', 'Unblock')) + b('rm', x.id, x.id, 'Remove', 'dng', x.name || x.email);
        return `<div class="ad-r" style="animation-delay:${Math.min(i, 12) * 35}ms"><div class="ad-av ${k}">${esc((x.name || x.email || '?')[0]).toUpperCase()}<u></u></div><div><div><b>${esc(x.name)}</b> <span class="ad-pill ${k}">${lab}</span>${x.role === 'admin' ? ' <span class="ad-pill">admin</span>' : ''}</div><div class="ad-s">${esc(x.email)}</div><div class="ad-s">Last visit ${ago(x.last_seen)} · ${dt(x.last_seen)}</div><div class="ad-s">Joined ${new Date(x.created_at).toLocaleDateString()} · ${x.visits || 0} visits · last login ${ago(x.last_login)}</div><div class="ad-s">${bars} &nbsp;${s.streak ? '🔥 ' + s.streak + 'd · ' : ''}${s.habits || 0} habits</div></div><div class="ad-a">${act}</div></div>`;
    };
    const drawTop = () => {
        const ap = L.filter(x => x.status === 'approved'), on = ap.filter(x => age(x.last_seen) < 3e5), dy = ap.filter(x => age(x.last_seen) < 864e5), off = ap.filter(x => age(x.last_seen) >= 6048e5), pe = L.filter(x => x.status === 'pending');
        const rates = ap.map(x => (sv(x).week || []).filter(n => n >= 0)).filter(a => a.length).map(a => a.reduce((c, d) => c + d, 0) / a.length), avg = rates.length ? Math.round(rates.reduce((c, d) => c + d, 0) / rates.length) : 0;
        const tl = (n, t, i) => `<div class="ad-tile" style="animation-delay:${i * 50}ms"><b>${n}</b><span>${t}</span></div>`;
        p.querySelector('#ad-t').innerHTML = tl(ap.length, 'members', 0) + tl(on.length, 'online now', 1) + tl(dy.length, 'active today', 2) + tl(off.length, 'inactive 7d+', 3) + tl(pe.length, 'waiting', 4) + tl(avg + '%', 'avg. completion', 5);
        const rc = L.filter(x => x.last_seen).sort((a, c) => age(a.last_seen) - age(c.last_seen)).slice(0, 8);
        p.querySelector('#ad-rc').innerHTML = rc.map(x => `<div><b style="color:var(--tx)">${esc(x.name)}</b> · ${ago(x.last_seen)}</div>`).join('');
        const C = [['all', 'All', L.length], ['on', 'Online', on.length], ['day', 'Active today', dy.length], ['off', 'Inactive', off.length], ['wait', 'Waiting', pe.length], ['blocked', 'Blocked', L.filter(x => x.status === 'blocked').length]];
        p.querySelector('#ad-c').innerHTML = C.map(c => `<button data-f="${c[0]}" class="${fl === c[0] ? 'on' : ''}">${c[1]} ${c[2]}</button>`).join('');
    };
    const drawList = () => {
        const o = { recent: (a, c) => age(a.last_seen) - age(c.last_seen), joined: (a, c) => new Date(c.created_at) - new Date(a.created_at), name: (a, c) => String(a.name).localeCompare(String(c.name)), streak: (a, c) => (sv(c).streak || 0) - (sv(a).streak || 0), visits: (a, c) => (c.visits || 0) - (a.visits || 0) }[so];
        const a = L.filter(x => match(x) && (!q || (String(x.name) + ' ' + x.email).toLowerCase().includes(q))).sort((x, y) => (x.status === 'pending' ? 0 : 1) - (y.status === 'pending' ? 0 : 1) || o(x, y));
        p.querySelector('#ad-l').innerHTML = a.length ? a.map(rowOf).join('') : '<div class="ad-s" style="padding:24px;text-align:center">No one matches this filter.</div>';
    };
    async function load() { const r = await sb.from('profiles').select('*').limit(500); if (r.error) {
        p.querySelector('#ad-l').textContent = r.error.message;
        return;
    } L = r.data; drawTop(); drawList(); }
    p.innerHTML = `<div class="ad-w"><div class="ad-h"><h2>People</h2><span><button id="nw" class="ad-b">News</button><button id="rf" class="ad-b">Refresh</button><button id="ax" class="ad-b">Close</button></span></div><div id="ad-nw" class="ad-news" hidden></div><div id="ad-t" class="ad-t"></div><div id="ad-rc" class="ad-rc"></div><div class="ad-tb"><input id="adq" placeholder="Search name or email"><select id="ads"><option value="recent">Sort: last visit</option><option value="joined">Sort: newest</option><option value="name">Sort: name</option><option value="streak">Sort: streak</option><option value="visits">Sort: visits</option></select></div><div id="ad-c" class="ad-c"></div><div id="ad-l"></div><div class="ad-s" style="margin-top:10px">You see activity numbers only, never anyone's habits or notes. Updates every 30 seconds.</div></div>`;
    const nbox = p.querySelector('#ad-nw');
    async function drawNL() { const r = await sb.from('news').select('*').order('created_at', { ascending: false }).limit(30); p.querySelector('#nl').innerHTML = (r.data || []).map(x => `<div class="ad-nr"><div><b>${esc(x.title)}</b> <span class="ad-s">${ago(x.created_at)}</span></div><button class="ad-b dng" data-nd="${x.id}" data-nm="${esc(x.title)}">Delete</button></div>`).join('') || '<div class="ad-s">No posts yet.</div>'; }
    function openNews() { if (!nbox.hidden) {
        nbox.hidden = true;
        return;
    } if (!nbox.innerHTML)
        nbox.innerHTML = `<h3>Post news <small>sent as your admin account</small></h3><input id="nt" placeholder="Title" maxlength="80"><textarea id="nb" rows="4" maxlength="1000" placeholder="What's new? Everyone sees this under the bell."></textarea><input id="ni" placeholder="Image link (optional, https://...)"><div class="ad-nf"><span id="nmsg" class="ad-s"></span><button id="np" class="ad-b pri">Publish</button></div><div id="nl"></div>`; nbox.hidden = false; drawNL(); }
    async function publish(btn) { const t = p.querySelector('#nt').value.trim(), b = p.querySelector('#nb').value.trim(), i = p.querySelector('#ni').value.trim(), m = p.querySelector('#nmsg'); if (!t || !b) {
        m.textContent = 'Title and message are required.';
        return;
    } if (i && !/^https:\/\//i.test(i)) {
        m.textContent = 'Image link must start with https://';
        return;
    } btn.classList.add('busy'); const profile = await sb.from('profiles').select('name').eq('id', userId).maybeSingle(); if (profile.error || !profile.data || !profile.data.name || !profile.data.name.trim()) {
        btn.classList.remove('busy');
        m.textContent = profile.error ? profile.error.message : 'Your profile name is missing. Ask an admin to update it.';
        return;
    } const author = profile.data.name.trim(), r = await sb.from('news').insert({ title: t, body: b, image_url: i || null, author }); btn.classList.remove('busy'); if (r.error) {
        m.textContent = r.error.message;
        return;
    } p.querySelector('#nt').value = p.querySelector('#nb').value = p.querySelector('#ni').value = ''; m.textContent = 'Published as ' + author + ' ✓'; SFX.play('success'); drawNL(); }
    const iv = setInterval(load, 3e4);
    async function removeUser(id, name) { if (!await dlg('Remove ' + name + '?', 'This permanently deletes their account, tracker data and music. This cannot be undone.', 'Remove', true))
        return; try {
        const l = await sb.storage.from('music').list(id, { limit: 1000 });
        if (l.data && l.data.length)
            await sb.storage.from('music').remove(l.data.map(f => id + '/' + f.name));
    }
    catch (e) { } const r = await sb.rpc('admin_remove_user', { p_id: id }); if (r.error)
        await dlg('Could not remove', r.error.message, 'OK', false, true); }
    p.onclick = async (e) => { const t = e.target.closest('button'); if (!t)
        return; if (t.id === 'ax') {
        clearInterval(iv);
        p.remove();
        document.body.classList.remove('lock');
    }
    else if (t.id === 'rf')
        load();
    else if (t.id === 'nw')
        openNews();
    else if (t.id === 'np')
        publish(t);
    else if (t.dataset.nd) {
        if (await dlg('Delete this post?', t.dataset.nm, 'Delete', true)) {
            await sb.from('news').delete().eq('id', t.dataset.nd);
            drawNL();
        }
    }
    else if (t.dataset.f) {
        fl = t.dataset.f;
        drawTop();
        drawList();
    }
    else if (t.dataset.rm) {
        t.classList.add('busy');
        t.disabled = true;
        await removeUser(t.dataset.rm, t.dataset.nm);
        load();
    }
    else if (t.dataset.st) {
        t.classList.add('busy');
        t.disabled = true;
        await sb.from('profiles').update({ status: t.dataset.st }).eq('id', t.dataset.id);
        load();
    } };
    p.oninput = e => { if (e.target.id === 'adq') {
        q = e.target.value.toLowerCase();
        drawList();
    } };
    p.onchange = e => { if (e.target.id === 'ads') {
        so = e.target.value;
        drawList();
    } };
    load();
}
