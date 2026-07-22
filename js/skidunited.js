//YES THIS IS SKIDDED PLZ DONT HANG ME

let searchData = [];
let searchIndexPromise = null;

// ═══════════════════════════════════════════
//  BASE PATH — derived from this script's URL
//  so nav, search, and assets work from any page depth
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
//  NAV INJECTION
// ═══════════════════════════════════════════

function buildNav() {
    const placeholder = document.getElementById('wiki-nav');
    if (!placeholder) return;

    const p = window.location.pathname;
    const link = (href, label) => {
        const url = wikiUrl(href);
        const cls = (p === url || p.endsWith(href)) ? ' class="active"' : '';
        return `<li><a href="${url}"${cls}>${label}</a></li>`;
    };

    placeholder.outerHTML = `
<header class="navbar" aria-label="Site header">
  <div class="logo">
    <a href="${wikiUrl('index.html')}" class="wiki-brand">
      <img src="${wikiUrl('assests/nsg-logo.png')}" alt="NSG logo" class="wiki-brand-logo" width="38" height="38">
      <span class="wiki-site-logo">Neo Shredder Group WIKI</span>
    </a>
  </div>
  <div class="nav-right">
    <ul class="nav-links">
      ${link('index.html', 'Main Page')}
      ${link('pages/shredderhub.html', 'ShredderHub')}
      ${link('pages/techmanifest.html', 'TechManifest')}
    </ul>
    <div class="search-container">
      <input type="text" id="wiki-search" placeholder="Search wiki..." autocomplete="off" aria-label="Search wiki">
      <div id="wiki-results" class="search-results-box" role="listbox"></div>
    </div>
  </div>
</header>`;
}

function buildSidebar() {
    if (document.getElementById('wiki-sidebar')) return;

    const main = document.querySelector('main.wiki-container');
    if (!main) return;

    const p = window.location.pathname;
    const sideLink = (href, label) => {
        const url = wikiUrl(href);
        const cls = (p === url || p.endsWith(href)) ? ' class="active"' : '';
        return `<li><a href="${url}"${cls}>${label}</a></li>`;
    };

    const sidebar = document.createElement('aside');
    sidebar.id = 'wiki-sidebar';
    sidebar.className = 'wiki-sidebar';
    sidebar.setAttribute('aria-label', 'Site navigation');
    sidebar.innerHTML = `
<div class="wiki-sidebar-block">
  <div class="wiki-sidebar-head">Navigation</div>
  <ul>
    ${sideLink('index.html', 'Main Page')}
    ${sideLink('pages/shredderhub.html', 'ShredderHub')}
    ${sideLink('pages/techmanifest.html', 'TechManifest')}
    ${sideLink('registery.html', 'Registry')}
  </ul>
</div>
<div class="wiki-sidebar-block">
  <div class="wiki-sidebar-head">Shredder Modules</div>
  <ul>
    ${sideLink('pages/shreds/massless.html', 'Massless')}
    ${sideLink('pages/shreds/gyrocore.html', 'Gyro Cores')}
    ${sideLink('pages/shreds/armorinfo.html', 'Armor Info')}
    ${sideLink('pages/shreds/blades.html', 'Blades')}
    ${sideLink('pages/shreds/movementmechanics.html', 'Movement')}
  </ul>
</div>
<div class="wiki-sidebar-block">
  <div class="wiki-sidebar-head">Toolbox</div>
  <ul>
    <li><a href="${wikiUrl('pages/misc/TemplateAI.html')}">Article Template</a></li>
    <li><a href="https://discord.gg/89gEYNR7zd" target="_blank" rel="noopener noreferrer">Discord</a></li>
  </ul>
</div>`;

    const wrap = document.createElement('div');
    wrap.className = 'wiki-page-wrap';

    const column = document.createElement('div');
    column.className = 'wiki-content-column';

    main.parentNode.insertBefore(wrap, main);
    wrap.appendChild(sidebar);
    column.appendChild(main);
    wrap.appendChild(column);
}

function buildSiteNotice() {
    const path = window.location.pathname;
    const homeUrl = wikiUrl('index.html');
    const isHomePage = path === homeUrl || path.endsWith('index.html') || path.endsWith('/');
    if (!isHomePage) return;

    const main = document.querySelector('main.wiki-container');
    if (!main || main.querySelector('.wiki-site-notice')) return;

    const notice = document.createElement('div');
    notice.className = 'wiki-site-notice';
    notice.innerHTML = '<strong>Neo Shredder Group WIKI</strong> — Plane Crazy shredder &amp; tech documentation. Read the rules, hate all omnis responsibly.';
    main.insertBefore(notice, main.firstChild);
}

// ═══════════════════════════════════════════
//  FOOTER INJECTION
// ═══════════════════════════════════════════

