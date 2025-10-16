const elements = {
    form: document.getElementById('search-form'),
    query: document.getElementById('query'),
    collection: document.getElementById('collection'),
    format: document.getElementById('format'),
    language: document.getElementById('language'),
    dateStart: document.getElementById('date-start'),
    dateEnd: document.getElementById('date-end'),
    sort: document.getElementById('sort'),
    hasLocation: document.getElementById('has-location'),
    pageSize: document.getElementById('page-size'),
    searchButton: document.getElementById('search-button'),
    resetButton: document.getElementById('reset-button'),
    status: document.getElementById('search-status'),
    summary: document.getElementById('results-summary'),
    tips: document.getElementById('search-tips'),
    resultsList: document.getElementById('results-list'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    pageIndicator: document.getElementById('page-indicator'),
    locTemplate: document.getElementById('result-template'),
    ppocTemplate: document.getElementById('ppoc-result-template'),
    galleryTemplate: document.getElementById('gallery-template'),
    dialog: document.getElementById('detail-dialog'),
    dialogTitle: document.getElementById('detail-title'),
    dialogContent: document.getElementById('detail-content'),
    closeDialog: document.getElementById('close-dialog'),
    apiInput: document.getElementById('api-key-input'),
    saveKey: document.getElementById('save-key'),
    apiStatus: document.getElementById('api-key-status'),
    sourceButtons: document.querySelectorAll('.source-toggle__btn'),
    listViewBtn: document.getElementById('list-view-btn'),
    galleryViewBtn: document.getElementById('gallery-view-btn')
};

const state = {
    apiKey: '',
    source: 'loc',
    view: 'list',
    page: 1,
    pages: 1,
    pageSize: 20,
    total: 0,
    rawResults: [],
    filteredResults: [],
    lastRequestUrl: '',
    cache: new Map(),
    prefetching: new Set(),
    showNewOnly: false,
    seenIndex: {},
    currentQueryKey: ''
};

const LOC_BASE = 'https://www.loc.gov';
const PPOC_BASE = 'https://www.loc.gov/pictures/search/';
let GALLERY_TILE_PX = 160; // base gallery tile size (responsive)
const MAX_LOC_COUNT = 1000; // practical per-page cap for LOC API and UI performance
const STORAGE_KEY = 'locPowerSearch@apiKey';
const THEME_STORAGE_KEY = 'locPowerSearch@theme';
const SEEN_STORAGE_KEY = 'locPowerSearch@seenIndex';
const API_INDICATOR_ID = 'api-key-indicator';
const ENABLE_LOCAL_NEWNESS = false; // disable local NEW badges/controls unless explicitly enabled

// Inject compact layout styles to fit the search panel on shorter screens
function injectCompactStyles() {
    if (document.getElementById('compact-style')) return;
    const style = document.createElement('style');
    style.id = 'compact-style';
    style.textContent = `
    .api-key-indicator { margin-top: 4px; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.02em; }
    .api-key-indicator--ok { color: #1fa97c; }
    .api-key-indicator--warn { color: #cc7a00; }

    /* Discreet theme toggle */
    .theme-toggle { margin-left: 8px; width: 22px; height: 22px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.25); background: radial-gradient(circle at 30% 30%, #fff4, transparent 60%), linear-gradient(135deg, #4e6cff, #0f141f); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: inline-block; vertical-align: middle; }
    .theme-toggle:hover { transform: translateY(-1px); }
    .theme-inline { display: inline-flex; align-items: center; gap: 8px; }

    /* Condensed search panel (smaller, cleaner) */
    .search-panel.is-condensed { padding: 18px !important; }
    .search-panel.is-condensed .search-form { gap: 10px !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .search-panel.is-condensed .form-group { gap: 6px !important; }
    .search-panel.is-condensed .form-group.wide { grid-column: span 2; margin-bottom: 4px; }
    .search-panel.is-condensed .group-label { font-size: 0.8rem !important; letter-spacing: 0.08em; margin: 0 0 2px 0; opacity: 0.9; }
    .search-panel.is-condensed .source-toggle { padding: 4px; gap: 4px; }
    .search-panel.is-condensed .source-toggle__btn { padding: 6px 10px; font-size: 0.85rem; }
    .search-panel.is-condensed .form-group input, .search-panel.is-condensed .form-group select { padding: 10px 12px; font-size: 0.9rem; }
    .search-panel.is-condensed .form-actions button { padding: 10px 14px; font-weight: 700; }
    .search-panel.is-condensed .theme-inline { margin-top: 6px; }

    /* Ultra-condensed layout to fit all controls without scroll */
    .search-panel.is-ultracondensed { padding: 14px !important; }
    .search-panel.is-ultracondensed .search-form { gap: 8px !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .search-panel.is-ultracondensed .form-group { gap: 4px !important; }
    .search-panel.is-ultracondensed .form-group.wide { grid-column: 1 / -1; margin-bottom: 2px; }
    .search-panel.is-ultracondensed .group-label { font-size: 0.78rem !important; letter-spacing: 0.08em; margin: 0; opacity: 0.9; }
    .search-panel.is-ultracondensed .source-toggle { padding: 3px; gap: 3px; }
    .search-panel.is-ultracondensed .source-toggle__btn { padding: 6px 8px; font-size: 0.82rem; }
    .search-panel.is-ultracondensed .form-group label { font-size: 0.82rem; margin: 0; }
    .search-panel.is-ultracondensed .form-group input, .search-panel.is-ultracondensed .form-group select { padding: 8px 10px; font-size: 0.9rem; height: 36px; }
    .search-panel.is-ultracondensed .form-actions button { padding: 9px 12px; font-weight: 700; }
    .search-panel.is-ultracondensed .theme-inline { margin-top: 4px; }

    /* Theme variants override CSS variables */
    body.theme-deep { --bg: #0f141f; --bg-alt: rgba(18, 24, 37, 0.75); --panel: rgba(250, 251, 254, 0.92); --panel-dark: rgba(25, 30, 44, 0.85); --accent: #3468ff; --accent-soft: rgba(52, 104, 255, 0.14); --accent-strong: #2f54d8; --border: rgba(15, 20, 31, 0.15); --text: #111422; --text-soft: rgba(17, 20, 34, 0.65); }
    body.theme-deep .background__gradient { background: radial-gradient(circle at 15% 20%, rgba(78, 118, 255, 0.45), transparent 60%), radial-gradient(circle at 85% 30%, rgba(109, 232, 255, 0.38), transparent 55%), radial-gradient(circle at 50% 80%, rgba(59, 89, 170, 0.42), transparent 65%); }

    body.theme-forest { --bg: #0e1411; --bg-alt: rgba(16, 30, 22, 0.75); --panel: rgba(250, 252, 248, 0.92); --panel-dark: rgba(16, 30, 22, 0.85); --accent: #2aa363; --accent-soft: rgba(42, 163, 99, 0.14); --accent-strong: #1d7b4a; --border: rgba(10, 30, 18, 0.18); --text: #0f2017; --text-soft: rgba(15, 32, 23, 0.65); }
    body.theme-forest .background__gradient { background: radial-gradient(circle at 20% 25%, rgba(42, 163, 99, 0.45), transparent 60%), radial-gradient(circle at 80% 30%, rgba(142, 226, 165, 0.35), transparent 55%), radial-gradient(circle at 55% 80%, rgba(40, 90, 60, 0.42), transparent 65%); }

    body.theme-rose { --bg: #1a1216; --bg-alt: rgba(26, 18, 22, 0.75); --panel: rgba(254, 250, 252, 0.92); --panel-dark: rgba(40, 24, 32, 0.85); --accent: #ff5c93; --accent-soft: rgba(255, 92, 147, 0.16); --accent-strong: #e1467b; --border: rgba(30, 15, 25, 0.15); --text: #221117; --text-soft: rgba(34, 17, 23, 0.65); }
    body.theme-rose .background__gradient { background: radial-gradient(circle at 15% 20%, rgba(255, 92, 147, 0.45), transparent 60%), radial-gradient(circle at 85% 30%, rgba(254, 156, 201, 0.35), transparent 55%), radial-gradient(circle at 50% 80%, rgba(120, 45, 75, 0.42), transparent 65%); }

    /* American flag theme: subtle stripes and blue accents */
    body.theme-flag { --bg: #0a1024; --bg-alt: rgba(10, 16, 36, 0.75); --panel: rgba(255, 255, 255, 0.94); --panel-dark: rgba(10, 16, 36, 0.85); --accent: #2b6cb0; --accent-soft: rgba(43, 108, 176, 0.16); --accent-strong: #1e4f86; --border: rgba(10, 16, 36, 0.18); --text: #0f1428; --text-soft: rgba(15, 20, 40, 0.65); }
    body.theme-flag .background__gradient {
        background:
            repeating-linear-gradient(
                180deg,
                rgba(193, 26, 37, 0.18) 0px,
                rgba(193, 26, 37, 0.18) 16px,
                rgba(255, 255, 255, 0.18) 16px,
                rgba(255, 255, 255, 0.18) 32px
            ),
            radial-gradient(circle at 10% 18%, rgba(33, 76, 141, 0.55), transparent 55%),
            radial-gradient(circle at 85% 75%, rgba(33, 76, 141, 0.25), transparent 60%);
        filter: blur(30px);
    }
    body.theme-flag .background__texture {
        background: url('https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg') center/cover no-repeat !important;
        opacity: 0.28;
        filter: saturate(1.1) contrast(1.05);
    }

    /* Purple */
    body.theme-purple { --bg: #171228; --bg-alt: rgba(23, 18, 40, 0.78); --panel: rgba(253, 253, 255, 0.96); --panel-dark: rgba(30, 22, 54, 0.9); --accent: #7a5cff; --accent-soft: rgba(122, 92, 255, 0.18); --accent-strong: #5a3fd6; --border: rgba(23, 18, 40, 0.2); --text: #140f25; --text-soft: rgba(20, 15, 37, 0.72); }
    body.theme-purple .background__gradient { background: radial-gradient(circle at 20% 25%, rgba(122,92,255,0.35), transparent 60%), radial-gradient(circle at 80% 30%, rgba(210, 160, 255, 0.25), transparent 55%), radial-gradient(circle at 55% 80%, rgba(60, 40, 110, 0.35), transparent 65%); filter: blur(30px); }

    /* Red */
    body.theme-red { --bg: #240f12; --bg-alt: rgba(36, 15, 18, 0.78); --panel: rgba(255, 251, 251, 0.96); --panel-dark: rgba(48, 18, 22, 0.9); --accent: #ff4b4b; --accent-soft: rgba(255, 75, 75, 0.16); --accent-strong: #d63a3a; --border: rgba(36, 15, 18, 0.2); --text: #2a1416; --text-soft: rgba(42, 20, 22, 0.68); }
    body.theme-red .background__gradient { background: radial-gradient(circle at 20% 25%, rgba(255,75,75,0.35), transparent 60%), radial-gradient(circle at 80% 30%, rgba(255,160,160,0.25), transparent 55%), radial-gradient(circle at 55% 80%, rgba(110, 50, 60, 0.3), transparent 65%); filter: blur(30px); }

    /* Black (high-contrast) */
    body.theme-black { --bg: #0a0a0a; --bg-alt: rgba(12, 12, 12, 0.85); --panel: rgba(245, 245, 245, 0.96); --panel-dark: rgba(20, 20, 20, 0.94); --accent: #3ea6ff; --accent-soft: rgba(62, 166, 255, 0.18); --accent-strong: #1f74b8; --border: rgba(255,255,255,0.08); --text: #0f0f10; --text-soft: rgba(16, 16, 16, 0.7); }
    body.theme-black .background__gradient { background: radial-gradient(circle at 20% 25%, rgba(62,166,255,0.28), transparent 60%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08), transparent 55%); filter: blur(26px); }

    /* Black + Gold */
    body.theme-blackgold { --bg: #0c0a07; --bg-alt: rgba(14, 12, 9, 0.85); --panel: rgba(250, 248, 240, 0.96); --panel-dark: rgba(24, 20, 14, 0.92); --accent: #d4a017; --accent-soft: rgba(212, 160, 23, 0.2); --accent-strong: #a78113; --border: rgba(212,160,23,0.18); --text: #120f0a; --text-soft: rgba(18, 15, 10, 0.7); }
    body.theme-blackgold .background__gradient { background: radial-gradient(circle at 20% 25%, rgba(212,160,23,0.22), transparent 60%), radial-gradient(circle at 80% 35%, rgba(255, 220, 120, 0.12), transparent 55%); filter: blur(26px); }

    /* theme-library removed per user request */
    .new-controls { display: inline-flex; gap: 8px; align-items: center; margin-left: 12px; }
    .new-controls__btn { padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(15, 17, 30, 0.15); background: rgba(15, 17, 30, 0.06); color: var(--text); font-weight: 600; letter-spacing: 0.02em; cursor: pointer; }
    .new-controls__btn.is-active { background: rgba(52, 104, 255, 0.16); color: var(--accent-strong); }
    .new-controls__btn[disabled] { opacity: 0.5; cursor: default; }
    .badge-new { display: inline-block; margin-left: 8px; background: #ff3b3b; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 999px; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .badge-new--overlay { position: absolute; top: 8px; left: 8px; margin: 0; }
    body.compact { padding: 12px !important; }
    body.compact .app-header { gap: 16px !important; margin-bottom: 12px !important; }
    body.compact .app-header__branding p { display: none !important; }
    body.compact .app-header__api-key small { display: none !important; }
    body.compact .api-key-input input { padding: 8px 10px !important; }
    body.compact .api-key-input button { padding: 8px 12px !important; }
    body.compact .app { grid-template-columns: 300px minmax(0, 1fr) !important; gap: 16px !important; }
    body.compact .search-panel { padding: 16px !important; }
    body.compact .search-form { gap: 10px !important; }
    body.compact .form-group { gap: 6px !important; }
    body.compact .form-group input, body.compact .form-group select { padding: 10px 12px !important; }
    body.compact .group-label { font-size: 0.9rem !important; }
    body.compact .source-toggle__btn { padding: 8px 12px !important; }

    body.ultra-compact { padding: 8px !important; }
    body.ultra-compact .app-header { gap: 12px !important; margin-bottom: 8px !important; }
    body.ultra-compact .app { grid-template-columns: 260px minmax(0, 1fr) !important; gap: 12px !important; }
    body.ultra-compact .search-panel { padding: 12px !important; }
    body.ultra-compact .search-form { gap: 8px !important; }
    body.ultra-compact .form-group { gap: 4px !important; }
    body.ultra-compact .form-group input, body.ultra-compact .form-group select { padding: 8px 10px !important; }
    body.ultra-compact .view-toggle__btn { padding: 6px 10px !important; }

    /* Loading overlay animations */
    .results-list.is-loading { position: relative; }
    .loading-overlay { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(255,255,255,0.6); backdrop-filter: blur(3px); z-index: 5; }
    .loading-text { margin-top: 10px; font-weight: 800; letter-spacing: 0.08em; color: var(--text); text-transform: uppercase; font-size: 0.85rem; }

    /* Books bounce */
    .loader-books { display: grid; gap: 14px; place-items: center; }
    .loading-books { position: relative; width: 160px; height: 80px; }
    .loading-book { position: absolute; bottom: 0; width: 30px; height: 58px; border-radius: 6px; box-shadow: 0 10px 18px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.08); transform-origin: 50% 100%; animation: book-bop 1.1s ease-in-out infinite; }
    .loading-book:nth-child(1) { left: 0; background: var(--accent); animation-delay: 0s; }
    .loading-book:nth-child(2) { left: 65px; background: #8fbf5a; animation-delay: 0.12s; }
    .loading-book:nth-child(3) { left: 130px; background: #e67c73; animation-delay: 0.24s; }
    .loading-shadow { position: absolute; bottom: 12px; left: 0; right: 0; height: 8px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0) 70%); filter: blur(2px); animation: shadow-breathe 1.1s ease-in-out infinite; }
    @keyframes book-bop { 0%, 100% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-10px) rotate(-2deg); } 60% { transform: translateY(0) rotate(2deg); } }
    @keyframes shadow-breathe { 0%, 100% { transform: scaleX(1); opacity: 0.6; } 50% { transform: scaleX(0.85); opacity: 0.4; } }

    /* Ring + confetti */
    .loader-ring { position: relative; width: 96px; height: 96px; border-radius: 50%; box-shadow: inset 0 0 0 6px rgba(0,0,0,0.06); }
    .loader-ring::before, .loader-ring::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 6px solid transparent; }
    .loader-ring::before { border-top-color: var(--accent); animation: spin 900ms linear infinite; }
    .loader-ring::after { border-bottom-color: var(--accent-strong); animation: spin 1300ms linear infinite reverse; }
    .confetti { position: absolute; width: 8px; height: 8px; border-radius: 2px; opacity: 0.85; animation: confetti-fall 900ms ease-in-out infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes confetti-fall { 0% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-10px) rotate(45deg); } 100% { transform: translateY(0) rotate(90deg); } }

    /* Orbiting dots */
    .loader-orbit { position: relative; width: 120px; height: 120px; }
    .orbit-center { position: absolute; inset: calc(50% - 6px); width: 12px; height: 12px; background: var(--accent-strong); border-radius: 50%; box-shadow: 0 0 16px var(--accent-soft); }
    .orbit-path { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed rgba(0,0,0,0.15); animation: spin 2.4s linear infinite; }
    .sat { position: absolute; top: -6px; left: calc(50% - 6px); width: 12px; height: 12px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent-soft); }

    /* Page flip */
    .loader-page { position: relative; width: 110px; height: 80px; perspective: 600px; }
    .page { position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; background: #fff; border-radius: 6px; box-shadow: 0 10px 24px rgba(0,0,0,0.12); transform-origin: left center; animation: flip 1.2s ease-in-out infinite; }
    .page:nth-child(2) { animation-delay: 0.15s; }
    .page:nth-child(3) { animation-delay: 0.3s; }
    @keyframes flip { 0% { transform: rotateY(0deg); } 50% { transform: rotateY(-160deg); } 100% { transform: rotateY(-180deg); opacity: 0.6; } }

    /* Starburst */
    .loader-star { position: relative; width: 110px; height: 110px; }
    .ray { position: absolute; left: 50%; top: 50%; width: 2px; height: 40px; background: var(--accent); transform-origin: center 20px; opacity: 0.8; animation: pulse 1s ease-in-out infinite; }
    .ray:nth-child(odd) { background: var(--accent-strong); }
    @keyframes pulse { 0%,100% { transform: translate(-50%, -50%) scaleY(1); opacity: 0.8; } 50% { transform: translate(-50%, -50%) scaleY(1.4); opacity: 0.5; } }

    /* Collapse API key panel when saved */
    .app-header__api-key.is-collapsed label,
    .app-header__api-key.is-collapsed .api-key-input,
    .app-header__api-key.is-collapsed small,
    .app-header__api-key.is-collapsed .api-key-status { display: none !important; }
    .api-key-mini { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; letter-spacing: 0.04em; color: rgba(233,238,255,0.85); }
    .api-key-mini__dot { width: 10px; height: 10px; border-radius: 50%; background: #1fa97c; box-shadow: 0 0 10px rgba(31,169,124,0.6); }
    .api-key-mini__btn { padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); background: rgba(15,17,30,0.3); color: #fff; cursor: pointer; }

    /* Ultra-wide optimization for ~5120 px monitors */
    @media (min-width: 4000px) {
      .app { grid-template-columns: 520px minmax(0, 1fr) !important; gap: 36px !important; }
      .results-toolbar { gap: 20px; }
      .results-list:not(.is-gallery) { gap: 22px; }
    }

    /* Compact narrow panel (restore earlier feel) */
    .search-panel.is-compactnarrow { padding: 18px !important; }
    .search-panel.is-compactnarrow .search-form { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
    .search-panel.is-compactnarrow .form-group { gap: 6px !important; }
    .search-panel.is-compactnarrow .form-group.wide { grid-column: span 2; }
    .search-panel.is-compactnarrow .group-label, .search-panel.is-compactnarrow .form-group label { font-size: 0.9rem !important; margin: 0; }
    .search-panel.is-compactnarrow .form-group input, .search-panel.is-compactnarrow .form-group select { padding: 10px 12px; font-size: 0.95rem; }
    @media (min-width: 2560px) {
      body .app { grid-template-columns: 280px minmax(0, 1fr) !important; }
    }
    `;
    document.head.appendChild(style);
}

function pickLoadingMode() {
    const modes = ['books', 'ring', 'orbit', 'page', 'star'];
    state.loadingIndex = (state.loadingIndex ?? -1) + 1;
    return modes[state.loadingIndex % modes.length];
}

function buildLoadingOverlay(mode) {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
    }
    overlay.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.placeItems = 'center';
    wrap.style.gap = '12px';

    if (mode === 'books') {
        const box = document.createElement('div');
        box.className = 'loader-books';
        const books = document.createElement('div'); books.className = 'loading-books';
        for (let i = 0; i < 3; i++) {
            const b = document.createElement('div'); b.className = 'loading-book'; books.appendChild(b);
        }
        const shadow = document.createElement('div'); shadow.className = 'loading-shadow'; books.appendChild(shadow);
        const text = document.createElement('div'); text.className = 'loading-text'; text.textContent = 'Searching…';
        box.appendChild(books); box.appendChild(text); wrap.appendChild(box);
    } else if (mode === 'ring') {
        const ring = document.createElement('div'); ring.className = 'loader-ring'; wrap.appendChild(ring);
        for (let i = 0; i < 16; i++) {
            const c = document.createElement('div'); c.className = 'confetti';
            c.style.left = `${Math.random()*100}%`;
            c.style.top = `${Math.random()*100}%`;
            c.style.background = `hsl(${Math.floor(Math.random()*360)},80%,60%)`;
            c.style.animationDelay = `${Math.random()*0.8}s`;
            c.style.width = c.style.height = `${6 + Math.random()*8}px`;
            overlay.appendChild(c);
        }
        const text = document.createElement('div'); text.className = 'loading-text'; text.textContent = 'Searching…'; wrap.appendChild(text);
    } else if (mode === 'orbit') {
        const orbit = document.createElement('div'); orbit.className = 'loader-orbit';
        const center = document.createElement('div'); center.className = 'orbit-center'; orbit.appendChild(center);
        const path = document.createElement('div'); path.className = 'orbit-path';
        const sat = document.createElement('div'); sat.className = 'sat'; path.appendChild(sat);
        orbit.appendChild(path); wrap.appendChild(orbit);
        const text = document.createElement('div'); text.className = 'loading-text'; text.textContent = 'Searching…'; wrap.appendChild(text);
    } else if (mode === 'page') {
        const stack = document.createElement('div'); stack.className = 'loader-page';
        for (let i = 0; i < 3; i++) { const p = document.createElement('div'); p.className = 'page'; stack.appendChild(p); }
        wrap.appendChild(stack);
        const text = document.createElement('div'); text.className = 'loading-text'; text.textContent = 'Searching…'; wrap.appendChild(text);
    } else {
        const star = document.createElement('div'); star.className = 'loader-star';
        for (let i = 0; i < 12; i++) {
            const r = document.createElement('div'); r.className = 'ray'; r.style.transform = `translate(-50%,-50%) rotate(${(360/12)*i}deg)`; star.appendChild(r);
        }
        wrap.appendChild(star);
        const text = document.createElement('div'); text.className = 'loading-text'; text.textContent = 'Searching…'; wrap.appendChild(text);
    }

    overlay.appendChild(wrap);
    return overlay;
}

