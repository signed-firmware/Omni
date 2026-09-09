/* ═══════════════════════════════════════════════════════════════
   NEO SHREDDER GROUP WIKI — shell
   Injects the modern documentation shell on every page:
   navbar, collapsible sidebar, on-this-page rail, breadcrumbs,
   prev/next pager, command-palette search, theme toggle,
   cursor glow + card spotlights, copy buttons, easter eggs.
   ═══════════════════════════════════════════════════════════════ */

const DISCORD_URL = 'https://discord.gg/89gEYNR7zd';
const THEME_KEY = 'wiki-theme';
const NAV_KEY = 'wiki-nav-collapsed';
const GUBBY_KEY = 'wiki-gubby-mode';

/* ── Site navigation. Order defines prev/next pager order. ── */
const NAV = [
    {
        label: 'Getting Started',
        items: [
            { label: 'Home', url: 'index.html' },
            { label: 'Ask a Pro', url: 'pages/askapro.html' }
        ]
    },
    {
        label: 'Portals',
        items: [
            { label: 'Shredder Hub', url: 'pages/shredderhub.html' },
            { label: 'Tech Manifest', url: 'pages/techmanifest.html' },
            { label: 'History Portal', url: 'pages/historyportal.html' },
            { label: 'Registry', url: 'pages/registery.html' }
        ]
    },
    {
        label: 'Shredder Guides',
        items: [
            { label: 'Massless & Staging', url: 'pages/shreds/massless.html' },
            { label: 'Gyro Cores', url: 'pages/shreds/gyrocore.html' },
            { label: 'Armor Info', url: 'pages/shreds/armorinfo.html' },
            { label: 'Blades', url: 'pages/shreds/blades.html' },
            { label: 'Movement Mechanics', url: 'pages/shreds/movementmechanics.html' },
            { label: 'Axis Locks', url: 'pages/shreds/axislocks.html' },
            { label: 'Health', url: 'pages/shreds/health.html' },
            { label: 'Materials', url: 'pages/shreds/materials.html' },
            { label: 'Optimisation', url: 'pages/shreds/optimisation.html' },
            { label: 'Skeletonisation', url: 'pages/shreds/skeletonisation.html' },
            { label: 'Hyper Motor2s', url: 'pages/shreds/hyperm2.html' },
            { label: 'OG Shredders', url: 'pages/shreds/ogs.html' },
            { label: 'Omni Shredders', url: 'pages/shreds/omnis.html' }
        ]
    },
    {
        label: 'Tech',
        items: [
            { label: 'Physics Priority Distribution', url: 'pages/tech/ppd.html' },
            { label: 'Void Tech', url: 'pages/tech/voidtech.html' }
        ]
    },
    {
        label: 'History',
        items: [
            { label: 'History', url: 'pages/history/historypage.html' }
        ]
    },
    {
        label: 'Contributing',
        items: [
            { label: 'Article Template', url: 'pages/misc/Template.html' },
            { label: 'Template AI', url: 'pages/misc/TemplateAI.html' },
            { label: 'Combatants Template', url: 'pages/misc/combatants-template.html' }
        ]
    }
];

/* pages that should never get the right-hand "On this page" rail */
const NO_RAIL_URLS = [
    'index.html',
    'pages/shredderhub.html',
    'pages/techmanifest.html',
    'pages/historyportal.html',
    'pages/registery.html',
    'pages/askapro.html',
    'pages/misc/Template.html',
    'pages/misc/TemplateAI.html',
    'pages/misc/combatants-template.html'
];

/* ═══════════════════════════════════════════════════════════════
   BASE PATH — derived from this script's URL so links and assets
   work from any page depth and under subpath hosting.
   ═══════════════════════════════════════════════════════════════ */

function getWikiBasePath() {
    const script = document.querySelector('script[src*="skidunited.js"]');
    if (script) {
        const scriptUrl = new URL(script.getAttribute('src'), window.location.href);
        const marker = '/js/skidunited.js';
        const idx = scriptUrl.pathname.lastIndexOf(marker);
        if (idx !== -1) {
            return scriptUrl.pathname.slice(0, idx + 1);
        }
    }
    return '/';
}

