let offenders = [];
let registryLoading = false;
let registryReady = false;
let registryFailures = 0;
let registryIndexError = false;

function getRegistryBasePath() {
    const script = document.querySelector('script[src*="registery.js"]');
    if (script) return new URL('../', script.src).pathname;
    return typeof getWikiBasePath === 'function' ? getWikiBasePath() : '/';
}

function registryStatus(message, retry = false) {
    const status = document.getElementById('registry-status');
    status.textContent = message;
    if (retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Retry';
        button.addEventListener('click', loadRegistry);
        status.append(' ', button);
    }
}

async function loadRegistry() {
    const container = document.getElementById('registry');
    if (!container || registryLoading) return;
    registryLoading = true;
    registryStatus('Loading registry…');
    container.setAttribute('aria-busy', 'true');
    try {
        const base = getRegistryBasePath() + 'data/registry/';
        const ids = await fetchWikiJSON(base + 'index.json');
        if (!Array.isArray(ids) || ids.some(id => !['string', 'number'].includes(typeof id)
            || !/^[a-zA-Z0-9_-]+$/.test(String(id)))) {
            throw new Error('Registry index must contain valid entry IDs');
        }
        const uniqueIds = [...new Set(ids.map(String))];
        const entries = new Array(uniqueIds.length);
        let next = 0;
        registryFailures = 0;
        // Limit concurrent requests even when the registry grows.
        await Promise.all(Array.from({ length: Math.min(6, uniqueIds.length) }, async () => {
            while (next < uniqueIds.length) {
                const index = next++;
                try {
                    const entry = await fetchWikiJSON(base + uniqueIds[index] + '.json');
                    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                        throw new Error('Invalid registry entry: ' + uniqueIds[index]);
                    }
                    entries[index] = entry;
                } catch (error) {
                    registryFailures++;
                    console.error('[registry] entry load failed:', error);
                }
            }
        }));
        offenders = entries.filter(Boolean);
        registryReady = true;
        registryIndexError = false;
        registryLoading = false;
        renderRegistrySearch();
    } catch (error) {
        console.error('[registry] load failed:', error);
        registryIndexError = true;
        registryStatus('Could not load registry data. Please try again.', true);
    } finally {
        registryLoading = false;
        container.setAttribute('aria-busy', 'false');
    }
}

function render(list) {
    const container = document.getElementById('registry');
    if (!container) return;
    container.innerHTML = list.map(person => {
        const evidence = Array.isArray(person.evidence) ? person.evidence : [];
        const badges = values => (Array.isArray(values) ? values : [])
            .map(value => '<span class="wiki-cat">' + escapeHTML(value) + '</span>').join(' ');
        const evidenceHTML = evidence.length ? evidence.map(item => {
            const url = item && typeof item.url === 'string' ? safeWebUrl(item.url) : null;
            const title = escapeHTML(item?.title || 'Evidence');
            return url ? '<li><a href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' + title + '</a></li>'
                : '<li>' + title + ' (link unavailable)</li>';
        }).join('') : '<li>No public evidence listed.</li>';
        return '<div class="card"><h2>' + escapeHTML(person.username ?? 'Unknown') + '</h2>'
            + '<p><b>UserID:</b> ' + escapeHTML(person.userid ?? 'N/A') + '</p>'
            + '<p><b>Known Alts:</b> ' + badges(person.alts) + '</p>'
            + '<p><b>Offenses:</b> ' + badges(person.offenses) + '</p>'
            + '<p><b>Description:</b> ' + escapeHTML(person.description) + '</p>'
            + '<h3>Evidence</h3><ul>' + evidenceHTML + '</ul></div>';
    }).join('');
}

function renderRegistrySearch() {
    if (!registryReady) return;
    const query = document.getElementById('registrySearch').value.trim().toLowerCase();
    const list = offenders.filter(person => [person.username, person.userid,
        ...(Array.isArray(person.alts) ? person.alts : []),
        ...(Array.isArray(person.offenses) ? person.offenses : [])]
        .some(value => String(value ?? '').toLowerCase().includes(query)));
    render(list);
    if (registryLoading) return;
    const message = registryIndexError
        ? 'Could not refresh registry data. Showing previously loaded entries.'
        : registryFailures
        ? registryFailures + ' registry entries could not be loaded. Showing ' + list.length + ' matching entries.'
        : offenders.length === 0 ? 'No registry entries are available.'
            : list.length === 0 ? 'No matching registry entries.' : list.length + ' matching entries.';
    registryStatus(message, registryIndexError || registryFailures > 0);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registrySearch')?.addEventListener('input', renderRegistrySearch);
    loadRegistry();
});
