/**
 * Build entry for dist/bootloader.js (bootloader.min.js on the CDN).
 *
 * Ships domx-bridge with the bootloader so content added after load (HTMX swaps,
 * fetch-rendered fragments) is formatted with no extra script tag, as the user guide
 * promises. The bridge delegates to domx when the page loads it, and otherwise runs a
 * single native MutationObserver. Set genxConfig.observe = false to opt out.
 */
require('./domx-bridge.js');
module.exports = require('./bootloader.js');
