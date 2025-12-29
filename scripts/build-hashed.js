#!/usr/bin/env node
/**
 * Build script that adds content hashes to filenames for cache busting.
 *
 * Usage: node scripts/build-hashed.js
 *
 * This script:
 * 1. Reads minified files from dist/
 * 2. Computes MD5 hash of each file (first 8 chars)
 * 3. Copies to cdn-deploy/v1/ with hashed filenames
 * 4. Generates manifest.json mapping original names to hashed names
 * 5. Updates genx-demo.html with hashed bootloader reference
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const CDN_DIR = path.join(__dirname, '..', 'cdn-deploy', 'v1');
const SITE_DIR = path.join(__dirname, '..', 'site');
const MANIFEST_PATH = path.join(CDN_DIR, 'manifest.json');

// Files to hash
const FILES = {
    bootloader: 'bootloader.min.js',
    modules: [
        'fmtx.min.js',
        'accx.min.js',
        'bindx.min.js',
        'dragx.min.js',
        'loadx.min.js',
        'navx.min.js',
        'tablex.min.js',
        'smartx.min.js'
    ],
    parsers: [
        'parsers/genx-parser-verbose.js',
        'parsers/genx-parser-colon.js',
        'parsers/genx-parser-json.js',
        'parsers/genx-parser-class.js'
    ]
};

/**
 * Compute short hash of file content
 */
function computeHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

/**
 * Add hash to filename: foo.min.js -> foo.abc12345.min.js
 */
function addHashToFilename(filename, hash) {
    const ext = filename.endsWith('.min.js') ? '.min.js' : '.js';
    const base = filename.replace(ext, '');
    return `${base}.${hash}${ext}`;
}

/**
 * Remove old hashed files matching pattern
 */
function cleanOldHashedFiles(dir, basePattern) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    const pattern = new RegExp(`^${basePattern.replace('.', '\\.')}\\.[a-f0-9]{8}\\.`);

    for (const file of files) {
        if (pattern.test(file)) {
            fs.unlinkSync(path.join(dir, file));
            console.log(`  Removed old: ${file}`);
        }
    }
}

/**
 * Process a single file: hash, copy, return mapping
 */
function processFile(srcPath, destDir, filename) {
    const content = fs.readFileSync(srcPath);
    const hash = computeHash(content);
    const hashedFilename = addHashToFilename(filename, hash);

    // Clean old versions
    const baseName = filename.replace('.min.js', '').replace('.js', '');
    cleanOldHashedFiles(destDir, baseName);

    // Copy with hashed name
    const destPath = path.join(destDir, hashedFilename);
    fs.writeFileSync(destPath, content);

    // Also keep unhashed version for backwards compatibility during transition
    const unhashDest = path.join(destDir, filename);
    fs.writeFileSync(unhashDest, content);

    console.log(`  ${filename} -> ${hashedFilename}`);

    return { original: filename, hashed: hashedFilename, hash };
}

/**
 * Main build function
 */
