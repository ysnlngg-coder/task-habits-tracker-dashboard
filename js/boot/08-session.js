/* ============================================================================
   js/boot/08-session.js
   WHAT IT DOES : The start-up flow: sign in / sign up, approval gate, load your data from the cloud, save it back (debounced), then load the app files.
   EDIT HERE    : the order of events at start-up, sign-in rules, how often data is saved.
   ============================================================================ */

/** Files of the app itself. They are loaded in this order after a successful login. */
const APP_FILES = [
    'js/app/01-core.js',
    'js/app/02-timer-effects.js',
    'js/app/03-screens.js',
    'js/app/04-youtube.js',
    'js/app/05-music-engine.js',
    'js/app/06-music-screen.js',
    'js/app/07-limits.js',
    'js/app/08-playlists.js',
    'js/app/09-motivation.js',
    'js/app/10-background-effects.js',
    'js/app/11-sound-settings.js',
    'js/app/12-main.js'
];
function loadScript(src) {
    return new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = ok;
        s.onerror = () => fail(new Error('Could not load ' + src));
        document.body.appendChild(s);
    });
}
async function loadAppScripts() {
    for (const f of APP_FILES)
        await loadScript(f);
}
function showStartupError(e) {
    const m = String((e && e.message) || e);
    document.body.insertAdjacentHTML('beforeend', '<pre style="position:fixed;inset:0;z-index:200;margin:0;padding:20px;background:#200;color:#fff;white-space:pre-wrap;font:14px monospace">Startup error: ' + m.replace(/</g, '&lt;') + (/URL/i.test(m) ? '\n\nPaste your Supabase URL and key in config.js (next to index.html).' : '') + '</pre>');
}
/** Start here: login -> approval check -> load your data -> show the app. */
async function startApp() {
    // 'ht_pw' is set right after a reset code is verified, so a refresh can't skip choosing the new password.
    const needPw = /type=(invite|recovery)/.test(location.hash) || sessionStorage.getItem('ht_pw');
    const askNewPw = () => form('Set your password', [['pw', 'password', 'New password (min 8)', 'new-password']], 'Save and continue', async (v, msg) => {
        if (v.pw.length < 8) {
            msg('At least 8 characters');
            return false;
        }
        const r = await sb.auth.updateUser({ password: v.pw });
        if (r.error) {
            msg(r.error.message);
            return false;
        }
        sessionStorage.removeItem('ht_pw');
        return true;
    });
    let { data: { session } } = await sb.auth.getSession();
    if (session && needPw) {
        await askNewPw();
        history.replaceState(null, '', location.pathname);
    }
    const lk = 'background:none;border:0;color:var(--mu);margin-top:14px;cursor:pointer;width:100%;font:inherit;font-size:13px;transition:color .2s';
    const hp = '<input id="hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0">';
    const LS = k => { try {
        return JSON.parse(localStorage.getItem(k));
    }
    catch (e) {
        return null;
    } };
    const lockLeft = () => { const f = LS('ht_f') || { n: 0, t: 0 }, w = f.n >= 3 ? Math.min(900, 5 * 2 ** (f.n - 3)) : 0; return Math.max(0, Math.ceil((f.t + w * 1000 - Date.now()) / 1000)); };
    const failed = () => { const f = LS('ht_f') || { n: 0 }; localStorage.setItem('ht_f', JSON.stringify({ n: f.n + 1, t: Date.now() })); };
    let mode = 'start', em = '';
    while (!session) {
        if (mode === 'start') {
            em = '';
            const r = await form('Habit Tracker', [], 'Sign in', async () => true, `<div class="au-or"><span>or</span></div><button id="su" class="au-btn2">Create account</button>`);
            mode = r === 'su' ? 'up' : 'em';
        }
        else if (mode === 'em') {
            const r = await form('Sign in', [['em', 'email', 'Email', 'username'], ['pw', 'password', 'Password', 'current-password']], 'Sign in', async (v, msg) => { if (!/^\S+@\S+\.\S+$/.test(v.em)) {
                msg('Enter a valid email');
                return false;
            } if (!v.pw) {
                msg('Enter your password');
                return false;
            } const w = lockLeft(); if (w) {
                msg('Too many attempts. Try again in ' + w + 's');
                return false;
            } const x = await sb.rpc('email_exists', { p_email: v.em }); if (x.error) {
                msg(/Too many/i.test(x.error.message) ? 'Too many attempts. Wait a minute.' : x.error.message);
                return false;
            } em = v.em; window.__e = em; if (!x.data) {
                mode = 'up';
                window.__note = 'No account with this email yet. Create one below.';
                return true;
            } const y = await sb.auth.signInWithPassword({ email: em, password: v.pw }); if (y.error) {
                failed();
                const l = lockLeft();
                msg(l ? 'Wrong password. Locked for ' + l + 's' : 'Wrong password');
                return false;
            } localStorage.removeItem('ht_f'); session = y.data.session; return true; }, `<button id="fp" style="${lk}">Forgot password?</button><button id="bk" style="${lk}">Back</button>`);
            if (r === 'in')
                mode = 'start';
            else if (r === 'fp') {
                em = window.__e;
                mode = 'code';
            }
        }
        else if (mode === 'nope') {
            const r = await form('No account found', [], 'Create an account', async () => true, `<p style="color:var(--mu)">${esc(em)} is not registered. Check the spelling, or create an account.</p><button id="bk" style="${lk}">Use another email</button>`);
            mode = r === 'in' ? 'em' : 'up';
        }
        else if (mode === 'pw') {
            const r = await form('Welcome back', [['pw', 'password', 'Password', 'current-password']], 'Sign in', async (v, msg) => { const w = lockLeft(); if (w) {
                msg('Too many attempts. Try again in ' + w + 's');
                return false;
            } const x = await sb.auth.signInWithPassword({ email: em, password: v.pw }); if (x.error) {
                failed();
                const l = lockLeft();
                msg(l ? 'Wrong password. Locked for ' + l + 's' : 'Wrong password');
                return false;
            } localStorage.removeItem('ht_f'); session = x.data.session; return true; }, `<button id="fp" style="${lk}">Forgot password?</button><button id="bk" style="${lk}">Not you? Use another email</button>`);
            if (r === 'in')
                mode = 'em';
            else if (r === 'fp') {
                em = window.__e;
                mode = 'code';
            }
        }
        else if (mode === 'code') {
            // Step 1 of "forgot password": the user types the code from our email. Step 2: choose a new password.
            SUB['Check your email'] = 'If ' + esc(em) + ' has an account, we sent a 6-digit code. It expires in 10 minutes.';
            const rs = `<button id="rs" style="${lk}" disabled>Resend code</button><button id="bk" style="${lk}">Back to sign in</button>`;
            const p = form('Check your email', [['cd', 'text', 'Verification code', 'one-time-code']], 'Verify code', async (v, msg) => {
                const c = v.cd.replace(/\D/g, '');
                if (c.length !== 6) {
                    msg('Enter the 6-digit code');
                    return false;
                }
                const w = lockLeft();
                if (w) {
                    msg('Too many attempts. Try again in ' + w + 's');
                    return false;
                }
                const x = await sb.auth.verifyOtp({ email: em, token: c, type: 'recovery' });
                if (x.error || !x.data.session) {
                    failed();
                    msg('That code is wrong or expired');
                    return false;
                }
                localStorage.removeItem('ht_f');
                sessionStorage.setItem('ht_pw', '1');
                return true;
            }, rs);
            // form() builds its HTML synchronously, so the buttons exist right now: wire the code box and "Resend".
            const ci = ov.querySelector('#cd'), rb = ov.querySelector('#rs'), note = ov.querySelector('#msg');
            ci.inputMode = 'numeric';
            ci.maxLength = 7;
            ci.placeholder = '• • • • • •';
            ci.oninput = () => { ci.value = ci.value.replace(/\D/g, '').slice(0, 6); if (ci.value.length === 6)
                ov.querySelector('#go').click(); };
            let until = Date.now() + 60000;
            const tick = setInterval(() => { const s = Math.ceil((until - Date.now()) / 1000); rb.disabled = s > 0; rb.textContent = s > 0 ? 'Resend code (' + s + 's)' : 'Resend code'; }, 500);
            rb.onclick = async () => {
                rb.disabled = true;
                until = Date.now() + 60000;
                const y = await sb.auth.resetPasswordForEmail(em);
                note.textContent = y.error ? 'Please wait a minute before asking for another code' : 'A new code is on its way';
                note.className = 'au-msg ' + (y.error ? 'err' : 'info');
            };
            const r = await p;
            clearInterval(tick);
            if (r === 'in')
                mode = 'em';
            else {
                await askNewPw();
                session = (await sb.auth.getSession()).data.session;
            }
        }
        else {
            const t0 = Date.now();
            window.__pre = em;
            const r = await form('Create account', [['nm', 'text', 'Your name', 'name'], ['em', 'email', 'Email', 'username'], ['pw', 'password', 'Password (min 8)', 'new-password']], 'Request access', async (v, msg) => { if (ov.querySelector('#hp').value) {
                msg('Check your email to confirm, then sign in');
                return false;
            } if (Date.now() - t0 < 2500) {
                msg('One moment, then try again');
                return false;
            } if (Date.now() - (+localStorage.getItem('ht_su') || 0) < 60000) {
                msg('Please wait a minute before trying again');
                return false;
            } if (v.pw.length < 8) {
                msg('Password: at least 8 characters');
                return false;
            } localStorage.setItem('ht_su', Date.now()); const x = await sb.auth.signUp({ email: v.em, password: v.pw, options: { data: { name: v.nm } } }); if (x.error) {
                msg(/Database error/i.test(x.error.message) ? 'Registrations are full right now. Try later.' : /already registered/i.test(x.error.message) ? 'This email already has an account. Go back and sign in.' : x.error.message);
                return false;
            } if (x.data.session) {
                session = x.data.session;
                return true;
            } msg('Check your email to confirm, then sign in'); return false; }, hp + `<button id="bk" style="${lk}">Back</button>`);
            window.__pre = '';
            if (r === 'in')
                mode = 'start';
        }
    }
    userId = window.__uid = session.user.id;
    const getMe = async () => { const r = await sb.from('profiles').select('role,status').eq('id', userId).maybeSingle(); return r.data; };
    let me = await getMe();
    while (!me || me.status !== 'approved') {
        const bl = me && me.status === 'blocked';
        await form(bl ? 'Access removed' : 'Waiting for approval', [], 'Check again', async (v, msg) => { me = await getMe(); if (me && me.status === 'approved')
            return true; msg(me && me.status === 'blocked' ? 'Access removed by the admin' : 'Not approved yet'); return false; }, `<p style="color:var(--mu)">${bl ? 'The admin removed your access.' : 'Your request was sent. The admin will approve it soon.'}</p><button id="so2" style="${lk}">Sign out</button>`);
    }
    if (window.__form)
        SFX.play('success');
    const row = await sb.from('tracker_state').select('data').eq('user_id', userId).maybeSingle();
    if (row.error) {
        ov.textContent = 'Could not load your data: ' + row.error.message;
        return;
    }
    let st = row.data && row.data.data;
    if (!(st && st.habits) && me.role === 'admin') {
        try {
            const old = JSON.parse(localStorage.getItem('ht2'));
            if (old && old.habits)
                st = old;
        }
        catch (e) { }
    }
    window.REMOTE = st || null;
    let _t = null, _d = null;
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:50;font:12px sans-serif;color:var(--mu);background:var(--sf);border:1px solid var(--bd);border-radius:20px;padding:4px 10px;display:flex;gap:8px;align-items:center';
    badge.innerHTML = '<span id="bs"></span><button id="so" style="background:none;border:0;color:var(--ac);cursor:pointer;padding:0">Sign out</button>';
    async function flush() { if (!_d)
        return; const d = _d; _d = null; clearTimeout(_t); try {
        const c1 = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10), c2 = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
        for (const k in (d.log || {}))
            if (k < c1)
                delete d.log[k];
        for (const k in (d.cl || {}))
            if (k < c2)
                delete d.cl[k];
        if (JSON.stringify(d).length > 480000) {
            badge.querySelector('#bs').textContent = '⚠ data too large';
            return;
        }
    }
    catch (e) { } const r = await sb.from('tracker_state').upsert({ user_id: userId, data: d, updated_at: new Date().toISOString() }); badge.querySelector('#bs').textContent = r.error ? '⚠ not saved' : ''; if (r.error && !_d)
        _d = d; if (!r.error)
        pushStats(); }
    window.__saveRemote = s => { _d = s; clearTimeout(_t); _t = setTimeout(flush, 700); };
    document.addEventListener('visibilitychange', () => { if (document.hidden)
        flush(); });
    addEventListener('pagehide', flush);
    badge.querySelector('#so').onclick = async () => { await flush(); await sb.auth.signOut(); location.reload(); };
    if (me.role === 'admin') {
        const ab = document.createElement('button');
        ab.textContent = 'Admin';
        ab.style.cssText = 'background:none;border:0;color:var(--tx);font-weight:600;cursor:pointer;padding:0';
        ab.onclick = openAdmin;
        badge.prepend(ab);
    }
    document.body.appendChild(badge);
    ov.remove();
    await loadAppScripts();
    setTimeout(pushStats, 800);
    mountTop();
    const beat = n => sb.rpc(n).then(() => { }, () => { });
    beat('touch_visit');
    setInterval(() => { if (!document.hidden)
        beat('heartbeat'); }, 12e4);
    document.addEventListener('visibilitychange', () => { if (!document.hidden)
        beat('heartbeat'); });
}
if (window.__startupError) showStartupError(window.__startupError);
else startApp().catch(showStartupError);
