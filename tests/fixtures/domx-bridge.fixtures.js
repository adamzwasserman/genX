/**
 * Fixtures for domx-bridge integration tests
 * Provides test HTML and helper functions for BDD scenarios
 */

/**
 * Base HTML with domx and domx-bridge loaded
 */
const baseHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>domx-bridge Test</title>
</head>
<body>
    <div id="test-container"></div>
</body>
</html>
`;

/**
 * Create test element with genX attribute
 * @param {string} prefix - Attribute prefix (e.g., 'fx-', 'ax-', 'bx-')
 * @param {string} attrName - Attribute name after prefix (e.g., 'format', 'enhance')
 * @param {string} attrValue - Attribute value
 * @returns {string} HTML string
 */
function createTestElement(prefix, attrName, attrValue) {
    return `<div ${prefix}${attrName}="${attrValue}">Test Content</div>`;
}

/**
 * Test scenarios for attribute filtering
 */
const attributeFilterScenarios = {
    fmtx: {
        prefix: 'fx-',
        attributes: ['format', 'raw', 'value', 'type'],
        testElement: '<span fx-format="currency">1234.56</span>'
    },
    accx: {
        prefix: 'ax-',
        attributes: ['enhance', 'sr-text', 'label', 'live'],
        testElement: '<div ax-enhance="button" ax-label="Submit">Click</div>'
    },
    bindx: {
        prefix: 'bx-',
        attributes: ['model', 'bind', 'on', 'if', 'for'],
        testElement: '<input bx-model="username" type="text">'
    },
    loadx: {
        prefix: 'lx-',
        attributes: ['load', 'spinner', 'placeholder'],
        testElement: '<div lx-load="lazy">Loading...</div>'
    },
    navx: {
        prefix: 'nx-',
        attributes: ['nav', 'breadcrumb', 'trail'],
        testElement: '<nav nx-nav="main">Navigation</nav>'
    },
    dragx: {
        prefix: 'dx-',
        attributes: ['draggable', 'dropzone', 'data'],
        testElement: '<div dx-draggable="card">Draggable</div>'
    }
};

/**
 * Mock domx module for testing when domx is not available
 */
const mockDomx = `
window.domx = (function() {
    let observer = null;
    const callbacks = new Set();

    function ensureObserver() {
        if (observer) return;
        observer = new MutationObserver((mutations) => {
            for (const cb of callbacks) {
                cb(mutations);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    return {
        on: function(callback) {
            ensureObserver();
            callbacks.add(callback);
            return () => callbacks.delete(callback);
        },
        getObserverCount: function() {
            return observer ? 1 : 0;
        },
        getCallbackCount: function() {
            return callbacks.size;
        }
    };
})();
`;

/**
 * Helper to inject scripts and wait for them to load
 */
async function loadScripts(page, scripts) {
    for (const script of scripts) {
        if (script.path) {
            await page.addScriptTag({ path: script.path });
        } else if (script.content) {
            await page.addScriptTag({ content: script.content });
        }
    }
}

module.exports = {
    baseHTML,
    createTestElement,
    attributeFilterScenarios,
    mockDomx,
    loadScripts
};
