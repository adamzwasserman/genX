/**
 * domx-bridge.js - Centralized MutationObserver bridge for genX
 *
 * Uses domx's shared observer instead of creating per-module observers.
 * This eliminates duplication and provides a single, efficient MutationObserver
 * for all genX modules (fmtx, accx, bindx, loadx, navx, dragx).
 *
 * @module domx-bridge
 * @version 1.0.0
 */
(function(window) {
    'use strict';

    // Module subscriptions registry
    const subscriptions = new Map();

    // Single unsubscribe function from domx
    let domxUnsubscribe = null;

    // Whether we've connected to domx
    let connected = false;

    /**
     * Filter mutations based on module's attribute filter
     * @param {MutationRecord[]} mutations - All mutations from domx
     * @param {string[]} attributeFilter - Attribute prefixes to filter (e.g., ['fx-'])
     * @returns {MutationRecord[]} Filtered mutations relevant to this module
     */
    function filterMutations(mutations, attributeFilter) {
        if (!attributeFilter || attributeFilter.length === 0) {
            return mutations;
        }

        return mutations.filter(mutation => {
            // For childList mutations, check if any added nodes have matching attributes
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes || []);
                const hasMatchingNode = addedNodes.some(node => {
                    if (node.nodeType !== 1) return false; // Element nodes only

                    // Check if element has any attribute matching our filter
                    const attrs = Array.from(node.attributes || []);
                    return attrs.some(attr =>
                        attributeFilter.some(prefix => attr.name.startsWith(prefix))
                    );
                });

                // Also check descendants of added nodes
                const hasMatchingDescendant = addedNodes.some(node => {
                    if (node.nodeType !== 1) return false;
                    const descendants = node.querySelectorAll ?
                        Array.from(node.querySelectorAll('*')) : [];
                    return descendants.some(desc => {
                        const attrs = Array.from(desc.attributes || []);
                        return attrs.some(attr =>
                            attributeFilter.some(prefix => attr.name.startsWith(prefix))
                        );
                    });
                });

                return hasMatchingNode || hasMatchingDescendant;
            }

            // For attribute mutations, check if the attribute matches our filter
            if (mutation.type === 'attributes') {
                return attributeFilter.some(prefix =>
                    mutation.attributeName && mutation.attributeName.startsWith(prefix)
                );
            }

            // For characterData, pass through (modules can filter further if needed)
            return mutation.type === 'characterData';
        });
    }

    /**
     * Central mutation handler - dispatches to all subscribed modules
     * @param {MutationRecord[]} mutations - Mutations from domx
     */
    function handleMutations(mutations) {
        for (const [moduleId, subscription] of subscriptions) {
            const { callback, options } = subscription;

            // Filter mutations based on module's attribute filter
            const filtered = options.childList && !options.attributeFilter ?
                mutations : // childList-only subscriptions get all mutations
                filterMutations(mutations, options.attributeFilter);

            if (filtered.length > 0) {
                try {
                    callback(filtered);
                } catch (error) {
                    console.error(`[domx-bridge] Error in ${moduleId} callback:`, error);
                }
            }
        }
    }

    /**
     * Connect to domx - called when first subscription is made
     */
    function connect() {
        if (connected) return;

        const domx = window.domx;
        if (!domx || typeof domx.on !== 'function') {
            console.warn('[domx-bridge] domx not available, using fallback observer');
            createFallbackObserver();
            return;
        }

        domxUnsubscribe = domx.on(handleMutations);
        connected = true;
    }

    /**
     * Fallback observer for when domx is not available
     * Used primarily for testing or standalone usage
     */
    function createFallbackObserver() {
        const observer = new MutationObserver(handleMutations);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        domxUnsubscribe = () => observer.disconnect();
        connected = true;
    }

    /**
     * Subscribe a module to receive mutation notifications
     *
     * @param {string} moduleId - Unique identifier for the module (e.g., 'fmtx', 'accx')
     * @param {Function} callback - Function to call with filtered mutations
     * @param {Object} options - Subscription options
     * @param {string[]} [options.attributeFilter] - Attribute prefixes to watch (e.g., ['fx-'])
     * @param {boolean} [options.childList] - Whether to receive childList mutations
     * @returns {Function} Unsubscribe function
     */
    function subscribe(moduleId, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error(`[domx-bridge] Callback must be a function for module ${moduleId}`);
        }

        // Store subscription
        subscriptions.set(moduleId, {
            callback,
            options: {
                attributeFilter: options.attributeFilter || [],
                childList: options.childList !== false // Default to true
            }
        });

        // Connect to domx if not already connected
        if (!connected && subscriptions.size === 1) {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', connect, { once: true });
            } else {
                connect();
            }
        }

        // Return unsubscribe function
        return function unsubscribe() {
            subscriptions.delete(moduleId);

            // If no more subscriptions, disconnect from domx
            if (subscriptions.size === 0 && domxUnsubscribe) {
                domxUnsubscribe();
                domxUnsubscribe = null;
                connected = false;
            }
        };
    }

    /**
     * Unsubscribe a module by ID
     * @param {string} moduleId - Module identifier to unsubscribe
     */
    function unsubscribe(moduleId) {
        subscriptions.delete(moduleId);

        if (subscriptions.size === 0 && domxUnsubscribe) {
            domxUnsubscribe();
            domxUnsubscribe = null;
            connected = false;
        }
    }

    /**
     * Check if a module is currently subscribed
     * @param {string} moduleId - Module identifier to check
     * @returns {boolean} Whether the module is subscribed
     */
    function isSubscribed(moduleId) {
        return subscriptions.has(moduleId);
    }

    /**
     * Get current subscription count (for debugging/testing)
     * @returns {number} Number of active subscriptions
     */
    function getSubscriptionCount() {
        return subscriptions.size;
    }

    // Export to window for IIFE modules
    window.domxBridge = {
        subscribe,
        unsubscribe,
        isSubscribed,
        getSubscriptionCount
    };

    // Also support ES module environments
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.domxBridge;
    }

})(typeof window !== 'undefined' ? window : this);