function setTheme(theme) {
    const themes = ['theme-deep', 'theme-forest', 'theme-rose', 'theme-flag', 'theme-purple', 'theme-red', 'theme-black', 'theme-blackgold'];
    const body = document.body;
    themes.forEach(t => body.classList.remove(t));
    if (themes.includes(theme)) {
        body.classList.add(theme);
        try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
    }
}

function loadTheme() {
    let t = null;
    try { t = localStorage.getItem(THEME_STORAGE_KEY); } catch {}
    if (!t) t = 'theme-deep';
    setTheme(t);
}

function ensureThemeToggle() {
    const sourceToggle = document.querySelector('.source-toggle');
    if (!sourceToggle) return;
    const parent = sourceToggle.parentElement || document.querySelector('.search-form');
    if (!parent) return;
    if (parent.querySelector('.theme-inline')) return; // already injected near data source
    const wrapper = document.createElement('div');
    wrapper.className = 'theme-inline';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theme-toggle';
    toggle.title = 'Change theme';
    toggle.setAttribute('aria-label', 'Change theme');
    toggle.addEventListener('click', () => {
        const order = ['theme-deep', 'theme-forest', 'theme-rose', 'theme-flag', 'theme-purple', 'theme-red', 'theme-black', 'theme-blackgold'];
        const current = order.find(t => document.body.classList.contains(t)) || 'theme-deep';
        const idx = order.indexOf(current);
        const next = order[(idx + 1) % order.length];
        setTheme(next);
    });
    wrapper.appendChild(toggle);
    // Insert immediately after the data source toggle group
    if (sourceToggle.nextSibling) {
        parent.insertBefore(wrapper, sourceToggle.nextSibling);
    } else {
        parent.appendChild(wrapper);
    }
}

