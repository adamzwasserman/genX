/**
 * Accessibility audit for accX demo section using axe-core
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('accX Accessibility Audit', () => {
    test('should pass accessibility audit on accX section', async ({ page }) => {
        // Navigate to demo page
        await page.goto('file://' + process.cwd() + '/examples/genx-demo.html');

        // Wait for accX to initialize
        await page.waitForTimeout(500);

        // Scroll to accX section
        await page.locator('#accx').scrollIntoViewIfNeeded();

        // Run axe-core audit on just the accX section
        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('#accx')
            .analyze();

        // Log results
        console.log('\n========================================');
        console.log('accX ACCESSIBILITY AUDIT RESULTS');
        console.log('========================================\n');

        const violations = accessibilityScanResults.violations;
        const passes = accessibilityScanResults.passes;

        console.log(`PASSED: ${passes.length} rules`);
        console.log(`VIOLATIONS: ${violations.length} rules\n`);

        if (violations.length > 0) {
            console.log('VIOLATIONS DETAIL:');
            console.log('------------------');
            violations.forEach((v, i) => {
                console.log(`\n${i + 1}. ${v.id} (${v.impact})`);
                console.log(`   ${v.description}`);
                console.log(`   Help: ${v.helpUrl}`);
                console.log(`   Affected elements: ${v.nodes.length}`);
                v.nodes.slice(0, 3).forEach(node => {
                    console.log(`   - ${node.html.substring(0, 80)}...`);
                });
            });
        }

        // Calculate score (simple: passes / (passes + violations) * 100)
        const totalRules = passes.length + violations.length;
        const score = Math.round((passes.length / totalRules) * 100);

        console.log('\n========================================');
        console.log(`ACCESSIBILITY SCORE: ${score}/100`);
        console.log('========================================\n');

        // Group passes by category for summary
        const categories = {};
        passes.forEach(p => {
            const cat = p.tags.find(t => t.startsWith('cat.')) || 'other';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        console.log('PASSED BY CATEGORY:');
        Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`  ${cat.replace('cat.', '')}: ${count}`);
        });

        // Assert no critical/serious violations
        const criticalViolations = violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations.length,
            `Found ${criticalViolations.length} critical/serious violations`
        ).toBe(0);
    });

    test('should audit full demo page accessibility', async ({ page }) => {
        await page.goto('file://' + process.cwd() + '/examples/genx-demo.html');
        await page.waitForTimeout(500);

        const results = await new AxeBuilder({ page }).analyze();

        console.log('\n========================================');
        console.log('FULL PAGE ACCESSIBILITY SUMMARY');
        console.log('========================================');
        console.log(`Passes: ${results.passes.length}`);
        console.log(`Violations: ${results.violations.length}`);
        console.log(`Incomplete: ${results.incomplete.length}`);
        console.log(`Inapplicable: ${results.inapplicable.length}`);

        const score = Math.round((results.passes.length / (results.passes.length + results.violations.length)) * 100);
        console.log(`\nSCORE: ${score}/100\n`);
    });
});
