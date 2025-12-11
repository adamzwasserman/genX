/**
 * navX - Declarative Navigation Module for genX Platform
 *
 * Provides navigation enhancements through HTML attributes:
 * - nx-nav: Basic navigation with active link tracking
 * - nx-breadcrumb: Hierarchical and trail-based breadcrumbs
 * - nx-trail: Session history breadcrumb tracking
 * - nx-tabs: Accessible tab navigation
 * - nx-scroll-spy: Section highlighting on scroll
 * - nx-sticky: Sticky navigation headers
 * - nx-mobile: Mobile hamburger menus
 * - nx-dropdown: Dropdown menus with keyboard navigation
 *
 * Architecture: Pure functional design, no classes
 * Performance: <10ms processing, <5KB gzipped
 * Accessibility: Full WCAG 2.1 AA compliance
 *
 * @module navx
 * @version 1.0.0
 */

(function(global) {
    'use strict';

    // ============================================================================
    // MODULE METADATA
    // ============================================================================

    const VERSION = '1.0.0';
    const MODULE_NAME = 'navX';

    // ============================================================================
    // GENX-COMMON INTEGRATION
    // ============================================================================

    // Try to import genx-common utilities if available
    let GenXError, ParseError, EnhancementError, Ok, Err;

    if (typeof window !== 'undefined' && window.genXCommon) {
    // Use genx-common if available
        GenXError = window.genXCommon.GenXError;
        ParseError = window.genXCommon.ParseError;
        EnhancementError = window.genXCommon.EnhancementError;
        Ok = window.genXCommon.Ok;
        Err = window.genXCommon.Err;
    } else {
    // Fallback: simple error classes
        GenXError = class extends Error {
            constructor(code, message, context = {}) {
                super(message);
                this.name = 'GenXError';
                this.code = code;
                this.context = context;
            }
        };
        ParseError = class extends GenXError {
            constructor(code, message, context = {}) {
                super(code, message, context);
                this.name = 'ParseError';
            }
        };
        EnhancementError = class extends GenXError {
            constructor(code, message, context = {}) {
                super(code, message, context);
                this.name = 'EnhancementError';
            }
        };
        // Simple Result monad fallback
        Ok = (value) => ({ isOk: () => true, isErr: () => false, unwrap: () => value });
        Err = (error) => ({ isOk: () => false, isErr: () => true, unwrap: () => {
            throw error;
        } });
    }

    // ============================================================================
    // ACCX INTEGRATION
    // ============================================================================

    // Check if accX is available for enhanced accessibility
    const hasAccX = typeof window !== 'undefined' && window.accX;

    /**
   * Enhance element with accX if available
   * @param {HTMLElement} element - Element to enhance
   * @param {Object} options - accX options
   */
    const enhanceWithAccX = (element, options = {}) => {
        if (hasAccX && window.accX.enhance) {
            try {
                window.accX.enhance(element, options);
                debug('Enhanced with accX:', element, options);
            } catch (err) {
                warn('accX enhancement failed:', err);
            }
        }
    };

    /**
   * Announce to screen readers using accX live regions
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
    const announceToScreenReader = (message, priority = 'polite') => {
        if (hasAccX && window.accX.announce) {
            try {
                window.accX.announce(message, priority);
                debug('Screen reader announcement:', message, priority);
            } catch (err) {
                warn('Screen reader announcement failed:', err);
            }
        } else {
            // Fallback: create live region manually
            if (typeof document !== 'undefined') {
                let liveRegion = document.getElementById('nx-sr-live');
                if (!liveRegion) {
                    liveRegion = document.createElement('div');
                    liveRegion.id = 'nx-sr-live';
                    liveRegion.setAttribute('aria-live', priority);
                    liveRegion.setAttribute('aria-atomic', 'true');
                    liveRegion.style.position = 'absolute';
                    liveRegion.style.left = '-10000px';
                    liveRegion.style.width = '1px';
                    liveRegion.style.height = '1px';
                    liveRegion.style.overflow = 'hidden';
                    document.body.appendChild(liveRegion);
                }
                liveRegion.textContent = message;
            }
        }
    };

    // ============================================================================
    // EVENT EMISSION UTILITIES
    // ============================================================================

    /**
     * Emit a custom event from an element
     * @param {HTMLElement} element - Element to emit from
     * @param {string} eventName - Event name (without 'nx:' prefix)
     * @param {Object} detail - Event detail data
     */
    const emitEvent = (element, eventName, detail = {}) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        const fullEventName = `nx:${eventName}`;
        const event = new CustomEvent(fullEventName, {
            bubbles: true,
            cancelable: true,
            detail: detail
        });

        element.dispatchEvent(event);
        debug(`Emitted event: ${fullEventName}`, detail);
    };

    /**
     * Emit navigation event
     * @param {HTMLElement} element - Navigation element
     * @param {string} href - Target URL
     * @param {Object} extraData - Additional event data
     */
    const emitNavigationEvent = (element, href, extraData = {}) => {
        emitEvent(element, 'navigate', {
            href,
            element,
            ...extraData
        });
    };

    /**
     * Emit dropdown event
     * @param {HTMLElement} element - Dropdown element
     * @param {string} action - 'open' or 'close'
     * @param {Object} extraData - Additional event data
     */
    const emitDropdownEvent = (element, action, extraData = {}) => {
        emitEvent(element, 'dropdown-' + action, {
            element,
            action,
            ...extraData
        });
    };

    /**
     * Emit tab change event
     * @param {HTMLElement} element - Tab element
     * @param {number} index - Tab index
     * @param {string} tabId - Tab identifier
     * @param {Object} extraData - Additional event data
     */
    const emitTabChangeEvent = (element, index, tabId, extraData = {}) => {
        emitEvent(element, 'tab-change', {
            index,
            tabId,
            element,
            ...extraData
        });
    };

    /**
     * Check navigation guards before allowing navigation
     * @param {HTMLElement} element - Navigation element
     * @param {string} href - Target URL
     * @param {Event} event - Click event
     * @returns {boolean} True if navigation should proceed
     */
    const checkNavigationGuards = async (element, href, event) => {
        // Check nx-confirm
        const confirmMessage = element.getAttribute('nx-confirm');
        if (confirmMessage) {
            const confirmed = window.confirm(confirmMessage);
            if (!confirmed) {
                emitEvent(element, 'navigation-cancelled', {
                    reason: 'user-cancelled-confirm',
                    href,
                    element
                });
                return false;
            }
        }

        // Check nx-before-navigate function
        const beforeNavigate = element.getAttribute('nx-before-navigate');
        if (beforeNavigate) {
            try {
                const fn = window[beforeNavigate] || eval(beforeNavigate);
                if (typeof fn === 'function') {
                    const result = await fn(href, element, event);
                    if (result === false) {
                        emitEvent(element, 'navigation-cancelled', {
                            reason: 'before-navigate-returned-false',
                            href,
                            element
                        });
                        return false;
                    }
                }
            } catch (err) {
                warn('Error in nx-before-navigate function:', err);
                emitEvent(element, 'navigation-error', {
                    error: err,
                    href,
                    element
                });
                return false;
            }
        }

        // Check nx-loading (show loading state)
        if (element.hasAttribute('nx-loading')) {
            element.classList.add('nx-loading');
            element.setAttribute('aria-disabled', 'true');
            element.style.pointerEvents = 'none';

            // Re-enable after navigation (this is a simple implementation)
            setTimeout(() => {
                element.classList.remove('nx-loading');
                element.removeAttribute('aria-disabled');
                element.style.pointerEvents = '';
            }, 1000);
        }

        return true;
    };

    /**
     * Emit pagination event
     * @param {HTMLElement} element - Pagination element
     * @param {number} page - Page number
     * @param {Object} extraData - Additional event data
     */
    const emitPaginationEvent = (element, page, extraData = {}) => {
        emitEvent(element, 'page-change', {
            page,
            element,
            ...extraData
        });
    };

    // ============================================================================
    // MODULE STATE (Encapsulated)
    // ============================================================================

    let initialized = false;
    let observer = null;
    let config = null;

    // Default configuration
    const DEFAULT_CONFIG = {
        observe: true,
        selector: '[nx-nav], [nx-breadcrumb], [nx-trail], [nx-tabs], [nx-scroll-spy], [nx-sticky], [nx-mobile], [nx-dropdown], [nx-pagination]',
        activeClass: 'nx-active',
        enhancedAttr: 'nx-enhanced',
        debug: false
    };

// Security helpers
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function isPlainObject(obj) {
    return obj && typeof obj === 'object' && obj.constructor === Object;
}
function sanitizeConfig(input) {
    if (!isPlainObject(input)) return {};
    const out = {};
    for (const k in input) {
        if (!Object.prototype.hasOwnProperty.call(input, k)) continue;
        if (DANGEROUS_KEYS.has(k)) continue;
        const v = input[k];
        if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            out[k] = v;
        }
    }
    return out;
}