function updateCompactMode() {
    const h = window.innerHeight || document.documentElement.clientHeight || 900;
    const body = document.body;
    if (h <= 680) {
        body.classList.add('compact', 'ultra-compact');
    } else if (h <= 820) {
        body.classList.add('compact');
        body.classList.remove('ultra-compact');
    } else {
        body.classList.remove('compact', 'ultra-compact');
    }
}

function updateSearchPanelMaxHeight() {
    const panel = document.querySelector('.search-panel');
    const header = document.querySelector('.app-header');
    if (!panel) return;
    const viewport = window.innerHeight || document.documentElement.clientHeight || 900;
    const bodyStyles = getComputedStyle(document.body);
    const padTop = parseFloat(bodyStyles.paddingTop) || 0;
    const padBottom = parseFloat(bodyStyles.paddingBottom) || 0;
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    // Reserve a small gap between header and app content
    const reservedGap = 16;
    let available = viewport - headerHeight - padTop - padBottom - reservedGap;
    // Clamp to reasonable bounds
    available = Math.max(260, Math.min(available, viewport));
    panel.style.maxHeight = `${available}px`;
    panel.style.overflowY = 'auto';
    panel.style.overscrollBehavior = 'contain';
}

function applySearchPanelCondensed() {
    const panel = document.querySelector('.search-panel');
    if (panel) panel.classList.add('is-condensed');
}

