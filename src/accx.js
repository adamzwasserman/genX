/**
 * AccessX - Automated accessibility enhancement library
 * @version 1.0 - Making WCAG compliance easier with HTML attributes
 */
(function() {
    'use strict';

    // Utils
    const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const safeJsonParse = v => {
        try {
            return JSON.parse(v); 
        } catch {
            return v; 
        } 
    };
    const generateId = () => `ax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // A11y enhancement functions
    const enhance = {
        // Screen reader annotations
        srOnly: (el, opts) => {
            const text = opts.text || el.getAttribute('ax-sr-text');
            if (!text) {
                return;
            }
            const span = document.createElement('span');
            span.className = 'sr-only ax-sr-only';
            span.textContent = text;
            span.setAttribute('aria-hidden', 'false');
            el.appendChild(span);
            // Add CSS if not exists
            if (!document.getElementById('ax-sr-styles')) {
                const style = document.createElement('style');
                style.id = 'ax-sr-styles';
                style.textContent = '.ax-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0,0,0,0) !important; white-space: nowrap !important; border: 0 !important; }';
                document.head.appendChild(style);
            }
        },

        // Automatic ARIA labels
        label: (el, opts) => {
            const type = opts.type || 'auto';
            const context = opts.context || el.textContent?.trim();

            switch(type) {
            case 'currency': {
                const amount = el.textContent?.trim();
                el.setAttribute('aria-label', `${amount} dollars`);
                break;
            }
            case 'icon': {
                const icon = opts.icon || el.className;
                const meaning = opts.meaning || guessIconMeaning(icon);
                el.setAttribute('aria-label', meaning);
                el.setAttribute('role', 'img');
                break;
            }
            case 'abbreviation': {
                const full = opts.full || expandAbbreviation(context);
                el.setAttribute('aria-label', full);
                el.setAttribute('title', full);
                break;
            }
            case 'date': {
                const date = new Date(context);
                if (!isNaN(date)) {
                    const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    el.setAttribute('aria-label', formatted);
                }
                break;
            }
            case 'time':
                el.setAttribute('aria-label', `${context} ${opts.timezone || ''}`);
                break;
            case 'percentage':
                el.setAttribute('aria-label', `${context} percent`);
                break;
            case 'auto':
            default:
                if (context) {
                    el.setAttribute('aria-label', opts.label || context);
                }
            }
        },

        // Live regions for dynamic content
        live: (el, opts) => {
            const priority = opts.priority || 'polite';
            const atomic = opts.atomic !== false;
            const relevant = opts.relevant || 'additions text';

            el.setAttribute('aria-live', priority);
            el.setAttribute('aria-atomic', atomic);
            el.setAttribute('aria-relevant', relevant);

            if (opts.status) {
                el.setAttribute('role', 'status');
            }
            if (opts.alert) {
                el.setAttribute('role', 'alert');
            }
        },

        // Form field enhancements
        field: (el, opts) => {
            const required = opts.required || el.hasAttribute('required');
            const invalid = opts.invalid || el.getAttribute('aria-invalid');
            const describedBy = [];

            // Auto-generate IDs if needed
            if (!el.id) {
                el.id = generateId();
            }

            // Required field
            if (required) {
                el.setAttribute('aria-required', 'true');
                if (!el.hasAttribute('required')) {
                    el.setAttribute('required', '');
                }
            }

            // Error handling
            if (invalid || el.hasAttribute('ax-error')) {
                el.setAttribute('aria-invalid', 'true');
                const errorMsg = opts.error || el.getAttribute('ax-error');
                if (errorMsg) {
                    const errorId = `${el.id}-error`;
                    let errorEl = document.getElementById(errorId);
                    if (!errorEl) {
                        errorEl = document.createElement('span');
                        errorEl.id = errorId;
                        errorEl.className = 'ax-error-message';
                        errorEl.setAttribute('role', 'alert');
                        errorEl.textContent = errorMsg;
                        el.parentNode.insertBefore(errorEl, el.nextSibling);
                    }
                    describedBy.push(errorId);
                }
            }

            // Help text
            if (opts.help || el.hasAttribute('ax-help')) {
                const helpText = opts.help || el.getAttribute('ax-help');
                const helpId = `${el.id}-help`;
                let helpEl = document.getElementById(helpId);
                if (!helpEl) {
                    helpEl = document.createElement('span');
                    helpEl.id = helpId;
                    helpEl.className = 'ax-help-text';
                    helpEl.textContent = helpText;
                    el.parentNode.insertBefore(helpEl, el.nextSibling);
                }
                describedBy.push(helpId);
            }

            // Character count
            const maxLength = el.getAttribute('maxlength');
            if (maxLength && opts.showCount !== false) {
                const countId = `${el.id}-count`;
                let countEl = document.getElementById(countId);
                if (!countEl) {
                    countEl = document.createElement('span');
                    countEl.id = countId;
                    countEl.className = 'ax-char-count';
                    countEl.setAttribute('aria-live', 'polite');
                    countEl.setAttribute('aria-atomic', 'true');
                    el.parentNode.insertBefore(countEl, el.nextSibling);
                }

                const updateCount = () => {
                    const remaining = maxLength - el.value.length;
                    countEl.textContent = `${remaining} characters remaining`;
                };

                updateCount();
                el.addEventListener('input', updateCount);
                describedBy.push(countId);
            }

            // Set described-by
            if (describedBy.length > 0) {
                el.setAttribute('aria-describedby', describedBy.join(' '));
            }
        },

        // Navigation enhancements
        nav: (el, opts) => {
            const label = opts.label || el.getAttribute('ax-nav-label') || 'Navigation';
            el.setAttribute('role', 'navigation');
            el.setAttribute('aria-label', label);

            // Mark current page
            if (opts.current || el.hasAttribute('ax-current')) {
                const currentLink = el.querySelector('a[href="' + window.location.pathname + '"]');
                if (currentLink) {
                    currentLink.setAttribute('aria-current', 'page');
                }
            }
        },

        // Button enhancements
        button: (el, opts) => {
            if (!el.hasAttribute('role') && el.tagName !== 'BUTTON') {
                el.setAttribute('role', 'button');
            }

            // Ensure keyboard accessibility
            if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON' && el.tagName !== 'A') {
                el.setAttribute('tabindex', '0');
            }

            // Add keyboard handlers for non-button elements
            if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        el.click();
                    }
                });
            }

            // Loading state
            if (opts.loading || el.hasAttribute('ax-loading')) {
                el.setAttribute('aria-busy', 'true');
                el.setAttribute('aria-disabled', 'true');
            }

            // Pressed state for toggles
            if (opts.pressed !== undefined) {
                el.setAttribute('aria-pressed', opts.pressed);
            }
        },

        // Table enhancements
        table: (el, opts) => {
            const caption = opts.caption || el.getAttribute('ax-caption');
            if (caption && !el.querySelector('caption')) {
                const cap = document.createElement('caption');
                cap.textContent = caption;
                el.insertBefore(cap, el.firstChild);
            }

            // Auto-detect and mark header cells
            if (opts.autoHeaders !== false) {
                // First row as headers
                const firstRow = el.querySelector('tr');
                if (firstRow) {
                    firstRow.querySelectorAll('td').forEach(cell => {
                        const th = document.createElement('th');
                        // Safe: move child nodes instead of using innerHTML
                        while (cell.firstChild) {
                            th.appendChild(cell.firstChild);
                        }
                        th.scope = 'col';
                        cell.parentNode.replaceChild(th, cell);
                    });
                }

                // First column as row headers
                if (opts.rowHeaders) {
                    el.querySelectorAll('tr').forEach((row, i) => {
                        if (i > 0) {  // Skip header row
                            const firstCell = row.querySelector('td');
                            if (firstCell) {
                                const th = document.createElement('th');
                                // Safe: move child nodes instead of using innerHTML
                                while (firstCell.firstChild) {
                                    th.appendChild(firstCell.firstChild);
                                }
                                th.scope = 'row';
                                firstCell.parentNode.replaceChild(th, firstCell);
                            }
                        }
                    });
                }
            }

            // Sortable columns
            el.querySelectorAll('th[ax-sortable]').forEach(th => {
                th.setAttribute('aria-sort', 'none');
                th.setAttribute('role', 'button');
                th.setAttribute('tabindex', '0');

                const toggleSort = () => {
                    const current = th.getAttribute('aria-sort');
                    // Reset other columns
                    el.querySelectorAll('th[aria-sort]').forEach(other => {
                        if (other !== th) {
                            other.setAttribute('aria-sort', 'none');
                        }
                    });
                    // Toggle this column
                    if (current === 'ascending') {
                        th.setAttribute('aria-sort', 'descending');
                    } else {
                        th.setAttribute('aria-sort', 'ascending');
                    }
                };

                th.addEventListener('click', toggleSort);
                th.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSort();
                    }
                });
            });
        },

        // Image enhancements
        image: (el, opts) => {
            const altText = opts.alt || el.getAttribute('alt');
            const isDecorative = opts.decorative || el.hasAttribute('ax-decorative');

            if (isDecorative) {
                el.setAttribute('role', 'presentation');
                el.setAttribute('aria-hidden', 'true');
                el.setAttribute('alt', '');
            } else if (!altText) {
                // Try to generate alt text from context
                const fileName = el.src?.split('/').pop()?.split('.')[0];
                const generated = fileName?.replace(/[-_]/g, ' ') || 'Image';
                el.setAttribute('alt', generated);
                console.warn(`AccessX: Generated alt text "${generated}" for image. Please provide proper alt text.`);
            }

            // Long description
            const longDesc = opts.description || el.getAttribute('ax-description');
            if (longDesc) {
                const descId = generateId();
                const desc = document.createElement('span');
                desc.id = descId;
                desc.className = 'ax-sr-only';
                desc.textContent = longDesc;
                el.parentNode.insertBefore(desc, el.nextSibling);
                el.setAttribute('aria-describedby', descId);
            }
        },

        // Modal/dialog enhancements
        modal: (el, opts) => {
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-modal', 'true');

            const label = opts.label || el.querySelector('h1, h2, h3')?.textContent;
            if (label) {
                const labelId = generateId();
                const labelEl = el.querySelector('h1, h2, h3');
                if (labelEl) {
                    labelEl.id = labelId;
                    el.setAttribute('aria-labelledby', labelId);
                } else {
                    el.setAttribute('aria-label', label);
                }
            }

            // Trap focus
            if (opts.trapFocus !== false) {
                const focusableSelectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
                const focusableElements = el.querySelectorAll(focusableSelectors);

                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        const firstElement = focusableElements[0];
                        const lastElement = focusableElements[focusableElements.length - 1];

                        if (e.shiftKey && document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        } else if (!e.shiftKey && document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }

                    if (e.key === 'Escape' && opts.closeOnEscape !== false) {
                        el.style.display = 'none';
                        el.setAttribute('aria-hidden', 'true');
                    }
                });
            }
        },

        // Skip links
        skipLink: (el, opts) => {
            const target = opts.target || '#main';
            const text = opts.text || 'Skip to main content';

            const link = document.createElement('a');
            link.href = target;
            link.className = 'ax-skip-link';
            link.textContent = text;

            // Add CSS for skip link
            if (!document.getElementById('ax-skip-styles')) {
                const style = document.createElement('style');
                style.id = 'ax-skip-styles';
                style.textContent = '.ax-skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; text-decoration: none; z-index: 100000; } .ax-skip-link:focus { top: 0; }';
                document.head.appendChild(style);
            }

            document.body.insertBefore(link, document.body.firstChild);
        },

        // Landmark roles
        landmark: (el, opts) => {
            const role = opts.role || el.getAttribute('ax-role');
            const label = opts.label || el.getAttribute('ax-label');

            if (role) {
                el.setAttribute('role', role);
            }
            if (label) {
                el.setAttribute('aria-label', label);
            }

            // Common landmarks
            switch(role) {
            case 'main':
                if (!document.querySelector('[role="main"], main')) {
                    el.id = el.id || 'main';
                }
                break;
            case 'search': {
                const searchInput = el.querySelector('input[type="search"], input[type="text"]');
                if (searchInput && !searchInput.getAttribute('aria-label')) {
                    searchInput.setAttribute('aria-label', 'Search');
                }
                break;
            }
            }
        },

        // Focus management
        focus: (el, opts) => {
            // Visual focus indicator
            if (opts.enhance !== false) {
                el.classList.add('ax-focus-enhanced');
                if (!document.getElementById('ax-focus-styles')) {
                    const style = document.createElement('style');
                    style.id = 'ax-focus-styles';
                    style.textContent = '.ax-focus-enhanced:focus { outline: 3px solid #0066cc !important; outline-offset: 2px !important; }';
                    document.head.appendChild(style);
                }
            }

            // Focus trap for groups
            if (opts.trap) {
                const group = el;
                const items = group.querySelectorAll(opts.selector || '[tabindex="0"]');
                let currentIndex = 0;

                group.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        currentIndex = (currentIndex + 1) % items.length;
                        items[currentIndex].focus();
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        currentIndex = (currentIndex - 1 + items.length) % items.length;
                        items[currentIndex].focus();
                    }
                });
            }
        },

        // Announce changes
        announce: (el, opts) => {
            const message = opts.message || el.textContent;
            const priority = opts.priority || 'polite';

            let announcer = document.getElementById('ax-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'ax-announcer';
                announcer.className = 'ax-sr-only';
                announcer.setAttribute('aria-live', priority);
                announcer.setAttribute('aria-atomic', 'true');
                document.body.appendChild(announcer);
            }

            // Clear and announce (force screen reader to announce)
            announcer.textContent = '';
            setTimeout(() => announcer.textContent = message, 100);
        }
    };

    // Helper functions
    const guessIconMeaning = (className) => {
        const iconMap = {
            'home': 'Home',
            'search': 'Search',
            'menu': 'Menu',
            'close': 'Close',
            'arrow': 'Arrow',
            'user': 'User profile',
            'cart': 'Shopping cart',
            'heart': 'Favorite',
            'star': 'Rating',
            'check': 'Complete',
            'error': 'Error',
            'warning': 'Warning',
            'info': 'Information'
        };

        for (const [key, value] of Object.entries(iconMap)) {
            if (className.toLowerCase().includes(key)) {
                return value;
            }
        }
        return 'Icon';
    };

    const expandAbbreviation = (abbr) => {
        const common = {
            'USA': 'United States of America',
            'UK': 'United Kingdom',
            'EU': 'European Union',
            'AI': 'Artificial Intelligence',
            'API': 'Application Programming Interface',
            'CEO': 'Chief Executive Officer',
            'FAQ': 'Frequently Asked Questions',
            'ID': 'Identification',
            'URL': 'Uniform Resource Locator',
            'PDF': 'Portable Document Format'
        };
        return common[abbr.toUpperCase()] || abbr;
    };

    // DOM processing
    const processElement = (el, prefix = 'ax-') => {
        // Get enhancement type
        const enhanceType = el.getAttribute(`${prefix}enhance`);
        if (!enhanceType) {
            return;
        }

        // Parse options
        const opts = {};
        for (const attr of el.attributes) {
            if (attr.name.startsWith(prefix) && attr.name !== `${prefix}enhance`) {
                const optName = kebabToCamel(attr.name.slice(prefix.length));
                opts[optName] = safeJsonParse(attr.value);
            }
        }

        // Apply enhancement
        const enhancer = enhance[enhanceType];
        if (enhancer) {
            enhancer(el, opts);
            el.setAttribute(`${prefix}enhanced`, 'true');
        } else {
            console.warn(`AccessX: Unknown enhancement type '${enhanceType}'`);
        }
    };

    const scan = (root = document, prefix = 'ax-') => {
        root.querySelectorAll(`[${prefix}enhance]:not([${prefix}enhanced])`).forEach(el => {
            processElement(el, prefix);
        });
    };

    // Observer
    const createObserver = (prefix) => {
        let observer = null;

        const callback = (mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.matches?.(`[${prefix}enhance]`)) {
                                processElement(node, prefix);
                            }
                            node.querySelectorAll?.(`[${prefix}enhance]`).forEach(el => {
                                processElement(el, prefix);
                            });
                        }
                    });
                }
            });
        };

        return {
            start: () => {
                if (!observer) {
                    observer = new MutationObserver(callback);
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            },
            stop: () => {
                observer?.disconnect();
                observer = null;
            }
        };
    };

    // Validation
    const validate = (el) => {
        const issues = [];

        // Check images
        if (el.tagName === 'IMG' && !el.getAttribute('alt')) {
            issues.push({ element: el, issue: 'Missing alt text', severity: 'error' });
        }

        // Check form fields
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
            if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
                const label = document.querySelector(`label[for="${el.id}"]`);
                if (!label) {
                    issues.push({ element: el, issue: 'Form field without label', severity: 'error' });
                }
            }
        }

        // Check headings hierarchy
        if (/^H[1-6]$/.test(el.tagName)) {
            const level = parseInt(el.tagName[1]);
            const prevHeading = el.previousElementSibling?.closest('h1, h2, h3, h4, h5, h6');
            if (prevHeading) {
                const prevLevel = parseInt(prevHeading.tagName[1]);
                if (level > prevLevel + 1) {
                    issues.push({ element: el, issue: 'Skipped heading level', severity: 'warning' });
                }
            }
        }

        return issues;
    };

    // Init
    const initAccessX = (config = {}) => {
        const { prefix = 'ax-', auto = true, observe = true } = config;
        const observer = createObserver(prefix);

        const api = {
            enhance: (type, el, opts) => enhance[type]?.(el, opts),
            process: el => processElement(el, prefix),
            scan: root => scan(root, prefix),
            validate: el => validate(el),
            announce: (msg, priority) => enhance.announce(null, { message: msg, priority }),
            destroy: () => observer.stop()
        };

        if (auto) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    scan(document, prefix);
                    if (observe) {
                        observer.start();
                    }
                });
            } else {
                scan(document, prefix);
                if (observe) {
                    observer.start();
                }
            }
        }

        return api;
    };

    // Factory export for bootloader integration
    window.axXFactory = {
        init: (config = {}) => initAccessX(config),
        enhance
    };

    // Legacy global for standalone use (when not using bootloader)
    if (!window.genx) {
        window.AccessX = initAccessX();
    }

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initAccessX, enhance };
    }
})();