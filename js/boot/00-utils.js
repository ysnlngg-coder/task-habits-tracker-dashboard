/* ============================================================================
   js/boot/00-utils.js
   WHAT IT DOES : Tiny shared helper: esc() makes text safe to put inside HTML.
   EDIT HERE    : almost never.
   ============================================================================ */

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
