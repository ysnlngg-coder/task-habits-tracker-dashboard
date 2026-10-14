/* ============================================================================
   js/boot/01-supabase.js
   WHAT IT DOES : Reads config.js and creates the Supabase connection (sb). The login session is kept per browser tab.
   EDIT HERE    : nothing, unless you change how the session is stored. Your URL and key go in config.js.
   ============================================================================ */

const CONFIG = window.HT_CONFIG || {};
const isSet = v => typeof v === 'string' && v.trim() && !/PASTE/i.test(v);
const SUPABASE_URL = isSet(CONFIG.url) ? CONFIG.url : 'PASTE_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = isSet(CONFIG.key) ? CONFIG.key : 'PASTE_ANON_PUBLIC_KEY_HERE';
let startupError = null;
if (!window.supabase || typeof window.supabase.createClient !== 'function')
    startupError = 'Supabase client library did not load. Check your internet connection and reload.';
else if (!isSet(CONFIG.url) || !isSet(CONFIG.key))
    startupError = 'Supabase is not configured. Create config.js next to index.html and set window.HT_CONFIG to your project URL and anon/public key.';
if (startupError) window.__startupError = startupError;
/** Id of the signed-in user (set by startApp). */
let userId = null;
const store = { getItem: k => { const v = sessionStorage.getItem(k); return v !== null ? v : localStorage.getItem(k); }, setItem: (k, v) => { sessionStorage.setItem(k, v); localStorage.setItem(k, v); }, removeItem: k => { sessionStorage.removeItem(k); localStorage.removeItem(k); } };
let sb = null;
if (!startupError) sb = window.sb = supabase.createClient(new URL(SUPABASE_URL.trim()).origin, SUPABASE_ANON_KEY.trim(), { auth: { storage: store } });
