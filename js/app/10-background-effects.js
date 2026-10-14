/* ============================================================================
   js/app/10-background-effects.js
   WHAT IT DOES : Rainbow background and the music-reactive glow.
   EDIT HERE    : speed formulas, colours, reaction strength.
   ============================================================================ */

/** State of the rainbow / music-reactive background. */
const BG = { h: 0, t: 0, lt: 0, on: false, fx: false, bass: 0, treb: 0, ph: 0, rc: null, src: null, an: null, arr: null, an2: null, arr2: null, tapped: null };
/** Settings controls for the background effects. */
const bgfx = () => `<div class="bgfx"><div class="mr"><span class="nm" style="flex:1 1 150px">Rainbow colours <small>cycles the accent and the glow</small></span><button class="pill ${S.rb ? 'p0' : ''}" data-a="rb">${S.rb ? 'On' : 'Off'}</button></div><div class="mr"><span class="nm" style="flex:0 0 110px">Change speed</span><input type="range" min="1" max="100" value="${S.rbs || 30}" data-bg="rbs" style="flex:1 1 140px"></div><div class="mr"><span class="nm" style="flex:1 1 150px">React to music <small>the glow pulses with the sound</small></span><button class="pill ${S.react ? 'p0' : ''}" data-a="react">${S.react ? 'On' : 'Off'}</button></div><div class="mr"><span class="nm" style="flex:0 0 110px">Strength</span><input type="range" min="1" max="100" value="${S.reacts || 60}" data-bg="reacts" style="flex:1 1 140px"></div><p class="mu">Your own tracks and the built-in sounds drive the glow. YouTube videos can't be analysed, so they get a gentle simulated pulse.</p></div>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-a="rb"],[data-a="react"]'); if (!b)
    return; const k = b.dataset.a === 'rb' ? 'rb' : 'react'; S[k] = !S[k]; save(); setTimeout(render, 0); }, true);
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.bg; if (k) {
    S[k] = +e.target.value;
    save();
} });
const lvl = (a, i, j) => { let s = 0; for (let n = i; n < j; n++)
    s += a[n]; return s / (j - i) / 255; };
/** Reads the audio level of the current sound. */
function bgTap() {
    try {
        if (window.YTP && YTP.getPlayerState && YTP.getPlayerState() === 1)
            return { sim: 1 };
        if (!AU.paused && !AU.ended) {
            if (!BG.src) {
                BG.rc = new (window.AudioContext || window.webkitAudioContext)();
                BG.src = BG.rc.createMediaElementSource(AU);
                BG.an = BG.rc.createAnalyser();
                BG.an.fftSize = 256;
                BG.arr = new Uint8Array(BG.an.frequencyBinCount);
                BG.src.connect(BG.an);
                BG.an.connect(BG.rc.destination);
            }
            if (BG.rc.state === 'suspended')
                BG.rc.resume();
            BG.an.getByteFrequencyData(BG.arr);
            return { arr: BG.arr };
        }
        if (GN && GN.g && P.play && AC) {
            if (!BG.an2 || BG.an2.context !== AC) {
                BG.an2 = AC.createAnalyser();
                BG.an2.fftSize = 256;
                BG.arr2 = new Uint8Array(BG.an2.frequencyBinCount);
                BG.tapped = null;
            }
            if (BG.tapped !== GN) {
                GN.g.connect(BG.an2);
                BG.tapped = GN;
            }
            BG.an2.getByteFrequencyData(BG.arr2);
            return { arr: BG.arr2 };
        }
    }
    catch (e) { }
    return null;
}
/** Animation loop: rainbow colours and music pulse. */
function bgFrame(ts) {
    requestAnimationFrame(bgFrame);
    if (document.hidden) {
        BG.t = 0;
        return;
    }
    if (BG.rc && BG.rc.state === 'suspended' && !AU.paused)
        BG.rc.resume();
    if (!S.react && ts - BG.lt < 40)
        return;
    BG.lt = ts;
    const dt = BG.t ? Math.min(.1, (ts - BG.t) / 1000) : 0;
    BG.t = ts;
    const R = document.documentElement.style;
    let bass = 0, treb = 0;
    if (S.react) {
        const x = bgTap(), sens = .6 + (S.reacts || 60) / 50;
        if (x && x.arr) {
            bass = Math.min(1, Math.pow(lvl(x.arr, 0, 4) * sens, 1.4));
            treb = Math.min(1, Math.pow(lvl(x.arr, 10, 60) * sens * 1.6, 1.2));
        }
        else if (x && x.sim) {
            BG.ph += dt;
            const b = Math.max(0, Math.sin(BG.ph * 10.5));
            bass = (.25 + .45 * b * b) * Math.min(1, sens / 1.2);
            treb = .2 + .15 * Math.abs(Math.sin(BG.ph * 23));
        }
    }
    BG.bass += (bass - BG.bass) * (bass > BG.bass ? .5 : .12);
    BG.treb += (treb - BG.treb) * (treb > BG.treb ? .5 : .12);
    if (S.rb) {
        BG.h = (BG.h + dt * (3 + (S.rbs || 30) * 1.2)) % 360;
        BG.on = true;
        R.setProperty('--ac', 'hsl(' + BG.h.toFixed(1) + ' 78% 56%)');
        R.setProperty('--ac2', 'hsl(' + ((BG.h + 50) % 360).toFixed(1) + ' 78% 56%)');
    }
    else if (BG.on) {
        BG.on = false;
        apply();
        R.removeProperty('--ac2');
    }
    if (S.react && (BG.bass > .005 || BG.treb > .005)) {
        BG.fx = true;
        R.setProperty('--gp', (14 + BG.bass * 34).toFixed(1) + '%');
        R.setProperty('--bx', (BG.bass * 260).toFixed(0) + 'px');
        R.setProperty('--gp2', (BG.treb * 30).toFixed(1) + '%');
    }
    else if (BG.fx) {
        BG.fx = false;
        R.removeProperty('--gp');
        R.removeProperty('--bx');
        R.removeProperty('--gp2');
    }
}
requestAnimationFrame(bgFrame);
