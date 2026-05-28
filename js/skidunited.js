let searchData = [];

//tbf my ahh didnt come here for make a searchbar

// Initialize search by fetching the index

function initWikiSearch() {
    // 1. Get the current URL path (e.g., /Omni/pages/shreds/3x5gyro.html)
    const path = window.location.pathname;
    
    // 2. Find where the project root stops. If 'Omni' isn't in the URL (like local server), default to '/'
    const rootEndIndex = path.indexOf('/Omni/');
    const basePath = rootEndIndex !== -1 ? path.substring(0, rootEndIndex + 6) : '/';

    // 3. Combine base path with the target filename
    fetch(basePath + 'search-index.json')
        .then(response => {
            if (!response.ok) throw new Error("Could not load search index");
            return response.json();
        })
        .then(data => {
            searchData = data;
        })
        .catch(err => console.error("Error initializing search:", err));

    // Set up click listener to close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            const resultsContainer = document.getElementById('wiki-results');
            if (resultsContainer) resultsContainer.innerHTML = '';
        }
    });
}


// Executed every time a user types a letter
function runWikiSearch() {
    const query = document
        .getElementById('wiki-search')
        .value
        .trim()
        .toLowerCase();

    const resultsContainer =
        document.getElementById('wiki-results');

    // Wait until search data exists
    if (!searchData.length) {
        resultsContainer.innerHTML =
            '<div style="padding:10px;">Loading...</div>';
        return;
    }

    let results;

    // Show default pages when empty
    if (query === '') {
        results = searchData.slice(0, 8);
    } else {
        results = searchData.filter(page => {
            const matchesTitle =
                page.title.toLowerCase().includes(query);

            const matchesSnippet =
                page.snippet.toLowerCase().includes(query);

            const matchesTags =
                page.tags.some(tag =>
                    tag.toLowerCase().includes(query)
                );

            return matchesTitle ||
                   matchesSnippet ||
                   matchesTags;
        });
    }

    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML =
            '<div style="padding:10px; font-size:12px; color:#999;">No pages found</div>';
        return;
    }

    const path = window.location.pathname;
    const rootEndIndex = path.indexOf('/Omni/');
    const basePath =
        rootEndIndex !== -1
            ? path.substring(0, rootEndIndex + 6)
            : '/';

    results.forEach(page => {
        const cleanPageUrl =
            page.url.startsWith('/')
                ? page.url.substring(1)
                : page.url;

        let categoriesHtml = '';
        if (page.categories && page.categories.length > 0) {
            const catSpans = page.categories
                .map(cat => `<span class="wiki-cat">${cat}</span>`)
                .join('');
            categoriesHtml = `
                <div class="wiki-categories">
                    ${catSpans}
                </div>
            `;
        }

        resultsContainer.innerHTML += `
            <a href="${basePath}${cleanPageUrl}" class="search-item">
                <strong>${page.title}</strong>
                <span>${page.snippet}</span>
                ${categoriesHtml}
            </a>
        `;
    });
}

// Start loading data immediately when the DOM is ready
document.addEventListener('DOMContentLoaded', initWikiSearch);

// ═══════════════════════════════════════════
//  LAZY-LOAD VIDEOS (IntersectionObserver)
//  Add class="lazy-video" and data-src="path/to/video.mp4"
//  to any <video> element. The src is set only when the
//  video scrolls into view, saving bandwidth.
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    if (!lazyVideos.length) return;

    // Use IntersectionObserver where supported (all modern browsers)
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
        }, {
            rootMargin: '200px' // start loading 200px before visible
        });

        lazyVideos.forEach(function (video) {
            observer.observe(video);
        });
    } else {
        // Fallback: load all videos immediately
        lazyVideos.forEach(function (video) {
            var src = video.getAttribute('data-src');
            if (src) {
                video.src = src;
                video.removeAttribute('data-src');
            }
        });
    }
});

// ═══════════════════════════════════════════
//  EASTER EGG: "duckless" SECRET MUSIC
// ═══════════════════════════════════════════
let typedKeys = '';
const secretWord = 'duckless';
let secretAudio = null;

document.addEventListener('keydown', function (e) {
    // Ignore key presses inside inputs or textareas
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }

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
        secretAudio.play().catch(err => console.error("Error playing secret music:", err));
        typedKeys = '';
    }
});