function applySearchPanelUltraCondensed() {
    const panel = document.querySelector('.search-panel');
    if (panel) panel.classList.add('is-ultracondensed');
}

// (Removed) experimental "recently added" filter

function showApiStatus(message, type = 'success') {
    if (!elements.apiStatus) return;
    elements.apiStatus.textContent = message;
    elements.apiStatus.classList.remove('is-success', 'is-cleared', 'is-visible');
    elements.apiStatus.classList.add(type === 'cleared' ? 'is-cleared' : 'is-success');
    requestAnimationFrame(() => elements.apiStatus.classList.add('is-visible'));
    clearTimeout(showApiStatus.timeoutId);
    showApiStatus.timeoutId = setTimeout(() => {
        elements.apiStatus.classList.remove('is-visible');
    }, 2000);
}

function ensureApiIndicator() {
    let indicator = document.getElementById(API_INDICATOR_ID);
    if (indicator) return indicator;
    const container = document.querySelector('.app-header__api-key') || document.body;
    indicator = document.createElement('div');
    indicator.id = API_INDICATOR_ID;
    indicator.className = 'api-key-indicator';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');
    const before = container.querySelector('small');
    if (before) {
        container.insertBefore(indicator, before);
    } else {
        container.appendChild(indicator);
    }
    return indicator;
}

function setApiIndicator(hasKey) {
    const el = ensureApiIndicator();
    el.classList.toggle('api-key-indicator--ok', !!hasKey);
    el.classList.toggle('api-key-indicator--warn', !hasKey);
    el.textContent = hasKey
        ? 'API key: added (higher limits)'
        : 'API key: not added — using public requests';
    const container = document.querySelector('.app-header__api-key');
    if (container) {
        let mini = container.querySelector('.api-key-mini');
        if (!mini) {
            mini = document.createElement('div');
            mini.className = 'api-key-mini';
            mini.innerHTML = '<span class="api-key-mini__dot"></span><span>API key saved</span> <button type="button" class="api-key-mini__btn">Edit</button>';
            container.appendChild(mini);
            const btn = mini.querySelector('.api-key-mini__btn');
            btn.addEventListener('click', () => {
                container.classList.remove('is-collapsed');
            });
        }
        mini.style.display = hasKey ? 'inline-flex' : 'none';
        if (hasKey) {
            // Hide the warning indicator immediately when key is present
            el.style.display = 'none';
            setTimeout(() => container.classList.add('is-collapsed'), 100);
        } else {
            el.style.display = 'block';
            container.classList.remove('is-collapsed');
        }
    }
}

function getPlaceholderCopy() {
    if (state.source === 'ppoc') {
        return {
            title: 'Search Prints & Photographs',
            message: 'Explore high-resolution imagery from the Prints & Photographs Online Catalog.'
        };
    }
    return {
        title: 'Search the Library of Congress',
        message: 'Run a query to see richly formatted results with thumbnails, descriptions, and direct links back to loc.gov.'
    };
}

function renderPlaceholder(title, message) {
    elements.resultsList.classList.toggle('is-gallery', state.view === 'gallery');
    elements.resultsList.innerHTML = '';
    const placeholder = document.createElement('div');
    placeholder.className = 'results-placeholder';
    placeholder.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
    elements.resultsList.appendChild(placeholder);
}

function loadApiKey() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state.apiKey = saved;
        elements.apiInput.value = saved;
        showApiStatus('API key loaded.', 'success');
        setApiIndicator(true);
    } else {
        setApiIndicator(false);
    }
}

function loadSeenIndex() {
    try {
        const raw = localStorage.getItem(SEEN_STORAGE_KEY);
        state.seenIndex = raw ? JSON.parse(raw) : {};
    } catch {
        state.seenIndex = {};
    }
}

function saveApiKey() {
    const key = elements.apiInput.value.trim();
    state.apiKey = key;
    if (key) {
        localStorage.setItem(STORAGE_KEY, key);
        showApiStatus('API key saved locally.', 'success');
        setApiIndicator(true);
    } else {
        localStorage.removeItem(STORAGE_KEY);
        showApiStatus('API key cleared. Public requests only.', 'cleared');
        setApiIndicator(false);
    }
}

function saveSeenIndex() {
    try {
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(state.seenIndex || {}));
    } catch {}
}

function buildQueryKey(formData) {
    const keyObj = {
        source: formData.source,
        q: formData.query || '',
        collection: formData.collection || '',
        format: formData.format || '',
        language: formData.language || '',
        dates: `${formData.dateStart || ''}-${formData.dateEnd || ''}`,
        hasLocation: !!formData.hasLocation,
        sort: formData.sort || ''
    };
    return JSON.stringify(keyObj);
}

function getRecordIdForSource(record, source) {
    if (source === 'ppoc') {
        return record.links?.item || String(record.pk || '');
    }
    return record.id || record.url || '';
}

