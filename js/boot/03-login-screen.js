/* ============================================================================
   js/boot/03-login-screen.js
   WHAT IT DOES : The login / sign-up overlay and its reusable form() builder (labels, show-password, strength bar, shake on error).
   EDIT HERE    : texts of the login screens (SUB), form layout. Colours are in css/extras.css.
   ============================================================================ */

const ov = document.createElement('div');
ov.className = 'au';
ov.style.cssText = 'position:fixed;inset:0;z-index:99;background:var(--bg);display:grid;place-items:center;padding:20px;font:14px/1.45 -apple-system,"Segoe UI",Roboto,sans-serif;color:var(--tx)';
document.body.appendChild(ov);
/** Subtitle shown under each screen title. */
const SUB = { 'Habit Tracker': 'Your private habit tracker.', 'Sign in': 'Welcome back. Enter your details to continue.', 'Create account': 'Request access to your own private tracker.', 'Set your password': 'Choose a new password for your account.', 'Waiting for approval': 'Your account is awaiting approval.', 'Access removed': 'This account no longer has access.' };
const fld = (f, i) => `<div class="au-f" style="animation-delay:${.12 + i * .07}s"><label for="${f[0]}">${f[2]}</label><div class="au-w"><input id="${f[0]}" type="${f[1]}" placeholder="${f[2]}" autocomplete="${f[3]}" spellcheck="false"${f[1] === 'password' ? ' class="pwf"' : ''}>${f[1] === 'password' ? '<button type="button" data-eye tabindex="-1">Show</button>' : ''}</div>${f[3] === 'new-password' ? '<div class="au-st"><i></i></div><small class="au-hint">Use 8+ characters with letters and numbers.</small>' : ''}</div>`;
/** Builds one login-style screen and resolves when the user submits. */
function form(title, fields, label, fn, extra) {
    return new Promise(ok => {
        window.__form = 1;
        ov.innerHTML = `<div class="au-card"><div class="au-brand"><span class="au-logo"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><b>Habit Tracker</b></div><h1>${title}</h1><p class="au-sub">${SUB[title] || ''}</p><div id="msg" class="au-msg"></div>${fields.map(fld).join('')}<button id="go" class="au-btn" style="animation-delay:${.15 + fields.length * .07}s"><span>${label}</span><i class="au-sp"></i></button>${extra || ''}<div class="au-foot">🔒 Private by design. Every account has its own tracker.</div></div>`;
        const card = ov.querySelector('.au-card'), go = ov.querySelector('#go');
        const msg = (t, info) => { const m = ov.querySelector('#msg'); m.textContent = t || ''; const inf = info || /^(Check your|No account)/i.test(t || ''); m.className = 'au-msg' + (t ? (inf ? ' info' : ' err') : ''); if (t && !inf)
            SFX.play('error'), card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 350 }); };
        const run = async () => { if (go.disabled)
            return; go.disabled = true; go.classList.add('busy'); const v = {}; fields.forEach(f => { const el = ov.querySelector('#' + f[0]); v[f[0]] = f[1] === 'password' ? el.value : el.value.trim(); }); let done; try {
            done = await fn(v, msg);
        }
        catch (e) {
            msg(String(e.message || e));
            done = false;
        } go.classList.remove('busy'); go.disabled = false; if (done)
            ok(done); };
        go.onclick = run;
        ov.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter')
            run(); });
        ov.querySelectorAll('[data-eye]').forEach(b => b.onclick = () => { const i = b.parentNode.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Show' : 'Hide'; });
        const np = ov.querySelector('input[autocomplete="new-password"]');
        if (np)
            np.oninput = () => { const p = np.value; const sc = (p.length >= 8) + (p.length >= 12) + (/[a-z]/i.test(p) && /\d/.test(p)) + (/[A-Z]/.test(p) && /[^\w\s]/.test(p)); const b = ov.querySelector('.au-st i'); b.style.width = sc * 25 + '%'; b.style.background = ['var(--ac)', '#f97316', '#eab308', '#84cc16', '#22c55e'][sc]; };
        const fp = ov.querySelector('#fp');
        if (fp)
            fp.onclick = async () => { const e1 = (ov.querySelector('#em') || {}).value || window.__e; if (!e1)
                return msg('Enter your email first'); const r = await sb.auth.resetPasswordForEmail(e1, { redirectTo: location.origin + location.pathname }); msg(r.error ? r.error.message : 'Check your email for the reset link'); };
        const su = ov.querySelector('#su');
        if (su)
            su.onclick = () => ok('su');
        const bk = ov.querySelector('#bk');
        if (bk)
            bk.onclick = () => ok('in');
        const s2 = ov.querySelector('#so2');
        if (s2)
            s2.onclick = async () => { await sb.auth.signOut(); location.reload(); };
        if (window.__pre) {
            const i = ov.querySelector('#em');
            if (i)
                i.value = window.__pre;
        }
        if (window.__note) {
            msg(window.__note, true);
            window.__note = '';
        }
        const f0 = ov.querySelector(window.__pre ? 'input[type=password],input[type=text]' : 'input:not(#hp)');
        if (f0)
            setTimeout(() => f0.focus(), 350);
    });
}