function wikiUrl(relativePath) {
    const clean = String(relativePath).replace(/^\//, '');
    return getWikiBasePath() + clean;
}

function normalizeSnippet(snippet) {
    if (Array.isArray(snippet)) return snippet.join(', ');
    return String(snippet ?? '');
}

function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

function isCurrentPage(url) {
    const path = window.location.pathname;
    const clean = String(url).replace(/^\//, '');
    const current = path.endsWith('/') ? 'index.html' : path.split('/').pop() || 'index.html';
    return clean.split('/').pop() === current;
}

/* ═══════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════ */

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (err) { /* ignore */ }
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        btn.innerHTML = theme === 'dark'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>';
    });
}

function initTheme() {
    let theme = null;
    try {
        theme = localStorage.getItem(THEME_KEY);
    } catch (err) { /* ignore */ }
    if (theme !== 'dark' && theme !== 'light') {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    applyTheme(theme);
}

/* ═══════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════ */

const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z"/><path d="M14 2.5V7.5h5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>'
};

/* ═══════════════════════════════════════════════════════════════
   SHELL BUILD
   ═══════════════════════════════════════════════════════════════ */

function currentPageInfo() {
    for (let gi = 0; gi < NAV.length; gi++) {
        const group = NAV[gi];
        for (let ii = 0; ii < group.items.length; ii++) {
            if (isCurrentPage(group.items[ii].url)) {
                return { group, groupIndex: gi, item: group.items[ii], itemIndex: ii };
            }
        }
    }
    return null;
}

function buildNavbar() {
    const placeholder = document.getElementById('wiki-nav');
    const nav = document.createElement('header');
    nav.className = 'wiki-navbar';
    nav.setAttribute('role', 'banner');

    const links = [
        { label: 'Wiki', url: 'index.html' },
        { label: 'Shredder Hub', url: 'pages/shredderhub.html' },
        { label: 'Tech', url: 'pages/techmanifest.html' },
        { label: 'History', url: 'pages/historyportal.html' },
        { label: 'Registry', url: 'pages/registery.html' }
    ].map(l => {
        const active = isCurrentPage(l.url) ? ' is-active' : '';
        return `<a class="wiki-navbar__link${active}" href="${wikiUrl(l.url)}">${l.label}</a>`;
    }).join('');

    nav.innerHTML = `
    <div class="wiki-navbar__inner">
      <button class="icon-btn wiki-navbar__burger" id="wiki-burger" aria-label="Open navigation" aria-expanded="false">${ICONS.burger}</button>
      <a class="wiki-navbar__brand" href="${wikiUrl('index.html')}">
        <img class="wiki-navbar__logo" src="${wikiUrl('assests/nsg-logo.png')}" alt="">
        <span class="wiki-navbar__word">Neo Shredder Group<em> &nbsp;Wiki</em></span>
      </a>
      <nav class="wiki-navbar__nav" aria-label="Primary">${links}</nav>
      <div class="wiki-navbar__spacer"></div>
      <div class="wiki-navbar__actions">
        <button class="wiki-search-trigger" id="wiki-search-trigger" aria-label="Search the wiki">
          ${ICONS.search}
          <span class="search-label">Search</span>
          <span class="kbd-hint">${navigator.platform && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K</span>
        </button>
        <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>
        <a class="icon-btn" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer" aria-label="Join the Discord" title="Join the Discord">${ICONS.discord}</a>
      </div>
    </div>`;

    if (placeholder) {
        placeholder.replaceWith(nav);
    } else {
        document.body.insertBefore(nav, document.body.firstChild);
    }

    /* theme toggle: refresh icon + wire up click */
    applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    const toggle = nav.querySelector('[data-theme-toggle]');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }
    return nav;
}

