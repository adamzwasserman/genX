/**
 * FormatX - Succinct functional text formatting library
 * @version 2.2 (succinct refactor)
 */
(function() {
    'use strict';

    // Core utils (pure, concise)
    const parseNumber = v => {
        const n = parseFloat(v); return isNaN(n) ? null : n; 
    };
    const parseDate = v => {
        const d = new Date(v); return isNaN(d.getTime()) ? null : d; 
    };
    const safeJsonParse = v => typeof v === 'string' ? (_t => {
        try {
            const p = JSON.parse(v); return p?.__proto__ && Object.keys(p.__proto__).length ? ({}) : p; 
        } catch {
            return v; 
        } 
    })() : v;
    const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    // Input type converter - handles fx-type attribute
    const convertInput = (value, inputType) => {
        if (!inputType || inputType === 'auto') {
            return value;
        }

        const str = String(value);

        switch (inputType) {
        // Currency types
        case 'cents':       // Integer cents -> convert to dollars
        case 'pennies':     // alias
            return parseNumber(str) / 100;

            // Percentage types
        case 'decimal':     // 0-1 -> needs *100 for percentage
        case 'fraction':    // same as decimal
            return parseNumber(str);
        case 'percentage':  // 0-100 -> already percentage, keep as-is for percentage formatter
        case 'percent':     // alias
            return parseNumber(str); // DO NOT convert - let percentage formatter handle it

            // Date types
        case 'date':        // JavaScript Date (ISO or parseable string)
        case 'iso':         // ISO 8601 string
        case 'iso8601':
            return new Date(str);
        case 'unix':        // Unix timestamp (seconds)
        case 'timestamp':
        case 'epoch':       // Alias for unix timestamp
            return new Date(parseNumber(str) * 1000);
        case 'milliseconds': // Milliseconds since epoch
        case 'ms':
            return new Date(parseNumber(str));

            // Duration types
        case 'seconds':
        case 'sec':
            return parseNumber(str);
        case 'minutes':
        case 'min':
            return parseNumber(str) * 60;
        case 'hours':
        case 'hr':
            return parseNumber(str) * 3600;

            // Filesize types
        case 'bytes':
        case 'b':
            return parseNumber(str);
        case 'kilobytes':
        case 'kb':
            return parseNumber(str) * 1000;
        case 'megabytes':
        case 'mb':
            return parseNumber(str) * 1000000;
        case 'gigabytes':
        case 'gb':
            return parseNumber(str) * 1000000000;

            // Number types (JavaScript aliases)
        case 'number':      // JavaScript Number type
        case 'float':
        case 'double':      // alias for float
            return parseNumber(str);
        case 'integer':
        case 'int':
            return Math.floor(parseNumber(str));

            // String types (JavaScript aliases)
        case 'string':      // JavaScript String type
        case 'text':
        case 'str':         // common abbreviation
            return str;

            // Boolean types (JavaScript aliases)
        case 'boolean':     // JavaScript Boolean type
        case 'bool': {       // common abbreviation
            // Handle various boolean representations
            const lower = str.toLowerCase().trim();
            if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
                return true;
            }
            if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') {
                return false;
            }
            return Boolean(value);
        }
        // Object types (JavaScript aliases)
        case 'object':      // JavaScript Object type (parse JSON)
        case 'obj':
        case 'json':
            try {
                return JSON.parse(str);
            } catch {
                console.warn('FormatX: Failed to parse JSON for fx-type="object"');
                return value;
            }

            // Array types (JavaScript aliases)
        case 'array':       // JavaScript Array type (parse JSON array)
        case 'arr':
            try {
                const parsed = JSON.parse(str);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                console.warn('FormatX: Failed to parse array for fx-type="array"');
                return value;
            }

            // Null/Undefined handling
        case 'null':
            return null;
        case 'undefined':
            return undefined;

        default:
            console.warn(`FormatX: Unknown input type '${inputType}'`);
            return value;
        }
    };

    // Polymorphic format (tightened switch, shared num/date fallbacks)
    const format = (type, value, opts = {}) => {
        // Apply input type conversion if specified
        const convertedValue = opts.type ? convertInput(value, opts.type) : value;

        const str = String(convertedValue);
        const num = parseNumber(str);
        const date = parseDate(str);
        const fallback = () => str;

        switch (type) {
        // Numbers (grouped fallbacks)
        case 'number': case 'currency': case 'percent': case 'scientific': case 'accounting':
        case 'abbreviated': case 'compact': case 'millions': case 'billions': case 'trillions': case 'filesize':
        case 'duration': case 'fraction':
            if (num === null) {
                return fallback();
            }
            break;
            // Dates
        case 'date': case 'time': case 'datetime':
            if (date === null) {
                return fallback();
            }
            break;
            // Text/Special (no parse needed)
        default: break;
        }

        const { locale = 'en-US', decimals = 2, ...rest } = opts; // Shared defaults

        switch (type) {
        // Number variants (concise)
        case 'number':
            return num.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: rest.thousands !== false });
        case 'currency':
            return new Intl.NumberFormat(locale, { style: 'currency', currency: rest.currency || 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: rest.thousands !== false }).format(num);
        case 'percent': {
            // If input type is 'percentage', value is already 0-100, don't multiply
            // If input type is 'decimal' or not specified, multiply by 100
            const isAlreadyPercent = opts.type === 'percentage' || opts.type === 'percent';
            const factor = isAlreadyPercent ? 1 : (rest.factor !== false ? 100 : 1);
            // Use explicit decimals if provided, otherwise default to 0 for percentages
            const percentDecimals = opts.decimals !== undefined ? opts.decimals : 0;
            return `${(num * factor).toFixed(percentDecimals)}%`;
        }
        case 'scientific':
            return num.toExponential(rest.decimals ?? 2);
        case 'accounting': {
            const absFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: rest.currency || 'USD' }).format(Math.abs(num));
            return num < 0 ? `(${absFmt})` : absFmt;
        }
        // Abbrev/scale (shared logic)
        case 'abbreviated': {
            const abs = Math.abs(num); const d = rest.decimals ?? 1; const t = rest.threshold ?? 1000; const p = rest.prefix || ''; const s = rest.suffix || '';
            let res; if (abs >= 1e12) {
                res = (num / 1e12).toFixed(d) + 'T';
            } else if (abs >= 1e9) {
                res = (num / 1e9).toFixed(d) + 'B';
            } else if (abs >= 1e6) {
                res = (num / 1e6).toFixed(d) + 'M';
            } else if (abs >= t) {
                res = (num / 1e3).toFixed(d) + 'K';
            } else {
                res = num.toFixed(d);
            }
            return p + res + s;
        }
        case 'millions': return (rest.prefix || '') + (num / 1e6).toFixed(decimals) + (rest.suffix !== false ? 'M' : '');
        case 'billions': return (rest.prefix || '') + (num / 1e9).toFixed(decimals) + (rest.suffix !== false ? 'B' : '');
        case 'trillions': return (rest.prefix || '') + (num / 1e12).toFixed(decimals) + (rest.suffix !== false ? 'T' : '');
        case 'compact': {
            try {
                return new Intl.NumberFormat(locale, { notation: rest.long ? 'compact-long' : 'compact-short', maximumFractionDigits: decimals }).format(num); 
            } catch {
                return format('abbreviated', num, { ...opts, suffix: '' }); 
            }
        }
        // Filesize/Duration (tightened)
        case 'filesize': {
            const b = rest.binary ? 1024 : 1000;
            const u = rest.binary ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
            if (num === 0) {
                return '0 B';
            }
            const i = Math.floor(Math.log(num) / Math.log(b));
            return `${(num / Math.pow(b, i)).toFixed(decimals)} ${u[i]}`;
        }
        case 'duration': {
            const secs = Math.abs(num); const fmt = rest.durationFormat || 'auto';
            if (fmt === 'human') {
                const units = [{n:'y',s:31536000},{n:'d',s:86400},{n:'h',s:3600},{n:'m',s:60},{n:'s',s:1}]; let rem = secs; const parts = []; for (const unit of units) {
                    const c = Math.floor(rem / unit.s); if (c > 0) {
                        parts.push(`${c}${unit.n}`); rem -= c * unit.s; 
                    } 
                } return parts.join(' ') || '0s'; 
            }
            const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const ss = Math.floor(secs % 60); return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
        }
        case 'fraction': {
            const den = rest.denominator ?? findBestDenominator(num); const nr = Math.round(num * den); const w = Math.floor(nr / den); const r = nr % den;
            if (r === 0) {
                return '' + w;
            } if (w === 0) {
                return `${r}/${den}`;
            } return `${w} ${r}/${den}`;
        }
        // Dates (shared)
        case 'date': {
            const df = rest.dateFormat || rest.format || 'short'; const pat = rest.pattern;
            const fmts = {short:{month:'numeric',day:'numeric',year:'numeric'},medium:{month:'short',day:'numeric',year:'numeric'},long:{month:'long',day:'numeric',year:'numeric'},full:{weekday:'long',month:'long',day:'numeric',year:'numeric'}};
            if (df === 'iso') {
                return date.toISOString().split('T')[0];
            } if (df === 'custom' && pat) {
                return formatCustomDate(date, pat);
            } return date.toLocaleDateString(locale, fmts[df] || fmts.short);
        }
        case 'time': {
            const tf = rest.timeFormat || 'short'; const fmts = {short:{hour:'numeric',minute:'numeric'},medium:{hour:'numeric',minute:'numeric',second:'numeric'},long:{hour:'numeric',minute:'numeric',second:'numeric',timeZoneName:'short'}};
            return date.toLocaleTimeString(locale, fmts[tf] || fmts.short);
        }
        case 'datetime':
            return date.toLocaleString(locale);
            // Text
        case 'uppercase': return str.toUpperCase();
        case 'lowercase': return str.toLowerCase();
        case 'capitalize': return str.replace(/\b\w/g, l => l.toUpperCase());
        case 'trim': return str.trim();
        case 'truncate': { const l = rest.length ?? 50; const suf = rest.suffix || '...'; return str.length <= l ? str : str.slice(0, l - suf.length) + suf; }
        // Special
        case 'phone': {
            const pf = rest.phoneFormat || 'us';
            const trimmed = str.trim();

            // Check for international format (starts with + or 00)
            const isIntl = trimmed.startsWith('+') || trimmed.startsWith('00');

            if (isIntl) {
                // Handle EU/International numbers
                let normalized = trimmed;
                // Convert 00 prefix to +
                if (normalized.startsWith('00')) {
                    normalized = '+' + normalized.slice(2);
                }
                // Clean up extra spaces (keep single spaces)
                normalized = normalized.replace(/\s+/g, ' ');

                // Check if it's a US number (+1)
                const digits = normalized.replace(/\D/g, '');
                const isUS = digits.startsWith('1') && digits.length === 11;

                if (isUS && (pf === 'us' || pf === 'us-dash' || pf === 'us-dot')) {
                    // Format US number even though it has + prefix
                    const usDigits = digits.slice(1); // Remove country code
                    if (pf === 'us') {
                        return `(${usDigits.slice(0,3)}) ${usDigits.slice(3,6)}-${usDigits.slice(6)}`;
                    }
                    if (pf === 'us-dash') {
                        return `${usDigits.slice(0,3)}-${usDigits.slice(3,6)}-${usDigits.slice(6)}`;
                    }
                    if (pf === 'us-dot') {
                        return `${usDigits.slice(0,3)}.${usDigits.slice(3,6)}.${usDigits.slice(6)}`;
                    }
                }

                // Non-US international number - return normalized EU format
                return normalized;
            }

            // Not international format - process as US number
            const clean = str.replace(/\D/g, '');
            let digits = clean;

            // If 11 digits starting with 1, strip the country code
            if (digits.length === 11 && digits.startsWith('1')) {
                digits = digits.slice(1);
            }

            // Must have exactly 10 digits for US formatting
            if (digits.length !== 10) {
                return str;
            }

            // Format based on requested format
            if (pf === 'us') {
                return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
            }
            if (pf === 'us-dash') {
                return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
            }
            if (pf === 'us-dot') {
                return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
            }
            if (pf === 'intl') {
                return `+1 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
            }

            return str;
        }
        case 'ssn': {
            const clean = str.replace(/\D/g, ''); if (clean.length !== 9) {
                return str;
            } return (rest.mask !== false) ? `***-**-${clean.slice(-4)}` : `${clean.slice(0,3)}-${clean.slice(3,5)}-${clean.slice(5)}`;
        }
        case 'creditcard': {
            const clean = str.replace(/\D/g, ''); if (clean.length < 12) {
                return str;
            } return (rest.mask !== false) ? `****-****-****-${clean.slice(-4)}` : clean.match(/.{1,4}/g)?.join('-') || str;
        }
        default:
            console.warn(`FormatX: Unknown '${type}'`); return fallback();
        }
    };

    // Helpers (ultra-concise)
    const findBestDenominator = (dec, tol = 0.01, max = 64) => {
        for (let d = 2; d <= max; d *= 2) {
            const nr = Math.round(dec * d); if (Math.abs(dec - nr/d) < tol) {
                return d;
            } 
        } return 100; 
    };
    const formatCustomDate = (d, pat) => {
        const r = {YYYY:d.getFullYear(),YY:d.getFullYear().toString().slice(-2),MM:(d.getMonth()+1).toString().padStart(2,'0'),M:d.getMonth()+1,DD:d.getDate().toString().padStart(2,'0'),D:d.getDate(),HH:d.getHours().toString().padStart(2,'0'),H:d.getHours(),mm:d.getMinutes().toString().padStart(2,'0'),m:d.getMinutes(),ss:d.getSeconds().toString().padStart(2,'0'),s:d.getSeconds()}; let res = pat; for (const [k,v] of Object.entries(r)) {
            res = res.replace(new RegExp(k,'g'), ''+v);
        } return res; 
    };

    // DOM funcs (inlined helpers)
    const formatElement = (el, pref = 'fx-') => {
        // Try to get config from bootloader cache first (if using genX bootloader)
        let config = null;
        let typ = null;
        let opts = {};

        if (window.genx && window.genx.getConfig) {
            // Using genX bootloader - get cached config (O(1) lookup)
            config = window.genx.getConfig(el);
            if (config) {
                typ = config.format;
                // Spread config into opts, excluding 'format' key
                opts = {...config};
                delete opts.format;
            }
        }

        // Fallback to polymorphic notation parsing if no bootloader or no cached config
        if (!typ) {
            // Use polymorphic parser from genx-common (supports Verbose, Colon, JSON, CSS Class)
            const parsed = window.genxCommon
                ? window.genxCommon.notation.parseNotation(el, pref.replace('-', ''))
                : {};  // Fallback if genx-common not loaded

            typ = parsed.format;
            if (!typ) {
                return;
            }

            // Extract options (everything except 'format')
            opts = {...parsed};
            delete opts.format;
        }

        // Get raw value (not in cache - dynamic content)
        const raw = el.getAttribute(`${pref}raw`) || el.getAttribute(`${pref}value`) || el.textContent?.trim() || el.value || '';

        // SmartX integration - auto-detect format type
        let fmt;
        if (typ === 'smart' && window.SmartX) {
            fmt = window.SmartX.format(el, raw);
        } else {
            fmt = format(typ, raw, opts);
        }

        // Prevent infinite loop: only update if value changed
        if (['INPUT','TEXTAREA'].includes(el.tagName)) {
            if (el.value !== fmt) {
                el.value = fmt;
            }
        } else {
            if (el.textContent !== fmt) {
                el.textContent = fmt;
            }
        }
        if (!el.getAttribute(`${pref}raw`)) {
            el.setAttribute(`${pref}raw`, raw);
        }
    };
    const unformatElement = (el, pref = 'fx-') => {
        const raw = el.getAttribute(`${pref}raw`);
        if (!raw) {
            return null;
        }
        if (['INPUT','TEXTAREA'].includes(el.tagName)) {
            el.value = raw; 
        } else {
            el.textContent = raw; 
        }
        return raw;
    };
    const scanElements = (root = document, pref = 'fx-') => root.querySelectorAll(`[${pref}format]`).forEach(el => formatElement(el, pref));

    // Observer (streamlined)
    const createObserver = (pref, obsMut) => {
        let obs = null; let to = null;
        const cb = muts => {
            let scan = false;
            muts.forEach(m => {
                if (m.type === 'childList') {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType === 1) {
                            if (n.matches?.(`[${pref}format]`)) {
                                formatElement(n,pref);
                            }
                            if (n.querySelectorAll?.(`[${pref}format]`).length) {
                                scan = true;
                            }
                        }
                    });
                }
                if (m.type === 'attributes' && m.attributeName?.startsWith(pref)) {
                    formatElement(m.target,pref);
                }
            });
            if (scan) {
                clearTimeout(to); to = setTimeout(() => scanElements(document,pref), 0); 
            }
        };
        return {
            start: () => {
                if (obsMut && !obs) {
                    obs = new MutationObserver(cb); obs.observe(document.body, {childList:true,subtree:true,attributes:true}); 
                } 
            },
            stop: () => {
                obs?.disconnect(); obs = null; clearTimeout(to); 
            }
        };
    };

    // Init (minimal API)
    const initFormatX = cfg => {
        const { pref = 'fx-', auto = true, obs = true } = cfg || {};
        const o = createObserver(pref, obs);
        const api = {
            format: (t,v,o) => format(t,v,o),
            formatElement: e => formatElement(e,pref),
            unformatElement: e => unformatElement(e,pref),
            scan: r => scanElements(r,pref),
            destroy: () => o.stop()
        };
        const ready = () => {
            scanElements(document, pref); o.start(); 
        };
        if (auto) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded',ready);
            } else {
                ready();
            }
        }
        return api;
    };

    // Factory export for bootloader integration
    window.fxXFactory = {
        init: (config = {}) => initFormatX({pref:'fx-', auto:true, obs:true, ...config}),
        format
    };

    // Legacy global for standalone use (when not using bootloader)
    if (!window.genx) {
        window.FormatX = initFormatX({pref:'fx-',auto:true,obs:true});
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initFormatX, format };
    }
})();