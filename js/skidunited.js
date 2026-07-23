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
//  SHELL INJECTION — MediaWiki/monobook style:
//  logo top-left above the sidebar, search inside
//  the sidebar, slim tab bar atop the content.
// ═══════════════════════════════════════════

function buildShell() {
    // Remove the legacy top-navbar placeholder if present
    const placeholder = document.getElementById('wiki-nav');
    if (placeholder) placeholder.remove();

    if (document.getElementById('wiki-sidebar')) return;

    const main = document.querySelector('main.wiki-container');
    if (!main) return;

    const p = window.location.pathname;
    const sideLink = (href, label) => {
        const url = wikiUrl(href);
        const cls = (p === url || p.endsWith(href)) ? ' class="active"' : '';
        return `<li><a href="${url}"${cls}>${label}</a></li>`;
    };
    const tabLink = (href, label) => {
        const url = wikiUrl(href);
        const cls = (p === url || p.endsWith(href)) ? ' class="active"' : '';
        return `<li><a href="${url}"${cls}>${label}</a></li>`;
    };

    // ── Sidebar column: logo box on top, then nav blocks ──
    const sidebarCol = document.createElement('div');
    sidebarCol.className = 'wiki-sidebar-column';
    sidebarCol.innerHTML = `
<a href="${wikiUrl('index.html')}" class="wiki-logo-box" title="Main Page">
  <img src="${wikiUrl('assests/nsg-logo.png')}" alt="Neo Shredder Group logo" class="wiki-brand-img">
  <span class="wiki-site-logo wiki-logo-name">Neo Shredder Group Wiki</span>
</a>
<aside id="wiki-sidebar" class="wiki-sidebar" aria-label="Site navigation">
  <div class="wiki-sidebar-block">
    <div class="wiki-sidebar-head">Search</div>
    <div class="wiki-sidebar-search search-container">
      <input type="text" id="wiki-search" placeholder="Search wiki..." autocomplete="off" aria-label="Search wiki">
      <div id="wiki-results" class="search-results-box" role="listbox"></div>
    </div>
  </div>
  <div class="wiki-sidebar-block">
    <div class="wiki-sidebar-head">Navigation</div>
    <ul>
      ${sideLink('index.html', 'Main Page')}
      ${sideLink('pages/shredderhub.html', 'ShredderHub')}
      ${sideLink('pages/techmanifest.html', 'TechManifest')}
      ${sideLink('registery.html', 'Registry')}
      ${sideLink('askapro.html', 'Debugging')}
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
      <li><a href="https://discord.gg/89gEYNR7zd" target="_blank" rel="noopener noreferrer"><svg class="wiki-sidebar-icon wiki-sidebar-icon--discord" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>Discord</a></li>
    </ul>
  </div>
</aside>`;

    // ── Content column: slim tab bar + page content ──
    const column = document.createElement('div');
    column.className = 'wiki-content-column';

    const topbar = document.createElement('div');
    topbar.className = 'wiki-topbar';
    topbar.setAttribute('aria-label', 'Page views');
    topbar.innerHTML = `
<ul class="wiki-topbar-tabs">
  ${tabLink('index.html', 'Main Page')}
  ${tabLink('pages/shredderhub.html', 'ShredderHub')}
  ${tabLink('pages/techmanifest.html', 'TechManifest')}
  ${tabLink('registery.html', 'Registry')}
</ul>`;

    const wrap = document.createElement('div');
    wrap.className = 'wiki-page-wrap';

    main.parentNode.insertBefore(wrap, main);
    wrap.appendChild(sidebarCol);
    column.appendChild(topbar);
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
    notice.innerHTML = '<strong>Neo Shredder Group WIKI</strong> — you should join the <a href="https://discord.gg/89gEYNR7zd" target="_blank" rel="noopener noreferrer">Discord</a> since a wall of text usually can&apos;t fix everything.';
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
            <small class="credit-note">main coder, page writing, design</small>
        </div>
        <div class="credit-member">
            <span class="member-name">SALAMI (850394478895300629)</span>
            <small class="credit-note">main writer, design, some coding</small>
        </div>
        <div class="credit-member">
            <span class="member-name">killer_meetball. (1457422090688008381)</span>
            <small class="credit-note">main designer</small>
        </div>
    </div>

    <div class="credits-row">
        <div class="credit-category">
            <strong>Major Contributors:</strong>
            <div class="credit-member">
                <span class="member-name">kameon</span>
                <small class="credit-note">writing supervisor</small>
            </div>
            <div class="credit-member">
                <span class="member-name">IntegrativeGenesis</span>
                <small class="credit-note">provided history almost fully lost to time</small>
            </div>
        </div>

        <div class="credit-category">
            <strong>Writers:</strong>
            <div class="credit-member">
                <span class="member-name">kameon</span>
                <small class="credit-note">writing, assets, beta testing and major corrections</small>
            </div>
            <div class="credit-member">
                <span class="member-name">SALAMI</span>
                <small class="credit-note">most of the shredder stuff, rewriting</small>
            </div>
            <div class="credit-member">
                <span class="member-name">platform2</span>
                <small class="credit-note">drafting and writing shredder pages</small>
            </div>
            <div class="credit-member">
                <span class="member-name">goober</span>
                <small class="credit-note">helping with shredder writing</small>
            </div>
        </div>

        <div class="credit-category">
            <strong>Contributors:</strong>
            <div class="credit-member">
                <span class="member-name">glitchedtm</span>
                <small class="credit-note">Natural Selection</small>
            </div>
            <div class="credit-member">
                <span class="member-name">legallypvid</span>
                <small class="credit-note">tech info, some writing</small>
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
    buildShell();
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
