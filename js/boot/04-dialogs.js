/* ============================================================================
   js/boot/04-dialogs.js
   WHAT IT DOES : Styled confirm dialog used by the admin panel (replaces the browser popup).
   EDIT HERE    : dialog texts and buttons.
   ============================================================================ */

/** dlg(title, text, okLabel, danger, singleButton) -> Promise<boolean> */
function dlg(title, text, okLabel, danger, single) {
    return new Promise(res => {
        SFX.play('open');
        const d = document.createElement('div');
        d.className = 'cf';
        d.innerHTML = `<div class="cf-c" role="dialog" aria-modal="true"><div class="cf-i${danger ? ' d' : ''}">${danger ? '!' : 'i'}</div><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="cf-a">${single ? '' : '<button class="ad-b" data-x="0">Cancel</button>'}<button class="ad-b ${danger ? 'dng-fill' : 'pri'}" data-x="1">${esc(okLabel)}</button></div></div>`;
        document.body.appendChild(d);
        const kd = e => { if (e.key === 'Escape')
            done(false); };
        const done = v => { d.classList.add('out'); document.removeEventListener('keydown', kd); setTimeout(() => { d.remove(); res(v); }, 180); };
        document.addEventListener('keydown', kd);
        d.onclick = e => { const t = e.target.closest('button'); if (t)
            done(t.dataset.x === '1');
        else if (e.target === d)
            done(false); };
        setTimeout(() => { const b = d.querySelector('[data-x="' + (single ? 1 : 0) + '"]'); if (b)
            b.focus(); }, 50);
    });
}