// Track global listeners so we can remove them on destroy()
const globalListeners = [];
function addGlobalListener(target, type, handler, options) {
    try {
        target.addEventListener(type, handler, options);
        globalListeners.push({ target, type, handler, options });
    } catch (e) {
        // ignore in constrained environments
    }
}
function removeAllGlobalListeners() {
    for (const l of globalListeners) {
        try {
            l.target.removeEventListener(l.type, l.handler, l.options);
        } catch (e) {
            // ignore
        }
    }
    globalListeners.length = 0;
}

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
   * Log debug message if debug mode enabled
   * @param {...any} args - Arguments to log
   */
    const debug = (...args) => {
        if (config && config.debug) {
            console.log(`[${MODULE_NAME}]`, ...args);
        }
    };

    /**
   * Log warning message
   * @param {...any} args - Arguments to log
   */
    const warn = (...args) => {
        console.warn(`[${MODULE_NAME}]`, ...args);
    };

    /**
   * Log error message
   * @param {...any} args - Arguments to log
   */
    const error = (...args) => {
        console.error(`[${MODULE_NAME}]`, ...args);
    };

    /**
   * Check if element has been enhanced
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if already enhanced
   */
    const isEnhanced = (element) => {
        if (!element || !element.hasAttribute) {
            return false;
        }
        return element.hasAttribute(config.enhancedAttr);
    };

    /**
   * Mark element as enhanced
   * @param {HTMLElement} element - Element to mark
   */
    const markEnhanced = (element) => {
        if (element && element.setAttribute) {
            element.setAttribute(config.enhancedAttr, 'true');
        }
    };

    /**
   * Get current URL path
   * @returns {string} Current pathname
   */
    const getCurrentPath = () => {
        if (typeof window === 'undefined') {
            return '/';
        }
        return window.location.pathname;
    };

    /**
   * Check if link matches current path
   * @param {string} href - Link href
   * @param {boolean} exact - Exact match required
   * @returns {boolean} True if matches
   */
    const matchesCurrentPath = (href, exact = false) => {
        const currentPath = getCurrentPath();
        if (exact) {
            return currentPath === href;
        }
        return currentPath.startsWith(href);
    };

    /**
     * Check if element matches current path considering patterns and excludes
     * @param {HTMLElement} element - Navigation element
     * @param {string} href - Target href
     * @param {boolean} exact - Whether to match exactly
     * @returns {boolean} True if element should be active
     */
    const matchesCurrentPathWithPatterns = (element, href, exact) => {
        const currentPath = getCurrentPath();

        // Check nx-exclude first (takes precedence)
        const excludePattern = element.getAttribute('nx-exclude');
        if (excludePattern) {
            try {
                const regex = new RegExp(excludePattern);
                if (regex.test(currentPath)) {
                    return false;
                }
            } catch (err) {
                warn('Invalid nx-exclude pattern:', excludePattern, err);
            }
        }

        // Check nx-pattern
        const pattern = element.getAttribute('nx-pattern');
        if (pattern) {
            try {
                const regex = new RegExp(pattern);
                return regex.test(currentPath);
            } catch (err) {
                warn('Invalid nx-pattern:', pattern, err);
                return false;
            }
        }

        // Fall back to standard matching
        return matchesCurrentPath(href, exact);
    };

    // ============================================================================
    // ATTRIBUTE PARSING
    // ============================================================================

    /**
   * Parse polymorphic attribute value with Result monad
   * Supports: JSON, HTML attr, data attr, CSS class, colon notation
   * @param {HTMLElement} element - Element to parse
   * @param {string} attrName - Attribute name
   * @returns {Result} Ok(value) or Err(error)
   */
    const parseAttributeSafe = (element, attrName) => {
        if (!element || !attrName) {
            return Err(new ParseError('PARSE_001', 'Invalid element or attribute name', { attrName }));
        }

        const value = element.getAttribute(attrName);
        if (!value) {
            return Ok(null);
        }

        // Try JSON parse first
        if (value.startsWith('{') || value.startsWith('[')) {
            try {
                return Ok(JSON.parse(value));
            } catch (e) {
                debug(`Failed to parse JSON for ${attrName}:`, e.message);
                return Ok(value); // Fall back to string value
            }
        }

        // Boolean values
        if (value === 'true') {
            return Ok(true);
        }
        if (value === 'false') {
            return Ok(false);
        }

        // Numeric values
        if (/^\d+$/.test(value)) {
            return Ok(parseInt(value, 10));
        }
        if (/^\d+\.\d+$/.test(value)) {
            return Ok(parseFloat(value));
        }

        // Return string value
        return Ok(value);
    };

    /**
   * Parse polymorphic attribute value (legacy, non-Result version)
   * @param {HTMLElement} element - Element to parse
   * @param {string} attrName - Attribute name
   * @returns {any} Parsed value
   */
    const parseAttribute = (element, attrName) => {
        const result = parseAttributeSafe(element, attrName);
        return result.isOk() ? result.unwrap() : null;
    };

    /**
   * Get configuration from element attributes
   * @param {HTMLElement} element - Element to extract config from
   * @param {string} baseAttr - Base attribute name (e.g., 'nx-nav')
   * @returns {Object} Configuration object
   */
    const getElementConfig = (element, baseAttr) => {
        // Try to get config from bootloader cache first (if using genX bootloader)
        if (typeof window !== 'undefined' && window.genx && typeof window.genx.getConfig === 'function') {
            const raw = window.genx.getConfig(element);
            const cachedConfig = sanitizeConfig(raw);
            if (Object.keys(cachedConfig).length > 0) {
                const result = {};
                const prefix = baseAttr.replace('nx-', '');

                if (cachedConfig[prefix] !== undefined) {
                    result.value = cachedConfig[prefix];
                }

                Object.keys(cachedConfig).forEach(key => {
                    if (key.startsWith(prefix) && key !== prefix) {
                        const configKey = key.charAt(prefix.length).toLowerCase() + key.slice(prefix.length + 1);
                        result[configKey] = cachedConfig[key];
                    }
                });

                if (Object.keys(result).length > 0) {
                    return result;
                }
            }
        }

        // Fallback to polymorphic notation parsing (legacy standalone mode)
        // Use polymorphic parser from genx-common (supports Verbose, Colon, JSON, CSS Class)
        const parsedRaw = (typeof window !== 'undefined' && window.genxCommon && window.genxCommon.notation && typeof window.genxCommon.notation.parseNotation === 'function')
            ? window.genxCommon.notation.parseNotation(element, 'nx')
            : {};
        const parsed = sanitizeConfig(parsedRaw);

        const elementConfig = {};

        // Extract base attribute name (e.g., 'nx-nav' -> 'nav')
        const baseName = baseAttr.replace('nx-', '');

        // Get base attribute value (e.g., parsed.nav -> elementConfig.value)
        if (parsed[baseName] !== undefined) {
            elementConfig.value = parsed[baseName];
        }

        // Get related attributes (e.g., parsed.navActiveClass -> elementConfig.activeClass)
        // Look for keys that start with baseName in camelCase
        Object.keys(parsed).forEach(key => {
            if (key !== baseName && key.startsWith(baseName)) {
                // Extract the sub-key (e.g., 'navActiveClass' -> 'activeClass')
                const subKey = key.charAt(baseName.length).toLowerCase() + key.slice(baseName.length + 1);
                elementConfig[subKey] = parsed[key];
            }
        });

        return elementConfig;
    };

    // ============================================================================
    // NAVIGATION ENHANCEMENT
    // ============================================================================

    /**
   * Enhance navigation element (nx-nav)
   * @param {HTMLElement} element - Nav element to enhance
   */
    const enhanceNav = (element) => {
        const navConfig = getElementConfig(element, 'nx-nav');
        const activeClass = navConfig.activeClass || config.activeClass;
        const exact = navConfig.exact === true;

        // Find all navigable elements in nav:
        // 1. Traditional links: a[href]
        // 2. HTMX elements: [hx-get], [hx-post], [hx-put], [hx-delete]
        // 3. Route elements: [nx-route]
        const navigableElements = element.querySelectorAll(
            'a[href], [hx-get], [hx-post], [hx-put], [hx-delete], [nx-route]'
        );

        navigableElements.forEach(navElement => {
            // Determine the target URL for this element
            let href = null;

            // Priority: nx-route > href attribute > HTMX attributes
            if (navElement.hasAttribute('nx-route')) {
                href = navElement.getAttribute('nx-route');
            } else if (navElement.hasAttribute('href')) {
                href = navElement.getAttribute('href');
            } else if (navElement.hasAttribute('hx-get')) {
                href = navElement.getAttribute('hx-get');
            } else if (navElement.hasAttribute('hx-post')) {
                href = navElement.getAttribute('hx-post');
            } else if (navElement.hasAttribute('hx-put')) {
                href = navElement.getAttribute('hx-put');
            } else if (navElement.hasAttribute('hx-delete')) {
                href = navElement.getAttribute('hx-delete');
            }

            if (!href) {
                return;
            }

            // Skip anchor links for active state (but handle them for smooth scroll)
            if (!href.startsWith('#')) {
                // Check if element matches current path with patterns/excludes
                if (matchesCurrentPathWithPatterns(navElement, href, exact)) {
                    navElement.classList.add(activeClass);
                    navElement.setAttribute('aria-current', 'page');
                } else {
                    navElement.classList.remove(activeClass);
                    navElement.removeAttribute('aria-current');
                }
            }

            // Add click event listener for navigation events
            navElement.addEventListener('click', async (e) => {
                // Check navigation guards
                if (!await checkNavigationGuards(navElement, href, e)) {
                    e.preventDefault();
                    return;
                }

                // Don't emit for anchor links or if default is prevented
                if (!href.startsWith('#') && !e.defaultPrevented) {
                    emitNavigationEvent(navElement, href, {
                        originalEvent: e,
                        navElement: navElement
                    });
                }
            });
        });

        // Setup smooth scrolling if enabled
        if (navConfig.smoothScroll !== false) {
            setupSmoothScroll(element, navConfig);
        }

        debug('Enhanced nav:', element);
    };

    // ============================================================================
    // BREADCRUMB UTILITIES (Phase 2)
    // ============================================================================

    /**
   * Parse URL pathname into breadcrumb segments
   * @param {string} pathname - URL pathname
   * @returns {Array} Array of path segments
   */
    const parsePathSegments = (pathname) => {
        return pathname.split('/').filter(s => s.length > 0);
    };

    /**
   * Format segment name to title case
   * @param {string} segment - URL segment
   * @param {Object} labels - Custom label map
   * @returns {string} Formatted title
   */
    const formatSegmentTitle = (segment, labels = {}) => {
    // Check custom labels first
        if (labels[segment]) {
            return labels[segment];
        }

        // Convert kebab-case to Title Case
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    /**
   * Build hierarchical breadcrumb data from URL path
   * @param {Object} config - Breadcrumb configuration
   * @returns {Array} Array of breadcrumb items
   */
    const buildHierarchicalBreadcrumbs = (config) => {
        const pathname = getCurrentPath();
        const segments = parsePathSegments(pathname);
        const items = [];
        const labels = config.labels || {};
        const rootLabel = config.rootLabel || 'Home';

        // Add root/home
        items.push({
            url: '/',
            title: rootLabel,
            current: segments.length === 0
        });

        // Add path segments
        let path = '';
        segments.forEach((segment, index) => {
            path += '/' + segment;
            const title = formatSegmentTitle(segment, labels);

            items.push({
                url: path,
                title: title,
                current: index === segments.length - 1
            });
        });

        return items;
    };

    /**
   * Build trail breadcrumbs from sessionStorage history
   * @param {Object} config - Breadcrumb configuration
   * @returns {Array} Array of breadcrumb items from trail
   */
    const buildTrailBreadcrumbs = (config) => {
        if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
            return [];
        }

        const maxItems = config.maxTrail || 5;
        const storageKey = config.trailKey || 'nx-trail';

        try {
            const trailData = sessionStorage.getItem(storageKey);
            const trail = trailData ? JSON.parse(trailData) : [];

            // Add current page to trail
            const currentPath = getCurrentPath();
            const currentTitle = (typeof document !== 'undefined' && document.title) ? document.title : currentPath;

            // Remove current page if already in trail
            const filtered = trail.filter(item => item.url !== currentPath);

            // Add current page
            filtered.push({
                url: currentPath,
                title: currentTitle,
                current: true
            });

            // Limit trail length
            const limited = filtered.slice(-maxItems);

            // Update sessionStorage
            sessionStorage.setItem(storageKey, JSON.stringify(limited));

            return limited;
        } catch (err) {
            warn('Failed to build trail breadcrumbs:', err);
            return [];
        }
    };

    /**
   * Build breadcrumbs from data-parent relationships
   * @param {HTMLElement} element - Starting element
   * @param {Object} config - Breadcrumb configuration
   * @returns {Array} Array of breadcrumb items
   */
    const buildDataParentBreadcrumbs = (element, config) => {
        const items = [];
        let current = element;
        const maxDepth = config.maxDepth || 10;
        let depth = 0;

        // Traverse up the data-parent chain
        while (current && depth < maxDepth) {
            const parentId = current.getAttribute('data-parent');
            if (!parentId) {
                break;
            }

            const parent = document.getElementById(parentId);
            if (!parent) {
                break;
            }

            const title = parent.getAttribute('data-title') ||
                   parent.getAttribute('title') ||
                   parent.textContent.trim().substring(0, 30);

            const url = parent.getAttribute('data-url') ||
                 parent.getAttribute('href') ||
                 '#' + parentId;

            items.unshift({
                url: url,
                title: title,
                current: false
            });

            current = parent;
            depth++;
        }

        // Add current page
        const currentTitle = element.getAttribute('data-title') ||
                        document.title ||
                        getCurrentPath();

        items.push({
            url: getCurrentPath(),
            title: currentTitle,
            current: true
        });

        return items;
    };

    /**
   * Render breadcrumbs to DOM
   * @param {HTMLElement} element - Container element
   * @param {Array} items - Breadcrumb items
   * @param {Object} config - Breadcrumb configuration
   */
    const renderBreadcrumbs = (element, items, config) => {
        if (!items || items.length === 0) {
            return;
        }

        const separator = config.separator || '>';
        const schema = config.schema === true;

        // Create navigation element
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', config.ariaLabel || 'Breadcrumb');
        nav.className = 'nx-breadcrumb';

        // Create ordered list
        const ol = document.createElement('ol');
        ol.className = 'nx-breadcrumb-list';

        // Schema.org markup preparation
        const schemaItems = [];

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'nx-breadcrumb-item';

            if (item.current) {
                // Current page - use span
                const span = document.createElement('span');
                span.textContent = item.title;
                span.setAttribute('aria-current', 'page');
                span.className = 'nx-breadcrumb-current';
                li.appendChild(span);
            } else {
                // Link to previous page
                const a = document.createElement('a');
                a.href = item.url;
                a.textContent = item.title;
                a.className = 'nx-breadcrumb-link';
                li.appendChild(a);

                // Add separator (not after last item)
                if (index < items.length - 1) {
                    const sep = document.createElement('span');
                    sep.className = 'nx-breadcrumb-separator';
                    sep.textContent = ' ' + separator + ' ';
                    sep.setAttribute('aria-hidden', 'true');
                    li.appendChild(sep);
                }
            }

            ol.appendChild(li);

            // Prepare schema.org data
            if (schema) {
                schemaItems.push({
                    '@type': 'ListItem',
                    'position': index + 1,
                    'name': item.title,
                    'item': item.url
                });
            }
        });

        nav.appendChild(ol);

        // Add schema.org JSON-LD if enabled
        if (schema && schemaItems.length > 0) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': schemaItems
            }, null, 2);
            nav.appendChild(script);
        }

        // Clear and append
        element.innerHTML = '';
        element.appendChild(nav);

        debug('Rendered breadcrumbs:', items.length, 'items');
    };

    /**
   * Enhance breadcrumb element (nx-breadcrumb)
   * @param {HTMLElement} element - Breadcrumb element to enhance
   */
    const enhanceBreadcrumb = (element) => {
        const breadcrumbConfig = getElementConfig(element, 'nx-breadcrumb');
        const mode = breadcrumbConfig.value || 'auto';

        let items = [];

        // Determine breadcrumb mode and build items
        if (mode === 'auto' || mode === 'hierarchical') {
            items = buildHierarchicalBreadcrumbs(breadcrumbConfig);
        } else if (mode === 'trail') {
            items = buildTrailBreadcrumbs(breadcrumbConfig);
        } else if (mode === 'data-parent') {
            items = buildDataParentBreadcrumbs(element, breadcrumbConfig);
        } else {
            warn('Unknown breadcrumb mode:', mode);
            return;
        }

        // Render breadcrumbs
        renderBreadcrumbs(element, items, breadcrumbConfig);

        debug('Enhanced breadcrumb:', element, mode, items.length, 'items');
    };

    /**
   * Enhance trail element (nx-trail)
   * Trail is essentially breadcrumb with mode="trail"
   * @param {HTMLElement} element - Trail element to enhance
   */
    const enhanceTrail = (element) => {
        const trailConfig = getElementConfig(element, 'nx-trail');

        // Force trail mode
        trailConfig.value = 'trail';

        // Build and render trail breadcrumbs
        const items = buildTrailBreadcrumbs(trailConfig);
        renderBreadcrumbs(element, items, trailConfig);

        debug('Enhanced trail:', element, items.length, 'items');
    };

    // ============================================================================
    // TAB NAVIGATION (Phase 3)
    // ============================================================================

    /**
   * Setup tab navigation with keyboard support
   * @param {HTMLElement} element - Tabs container
   * @param {Object} config - Tab configuration
   */
    const setupTabs = (element, config) => {
    // Find tab list and panels
        const tabList = element.querySelector('[role="tablist"]') ||
                   element.querySelector('.nx-tab-list') ||
                   element.querySelector('ul, ol');

        if (!tabList) {
            warn('No tab list found in tabs element');
            return;
        }

        // Ensure tablist role
        tabList.setAttribute('role', 'tablist');

        // Find all tabs
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]') ||
                           tabList.querySelectorAll('button, a, li'));

        if (tabs.length === 0) {
            warn('No tabs found in tab list');
            return;
        }

        // Find all panels
        const panels = Array.from(element.querySelectorAll('[role="tabpanel"]') ||
                             element.querySelectorAll('.nx-tab-panel'));

        // Setup ARIA attributes
        tabs.forEach((tab, index) => {
            const tabId = tab.id || `nx-tab-${Math.random().toString(36).substr(2, 9)}`;
            const panelId = panels[index]?.id || `nx-panel-${Math.random().toString(36).substr(2, 9)}`;

            tab.id = tabId;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', panelId);
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');

            if (panels[index]) {
                panels[index].id = panelId;
                panels[index].setAttribute('role', 'tabpanel');
                panels[index].setAttribute('aria-labelledby', tabId);
                panels[index].setAttribute('tabindex', '0');
            }
        });

        // Activate first tab by default
        if (tabs.length > 0 && panels.length > 0) {
            activateTab(tabs[0], tabs, panels);
        }

        // Keyboard navigation
        tabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                let targetIndex = index;

                switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    targetIndex = (index + 1) % tabs.length;
                    break;

                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    targetIndex = (index - 1 + tabs.length) % tabs.length;
                    break;

                case 'Home':
                    e.preventDefault();
                    targetIndex = 0;
                    break;

                case 'End':
                    e.preventDefault();
                    targetIndex = tabs.length - 1;
                    break;

                case 'Enter':
                case ' ':
                    e.preventDefault();
                    activateTab(tab, tabs, panels);
                    return;

                default:
                    return;
                }

                // Focus and activate new tab
                tabs[targetIndex].focus();
                if (config.autoActivate !== false) {
                    activateTab(tabs[targetIndex], tabs, panels);
                }
            });

            // Click handler
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                activateTab(tab, tabs, panels);
            });
        });

        debug('Setup tabs:', tabs.length, 'tabs');
    };

    /**
   * Activate a specific tab
   * @param {HTMLElement} activeTab - Tab to activate
   * @param {Array} allTabs - All tabs
   * @param {Array} allPanels - All panels
   */
    const activateTab = (activeTab, allTabs, allPanels) => {
        const activeIndex = allTabs.indexOf(activeTab);

        // Update tabs
        allTabs.forEach((tab, index) => {
            const isActive = index === activeIndex;

            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
            tab.classList.toggle('nx-active', isActive);

            // Update panel visibility
            if (allPanels[index]) {
                allPanels[index].hidden = !isActive;
                allPanels[index].classList.toggle('nx-active', isActive);
            }
        });

        // Announce tab change to screen readers
        const tabLabel = activeTab.textContent?.trim() || activeTab.getAttribute('aria-label') || 'Tab';
        announceToScreenReader(`${tabLabel} tab selected`, 'polite');
    };

    /**
   * Enhance tabs element (nx-tabs)
   * @param {HTMLElement} element - Tabs element to enhance
   */
    const enhanceTabs = (element) => {
        const tabsConfig = getElementConfig(element, 'nx-tabs');

        setupTabs(element, tabsConfig);

        debug('Enhanced tabs:', element, tabsConfig);
    };

    // ============================================================================
    // SCROLL SPY (Phase 4)
    // ============================================================================

    // Store active observers for cleanup
    const scrollSpyObservers = new Map();

    /**
   * Setup scroll spy with IntersectionObserver
   * @param {HTMLElement} element - Navigation element
   * @param {Object} config - Scroll spy configuration
   */
    const setupScrollSpy = (element, config) => {
    // Find navigation links
        const links = Array.from(element.querySelectorAll('a[href^="#"]'));

        if (links.length === 0) {
            warn('No anchor links found for scroll spy');
            return;
        }

        // Get target sections
        const targets = new Map();
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                const targetId = href.substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    targets.set(target, link);
                }
            }
        });

        if (targets.size === 0) {
            warn('No target sections found for scroll spy');
            return;
        }

        // Configuration
        const threshold = config.threshold || 0.5;
        const rootMargin = config.rootMargin || '0px 0px -50% 0px';
        const activeClass = config.activeClass || 'nx-active';

        // Create IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const link = targets.get(entry.target);
                if (!link) {
                    return;
                }

                if (entry.isIntersecting) {
                    // Remove active class from all links
                    links.forEach(l => l.classList.remove(activeClass));

                    // Add active class to current link
                    link.classList.add(activeClass);
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.classList.remove(activeClass);
                    link.removeAttribute('aria-current');
                }
            });
        }, {
            threshold: threshold,
            rootMargin: rootMargin
        });

        // Observe all target sections
        targets.forEach((link, target) => {
            observer.observe(target);
        });

        // Store observer for cleanup
        scrollSpyObservers.set(element, observer);

        debug('Setup scroll spy:', targets.size, 'sections');
    };

    /**
   * Enhance scroll spy element (nx-scroll-spy)
   * @param {HTMLElement} element - Scroll spy element to enhance
   */
    const enhanceScrollSpy = (element) => {
        const scrollSpyConfig = getElementConfig(element, 'nx-scroll-spy');

        setupScrollSpy(element, scrollSpyConfig);

        debug('Enhanced scroll-spy:', element, scrollSpyConfig);
    };

    // ============================================================================
    // STICKY NAVIGATION (Phase 4)
    // ============================================================================

    // Store sticky observers for cleanup
    const stickyObservers = new Map();

    /**
   * Setup sticky navigation with sentinel detection
   * @param {HTMLElement} element - Navigation element
   * @param {Object} config - Sticky configuration
   */
    const setupSticky = (element, config) => {
    // Apply CSS sticky positioning
        if (config.position !== false) {
            element.style.position = 'sticky';
            element.style.top = config.top || '0';
            element.style.zIndex = config.zIndex || '1000';
        }

        // Add state classes based on scroll position
        const stickyClass = config.stickyClass || 'nx-stuck';
        const offset = parseInt(config.offset || '0', 10);

        // Create sentinel element for IntersectionObserver
        const sentinel = document.createElement('div');
        sentinel.className = 'nx-sticky-sentinel';
        sentinel.style.position = 'absolute';
        sentinel.style.top = `-${offset}px`;
        sentinel.style.height = '1px';
        sentinel.style.width = '100%';
        sentinel.style.pointerEvents = 'none';

        // Insert sentinel before the sticky element
        element.parentNode?.insertBefore(sentinel, element);

        // Create IntersectionObserver to detect when stuck
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    // Sentinel is out of view, element is stuck
                    element.classList.add(stickyClass);
                    element.setAttribute('data-stuck', 'true');
                } else {
                    // Sentinel is in view, element is not stuck
                    element.classList.remove(stickyClass);
                    element.removeAttribute('data-stuck');
                }
            });
        }, {
            threshold: [0],
            rootMargin: `${offset}px 0px 0px 0px`
        });

        observer.observe(sentinel);

        // Store observer and sentinel for cleanup
        stickyObservers.set(element, { observer, sentinel });

        debug('Setup sticky navigation');
    };

    /**
   * Enhance sticky element (nx-sticky)
   * @param {HTMLElement} element - Sticky element to enhance
   */
    const enhanceSticky = (element) => {
        const stickyConfig = getElementConfig(element, 'nx-sticky');

        setupSticky(element, stickyConfig);

        debug('Enhanced sticky:', element, stickyConfig);
    };

    // ============================================================================
    // SMOOTH SCROLLING (Phase 4)
    // ============================================================================

    /**
   * Smooth scroll to target element or position
   * @param {HTMLElement|number} target - Target element or Y position
   * @param {Object} options - Scroll options
   */
    const smoothScrollTo = (target, options = {}) => {
        const duration = options.duration || 500;
        const offset = options.offset || 0;
        const behavior = options.behavior || 'smooth';

        // Calculate target position
        let targetY;
        if (typeof target === 'number') {
            targetY = target;
        } else if (target && target.getBoundingClientRect) {
            const rect = target.getBoundingClientRect();
            targetY = window.pageYOffset + rect.top - offset;
        } else {
            warn('Invalid scroll target');
            return;
        }

        // Use native smooth scroll if supported and requested
        if (behavior === 'smooth' && 'scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
            return;
        }

        // Fallback: manual smooth scroll animation
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = performance.now();

        const easeInOutQuad = (t) => {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        const scroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOutQuad(progress);

            window.scrollTo(0, startY + distance * eased);

            if (progress < 1) {
                requestAnimationFrame(scroll);
            }
        };

        requestAnimationFrame(scroll);
    };

    /**
   * Setup smooth scroll on anchor links
   * @param {HTMLElement} element - Container element
   * @param {Object} config - Smooth scroll configuration
   */
    const setupSmoothScroll = (element, config) => {
    // Find all anchor links
        const links = element.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || href === '#') {
                    return;
                }

                const targetId = href.substring(1);
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();

                    // Scroll to target
                    smoothScrollTo(target, {
                        duration: config.duration || 500,
                        offset: config.offset || 0,
                        behavior: config.behavior || 'smooth'
                    });

                    // Update URL hash
                    if (config.updateHash !== false) {
                        history.pushState(null, '', href);
                    }

                    // Focus target for accessibility
                    if (config.focusTarget !== false) {
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                    }
                }
            });
        });

        debug('Setup smooth scroll:', links.length, 'links');
    };

    // ============================================================================
    // MOBILE HAMBURGER MENU (Phase 3)
    // ============================================================================

    /**
   * Get all focusable elements within a container
   * @param {HTMLElement} container - Container element
   * @returns {Array} Array of focusable elements
   */
    const getFocusableElements = (container) => {
        const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), ' +
                    'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        return Array.from(container.querySelectorAll(selector));
    };

    /**
   * Create focus trap for mobile menu
   * @param {HTMLElement} menu - Menu element
   * @param {Function} onEscape - Callback for escape key
   * @returns {Function} Cleanup function
   */
    const createFocusTrap = (menu, onEscape) => {
        const focusableElements = getFocusableElements(menu);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Store previously focused element
        const previouslyFocused = document.activeElement;

        // Focus first element
        firstFocusable?.focus();

        // Trap focus within menu
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onEscape();
                return;
            }

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab: move backwards
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable?.focus();
                    }
                } else {
                    // Tab: move forwards
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable?.focus();
                    }
                }
            }
        };

        addGlobalListener(document, 'keydown', handleKeydown);

        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeydown);
            previouslyFocused?.focus();
        };
    };

    /**
   * Setup mobile hamburger menu
   * @param {HTMLElement} element - Mobile menu container
   * @param {Object} config - Mobile menu configuration
   */
    const setupMobileMenu = (element, config) => {
    // Find trigger button (hamburger icon)
        const trigger = element.querySelector('[data-mobile-trigger]') ||
                   element.querySelector('.hamburger') ||
                   element.querySelector('button');

        if (!trigger) {
            warn('No mobile menu trigger found');
            return;
        }

        // Find menu
        const menu = element.querySelector('[data-mobile-menu]') ||
                element.querySelector('.mobile-menu') ||
                element.querySelector('nav');

        if (!menu) {
            warn('No mobile menu found');
            return;
        }

        // Setup ARIA attributes
        const triggerId = trigger.id || `nx-mobile-trigger-${Math.random().toString(36).substr(2, 9)}`;
        const menuId = menu.id || `nx-mobile-menu-${Math.random().toString(36).substr(2, 9)}`;

        trigger.id = triggerId;
        trigger.setAttribute('aria-label', config.ariaLabel || 'Toggle navigation menu');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', menuId);

        menu.id = menuId;
        menu.setAttribute('aria-label', 'Mobile navigation');
        menu.hidden = true;

        let cleanupFocusTrap = null;

        // Open menu
        const openMenu = () => {
            trigger.setAttribute('aria-expanded', 'true');
            trigger.classList.add('nx-mobile-open');
            menu.hidden = false;
            menu.classList.add('nx-mobile-menu-open');

            // Prevent body scroll
            if (config.preventScroll !== false) {
                document.body.style.overflow = 'hidden';
            }

            // Setup focus trap
            cleanupFocusTrap = createFocusTrap(menu, closeMenu);

            // Announce to screen readers
            announceToScreenReader('Navigation menu opened', 'polite');

            debug('Mobile menu opened');
        };

        // Close menu
        const closeMenu = () => {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.classList.remove('nx-mobile-open');
            menu.hidden = true;
            menu.classList.remove('nx-mobile-menu-open');

            // Restore body scroll
            if (config.preventScroll !== false) {
                document.body.style.overflow = '';
            }

            // Cleanup focus trap
            if (cleanupFocusTrap) {
                cleanupFocusTrap();
                cleanupFocusTrap = null;
            }

            // Announce to screen readers
            announceToScreenReader('Navigation menu closed', 'polite');

            debug('Mobile menu closed');
        };

        // Toggle menu
        const toggleMenu = () => {
            if (menu.hidden) {
                openMenu();
            } else {
                closeMenu();
            }
        };

        // Trigger click
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });

        // Close on link click (if configured)
        if (config.closeOnClick !== false) {
            const links = menu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    closeMenu();
                });
            });
        }

        // Close on outside click (if configured)
        if (config.closeOnOutsideClick !== false) {
            addGlobalListener(document, 'click', (e) => {
                if (!element.contains(e.target) && !menu.hidden) {
                    closeMenu();
                }
            });
        }

        debug('Setup mobile menu');
    };

    /**
   * Enhance mobile menu element (nx-mobile)
   * @param {HTMLElement} element - Mobile menu element to enhance
   */
    const enhanceMobile = (element) => {
        const mobileConfig = getElementConfig(element, 'nx-mobile');

        setupMobileMenu(element, mobileConfig);

        debug('Enhanced mobile:', element, mobileConfig);
    };

    // ============================================================================
    // DROPDOWN MENUS (Phase 3)
    // ============================================================================

    /**
   * Setup dropdown menu with keyboard navigation
   * @param {HTMLElement} element - Dropdown container
   * @param {Object} config - Dropdown configuration
   */
    const setupDropdown = (element, config) => {
    // Find trigger button
        const trigger = element.querySelector('[data-dropdown-trigger]') ||
                   element.querySelector('button') ||
                   element.querySelector('a');

        if (!trigger) {
            warn('No dropdown trigger found');
            return;
        }

        // Find menu
        const menu = element.querySelector('[data-dropdown-menu]') ||
                element.querySelector('ul, ol, .dropdown-menu, .menu');

        if (!menu) {
            warn('No dropdown menu found');
            return;
        }

        // Find menu items
        const items = Array.from(menu.querySelectorAll('a, button, [role="menuitem"]'));

        if (items.length === 0) {
            warn('No dropdown items found');
            return;
        }

        // Setup ARIA attributes
        const triggerId = trigger.id || `nx-dropdown-trigger-${Math.random().toString(36).substr(2, 9)}`;
        const menuId = menu.id || `nx-dropdown-menu-${Math.random().toString(36).substr(2, 9)}`;

        trigger.id = triggerId;
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', menuId);

        menu.id = menuId;
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-labelledby', triggerId);
        menu.hidden = true;

        items.forEach((item) => {
            item.setAttribute('role', 'menuitem');
            item.setAttribute('tabindex', '-1');
        });

        let currentIndex = -1;

        // Open dropdown
        const openDropdown = async () => {
            // Check for lazy loading
            if (element.hasAttribute('nx-lazy') && !element.hasAttribute('nx-loaded')) {
                // Load content
                const loadUrl = element.getAttribute('nx-lazy');
                if (loadUrl) {
                    try {
                        trigger.classList.add('nx-loading');
                        const response = await fetch(loadUrl);
                        const html = await response.text();

                        // Replace menu content
                        menu.innerHTML = html;

                        // Re-find items after content load
                        const newItems = Array.from(menu.querySelectorAll('a, button, [role="menuitem"]'));
                        items.length = 0;
                        items.push(...newItems);

                        // Setup ARIA for new items
                        items.forEach((item) => {
                            item.setAttribute('role', 'menuitem');
                            item.setAttribute('tabindex', '-1');
                        });

                        element.setAttribute('nx-loaded', 'true');
                        emitEvent(element, 'content-loaded', { url: loadUrl, items: items.length });
                    } catch (err) {
                        warn('Failed to load lazy content:', err);
                        emitEvent(element, 'content-load-error', { error: err, url: loadUrl });
                    } finally {
                        trigger.classList.remove('nx-loading');
                    }
                }
            }

            trigger.setAttribute('aria-expanded', 'true');
            menu.hidden = false;
            menu.classList.add('nx-dropdown-open');
            currentIndex = 0;
            items[currentIndex]?.focus();
            emitDropdownEvent(element, 'open', { trigger, menu });
        };

        // Close dropdown
        const closeDropdown = () => {
            trigger.setAttribute('aria-expanded', 'false');
            menu.hidden = true;
            menu.classList.remove('nx-dropdown-open');
            currentIndex = -1;
            trigger.focus();
            emitDropdownEvent(element, 'close', { trigger, menu });
        };

        // Toggle dropdown
        const toggleDropdown = () => {
            if (menu.hidden) {
                openDropdown();
            } else {
                closeDropdown();
            }
        };

        // Navigate to item
        const navigateToItem = (index) => {
            if (index >= 0 && index < items.length) {
                currentIndex = index;
                items[currentIndex].focus();
            }
        };

        // Trigger click/keydown
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDropdown();
        });

        trigger.addEventListener('keydown', (e) => {
            switch (e.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                e.preventDefault();
                openDropdown();
                break;

            case 'Escape':
                e.preventDefault();
                closeDropdown();
                break;
            }
        });

        // Menu keyboard navigation
        items.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    navigateToItem((index + 1) % items.length);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    navigateToItem((index - 1 + items.length) % items.length);
                    break;

                case 'Home':
                    e.preventDefault();
                    navigateToItem(0);
                    break;

                case 'End':
                    e.preventDefault();
                    navigateToItem(items.length - 1);
                    break;

                case 'Escape':
                    e.preventDefault();
                    closeDropdown();
                    break;

                case 'Tab':
                    closeDropdown();
                    break;

                case 'Enter':
                case ' ':
                    // Let default action happen (link navigation)
                    closeDropdown();
                    break;
                }
            });

            item.addEventListener('click', () => {
                closeDropdown();
            });
        });

        // Close on outside click
        addGlobalListener(document, 'click', (e) => {
            if (!element.contains(e.target) && !menu.hidden) {
                closeDropdown();
            }
        });

        debug('Setup dropdown:', items.length, 'items');
    };

    /**
   * Setup pagination controls
   * @param {HTMLElement} element - Pagination container element
   * @param {Object} config - Pagination configuration
   */
    const setupPagination = (element, config) => {
        // Find existing pagination buttons
        const pageButtons = element.querySelectorAll('.page-btn, [data-page]');
        const prevButton = element.querySelector('.prev, [data-prev]');
        const nextButton = element.querySelector('.next, [data-next]');

        // Add click handlers to page buttons
        pageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(button.getAttribute('data-page') || button.textContent);
                if (!isNaN(page)) {
                    emitPaginationEvent(element, page, { button, originalEvent: e });
                }
            });
        });

        // Add click handlers to prev/next buttons
        if (prevButton) {
            prevButton.addEventListener('click', (e) => {
                e.preventDefault();
                const currentPage = parseInt(element.getAttribute('data-current-page') || '1');
                if (currentPage > 1) {
                    emitPaginationEvent(element, currentPage - 1, { button: prevButton, originalEvent: e });
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                const currentPage = parseInt(element.getAttribute('data-current-page') || '1');
                const totalPages = parseInt(element.getAttribute('data-total-pages') || '1');
                if (currentPage < totalPages) {
                    emitPaginationEvent(element, currentPage + 1, { button: nextButton, originalEvent: e });
                }
            });
        }

        debug('Setup pagination:', pageButtons.length, 'page buttons');
    };

    /**
   * Enhance dropdown element (nx-dropdown)
   * @param {HTMLElement} element - Dropdown element to enhance
   */
    const enhanceDropdown = (element) => {
        const dropdownConfig = getElementConfig(element, 'nx-dropdown');

        setupDropdown(element, dropdownConfig);

        debug('Enhanced dropdown:', element, dropdownConfig);
    };

    /**
   * Enhance pagination element (nx-pagination)
   * @param {HTMLElement} element - Pagination element to enhance
   */
    const enhancePagination = (element) => {
        const paginationConfig = getElementConfig(element, 'nx-pagination');

        setupPagination(element, paginationConfig);

        debug('Enhanced pagination:', element, paginationConfig);
    };

    /**
   * Determine enhancement type and apply appropriate enhancement
   * @param {HTMLElement} element - Element to enhance
   */
    const enhanceElement = (element) => {
        if (!element || isEnhanced(element)) {
            return;
        }

        try {
            // Determine which enhancement to apply based on attributes
            if (element.hasAttribute('nx-nav')) {
                enhanceNav(element);
            }
            if (element.hasAttribute('nx-breadcrumb')) {
                enhanceBreadcrumb(element);
            }
            if (element.hasAttribute('nx-trail')) {
                enhanceTrail(element);
            }
            if (element.hasAttribute('nx-tabs')) {
                enhanceTabs(element);
            }
            if (element.hasAttribute('nx-scroll-spy')) {
                enhanceScrollSpy(element);
            }
            if (element.hasAttribute('nx-sticky')) {
                enhanceSticky(element);
            }
            if (element.hasAttribute('nx-mobile')) {
                enhanceMobile(element);
            }
            if (element.hasAttribute('nx-dropdown')) {
                enhanceDropdown(element);
            }
            if (element.hasAttribute('nx-pagination')) {
                enhancePagination(element);
            }

            // Mark as enhanced
            markEnhanced(element);
        } catch (err) {
            error('Error enhancing element:', err);
        }
    };

    // ============================================================================
    // DOM SCANNING
    // ============================================================================

    /**
   * Scan DOM and enhance matching elements
   * @param {string} selector - CSS selector for elements
   */
    const scanAndEnhance = (selector) => {
        if (typeof document === 'undefined') {
            return;
        }

        const startTime = performance.now();

        try {
            const elements = document.querySelectorAll(selector);
            debug(`Found ${elements.length} elements to enhance`);

            elements.forEach(enhanceElement);

            const duration = performance.now() - startTime;
            debug(`Enhanced ${elements.length} elements in ${duration.toFixed(2)}ms`);
        } catch (err) {
            error('Error scanning DOM:', err);
        }
    };

    // ============================================================================
    // MUTATION OBSERVER
    // ============================================================================

    /**
     * Set up keyboard shortcuts for navigation
     */
    const setupKeyboardShortcuts = () => {
        if (typeof document === 'undefined') {
            return;
        }

        document.addEventListener('keydown', (e) => {
            // Find all elements with nx-shortcut
            const shortcutElements = document.querySelectorAll('[nx-shortcut]');

            for (const element of shortcutElements) {
                const shortcut = element.getAttribute('nx-shortcut');
                if (matchesShortcut(e, shortcut)) {
                    e.preventDefault();

                    // Trigger click or navigation
                    if (element.tagName === 'A' || element.hasAttribute('href') || element.hasAttribute('nx-route')) {
                        element.click();
                    } else {
                        // For non-link elements, emit a custom event
                        emitEvent(element, 'shortcut-triggered', {
                            shortcut,
                            originalEvent: e
                        });
                    }

                    break; // Only trigger first matching shortcut
                }
            }
        });

        debug('Keyboard shortcuts initialized');
    };

    /**
     * Check if keyboard event matches shortcut string
     * @param {KeyboardEvent} e - Keyboard event
     * @param {string} shortcut - Shortcut string (e.g., "ctrl+h", "alt+shift+k")
     * @returns {boolean} True if matches
     */
    const matchesShortcut = (e, shortcut) => {
        const keys = shortcut.toLowerCase().split('+');
        const modifiers = keys.slice(0, -1);
        const key = keys[keys.length - 1];

        // Check modifiers
        for (const mod of modifiers) {
            switch (mod) {
                case 'ctrl':
                case 'control':
                    if (!e.ctrlKey) return false;
                    break;
                case 'alt':
                    if (!e.altKey) return false;
                    break;
                case 'shift':
                    if (!e.shiftKey) return false;
                    break;
                case 'meta':
                case 'cmd':
                case 'command':
                    if (!e.metaKey) return false;
                    break;
                default:
                    return false;
            }
        }

        // Check key
        return e.key.toLowerCase() === key;
    };

    /**
   * Set up MutationObserver for dynamic content - uses domx-bridge if available
   * @param {string} selector - CSS selector to watch
   */
    const setupObserver = (selector) => {
        if (typeof window === 'undefined') {
            debug('window not available');
            return;
        }

        const callback = (mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if node itself matches
                        if (node.matches && node.matches(selector)) {
                            enhanceElement(node);
                        }

                        // Check children
                        if (node.querySelectorAll) {
                            const children = node.querySelectorAll(selector);
                            children.forEach(enhanceElement);
                        }
                    }
                });
            });
        };

        // Use domx-bridge if available, fallback to native MutationObserver
        if (window.domxBridge) {
            observer = window.domxBridge.subscribe('navx', callback, { attributeFilter: ['nx-'] });
            debug('domx-bridge observer initialized');
        } else if (typeof MutationObserver !== 'undefined') {
            const nativeObserver = new MutationObserver(callback);

            // If document.body isn't available yet (very early load), wait for DOMContentLoaded
            if (typeof document === 'undefined' || !document.body) {
                debug('document.body not available; delaying MutationObserver until DOMContentLoaded');
                if (typeof document !== 'undefined') {
                    addGlobalListener(document, 'DOMContentLoaded', () => {
                        try {
                            nativeObserver.observe(document.body, { childList: true, subtree: true });
                            debug('MutationObserver initialized after DOMContentLoaded');
                        } catch (e) {
                            error('Failed to initialize MutationObserver:', e);
                        }
                    }, { once: true });
                }
            } else {
                nativeObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                debug('MutationObserver initialized');
            }
            observer = nativeObserver;
        } else {
            debug('MutationObserver not available');
        }
    };

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    /**
   * Initialize navX module
   * @param {Object} userConfig - Configuration options
   * @returns {Object} Public API
   */
    const init = (userConfig = {}) => {
        if (initialized) {
            warn('Already initialized');
            return publicAPI;
        }

        // Merge configuration
        config = Object.freeze({
            ...DEFAULT_CONFIG,
            ...userConfig
        });

        debug('Initializing with config:', config);

        // Scan existing elements
        scanAndEnhance(config.selector);

        // Set up MutationObserver if enabled
        if (config.observe) {
            setupObserver(config.selector);
        }

        // Set up keyboard shortcuts
        setupKeyboardShortcuts();

        initialized = true;
        debug('Initialized successfully');

        return publicAPI;
    };

    /**
   * Destroy navX and cleanup resources
   */
    const destroy = () => {
        debug('Destroying...');

        // Disconnect MutationObserver (handles both domx-bridge and native)
        if (observer) {
            if (typeof observer === 'function') {
                observer(); // domx-bridge unsubscribe
            } else {
                observer.disconnect();
            }
            observer = null;
            debug('MutationObserver disconnected');
        }

        // Disconnect scroll spy observers
        scrollSpyObservers.forEach((obs, element) => {
            obs.disconnect();
            debug('Disconnected scroll spy observer for:', element);
        });
        scrollSpyObservers.clear();

        // Disconnect sticky observers and remove sentinels
        stickyObservers.forEach((data, element) => {
            data.observer.disconnect();
            data.sentinel?.remove();
            debug('Disconnected sticky observer and removed sentinel for:', element);
        });
        stickyObservers.clear();

        // Remove any global listeners added via addGlobalListener
        removeAllGlobalListeners();

        // Reset state
        initialized = false;
        config = null;

        debug('Destroyed successfully');
    };

    /**
   * Check if navX is initialized
   * @returns {boolean} True if initialized
   */
    const isInitialized = () => {
        return initialized;
    };

    /**
   * Public API
   */
    const publicAPI = Object.freeze({
        VERSION,
        init,
        destroy,
        enhance: enhanceElement,
        isInitialized,
        // Utility functions for external use
        smoothScrollTo,
        announceToScreenReader,
        // Integration info
        hasGenXCommon: typeof window !== 'undefined' && !!window.genXCommon,
        hasAccX: hasAccX
    });

    // ============================================================================
    // SSR COMPATIBILITY & ROUTER INTEGRATION
    // ============================================================================

    /**
   * SSR COMPATIBILITY NOTES:
   *
   * navX is designed to be SSR-friendly:
   * 1. All DOM operations are guarded with typeof checks
   * 2. Module can be safely imported in Node.js/SSR environments
   * 3. Initialization is deferred until client-side execution
   * 4. No global state pollution in SSR contexts
   *
   * SSR Usage Pattern:
   * ```javascript
   * // Server-side: Just render HTML with nx-* attributes
   * <nav nx-nav="main">...</nav>
   *
   * // Client-side: Initialize after hydration
   * if (typeof window !== 'undefined') {
   *   navX.init();
   * }
   * ```
   */

    /**
   * ROUTER INTEGRATION PATTERNS:
   *
   * For SPA routers (React Router, Vue Router, etc.):
   *
   * 1. Re-enhance on route change:
   * ```javascript
   * router.afterEach(() => {
   *   navX.enhance(document.querySelector('[nx-nav]'));
   * });
   * ```
   *
   * 2. Update active links programmatically:
   * ```javascript
   * router.afterEach((to) => {
   *   const links = document.querySelectorAll('[nx-nav] a');
   *   links.forEach(link => {
   *     const matches = link.href.includes(to.path);
   *     link.classList.toggle('nx-active', matches);
   *   });
   * });
   * ```
   *
   * 3. Trail breadcrumbs with router history:
   * ```javascript
   * router.afterEach((to) => {
   *   // Trail is automatically updated via sessionStorage
   *   navX.enhance(document.querySelector('[nx-trail]'));
   * });
   * ```
   */

    // ============================================================================
    // EXPOSE MODULE
    // ============================================================================

    // Expose to global object
    if (typeof window !== 'undefined') {
        window.navX = publicAPI;

        // Factory export for bootloader integration
        window.nxXFactory = {
            init: (config = {}) => init(config)
        };
    }
    if (typeof global !== 'undefined') {
        global.navX = publicAPI;
    }

    // Export for CommonJS/Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = publicAPI;
    }

    // Auto-initialize if DOM is ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                debug('DOM ready, auto-initializing...');
                init();
            });
        } else {
            // DOM already ready
            init();
        }
    }

    debug('Module loaded');

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
