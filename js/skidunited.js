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
    const query = document.getElementById('wiki-search').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('wiki-results');

    if (!query || !searchData.length) {
        resultsContainer.innerHTML = '';
        return;
    }

    // Natively filter data matching title, tags, or snippet text
    const results = searchData.filter(page => {
        const matchesTitle = page.title.toLowerCase().includes(query);
        const matchesSnippet = page.snippet.toLowerCase().includes(query);
        const matchesTags = page.tags.some(tag => tag.toLowerCase().includes(query));
        return matchesTitle || matchesSnippet || matchesTags;
    });

    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:10px; font-size:12px; color:#999;">No pages found</div>';
        return;
    }

    // Display the matching local items
    // Display the matching local items
    results.forEach(page => {
        // Calculate the base path dynamically (same logic used in your fetch)
        const path = window.location.pathname;
        const rootEndIndex = path.indexOf('/Omni/');
        const basePath = rootEndIndex !== -1 ? path.substring(0, rootEndIndex + 6) : '/';

        // Strip any leading slashes from the page URL to avoid double-slashes
        const cleanPageUrl = page.url.startsWith('/') ? page.url.substring(1) : page.url;

        resultsContainer.innerHTML += `
            <a href="${basePath}${cleanPageUrl}" class="search-item">
                <strong>${page.title}</strong>
                <span>${page.snippet}</span>
            </a>
        `;
    });
}

// Start loading data immediately when the DOM is ready
document.addEventListener('DOMContentLoaded', initWikiSearch);
