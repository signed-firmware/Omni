let searchData = [];

// ═══════════════════════════════════════════
//  NAV INJECTION
// ═══════════════════════════════════════════

function buildNav() {
    const placeholder = document.getElementById('wiki-nav');
    if (!placeholder) return;

    const p = window.location.pathname;
    const link = (href, label) => {
        const cls = (p === href || p.endsWith(href)) ? ' class="active"' : '';
        return `<li><a href="${href}"${cls}>${label}</a></li>`;
    };

    placeholder.outerHTML = `
        <nav class="navbar">
            <div class="logo"><h2 class="wiki-ambient-reflection">Plane Crazy Shredder and Tech wiki</h2></div>
            <ul class="nav-links">
                ${link('/index.html', 'Home')}
                ${link('/pages/shredderhub.html', 'ShredderHub')}
                ${link('/pages/techmanifest.html', 'TechManifest')}
                <div class="search-container">
                    <input type="text" id="wiki-search" placeholder="Search for TECH..." autocomplete="off">
                    <div id="wiki-results" class="search-results-box"></div>
                </div>
            </ul>
        </nav>`;
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
                <span class="member-name">killer_meetball.</span>
                <small class="credit-note">Tech info, minor writing.</small>
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

function initWikiSearch() {
    const path = window.location.pathname;
    const rootEndIndex = path.indexOf('/Omni/');
    const basePath = rootEndIndex !== -1 ? path.substring(0, rootEndIndex + 6) : '/';

    fetch(basePath + 'search-index.json')
        .then(r => {
            if (!r.ok) throw new Error('Could not load search index: ' + r.status);
            return r.json();
        })
        .then(data => {
            searchData = data;
            console.log('[wiki-search] loaded', searchData.length, 'pages');
        })
        .catch(err => console.error('[wiki-search] fetch failed:', err));

    const searchInput = document.getElementById('wiki-search');
    if (!searchInput) {
        console.error('[wiki-search] input element not found in DOM');
        return;
    }

    searchInput.addEventListener('input', runWikiSearch);
    searchInput.addEventListener('focus', runWikiSearch);

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container')) {
            const box = document.getElementById('wiki-results');
            if (box) box.innerHTML = '';
        }
    });
}

function runWikiSearch() {
    const input = document.getElementById('wiki-search');
    const resultsContainer = document.getElementById('wiki-results');
    if (!input || !resultsContainer) return;

    const query = input.value.trim().toLowerCase();

    if (!searchData.length) {
        resultsContainer.innerHTML = '<div style="padding:10px;">Loading…</div>';
        return;
    }

    const results = query === ''
        ? searchData.slice(0, 8)
        : searchData.filter(page => {
            const matchesTitle   = page.title.toLowerCase().includes(query);
            const matchesSnippet = String(page.snippet ?? '').toLowerCase().includes(query);
            const matchesTags    = page.tags.some(tag => tag.toLowerCase().includes(query));
            return matchesTitle || matchesSnippet || matchesTags;
        });

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:10px; font-size:12px; color:#999;">No pages found</div>';
        return;
    }

    const path = window.location.pathname;
    const rootEndIndex = path.indexOf('/Omni/');
    const basePath = rootEndIndex !== -1 ? path.substring(0, rootEndIndex + 6) : '/';

    resultsContainer.innerHTML = results.map(page => {
        const cleanUrl = page.url.startsWith('/') ? page.url.substring(1) : page.url;
        const catHtml = page.categories?.length
            ? `<div class="wiki-categories">${page.categories.map(c => `<span class="wiki-cat">${c}</span>`).join('')}</div>`
            : '';
        return `<a href="${basePath}${cleanUrl}" class="search-item">
            <strong>${page.title}</strong>
            <span>${String(page.snippet ?? '')}</span>
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
    buildFooter();
    initWikiSearch();

    // ── LAZY-LOAD VIDEOS ──────────────────────
    // Add class="lazy-video" and data-src="path/to/video.mp4"
    // to any <video> element to defer loading until in view.
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    if (lazyVideos.length) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        const video = entry.target;
                        const src = video.getAttribute('data-src');
                        if (src) {
                            video.src = src;
                            video.removeAttribute('data-src');
                        }
                        observer.unobserve(video);
                    }
                });
            }, { rootMargin: '200px' });

            lazyVideos.forEach(v => observer.observe(v));
        } else {
            // Fallback: load all immediately
            lazyVideos.forEach(function (video) {
                const src = video.getAttribute('data-src');
                if (src) {
                    video.src = src;
                    video.removeAttribute('data-src');
                }
            });
        }
    }
});

// ═══════════════════════════════════════════
//  EASTER EGG: type "duckless" on the home
//  page to play the secret music
// ═══════════════════════════════════════════

let typedKeys = '';
const secretWord = 'duckless';
let secretAudio = null;

document.addEventListener('keydown', function (e) {
    // Ignore keypresses inside inputs / editable fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    const path = window.location.pathname;
    const rootEndIndex = path.indexOf('/Omni/');
    const basePath = rootEndIndex !== -1 ? path.substring(0, rootEndIndex + 6) : '/';
    const isHomePage = path === basePath || path.endsWith('index.html') || path.endsWith('/');

    if (!isHomePage) return;
    if (e.key.length !== 1) return;

    typedKeys += e.key.toLowerCase();
    if (typedKeys.length > secretWord.length) {
        typedKeys = typedKeys.substring(typedKeys.length - secretWord.length);
    }

    if (typedKeys === secretWord) {
        if (!secretAudio) {
            secretAudio = new Audio(basePath + 'assests/secretmusic.mp3');
        }
        secretAudio.currentTime = 0;
        secretAudio.play().catch(err => console.error('Error playing secret music:', err));
        typedKeys = '';
    }
});