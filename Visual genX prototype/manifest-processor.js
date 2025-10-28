/**
 * GenX Manifest Processor
 * Applies transformations from visual tagger manifest to HTML
 * Can be used by AI coding agents or developers for implementation
 */

class ManifestProcessor {
    constructor(options = {}) {
        this.options = {
            dryRun: false,
            generateDiff: true,
            validateSelectors: true,
            outputFormat: 'inline', // inline | external | build
            ...options
        };
        
        this.stats = {
            selectorsProcessed: 0,
            elementsTransformed: 0,
            errors: []
        };
    }

    /**
     * Process a manifest and apply transformations
     * @param {Object} manifest - The manifest from visual tagger
     * @param {String|Document} target - HTML string or document to transform
     * @returns {Object} Result with transformed HTML and implementation guide
     */
    async process(manifest, target) {
        // Validate manifest
        this.validateManifest(manifest);
        
        // Parse target
        const doc = this.parseTarget(target);
        
        // Generate implementation based on output format
        switch (this.options.outputFormat) {
            case 'inline':
                return this.generateInlineImplementation(manifest, doc);
            case 'external':
                return this.generateExternalImplementation(manifest, doc);
            case 'build':
                return this.generateBuildImplementation(manifest);
            default:
                throw new Error(`Unknown output format: ${this.options.outputFormat}`);
        }
    }

    /**
     * Generate inline implementation (attributes added to HTML)
     */
    generateInlineImplementation(manifest, doc) {
        const changes = [];
        const errors = [];
        
        manifest.transformations.forEach(transform => {
            try {
                const elements = doc.querySelectorAll(transform.selector);
                
                if (elements.length === 0) {
                    errors.push({
                        selector: transform.selector,
                        error: 'No elements found'
                    });
                    return;
                }
                
                elements.forEach(element => {
                    // Record current state
                    const before = element.outerHTML;
                    
                    // Apply attributes
                    Object.entries(transform.attributes).forEach(([attr, value]) => {
                        element.setAttribute(attr, value);
                    });
                    
                    // Record change
                    changes.push({
                        selector: transform.selector,
                        element: this.getElementPath(element),
                        before: before,
                        after: element.outerHTML,
                        attributes: transform.attributes
                    });
                    
                    this.stats.elementsTransformed++;
                });
                
                this.stats.selectorsProcessed++;
            } catch (error) {
                errors.push({
                    selector: transform.selector,
                    error: error.message
                });
            }
        });
        
        return {
            format: 'inline',
            html: doc.documentElement.outerHTML,
            changes: changes,
            errors: errors,
            stats: this.stats,
            implementation: this.generateInlineGuide(manifest, changes)
        };
    }

    /**
     * Generate external implementation (separate configuration file)
     */
    generateExternalImplementation(manifest, doc) {
        const config = {
            version: '1.0',
            generated: new Date().toISOString(),
            rules: []
        };
        
        // Group by selector for efficiency
        const selectorMap = new Map();
        
        manifest.transformations.forEach(transform => {
            if (!selectorMap.has(transform.selector)) {
                selectorMap.set(transform.selector, {
                    selector: transform.selector,
                    attributes: {},
                    types: []
                });
            }
            
            const rule = selectorMap.get(transform.selector);
            Object.assign(rule.attributes, transform.attributes);
            rule.types.push(transform.type);
        });
        
        // Convert to array
        selectorMap.forEach(rule => {
            config.rules.push(rule);
        });
        
        // Generate initialization script
        const initScript = `
<!-- GenX Configuration -->
<script>
window.genxConfig = ${JSON.stringify(config, null, 2)};
</script>

<!-- GenX Loader -->
<script src="https://cdn.genx.dev/loader.js"></script>
<script>
// Apply configurations after DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.GenX) {
        GenX.applyConfig(window.genxConfig);
    }
});
</script>`;

        return {
            format: 'external',
            config: config,
            initScript: initScript,
            implementation: this.generateExternalGuide(config),
            stats: this.stats
        };
    }

    /**
     * Generate build-time implementation (for build tools)
     */
    generateBuildImplementation(manifest) {
        const implementations = {
            webpack: this.generateWebpackPlugin(manifest),
            vite: this.generateVitePlugin(manifest),
            postcss: this.generatePostCSSPlugin(manifest),
            babel: this.generateBabelPlugin(manifest)
        };
        
        return {
            format: 'build',
            implementations: implementations,
            stats: this.stats
        };
    }

