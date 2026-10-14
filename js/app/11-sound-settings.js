/* ============================================================================
   js/app/11-sound-settings.js
   WHAT IT DOES : Settings card for sound effects (on/off per type, volume).
   EDIT HERE    : which sound types exist and how they are listed.
   ============================================================================ */

/** List of sound-effect types shown in Music settings. */
const SFXT = [['hover', 'Hovering over lists', 'Dropdown items and the sidebar'], ['tap', 'Buttons', 'Soft click'], ['tick', 'Filters and tabs', 'Light tick'], ['nav', 'Page navigation', 'Two-note slide'], ['check', 'Completing a habit', 'Happy two-note'], ['toggle', 'Choosing an item', 'Switches and picks'], ['open', 'Opening menus and dialogs', 'Rising tone'], ['success', 'Success', 'Approve and sign in'], ['warn', 'Warnings', 'Block and remove'], ['error', 'Errors', 'Wrong password']];
/** Sound-effects settings card. */
const sfxPanel = () => { const A = window.SFX; if (!A)
    return ''; return `<div class="card" style="margin-top:14px"><h3><span>♫</span> Sound effects</h3><p class="mu">Short sounds made in your browser. Turn off any type you don't want.</p><div class="mr"><span class="nm" style="flex:1 1 160px">All sounds</span><button class="pill ${A.on ? 'p0' : ''}" data-a="sfx-all">${A.on ? 'On' : 'Off'}</button></div><div class="mr"><span class="nm" style="flex:0 0 70px">Volume</span><input type="range" id="sfxv" min="0" max="100" value="${Math.round(A.cfg.vol * 100)}" style="flex:1 1 160px"></div>${SFXT.map(t => `<div class="mr" style="${A.on ? '' : 'opacity:.45'}"><span class="nm" style="flex:1 1 160px">${t[1]} <small>${t[2]}</small></span><button class="x" data-a="sfx-pv" data-t="${t[0]}" aria-label="Preview">▶</button><button class="pill ${A.isOn(t[0]) ? 'p0' : ''}" data-a="sfx-t" data-t="${t[0]}">${A.isOn(t[0]) ? 'On' : 'Off'}</button></div>`).join('')}</div>`; };
document.addEventListener('click', e => { const b = e.target.closest('[data-a^="sfx-"]'); if (!b || !window.SFX)
    return; const A = window.SFX, a = b.dataset.a; if (a === 'sfx-all') {
    A.set(!A.on);
    render();
}
else if (a === 'sfx-t') {
    A.setType(b.dataset.t, !A.isOn(b.dataset.t));
    render();
}
else if (a === 'sfx-pv')
    A.play(b.dataset.t, true); });
document.addEventListener('input', e => { if (e.target.id === 'sfxv' && window.SFX)
    window.SFX.setVol(e.target.value / 100); });
document.addEventListener('change', e => { if (e.target.id === 'sfxv' && window.SFX)
    window.SFX.play('tap', true); });
