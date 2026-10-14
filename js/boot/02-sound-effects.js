/* ============================================================================
   js/boot/02-sound-effects.js
   WHAT IT DOES : Sound-effect engine: synthesised clicks, ticks, chimes. Which element plays which sound is decided in kind().
   EDIT HERE    : sound shapes (S), which elements trigger which sound (kind), hover sounds.
   ============================================================================ */

/** Sound effects engine. Use SFX.play("tap"). */
const SFX = (() => {
    let c = null, out = null;
    let cfg = Object.assign({ on: true, vol: .7, off: {} }, (() => { try {
        return JSON.parse(localStorage.getItem('ht_sfx_cfg')) || {};
    }
    catch (e) {
        return {};
    } })());
    if (!localStorage.getItem('ht_sfx_cfg') && localStorage.getItem('ht_sfx') === '0')
        cfg.on = false;
    const save = () => localStorage.setItem('ht_sfx_cfg', JSON.stringify(cfg));
    const ctx = () => { if (!c) {
        c = new (window.AudioContext || window.webkitAudioContext)();
        out = c.createGain();
        out.connect(c.destination);
    } out.gain.value = cfg.vol; return c; };
    const tone = (f, t0, d, type, g, f2) => { const a = ctx(), T = a.currentTime + t0, o = a.createOscillator(), v = a.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, T); if (f2)
        o.frequency.exponentialRampToValueAtTime(f2, T + d); v.gain.setValueAtTime(.0001, T); v.gain.exponentialRampToValueAtTime(g, T + .008); v.gain.exponentialRampToValueAtTime(.0001, T + d); o.connect(v); v.connect(out); o.start(T); o.stop(T + d + .03); };
    const S = { tap: () => tone(520, 0, .06, 'sine', .07, 380), tick: () => tone(900, 0, .035, 'triangle', .05), hover: () => tone(1250, 0, .03, 'sine', .035), nav: () => { tone(440, 0, .07, 'sine', .06, 520); tone(660, .045, .08, 'sine', .05); }, check: () => { tone(523, 0, .1, 'sine', .09); tone(784, .07, .16, 'sine', .09); }, success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .07, .18, 'sine', .08)), warn: () => tone(220, 0, .18, 'triangle', .12, 110), error: () => { tone(300, 0, .1, 'square', .045, 200); tone(240, .1, .14, 'square', .045, 150); }, open: () => tone(360, 0, .12, 'sine', .05, 600), toggle: () => tone(700, 0, .05, 'sine', .06, 900) };
    const kind = el => { if (el.closest(':disabled,[data-a^="sfx-"]'))
        return null; if (el.closest('[data-rm],.dng,.dng-fill,[data-st="blocked"]'))
        return 'warn'; if (el.closest('[data-st="approved"]'))
        return 'success'; if (el.closest('[data-a="tdrop"]'))
        return 'open'; if (el.closest('[data-a="tpick"]'))
        return 'toggle'; if (el.closest('.ck'))
        return 'check'; if (el.closest('.nv'))
        return 'nav'; if (el.closest('[data-f],.pill,.dy,.ad-c button,select'))
        return 'tick'; if (el.closest('input[type=checkbox],input[type=radio],.sw,.tg'))
        return 'toggle'; if (el.closest('button,[data-a],a'))
        return 'tap'; return null; };
    const api = { play: (n, force) => { if (!cfg.on || (!force && cfg.off[n]))
            return; try {
            const a = ctx();
            if (a.state === 'suspended')
                a.resume();
            (S[n] || S.tap)();
        }
        catch (e) { } }, get on() { return cfg.on; }, set(v) { cfg.on = v; save(); }, get cfg() { return cfg; }, isOn: n => !cfg.off[n], setType(n, v) { cfg.off[n] = !v; save(); }, setVol(v) { cfg.vol = v; if (out)
            out.gain.value = v; save(); } };
    document.addEventListener('pointerdown', e => { const k = kind(e.target); if (k)
        api.play(k); }, true);
    let lastH = null;
    document.addEventListener('pointerover', e => { if (e.pointerType === 'touch')
        return; const el = e.target.closest('.tdl button,.nv'); if (el && el !== lastH) {
        lastH = el;
        api.play('hover');
    }
    else if (!el)
        lastH = null; }, true);
    return api;
})();
window.SFX = SFX;
