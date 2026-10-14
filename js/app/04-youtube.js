/* ============================================================================
   js/app/04-youtube.js
   WHAT IT DOES : YouTube links in the music player.
   EDIT HERE    : how YouTube tracks play or are added.
   ============================================================================ */

var YTP = null;
/** Plays a YouTube track in the small player (official embed). */
function ytPlay(t) {
    AU.pause();
    stopGen();
    let box = document.getElementById('ytbox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'ytbox';
        box.style.cssText = 'position:fixed;right:12px;bottom:56px;z-index:40;width:260px;max-width:60vw;aspect-ratio:16/9;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.5);border:1px solid var(--bd);background:#000;animation:zoom .25s';
        box.innerHTML = '<div id="ytp"></div>';
        document.body.appendChild(box);
    }
    box.style.display = '';
    const go = () => { if (YTP && YTP.loadVideoById) {
        YTP.loadVideoById(t.yt);
        YTP.setVolume(P.vol * 100);
    }
    else
        YTP = new YT.Player('ytp', { videoId: t.yt, width: '100%', height: '100%', playerVars: { autoplay: 1, playsinline: 1, ...(location.protocol.startsWith('http') ? { origin: location.origin } : {}) }, events: { onError: () => { P.play = false; mui(); }, onReady: e => { e.target.setVolume(P.vol * 100); e.target.playVideo(); }, onStateChange: e => { if (e.data === 0) {
                    P.play = false;
                    mui();
                } } } }); };
    if (window.YT && YT.Player)
        go();
    else {
        window.onYouTubeIframeAPIReady = go;
        if (!document.getElementById('ytapi')) {
            const sc = document.createElement('script');
            sc.id = 'ytapi';
            sc.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(sc);
        }
    }
}
document.addEventListener('click', async (e) => { if (!e.target.closest('#ytadd'))
    return; const pl = curPl(), i = $('#ytu'), m = (i.value.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1]; if (!m) {
    i.value = '';
    i.placeholder = 'Not a valid YouTube link';
    return;
} const ex = S.music.find(t => t.yt === m); if (ex) {
    if (pl && toPl(ex.id, pl)) {
        save();
        render();
    }
    else
        notice('That video is already in your library.');
    i.value = '';
    return;
} if (S.music.filter(t => t.yt).length >= LIM.yt) {
    notice('YouTube limit reached (' + LIM.yt + ' links).');
    return;
} let name = 'YouTube video'; try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + m));
    if (r.ok)
        name = (await r.json()).title || name;
}
catch (x) { } const nid = uid(); S.music.push({ id: nid, name: name.slice(0, 80), yt: m }); toPl(nid, pl); i.value = ''; save(); render(); });
