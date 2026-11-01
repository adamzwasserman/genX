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
     * Show the loading state on a link while navigation starts
     * @param {HTMLElement} element - Navigation element
     */
    const showLinkLoading = (element) => {
        if (!element.hasAttribute('nx-loading')) {
            return;
        }
        element.classList.add('nx-loading');
        element.setAttribute('aria-disabled', 'true');
        element.style.pointerEvents = 'none';

        // Re-enable after navigation (this is a simple implementation)
        setTimeout(() => {
            element.classList.remove('nx-loading');
            element.removeAttribute('aria-disabled');
            element.style.pointerEvents = '';
        }, 1000);
    };

    /**
     * Check navigation guards before allowing navigation.
     * Runs synchronously so the caller can still cancel the click.
     * @param {HTMLElement} element - Navigation element
     * @param {string} href - Target URL
     * @param {Event} event - Click event
     * @returns {boolean|Promise<boolean>} True if navigation should proceed;
     *   a Promise when nx-before-navigate returns one
     */
    const checkNavigationGuards = (element, href, event) => {
        const cancel = (reason) => {
            emitEvent(element, 'navigation-cancelled', { reason, href, element });
            return false;
        };

        // Check nx-confirm
        const confirmMessage = element.getAttribute('nx-confirm');
        if (confirmMessage) {
            const confirmed = window.confirm(confirmMessage);
            if (!confirmed) {
                return cancel('user-cancelled-confirm');
            }
        }

        const fail = (err) => {
            warn('Error in nx-before-navigate function:', err);
            emitEvent(element, 'navigation-error', { error: err, href, element });
            return false;
        };

        // Check nx-before-navigate function
        const beforeNavigate = element.getAttribute('nx-before-navigate');
        if (beforeNavigate) {
            let result;
            try {
                const fn = window[beforeNavigate] || eval(beforeNavigate);
                if (typeof fn === 'function') {
                    result = fn(href, element, event);
                }
            } catch (err) {
                return fail(err);
            }

            if (result && typeof result.then === 'function') {
                return Promise.resolve(result).then((value) => {
                    if (value === false) {
                        return cancel('before-navigate-returned-false');
                    }
                    showLinkLoading(element);
                    return true;
                }, fail);
            }
            if (result === false) {
                return cancel('before-navigate-returned-false');
            }
        }

        // Check nx-loading (show loading state)
        showLinkLoading(element);

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
            } else if (isPlainObject(v)) {
                // Nested maps such as breadcrumb labels, cleaned the same way
                out[k] = sanitizeConfig(v);
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
        let path = href;
        try {
            // Compare paths only, so absolute and relative hrefs both work
            path = new URL(href, window.location.href).pathname;
        } catch (e) {
            // Keep the raw href
        }
        if (exact || path === '/') {
            // "/" is the home page, not a prefix of every path
            return currentPath === path;
        }
        if (currentPath === path) {
            return true;
        }
        // Prefix match on whole segments: /products matches /products/shoes, not /productsale
        const prefix = path.endsWith('/') ? path : path + '/';
        return currentPath.startsWith(prefix);
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
                const prefix = baseAttr.replace('nx-', '').replace(/-([a-z])/g, (m, c) => c.toUpperCase());

                if (cachedConfig[prefix] !== undefined) {
                    result.value = cachedConfig[prefix];
                }

                Object.keys(cachedConfig).forEach(key => {
                    if (key.startsWith(prefix) && key !== prefix) {
                        const configKey = key.charAt(prefix.length).toLowerCase() + key.slice(prefix.length + 1);
                        result[configKey] = cachedConfig[key];
                    }
                });

                // Unprefixed attributes apply when no prefixed form is set
                Object.keys(cachedConfig).forEach(key => {
                    if (key !== prefix && !key.startsWith(prefix) && result[key] === undefined) {
                        result[key] = cachedConfig[key];
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

        // Extract base attribute name (e.g., 'nx-nav' -> 'nav', 'nx-scroll-spy' -> 'scrollSpy')
        const baseName = baseAttr.replace('nx-', '').replace(/-([a-z])/g, (m, c) => c.toUpperCase());

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

        // Unprefixed attributes on the same element (e.g., nx-active-class next to
        // nx-nav, nx-offset next to nx-scroll-spy) apply when no prefixed form is set
        Object.keys(parsed).forEach(key => {
            if (key !== baseName && !key.startsWith(baseName) && elementConfig[key] === undefined) {
                elementConfig[key] = parsed[key];
            }
        });

        return elementConfig;
    };

    // ============================================================================
    // NAVIGATION ENHANCEMENT
    // ============================================================================

    // Elements that can act as navigation links inside nx-nav
    const NAV_LINK_SELECTOR = 'a[href], [hx-get], [hx-post], [hx-put], [hx-delete], [nx-route]';

    // Enhanced nav elements and their settings, for rechecking active links
    const enhancedNavs = new Map();

    /**
   * Get the target URL of a navigation link
   * Priority: nx-route > href attribute > HTMX attributes
   * @param {HTMLElement} navElement - Link element
   * @returns {string|null} Target URL
   */
    const getLinkHref = (navElement) => {
        const attrs = ['nx-route', 'href', 'hx-get', 'hx-post', 'hx-put', 'hx-delete'];
        for (const attr of attrs) {
            if (navElement.hasAttribute(attr)) {
                return navElement.getAttribute(attr);
            }
        }
        return null;
    };

    /**
   * Set or clear the active state of one link
   * @param {HTMLElement} navElement - Link element
   * @param {Object} settings - { activeClass, exact }
   */
    const updateLinkActive = (navElement, settings) => {
        const href = getLinkHref(navElement);
        // Skip anchor links for active state (they are handled by smooth scroll)
        if (!href || href.startsWith('#')) {
            return;
        }
        if (matchesCurrentPathWithPatterns(navElement, href, settings.exact)) {
            navElement.classList.add(settings.activeClass);
            navElement.setAttribute('aria-current', 'page');
        } else {
            navElement.classList.remove(settings.activeClass);
            navElement.removeAttribute('aria-current');
        }
    };

    /**
   * Enhance one link inside an nx-nav element: active state, guards, events
   * @param {HTMLElement} navElement - Link element
   * @param {Object} settings - { activeClass, exact }
   */
    const enhanceNavLink = (navElement, settings) => {
        const href = getLinkHref(navElement);
        if (!href) {
            return;
        }

        updateLinkActive(navElement, settings);

        if (navElement.hasAttribute('nx-link-enhanced')) {
            return;
        }
        navElement.setAttribute('nx-link-enhanced', 'true');

        // Guards run synchronously so a refusal can still cancel the click
        navElement.addEventListener('click', (e) => {
            const result = checkNavigationGuards(navElement, href, e);

            if (result === false) {
                e.preventDefault();
                return;
            }

            if (result && typeof result.then === 'function') {
                // An async nx-before-navigate: hold the click, then navigate if allowed
                e.preventDefault();
                result.then((allowed) => {
                    if (allowed) {
                        emitNavigationEvent(navElement, href, { originalEvent: e, navElement });
                        if (navElement.tagName === 'A' && navElement.href) {
                            window.location.href = navElement.href;
                        }
                    }
                });
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
    };

    /**
   * Recheck active links in every enhanced nav (after pushState, popstate, etc.)
   */
    const refreshActiveLinks = () => {
        enhancedNavs.forEach((settings, element) => {
            if (!element.isConnected) {
                enhancedNavs.delete(element);
                return;
            }
            element.querySelectorAll(NAV_LINK_SELECTOR).forEach(link => updateLinkActive(link, settings));
        });
    };

    /**
   * Enhance navigation element (nx-nav)
   * @param {HTMLElement} element - Nav element to enhance
   */
    const enhanceNav = (element) => {
        const navConfig = getElementConfig(element, 'nx-nav');
        const settings = {
            activeClass: navConfig.activeClass || config.activeClass,
            exact: navConfig.exact === true || navConfig.exact === 'true'
        };
        enhancedNavs.set(element, settings);

        // Landmark role and name, unless the page already set them
        if (!element.hasAttribute('role')) {
            element.setAttribute('role', 'navigation');
        }
        if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby') &&
            typeof navConfig.value === 'string' && navConfig.value && navConfig.value !== 'true') {
            const name = navConfig.value.charAt(0).toUpperCase() + navConfig.value.slice(1);
            element.setAttribute('aria-label', `${name} navigation`);
        }

        // Find all navigable elements in nav:
        // 1. Traditional links: a[href]
        // 2. HTMX elements: [hx-get], [hx-post], [hx-put], [hx-delete]
        // 3. Route elements: [nx-route]
        element.querySelectorAll(NAV_LINK_SELECTOR).forEach(navElement => enhanceNavLink(navElement, settings));

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

        // Find all tabs (role="tab" first, then buttons, links or list items)
        let tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        if (tabs.length === 0) {
            tabs = Array.from(tabList.querySelectorAll('button, a'));
        }
        if (tabs.length === 0) {
            tabs = Array.from(tabList.querySelectorAll('li'));
        }

        if (tabs.length === 0) {
            warn('No tabs found in tab list');
            return;
        }

        // Find all panels
        let panels = Array.from(element.querySelectorAll('[role="tabpanel"]'));
        if (panels.length === 0) {
            panels = Array.from(element.querySelectorAll('.nx-tab-panel'));
        }

        // Vertical tab lists use Up and Down keys and stack their tabs
        if (config.orientation === 'vertical') {
            tabList.setAttribute('aria-orientation', 'vertical');
            tabList.style.display = 'flex';
            tabList.style.flexDirection = 'column';
        }

        const updateUrl = config.updateUrl === true || config.updateUrl === 'true';
        // URL hash key of a tab: its data-tab, else its panel id
        const tabKey = (tab, index) => tab.getAttribute('data-tab') || panels[index]?.id || tab.id;
        const select = (tab) => {
            const changed = tab.getAttribute('aria-selected') !== 'true';
            activateTab(tab, tabs, panels);
            if (changed) {
                emitTabChangeEvent(element, tabs.indexOf(tab), tab.id, { tab, panel: panels[tabs.indexOf(tab)] || null });
            }
            if (updateUrl && typeof window !== 'undefined' && window.history) {
                const key = tabKey(tab, tabs.indexOf(tab));
                if (key && window.location.hash !== `#${key}`) {
                    window.history.pushState(null, '', `#${key}`);
                }
            }
        };

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

        // Activate the tab named in the URL hash (deep link), else the first tab
        const hash = typeof window !== 'undefined' ? decodeURIComponent(window.location.hash.slice(1)) : '';
        const linked = hash ? tabs.find((tab, index) => tabKey(tab, index) === hash || tab.id === hash) : null;
        if (linked) {
            activateTab(linked, tabs, panels);
        } else if (tabs.length > 0) {
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
                    select(tab);
                    return;

                default:
                    return;
                }

                // Focus and activate new tab
                tabs[targetIndex].focus();
                if (config.autoActivate !== false) {
                    select(tabs[targetIndex]);
                }
            });

            // Click handler
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                select(tab);
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

        // Configuration. A section counts as current while any part of it is in the
        // top half of the viewport, below nx-offset pixels (e.g. a fixed header).
        const threshold = config.threshold !== undefined ? Number(config.threshold) : 0;
        const offset = parseInt(config.offset || '0', 10) || 0;
        const rootMargin = config.rootMargin || `${-offset}px 0px -50% 0px`;
        const activeClass = config.activeClass || 'nx-active';

        // Sections in document order, and the ones in the band now
        const sections = Array.from(targets.keys()).sort((a, b) =>
            (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
        const visible = new Set();

        // Create IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visible.add(entry.target);
                } else {
                    visible.delete(entry.target);
                }
            });

            // The first section in the band is current; keep the last one when none is.
            // A section whose bottom edge only touches the band still reports as
            // intersecting, so skip sections that have scrolled past its top.
            const current = sections.find(section =>
                visible.has(section) && section.getBoundingClientRect().bottom > offset);
            if (!current) {
                return;
            }
            links.forEach(l => {
                l.classList.remove(activeClass);
                l.removeAttribute('aria-current');
            });
            const link = targets.get(current);
            link.classList.add(activeClass);
            link.setAttribute('aria-current', 'location');
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

        // Marker class for styling, plus a state class while stuck
        element.classList.add('nx-sticky');
        const stickyClass = config.stickyClass || 'nx-stuck';
        const offset = parseInt(config.offset || '0', 10) || 0;

        // Sentinel sits in the flow just above the element; once it has scrolled
        // nx-sticky-offset pixels past the top of the viewport, the element is stuck
        const sentinel = document.createElement('div');
        sentinel.className = 'nx-sticky-sentinel';
        sentinel.setAttribute('aria-hidden', 'true');
        sentinel.style.height = '1px';
        sentinel.style.marginBottom = '-1px';
        sentinel.style.width = '1px';
        sentinel.style.pointerEvents = 'none';
        sentinel.style.overflow = 'hidden';

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
        const hasDuration = options.duration !== undefined && options.duration !== null;
        const duration = Number(options.duration) || 500;
        const offset = Number(options.offset) || 0;
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

        // "instant" or "auto" jumps straight to the target
        if (behavior !== 'smooth') {
            window.scrollTo(0, targetY);
            return;
        }

        // Native smooth scroll has its own pace; a set duration uses the animation below
        if (!hasDuration && 'scrollBehavior' in document.documentElement.style) {
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

                    // Per-link nx-scroll="smooth|instant" and nx-duration override the nav settings
                    const linkBehavior = link.getAttribute('nx-scroll');
                    const linkDuration = link.getAttribute('nx-duration');
                    smoothScrollTo(target, {
                        duration: linkDuration !== null ? parseInt(linkDuration, 10) : config.duration,
                        offset: config.offset || 0,
                        behavior: linkBehavior || config.behavior || 'smooth'
                    });

                    // Update URL hash
                    if (config.updateHash !== false) {
                        history.pushState(null, '', href);
                    }

                    // Focus target for accessibility
                    if (config.focusTarget !== false) {
                        target.setAttribute('tabindex', '-1');
                        // preventScroll keeps focus from cutting the smooth scroll short
                        target.focus({ preventScroll: true });
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

        // Open dropdown; focus moves to the first item unless opened by hover
        const openDropdown = async ({ focus = true } = {}) => {
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
            if (focus) {
                currentIndex = 0;
                items[currentIndex]?.focus();
            }
            emitDropdownEvent(element, 'open', { trigger, menu });
        };

        // Close dropdown; focus returns to the trigger unless closed by hover
        const closeDropdown = ({ focus = true } = {}) => {
            trigger.setAttribute('aria-expanded', 'false');
            menu.hidden = true;
            menu.classList.remove('nx-dropdown-open');
            currentIndex = -1;
            if (focus) {
                trigger.focus();
            }
            emitDropdownEvent(element, 'close', { trigger, menu });
        };

        // nx-dropdown="hover" also opens on pointer hover and closes after a delay
        if (config.value === 'hover') {
            const delay = parseInt(config.delay ?? '300', 10);
            let closeTimer = null;
            element.addEventListener('mouseenter', () => {
                clearTimeout(closeTimer);
                if (menu.hidden) {
                    openDropdown({ focus: false });
                }
            });
            element.addEventListener('mouseleave', () => {
                clearTimeout(closeTimer);
                closeTimer = setTimeout(() => {
                    if (!menu.hidden) {
                        closeDropdown({ focus: false });
                    }
                }, isNaN(delay) ? 300 : delay);
            });
        }

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

        // Disclosure pattern: Enter and Space toggle the menu with focus on the
        // trigger; Arrow Down opens it if needed and moves focus to the first item
        trigger.addEventListener('keydown', (e) => {
            switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (menu.hidden) {
                    openDropdown({ focus: false });
                } else {
                    closeDropdown();
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (menu.hidden) {
                    openDropdown();
                } else {
                    navigateToItem(0);
                }
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
    /**
   * Page numbers to show, with null for a gap. Up to 10 pages show in full;
   * beyond that, the first and last three plus the current page and its neighbors.
   * @param {number} current - Current page
   * @param {number} total - Total pages
   * @returns {Array<number|null>} Pages and gaps
   */
    const paginationWindow = (current, total) => {
        if (total <= 10) {
            return Array.from({ length: total }, (v, i) => i + 1);
        }
        const keep = new Set([1, 2, 3, total - 2, total - 1, total, current - 1, current, current + 1]);
        const pages = [];
        let last = 0;
        for (let p = 1; p <= total; p++) {
            if (keep.has(p)) {
                if (p - last > 1) {
                    pages.push(null);
                }
                pages.push(p);
                last = p;
            }
        }
        return pages;
    };

    /**
   * Render Previous, page and Next buttons into a pagination element
   * @param {HTMLElement} element - Pagination container element
   */
    const renderPagination = (element) => {
        const total = parseInt(element.getAttribute('data-total-pages'), 10) || 1;
        const current = Math.min(Math.max(parseInt(element.getAttribute('data-current-page'), 10) || 1, 1), total);
        element.setAttribute('data-current-page', String(current));

        const button = (cls, label, page, disabled) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = cls;
            b.textContent = label;
            if (page !== null) {
                b.setAttribute('data-page', String(page));
            }
            b.disabled = disabled;
            return b;
        };

        const parts = [button('prev', 'Previous', null, current <= 1)];
        parts[0].setAttribute('data-prev', '');
        paginationWindow(current, total).forEach(page => {
            if (page === null) {
                const gap = document.createElement('span');
                gap.className = 'page-ellipsis';
                gap.setAttribute('aria-hidden', 'true');
                gap.textContent = '...';
                parts.push(gap);
            } else {
                const b = button('page-btn', String(page), page, false);
                if (page === current) {
                    b.classList.add('nx-active');
                    b.setAttribute('aria-current', 'page');
                }
                parts.push(b);
            }
        });
        const next = button('next', 'Next', null, current >= total);
        next.setAttribute('data-next', '');
        parts.push(next);

        element.replaceChildren(...parts);
    };

    /**
   * Setup pagination controls. With data-total-items and data-per-page (or
   * data-total-pages) on an empty element, navX renders the buttons itself and
   * keeps them current; otherwise it wires up the buttons already there.
   * @param {HTMLElement} element - Pagination container element
   * @param {Object} config - Pagination configuration
   */
    const setupPagination = (element, config) => {
        const totalItems = parseInt(element.getAttribute('data-total-items') ?? config.totalItems, 10);
        const perPage = parseInt(element.getAttribute('data-per-page') ?? config.perPage, 10);
        if (totalItems >= 0 && perPage > 0) {
            element.setAttribute('data-total-pages', String(Math.max(1, Math.ceil(totalItems / perPage))));
        }
        const renders = element.hasAttribute('data-total-pages') &&
            !element.querySelector('.page-btn, [data-page], .prev, [data-prev], .next, [data-next]');

        const currentPage = () => parseInt(element.getAttribute('data-current-page') || '1', 10);
        const totalPages = () => parseInt(element.getAttribute('data-total-pages') || '1', 10);

        if (renders) {
            if (!element.hasAttribute('role')) {
                element.setAttribute('role', 'navigation');
            }
            if (!element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', 'Pagination');
            }
            renderPagination(element);

            // One delegated listener survives re-renders
            element.addEventListener('click', (e) => {
                const b = e.target.closest && e.target.closest('button');
                if (!b || !element.contains(b) || b.disabled) {
                    return;
                }
                let page = null;
                if (b.hasAttribute('data-prev')) {
                    page = currentPage() - 1;
                } else if (b.hasAttribute('data-next')) {
                    page = currentPage() + 1;
                } else if (b.hasAttribute('data-page')) {
                    page = parseInt(b.getAttribute('data-page'), 10);
                }
                if (page === null || isNaN(page) || page < 1 || page > totalPages()) {
                    return;
                }
                e.preventDefault();
                element.setAttribute('data-current-page', String(page));
                renderPagination(element);
                emitPaginationEvent(element, page, { button: b, originalEvent: e });
            });

            debug('Rendered pagination:', totalPages(), 'pages');
            return;
        }

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
                if (currentPage() > 1) {
                    emitPaginationEvent(element, currentPage() - 1, { button: prevButton, originalEvent: e });
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage() < totalPages()) {
                    emitPaginationEvent(element, currentPage() + 1, { button: nextButton, originalEvent: e });
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

        // Global listener, so destroy() removes it and init() doesn't stack copies
        addGlobalListener(document, 'keydown', (e) => {
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

                        // Links added inside a nav that is already enhanced
                        const nav = node.parentElement && node.parentElement.closest('[nx-nav]');
                        const settings = nav && enhancedNavs.get(nav);
                        if (settings) {
                            const links = node.matches(NAV_LINK_SELECTOR) ? [node] : [];
                            node.querySelectorAll(NAV_LINK_SELECTOR).forEach(link => links.push(link));
                            links.forEach(link => enhanceNavLink(link, settings));
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

    // Original history methods, restored by destroy()
    let originalHistory = null;

    /**
   * Recheck active links when the URL changes without a page load
   * (history.pushState, history.replaceState, back and forward)
   */
    const watchHistory = () => {
        if (typeof window === 'undefined' || !window.history || originalHistory) {
            return;
        }
        const history = window.history;
        originalHistory = { pushState: history.pushState, replaceState: history.replaceState };
        ['pushState', 'replaceState'].forEach((method) => {
            const original = originalHistory[method];
            history[method] = function(...args) {
                const result = original.apply(this, args);
                refreshActiveLinks();
                return result;
            };
        });
        addGlobalListener(window, 'popstate', refreshActiveLinks);
    };

    const unwatchHistory = () => {
        if (originalHistory) {
            window.history.pushState = originalHistory.pushState;
            window.history.replaceState = originalHistory.replaceState;
            originalHistory = null;
        }
    };

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

        // Keep active links current on client-side URL changes
        watchHistory();

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
        unwatchHistory();
        enhancedNavs.clear();

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