function buildFooter() {
    const el = document.getElementById('wiki-footer');
    if (!el) return;

    el.innerHTML = `<div class="credits-container">
    <div class="credit-category central-feature">
        <strong><span class="wiki-title-shimmer">Repository Contributors:</span></strong>
        <div class="credit-member">
            <span class="member-name">platform2 (759825779974209616)</span>
            <small class="credit-note">Main coder, page writing, design.</small>
        </div>
        <div class="credit-member">
            <span class="member-name">peacekeepe_r (850394478895300629)</span>
            <small class="credit-note">Main writer, main design, minor coding.</small>
        </div>
        <div class="credit-member">
            <span class="member-name">killer_meetball. (1457422090688008381)</span>
            <small class="credit-note">Optimzed whole Wiki, Redesigned whole Wiki.</small>
        </div>
    </div>

    <div class="credits-row">
        <div class="credit-category">
            <strong>Major Contributors:</strong>
            <div class="credit-member">
                <span class="member-name">kameon</span>
                <small class="credit-note">Fully influenced the style of writing.</small>
            </div>
            <div class="credit-member">
                <span class="member-name">IntegrativeGenesis</span>
                <small class="credit-note">Provided history almost fully lost to time.</small>
            </div>
        </div>

        <div class="credit-category">
            <strong>Writers:</strong>
            <div class="credit-member">
                <span class="member-name">kameon</span>
                <small class="credit-note">Writing, design assets, "beta testing" and major corrections.</small>
            </div>
            <div class="credit-member">
                <span class="member-name">peacekeepe_r</span>
                <small class="credit-note">Most of the shredder-side, rewriting</small>
            </div>
            <div class="credit-member">
                <span class="member-name">platform2</span>
                <small class="credit-note">Drafting and writing shredder pages.</small>
            </div>
            <div class="credit-member">
                <span class="member-name">goober</span>
                <small class="credit-note">Assistance with shredder writing.</small>
            </div>
        </div>

        <div class="credit-category">
            <strong>Contributors:</strong>
            <div class="credit-member">
                <span class="member-name">glitchedtm</span>
                <small class="credit-note">Natural Selection.</small>
            </div>
            <div class="credit-member">
                <span class="member-name">legallypvid</span>
                <small class="credit-note">Tech info, minor writing.</small>
            </div>
        </div>
    </div>
</div>

<hr>
<p style="text-align: center;">Made for the <a href="https://discord.gg/89gEYNR7zd" target="_blank" rel="noopener noreferrer">Neo Shredder Group Discord</a></p>`;
}

// ═══════════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════════

function loadSearchIndex() {
    if (!searchIndexPromise) {
        searchIndexPromise = fetch(wikiUrl('data/search-index.json'))
            .then(r => {
                if (!r.ok) throw new Error('Could not load search index: ' + r.status);
                return r.json();
            })
            .then(data => {
                searchData = Array.isArray(data) ? data : [];
                console.log('[wiki-search] loaded', searchData.length, 'pages');
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

function initWikiSearch() {
    loadSearchIndex();

    const searchInput = document.getElementById('wiki-search');
    if (!searchInput) {
        console.error('[wiki-search] input element not found in DOM');
        return;
    }

    const debouncedSearch = debounce(runWikiSearch, 120);

    searchInput.addEventListener('input', debouncedSearch);
    searchInput.addEventListener('focus', runWikiSearch);

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container')) {
            const box = document.getElementById('wiki-results');
            if (box) box.innerHTML = '';
        }
    });

    loadSearchIndex().then(() => {
        if (document.activeElement === searchInput) {
            runWikiSearch();
        }
    });
}

function pageMatchesQuery(page, query) {
    const matchesTitle = page.title.toLowerCase().includes(query);
    const snippet = normalizeSnippet(page.snippet).toLowerCase();
    const matchesSnippet = snippet.includes(query);
    const tags = Array.isArray(page.tags) ? page.tags : [];
    const matchesTags = tags.some(tag => String(tag).toLowerCase().includes(query));
    return matchesTitle || matchesSnippet || matchesTags;
}

function runWikiSearch() {
    const input = document.getElementById('wiki-search');
    const resultsContainer = document.getElementById('wiki-results');
    if (!input || !resultsContainer) return;

    const query = input.value.trim().toLowerCase();

    if (!searchData.length) {
        resultsContainer.innerHTML = '<div style="padding:10px;">Loading…</div>';
        loadSearchIndex().then(runWikiSearch);
        return;
    }

    const results = query === ''
        ? searchData.slice(0, 8)
        : searchData.filter(page => pageMatchesQuery(page, query));

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:10px; font-size:12px; color:#999;">No pages found</div>';
        return;
    }

    const basePath = getWikiBasePath();

    resultsContainer.innerHTML = results.map(page => {
        const cleanUrl = String(page.url).replace(/^\//, '');
        const catHtml = page.categories?.length
            ? `<div class="wiki-categories">${page.categories.map(c => `<span class="wiki-cat">${c}</span>`).join('')}</div>`
            : '';
        return `<a href="${basePath}${cleanUrl}" class="search-item">
            <strong>${page.title}</strong>
            <span>${normalizeSnippet(page.snippet)}</span>
            ${catHtml}
        </a>`;
    }).join('');
}

// ═══════════════════════════════════════════
//  INIT — order matters: nav/footer first,
//  then search (needs #wiki-search in DOM)
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
    buildNav();
    buildSidebar();
    buildSiteNotice();
    buildFooter();
    initWikiSearch();

    const lazyVideos = document.querySelectorAll('video.lazy-video');
    if (!lazyVideos.length) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
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
        return;
    }

    lazyVideos.forEach(function (video) {
        const src = video.getAttribute('data-src');
        if (src) {
            video.src = src;
            video.removeAttribute('data-src');
        }
    });
});

// ═══════════════════════════════════════════
//  EASTER EGG: type "duckless" on the home
//  page to play the secret music
// ═══════════════════════════════════════════

let typedKeys = '';
const secretWord = 'duckless';
let secretAudio = null;

document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    const path = window.location.pathname;
    const homeUrl = wikiUrl('index.html');
    const isHomePage = path === homeUrl || path.endsWith('index.html') || path.endsWith('/');

    if (!isHomePage) return;
    if (e.key.length !== 1) return;

    typedKeys += e.key.toLowerCase();
    if (typedKeys.length > secretWord.length) {
        typedKeys = typedKeys.slice(-secretWord.length);
    }

    if (typedKeys === secretWord) {
        if (!secretAudio) {
            secretAudio = new Audio(wikiUrl('assests/secretmusic.mp3'));
        }
        secretAudio.currentTime = 0;
        secretAudio.play().catch(err => console.error('Error playing secret music:', err));
        typedKeys = '';
    }
});
