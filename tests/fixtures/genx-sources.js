/**
 * The real genX files, keyed by the URL path the bootloader and cloak request them under.
 *
 * Step definitions serve these through Playwright routing, so a test exercises the source
 * in src/ rather than a stale dist/ build or the live CDN.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const SRC = path.join(__dirname, '..', '..', 'src');

let bundleCache = null;

/** src/bootloader.bundle.js built the way `npm run build:bootloader` builds it. */
const bootloaderBundle = () => {
    if (bundleCache) return bundleCache;
    const out = esbuild.buildSync({
        entryPoints: [path.join(SRC, 'bootloader.bundle.js')],
        bundle: true, format: 'iife', globalName: 'genx', write: false
    });
    bundleCache = out.outputFiles[0].text;
    return bundleCache;
};

/** URL path (relative to the CDN base) to source text, or null when genX has no such file. */
const sourceFor = (urlPath) => {
    if (urlPath === '/cloak.js') return fs.readFileSync(path.join(SRC, 'cloak.js'), 'utf8');
    if (urlPath === '/bootloader.js') return bootloaderBundle();
    const parser = urlPath.match(/^\/parsers\/([\w-]+)\.js$/);
    if (parser) return fs.readFileSync(path.join(SRC, 'parsers', `${parser[1]}.js`), 'utf8');
    const mod = urlPath.match(/^\/(\w+)\.min\.js$/);
    if (mod && fs.existsSync(path.join(SRC, `${mod[1]}.js`))) {
        return fs.readFileSync(path.join(SRC, `${mod[1]}.js`), 'utf8');
    }
    return null;
};

module.exports = { SRC, bootloaderBundle, sourceFor };