function buildSidebar(current) {
    let collapsed = [];
    try {
        const raw = localStorage.getItem(NAV_KEY);
        if (raw) collapsed = JSON.parse(raw);
    } catch (err) { /* ignore */ }

    const groupsHtml = NAV.map((group, gi) => {
        const isActiveGroup = current && current.groupIndex === gi;
        const open = collapsed.indexOf(gi) === -1; /* default open; collapse via storage */
        const activeItemIndex = isActiveGroup ? current.itemIndex : -1;

        const items = group.items.map((item, ii) => {
            const active = isActiveGroup && activeItemIndex === ii;
            const dot = active ? '' : '<span class="link-dot" aria-hidden="true"></span>';
            return `<li class="wiki-sidebar-item"><a href="${wikiUrl(item.url)}"${active ? ' class="is-active" aria-current="page"' : ''}>${dot}${item.label}</a></li>`;
        }).join('');

        return `
        <div class="wiki-sidebar-group${open ? ' is-open' : ''}" data-nav-group="${gi}">
          <button class="wiki-sidebar-head" aria-expanded="${open ? 'true' : 'false'}">
            <span>${group.label}</span>${ICONS.chev}
          </button>
          <div class="wiki-sidebar-list"><div><ul>${items}</ul></div></div>
        </div>`;
    }).join('');

    const aside = document.createElement('aside');
    aside.className = 'wiki-sidebar';
    aside.setAttribute('aria-label', 'Documentation navigation');
    aside.innerHTML = `
      ${groupsHtml}
      <div class="wiki-sidebar-foot">
        <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">${ICONS.discord} Join the Discord</a>
        <a href="${wikiUrl('index.html')}">${ICONS.file} Back to home</a>
      </div>`;

    /* group toggle with persistence */
    aside.addEventListener('click', e => {
        const head = e.target.closest('.wiki-sidebar-head');
        if (!head) return;
        const groupEl = head.closest('.wiki-sidebar-group');
        const gi = Number(groupEl.dataset.navGroup);
        const isOpen = groupEl.classList.toggle('is-open');
        head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
            collapsed = collapsed.filter(i => i !== gi);
        } else if (collapsed.indexOf(gi) === -1) {
            collapsed.push(gi);
        }
        try {
            localStorage.setItem(NAV_KEY, JSON.stringify(collapsed));
        } catch (err) { /* ignore */ }
    });

    return aside;
}

function buildTocRail() {
    const main = document.querySelector('main.wiki-container');
    if (!main) return null;

    const path = window.location.pathname;
    const pageFile = path.split('/').pop() || 'index.html';
    if (NO_RAIL_URLS.some(u => u.split('/').pop() === pageFile)) return null;
    if (main.querySelector('.wiki-toc-sidebar, .wiki-page-layout')) return null;

    const headings = Array.from(main.querySelectorAll('h2, h3'));
    if (headings.length < 2) return null;

    /* assign ids (keep existing ids; fix broken ids that start with '#') */
    const used = new Set();
    headings.forEach(h => {
        if (h.id) {
            if (h.id.startsWith('#')) h.id = h.id.slice(1);
            used.add(h.id);
            return;
        }
        let slug = h.textContent.trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (!slug) slug = 'section';
        let base = slug, n = 2;
        while (used.has(slug)) slug = base + '-' + (n++);
        used.add(slug);
        h.id = slug;
    });

    /* fix any other elements whose ids start with '#' (toc-box anchors) */
    main.querySelectorAll('[id^="#"]').forEach(el => {
        if (el.id.startsWith('#')) el.id = el.id.slice(1);
    });

    const items = [];
    let currentH2 = null;
    headings.forEach(h => {
        const label = h.textContent.trim();
        if (h.tagName === 'H2') {
            currentH2 = label;
            items.push({ level: 2, label, id: h.id });
        } else if (currentH2) {
            items.push({ level: 3, label, id: h.id });
        }
    });

    if (items.length < 2) return null;

    const rail = document.createElement('aside');
    rail.className = 'wiki-toc-rail';
    rail.setAttribute('aria-label', 'On this page');
    rail.innerHTML = `
      <div class="wiki-toc-rail__label">On this page</div>
      <ul>
        ${items.map((it, i) => `<li><a href="#${it.id}" data-toc-idx="${i}" class="${it.level === 3 ? 'lvl-3' : ''}">${it.label}</a></li>`).join('')}
      </ul>
      <a class="wiki-toc-rail__back" href="#top">${ICONS.arrowUp} Back to top</a>`;

    document.body.classList.add('rail-present');

    /* scrollspy */
    const links = Array.from(rail.querySelectorAll('a[data-toc-idx]'));
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const idx = items.findIndex(it => it.id === entry.target.id);
            if (idx === -1) return;
            links.forEach(l => l.classList.toggle('is-active', Number(l.dataset.tocIdx) === idx));
        });
    }, { rootMargin: '-15% 0px -70% 0px' });
    headings.forEach(h => spy.observe(h));

    /* clicking a rail link scrolls + sets active immediately */
    links.forEach(l => {
        l.addEventListener('click', () => {
            links.forEach(x => x.classList.toggle('is-active', x === l));
        });
    });

    return rail;
}