    /**
     * Generate Webpack plugin implementation
     */
    generateWebpackPlugin(manifest) {
        return `
// genx-webpack-plugin.js
const HtmlWebpackPlugin = require('html-webpack-plugin');

class GenXWebpackPlugin {
    constructor(options = {}) {
        this.manifest = ${JSON.stringify(manifest, null, 4)};
    }
    
    apply(compiler) {
        compiler.hooks.compilation.tap('GenXWebpackPlugin', (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
                'GenXWebpackPlugin',
                (data, cb) => {
                    // Apply transformations during build
                    this.manifest.transformations.forEach(transform => {
                        // Process HTML here
                    });
                    cb(null, data);
                }
            );
        });
    }
}

module.exports = GenXWebpackPlugin;

// webpack.config.js usage:
const GenXWebpackPlugin = require('./genx-webpack-plugin');

module.exports = {
    plugins: [
        new GenXWebpackPlugin()
    ]
};`;
    }

    /**
     * Generate Vite plugin implementation
     */
    generateVitePlugin(manifest) {
        return `
// vite-plugin-genx.js
export default function genxPlugin() {
    const manifest = ${JSON.stringify(manifest, null, 4)};
    
    return {
        name: 'vite-plugin-genx',
        transformIndexHtml(html) {
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Apply transformations
            manifest.transformations.forEach(transform => {
                const elements = doc.querySelectorAll(transform.selector);
                elements.forEach(el => {
                    Object.entries(transform.attributes).forEach(([attr, value]) => {
                        el.setAttribute(attr, value);
                    });
                });
            });
            
            return doc.documentElement.outerHTML;
        }
    };
}

// vite.config.js usage:
import genxPlugin from './vite-plugin-genx';

export default {
    plugins: [genxPlugin()]
};`;
    }

    /**
     * Generate PostCSS plugin implementation
     */
    generatePostCSSPlugin(manifest) {
        return `
// postcss-genx.js
module.exports = (opts = {}) => {
    const manifest = ${JSON.stringify(manifest, null, 4)};
    
    return {
        postcssPlugin: 'postcss-genx',
        Once(root, { result }) {
            // Add GenX classes based on manifest
            manifest.transformations.forEach(transform => {
                // Generate CSS for each transformation
                const className = \`genx-\${transform.type.toLowerCase().replace(/\s+/g, '-')}\`;
                const rule = \`.\${className} { /* GenX attributes will be applied via JS */ }\`;
                root.append(rule);
            });
        }
    };
};

module.exports.postcss = true;`;
    }

    /**
     * Generate Babel plugin implementation
     */
    generateBabelPlugin(manifest) {
        return `
// babel-plugin-genx.js
module.exports = function() {
    const manifest = ${JSON.stringify(manifest, null, 4)};
    
    return {
        visitor: {
            JSXElement(path) {
                const openingElement = path.node.openingElement;
                
                // Check if element matches any selector
                manifest.transformations.forEach(transform => {
                    // Match logic here
                    // Add attributes to JSX
                });
            }
        }
    };
};

// .babelrc usage:
{
    "plugins": ["./babel-plugin-genx"]
}`;
    }

    /**
     * Generate implementation guide for inline approach
     */
    generateInlineGuide(manifest, changes) {
        const guide = {
            title: 'Inline Implementation Guide',
            description: 'Add GenX attributes directly to HTML elements',
            steps: [],
            codeChanges: []
        };
        
        // Group changes by file/component
        const fileGroups = new Map();
        
        changes.forEach(change => {
            // For this example, we'll assume single HTML file
            const file = 'index.html';
            
            if (!fileGroups.has(file)) {
                fileGroups.set(file, []);
            }
            
            fileGroups.get(file).push({
                line: this.estimateLineNumber(change.selector),
                selector: change.selector,
                attributes: change.attributes,
                diff: this.generateDiff(change.before, change.after)
            });
        });
        
        // Generate steps
        let stepNum = 1;
        fileGroups.forEach((changes, file) => {
            guide.steps.push({
                number: stepNum++,
                action: `Open ${file}`,
                description: `Make the following changes to ${changes.length} elements`
            });
            
            changes.forEach(change => {
                guide.codeChanges.push({
                    file: file,
                    selector: change.selector,
                    change: change.diff,
                    attributes: change.attributes
                });
            });
        });
        
        // Add setup step
        guide.steps.unshift({
            number: 0,
            action: 'Include GenX libraries',
            description: 'Add GenX loader to your HTML head',
            code: '<script src="https://cdn.genx.dev/loader.js"></script>'
        });
        
        return guide;
    }