function markResultsNewness(formData) {
    const key = buildQueryKey(formData);
    state.currentQueryKey = key;
    const seenArr = state.seenIndex[key] || [];
    const seenSet = new Set(seenArr);
    (state.rawResults || []).forEach(r => {
        const id = getRecordIdForSource(r, formData.source);
        r.__recordId = id;
        r.__isNew = ENABLE_LOCAL_NEWNESS && id ? !seenSet.has(id) : false;
    });
}

function countNewInFiltered() {
    return (state.filteredResults || []).reduce((acc, r) => acc + (r.__isNew ? 1 : 0), 0);
}

let newControls = null;
function ensureNewControls() {
    if (!ENABLE_LOCAL_NEWNESS) return null;
    if (newControls) return newControls;
    const toolbar = document.querySelector('.results-toolbar');
    if (!toolbar) return null;
    const container = document.createElement('div');
    container.className = 'new-controls';
    const showBtn = document.createElement('button');
    showBtn.type = 'button';
    showBtn.className = 'new-controls__btn';
    showBtn.textContent = 'Show new only';
    const seenBtn = document.createElement('button');
    seenBtn.type = 'button';
    seenBtn.className = 'new-controls__btn';
    seenBtn.textContent = 'Mark page as reviewed';
    container.appendChild(showBtn);
    container.appendChild(seenBtn);
    // Insert before view-toggle to keep layout tidy
    const viewToggle = toolbar.querySelector('.view-toggle');
    if (viewToggle) {
        toolbar.insertBefore(container, viewToggle);
    } else {
        toolbar.appendChild(container);
    }

    showBtn.addEventListener('click', () => {
        state.showNewOnly = !state.showNewOnly;
        showBtn.classList.toggle('is-active', state.showNewOnly);
        // Re-filter and re-render current page
        if (state.rawResults.length) {
            if (state.source === 'ppoc') {
                const visibleCount = filterPPOCResults({ results: state.rawResults });
                renderResults();
                updateSummary(undefined, visibleCount);
            } else {
                const visibleCount = filterLOCResults({ results: state.rawResults }, elements.hasLocation.checked);
                renderResults();
                updateSummary(undefined, visibleCount);
            }
        }
        updateNewControls();
    });

    seenBtn.addEventListener('click', () => {
        const key = state.currentQueryKey;
        if (!key) return;
        const existing = new Set(state.seenIndex[key] || []);
        (state.rawResults || []).forEach(r => { if (r.__recordId) existing.add(r.__recordId); });
        state.seenIndex[key] = Array.from(existing);
        saveSeenIndex();
        // Update flags and re-render
        (state.rawResults || []).forEach(r => { if (r.__recordId) r.__isNew = false; });
        if (state.source === 'ppoc') {
            const visibleCount = filterPPOCResults({ results: state.rawResults });
            renderResults();
            updateSummary(undefined, visibleCount);
        } else {
            const visibleCount = filterLOCResults({ results: state.rawResults }, elements.hasLocation.checked);
            renderResults();
            updateSummary(undefined, visibleCount);
        }
        updateNewControls();
    });

    newControls = { container, showBtn, seenBtn };
    return newControls;
}

function updateNewControls() {
    if (!ENABLE_LOCAL_NEWNESS) return;
    const controls = ensureNewControls();
    if (!controls) return;
    const newCount = countNewInFiltered();
    controls.showBtn.classList.toggle('is-active', !!state.showNewOnly);
    controls.showBtn.textContent = newCount ? `Show new only (${newCount})` : 'Show new only (0)';
    controls.seenBtn.disabled = newCount === 0;
}

