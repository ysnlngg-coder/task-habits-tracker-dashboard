/* ============================================================================
   js/app/05-music-engine.js
   WHAT IT DOES : Music engine: built-in sounds, audio element, play/pause/next, upload to storage.
   EDIT HERE    : how music plays; built-in sound recipes (GEN).
   ============================================================================ */

/** Built-in generated sounds. */
const GEN = [{ id: 'g-brown', name: 'Brown noise', gen: 'brown' }, { id: 'g-rain', name: 'Soft rain', gen: 'rain' }, { id: 'g-pad', name: 'Calm pad', gen: 'pad' }];
/** The audio element that plays uploaded files. */
const AU = new Audio(), BL = {};
let P = { id: null, play: false, vol: S.vol ?? .7, shuf: false, rep: false, tab: 'all' }, AC = null, GN = null;
AU.volume = P.vol;
/** Uploads / downloads / deletes a track in Supabase Storage. */
const mdb = async (m, a, b) => { try {
    const p = window.__uid + '/' + (m === 'put' ? b : a), bk = window.sb.storage.from('music');
    if (m === 'get') {
        const r = await bk.download(p);
        return r.error ? null : r.data;
    }
    if (m === 'put') {
        const r = await bk.upload(p, a, { upsert: true, contentType: /^audio\//.test(a.type) ? a.type : 'audio/mpeg' });
        return r.error ? null : true;
    }
    if (m === 'delete') {
        await bk.remove([p]);
        return true;
    }
}
catch (e) {
    return null;
} };
const lib = () => [...GEN, ...S.music], cur = () => lib().find(t => t.id === P.id), mlist = () => lib().filter(t => P.tab === 'all' || (P.tab === 'fav' ? S.favs[t.id] : plHas(P.tab, t.id)));
/** Starts a built-in generated sound. */
function startGen(k) {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    AC.resume();
    const g = AC.createGain(), n = [];
    g.gain.value = P.vol * .6;
    g.connect(AC.destination);
    if (k === 'pad') {
        [220, 277.18, 329.63, 440].forEach((f, i) => { const o = AC.createOscillator(), a = AC.createGain(), l = AC.createOscillator(), d = AC.createGain(); o.frequency.value = f; a.gain.value = .12; l.frequency.value = .07 + i * .03; d.gain.value = .08; l.connect(d); d.connect(a.gain); o.connect(a); a.connect(g); o.start(); l.start(); n.push(o, l); });
    }
    else {
        const L = AC.sampleRate * 4, b = AC.createBuffer(1, L, AC.sampleRate), c = b.getChannelData(0);
        let z = 0;
        for (let i = 0; i < L; i++) {
            const w = Math.random() * 2 - 1;
            if (k === 'brown') {
                z = (z + .02 * w) / 1.02;
                c[i] = z * 3.5;
            }
            else
                c[i] = w * .5;
        }
        const r = AC.createBufferSource();
        r.buffer = b;
        r.loop = true;
        let o = r;
        if (k === 'rain') {
            o = AC.createBiquadFilter();
            o.type = 'bandpass';
            o.frequency.value = 3200;
            o.Q.value = .4;
            r.connect(o);
        }
        o.connect(g);
        r.start();
        n.push(r);
    }
    GN = { g, n };
}
/** Stops it. */
function stopGen() { if (GN) {
    GN.n.forEach(x => { try {
        x.stop();
    }
    catch (e) { } });
    GN.g.disconnect();
    GN = null;
} }
function mstop() { AU.pause(); stopGen(); P.play = false; try {
    window.YTP && YTP.pauseVideo && YTP.pauseVideo();
}
catch (e) { } const yb = document.getElementById('ytbox'); if (yb)
    yb.style.display = 'none'; }
/** Plays a track by id. */
async function mplay(id) {
    mstop();
    const t = lib().find(x => x.id === id);
    if (!t)
        return;
    P.id = id;
    if (t.yt) {
        ytPlay(t);
        P.play = true;
        mui();
        return;
    }
    if (t.gen)
        startGen(t.gen);
    else {
        const b = BL[id] || await mdb('get', id);
        if (P.id !== id)
            return;
        if (!b) {
            P.id = null;
            mui();
            return;
        }
        if (AU.src.startsWith('blob:'))
            URL.revokeObjectURL(AU.src);
        AU.src = URL.createObjectURL(b);
        try {
            await AU.play();
        }
        catch (e) {
            P.id = null;
            mui();
            return;
        }
    }
    P.play = true;
    mui();
}
/** Play / pause. */
function mtog() {
    const t = cur();
    if (!t) {
        const L = mlist();
        if (L.length)
            mplay(L[0].id);
        return;
    }
    if (t.yt) {
        try {
            if (P.play) {
                YTP.pauseVideo();
                P.play = false;
            }
            else {
                YTP.playVideo();
                P.play = true;
            }
        }
        catch (e) { }
    }
    else if (t.gen) {
        if (P.play) {
            stopGen();
            P.play = false;
        }
        else {
            startGen(t.gen);
            P.play = true;
        }
    }
    else if (AU.paused) {
        AU.play();
        P.play = true;
    }
    else {
        AU.pause();
        P.play = false;
    }
    mui();
}
/** Next / previous track. */
function mstep(d) { const L = mlist(); if (!L.length)
    return; let i = L.findIndex(t => t.id === P.id); i = P.shuf ? Math.floor(Math.random() * L.length) : (i + d + L.length) % L.length; mplay(L[i].id); }
/** Removes a track. */
function mrm(id) { if (P.id === id) {
    mstop();
    P.id = null;
} mdb('delete', id); delete BL[id]; }
/** Refreshes the player controls. */
function mui() {
    const t = cur(), k = AU.duration && t && !t.gen ? AU.currentTime / AU.duration * 1000 : 0;
    document.querySelectorAll('.mtl').forEach(e => e.textContent = t ? t.name : 'Nothing playing');
    document.querySelectorAll('.mpb').forEach(e => e.textContent = P.play ? '❚❚' : '▶');
    document.querySelectorAll('.msk').forEach(e => e.value = k);
    document.querySelectorAll('.mrow').forEach(e => { const on = e.dataset.id === P.id; e.classList.toggle('on', on); e.querySelector('.pb').textContent = on && P.play ? '❚❚' : '▶'; });
}
AU.ontimeupdate = () => { if (AU.duration)
    document.querySelectorAll('.msk').forEach(e => e.value = AU.currentTime / AU.duration * 1000); };
AU.onended = () => { P.rep ? mplay(P.id) : mstep(1); };
document.addEventListener('input', e => {
    const t = e.target;
    if (t.classList.contains('msk')) {
        const c = cur();
        if (AU.duration && c && !c.gen)
            AU.currentTime = t.value / 1000 * AU.duration;
    }
    else if (t.classList.contains('mvol')) {
        P.vol = t.value / 100;
        AU.volume = P.vol;
        if (GN)
            GN.g.gain.value = P.vol * .6;
        try {
            window.YTP && YTP.setVolume && YTP.setVolume(P.vol * 100);
        }
        catch (e) { }
        document.querySelectorAll('.mvol').forEach(x => x.value = t.value);
        S.vol = P.vol;
        save();
    }
});
document.addEventListener('change', async (e) => { if (e.target.id === 'mfile') {
    const fl = [...e.target.files];
    e.target.value = '';
    await addFiles(fl);
} });
/** Player controls markup. */
const mctl = () => { const t = cur(); return `<div class="mp"><b class="mtl">${t ? esc(t.name) : 'Nothing playing'}</b><div class="tb"><button class="g" data-a="mprev" aria-label="Previous">⏮</button><button class="pr mpb" data-a="mtog" aria-label="Play or pause">${P.play ? '❚❚' : '▶'}</button><button class="g" data-a="mnext" aria-label="Next">⏭</button></div><input type="range" class="msk" min="0" max="1000" value="0" aria-label="Seek"><label class="vl">Volume<input type="range" class="mvol" min="0" max="100" value="${Math.round(P.vol * 100)}"></label></div>`; };
