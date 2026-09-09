/* Run with Playwright installed and BROWSER_PATH pointing to Chromium/Edge. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages'), { recursive: true })
    .filter(file => file.endsWith('.html')).map(file => 'pages/' + file.replaceAll('\\', '/'))];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif',
    '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end(); return; }
    if (pathname.startsWith('/Omni/')) pathname = pathname.slice(5);
    const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
        if (error) { response.writeHead(404).end('Not found'); return; }
        response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
        response.end(data);
    });
});

async function run() {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true,
        ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
    const failures = [], passed = [], external = new Set();
    const context = await browser.newContext();
    // Third-party services are tested separately. Keep this suite deterministic/offline.
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === base || !url.protocol.startsWith('http')) return route.continue();
        external.add(url.origin);
        return route.fulfill({ status: 200, contentType: url.pathname.includes('/css') ? 'text/css' : 'text/html', body: '' });
    });
    async function test(name, fn) {
        try { await fn(); passed.push(name); console.log('PASS ' + name); }
        catch (error) { failures.push({ name, error: error.stack }); console.error('FAIL ' + name + ': ' + error.message); }
    }
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const runtimeErrors = [], localFailures = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => { if (['warning', 'error'].includes(message.type())) runtimeErrors.push(message.text()); });
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) localFailures.push(response.url()); });

    for (const width of [1440, 1024, 768, 390, 320]) {
        await test('All 24 pages at ' + width + 'px', async () => {
            await page.setViewportSize({ width, height: 900 });
            for (const file of files) {
                await page.goto(base + '/' + file, { waitUntil: 'load' });
                await page.locator('#wiki-sidebar').waitFor();
                if (file.endsWith('registery.html')) await page.waitForFunction(() => document.querySelector('#registry').getAttribute('aria-busy') === 'false');
                const issues = await page.evaluate(() => {
                    const errors = [];
                    if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('horizontal overflow');
                    if (document.querySelectorAll('main').length !== 1 || document.querySelectorAll('h1').length !== 1) errors.push('main/heading count');
                    if (!document.querySelector('body > footer')) errors.push('footer nesting');
                    for (const image of document.images) if (image.complete && !image.naturalWidth) errors.push('broken image ' + image.src);
                    for (const link of document.querySelectorAll('a[href^="#"]')) {
                        if (!document.getElementById(decodeURIComponent(link.hash.slice(1)))) errors.push('missing fragment ' + link.hash);
                    }
                    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
                    if (new Set(ids).size !== ids.length) errors.push('duplicate IDs');
                    return errors;
                });
                assert.deepEqual(issues, [], file);
            }
        });
    }
    await test('No normal-flow console errors or local HTTP failures', async () => {
        assert.deepEqual(runtimeErrors, []); assert.deepEqual(localFailures, []);
    });
    await test('Every local rendered link and fragment under /Omni/', async () => {
        const targets = new Set();
        for (const file of files) {
            await page.goto(base + '/Omni/' + file);
            const links = await page.locator('a[href]').evaluateAll(els => els.map(el => el.href));
            for (const href of links) {
                const url = new URL(href);
                if (url.origin !== base) continue;
                assert.ok(url.pathname.startsWith('/Omni/'), file + ' escapes project path: ' + href);
                targets.add(href);
            }
        }
        for (const href of targets) {
            const response = await context.request.get(href);
            assert.equal(response.status(), 200, href);
        }
        await page.goto(base + '/Omni/pages/shreds/axislocks.html');
        await page.locator('#wiki-search').fill('massless');
        await page.waitForFunction(() => document.querySelector('#wiki-results .search-item strong')?.textContent === 'Massless');
        await page.locator('#wiki-search').press('Enter');
        await page.waitForURL('**/Omni/pages/shreds/massless.html');
        await page.goBack(); assert.ok(page.url().endsWith('axislocks.html'));
        await page.goForward(); assert.ok(page.url().endsWith('massless.html'));
        await page.reload(); assert.equal(await page.locator('#wiki-sidebar').count(), 1);
    });
    await test('Search filtering, keyboard, no results, Escape and deferred dismissal', async () => {
        await page.goto(base + '/');
        assert.equal(await page.locator('.wiki-sidebar a[aria-current="page"]').innerText(), 'Main Page');
        await page.locator('#wiki-search').fill('HEALTH');
        await page.waitForFunction(() => document.querySelector('#wiki-results .search-item strong')?.textContent === 'Health');
        await page.locator('#wiki-search').press('ArrowDown');
        assert.equal(await page.locator('[aria-selected="true"]').count(), 1);
        await page.locator('#wiki-search').press('Escape');
        assert.equal(await page.locator('#wiki-results').isVisible(), false);
        await page.locator('#wiki-search').fill('zzzz-no-page');
        await page.waitForFunction(() => document.querySelector('#wiki-results')?.textContent.includes('No pages found'));
        await page.locator('#wiki-search').fill('massless');
        await page.locator('h1').click();
        await page.waitForTimeout(250);
        assert.equal(await page.locator('#wiki-results').isVisible(), false);
    });
    await test('History all six tabs, keyboard, refresh and back/forward', async () => {
        await page.goto(base + '/pages/historyportal.html');
        for (const key of ['proto', 'jannu07', 'duckless', 'glitch', 'xhunter', 'kameon']) {
            await page.locator(`[data-chrono-key="${key}"]`).click();
            assert.equal(await page.locator('[role="tab"][aria-selected="true"]').count(), 1);
            assert.ok((await page.locator('[role="tabpanel"]').innerText()).trim().length > 0);
        }
        await page.reload(); assert.equal(await page.locator('[aria-selected="true"]').getAttribute('data-chrono-key'), 'kameon');
        await page.locator('[aria-selected="true"]').press('Home');
        assert.equal(await page.locator('[aria-selected="true"]').getAttribute('data-chrono-key'), 'proto');
        await page.locator('[aria-selected="true"]').press('ArrowLeft');
        assert.equal(await page.locator('[aria-selected="true"]').getAttribute('data-chrono-key'), 'kameon');
        await page.goBack(); await page.waitForFunction(() => document.querySelector('[aria-selected="true"]').dataset.chronoKey === 'proto');
        await page.goForward(); await page.waitForFunction(() => document.querySelector('[aria-selected="true"]').dataset.chronoKey === 'kameon');
    });
    await test('Reduced motion, skip link and mobile long content', async () => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(base + '/pages/shredderhub.html');
        assert.equal(await page.locator('.wiki-logo-name').evaluate(el => getComputedStyle(el).animationName), 'none');
        assert.equal(await page.locator('.hub-category').first().evaluate(el => getComputedStyle(el).animationName), 'none');
        await page.keyboard.press('Tab'); assert.equal(await page.locator('.wiki-skip-link').evaluate(el => el === document.activeElement), true);
        await page.keyboard.press('Enter'); assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
        await page.locator('h1').evaluate(el => el.textContent = 'LongTitle'.repeat(100));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    });
    async function scenario(name, setup, check) {
        await test(name, async () => {
            const tab = await context.newPage(); tab.setDefaultTimeout(5000);
            try { await setup(tab); await check(tab); } finally { await tab.close(); }
        });
    }
    for (const [name, body] of [['empty', '[]'], ['malformed', '{}'], ['null entry', '[null]']]) {
        await scenario('Search ' + name + ' response stays responsive',
            tab => tab.route('**/data/search-index.json', route => route.fulfill({ contentType: 'application/json', body })),
            async tab => {
                await tab.goto(base + '/'); await tab.locator('#wiki-search').fill('x');
                await tab.waitForFunction(() => /No pages found|unavailable/.test(document.querySelector('#wiki-results').textContent));
                assert.ok(await tab.evaluate(() => 2 + 2 === 4));
                await tab.locator('#wiki-search').press('Escape');
                assert.equal(await tab.locator('#wiki-results').isVisible(), false);
            });
    }
    await scenario('Search HTTP failure retries and slow response respects dismissal', async tab => {
        let count = 0;
        await tab.route('**/data/search-index.json', async route => {
            count++;
            if (count === 1) return route.fulfill({ status: 503, body: 'Unavailable' });
            await new Promise(resolve => setTimeout(resolve, 300));
            await route.continue();
        });
    }, async tab => {
        await tab.goto(base + '/'); await tab.locator('#wiki-search').fill('massless');
        await tab.getByRole('button', { name: 'Retry' }).click();
        await tab.locator('h1').click(); await tab.waitForTimeout(500);
        assert.equal(await tab.locator('#wiki-results').isVisible(), false);
        await tab.locator('#wiki-search').focus();
        await tab.waitForFunction(() => document.querySelector('#wiki-results .search-item strong')?.textContent === 'Massless');
    });
    await scenario('Search and preview text cannot inject HTML', async tab => {
        await tab.route('**/data/search-index.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([
            { title: '<img src=x onerror="window.injected=1">', snippet: '<svg onload="window.injected=1">', categories: ['<img src=x>'], url: 'index.html' }
        ]) }));
    }, async tab => {
        await tab.goto(base + '/'); await tab.locator('#wiki-search').focus();
        await tab.locator('.search-item').waitFor();
        assert.equal(await tab.locator('#wiki-results img, #wiki-results svg').count(), 0);
        await tab.evaluate(() => renderPreviewContent(createPreviewCardDOM(), { title: '<img src=x>', snippet: '<script>bad()</script>', categories: ['<svg>'], image: 'javascript:alert(1)' }));
        assert.equal(await tab.locator('#wiki-link-preview-popup img, #wiki-link-preview-popup script, #wiki-link-preview-popup svg').count(), 0);
    });
    await scenario('Registry delayed data preserves input; partial failures and retries', async tab => {
        await tab.route('**/data/registry/index.json', route => route.fulfill({ contentType: 'application/json', body: '["good","bad","good"]' }));
        await tab.route('**/data/registry/good.json', async route => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'Alpha', userid: 123, alts: ['Beta'], offenses: ['Example'], evidence: [] }) });
        });
        await tab.route('**/data/registry/bad.json', route => route.fulfill({ status: 404 }));
    }, async tab => {
        await tab.goto(base + '/pages/registery.html'); await tab.locator('#registrySearch').fill('no-match');
        await tab.waitForFunction(() => document.querySelector('#registry').getAttribute('aria-busy') === 'false');
        assert.equal(await tab.locator('#registry .card').count(), 0);
        assert.match(await tab.locator('#registry-status').innerText(), /1 registry entries could not be loaded/);
        await tab.locator('#registrySearch').fill(' BETA '); assert.equal(await tab.locator('#registry .card').count(), 1);
        await tab.unroute('**/data/registry/bad.json');
        await tab.route('**/data/registry/bad.json', route => route.fulfill({ contentType: 'application/json', body: '{"username":"Beta"}' }));
        await tab.getByRole('button', { name: 'Retry' }).click();
        await tab.waitForFunction(() => document.querySelector('#registry').getAttribute('aria-busy') === 'false');
        assert.equal(await tab.locator('#registry .card').count(), 2);
    });
    for (const [name, body] of [['empty index', '[]'], ['invalid index', '{}'], ['path traversal ID', '["../search-index"]']]) {
        await scenario('Registry ' + name, tab => tab.route('**/data/registry/index.json', route => route.fulfill({ contentType: 'application/json', body })), async tab => {
            await tab.goto(base + '/pages/registery.html');
            await tab.waitForFunction(() => document.querySelector('#registry').getAttribute('aria-busy') === 'false');
            assert.equal(await tab.locator('#registry .card').count(), 0);
            assert.match(await tab.locator('#registry-status').innerText(), /No registry entries|Could not load/);
        });
    }
    await scenario('Registry unsafe HTML, evidence URLs and null values', tab => tab.route('**/data/registry/MAKEITAUSERID.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        username: '<img src=x onerror="window.injected=1">', userid: null, alts: [null, '<b>test</b>'], offenses: null,
        description: '<svg onload="window.injected=1">', evidence: [null, { title: 'Unsafe', url: 'javascript:alert(1)' }, { title: 'Valid', url: 'https://example.com' }]
    }) })), async tab => {
        await tab.goto(base + '/pages/registery.html');
        await tab.waitForFunction(() => document.querySelector('#registry').getAttribute('aria-busy') === 'false');
        assert.equal(await tab.locator('#registry img, #registry svg').count(), 0);
        assert.equal(await tab.locator('#registry a').count(), 1);
        assert.equal(await tab.evaluate(() => window.injected), undefined);
    });
    await test('Hover previews cache requests, dismiss and stay within viewport', async () => {
        await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(base + '/');
        const target = page.locator('.wiki-portal a').first();
        let count = 0;
        page.on('request', request => { if (request.url() === base + '/pages/shredderhub.html') count++; });
        await target.hover(); await page.locator('.wiki-preview-popup.visible').waitFor();
        await page.waitForFunction(() => document.querySelector('.wiki-preview-title'));
        await page.keyboard.press('Escape'); await page.mouse.move(1400, 10); await target.hover();
        await page.locator('.wiki-preview-popup.visible').waitFor();
        assert.equal(count, 1);
        assert.ok(await page.locator('.wiki-preview-popup').evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }));
        await page.keyboard.press('Escape'); assert.equal(await page.locator('.wiki-preview-popup').evaluate(el => el.classList.contains('visible')), false);
    });
    await test('No-JavaScript article and breadcrumb access', async () => {
        const noJS = await browser.newContext({ javaScriptEnabled: false });
        const tab = await noJS.newPage();
        await tab.goto(base + '/Omni/pages/shreds/massless.html');
        assert.ok(await tab.locator('h1').isVisible());
        await tab.locator('.wiki-breadcrumb a').first().click(); assert.equal(tab.url(), base + '/Omni/index.html');
        await noJS.close();
    });
    await scenario('Request timeout exposes retry without an endless loading loop', async tab => {
        await tab.addInitScript(() => {
            const original = window.setTimeout;
            window.setTimeout = (fn, ms, ...args) => original(fn, ms === 15000 ? 40 : ms, ...args);
        });
        await tab.route('**/data/search-index.json', async route => {
            await new Promise(resolve => setTimeout(resolve, 200));
            await route.fulfill({ contentType: 'application/json', body: '[]' }).catch(() => {});
        });
    }, async tab => {
        await tab.goto(base + '/'); await tab.locator('#wiki-search').focus();
        await tab.getByRole('button', { name: 'Retry' }).waitFor();
        assert.ok(await tab.evaluate(() => searchState === 'error'));
    });
    await scenario('Preview in-flight deduplication and failed-request recovery', async () => {}, async tab => {
        await tab.goto(base + '/');
        let requests = 0;
        await tab.route('**/pages/shreds/massless.html', async route => {
            requests++;
            await new Promise(resolve => setTimeout(resolve, 100));
            if (requests === 1) return route.fulfill({ status: 503 });
            return route.continue();
        });
        await tab.evaluate(async base => {
            await Promise.all([fetchPagePreviewData(new URL(base + '/pages/shreds/massless.html#Modules')),
                fetchPagePreviewData(new URL(base + '/pages/shreds/massless.html#Staging'))]);
        }, base);
        assert.equal(requests, 1);
        await tab.evaluate(base => fetchPagePreviewData(new URL(base + '/pages/shreds/massless.html')), base);
        assert.equal(requests, 2);
        await tab.evaluate(base => fetchPagePreviewData(new URL(base + '/pages/shreds/massless.html#Staging')), base);
        assert.equal(requests, 2);
    });
    await scenario('Registry failed refresh remains visible while filtering', async tab => {
        await tab.route('**/data/registry/index.json', route => route.fulfill({ contentType: 'application/json', body: '["MAKEITAUSERID","missing"]' }));
        await tab.route('**/data/registry/missing.json', route => route.fulfill({ status: 404 }));
    }, async tab => {
        await tab.goto(base + '/pages/registery.html');
        await tab.getByRole('button', { name: 'Retry' }).waitFor();
        await tab.unroute('**/data/registry/index.json');
        await tab.route('**/data/registry/index.json', route => route.fulfill({ status: 503 }));
        await tab.getByRole('button', { name: 'Retry' }).click();
        await tab.waitForFunction(() => document.querySelector('#registry').getAttribute('aria-busy') === 'false');
        await tab.locator('#registrySearch').fill('GEMERALD');
        assert.match(await tab.locator('#registry-status').innerText(), /Could not refresh/);
        assert.equal(await tab.locator('#registry .card').count(), 1);
        assert.ok(await tab.getByRole('button', { name: 'Retry' }).isVisible());
    });
    await test('Home audio easter egg plays, restarts, and ignores text fields/other pages', async () => {
        await page.goto(base + '/');
        await page.locator('#wiki-search').fill('duckless');
        assert.equal(await page.evaluate(() => secretAudio), null);
        await page.locator('h1').click();
        await page.keyboard.type('duckless');
        await page.waitForFunction(() => secretAudio && !secretAudio.paused && secretAudio.readyState >= 2);
        assert.ok(await page.evaluate(() => Number.isFinite(secretAudio.duration)));
        await page.evaluate(() => { secretAudio.currentTime = 10; });
        await page.keyboard.type('duckless');
        assert.ok(await page.evaluate(() => secretAudio.currentTime < 3));
        await page.evaluate(() => secretAudio.pause());
        await page.goto(base + '/pages/shredderhub.html'); await page.keyboard.type('duckless');
        assert.equal(await page.evaluate(() => secretAudio), null);
    });
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    const report = { passed: passed.length, failed: failures.length, tests: passed, failures, externalServicesExcluded: [...external] };
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = failures.length ? 1 : 0;
}
run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