function updateViewButtons() {
    if (!elements.listViewBtn || !elements.galleryViewBtn) return;
    [elements.listViewBtn, elements.galleryViewBtn].forEach((button) => {
        const desiredView = button.dataset.view;
        const isActive = desiredView === state.view && !button.disabled;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
    elements.galleryViewBtn?.setAttribute('aria-disabled', String(!!elements.galleryViewBtn.disabled));
}

function setView(view) {
    if (state.view === view) return;
    state.view = view;
    updateViewButtons();
    if (state.rawResults.length) {
        renderResults();
        updateSummary();
    } else {
        const copy = getPlaceholderCopy();
        renderPlaceholder(copy.title, copy.message);
    }
}

function setSource(source) {
    if (state.source === source) return;
    state.source = source;
    elements.sourceButtons.forEach((button) => {
        const isActive = button.dataset.source === source;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });

    const disableCollectionFilters = source === 'ppoc';
    [elements.collection, elements.format, elements.hasLocation].forEach((el) => {
        if (!el) return;
        el.disabled = disableCollectionFilters;
        if (disableCollectionFilters && el === elements.hasLocation) {
            el.checked = false;
        }
    });

    if (elements.galleryViewBtn) {
        // Gallery view is supported for both sources
        elements.galleryViewBtn.disabled = false;
    }

    state.cache.clear();
    state.prefetching.clear();
    state.rawResults = [];
    state.filteredResults = [];
    state.page = 1;
    state.pages = 1;
    state.total = 0;
    updateViewButtons();
    updatePaginationControls();
    elements.summary.textContent = '';
    const copy = getPlaceholderCopy();
    renderPlaceholder(copy.title, copy.message);
    elements.tips.innerHTML = source === 'ppoc'
        ? '<strong>Quick tips:</strong> Try subject keywords (e.g. "Meiji prints", "civil war camp") and narrow with date ranges for more precise imagery.'
        : '<strong>Quick tips:</strong> Use quotes for exact phrases. Combine filters for precision. Try multiple collections.';
}

function serializeForm() {
    return {
        query: elements.query.value.trim(),
        collection: elements.collection.value,
        format: elements.format.value,
        language: elements.language.value.trim(),
        dateStart: elements.dateStart.value.trim(),
        dateEnd: elements.dateEnd.value.trim(),
        sort: elements.sort.value,
        hasLocation: !!elements.hasLocation.checked,
        pageSize: Number(elements.pageSize.value) || 20,
        source: state.source
    };
}

function buildLOCSearchUrl(formData, page) {
    const params = new URLSearchParams();
    params.set('q', formData.query);
    params.set('fo', 'json');
    const count = Math.min(formData.pageSize, MAX_LOC_COUNT);
    if (count < formData.pageSize) {
        elements.status.textContent = `Requested ${formData.pageSize} per page; capped to ${count} for reliability.`;
    }
    params.set('c', count.toString());
    params.set('sp', page.toString());
    if (formData.sort) params.set('sb', formData.sort);
    if (formData.format) params.append('fa', formData.format);
    if (formData.language) params.append('fa', `language:${formData.language}`);
    if (formData.dateStart || formData.dateEnd) {
        const start = formData.dateStart || '';
        const end = formData.dateEnd || '';
        params.set('dates', `${start}-${end}`.replace(/^-|-$/g, ''));
    }
    if (state.apiKey) params.set('api_key', state.apiKey);
    const path = formData.collection === 'search'
        ? `${LOC_BASE}/search/`
        : `${LOC_BASE}/${formData.collection}/`;
    const url = `${path}?${params.toString()}`;
    state.lastRequestUrl = url;
    return url;
}

function buildPPOCSearchUrl(formData, page) {
    const params = new URLSearchParams();
    params.set('q', formData.query || '*');
    params.set('fo', 'json');
    params.set('c', formData.pageSize.toString());
    params.set('sp', page.toString());
    if (formData.sort) params.set('sb', formData.sort);
    if (formData.dateStart || formData.dateEnd) {
        const start = formData.dateStart || '';
        const end = formData.dateEnd || '';
        params.set('dates', `${start}-${end}`.replace(/^-|-$/g, ''));
    }
    const url = `${PPOC_BASE}?${params.toString()}`;
    state.lastRequestUrl = url;
    return url;
}

function setLoading(isLoading, message = 'Searching...') {
    elements.searchButton.disabled = isLoading;
    elements.prevPage.disabled = isLoading || state.page <= 1;
    elements.nextPage.disabled = isLoading || state.page >= state.pages;
    elements.status.textContent = isLoading ? message : 'Ready.';
    elements.resultsList.classList.toggle('is-loading', isLoading);
    if (isLoading) {
        const mode = pickLoadingMode();
        const overlay = buildLoadingOverlay(mode);
        if (!elements.resultsList.contains(overlay)) elements.resultsList.appendChild(overlay);
        // remove any stray confetti from previous runs
        Array.from(elements.resultsList.querySelectorAll('.confetti')).forEach(n => n.remove());
        overlay.style.display = 'grid';
    } else {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }
}

function ensurePageSizeOptions() {
    const sel = elements.pageSize;
    if (!sel) return;
    const desired = [20, 50, 100, 200, 500, 1000, 5000, 10000, 50000];
    const existing = new Set(Array.from(sel.options).map(o => Number(o.value)));
    desired.forEach(v => {
        if (!existing.has(v)) {
            const opt = document.createElement('option');
            opt.value = String(v);
            opt.textContent = String(v);
            sel.appendChild(opt);
        }
    });
}

function getGalleryTilePx() {
    const w = window.innerWidth || 1920;
    if (w >= 6000) return 300;
    if (w >= 5000) return 260;
    if (w >= 4000) return 220;
    if (w >= 2560) return 200;
    return 160;
}

function normalize(value) {
    if (!value) return '';
    if (Array.isArray(value)) return value.join(' | ');
    return String(value);
}

function buildMetaList(record) {
    const meta = [];
    if (record.date) meta.push(`Date: ${record.date}`);
    const language = normalize(record.language);
    if (language) meta.push(`Language: ${language}`);
    const types = normalize(record.type);
    if (types) meta.push(`Type: ${types}`);
    const location = normalize(record.location);
    if (location) meta.push(`Location: ${location}`);
    return meta.slice(0, 4);
}

function renderLOCListCard(record) {
    const node = elements.locTemplate.content.firstElementChild.cloneNode(true);
    const preview = node.querySelector('.result-card__preview');
    const title = node.querySelector('.result-card__title');
    const meta = node.querySelector('.result-card__meta');
    const description = node.querySelector('.result-card__description');
    const link = node.querySelector('.result-card__link');
    const detailsBtn = node.querySelector('.result-card__details');

    title.textContent = normalize(record.title) || 'Untitled record';
    if (record.__isNew && state.showNewOnly) {
        const badge = document.createElement('span');
        badge.className = 'badge-new';
        badge.textContent = 'NEW';
        title.appendChild(badge);
    }

    const descriptionSource = record.description || record.extract || record.summary;
    if (descriptionSource) {
        const text = Array.isArray(descriptionSource) ? descriptionSource[0] : descriptionSource;
        description.textContent = text.length > 280 ? `${text.slice(0, 280)}...` : text;
    } else {
        description.textContent = 'No summary available.';
    }

    const imageSources = record.image_url || record.resources?.map(r => r.files?.[0]?.url).filter(Boolean);
    if (imageSources && imageSources.length) {
        const img = new Image();
        img.src = imageSources[0];
        img.alt = record.title || 'Record preview';
        preview.textContent = '';
        preview.appendChild(img);
    } else {
        preview.textContent = 'No preview';
    }

    meta.innerHTML = '';
    buildMetaList(record).forEach(item => {
        const el = document.createElement('li');
        el.textContent = item;
        meta.appendChild(el);
    });

    link.href = record.id || record.url || '#';
    detailsBtn.dataset.recordId = record.id || '';
    return node;
}

function renderPPOCListCard(record) {
    const node = elements.ppocTemplate.content.firstElementChild.cloneNode(true);
    const preview = node.querySelector('.result-card__preview');
    const title = node.querySelector('.result-card__title');
    const meta = node.querySelector('.result-card__meta');
    const description = node.querySelector('.result-card__description');
    const link = node.querySelector('.result-card__link');
    const detailsBtn = node.querySelector('.result-card__details');

    title.textContent = normalize(record.title) || 'Untitled image';
    if (record.__isNew && state.showNewOnly) {
        const badge = document.createElement('span');
        badge.className = 'badge-new';
        badge.textContent = 'NEW';
        title.appendChild(badge);
    }
    const caption = record.created_published_date || record.medium || record.created || record.created_published_note;
    description.textContent = normalize(caption) || 'No descriptive caption available.';

    const imageSource = record.image?.full || record.image?.thumb || record.image?.square;
    if (imageSource) {
        const img = new Image();
        img.src = imageSource;
        img.alt = record.image?.alt || record.title || 'Image preview';
        preview.textContent = '';
        preview.appendChild(img);
    } else {
        preview.textContent = 'No preview';
    }

    meta.innerHTML = '';
    const metaEntries = [];
    if (record.medium) metaEntries.push(record.medium);
    if (record.call_number) metaEntries.push(`Call no.: ${record.call_number}`);
    if (record.reproduction_number) metaEntries.push(`Repro #: ${record.reproduction_number}`);
    if (record.collection?.length) metaEntries.push(`Collection: ${record.collection.join(', ')}`);
    metaEntries.slice(0, 4).forEach(item => {
        const el = document.createElement('li');
        el.textContent = item;
        meta.appendChild(el);
    });

    link.href = record.links?.item || '#';
    detailsBtn.dataset.recordId = record.links?.item || String(record.pk);
    return node;
}

function renderGalleryCard({ title, imageSrc, imageCandidates, alt, recordId }) {
    const node = elements.galleryTemplate.content.firstElementChild.cloneNode(true);
    const imageContainer = node.querySelector('.gallery-card__image');
    const titleEl = node.querySelector('.gallery-card__title');
    const detailsBtn = node.querySelector('.gallery-card__details');
    const overlay = node.querySelector('.gallery-card__overlay');

    // Enforce uniform square tiles regardless of source image aspect ratio
    try {
        node.style.aspectRatio = '1 / 1';
        node.style.minHeight = '0';
        imageContainer.style.width = '100%';
        imageContainer.style.height = '100%';
    } catch (e) {
        // Older browsers may ignore aspect-ratio; safe to ignore
    }

    const candidates = Array.isArray(imageCandidates) && imageCandidates.length
        ? imageCandidates.filter(Boolean)
        : (imageSrc ? [imageSrc] : []);
    if (candidates.length) {
        const link = document.createElement('a');
        link.href = recordId || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        link.style.display = 'block';
        link.style.width = '100%';
        link.style.height = '100%';
        const img = new Image();
        img.alt = alt || title || 'Preview';
        img.loading = 'lazy';
        img.decoding = 'async';
        let idx = 0;
        const tryNext = () => {
            if (idx >= candidates.length) {
                imageContainer.textContent = 'No preview';
                return;
            }
            const url = String(candidates[idx++] || '');
            // prefer https
            img.src = url.startsWith('http://') ? url.replace('http://', 'https://') : url;
        };
        img.onerror = () => tryNext();
        imageContainer.textContent = '';
        link.appendChild(img);
        imageContainer.appendChild(link);
        tryNext();
    } else {
        imageContainer.textContent = 'No preview';
    }

    titleEl.textContent = normalize(title) || 'Untitled record';
    node.dataset.recordId = recordId;
    detailsBtn.dataset.recordId = recordId;
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 160ms ease';
        node.addEventListener('mouseenter', () => { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; });
        node.addEventListener('mouseleave', () => { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; });
        node.addEventListener('focusin', () => { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; });
        node.addEventListener('focusout', () => { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; });
    }
    // NEW badge on overlay corner if record is new
    const rec = state.rawResults.find(r => r.__recordId === recordId);
    if (rec?.__isNew && state.showNewOnly) {
        const badge = document.createElement('span');
        badge.className = 'badge-new badge-new--overlay';
        badge.textContent = 'NEW';
        node.appendChild(badge);
    }
    return node;
}

function pickLOCCandidates(record) {
    let urls = [];
    if (Array.isArray(record.image_url)) urls = urls.concat(record.image_url);
    if (Array.isArray(record.resources)) {
        record.resources.forEach(r => {
            if (r?.files?.[0]?.url) urls.push(r.files[0].url);
            if (r?.url) urls.push(r.url);
        });
    }
    // Deduplicate and prefer common image extensions first
    const seen = new Set();
    const clean = [];
    urls.forEach(u => {
        if (!u || seen.has(u)) return;
        seen.add(u);
        clean.push(u);
    });
    const extRe = /(\.jpg|\.jpeg|\.png|\.webp)(\?|$)/i;
    const hiRe = /(large|download|full|orig|master)/i;
    const preferred = clean.filter(u => extRe.test(u)).sort((a, b) => (hiRe.test(b) ? 1 : 0) - (hiRe.test(a) ? 1 : 0));
    const others = clean.filter(u => !extRe.test(u));
    return preferred.concat(others);
}

function renderResults() {
    const usingGallery = state.view === 'gallery';
    elements.resultsList.classList.toggle('is-gallery', usingGallery);
    // Enforce fixed-size square tiles when in gallery view
    if (usingGallery) {
        GALLERY_TILE_PX = getGalleryTilePx();
        elements.resultsList.style.gridTemplateColumns = `repeat(auto-fill, ${GALLERY_TILE_PX}px)`;
        elements.resultsList.style.justifyContent = 'center';
        elements.resultsList.style.alignContent = 'start';
        elements.resultsList.style.gap = '12px';
    } else {
        elements.resultsList.style.gridTemplateColumns = '';
        elements.resultsList.style.justifyContent = '';
        elements.resultsList.style.alignContent = '';
        elements.resultsList.style.gap = '';
    }
    elements.resultsList.innerHTML = '';

    if (!state.filteredResults.length) {
        const copy = getPlaceholderCopy();
        renderPlaceholder(copy.title, copy.message);
        return;
    }
    // For very large pages, incrementally render to keep UI responsive
    const needsChunking = usingGallery && state.filteredResults.length > 1200;
    if (!needsChunking) {
        const fragment = document.createDocumentFragment();
        state.filteredResults.forEach(record => {
            if (state.source === 'ppoc') {
                if (usingGallery) {
                    fragment.appendChild(renderGalleryCard({
                        title: record.title,
                        imageCandidates: [record.image?.full, record.image?.thumb, record.image?.square].filter(Boolean),
                        alt: record.image?.alt || record.title || 'Image preview',
                        recordId: record.links?.item || String(record.pk)
                    }));
                } else {
                    fragment.appendChild(renderPPOCListCard(record));
                }
            } else {
                if (usingGallery) {
                    const candidates = pickLOCCandidates(record);
                    fragment.appendChild(renderGalleryCard({
                        title: record.title,
                        imageCandidates: candidates,
                        alt: record.title || 'Record preview',
                        recordId: record.id || record.url || ''
                    }));
                } else {
                    fragment.appendChild(renderLOCListCard(record));
                }
            }
        });
        elements.resultsList.appendChild(fragment);
    } else {
        const batch = 200;
        let i = 0;
        const total = state.filteredResults.length;
        function renderNextBatch() {
            const fragment = document.createDocumentFragment();
            const end = Math.min(i + batch, total);
            for (let idx = i; idx < end; idx++) {
                const record = state.filteredResults[idx];
                if (state.source === 'ppoc') {
                    fragment.appendChild(renderGalleryCard({
                        title: record.title,
                        imageCandidates: [record.image?.full, record.image?.thumb, record.image?.square].filter(Boolean),
                        alt: record.image?.alt || record.title || 'Image preview',
                        recordId: record.links?.item || String(record.pk)
                    }));
                } else {
                    const candidates = pickLOCCandidates(record);
                    fragment.appendChild(renderGalleryCard({
                        title: record.title,
                        imageCandidates: candidates,
                        alt: record.title || 'Record preview',
                        recordId: record.id || record.url || ''
                    }));
                }
            }
            elements.resultsList.appendChild(fragment);
            i = end;
            elements.status.textContent = `Rendering gallery… ${i}/${total}`;
            if (i < total) {
                requestAnimationFrame(renderNextBatch);
            } else {
                elements.status.textContent = 'Ready.';
            }
        }
        requestAnimationFrame(renderNextBatch);
    }
    updateNewControls();
}

function updatePaginationControls() {
    elements.prevPage.disabled = state.page <= 1;
    elements.nextPage.disabled = state.page >= state.pages;
    elements.pageIndicator.textContent = `Page ${state.page} of ${state.pages}`;
}

function updateSummary(response, filteredCount) {
    if (state.source === 'ppoc') {
        const hits = response?.search?.hits ?? state.total;
        elements.summary.textContent = `Showing ${state.filteredResults.length} image${state.filteredResults.length === 1 ? '' : 's'} on this page | Total matches: ${hits.toLocaleString()}`;
    } else {
        const count = response?.results?.length ?? state.rawResults.length ?? 0;
        elements.summary.textContent = `Showing ${filteredCount} of ${count} records on this page | Total matches: ${state.total.toLocaleString()}`;
    }
}

function filterLOCResults(response, hasLocation) {
    const results = (response.results || []).map(r => r);
    // In gallery view, prefer showing only items with image-like content
    if (state.view === 'gallery') {
        let filtered = results.filter(record => {
            const hasImage = Array.isArray(record.image_url) && record.image_url.length;
            const hasResourceImage = Array.isArray(record.resources) && record.resources.some(r => r.files?.[0]?.url || r.url);
            return hasImage || hasResourceImage;
        });
        if (ENABLE_LOCAL_NEWNESS && state.showNewOnly) filtered = filtered.filter(r => r.__isNew);
        state.filteredResults = filtered;
        return state.filteredResults.length;
    }
    if (!hasLocation) {
        state.filteredResults = (ENABLE_LOCAL_NEWNESS && state.showNewOnly) ? results.filter(r => r.__isNew) : results;
        return state.filteredResults.length;
    }
    let filtered = results.filter(record => {
        const hasImage = Array.isArray(record.image_url) && record.image_url.length;
        const hasOnlineFormat = Array.isArray(record.online_format) && record.online_format.length;
        const hasResources = Array.isArray(record.resources) && record.resources.some(r => r.files?.[0]?.url || r.url);
        return hasImage || hasOnlineFormat || hasResources;
    });
    if (ENABLE_LOCAL_NEWNESS && state.showNewOnly) filtered = filtered.filter(r => r.__isNew);
    state.filteredResults = filtered;
    return state.filteredResults.length;
}

function filterPPOCResults(response) {
    let filtered = (response.results || []).filter(record => (
        record.image?.full || record.image?.thumb || record.image?.square
    ));
    if (ENABLE_LOCAL_NEWNESS && state.showNewOnly) filtered = filtered.filter(r => r.__isNew);
    state.filteredResults = filtered;
    return state.filteredResults.length;
}

async function executeLOCSearch(formData, page) {
    const url = buildLOCSearchUrl(formData, page);
    const headers = state.apiKey ? { Authorization: `Bearer ${state.apiKey}` } : {};

    let payload;
    if (state.cache.has(url)) {
        payload = state.cache.get(url);
        elements.status.textContent = `Loaded cached results for page ${page}.`;
    } else {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`LOC responded with status ${response.status}`);
        payload = await response.json();
        state.cache.set(url, payload);
    }

    state.rawResults = payload.results || [];
    markResultsNewness(formData);
    const visibleCount = filterLOCResults(payload, formData.hasLocation);
    renderResults();
    state.total = payload.pagination?.total || payload.results?.length || visibleCount;
    state.page = payload.pagination?.current || page;
    state.pages = payload.pagination?.total_pages || Math.max(1, Math.ceil(state.total / state.pageSize));
    updateSummary(payload, visibleCount);
    updatePaginationControls();

    if (!state.cache.has(url) && state.page < state.pages) {
        prefetchPage(formData, page + 1, headers);
    }
    elements.status.textContent = `Loaded ${visibleCount} item${visibleCount === 1 ? '' : 's'} from page ${state.page}.`;
}

