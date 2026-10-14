/* ============================================================================
   js/app/07-limits.js
   WHAT IT DOES : LIMITS for playlists, files, storage and list sizes + upload handling.
   EDIT HERE    : change any number in LIM to change a limit.
   ============================================================================ */

/** ALL LIMITS live here (playlists, tracks, files, MB, items per list...). Change a number to change the limit. */
const LIM = { pls: 15, perPl: 60, files: 60, yt: 30, fileMB: 20, quotaMB: 150, batch: 5, name: 30, habits: 150, notes: 100, goals: 30, focus: 15, cats: 12, citem: 25, quotes: 40 };
/** Small warning toast. */
function notice(msg) { const t = document.createElement('div'); t.className = 'ht-toast'; t.style.zIndex = 140; t.innerHTML = `<div class="nw-av">!</div><div><b>${esc(msg)}</b></div>`; document.body.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 4200); }
const upl = () => S.music.filter(t => !t.yt), usedMB = () => upl().reduce((n, t) => n + (t.size || 0), 0) / 1048576;
const curPl = () => (S.pls || []).find(x => 'pl_' + x.id === P.tab);
function toPl(id, p) { if (!p)
    return false; if (p.ids.includes(id))
    return true; if (p.ids.length >= LIM.perPl) {
    notice('This playlist is full (' + LIM.perPl + ' tracks).');
    return false;
} p.ids.push(id); return true; }
/** Handles uploaded music files, checks limits, adds them to the open playlist. */
async function addFiles(files) {
    const pl = curPl();
    if (files.length > LIM.batch) {
        notice('Up to ' + LIM.batch + ' files at a time.');
        files = files.slice(0, LIM.batch);
    }
    let added = 0;
    for (const f of files) {
        if (upl().length >= LIM.files) {
            notice('Library limit reached (' + LIM.files + ' files).');
            break;
        }
        if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|wav|ogg|aac|flac|opus)$/i.test(f.name)) {
            notice(f.name + ' is not an audio file.');
            continue;
        }
        if (f.size > LIM.fileMB * 1048576) {
            notice(f.name + ' is larger than ' + LIM.fileMB + ' MB.');
            continue;
        }
        if (usedMB() + f.size / 1048576 > LIM.quotaMB) {
            notice('Storage limit reached (' + LIM.quotaMB + ' MB).');
            break;
        }
        const id = uid();
        BL[id] = f;
        const ok = await mdb('put', f, id);
        if (!ok) {
            delete BL[id];
            notice('Upload failed: ' + f.name);
            continue;
        }
        S.music.push({ id, name: f.name.replace(/\.[^.]+$/, '').slice(0, 80), size: f.size });
        toPl(id, pl);
        added++;
    }
    const ks = Object.keys(BL);
    while (ks.length > 5)
        delete BL[ks.shift()];
    if (added) {
        save();
        render();
    }
}
/** Checks item limits before saving the popup. */
function capHit() {
    const m = { task: ['habits', S.habits.length], habit: ['habits', S.habits.length], note: ['notes', S.notes.length], goal: ['goals', S.goals.length], focus: ['focus', S.focus.length], cat: ['cats', S.cats.length], quote: ['quotes', S.quotes.length] }[M];
    let k, n;
    if (m) {
        k = m[0];
        n = m[1];
    }
    else if (M === 'citem') {
        k = 'citem';
        const c = S.cats.find(c => c.id === MC);
        n = c ? c.items.length : 0;
    }
    else
        return false;
    if (n >= LIM[k]) {
        notice('Limit reached: up to ' + LIM[k] + ' ' + ({ habits: 'habits and tasks', notes: 'notes', goals: 'goals', focus: 'focus items', cats: 'categories', citem: 'items per category', quotes: 'motivation lines' })[k] + '.');
        return true;
    }
    return false;
}
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.l && t.value.length > 300)
    t.value = t.value.slice(0, 300); }, true);
