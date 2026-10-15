/* ============================================================================
   js/app/01-core.js
   WHAT IT DOES : Helpers, default data, load/save and the global state (S = everything you own).
   EDIT HERE    : default habits/quotes (DEF), helper functions, state variables.
   ============================================================================ */

const p2 = n => String(n).padStart(2, '0'), key = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
/** Short random id for new items. */
const uid = () => Math.random().toString(36).slice(2, 8), $ = s => document.querySelector(s);
const ALL = [0, 1, 2, 3, 4, 5, 6], PL = ['High', 'Medium', 'Low'], PR = { High: 0, Medium: 1, Low: 2 }, SL = ['Not Started', 'In Progress', 'Done'];
/** SAMPLE data (the original owner's routine). No longer given to new accounts. Kept only as a template you can copy from. */
const DEF = () => ({
    tagline: 'Stop planning in your head. Put it in the system.', accent: '#e5252a', theme: 'dark',
    habits: [{ id: 'h1', name: 'Shoulder drills (10 min)', time: '07:15', pri: 'Medium', days: ALL }, { id: 'h2', name: 'Skin care: wash + moisturise', time: '07:25', pri: 'Low', days: ALL }, { id: 'h3', name: 'Drink 2L of water', time: '09:00', pri: 'Low', days: ALL }, { id: 'h4', name: 'Voice: read aloud 10 min', time: '12:30', pri: 'Medium', days: [0] }, { id: 'h5', name: 'English shadowing 15 min', time: '12:30', pri: 'Medium', days: [1] }, { id: 'h6', name: 'Gym 2: chest, back, shoulders', time: '12:30', pri: 'High', days: [5] }, { id: 'h7', name: 'Handstand: main session', time: '14:30', pri: 'High', days: [4] }, { id: 'h8', name: 'Gym 1: back, shoulders, legs', time: '16:30', pri: 'High', days: [2] }, { id: 'h9', name: 'Study (2h)', time: '16:00', pri: 'High', days: [4, 5] }, { id: 'h10', name: 'Study (1.5h)', time: '18:00', pri: 'High', days: [3] }, { id: 'h11', name: 'Handstand: wrist prep + wall hold', time: '18:30', pri: 'Medium', days: [1] }, { id: 'h12', name: 'Study (1.5h)', time: '19:00', pri: 'High', days: [0, 2] }, { id: 'h13', name: 'Study (1.5h)', time: '20:00', pri: 'High', days: [1] }, { id: 'h14', name: 'English: podcast + 5 power phrases', time: '18:00', pri: 'Medium', days: [4] }, { id: 'h15', name: 'Skin and hair mask', time: '18:00', pri: 'Medium', days: [5] }, { id: 'h16', name: 'Plan next week', time: '17:00', pri: 'Low', days: [6] }, { id: 'h17', name: 'Study + weekly review (2h)', time: '09:00', pri: 'High', days: [6] }, { id: 'h18', name: 'Project: long session (2h)', time: '11:00', pri: 'High', days: [6] }, { id: 'h19', name: 'Voice: mirror or video practice', time: '16:00', pri: 'Medium', days: [6] }, { id: 'h20', name: 'Project (1.5h)', time: '19:30', pri: 'High', days: [3] }, { id: 'h21', name: 'English listening 30 min', time: '20:30', pri: 'Medium', days: [0] }, { id: 'h22', name: 'Voice: record 1 min and replay', time: '20:30', pri: 'Medium', days: [2] }, { id: 'h23', name: 'Hair: oil massage', time: '21:30', pri: 'Low', days: [1] }, { id: 'h24', name: 'Leg drills (10 min)', time: '21:45', pri: 'Medium', days: ALL }, { id: 'h25', name: 'Skin care: night wash + moisturise', time: '22:00', pri: 'Low', days: ALL }],
    log: {}, fl: {}, focus: [{ id: 'f1', text: 'Create momentum' }, { id: 'f2', text: 'Eliminate distractions' }, { id: 'f3', text: 'Do the hard things' }, { id: 'f4', text: 'Make progress' }],
    quotes: [{ id: 'q1', text: 'Discipline turns intentions into results.' }, { id: 'q2', text: 'Be a little better than yesterday.' }, { id: 'q3', text: 'Small steps, every day.' }],
    goals: [{ id: 'g1', text: 'Hold a free handstand', done: false }, { id: 'g2', text: 'Study every day for 30 days', done: false }, { id: 'g3', text: 'Gym twice a week for a month', done: false }], notes: [], favs: {}, music: [], cats: [{ id: 'c1', name: 'My why', items: [{ id: 'c1a', text: 'Build a body and mind I am proud of' }, { id: 'c1b', text: 'Show up even on low days' }] }, { id: 'c2', name: 'Non-negotiables', items: [{ id: 'c2a', text: 'No phone in the first hour' }, { id: 'c2b', text: 'Be in bed before midnight' }] }, { id: 'c3', name: 'Rewards', items: [{ id: 'c3a', text: 'Movie night after a 7-day streak' }] }, { id: 'c4', name: 'Affirmations', items: [{ id: 'c4a', text: 'I keep promises to myself' }, { id: 'c4b', text: 'Progress beats perfection' }] }]
});
/** What every NEW account starts with: completely empty (only the look settings: theme, accent, tagline). */
const BLANK = () => ({ ...DEF(), habits: [], focus: [], quotes: [], goals: [], notes: [], cats: [], log: {}, fl: {}, favs: {}, music: [] });
/** Builds the app state from the saved cloud data. A new account (nothing saved yet) gets BLANK(). */
function load() {
    const s = window.REMOTE; if (s && s.habits)
        return Object.assign(BLANK(), s); return BLANK();
}
/** Called after every change. Sends the state to the cloud (debounced in boot/08-session.js). */
function save() { window.__saveRemote && window.__saveRemote(S); }
let S = load(), V = 'today', D = key(new Date()), CM = new Date(), qo = 0, M = null, armed = null;
CM.setDate(1);
let FX = [], EN = true, LP = 0;