async function executePPOCSearch(formData, page) {
    const url = buildPPOCSearchUrl(formData, page);

    let payload;
    if (state.cache.has(url)) {
        payload = state.cache.get(url);
        elements.status.textContent = `Loaded cached imagery for page ${page}.`;
    } else {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`PPOC responded with status ${response.status}`);
        payload = await response.json();
        state.cache.set(url, payload);
    }

    state.rawResults = payload.results || [];
    markResultsNewness(formData);
    const visibleCount = filterPPOCResults(payload);
    renderResults();
    state.total = payload.search?.hits || payload.results?.length || visibleCount;
    state.page = payload.pages?.current || page;
    state.pages = payload.pages?.total || Math.max(1, Math.ceil(state.total / state.pageSize));
    updateSummary(payload, visibleCount);
    updatePaginationControls();

    if (!state.cache.has(url) && state.page < state.pages) {
        prefetchPage(formData, page + 1);
    }
    elements.status.textContent = `Loaded ${visibleCount} image${visibleCount === 1 ? '' : 's'} from page ${state.page}.`;
}

async function executeSearch(page = 1) {
    const formData = serializeForm();
    if (!formData.query) {
        elements.status.textContent = 'Enter a search term to begin.';
        elements.query.focus();
        return;
    }

    state.pageSize = formData.pageSize;
    setLoading(true);
    elements.summary.textContent = '';

    try {
        if (formData.source === 'ppoc') {
            await executePPOCSearch(formData, page);
        } else {
            await executeLOCSearch(formData, page);
        }
    } catch (error) {
        console.error('Search failed', error);
        renderPlaceholder('Request failed', error.message);
        if (state.lastRequestUrl) {
            const info = document.createElement('p');
            info.className = 'results-placeholder__url';
            info.textContent = state.lastRequestUrl;
            elements.resultsList.firstChild?.appendChild(info);
        }
        elements.summary.textContent = '';
        elements.status.textContent = 'Search failed.';
    } finally {
        setLoading(false);
    }
}

