/* ============================================================================
   js/boot/07-cloud-stats.js
   WHAT IT DOES : Sends activity numbers (streak, week bars) to your profile so the admin panel can show them.
   EDIT HERE    : which numbers are sent.
   ============================================================================ */

/** Pushes streak / week progress to the profile (numbers only, never habit names). */
async function pushStats() {
    try {
        const wk = [];
        let streak = 0, stop = false;
        for (let i = 0; i < 60; i++) {
            const d = key(new Date(Date.now() - i * 864e5)), it = items(d), n = it.length, k = it.filter(h => st(h.id, d) === 2).length;
            if (i < 7)
                wk.unshift(n ? Math.round(k / n * 100) : -1);
            if (!stop && n) {
                if (k === n)
                    streak++;
                else if (i > 0)
                    stop = true;
            }
        }
        await sb.rpc('update_my_stats', { p_habits: S.habits.length, p_streak: streak, p_week: wk });
    }
    catch (e) { }
}
