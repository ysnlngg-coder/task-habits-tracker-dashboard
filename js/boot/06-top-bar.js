/* ============================================================================
   js/boot/06-top-bar.js
   WHAT IT DOES : Top-right buttons: news bell, AI assistant, and the panels they open.
   EDIT HERE    : assistant texts and suggestion chips (rAI), news display (rNews). The AI itself lives in the Edge Function.
   ============================================================================ */

const ICON = { bell: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>', ai: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>' };
/** Short summary of today that is sent to the AI. */
function aiContext() { try {
    const d = key(new Date()), it = items(d), dn = it.filter(h => st(h.id, d) === 2).length;
    return 'Today: ' + d + '. Scheduled today (' + dn + '/' + it.length + ' done): ' + it.map(h => h.name + (h.time ? ' @' + h.time : '') + (st(h.id, d) === 2 ? ' [done]' : '')).join('; ') + '. All habits: ' + S.habits.map(h => h.name + (h.time ? ' @' + h.time : '')).join('; ').slice(0, 900) + '. Goals: ' + (S.goals || []).map(g => g.text + (g.done ? ' [done]' : '')).join('; ').slice(0, 300) + '. Daily focus: ' + (S.focus || []).map(x => x.text).join('; ').slice(0, 300);
}
catch (e) {
    return '';
} }
/** Creates the top bar and both panels. */
function mountTop() {
    if (document.getElementById('htbar'))
        return;
    const bar = document.createElement('div');
    bar.id = 'htbar';
    bar.innerHTML = `<button class="ht-i" id="hn" aria-label="News" title="News">${ICON.bell}<b id="hnb" hidden></b></button><button class="ht-i ai" id="ha" aria-label="Assistant" title="Assistant">${ICON.ai}</button>`;
    const pan = document.createElement('div');
    pan.id = 'htp';
    pan.hidden = true;
    document.body.append(bar, pan);
    let cur = null, NEWS = [], seen = new Date(0), seenBefore = new Date(0), lastUn = null, AI = [], busy = false, left = null;
    const ago = t => { const m = (Date.now() - new Date(t)) / 6e4; return m < 2 ? 'just now' : m < 60 ? Math.round(m) + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
    const authorName = x => (x.author || 'Admin').trim() || 'Admin', authorInitial = x => Array.from(authorName(x))[0].toUpperCase();
    const fmt = t => esc(t).replace(/^[-*] /gm, '• ').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    const setBadge = n => { const b = bar.querySelector('#hnb'), i = bar.querySelector('#hn'); b.hidden = !n; b.textContent = n > 9 ? '9+' : n; i.classList.toggle('ring-b', !!n); };
    const rNews = () => { pan.innerHTML = `<div class="hp-h"><b>News</b><button class="hp-x" data-x aria-label="Close">✕</button></div><div class="hp-b">${NEWS.length ? NEWS.map(x => { const nw = new Date(x.created_at) > seenBefore, author = authorName(x); return `<div class="nw-i${nw ? ' new' : ''}"><div class="nw-av">${esc(authorInitial(x))}</div><div class="nw-c"><div class="nw-t"><b>${esc(author)}</b><span class="nw-p">Admin</span><span class="hp-s">${ago(x.created_at)}</span>${nw ? '<i class="nw-d"></i>' : ''}</div><div class="nw-ti">${esc(x.title)}</div><div class="nw-bd">${fmt(x.body)}</div>${x.image_url && /^https?:\/\//i.test(x.image_url) ? `<img src="${esc(x.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div></div>`; }).join('') : '<p class="hp-e">No news yet.</p>'}</div>`; };
    const rAI = () => { pan.innerHTML = `<div class="hp-h"><b>${ICON.ai} Assistant</b><span class="hp-s" style="margin-left:auto">${left == null ? '' : left + ' left today'}</span><button class="hp-x" data-x aria-label="Close">✕</button></div><div class="hp-b" id="aim">${AI.length ? AI.map(m => `<div class="ai-b ${m.r}${m.e ? ' e' : ''}">${fmt(m.t)}</div>`).join('') : `<div class="ai-w"><div class="ai-hi">How can I help today?</div><div class="hp-s">I can see today's habits and help you plan, prioritise or stay consistent.</div><div class="ai-ch">${['Plan my day', 'Review my week', 'Suggest a new habit', 'I need motivation'].map(c => `<button data-q="${c}">${c}</button>`).join('')}</div></div>`}${busy ? '<div class="ai-b a"><span class="ai-dots"><i></i><i></i><i></i></span></div>' : ''}</div><div class="ai-in"><textarea id="aiq" rows="2" maxlength="400" placeholder="Ask about your habits or planning…"></textarea><button id="ais" aria-label="Send">↑</button></div><div class="hp-f">Your habit names are sent to the AI service only when you send a message.</div>`; const m = pan.querySelector('#aim'); m.scrollTop = m.scrollHeight; };
    async function ask(t) {
        t = (t || '').trim();
        if (!t || busy)
            return;
        AI.push({ r: 'u', t });
        if (AI.length > 40)
            AI = AI.slice(-40);
        busy = true;
        rAI();
        const msgs = AI.filter(m => !m.e).slice(-8).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t }));
        const r = await sb.functions.invoke('ai-assistant', { body: { messages: msgs, context: aiContext() } });
        busy = false;
        if (r.error) {
            const c = r.error.context;
            let em = 'The assistant is not available right now (' + (r.error.name || 'error') + (c && c.status ? ' ' + c.status : '') + ').';
            if ((c && c.status === 404) || r.error.name === 'FunctionsFetchError')
                em = 'Cannot reach the assistant. The function "ai-assistant" is probably not deployed yet.';
            else
                try {
                    const j = await c.json();
                    if (j && (j.error || j.message))
                        em = j.error || ('(' + c.status + ') ' + j.message);
                }
                catch (x) { }
            AI.push({ r: 'a', t: em, e: 1 });
        }
        else {
            AI.push({ r: 'a', t: (r.data && r.data.reply) || '…' });
            if (r.data && r.data.left != null)
                left = r.data.left;
            SFX.play('open');
        }
        if (cur === 'ai')
            rAI();
    }
    const close = () => { cur = null; pan.hidden = true; };
    const open = k => {
        if (cur === k) {
            close();
            return;
        }
        cur = k;
        pan.hidden = false;
        pan.className = 'hp ' + k;
        pan.style.animation = 'none';
        void pan.offsetWidth;
        pan.style.animation = '';
        if (k === 'news') {
            seenBefore = seen;
            rNews();
            if (NEWS.length) {
                seen = new Date();
                setBadge(0);
                sb.rpc('news_mark_seen').then(() => { }, () => { });
            }
        }
        else {
            rAI();
            if (left == null)
                sb.rpc('ai_left', { p_limit: 20 }).then(r => { if (!r.error && r.data != null) {
                    left = r.data;
                    const q = pan.querySelector('#aiq');
                    if (cur === 'ai' && !(q && q.value))
                        rAI();
                } }, () => { });
            setTimeout(() => { const q = pan.querySelector('#aiq'); if (q)
                q.focus(); }, 250);
        }
    };
    bar.querySelector('#hn').onclick = () => open('news');
    bar.querySelector('#ha').onclick = () => open('ai');
    pan.onclick = e => { const b = e.target.closest('button'); if (!b)
        return; if (b.dataset.x !== undefined)
        close();
    else if (b.dataset.q)
        ask(b.dataset.q);
    else if (b.id === 'ais') {
        const q = pan.querySelector('#aiq'), v = q.value;
        q.value = '';
        ask(v);
    } };
    pan.onkeydown = e => { if (e.target.id === 'aiq' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const v = e.target.value;
        e.target.value = '';
        ask(v);
    } };
    document.addEventListener('click', e => { if (cur && !e.target.closest('#htp,#htbar,.cf'))
        close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur)
        close(); });
    const toast = x => { const t = document.createElement('div'); t.className = 'ht-toast'; t.innerHTML = `<div class="nw-av">${esc(authorInitial(x))}</div><div><b>${esc(authorName(x))}</b> posted<div class="nw-ti">${esc(x.title)}</div></div>`; t.onclick = () => { t.remove(); open('news'); }; document.body.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 7000); };
    async function loadNews() {
        const [n, p] = await Promise.all([sb.from('news').select('*').order('created_at', { ascending: false }).limit(20), sb.from('profiles').select('news_seen_at').eq('id', userId).maybeSingle()]);
        if (n.error || p.error) {
            bar.querySelector('#hn').style.display = 'none';
            return;
        }
        NEWS = n.data || [];
        if (p.data && p.data.news_seen_at && cur !== 'news')
            seen = new Date(p.data.news_seen_at);
        if (cur === 'news') {
            rNews();
            seen = new Date();
            sb.rpc('news_mark_seen').then(() => { }, () => { });
            return;
        }
        const un = NEWS.filter(x => new Date(x.created_at) > seen).length;
        setBadge(un);
        if (lastUn !== null && un > lastUn) {
            toast(NEWS[0]);
            SFX.play('check');
        }
        lastUn = un;
    }
    loadNews();
    setInterval(loadNews, 6e4);
    document.addEventListener('visibilitychange', () => { if (!document.hidden)
        loadNews(); });
}