function resetForm() {
    elements.form.reset();
    elements.pageSize.value = '20';
    state.page = 1;
    state.pages = 1;
    state.pageSize = 20;
    state.rawResults = [];
    state.filteredResults = [];
    state.cache.clear();
    state.prefetching.clear();
    elements.summary.textContent = '';
    const copy = getPlaceholderCopy();
    renderPlaceholder(copy.title, copy.message);
    elements.status.textContent = 'Ready.';
    updatePaginationControls();
}

function findRecordById(id) {
    if (state.source === 'ppoc') {
        return state.rawResults.find(record =>
            record.links?.item === id || String(record.pk) === id
        );
    }
    return state.rawResults.find(record => record.id === id || record.url === id);
}

function openDetails(record) {
    if (!record) return;
    elements.dialogTitle.textContent = record.title || 'Record details';
    const dl = document.createElement('dl');

    const entries = state.source === 'ppoc'
        ? [
            ['Title', record.title],
            ['Created/Published', record.created_published_date || record.created],
            ['Medium', record.medium],
            ['Call Number', record.call_number],
            ['Reproduction Number', record.reproduction_number],
            ['Collection', record.collection ? record.collection.join(', ') : null],
            ['Subjects', record.subjects ? record.subjects.join(', ') : null],
            ['Primary Link', record.links?.item]
        ]
        : [
            ['Title', record.title],
            ['Date', record.date],
            ['Description', Array.isArray(record.description) ? record.description.join(' ') : record.extract],
            ['Subjects', record.subject],
            ['Creators', record.creator],
            ['Location', record.location],
            ['Collection', record.collection_title],
            ['Online Formats', record.online_format],
            ['Primary Link', record.id]
        ];

    entries.forEach(([label, value]) => {
        if (!value) return;
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = normalize(value);
        dl.appendChild(dt);
        dl.appendChild(dd);
    });

    elements.dialogContent.innerHTML = '';
    if (state.source === 'ppoc' && record.image?.full) {
        const img = document.createElement('img');
        img.className = 'detail-dialog__image';
        img.src = record.image.full;
        img.alt = record.image.alt || record.title || 'Large preview';
        elements.dialogContent.appendChild(img);
    }
    elements.dialogContent.appendChild(dl);
    if (typeof elements.dialog.showModal === 'function') {
        elements.dialog.showModal();
    }
}

function prefetchPage(formData, page, headers = {}) {
    const url = formData.source === 'ppoc'
        ? buildPPOCSearchUrl(formData, page)
        : buildLOCSearchUrl(formData, page);

    if (state.cache.has(url) || state.prefetching.has(url)) return;
    state.prefetching.add(url);
    fetch(url, headers && Object.keys(headers).length ? { headers } : undefined)
        .then(response => response.ok ? response.json() : Promise.reject(new Error(`Prefetch failed with status ${response.status}`)))
        .then(data => state.cache.set(url, data))
        .catch(err => console.debug('Prefetch error:', err.message))
        .finally(() => state.prefetching.delete(url));
}

function setupEventListeners() {
    elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        state.page = 1;
        state.cache.clear();
        executeSearch(1);
    });

    elements.resetButton.addEventListener('click', resetForm);

    elements.prevPage.addEventListener('click', () => {
        if (state.page > 1) executeSearch(state.page - 1);
    });

    elements.nextPage.addEventListener('click', () => {
        if (state.page < state.pages) executeSearch(state.page + 1);
    });

    elements.resultsList.addEventListener('click', (event) => {
        const trigger = event.target.closest('.result-card__details, .gallery-card__details');
        let recordId = trigger?.dataset.recordId;
        if (!recordId && state.view === 'gallery') {
            const card = event.target.closest('.gallery-card');
            recordId = card?.dataset.recordId;
            // If clicking a gallery card (not the details button), open the primary link directly
            const clickedDetails = event.target.closest('.gallery-card__details');
            if (card && !clickedDetails && recordId) {
                try { window.open(recordId, '_blank', 'noopener'); } catch {}
                return;
            }
        }
        if (!recordId) return;
        const record = findRecordById(recordId);
        openDetails(record);
    });

    elements.closeDialog.addEventListener('click', () => {
        if (elements.dialog.open) elements.dialog.close();
    });

    elements.dialog.addEventListener('click', (event) => {
        const rect = elements.dialog.getBoundingClientRect();
        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        ) {
            elements.dialog.close();
        }
    });

    elements.saveKey.addEventListener('click', saveApiKey);

    elements.apiInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') saveApiKey();
    });

    elements.pageSize.addEventListener('change', () => {
        state.pageSize = Number(elements.pageSize.value) || 20;
        state.cache.clear();
        if (state.rawResults.length) executeSearch(1);
    });

    elements.sourceButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedSource = button.dataset.source;
            setSource(selectedSource);
            if (elements.query.value.trim()) {
                state.cache.clear();
                executeSearch(1);
            }
        });
    });

    elements.listViewBtn?.addEventListener('click', () => setView('list'));
    elements.galleryViewBtn?.addEventListener('click', () => setView('gallery'));
}

function init() {
    injectCompactStyles();
    loadTheme();
    loadApiKey();
    loadSeenIndex();
    setupEventListeners();
    updatePaginationControls();
    if (elements.galleryViewBtn) {
        elements.galleryViewBtn.disabled = false;
    }
    ensurePageSizeOptions();
    updateViewButtons();
    const copy = getPlaceholderCopy();
    renderPlaceholder(copy.title, copy.message);
    elements.status.textContent = 'Ready.';
    setApiIndicator(!!state.apiKey);
    updateCompactMode();
    updateSearchPanelMaxHeight();
    window.addEventListener('resize', () => { updateCompactMode(); updateSearchPanelMaxHeight(); });
    ensureNewControls();
    updateNewControls();
    ensureThemeToggle();
    const panel = document.querySelector('.search-panel');
    if (panel) panel.classList.add('is-compactnarrow');
    applySearchPanelCondensed();
    applySearchPanelUltraCondensed();
}

init();