function buildBreadcrumb(current) {
    const main = document.querySelector('main.wiki-container');
    if (!main || !current || main.querySelector('.wiki-breadcrumb')) return;
    if (isCurrentPage('index.html')) return; /* the home page is the root of the breadcrumb */

    const crumb = document.createElement('nav');
    crumb.className = 'wiki-breadcrumb';
    crumb.setAttribute('aria-label', 'Breadcrumb');
    crumb.innerHTML = `<a href="${wikiUrl('index.html')}">Home</a><span>${current.group.label}</span><span>${current.item.label}</span>`;
    main.insertBefore(crumb, main.firstChild);
}

function buildPrevNext(current) {
    const main = document.querySelector('main.wiki-container');
    if (!main || !current) return;

    /* flatten nav (skip Contributing) into an ordered pager chain */
    const chain = [];
    NAV.forEach(group => {
        if (group.label === 'Contributing') return;
        group.items.forEach(item => chain.push(item));
    });

    const idx = chain.findIndex(item => isCurrentPage(item.url));
    if (idx === -1) return;
    const prev = idx > 0 ? chain[idx - 1] : null;
    const next = idx < chain.length - 1 ? chain[idx + 1] : null;
    if (!prev && !next) return;

    const wrap = document.createElement('nav');
    wrap.className = 'wiki-prevnext';
    wrap.setAttribute('aria-label', 'Page navigation');
    wrap.innerHTML = `
      ${prev ? `<a class="prev" href="${wikiUrl(prev.url)}"><span class="pn-label">${ICONS.arrowLeft} Previous</span><span class="pn-title">${prev.label}</span></a>` : '<span></span>'}
      ${next ? `<a class="next" href="${wikiUrl(next.url)}"><span class="pn-label">Next ${ICONS.arrowRight}</span><span class="pn-title">${next.label}</span></a>` : ''}`;

    main.appendChild(wrap);
}

function buildShell() {
    const main = document.querySelector('main.wiki-container');
    if (!main) return;

    if (isCurrentPage('index.html')) {
        document.body.classList.add('homepage');
    }

    const current = currentPageInfo();

    buildNavbar();
    const sidebar = buildSidebar(current);
    const rail = buildTocRail();
    buildBreadcrumb(current);
    buildPrevNext(current);

    /* wrap main in the shell grid */
    const shell = document.createElement('div');
    shell.className = 'wiki-shell' + (rail ? ' wiki-shell--with-toc' : '');
    main.parentNode.insertBefore(shell, main);
    shell.appendChild(sidebar);
    shell.appendChild(main);
    if (rail) shell.appendChild(rail);

    /* mobile drawer behaviour */
    const burger = document.getElementById('wiki-burger');
    const backdrop = document.createElement('div');
    backdrop.className = 'wiki-drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    function setSidebar(open) {
        document.body.classList.toggle('sidebar-open', open);
        if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) {
            try { localStorage.setItem('wiki-mobile-sidebar', '0'); } catch (e) { /* ignore */ }
        }
    }
    if (burger) burger.addEventListener('click', () => setSidebar(!document.body.classList.contains('sidebar-open')));
    backdrop.addEventListener('click', () => setSidebar(false));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) setSidebar(false);
    });
    sidebar.addEventListener('click', e => {
        if (e.target.closest('a') && window.innerWidth <= 900) setSidebar(false);
    });
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH PALETTE
   ═══════════════════════════════════════════════════════════════ */

let searchData = [];
let searchIndexPromise = null;

function loadSearchIndex() {
    if (!searchIndexPromise) {
        searchIndexPromise = fetch(wikiUrl('data/search-index.json'))
            .then(r => {
                if (!r.ok) throw new Error('Could not load search index: ' + r.status);
                return r.json();
            })
            .then(data => {
                searchData = Array.isArray(data) ? data : [];
                return searchData;
            })
            .catch(err => {
                console.error('[wiki-search] fetch failed:', err);
                searchData = [];
                return searchData;
            });
    }
    return searchIndexPromise;
}

function pageMatchesQuery(page, query) {
    const q = query.toLowerCase();
    const title = String(page.title || '').toLowerCase();
    const snippet = normalizeSnippet(page.snippet).toLowerCase();
    const tags = Array.isArray(page.tags) ? page.tags : [];
    return title.includes(q) || snippet.includes(q) || tags.some(t => String(t).toLowerCase().includes(q));
}