function build() {
    console.log('Building hashed assets...\n');

    // Ensure CDN directory exists
    if (!fs.existsSync(CDN_DIR)) {
        fs.mkdirSync(CDN_DIR, { recursive: true });
    }

    const manifest = {
        version: new Date().toISOString(),
        bootloader: null,
        modules: {},
        parsers: {}
    };

    // Process bootloader
    console.log('Bootloader:');
    const bootloaderSrc = path.join(DIST_DIR, FILES.bootloader);
    if (fs.existsSync(bootloaderSrc)) {
        const result = processFile(bootloaderSrc, CDN_DIR, FILES.bootloader);
        manifest.bootloader = result.hashed;
    } else {
        console.log(`  WARNING: ${FILES.bootloader} not found in dist/`);
    }

    // Process modules
    console.log('\nModules:');
    const modulesDir = path.join(DIST_DIR, 'modules');
    for (const filename of FILES.modules) {
        const srcPath = path.join(modulesDir, filename);
        if (fs.existsSync(srcPath)) {
            const result = processFile(srcPath, CDN_DIR, filename);
            const moduleName = filename.replace('.min.js', '');
            manifest.modules[moduleName] = result.hashed;
        } else {
            console.log(`  WARNING: ${filename} not found`);
        }
    }

    // Process parsers
    console.log('\nParsers:');
    const parsersDestDir = path.join(CDN_DIR, 'parsers');
    if (!fs.existsSync(parsersDestDir)) {
        fs.mkdirSync(parsersDestDir, { recursive: true });
    }

    for (const parserPath of FILES.parsers) {
        const filename = path.basename(parserPath);
        const srcPath = path.join(CDN_DIR, parserPath); // Parsers are already in cdn-deploy
        if (fs.existsSync(srcPath)) {
            const content = fs.readFileSync(srcPath);
            const hash = computeHash(content);
            const hashedFilename = addHashToFilename(filename, hash);

            // Clean old versions
            const baseName = filename.replace('.js', '');
            cleanOldHashedFiles(parsersDestDir, baseName);

            // Copy with hashed name
            fs.writeFileSync(path.join(parsersDestDir, hashedFilename), content);
            console.log(`  ${filename} -> ${hashedFilename}`);

            const parserName = filename.replace('genx-parser-', '').replace('.js', '');
            manifest.parsers[parserName] = `parsers/${hashedFilename}`;
        } else {
            console.log(`  WARNING: ${parserPath} not found`);
        }
    }

    // Write manifest
    console.log('\nWriting manifest.json...');
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`  ${MANIFEST_PATH}`);

    // Update genx-demo.html
    console.log('\nUpdating genx-demo.html...');
    updateDemoHtml(manifest);

    console.log('\nDone!');
    console.log('\nManifest:', JSON.stringify(manifest, null, 2));
}

/**
 * Update genx-demo.html to use hashed filenames
 */
function updateDemoHtml(manifest) {
    const demoPath = path.join(SITE_DIR, 'genx-demo.html');
    if (!fs.existsSync(demoPath)) {
        console.log('  WARNING: genx-demo.html not found');
        return;
    }

    let html = fs.readFileSync(demoPath, 'utf8');

    // Build modulePaths config for genxConfig
    const modulePaths = {};
    for (const [name, hashedFile] of Object.entries(manifest.modules)) {
        // Map module name to prefix: fmtx -> fx, accx -> ax, etc.
        const prefixMap = {
            'fmtx': 'fx',
            'accx': 'ax',
            'bindx': 'bx',
            'dragx': 'dx',
            'loadx': 'lx',
            'navx': 'nx',
            'tablex': 'tx',
            'smartx': 'sx'
        };
        const modulePrefix = prefixMap[name] || name;
        modulePaths[modulePrefix] = `/${hashedFile}`;
    }

    // Build parserPaths config
    const parserPaths = {};
    for (const [name, hashedPath] of Object.entries(manifest.parsers)) {
        parserPaths[name] = `/${hashedPath}`;
    }

    // Update modulePaths - replace existing hashed paths or add if not present
    // Pattern matches: modulePaths: isLocal ? {} : { ... }
    const modulePathsPattern = /(modulePaths: isLocal \? \{\} : \{)[^}]+(\})/;
    const modulePathsReplacement = `$1\n                ${Object.entries(modulePaths).map(([k, v]) => `"${k}": "${v}"`).join(',\n                ')}\n            $2`;

    if (modulePathsPattern.test(html)) {
        html = html.replace(modulePathsPattern, modulePathsReplacement);
    }

    // Update parserPaths for production (CDN) - pattern: } : { ... } at end of parserPaths
    // Pattern matches the production side of: parserPaths: isLocal ? {...} : {...}
    const parserPathsPattern = /(parserPaths: isLocal \? \{[^}]+\} : \{)[^}]+(\})/;
    const parserPathsReplacement = `$1\n                ${Object.entries(parserPaths).map(([k, v]) => `"${k}": "${v}"`).join(',\n                ')}\n            $2`;

    if (parserPathsPattern.test(html)) {
        html = html.replace(parserPathsPattern, parserPathsReplacement);
    }

    // Update bootloader URL
    const bootloaderPattern = /(const bootloaderSrc = isLocal \? '[^']+' : 'https:\/\/cdn\.genx\.software\/v1\/)[^']+(')/;
    html = html.replace(bootloaderPattern, `$1${manifest.bootloader}$2`);

    fs.writeFileSync(demoPath, html);
    console.log('  Updated genxConfig with hashed paths');
    console.log(`  Bootloader: ${manifest.bootloader}`);
}

// Run build
build();
