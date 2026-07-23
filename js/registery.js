//HELLO I AM SKIDDED I AM A SKIDDED LITTLE BOY I AM THE SEX OFFENDER REGISTERY FOR ALL YOU NAUGHTY BOYS LIKE SHUSH DUCKLESS AND XHUNTER
let offenders = [];

function getRegistryBasePath() {
    const script = document.querySelector('script[src*="registery.js"]');
    if (script) {
        const scriptUrl = new URL(script.getAttribute('src'), window.location.href);
        const marker = '/js/registery.js';
        const idx = scriptUrl.pathname.lastIndexOf(marker);
        if (idx !== -1) {
            return scriptUrl.pathname.slice(0, idx + 1);
        }
    }
    return getWikiBasePath?.() ?? '/';
}

async function loadRegistry() {
    const container = document.getElementById('registry');
    if (!container) return;

    const basePath = getRegistryBasePath();

    try {
        const idsResponse = await fetch(basePath + 'data/registry/index.json');
        if (!idsResponse.ok) throw new Error('Could not load registry index: ' + idsResponse.status);

        const ids = await idsResponse.json();
        if (!Array.isArray(ids)) throw new Error('Registry index is not an array');

        const entries = await Promise.all(
            ids.map(async id => {
                const response = await fetch(`${basePath}data/registry/${id}.json`);
                if (!response.ok) throw new Error(`Could not load registry entry: ${id}`);
                return response.json();
            })
        );

        offenders = entries;
        render(offenders);
    } catch (err) {
        console.error('[registry] load failed:', err);
        container.innerHTML = '<p>Could not load registry data. Please try again later.</p>';
    }
}

function render(list) {
    const container = document.getElementById('registry');
    if (!container) return;

    container.innerHTML = list.map(person => {
        const evidence = Array.isArray(person.evidence) ? person.evidence : [];
        const alts = Array.isArray(person.alts) ? person.alts : [];
        const offenses = Array.isArray(person.offenses) ? person.offenses : [];

        const evidenceHTML = evidence.length === 0
            ? '<li>No public evidence listed.</li>'
            : evidence.map(ev => `
                <li>
                    <a href="${ev.url}" target="_blank" rel="noopener noreferrer">
                        ${ev.title}
                    </a>
                </li>
            `).join('');

        return `
            <div class="card">
                <h2>${person.username ?? 'Unknown'}</h2>
                <p><b>UserID:</b> ${person.userid ?? 'N/A'}</p>
                <p><b>Known Alts:</b>
                    ${alts.map(alt => `<span class="wiki-cat">${alt}</span>`).join(' ')}
                </p>
                <p><b>Offenses:</b>
                    ${offenses.map(offense => `<span class="wiki-cat">${offense}</span>`).join(' ')}
                </p>
                <p><b>Description:</b> ${person.description ?? ''}</p>
                <h4>Evidence</h4>
                <ul>${evidenceHTML}</ul>
            </div>
        `;
    }).join('');
}

function initRegistrySearch() {
    const searchInput = document.getElementById('registrySearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', e => {
        const search = e.target.value.toLowerCase();

        render(
            offenders.filter(person => {
                const username = String(person.username ?? '').toLowerCase();
                const userid = String(person.userid ?? '');
                const offenses = Array.isArray(person.offenses) ? person.offenses : [];

                return username.includes(search)
                    || userid.includes(search)
                    || offenses.some(offense => String(offense).toLowerCase().includes(search));
            })
        );
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initRegistrySearch();
    loadRegistry();
});
