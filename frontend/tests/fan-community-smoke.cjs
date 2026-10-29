/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS Node test runner with configurable Playwright location. */
/* Run against disposable seeded servers: backend :8080, frontend :3000.
 * npm install --no-save playwright (or point PLAYWRIGHT_MODULE at an installed module).
 * node tests/fan-community-smoke.cjs
 */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const API = process.env.API_URL || 'http://localhost:8080';
const WEB = process.env.WEB_URL || 'http://localhost:3000';
async function api(id, route, options = {}) {
    const res = await fetch(API + route, { ...options, headers: { 'Content-Type': 'application/json', 'X-User-Id': String(id) } });
    assert.ok(res.ok, `${route}: ${res.status} ${await (!res.ok ? res.text() : Promise.resolve(''))}`);
    return res.status === 204 ? null : res.json();
}
(async () => {
    const root = '/api/fan-community';
    await api(1, `${root}/artists/1/follow`, { method: 'DELETE' });
    const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const browserErrors = [];
        page.on('pageerror', error => browserErrors.push(error.message));
        await page.goto(WEB);
        await page.locator('nav').getByRole('button', { name: /Discover/i }).click();
        await page.getByRole('heading', { name: 'Luna Park', exact: true }).first().click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Follow artist +', exact: true }).click();
        await dialog.getByText('You are now following this artist.', { exact: true }).waitFor();
        assert.equal((await api(1, `${root}/following`)).filter(x => x.artistId === 1).length, 1);
        await dialog.getByRole('button', { name: 'Close artist profile' }).click();
        await page.locator('nav').getByRole('button', { name: /Following/i }).click();
        await page.getByRole('heading', { name: 'Luna Park', exact: true }).waitFor();
        await page.reload();
        await page.locator('nav').getByRole('button', { name: /Following/i }).click();
        await page.getByRole('heading', { name: 'Luna Park', exact: true }).waitFor();

        await page.locator('nav').getByRole('button', { name: /My profile/i }).click();
        await page.getByLabel('Display name', { exact: true }).fill('Community Smoke Fan');
        await page.getByRole('textbox', { name: 'Biography', exact: true }).fill('I support local jazz and independent art.');
        await page.getByLabel('Artistic interests', { exact: true }).fill('Jazz, illustration');
        await page.getByLabel('Show my artistic interests', { exact: true }).uncheck();
        await page.getByRole('button', { name: 'Save profile', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'privacy preferences have been saved' }).waitFor();
        assert.equal((await api(1, `${root}/profile`)).biography, 'I support local jazz and independent art.');
        assert.equal((await api(5, `${root}/profiles/1`)).interests, null);
        // A failed server validation must keep the editor draft and the prior stored profile.
        await page.getByRole('textbox', { name: 'Biography', exact: true }).fill('<script>invalid</script>');
        await page.getByRole('button', { name: 'Save profile', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'violates profile content rules' }).waitFor();
        assert.equal(await page.getByRole('textbox', { name: 'Biography', exact: true }).inputValue(), '<script>invalid</script>');
        assert.equal((await api(1, `${root}/profile`)).biography, 'I support local jazz and independent art.');
        await page.getByRole('button', { name: 'Reload saved profile', exact: true }).click();
        await page.getByRole('textbox', { name: 'Biography', exact: true }).waitFor();

        await page.locator('.account-btn').click();
        await page.getByRole('button', { name: /Jordan Smith/ }).click();
        await page.locator('nav').getByRole('button', { name: /Following/i }).click();
        await page.getByText('You aren’t following any artists yet.', { exact: false }).waitFor();
        assert.equal((await api(5, `${root}/following`)).length, 0);
        await page.locator('nav').getByRole('button', { name: /My profile/i }).click();
        await page.getByLabel('Community member', { exact: true }).selectOption('1');
        await page.getByRole('button', { name: 'View profile', exact: true }).click();
        await page.getByRole('heading', { name: 'Community Smoke Fan', exact: true }).waitFor();
        assert.equal(await page.getByText('Artistic interests: Jazz, illustration', { exact: true }).count(), 0);
        await page.locator('.account-btn').click();
        await page.getByRole('button', { name: /Nicholas Nolen/ }).click();
        await page.locator('nav').getByRole('button', { name: /Report content/i }).click();
        await page.getByLabel('Content or account', { exact: true }).selectOption('EVENT:2');
        await page.getByRole('button', { name: 'Continue to report', exact: true }).click();
        await page.getByLabel('Reason', { exact: true }).selectOption('Spam or scam');
        await page.getByLabel('Additional details (optional)', { exact: true }).fill('E2E review context');
        await page.getByRole('button', { name: 'Submit report', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'submitted. Status: Pending' }).waitFor();
        const report = (await api(1, `${root}/reports`)).find(r => r.targetType === 'EVENT' && r.targetId === 2 && r.status === 'PENDING');
        assert.ok(report);
        await page.getByLabel('Reason', { exact: true }).selectOption('Spam or scam');
        await page.getByRole('button', { name: 'Submit report', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'already reported' }).waitFor();
        await page.locator('.account-btn').click();
        await page.getByRole('button', { name: /Admin Alex/ }).click();
        await page.locator('nav').getByRole('button', { name: /Report queue/i }).click();
        const review = page.locator('.community-report').filter({ has: page.getByRole('heading', { name: `Report #${report.id} · EVENT #2`, exact: true }) });
        await review.getByText('E2E review context', { exact: true }).waitFor();
        await review.getByLabel('Review notes').fill('Smoke test reviewed and dismissed.');
        await review.getByRole('button', { name: 'Resolve report', exact: true }).click();
        await page.getByRole('status').filter({ hasText: `Report #${report.id} resolved` }).waitFor();
        assert.equal((await api(1, `${root}/reports`)).find(r => r.id === report.id).status, 'RESOLVED');
        const output = path.resolve(__dirname, '../test-results');
        fs.mkdirSync(output, { recursive: true });
        await page.screenshot({ path: path.join(output, 'report-review-desktop.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('.account-btn').click();
        await page.getByRole('button', { name: /Nicholas Nolen/ }).click();
        await page.locator('nav').getByRole('button', { name: /My profile/i }).click();
        await page.getByLabel('Display name', { exact: true }).waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout overflows');
        await page.screenshot({ path: path.join(output, 'fan-profile-mobile.png'), fullPage: true });
        assert.deepEqual(browserErrors, []);
        console.log('PASS: follow persistence, account isolation, profile validation/privacy, report submission/duplicates/admin resolution, mobile layout, and no browser runtime errors.');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