function highlight(text, query) {
    if (!query) return text;
    const esc = text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return esc.replace(new RegExp('(' + q + ')', 'ig'), '<mark>$1</mark>');
}

function buildSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.id = 'wiki-search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search the wiki');
    overlay.innerHTML = `
      <div class="search-palette">
        <div class="search-palette__input-row">
          ${ICONS.search}
          <input class="search-palette__input" id="wiki-search-input" type="text" placeholder="Search pages, guides, tech…" autocomplete="off" spellcheck="false">
          <span class="kbd-hint">esc</span>
        </div>
        <div class="search-palette__results" id="wiki-search-results">
          <div class="search-palette__hint">Type to search the wiki…</div>
        </div>
        <div class="search-palette__footer">
          <span class="kbd-hint">↑↓</span><span>to navigate</span>
          <span class="kbd-hint">↵</span><span>to open</span>
          <span class="spacer"></span>
          <span>Powered by the wiki index</span>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#wiki-search-input');
    const results = overlay.querySelector('#wiki-search-results');
    let selected = -1;
    let currentItems = [];

    function closeSearch() {
        overlay.classList.remove('is-open');
        selected = -1;
        currentItems = [];
    }

    function renderItems(items) {
        currentItems = items;
        selected = -1;
        if (items.length === 0) {
            results.innerHTML = '<div class="search-palette__hint">No pages match that query.</div>';
            return;
        }
        results.innerHTML = items.map((page, i) => `
          <a class="search-palette__item" href="${wikiUrl(String(page.url).replace(/^\//, ''))}" data-idx="${i}">
            <span class="search-palette__item-icon">${ICONS.file}</span>
            <span class="search-palette__item-main">
              <span class="search-palette__item-title">${highlight(page.title || 'Untitled', input.value.trim())}</span>
              <span class="search-palette__item-snippet">${normalizeSnippet(page.snippet)}</span>
            </span>
            ${(page.categories && page.categories.length) ? `<span class="search-palette__item-cats">${page.categories.map(c => `<span class="wiki-cat">${c}</span>`).join('')}</span>` : ''}
          </a>`).join('');
    }

    function runSearch() {
        const query = input.value.trim().toLowerCase();
        if (!searchData.length) {
            results.innerHTML = '<div class="search-palette__hint">Loading index…</div>';
            loadSearchIndex().then(runSearch);
            return;
        }
        if (!query) {
            renderItems(searchData.slice(0, 8));
            return;
        }
        const scored = searchData
            .map(page => {
                const title = String(page.title || '').toLowerCase();
                let score = 0;
                if (title === query) score = 100;
                else if (title.startsWith(query)) score = 80;
                else if (title.includes(query)) score = 60;
                else if (normalizeSnippet(page.snippet).toLowerCase().includes(query)) score = 30;
                else if ((page.tags || []).some(t => String(t).toLowerCase().includes(query))) score = 25;
                return { page, score };
            })
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(x => x.page);
        renderItems(scored);
    }

    const debounced = debounce(runSearch, 110);

    function openSearch() {
        overlay.classList.add('is-open');
        setTimeout(() => input.focus(), 60);
        runSearch();
    }

    function moveSelection(dir) {
        if (!currentItems.length) return;
        selected = (selected + dir + currentItems.length) % currentItems.length;
        results.querySelectorAll('.search-palette__item').forEach(el => {
            el.classList.toggle('is-selected', Number(el.dataset.idx) === selected);
        });
        const active = results.querySelector('.is-selected');
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', debounced);
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const el = selected >= 0
                ? results.querySelector(`.search-palette__item[data-idx="${selected}"]`)
                : results.querySelector('.search-palette__item');
            if (el) window.location.href = el.getAttribute('href');
        } else if (e.key === 'Escape') {
            closeSearch();
            input.blur();
        }
    });
    overlay.addEventListener('mousedown', e => {
        if (e.target === overlay) closeSearch();
    });

    /* triggers */
    document.getElementById('wiki-search-trigger').addEventListener('click', openSearch);
    document.querySelectorAll('[data-open-search]').forEach(el => el.addEventListener('click', openSearch));
    document.addEventListener('keydown', e => {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            if (overlay.classList.contains('is-open')) closeSearch();
            else openSearch();
            return;
        }
        if (e.key === '/' && !/input|textarea/i.test(e.target.tagName) && !e.target.isContentEditable) {
            e.preventDefault();
            openSearch();
        }
    });

    return { openSearch, closeSearch };
}

/* ═══════════════════════════════════════════════════════════════
   CURSOR EFFECTS
   ═══════════════════════════════════════════════════════════════ */

function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initCursorGlow() {
    if (prefersReducedMotion()) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    let target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let pos = { x: target.x, y: target.y };
    let raf = null;

    document.addEventListener('mousemove', e => {
        target.x = e.clientX;
        target.y = e.clientY;
        document.body.classList.add('glow-active');
        if (!raf) {
            raf = requestAnimationFrame(step);
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        document.body.classList.remove('glow-active');
    });

    function step() {
        pos.x += (target.x - pos.x) * 0.16;
        pos.y += (target.y - pos.y) * 0.16;
        glow.style.setProperty('--glow-x', pos.x + 'px');
        glow.style.setProperty('--glow-y', pos.y + 'px');
        if (Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5) {
            raf = requestAnimationFrame(step);
        } else {
            raf = null;
        }
    }
}

function initCardSpotlight() {
    if (prefersReducedMotion()) return;
    const targets = '.card, .wiki-block, .wiki-portal, .hub-category, .home-portal';

    document.addEventListener('pointermove', e => {
        const el = e.target.closest(targets);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });
}

function initHeroParallax() {
    if (prefersReducedMotion()) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const inner = hero.querySelector('.hero__title, .hero__badge');
    document.addEventListener('pointermove', e => {
        const dx = (e.clientX / window.innerWidth - 0.5) * 2;
        const dy = (e.clientY / window.innerHeight - 0.5) * 2;
        hero.style.setProperty('--par-x', (dx * 6) + 'px');
        hero.style.setProperty('--par-y', (dy * 4) + 'px');
    }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════
   COPY BUTTONS
   ═══════════════════════════════════════════════════════════════ */

function initCopyButtons() {
    document.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.copy-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.type = 'button';
        btn.innerHTML = ICONS.copy + '<span>Copy</span>';
        btn.addEventListener('click', async () => {
            const text = pre.innerText.replace(/\n$/, '');
            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                /* fallback for older browsers */
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
                ta.remove();
            }
            btn.classList.add('is-copied');
            btn.innerHTML = ICONS.check + '<span>Copied</span>';
            setTimeout(() => {
                btn.classList.remove('is-copied');
                btn.innerHTML = ICONS.copy + '<span>Copy</span>';
            }, 1800);
        });
        pre.appendChild(btn);
    });
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function buildFooter() {
    const el = document.getElementById('wiki-footer');
    if (!el) return;

    el.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="${wikiUrl('assests/nsg-logo.png')}" alt="">
        <div>
          <strong>Neo Shredder Group Wiki</strong><br>
          <span style="font-size:0.78rem; color:var(--text-muted);">Plane Crazy shredder documentation</span>
        </div>
      </div>
      <div class="footer-links">
        <a href="${wikiUrl('index.html')}">Wiki</a>
        <a href="${wikiUrl('pages/shredderhub.html')}">Shredder Hub</a>
        <a href="${wikiUrl('pages/techmanifest.html')}">Tech Manifest</a>
        <a href="${wikiUrl('pages/historyportal.html')}">History</a>
        <a href="${wikiUrl('pages/registery.html')}">Registry</a>
        <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Discord</a>
      </div>
    </div>

    <details class="footer-credits">
      <summary class="credits-toggle">Repository contributors ${ICONS.chev}</summary>
      <div class="credits-container">
        <div class="credit-category central-feature">
          <strong>Core team</strong>
          <div class="credit-member"><span class="member-name">platform2</span><small class="credit-note">main coder, page writing, design</small></div>
          <div class="credit-member"><span class="member-name">SALAMI</span><small class="credit-note">main writer, design, some coding</small></div>
          <div class="credit-member"><span class="member-name">killer_meetball.</span><small class="credit-note">main designer</small></div>
        </div>
        <div class="credit-category">
          <strong>Major contributors</strong>
          <div class="credit-member"><span class="member-name">kameon</span><small class="credit-note">writing supervisor</small></div>
          <div class="credit-member"><span class="member-name">IntegrativeGenesis</span><small class="credit-note">provided history almost fully lost to time</small></div>
        </div>
        <div class="credit-category">
          <strong>Writers</strong>
          <div class="credit-member"><span class="member-name">kameon</span><small class="credit-note">writing, assets, beta testing, corrections</small></div>
          <div class="credit-member"><span class="member-name">SALAMI</span><small class="credit-note">most of the shredder stuff, rewriting</small></div>
          <div class="credit-member"><span class="member-name">platform2</span><small class="credit-note">drafting and writing shredder pages</small></div>
          <div class="credit-member"><span class="member-name">goober</span><small class="credit-note">helping with shredder writing</small></div>
        </div>
        <div class="credit-category">
          <strong>Contributors</strong>
          <div class="credit-member"><span class="member-name">glitchedtm</span><small class="credit-note">Natural Selection</small></div>
          <div class="credit-member"><span class="member-name">legallypvid</span><small class="credit-note">tech info, some writing</small></div>
        </div>
      </div>
    </details>

    <div class="gubby-footer-row">
      <img src="${wikiUrl('assests/gubby.png')}" alt="" class="gubby-stamp gubby-stamp--footer">
      <p>Made for the <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Neo Shredder Group Discord</a></p>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   EASTER EGGS — type "gubby" for mascot mode,
   type "duckless" on the home page for secret music
   ═══════════════════════════════════════════════════════════════ */

const GUBBY_SECRET_WORD = 'gubby';
const DUCKLESS_WORD = 'duckless';
let gubbyTyped = '';
let ducklessTyped = '';
let secretAudio = null;

function setGubbyMode(on) {
    document.body.classList.toggle('gubby-mode', on);
    try {
        localStorage.setItem(GUBBY_KEY, on ? '1' : '0');
    } catch (err) { /* ignore */ }

    if (on && !document.getElementById('gubby-world')) {
        const world = document.createElement('div');
        world.id = 'gubby-world';
        world.setAttribute('aria-hidden', 'true');
        world.innerHTML = `
          <div class="gubby-pattern"></div>
          <img class="gubby-stamp gubby-decoration gubby-stamp--corner-tl" src="${wikiUrl('assests/gubby.png')}" alt="">
          <img class="gubby-stamp gubby-decoration gubby-stamp--corner-br" src="${wikiUrl('assests/gubby.png')}" alt="">`;
        document.body.appendChild(world);
        document.querySelectorAll('main h1').forEach(h => {
            const img = document.createElement('img');
            img.src = wikiUrl('assests/gubby.png');
            img.alt = '';
            img.className = 'gubby-stamp gubby-stamp--title gubby-decoration';
            h.appendChild(img);
        });
    }
}

function initGubbySavedState() {
    let saved = false;
    try {
        saved = localStorage.getItem(GUBBY_KEY) === '1';
    } catch (err) { saved = false; }
    setGubbyMode(saved);
}

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    buildShell();
    buildFooter();
    initGubbySavedState();
    initCopyButtons();
    buildSearchOverlay();
    initCursorGlow();
    initCardSpotlight();
    initHeroParallax();

    /* lazy video loading */
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    if (lazyVideos.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const video = entry.target;
                const src = video.getAttribute('data-src');
                if (src) {
                    video.src = src;
                    video.removeAttribute('data-src');
                }
                observer.unobserve(video);
            });
        }, { rootMargin: '200px' });
        lazyVideos.forEach(v => observer.observe(v));
    } else {
        lazyVideos.forEach(video => {
            const src = video.getAttribute('data-src');
            if (src) {
                video.src = src;
                video.removeAttribute('data-src');
            }
        });
    }

    /* secret keybinds */
    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.key.length !== 1) return;
        const key = e.key.toLowerCase();

        gubbyTyped += key;
        if (gubbyTyped.length > GUBBY_SECRET_WORD.length) gubbyTyped = gubbyTyped.slice(-GUBBY_SECRET_WORD.length);
        if (gubbyTyped === GUBBY_SECRET_WORD) {
            setGubbyMode(!document.body.classList.contains('gubby-mode'));
            gubbyTyped = '';
            return;
        }

        if (!isCurrentPage('index.html')) return;
        ducklessTyped += key;
        if (ducklessTyped.length > DUCKLESS_WORD.length) ducklessTyped = ducklessTyped.slice(-DUCKLESS_WORD.length);
        if (ducklessTyped === DUCKLESS_WORD) {
            if (!secretAudio) secretAudio = new Audio(wikiUrl('assests/secretmusic.mp3'));
            secretAudio.currentTime = 0;
            secretAudio.play().catch(() => { /* ignore */ });
            ducklessTyped = '';
        }
    });
});
