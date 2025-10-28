formatx-v2.js
11.29 KB •182 lines
Formatting may be inconsistent from source
/**
 * FormatX - Succinct functional text formatting library
 * @version 2.2 (succinct refactor)
 */
(function() {
    'use strict';

    // Core utils (pure, concise)
    const parseNumber = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    const parseDate = v => { const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    const safeJsonParse = v => typeof v === 'string' ? (t => { try { const p = JSON.parse(v); return p?.__proto__ && Object.keys(p.__proto__).length ? ({}) : p; } catch { return v; } })() : v;
    const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    // Polymorphic format (tightened switch, shared num/date fallbacks)
    const format = (type, value, opts = {}) => {
        const str = String(value);
        const num = parseNumber(str);
        const date = parseDate(str);
        const fallback = () => str;

        switch (type) {
            // Numbers (grouped fallbacks)
            case 'number': case 'currency': case 'percent': case 'scientific': case 'accounting':
            case 'abbreviated': case 'compact': case 'millions': case 'billions': case 'trillions': case 'filesize':
            case 'duration': case 'fraction':
                if (num === null) return fallback();
                break;
            // Dates
            case 'date': case 'time': case 'datetime':
                if (date === null) return fallback();
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
                return new Intl.NumberFormat(locale, { style: 'currency', currency: rest.currency || 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
            case 'percent':
                return `${(num * (rest.factor !== false ? 100 : 1)).toFixed(rest.decimals ?? 0)}%`;
            case 'scientific':
                return num.toExponential(rest.decimals ?? 2);
            case 'accounting':
                const absFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: rest.currency || 'USD' }).format(Math.abs(num));
                return num < 0 ? `(${absFmt})` : absFmt;
            // Abbrev/scale (shared logic)
            case 'abbreviated': {
                const abs = Math.abs(num); const d = rest.decimals ?? 1; const t = rest.threshold ?? 1000; const p = rest.prefix || ''; const s = rest.suffix || '';
                let res; if (abs >= 1e12) res = (num / 1e12).toFixed(d) + 'T'; else if (abs >= 1e9) res = (num / 1e9).toFixed(d) + 'B'; else if (abs >= 1e6) res = (num / 1e6).toFixed(d) + 'M'; else if (abs >= t) res = (num / 1e3).toFixed(d) + 'K'; else res = num.toFixed(d);
                return p + res + s;
            }
            case 'millions': return (rest.prefix || '') + (num / 1e6).toFixed(decimals) + (rest.suffix !== false ? 'M' : '');
            case 'billions': return (rest.prefix || '') + (num / 1e9).toFixed(decimals) + (rest.suffix !== false ? 'B' : '');
            case 'trillions': return (rest.prefix || '') + (num / 1e12).toFixed(decimals) + (rest.suffix !== false ? 'T' : '');
            case 'compact': {
                try { return new Intl.NumberFormat(locale, { notation: rest.long ? 'compact-long' : 'compact-short', maximumFractionDigits: decimals }).format(num); } catch { return format('abbreviated', num, { ...opts, suffix: '' }); }
            }
            // Filesize/Duration (tightened)
            case 'filesize': {
                const b = rest.binary ? 1024 : 1000; const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; if (num === 0) return '0 B';
                const i = Math.floor(Math.log(num) / Math.log(b)); return `${(num / Math.pow(b, i)).toFixed(decimals)} ${u[i]}`;
            }
            case 'duration': {
                let secs = Math.abs(num); const fmt = rest.durationFormat || 'auto';
                if (fmt === 'human') { const units = [{n:'y',s:31536000},{n:'d',s:86400},{n:'h',s:3600},{n:'m',s:60},{n:'s',s:1}]; let rem = secs; let parts = []; for (let unit of units) { let c = Math.floor(rem / unit.s); if (c > 0) { parts.push(`${c}${unit.n}`); rem -= c * unit.s; } } return parts.join(' ') || '0s'; }
                const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const ss = Math.floor(secs % 60); return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
            }
            case 'fraction': {
                const den = rest.denominator ?? findBestDenominator(num); const nr = Math.round(num * den); const w = Math.floor(nr / den); const r = nr % den;
                if (r === 0) return '' + w; if (w === 0) return `${r}/${den}`; return `${w} ${r}/${den}`;
            }
            // Dates (shared)
            case 'date': {
                const df = rest.dateFormat || 'short'; const pat = rest.pattern;
                const fmts = {short:{month:'numeric',day:'numeric',year:'numeric'},medium:{month:'short',day:'numeric',year:'numeric'},long:{month:'long',day:'numeric',year:'numeric'},full:{weekday:'long',month:'long',day:'numeric',year:'numeric'}};
                if (df === 'iso') return date.toISOString().split('T')[0]; if (df === 'custom' && pat) return formatCustomDate(date, pat); return date.toLocaleDateString(locale, fmts[df] || fmts.short);
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
                const clean = str.replace(/\D/g, ''); const pf = rest.phoneFormat || 'us';
                if (pf === 'us' && clean.length === 10) return `(${clean.slice(0,3)}) ${clean.slice(3,6)}-${clean.slice(6)}`;
                if (pf === 'intl' && clean.length >= 10) return `+${clean.slice(0,2)} ${clean.slice(2,5)} ${clean.slice(5,8)} ${clean.slice(8)}`;
                return str;
            }
            case 'ssn': {
                const clean = str.replace(/\D/g, ''); if (clean.length !== 9) return str; return (rest.mask !== false) ? `***-**-${clean.slice(-4)}` : `${clean.slice(0,3)}-${clean.slice(3,5)}-${clean.slice(5)}`;
            }
            case 'creditcard': {
                const clean = str.replace(/\D/g, ''); if (clean.length < 12) return str; return (rest.mask !== false) ? `****-****-****-${clean.slice(-4)}` : clean.match(/.{1,4}/g)?.join('-') || str;
            }
            default:
                console.warn(`FormatX: Unknown '${type}'`); return fallback();
        }
    };

    // Helpers (ultra-concise)
    const findBestDenominator = (dec, tol = 0.01, max = 64) => { for (let d = 2; d <= max; d *= 2) { const nr = Math.round(dec * d); if (Math.abs(dec - nr/d) < tol) return d; } return 100; };
    const formatCustomDate = (d, pat) => { const r = {YYYY:d.getFullYear(),YY:d.getFullYear().toString().slice(-2),MM:(d.getMonth()+1).toString().padStart(2,'0'),M:d.getMonth()+1,DD:d.getDate().toString().padStart(2,'0'),D:d.getDate(),HH:d.getHours().toString().padStart(2,'0'),H:d.getHours(),mm:d.getMinutes().toString().padStart(2,'0'),m:d.getMinutes(),ss:d.getSeconds().toString().padStart(2,'0'),s:d.getSeconds()}; let res = pat; for (let [k,v] of Object.entries(r)) res = res.replace(new RegExp(k,'g'), ''+v); return res; };

    // DOM funcs (inlined helpers)
    const formatElement = (el, pref = 'fx-') => {
        const typ = el.getAttribute(`${pref}format`); if (!typ) return;
        let raw = el.getAttribute(`${pref}raw`) || el.getAttribute(`${pref}value`) || el.textContent?.trim() || el.value || '';
        const opts = {}; for (let a of el.attributes) { if (a.name.startsWith(pref) && a.name !== `${pref}format`) { let n = a.name.slice(pref.length); opts[kebabToCamel(n)] = safeJsonParse(a.value); } }
        const fmt = format(typ, raw, opts);
        if (['INPUT','TEXTAREA'].includes(el.tagName)) { el.value = fmt; } else { el.textContent = fmt; }
        el.setAttribute(`${pref}raw`, raw);
    };
    const unformatElement = (el, pref = 'fx-') => {
        const raw = el.getAttribute(`${pref}raw`);
        if (!raw) return null;
        if (['INPUT','TEXTAREA'].includes(el.tagName)) { el.value = raw; } else { el.textContent = raw; }
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
                            if (n.matches?.(`[${pref}format]`)) formatElement(n,pref);
                            if (n.querySelectorAll?.(`[${pref}format]`).length) scan = true;
                        }
                    });
                }
                if (m.type === 'attributes' && m.attributeName?.startsWith(pref)) formatElement(m.target,pref);
            });
            if (scan) { clearTimeout(to); to = setTimeout(() => scanElements(document,pref), 0); }
        };
        return {
            start: () => { if (obsMut && !obs) { obs = new MutationObserver(cb); obs.observe(document.body, {childList:true,subtree:true,attributes:true}); } },
            stop: () => { obs?.disconnect(); obs = null; clearTimeout(to); }
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
        const ready = () => { scanElements(document, pref); o.start(); };
        if (auto) {
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready);
            else ready();
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
    if (typeof module !== 'undefined' && module.exports) module.exports = { initFormatX, format };
})();