    /**
     * Generate implementation guide for external approach
     */
    generateExternalGuide(config) {
        return {
            title: 'External Configuration Guide',
            description: 'Use a separate configuration file for GenX transformations',
            steps: [
                {
                    number: 1,
                    action: 'Create configuration file',
                    file: 'genx.config.json',
                    content: JSON.stringify(config, null, 2)
                },
                {
                    number: 2,
                    action: 'Add to HTML head',
                    code: `
<script>
    window.genxConfig = ${JSON.stringify(config, null, 2)};
</script>
<script src="https://cdn.genx.dev/loader.js"></script>`
                },
                {
                    number: 3,
                    action: 'Initialize on DOM ready',
                    code: `
<script>
    document.addEventListener('DOMContentLoaded', function() {
        GenX.applyConfig(window.genxConfig);
    });
</script>`
                }
            ]
        };
    }

    /**
     * Validate manifest structure
     */
    validateManifest(manifest) {
        if (!manifest || typeof manifest !== 'object') {
            throw new Error('Invalid manifest: must be an object');
        }
        
        if (!Array.isArray(manifest.transformations)) {
            throw new Error('Invalid manifest: transformations must be an array');
        }
        
        manifest.transformations.forEach((transform, index) => {
            if (!transform.selector) {
                throw new Error(`Invalid transformation at index ${index}: missing selector`);
            }
            
            if (!transform.attributes || typeof transform.attributes !== 'object') {
                throw new Error(`Invalid transformation at index ${index}: attributes must be an object`);
            }
        });
    }

    /**
     * Parse target HTML
     */
    parseTarget(target) {
        if (typeof target === 'string') {
            // Parse HTML string
            if (typeof DOMParser !== 'undefined') {
                const parser = new DOMParser();
                return parser.parseFromString(target, 'text/html');
            } else {
                // Node.js environment - use jsdom or similar
                const jsdom = require('jsdom');
                const { JSDOM } = jsdom;
                const dom = new JSDOM(target);
                return dom.window.document;
            }
        } else if (target && target.documentElement) {
            // Already a document
            return target;
        } else {
            throw new Error('Invalid target: must be HTML string or Document');
        }
    }

    /**
     * Get element path for debugging
     */
    getElementPath(element) {
        const path = [];
        let current = element;
        
        while (current && current.tagName) {
            let selector = current.tagName.toLowerCase();
            
            if (current.id) {
                selector += `#${current.id}`;
            } else if (current.className) {
                selector += `.${current.className.split(' ').join('.')}`;
            }
            
            path.unshift(selector);
            current = current.parentElement;
        }
        
        return path.join(' > ');
    }

    /**
     * Generate diff for changes
     */
    generateDiff(before, after) {
        // Simple diff for demonstration
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        const diff = [];
        
        beforeLines.forEach((line, i) => {
            if (afterLines[i] !== line) {
                diff.push(`- ${line}`);
                if (afterLines[i]) {
                    diff.push(`+ ${afterLines[i]}`);
                }
            }
        });
        
        return diff.join('\n');
    }

    /**
     * Estimate line number for selector (for guidance)
     */
    estimateLineNumber(selector) {
        // This would need actual HTML parsing to be accurate
        // For now, return a placeholder
        return '??';
    }
}

/**
 * AI Agent Integration Helper
 */
class AIAgentHelper {
    /**
     * Generate prompts for AI coding agents
     */
    static generatePrompts(manifest) {
        const prompts = {
            github_copilot: `
# Add GenX transformations to HTML
# Based on manifest with ${manifest.transformations.length} transformations

${manifest.transformations.map(t => 
`- Find: ${t.selector}
  Add attributes: ${Object.entries(t.attributes).map(([k,v]) => `${k}="${v}"`).join(' ')}`
).join('\n')}
`,
            
            cursor: `
Apply GenX transformations:
${manifest.transformations.map(t => 
`@${t.selector} { add attributes: ${JSON.stringify(t.attributes)} }`
).join('\n')}
`,
            
            codeium: `
Task: Apply GenX accessibility and formatting attributes
Manifest: ${JSON.stringify(manifest, null, 2)}
Instructions: For each selector, add the specified attributes to matching elements.
`
        };
        
        return prompts;
    }
    
    /**
     * Generate test cases for transformations
     */
    static generateTests(manifest) {
        return `
// GenX Transformation Tests
describe('GenX Transformations', () => {
    ${manifest.transformations.map(transform => `
    it('should transform ${transform.selector}', () => {
        const element = document.querySelector('${transform.selector}');
        expect(element).toBeTruthy();
        ${Object.entries(transform.attributes).map(([attr, value]) => `
        expect(element.getAttribute('${attr}')).toBe('${value}');`).join('')}
    });`).join('\n')}
});`;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ManifestProcessor, AIAgentHelper };
} else if (typeof window !== 'undefined') {
    window.ManifestProcessor = ManifestProcessor;
    window.AIAgentHelper = AIAgentHelper;
}
