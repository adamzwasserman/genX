/**
 * UIX - Universal UI Component Library for genX
 * @version 1.0.0
 *
 * Provides 52 UI components through declarative HTML attributes.
 * Uses CSS Custom Properties for easy theming.
 *
 * Usage:
 *   <button ux-enhance="button" ux-variant="primary">Click me</button>
 *   <div ux-enhance="modal" ux-close-on-escape="true">...</div>
 */
(function() {
    'use strict';

    // ============================================
    // UTILITIES
    // ============================================

    const genxGenerateId = window.genxCommon?.utils?.generateId;
    const generateId = (prefix = 'ux') => genxGenerateId
        ? genxGenerateId(prefix)
        : `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const safeJsonParse = v => { try { return JSON.parse(v); } catch { return v; } };

    // Color utilities
    const colorVariantMap = {
        'primary': 'var(--ux-primary-500)',
        'success': 'var(--ux-success-500)',
        'danger': 'var(--ux-danger-500)',
        'warning': 'var(--ux-warning-500)',
        'info': 'var(--ux-info-500)',
        'neutral': 'var(--ux-neutral-500)'
    };

    const resolveColor = (value) => {
        if (!value) return null;
        return colorVariantMap[value] || value;
    };

    const getContrastColor = (bgColor) => {
        // Create temp element to get computed RGB
        const temp = document.createElement('div');
        temp.style.color = bgColor;
        temp.style.display = 'none';
        document.body.appendChild(temp);
        const rgb = getComputedStyle(temp).color;
        document.body.removeChild(temp);

        // Parse rgb(r, g, b) or rgba(r, g, b, a)
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return '#000000';
        const [r, g, b] = match.map(Number);

        // Calculate luminance (WCAG formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5 ? '#000000' : '#ffffff';
    };

    const applyColorStyles = (el, opts) => {
        if (opts.bg) {
            const bgColor = resolveColor(opts.bg);
            el.style.setProperty('--ux-component-bg', bgColor);
            el.style.backgroundColor = `var(--ux-component-bg)`;
            // Auto-calculate contrast if color not specified
            if (!opts.color) {
                const textColor = getContrastColor(bgColor);
                el.style.setProperty('--ux-component-color', textColor);
                el.style.color = `var(--ux-component-color)`;
            }
        }
        if (opts.color) {
            const textColor = resolveColor(opts.color);
            el.style.setProperty('--ux-component-color', textColor);
            el.style.color = `var(--ux-component-color)`;
            // For spinner, also set the spin color
            if (el.classList.contains('ux-spinner')) {
                el.style.borderTopColor = textColor;
            }
        }
    };

    // Instance tracking
    const instanceMap = new WeakMap();

    const trackInstance = (el, data) => {
        const existing = instanceMap.get(el) || {};
        instanceMap.set(el, { ...existing, ...data });
    };

    const getInstance = (el) => instanceMap.get(el);

    const destroyInstance = (el) => {
        const data = instanceMap.get(el);
        if (data) {
            if (data.cleanup) data.cleanup();
            if (data.observer) data.observer.disconnect();
            instanceMap.delete(el);
        }
        el.removeAttribute('ux-enhanced');
    };

    // Event manager for cleanup
    const createEventManager = () => ({
        _listeners: [],
        on(target, event, handler, options) {
            target.addEventListener(event, handler, options);
            this._listeners.push({ target, event, handler, options });
            return () => {
                target.removeEventListener(event, handler, options);
                const idx = this._listeners.findIndex(l =>
                    l.target === target && l.event === event && l.handler === handler
                );
                if (idx > -1) this._listeners.splice(idx, 1);
            };
        },
        destroy() {
            this._listeners.forEach(({ target, event, handler, options }) => {
                target.removeEventListener(event, handler, options);
            });
            this._listeners = [];
        }
    });

    // Focus utilities
    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
    ].join(', ');

    const getFocusableElements = (container) =>
        Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

    const createFocusTrap = (container, options = {}) => {
        let previouslyFocused = null;
        let isActive = false;
        const events = createEventManager();

        const handleKeydown = (e) => {
            if (e.key === 'Tab') {
                const focusable = getFocusableElements(container);
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }

            if (e.key === 'Escape' && options.escapeDeactivates !== false) {
                if (options.onEscape) options.onEscape();
            }
        };

        return {
            activate() {
                if (isActive) return;
                isActive = true;
                previouslyFocused = document.activeElement;
                events.on(container, 'keydown', handleKeydown);

                const focusable = getFocusableElements(container);
                const initialFocus = options.initialFocus || focusable[0];
                if (initialFocus) {
                    requestAnimationFrame(() => initialFocus.focus());
                }
            },
            deactivate() {
                if (!isActive) return;
                isActive = false;
                events.destroy();
                if (options.returnFocus !== false && previouslyFocused) {
                    previouslyFocused.focus();
                }
            },
            get isActive() { return isActive; }
        };
    };

    // ============================================
    // CSS INJECTION
    // ============================================

    const injectStyles = () => {
        if (document.getElementById('uix-styles')) return;

        const style = document.createElement('style');
        style.id = 'uix-styles';
        style.textContent = `
/* ===================
   UIX DESIGN TOKENS
   =================== */
:root {
  /* Primary - Teal */
  --ux-primary-50: #f0fdfa;
  --ux-primary-100: #ccfbf1;
  --ux-primary-200: #99f6e4;
  --ux-primary-300: #5eead4;
  --ux-primary-400: #2dd4bf;
  --ux-primary-500: #14b8a6;
  --ux-primary-600: #0d9488;
  --ux-primary-700: #0f766e;
  --ux-primary-800: #115e59;
  --ux-primary-900: #134e4a;

  /* Neutral - Slate */
  --ux-neutral-0: #ffffff;
  --ux-neutral-50: #f8fafc;
  --ux-neutral-100: #f1f5f9;
  --ux-neutral-200: #e2e8f0;
  --ux-neutral-300: #cbd5e1;
  --ux-neutral-400: #94a3b8;
  --ux-neutral-500: #64748b;
  --ux-neutral-600: #475569;
  --ux-neutral-700: #334155;
  --ux-neutral-800: #1e293b;
  --ux-neutral-900: #0f172a;

  /* Semantic */
  --ux-success-500: #22c55e;
  --ux-success-600: #16a34a;
  --ux-warning-500: #f59e0b;
  --ux-warning-600: #d97706;
  --ux-danger-500: #ef4444;
  --ux-danger-600: #dc2626;
  --ux-info-500: #3b82f6;
  --ux-info-600: #2563eb;

  /* Spacing */
  --ux-space-1: 0.25rem;
  --ux-space-2: 0.5rem;
  --ux-space-3: 0.75rem;
  --ux-space-4: 1rem;
  --ux-space-6: 1.5rem;
  --ux-space-8: 2rem;

  /* Border Radius */
  --ux-radius-sm: 0.25rem;
  --ux-radius-md: 0.375rem;
  --ux-radius-lg: 0.5rem;
  --ux-radius-full: 9999px;

  /* Shadows */
  --ux-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ux-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --ux-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Transitions */
  --ux-transition-fast: 150ms ease;
  --ux-transition-normal: 200ms ease;

  /* Z-index */
  --ux-z-dropdown: 1000;
  --ux-z-modal: 1050;
  --ux-z-popover: 1060;
  --ux-z-tooltip: 1070;
  --ux-z-toast: 1080;
}

/* ===================
   BUTTON
   =================== */
.ux-btn {
  --ux-btn-bg: var(--ux-neutral-100);
  --ux-btn-color: var(--ux-neutral-700);
  --ux-btn-border: transparent;
  --ux-btn-hover-bg: var(--ux-neutral-200);
  --ux-btn-hover-color: var(--ux-neutral-800);
  --ux-btn-active-bg: var(--ux-neutral-300);
  --ux-btn-active-color: var(--ux-neutral-900);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ux-space-2);
  padding: var(--ux-space-2) var(--ux-space-4);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  border-radius: var(--ux-radius-md);
  border: 1px solid var(--ux-btn-border);
  background: var(--ux-btn-bg);
  color: var(--ux-btn-color);
  cursor: pointer;
  transition: all var(--ux-transition-fast);
  text-decoration: none;
}

.ux-btn:hover {
  background: var(--ux-btn-hover-bg);
  color: var(--ux-btn-hover-color);
}

.ux-btn:active {
  background: var(--ux-btn-active-bg);
  color: var(--ux-btn-active-color);
}

.ux-btn:focus-visible {
  outline: 2px solid var(--ux-primary-500);
  outline-offset: 2px;
}

.ux-btn--primary {
  --ux-btn-bg: var(--ux-primary-500);
  --ux-btn-color: white;
  --ux-btn-hover-bg: var(--ux-primary-600);
  --ux-btn-hover-color: white;
  --ux-btn-active-bg: var(--ux-primary-700);
  --ux-btn-active-color: white;
}

.ux-btn--secondary {
  --ux-btn-bg: var(--ux-neutral-100);
  --ux-btn-color: var(--ux-neutral-700);
  --ux-btn-border: var(--ux-neutral-300);
  --ux-btn-hover-bg: var(--ux-neutral-200);
  --ux-btn-active-bg: var(--ux-neutral-300);
}

.ux-btn--outline {
  --ux-btn-bg: transparent;
  --ux-btn-color: var(--ux-primary-600);
  --ux-btn-border: var(--ux-primary-500);
  --ux-btn-hover-bg: var(--ux-primary-50);
  --ux-btn-active-bg: var(--ux-primary-100);
}

.ux-btn--ghost {
  --ux-btn-bg: transparent;
  --ux-btn-color: var(--ux-neutral-600);
  --ux-btn-hover-bg: var(--ux-neutral-100);
  --ux-btn-active-bg: var(--ux-neutral-200);
}

.ux-btn--danger {
  --ux-btn-bg: var(--ux-danger-500);
  --ux-btn-color: white;
  --ux-btn-hover-bg: var(--ux-danger-600);
  --ux-btn-hover-color: white;
  --ux-btn-active-bg: var(--ux-danger-700);
  --ux-btn-active-color: white;
}

.ux-btn--sm { padding: var(--ux-space-1) var(--ux-space-3); font-size: 0.75rem; }
.ux-btn--lg { padding: var(--ux-space-3) var(--ux-space-6); font-size: 1rem; }

.ux-btn--block { width: 100%; }
.ux-btn--loading { opacity: 0.7; pointer-events: none; }
.ux-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===================
   BADGE
   =================== */
.ux-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--ux-space-1) var(--ux-space-2);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--ux-radius-sm);
  background: var(--ux-neutral-100);
  color: var(--ux-neutral-700);
}

.ux-badge--primary { background: var(--ux-primary-100); color: var(--ux-primary-700); }
.ux-badge--success { background: #dcfce7; color: #15803d; }
.ux-badge--warning { background: #fef3c7; color: #b45309; }
.ux-badge--danger { background: #fee2e2; color: #b91c1c; }
.ux-badge--info { background: #dbeafe; color: #1d4ed8; }
.ux-badge--pill { border-radius: var(--ux-radius-full); }
.ux-badge--sm { font-size: 0.625rem; padding: 0.125rem 0.375rem; }
.ux-badge--lg { font-size: 0.875rem; padding: 0.375rem 0.75rem; }

/* ===================
   AVATAR
   =================== */
.ux-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--ux-radius-full);
  background: var(--ux-primary-100);
  color: var(--ux-primary-700);
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
}

.ux-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ux-avatar--sm { width: 2rem; height: 2rem; font-size: 0.75rem; }
.ux-avatar--lg { width: 3rem; height: 3rem; font-size: 1rem; }
.ux-avatar--xl { width: 4rem; height: 4rem; font-size: 1.25rem; }
.ux-avatar--square { border-radius: var(--ux-radius-md); }

/* ===================
   SPINNER
   =================== */
.ux-spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--ux-neutral-200);
  border-top-color: var(--ux-primary-500);
  border-radius: 50%;
  animation: ux-spin 0.8s linear infinite;
}

.ux-spinner--sm { width: 1rem; height: 1rem; border-width: 1.5px; }
.ux-spinner--lg { width: 2rem; height: 2rem; border-width: 3px; }

@keyframes ux-spin {
  to { transform: rotate(360deg); }
}

/* ===================
   CARD
   =================== */
.ux-card {
  --ux-card-bg: var(--ux-neutral-0);
  --ux-card-border: var(--ux-neutral-200);
  --ux-card-header-bg: transparent;
  --ux-card-header-color: inherit;
  --ux-card-footer-bg: var(--ux-neutral-50);

  background: var(--ux-card-bg);
  border: 1px solid var(--ux-card-border);
  border-radius: var(--ux-radius-lg);
  overflow: hidden;
}

.ux-card--elevated {
  border: none;
  box-shadow: var(--ux-shadow-md);
}

.ux-card--hoverable {
  transition: box-shadow var(--ux-transition-fast), transform var(--ux-transition-fast);
}
.ux-card--hoverable:hover {
  box-shadow: var(--ux-shadow-lg);
  transform: translateY(-2px);
}

.ux-card__header,
.ux-card__body,
.ux-card__footer {
  padding: var(--ux-space-4);
}

.ux-card__header {
  border-bottom: 1px solid var(--ux-card-border);
  background: var(--ux-card-header-bg);
  color: var(--ux-card-header-color);
  font-weight: 600;
}

.ux-card__title {
  margin: 0;
  font-size: 1.125rem;
}

.ux-card__footer {
  border-top: 1px solid var(--ux-card-border);
  background: var(--ux-card-footer-bg);
}

/* ===================
   ALERT
   =================== */
.ux-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--ux-space-3);
  padding: var(--ux-space-4);
  border-radius: var(--ux-radius-md);
  background: var(--ux-neutral-100);
  color: var(--ux-neutral-700);
}

.ux-alert--success { background: #dcfce7; color: #15803d; }
.ux-alert--warning { background: #fef3c7; color: #b45309; }
.ux-alert--danger { background: #fee2e2; color: #b91c1c; }
.ux-alert--info { background: #dbeafe; color: #1d4ed8; }

.ux-alert__dismiss {
  margin-left: auto;
  padding: 4px 6px;
  background: transparent;
  border: none;
  border-radius: var(--ux-radius-sm);
  cursor: pointer;
  color: currentColor;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  transition: color var(--ux-transition-fast), background var(--ux-transition-fast);
}
.ux-alert__dismiss:hover {
  color: white;
  background: rgba(0, 0, 0, 0.15);
}

/* ===================
   MODAL
   =================== */
.ux-modal {
  --ux-modal-backdrop: rgba(0, 0, 0, 0.5);
  --ux-modal-bg: var(--ux-neutral-0);
  --ux-modal-header-bg: transparent;
  --ux-modal-header-color: inherit;
  --ux-modal-border: var(--ux-neutral-200);

  position: fixed;
  inset: 0;
  z-index: var(--ux-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ux-space-4);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--ux-transition-normal), visibility var(--ux-transition-normal);
}

.ux-modal.is-open {
  opacity: 1;
  visibility: visible;
}

.ux-modal__backdrop {
  position: absolute;
  inset: 0;
  background: var(--ux-modal-backdrop);
}

.ux-modal__content {
  position: relative;
  background: var(--ux-modal-bg);
  border-radius: var(--ux-radius-lg);
  box-shadow: var(--ux-shadow-lg);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  transform: scale(0.95);
  transition: transform var(--ux-transition-normal);
}

.ux-modal.is-open .ux-modal__content {
  transform: scale(1);
}

.ux-modal__header,
.ux-modal__body,
.ux-modal__footer {
  padding: var(--ux-space-4);
}

.ux-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ux-modal-border);
  background: var(--ux-modal-header-bg);
  color: var(--ux-modal-header-color);
}

.ux-modal__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.ux-modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--ux-transition-fast);
}
.ux-modal__close:hover { opacity: 1; }

.ux-modal__footer {
  border-top: 1px solid var(--ux-modal-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--ux-space-2);
}

.ux-modal--sm .ux-modal__content { max-width: 24rem; }
.ux-modal--lg .ux-modal__content { max-width: 48rem; }
.ux-modal--xl .ux-modal__content { max-width: 64rem; }
.ux-modal--full .ux-modal__content { max-width: 100%; margin: var(--ux-space-4); }

/* ===================
   ACCORDION
   =================== */
.ux-accordion {
  --ux-accordion-border: var(--ux-neutral-200);
  --ux-accordion-bg: transparent;
  --ux-accordion-header-bg: transparent;
  --ux-accordion-header-color: inherit;
  --ux-accordion-header-hover-bg: var(--ux-neutral-50);
  --ux-accordion-content-bg: transparent;
  --ux-accordion-active-bg: transparent;
  --ux-accordion-active-color: var(--ux-primary-600);

  border: 1px solid var(--ux-accordion-border);
  border-radius: var(--ux-radius-md);
  overflow: hidden;
  background: var(--ux-accordion-bg);
}

.ux-accordion__item {
  border-bottom: 1px solid var(--ux-accordion-border);
}
.ux-accordion__item:last-child { border-bottom: none; }

.ux-accordion__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--ux-space-4);
  background: var(--ux-accordion-header-bg);
  color: var(--ux-accordion-header-color);
  border: none;
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background var(--ux-transition-fast), color var(--ux-transition-fast);
}
.ux-accordion__header:hover { background: var(--ux-accordion-header-hover-bg); }
.ux-accordion__item.is-open .ux-accordion__header {
  background: var(--ux-accordion-active-bg);
  color: var(--ux-accordion-active-color);
}

.ux-accordion__icon {
  transition: transform var(--ux-transition-fast);
}

.ux-accordion__item.is-open .ux-accordion__icon {
  transform: rotate(180deg);
}

.ux-accordion__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--ux-transition-normal);
}

.ux-accordion__item.is-open .ux-accordion__content {
  max-height: 500px;
}

.ux-accordion__body {
  padding: var(--ux-space-4);
  padding-top: 0;
}

/* ===================
   TABS
   =================== */
.ux-tabs {
  --ux-tabs-bg: transparent;
  --ux-tabs-color: var(--ux-neutral-600);
  --ux-tabs-hover-bg: var(--ux-neutral-100);
  --ux-tabs-hover-color: var(--ux-primary-600);
  --ux-tabs-active-bg: transparent;
  --ux-tabs-active-color: var(--ux-primary-600);
  --ux-tabs-border-color: var(--ux-primary-500);
}

.ux-tabs__list {
  display: flex;
  border-bottom: 1px solid var(--ux-neutral-200);
  gap: var(--ux-space-1);
}

.ux-tabs__tab {
  padding: var(--ux-space-2) var(--ux-space-4);
  background: var(--ux-tabs-bg);
  color: var(--ux-tabs-color);
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all var(--ux-transition-fast);
}

.ux-tabs__tab:hover {
  background: var(--ux-tabs-hover-bg);
  color: var(--ux-tabs-hover-color);
}

.ux-tabs__tab[aria-selected="true"] {
  background: var(--ux-tabs-active-bg);
  color: var(--ux-tabs-active-color);
  border-bottom-color: var(--ux-tabs-border-color);
}

.ux-tabs__panel {
  padding: var(--ux-space-4);
}

.ux-tabs__panel[hidden] { display: none; }

/* ===================
   DROPDOWN
   =================== */
.ux-dropdown {
  --ux-dropdown-bg: var(--ux-neutral-0);
  --ux-dropdown-color: inherit;
  --ux-dropdown-border: var(--ux-neutral-200);
  --ux-dropdown-hover-bg: var(--ux-neutral-100);
  --ux-dropdown-hover-color: inherit;
  --ux-dropdown-active-bg: var(--ux-primary-100);
  --ux-dropdown-active-color: var(--ux-primary-700);

  position: relative;
  display: inline-block;
}

.ux-dropdown__menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: var(--ux-z-dropdown);
  min-width: 10rem;
  padding: var(--ux-space-1) 0;
  margin-top: 4px;
  background: var(--ux-dropdown-bg);
  color: var(--ux-dropdown-color);
  border: 1px solid var(--ux-dropdown-border);
  border-radius: var(--ux-radius-md);
  box-shadow: var(--ux-shadow-md);
}

.ux-dropdown.is-open .ux-dropdown__menu {
  display: block;
}

.ux-dropdown__item {
  display: block;
  width: 100%;
  padding: var(--ux-space-2) var(--ux-space-4);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--ux-neutral-700);
  font-size: inherit;
  transition: background var(--ux-transition-fast), color var(--ux-transition-fast);
}
.ux-dropdown__item:hover {
  background: var(--ux-dropdown-hover-bg);
  color: var(--ux-dropdown-hover-color);
}
.ux-dropdown__item[aria-selected="true"],
.ux-dropdown__item.is-active {
  background: var(--ux-dropdown-active-bg);
  color: var(--ux-dropdown-active-color);
}

/* ===================
   TOOLTIP
   =================== */
.ux-tooltip {
  --ux-tooltip-bg: var(--ux-neutral-800);
  --ux-tooltip-color: white;
  position: relative;
}

.ux-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  padding: var(--ux-space-1) var(--ux-space-2);
  background: var(--ux-tooltip-bg);
  color: var(--ux-tooltip-color);
  font-size: 0.75rem;
  border-radius: var(--ux-radius-sm);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all var(--ux-transition-fast);
  z-index: var(--ux-z-tooltip);
}

.ux-tooltip:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-4px);
}

.ux-tooltip--sm::after { font-size: 0.625rem; padding: 2px 6px; }
.ux-tooltip--lg::after { font-size: 0.875rem; padding: var(--ux-space-2) var(--ux-space-3); }

/* ===================
   PROGRESS
   =================== */
.ux-progress {
  height: 0.5rem;
  background: var(--ux-neutral-200);
  border-radius: var(--ux-radius-full);
  overflow: hidden;
}

.ux-progress__bar {
  height: 100%;
  background: var(--ux-primary-500);
  border-radius: var(--ux-radius-full);
  transition: width var(--ux-transition-normal);
}

.ux-progress--sm { height: 0.25rem; }
.ux-progress--lg { height: 0.75rem; }

/* ===================
   SKELETON
   =================== */
.ux-skeleton {
  background: linear-gradient(90deg, var(--ux-neutral-200) 25%, var(--ux-neutral-100) 50%, var(--ux-neutral-200) 75%);
  background-size: 200% 100%;
  animation: ux-shimmer 1.5s infinite;
  border-radius: var(--ux-radius-sm);
}

.ux-skeleton--text { height: 1rem; width: 100%; }
.ux-skeleton--circle { border-radius: 50%; }
.ux-skeleton--rect { border-radius: var(--ux-radius-md); }

@keyframes ux-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===================
   FORM ELEMENTS
   =================== */
.ux-input,
.ux-textarea,
.ux-select {
  --ux-input-bg: var(--ux-neutral-0);
  --ux-input-color: inherit;
  --ux-input-border: var(--ux-neutral-300);
  --ux-input-focus-border: var(--ux-primary-500);
  --ux-input-focus-ring: var(--ux-primary-100);
  --ux-input-placeholder: var(--ux-neutral-400);

  display: block;
  width: 100%;
  padding: var(--ux-space-2) var(--ux-space-3);
  font-size: 0.875rem;
  border: 1px solid var(--ux-input-border);
  border-radius: var(--ux-radius-md);
  background: var(--ux-input-bg);
  color: var(--ux-input-color);
  transition: border-color var(--ux-transition-fast), box-shadow var(--ux-transition-fast);
}

.ux-input::placeholder,
.ux-textarea::placeholder {
  color: var(--ux-input-placeholder);
}

.ux-input:focus,
.ux-textarea:focus,
.ux-select:focus {
  outline: none;
  border-color: var(--ux-input-focus-border);
  box-shadow: 0 0 0 3px var(--ux-input-focus-ring);
}

.ux-input--error,
.ux-textarea--error,
.ux-select--error {
  --ux-input-border: var(--ux-danger-500);
  --ux-input-focus-border: var(--ux-danger-500);
  --ux-input-focus-ring: #fee2e2;
}

.ux-input--success,
.ux-textarea--success,
.ux-select--success {
  --ux-input-border: var(--ux-success-500);
  --ux-input-focus-border: var(--ux-success-500);
  --ux-input-focus-ring: #dcfce7;
}

.ux-input--sm, .ux-textarea--sm, .ux-select--sm { padding: 0.375rem 0.5rem; font-size: 0.75rem; }
.ux-input--lg, .ux-textarea--lg, .ux-select--lg { padding: 0.75rem 1rem; font-size: 1rem; }

.ux-checkbox,
.ux-radio {
  --ux-check-color: var(--ux-primary-500);
  --ux-check-border: var(--ux-neutral-300);

  display: inline-flex;
  align-items: center;
  gap: var(--ux-space-2);
  cursor: pointer;
}

.ux-checkbox input,
.ux-radio input {
  accent-color: var(--ux-check-color);
}

.ux-checkbox--sm, .ux-radio--sm { font-size: 0.75rem; gap: var(--ux-space-1); }
.ux-checkbox--lg, .ux-radio--lg { font-size: 1rem; gap: var(--ux-space-3); }

.ux-switch {
  --ux-switch-off-bg: var(--ux-neutral-300);
  --ux-switch-on-bg: var(--ux-primary-500);
  --ux-switch-knob: white;

  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--ux-space-2);
  cursor: pointer;
}

.ux-switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ux-switch__track {
  position: relative;
  width: 2.5rem;
  height: 1.5rem;
  background: var(--ux-switch-off-bg);
  border-radius: var(--ux-radius-full);
  transition: background var(--ux-transition-fast);
}

.ux-switch__track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--ux-switch-knob);
  border-radius: 50%;
  transition: transform var(--ux-transition-fast);
}

.ux-switch[aria-checked="true"] .ux-switch__track {
  background: var(--ux-switch-on-bg);
}

.ux-switch[aria-checked="true"] .ux-switch__track::after {
  transform: translateX(1rem);
}

.ux-switch--sm .ux-switch__track { width: 2rem; height: 1.25rem; }
.ux-switch--sm .ux-switch__track::after { width: 1rem; height: 1rem; }
.ux-switch--sm[aria-checked="true"] .ux-switch__track::after { transform: translateX(0.75rem); }

.ux-switch--lg .ux-switch__track { width: 3rem; height: 1.75rem; }
.ux-switch--lg .ux-switch__track::after { width: 1.5rem; height: 1.5rem; }
.ux-switch--lg[aria-checked="true"] .ux-switch__track::after { transform: translateX(1.25rem); }

/* ===================
   DRAWER
   =================== */
.ux-drawer {
  position: fixed;
  z-index: var(--ux-z-modal);
  background: var(--ux-neutral-0);
  box-shadow: var(--ux-shadow-lg);
  transition: transform var(--ux-transition-normal);
}

.ux-drawer--left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 20rem;
  transform: translateX(-100%);
}

.ux-drawer--right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 20rem;
  transform: translateX(100%);
}

.ux-drawer--top {
  top: 0;
  left: 0;
  right: 0;
  height: 20rem;
  transform: translateY(-100%);
}

.ux-drawer--bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 20rem;
  transform: translateY(100%);
}

.ux-drawer.is-open { transform: translate(0); }

.ux-drawer--sm.ux-drawer--left, .ux-drawer--sm.ux-drawer--right { width: 16rem; }
.ux-drawer--lg.ux-drawer--left, .ux-drawer--lg.ux-drawer--right { width: 28rem; }
.ux-drawer--sm.ux-drawer--top, .ux-drawer--sm.ux-drawer--bottom { height: 12rem; }
.ux-drawer--lg.ux-drawer--top, .ux-drawer--lg.ux-drawer--bottom { height: 28rem; }

.ux-drawer__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all var(--ux-transition-normal);
}

.ux-drawer.is-open + .ux-drawer__backdrop,
.ux-drawer__backdrop.is-open {
  opacity: 1;
  visibility: visible;
}

/* ===================
   TOAST
   =================== */
.ux-toast-container {
  position: fixed;
  bottom: var(--ux-space-4);
  right: var(--ux-space-4);
  z-index: var(--ux-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--ux-space-2);
}

.ux-toast {
  display: flex;
  align-items: center;
  gap: var(--ux-space-3);
  padding: var(--ux-space-3) var(--ux-space-4);
  background: var(--ux-neutral-800);
  color: white;
  border-radius: var(--ux-radius-md);
  box-shadow: var(--ux-shadow-lg);
  animation: ux-toast-in 0.3s ease;
}

.ux-toast--success { background: var(--ux-success-600); }
.ux-toast--warning { background: var(--ux-warning-600); }
.ux-toast--danger { background: var(--ux-danger-600); }
.ux-toast--info { background: var(--ux-info-600); }

@keyframes ux-toast-in {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

/* ===================
   MENU
   =================== */
.ux-menu {
  --ux-menu-bg: var(--ux-neutral-0);
  --ux-menu-color: inherit;
  --ux-menu-border: var(--ux-neutral-200);
  --ux-menu-hover-bg: var(--ux-neutral-100);
  --ux-menu-hover-color: inherit;
  --ux-menu-selected-bg: var(--ux-primary-100);
  --ux-menu-selected-color: var(--ux-primary-700);

  list-style: none;
  padding: var(--ux-space-1) 0;
  margin: 0;
  background: var(--ux-menu-bg);
  color: var(--ux-menu-color);
  border: 1px solid var(--ux-menu-border);
  border-radius: var(--ux-radius-md);
}

.ux-menu__item {
  padding: var(--ux-space-2) var(--ux-space-4);
  cursor: pointer;
}

.ux-menu__item:hover,
.ux-menu__item:focus {
  background: var(--ux-menu-hover-bg);
  color: var(--ux-menu-hover-color);
  outline: none;
}

.ux-menu__item[aria-selected="true"] {
  background: var(--ux-menu-selected-bg);
  color: var(--ux-menu-selected-color);
}

/* ===================
   BREADCRUMB
   =================== */
.ux-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--ux-space-2);
  font-size: 0.875rem;
}

.ux-breadcrumb__item {
  color: var(--ux-neutral-600);
  text-decoration: none;
}

.ux-breadcrumb__item:hover { color: var(--ux-primary-600); }
.ux-breadcrumb__item[aria-current="page"] { color: var(--ux-neutral-900); font-weight: 500; }

.ux-breadcrumb__separator {
  color: var(--ux-neutral-400);
}

/* ===================
   PAGINATION
   =================== */
.ux-pagination {
  display: flex;
  align-items: center;
  gap: var(--ux-space-1);
}

.ux-pagination__item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 var(--ux-space-2);
  border: 1px solid var(--ux-neutral-300);
  border-radius: var(--ux-radius-md);
  background: var(--ux-neutral-0);
  cursor: pointer;
  transition: all var(--ux-transition-fast);
}

.ux-pagination__item:hover { background: var(--ux-neutral-100); }
.ux-pagination__item[aria-current="page"] {
  background: var(--ux-primary-500);
  border-color: var(--ux-primary-500);
  color: white;
}

/* ===================
   POPOVER
   =================== */
.ux-popover {
  position: absolute;
  z-index: var(--ux-z-popover);
  padding: var(--ux-space-4);
  background: var(--ux-neutral-0);
  border: 1px solid var(--ux-neutral-200);
  border-radius: var(--ux-radius-md);
  box-shadow: var(--ux-shadow-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: all var(--ux-transition-fast);
}

.ux-popover.is-open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* ===================
   TABLE
   =================== */
.ux-table {
  width: 100%;
  border-collapse: collapse;
}

.ux-table th,
.ux-table td {
  padding: var(--ux-space-3) var(--ux-space-4);
  text-align: left;
  border-bottom: 1px solid var(--ux-neutral-200);
}

.ux-table th {
  font-weight: 600;
  background: var(--ux-neutral-50);
}

.ux-table--striped tr:nth-child(even) {
  background: var(--ux-neutral-50);
}

.ux-table--hoverable tr:hover {
  background: var(--ux-neutral-100);
}

/* ===================
   TAG
   =================== */
.ux-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--ux-space-1);
  padding: var(--ux-space-1) var(--ux-space-2);
  font-size: 0.75rem;
  border-radius: var(--ux-radius-sm);
  background: var(--ux-neutral-100);
  color: var(--ux-neutral-700);
}

.ux-tag__remove {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
}
.ux-tag__remove:hover { opacity: 1; }

.ux-tag--sm { font-size: 0.625rem; padding: 0.125rem 0.375rem; }
.ux-tag--lg { font-size: 0.875rem; padding: 0.375rem 0.75rem; }

/* ===================
   DIVIDER
   =================== */
.ux-divider {
  height: 1px;
  background: var(--ux-neutral-200);
  border: none;
  margin: var(--ux-space-4) 0;
}

.ux-divider--vertical {
  width: 1px;
  height: auto;
  margin: 0 var(--ux-space-4);
}

/* ===================
   NAV
   =================== */
.ux-nav {
  --ux-nav-bg: transparent;
  --ux-nav-color: var(--ux-neutral-600);
  --ux-nav-hover-bg: var(--ux-neutral-100);
  --ux-nav-hover-color: var(--ux-neutral-900);
  --ux-nav-active-bg: var(--ux-primary-100);
  --ux-nav-active-color: var(--ux-primary-700);

  display: flex;
  gap: var(--ux-space-1);
  background: var(--ux-nav-bg);
}

.ux-nav--vertical {
  flex-direction: column;
}

.ux-nav__item {
  padding: var(--ux-space-2) var(--ux-space-3);
  color: var(--ux-nav-color);
  text-decoration: none;
  border-radius: var(--ux-radius-md);
  transition: all var(--ux-transition-fast);
}

.ux-nav__item:hover {
  background: var(--ux-nav-hover-bg);
  color: var(--ux-nav-hover-color);
}

.ux-nav__item[aria-current="page"] {
  background: var(--ux-nav-active-bg);
  color: var(--ux-nav-active-color);
}

/* ===================
   SIDEBAR
   =================== */
.ux-sidebar {
  width: 16rem;
  background: var(--ux-neutral-0);
  border-right: 1px solid var(--ux-neutral-200);
  padding: var(--ux-space-4);
}

/* ===================
   STEPS/STEPPER
   =================== */
.ux-stepper {
  display: flex;
  align-items: center;
  gap: var(--ux-space-2);
}

.ux-stepper__step {
  display: flex;
  align-items: center;
  gap: var(--ux-space-2);
}

.ux-stepper__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ux-neutral-200);
  color: var(--ux-neutral-600);
  font-weight: 600;
}

.ux-stepper__step[data-status="complete"] .ux-stepper__indicator {
  background: var(--ux-primary-500);
  color: white;
}

.ux-stepper__step[data-status="current"] .ux-stepper__indicator {
  background: var(--ux-primary-100);
  color: var(--ux-primary-700);
  border: 2px solid var(--ux-primary-500);
}

.ux-stepper__connector {
  flex: 1;
  height: 2px;
  background: var(--ux-neutral-200);
}

/* ===================
   SR-ONLY
   =================== */
.ux-sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0,0,0,0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
`;
        document.head.appendChild(style);
    };

    // ============================================
    // COMPONENT ENHANCERS
    // ============================================

    const enhance = {
        // ATOMS
        button: (el, opts) => {
            el.classList.add('ux-btn');
            if (opts.variant) el.classList.add(`ux-btn--${opts.variant}`);
            if (opts.size) el.classList.add(`ux-btn--${opts.size}`);
            if (opts.block) el.classList.add('ux-btn--block');
            if (opts.loading) el.classList.add('ux-btn--loading');

            // Custom color support
            if (opts.bg) el.style.setProperty('--ux-btn-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-btn-color', resolveColor(opts.color));
            if (opts.hoverBg) el.style.setProperty('--ux-btn-hover-bg', resolveColor(opts.hoverBg));
            if (opts.hoverColor) el.style.setProperty('--ux-btn-hover-color', resolveColor(opts.hoverColor));
            if (opts.activeBg) el.style.setProperty('--ux-btn-active-bg', resolveColor(opts.activeBg));
            if (opts.activeColor) el.style.setProperty('--ux-btn-active-color', resolveColor(opts.activeColor));
            if (opts.borderColor) el.style.setProperty('--ux-btn-border', resolveColor(opts.borderColor));

            // Keyboard support for non-button elements
            if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
                if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
                if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
                const events = createEventManager();
                events.on(el, 'keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        el.click();
                    }
                });
                trackInstance(el, { events, type: 'button' });
            }
        },

        badge: (el, opts) => {
            el.classList.add('ux-badge');
            if (opts.variant) el.classList.add(`ux-badge--${opts.variant}`);
            if (opts.size) el.classList.add(`ux-badge--${opts.size}`);
            if (opts.pill) el.classList.add('ux-badge--pill');
            applyColorStyles(el, opts);
        },

        avatar: (el, opts) => {
            el.classList.add('ux-avatar');
            if (opts.size) el.classList.add(`ux-avatar--${opts.size}`);
            if (opts.square) el.classList.add('ux-avatar--square');
            if (opts.initials && !el.querySelector('img')) {
                el.textContent = opts.initials;
            }
            applyColorStyles(el, opts);
        },

        spinner: (el, opts) => {
            el.classList.add('ux-spinner');
            if (opts.size) el.classList.add(`ux-spinner--${opts.size}`);
            if (opts.color) {
                el.style.borderTopColor = resolveColor(opts.color);
            }
            if (opts.track) {
                el.style.borderColor = resolveColor(opts.track);
                el.style.borderTopColor = opts.color ? resolveColor(opts.color) : 'var(--ux-primary-500)';
            }
            el.setAttribute('role', 'status');
            el.setAttribute('aria-label', opts.label || 'Loading');
        },

        card: (el, opts) => {
            el.classList.add('ux-card');
            if (opts.elevated) el.classList.add('ux-card--elevated');
            if (opts.hoverable) el.classList.add('ux-card--hoverable');

            // Apply color customization
            const bgColor = resolveColor(opts.bg);
            const borderColor = resolveColor(opts.border);
            const headerBg = resolveColor(opts.headerBg);
            const headerColor = resolveColor(opts.headerColor);
            const footerBg = resolveColor(opts.footerBg);

            if (bgColor) el.style.setProperty('--ux-card-bg', bgColor);
            if (borderColor) el.style.setProperty('--ux-card-border', borderColor);
            if (headerBg) el.style.setProperty('--ux-card-header-bg', headerBg);
            if (headerColor) el.style.setProperty('--ux-card-header-color', headerColor);
            if (footerBg) el.style.setProperty('--ux-card-footer-bg', footerBg);

            // Auto-generate header with title
            if (opts.title && !el.querySelector('.ux-card__header')) {
                const header = document.createElement('div');
                header.className = 'ux-card__header';
                const title = document.createElement('h3');
                title.className = 'ux-card__title';
                title.textContent = opts.title;
                header.appendChild(title);

                // Wrap existing content in body if not already wrapped
                if (!el.querySelector('.ux-card__body')) {
                    const body = document.createElement('div');
                    body.className = 'ux-card__body';
                    while (el.firstChild) {
                        body.appendChild(el.firstChild);
                    }
                    el.appendChild(header);
                    el.appendChild(body);
                } else {
                    el.insertBefore(header, el.firstChild);
                }
            }
        },

        alert: (el, opts) => {
            el.classList.add('ux-alert');
            if (opts.variant) el.classList.add(`ux-alert--${opts.variant}`);
            el.setAttribute('role', 'alert');
            applyColorStyles(el, opts);

            if (opts.dismissible) {
                const dismiss = document.createElement('button');
                dismiss.className = 'ux-alert__dismiss';
                dismiss.innerHTML = '&times;';
                dismiss.setAttribute('aria-label', 'Dismiss');
                dismiss.onclick = () => el.remove();
                el.appendChild(dismiss);
            }
        },

        progress: (el, opts) => {
            el.classList.add('ux-progress');
            if (opts.size) el.classList.add(`ux-progress--${opts.size}`);

            const value = parseFloat(opts.value) || 0;
            const max = parseFloat(opts.max) || 100;
            const percent = (value / max) * 100;

            el.setAttribute('role', 'progressbar');
            el.setAttribute('aria-valuenow', value);
            el.setAttribute('aria-valuemin', '0');
            el.setAttribute('aria-valuemax', max);

            // Track color (bg applies to track)
            if (opts.bg) {
                el.style.backgroundColor = resolveColor(opts.bg);
            }

            let bar = el.querySelector('.ux-progress__bar');
            if (!bar) {
                bar = document.createElement('div');
                bar.className = 'ux-progress__bar';
                el.appendChild(bar);
            }
            bar.style.width = `${percent}%`;

            // Bar color (color applies to bar)
            if (opts.color) {
                bar.style.backgroundColor = resolveColor(opts.color);
            }
        },

        skeleton: (el, opts) => {
            el.classList.add('ux-skeleton');
            if (opts.shape === 'circle') el.classList.add('ux-skeleton--circle');
            else if (opts.shape === 'rect') el.classList.add('ux-skeleton--rect');
            else el.classList.add('ux-skeleton--text');
            el.setAttribute('aria-busy', 'true');
        },

        // FORM ELEMENTS
        input: (el, opts) => {
            el.classList.add('ux-input');
            if (opts.size) el.classList.add(`ux-input--${opts.size}`);
            if (opts.error || opts.invalid) {
                el.classList.add('ux-input--error');
                el.setAttribute('aria-invalid', 'true');
            }
            if (opts.success) {
                el.classList.add('ux-input--success');
            }
            // Custom colors
            if (opts.bg) el.style.setProperty('--ux-input-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-input-color', resolveColor(opts.color));
            if (opts.borderColor && !opts.error && !opts.invalid && !opts.success) {
                el.style.setProperty('--ux-input-border', resolveColor(opts.borderColor));
            }
            if (opts.focusColor) el.style.setProperty('--ux-input-focus-border', resolveColor(opts.focusColor));
            if (opts.focusRing) el.style.setProperty('--ux-input-focus-ring', resolveColor(opts.focusRing));
            // Error/success colors override custom borderColor
            if (opts.error || opts.invalid) {
                el.style.setProperty('--ux-input-border', 'var(--ux-danger-500)');
                el.style.setProperty('--ux-input-focus-ring', '#fee2e2');
            } else if (opts.success) {
                el.style.setProperty('--ux-input-border', 'var(--ux-success-500)');
                el.style.setProperty('--ux-input-focus-ring', '#dcfce7');
            }
        },

        textarea: (el, opts) => {
            el.classList.add('ux-textarea');
            if (opts.size) el.classList.add(`ux-textarea--${opts.size}`);
            if (opts.error || opts.invalid) {
                el.classList.add('ux-textarea--error');
                el.setAttribute('aria-invalid', 'true');
            }
            if (opts.success) {
                el.classList.add('ux-textarea--success');
            }
            // Custom colors
            if (opts.bg) el.style.setProperty('--ux-input-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-input-color', resolveColor(opts.color));
            if (opts.borderColor && !opts.error && !opts.invalid && !opts.success) {
                el.style.setProperty('--ux-input-border', resolveColor(opts.borderColor));
            }
            if (opts.focusColor) el.style.setProperty('--ux-input-focus-border', resolveColor(opts.focusColor));
            if (opts.focusRing) el.style.setProperty('--ux-input-focus-ring', resolveColor(opts.focusRing));
            // Error/success colors override custom borderColor
            if (opts.error || opts.invalid) {
                el.style.setProperty('--ux-input-border', 'var(--ux-danger-500)');
                el.style.setProperty('--ux-input-focus-ring', '#fee2e2');
            } else if (opts.success) {
                el.style.setProperty('--ux-input-border', 'var(--ux-success-500)');
                el.style.setProperty('--ux-input-focus-ring', '#dcfce7');
            }
        },

        select: (el, opts) => {
            el.classList.add('ux-select');
            if (opts.size) el.classList.add(`ux-select--${opts.size}`);
            if (opts.error || opts.invalid) {
                el.classList.add('ux-select--error');
                el.setAttribute('aria-invalid', 'true');
            }
            if (opts.success) {
                el.classList.add('ux-select--success');
            }
            // Custom colors
            if (opts.bg) el.style.setProperty('--ux-input-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-input-color', resolveColor(opts.color));
            if (opts.borderColor && !opts.error && !opts.invalid && !opts.success) {
                el.style.setProperty('--ux-input-border', resolveColor(opts.borderColor));
            }
            if (opts.focusColor) el.style.setProperty('--ux-input-focus-border', resolveColor(opts.focusColor));
            if (opts.focusRing) el.style.setProperty('--ux-input-focus-ring', resolveColor(opts.focusRing));
            // Error/success colors override custom borderColor
            if (opts.error || opts.invalid) {
                el.style.setProperty('--ux-input-border', 'var(--ux-danger-500)');
                el.style.setProperty('--ux-input-focus-ring', '#fee2e2');
            } else if (opts.success) {
                el.style.setProperty('--ux-input-border', 'var(--ux-success-500)');
                el.style.setProperty('--ux-input-focus-ring', '#dcfce7');
            }
        },

        checkbox: (el, opts) => {
            el.classList.add('ux-checkbox');
            if (opts.size) el.classList.add(`ux-checkbox--${opts.size}`);
            if (opts.color) el.style.setProperty('--ux-check-color', resolveColor(opts.color));

            // Add label if provided
            if (opts.label && !el.querySelector('.ux-checkbox__label')) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'ux-checkbox__label';
                labelSpan.textContent = opts.label;
                el.appendChild(labelSpan);
            }
        },

        radio: (el, opts) => {
            el.classList.add('ux-radio');
            if (opts.size) el.classList.add(`ux-radio--${opts.size}`);
            if (opts.color) el.style.setProperty('--ux-check-color', resolveColor(opts.color));

            // Add label if provided
            if (opts.label && !el.querySelector('.ux-radio__label')) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'ux-radio__label';
                labelSpan.textContent = opts.label;
                el.appendChild(labelSpan);
            }
        },

        switch: (el, opts) => {
            el.classList.add('ux-switch');
            if (opts.size) el.classList.add(`ux-switch--${opts.size}`);

            // Custom colors
            if (opts.offBg) el.style.setProperty('--ux-switch-off-bg', resolveColor(opts.offBg));
            if (opts.onBg) el.style.setProperty('--ux-switch-on-bg', resolveColor(opts.onBg));
            if (opts.knobColor) el.style.setProperty('--ux-switch-knob', resolveColor(opts.knobColor));

            // Find checkbox input inside label
            const checkbox = el.querySelector('input[type="checkbox"]');

            // Create track if not exists
            if (!el.querySelector('.ux-switch__track')) {
                const track = document.createElement('span');
                track.className = 'ux-switch__track';
                // Insert after checkbox if exists, else at start
                if (checkbox) {
                    checkbox.insertAdjacentElement('afterend', track);
                } else {
                    el.insertBefore(track, el.firstChild);
                }
            }

            el.setAttribute('role', 'switch');

            // Sync with checkbox if present
            const events = createEventManager();
            if (checkbox) {
                // Set initial state from checkbox
                el.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');

                // Listen for checkbox changes (triggered by native label click)
                events.on(checkbox, 'change', () => {
                    el.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
                    el.dispatchEvent(new CustomEvent('ux:change', { detail: { checked: checkbox.checked } }));
                });
            } else {
                // No checkbox - use standalone switch behavior
                el.setAttribute('tabindex', '0');
                el.setAttribute('aria-checked', opts.checked ? 'true' : 'false');
                if (opts.label) el.setAttribute('aria-label', opts.label);

                const toggle = () => {
                    const checked = el.getAttribute('aria-checked') === 'true';
                    el.setAttribute('aria-checked', !checked);
                    el.dispatchEvent(new CustomEvent('ux:change', { detail: { checked: !checked } }));
                };

                events.on(el, 'click', toggle);
                events.on(el, 'keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle();
                    }
                });
            }

            trackInstance(el, { events, type: 'switch' });
        },

        // MOLECULES
        modal: (el, opts) => {
            el.classList.add('ux-modal');
            if (opts.size) el.classList.add(`ux-modal--${opts.size}`);
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-modal', 'true');
            if (opts.label) el.setAttribute('aria-label', opts.label);

            // Custom colors
            if (opts.backdropColor) el.style.setProperty('--ux-modal-backdrop', resolveColor(opts.backdropColor));
            if (opts.bg) el.style.setProperty('--ux-modal-bg', resolveColor(opts.bg));
            if (opts.headerBg) el.style.setProperty('--ux-modal-header-bg', resolveColor(opts.headerBg));
            if (opts.headerColor) el.style.setProperty('--ux-modal-header-color', resolveColor(opts.headerColor));
            if (opts.borderColor) el.style.setProperty('--ux-modal-border', resolveColor(opts.borderColor));

            // Create backdrop if not exists
            if (!el.querySelector('.ux-modal__backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'ux-modal__backdrop';
                el.insertBefore(backdrop, el.firstChild);
            }

            // Auto-generate header with title if ux-title provided
            if (opts.title && !el.querySelector('.ux-modal__header')) {
                const content = el.querySelector('.ux-modal__content') || el;
                const header = document.createElement('div');
                header.className = 'ux-modal__header';

                const title = document.createElement('h2');
                title.className = 'ux-modal__title';
                title.textContent = opts.title;
                title.id = generateId();
                el.setAttribute('aria-labelledby', title.id);

                const closeBtn = document.createElement('button');
                closeBtn.className = 'ux-modal__close';
                closeBtn.innerHTML = '&times;';
                closeBtn.setAttribute('aria-label', 'Close');

                header.appendChild(title);
                header.appendChild(closeBtn);

                if (content !== el) {
                    content.insertBefore(header, content.firstChild);
                } else {
                    const backdrop = el.querySelector('.ux-modal__backdrop');
                    el.insertBefore(header, backdrop ? backdrop.nextSibling : el.firstChild);
                }
            }

            const events = createEventManager();
            const focusTrap = createFocusTrap(el, {
                returnFocus: true,
                onEscape: () => close()
            });

            const open = () => {
                el.classList.add('is-open');
                el.setAttribute('aria-hidden', 'false');
                focusTrap.activate();
                el.dispatchEvent(new CustomEvent('ux:open'));
            };

            const close = () => {
                el.classList.remove('is-open');
                el.setAttribute('aria-hidden', 'true');
                focusTrap.deactivate();
                el.dispatchEvent(new CustomEvent('ux:close'));
            };

            // Backdrop click
            if (opts.closeOnBackdrop !== false) {
                const backdrop = el.querySelector('.ux-modal__backdrop');
                if (backdrop) {
                    events.on(backdrop, 'click', close);
                }
            }

            // Close button(s)
            el.querySelectorAll('.ux-modal__close, [data-dismiss="modal"]').forEach(closeBtn => {
                events.on(closeBtn, 'click', close);
            });

            el.uxOpen = open;
            el.uxClose = close;
            el.uxToggle = () => el.classList.contains('is-open') ? close() : open();

            trackInstance(el, { events, focusTrap, type: 'modal', open, close });
        },

        accordion: (el, opts) => {
            el.classList.add('ux-accordion');
            const items = el.querySelectorAll('.ux-accordion__item, [data-accordion-item]');
            const events = createEventManager();

            // Custom colors
            if (opts.borderColor) el.style.setProperty('--ux-accordion-border', resolveColor(opts.borderColor));
            if (opts.bg) el.style.setProperty('--ux-accordion-bg', resolveColor(opts.bg));
            if (opts.headerBg) el.style.setProperty('--ux-accordion-header-bg', resolveColor(opts.headerBg));
            if (opts.headerColor) el.style.setProperty('--ux-accordion-header-color', resolveColor(opts.headerColor));
            if (opts.hoverBg) el.style.setProperty('--ux-accordion-header-hover-bg', resolveColor(opts.hoverBg));
            if (opts.activeBg) el.style.setProperty('--ux-accordion-active-bg', resolveColor(opts.activeBg));
            if (opts.activeColor) el.style.setProperty('--ux-accordion-active-color', resolveColor(opts.activeColor));

            const openItem = (index) => {
                const item = items[index];
                if (!item) return;
                const header = item.querySelector('.ux-accordion__header, [data-accordion-header]');

                if (opts.single) {
                    items.forEach((i, idx) => {
                        i.classList.remove('is-open');
                        const h = i.querySelector('.ux-accordion__header, [data-accordion-header]');
                        if (h) h.setAttribute('aria-expanded', 'false');
                    });
                }

                item.classList.add('is-open');
                if (header) header.setAttribute('aria-expanded', 'true');
                el.dispatchEvent(new CustomEvent('ux:change', { detail: { index, item, action: 'open' } }));
            };

            const closeItem = (index) => {
                const item = items[index];
                if (!item) return;
                const header = item.querySelector('.ux-accordion__header, [data-accordion-header]');

                item.classList.remove('is-open');
                if (header) header.setAttribute('aria-expanded', 'false');
                el.dispatchEvent(new CustomEvent('ux:change', { detail: { index, item, action: 'close' } }));
            };

            const toggleItem = (index) => {
                const item = items[index];
                if (!item) return;
                item.classList.contains('is-open') ? closeItem(index) : openItem(index);
            };

            items.forEach((item, index) => {
                const header = item.querySelector('.ux-accordion__header, [data-accordion-header]');
                const content = item.querySelector('.ux-accordion__content, [data-accordion-content]');
                if (!header || !content) return;

                const id = generateId();
                header.setAttribute('aria-controls', id);
                header.setAttribute('aria-expanded', item.classList.contains('is-open'));
                content.id = id;

                events.on(header, 'click', () => toggleItem(index));
            });

            // Expose API
            el.uxOpen = openItem;
            el.uxClose = closeItem;
            el.uxToggle = toggleItem;

            trackInstance(el, { events, type: 'accordion' });
        },

        tabs: (el, opts) => {
            el.classList.add('ux-tabs');
            const events = createEventManager();
            let tabNames = [];
            let tabs, panels, tabList;

            // Apply color customization via CSS custom properties
            if (opts.bg) el.style.setProperty('--ux-tabs-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-tabs-color', resolveColor(opts.color));
            if (opts.hoverBg) el.style.setProperty('--ux-tabs-hover-bg', resolveColor(opts.hoverBg));
            if (opts.hoverColor) el.style.setProperty('--ux-tabs-hover-color', resolveColor(opts.hoverColor));
            if (opts.activeBg) el.style.setProperty('--ux-tabs-active-bg', resolveColor(opts.activeBg));
            if (opts.activeColor) el.style.setProperty('--ux-tabs-active-color', resolveColor(opts.activeColor));
            if (opts.borderColor) el.style.setProperty('--ux-tabs-border-color', resolveColor(opts.borderColor));

            // Simplified syntax: ux-tabs="Home, Contacts, Sales"
            if (opts.tabs) {
                tabNames = opts.tabs.split(',').map(s => s.trim());
                const children = Array.from(el.children);

                // Create tab list
                tabList = document.createElement('div');
                tabList.className = 'ux-tabs__list';
                tabList.setAttribute('role', 'tablist');

                tabNames.forEach((name, i) => {
                    const btn = document.createElement('button');
                    btn.className = 'ux-tabs__tab';
                    btn.textContent = name;
                    btn.setAttribute('data-tab-name', name.toLowerCase().replace(/\s+/g, '-'));
                    tabList.appendChild(btn);
                });

                // Wrap existing children as panels
                const panelContainer = document.createElement('div');
                panelContainer.className = 'ux-tabs__panels';
                children.forEach((child, i) => {
                    child.classList.add('ux-tabs__panel');
                    if (tabNames[i]) {
                        child.setAttribute('data-panel-name', tabNames[i].toLowerCase().replace(/\s+/g, '-'));
                    }
                    panelContainer.appendChild(child);
                });

                el.innerHTML = '';
                el.appendChild(tabList);
                el.appendChild(panelContainer);

                tabs = el.querySelectorAll('.ux-tabs__tab');
                panels = el.querySelectorAll('.ux-tabs__panel');
            } else {
                // Traditional markup
                tabList = el.querySelector('.ux-tabs__list, [role="tablist"]');
                tabs = el.querySelectorAll('.ux-tabs__tab, [role="tab"]');
                panels = el.querySelectorAll('.ux-tabs__panel, [role="tabpanel"]');

                // Extract names from existing tabs
                tabs.forEach(tab => {
                    const name = tab.getAttribute('data-tab-name') || tab.textContent.trim();
                    tabNames.push(name.toLowerCase().replace(/\s+/g, '-'));
                });
            }

            if (tabList && !tabList.hasAttribute('role')) {
                tabList.setAttribute('role', 'tablist');
            }

            let activeIndex = 0;

            // Select tab by index or name
            const selectTab = (indexOrName, focus = true) => {
                let targetIndex;

                if (typeof indexOrName === 'number') {
                    targetIndex = indexOrName;
                } else {
                    // Find by name (case-insensitive)
                    const searchName = String(indexOrName).toLowerCase().replace(/\s+/g, '-');
                    targetIndex = tabNames.findIndex(n => n === searchName);
                    if (targetIndex === -1) {
                        // Try partial match
                        targetIndex = tabNames.findIndex(n => n.includes(searchName) || searchName.includes(n));
                    }
                }

                if (targetIndex < 0 || targetIndex >= tabs.length) return;

                tabs.forEach((t, i) => {
                    t.setAttribute('aria-selected', i === targetIndex);
                    t.setAttribute('tabindex', i === targetIndex ? '0' : '-1');
                    if (panels[i]) panels[i].hidden = i !== targetIndex;
                });

                activeIndex = targetIndex;
                if (focus) tabs[targetIndex].focus();

                el.dispatchEvent(new CustomEvent('ux:change', {
                    detail: {
                        index: targetIndex,
                        name: tabNames[targetIndex],
                        tab: tabs[targetIndex],
                        panel: panels[targetIndex]
                    }
                }));
            };

            // Get active tab info
            const getActive = () => ({
                index: activeIndex,
                name: tabNames[activeIndex],
                tab: tabs[activeIndex],
                panel: panels[activeIndex]
            });

            // Initialize tabs
            tabs.forEach((tab, index) => {
                const panel = panels[index];
                if (!panel) return;

                const tabId = tab.id || generateId();
                const panelId = panel.id || generateId();

                tab.id = tabId;
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-controls', panelId);
                tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
                tab.setAttribute('aria-selected', index === 0);

                panel.id = panelId;
                panel.setAttribute('role', 'tabpanel');
                panel.setAttribute('aria-labelledby', tabId);
                if (index !== 0) panel.hidden = true;

                events.on(tab, 'click', () => selectTab(index, true));

                events.on(tab, 'keydown', (e) => {
                    let newIndex = activeIndex;
                    if (e.key === 'ArrowRight') newIndex = (activeIndex + 1) % tabs.length;
                    if (e.key === 'ArrowLeft') newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
                    if (e.key === 'Home') newIndex = 0;
                    if (e.key === 'End') newIndex = tabs.length - 1;

                    if (newIndex !== activeIndex) {
                        e.preventDefault();
                        selectTab(newIndex, true);
                    }
                });
            });

            // Expose API on element
            el.uxSelect = (indexOrName) => selectTab(indexOrName, false);
            el.uxGetActive = getActive;

            trackInstance(el, { events, type: 'tabs', tabNames, selectTab, getActive });
        },

        dropdown: (el, opts) => {
            el.classList.add('ux-dropdown');

            // Custom colors
            if (opts.bg) el.style.setProperty('--ux-dropdown-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-dropdown-color', resolveColor(opts.color));
            if (opts.borderColor) el.style.setProperty('--ux-dropdown-border', resolveColor(opts.borderColor));
            if (opts.hoverBg) el.style.setProperty('--ux-dropdown-hover-bg', resolveColor(opts.hoverBg));
            if (opts.hoverColor) el.style.setProperty('--ux-dropdown-hover-color', resolveColor(opts.hoverColor));
            if (opts.activeBg) el.style.setProperty('--ux-dropdown-active-bg', resolveColor(opts.activeBg));
            if (opts.activeColor) el.style.setProperty('--ux-dropdown-active-color', resolveColor(opts.activeColor));

            const trigger = el.querySelector('.ux-dropdown__trigger, [data-dropdown-trigger]') || el.firstElementChild;
            const menu = el.querySelector('.ux-dropdown__menu, [data-dropdown-menu]');
            const events = createEventManager();

            if (!trigger || !menu) return;

            trigger.setAttribute('aria-haspopup', 'true');
            trigger.setAttribute('aria-expanded', 'false');

            const open = () => {
                el.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                el.dispatchEvent(new CustomEvent('ux:open'));
            };

            const close = () => {
                el.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
                el.dispatchEvent(new CustomEvent('ux:close'));
            };

            events.on(trigger, 'click', (e) => {
                e.stopPropagation();
                el.classList.contains('is-open') ? close() : open();
            });

            events.on(document, 'click', (e) => {
                if (!el.contains(e.target)) close();
            });

            events.on(el, 'keydown', (e) => {
                if (e.key === 'Escape') close();
            });

            el.uxOpen = open;
            el.uxClose = close;

            trackInstance(el, { events, type: 'dropdown' });
        },

        tooltip: (el, opts) => {
            el.classList.add('ux-tooltip');
            if (opts.size) el.classList.add(`ux-tooltip--${opts.size}`);

            const content = opts.content || el.getAttribute('title');
            if (content) {
                el.setAttribute('data-tooltip', content);
                el.removeAttribute('title');
            }

            // Apply color customization
            const bgColor = resolveColor(opts.bg);
            const textColor = resolveColor(opts.color);

            if (bgColor) el.style.setProperty('--ux-tooltip-bg', bgColor);
            if (textColor) {
                el.style.setProperty('--ux-tooltip-color', textColor);
            } else if (bgColor) {
                // Auto-contrast if only bg provided
                el.style.setProperty('--ux-tooltip-color', getContrastColor(bgColor));
            }
        },

        menu: (el, opts) => {
            el.classList.add('ux-menu');
            el.setAttribute('role', 'menu');

            // Custom colors
            if (opts.bg) el.style.setProperty('--ux-menu-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-menu-color', resolveColor(opts.color));
            if (opts.borderColor) el.style.setProperty('--ux-menu-border', resolveColor(opts.borderColor));
            if (opts.hoverBg) el.style.setProperty('--ux-menu-hover-bg', resolveColor(opts.hoverBg));
            if (opts.hoverColor) el.style.setProperty('--ux-menu-hover-color', resolveColor(opts.hoverColor));
            if (opts.selectedBg) el.style.setProperty('--ux-menu-selected-bg', resolveColor(opts.selectedBg));
            if (opts.selectedColor) el.style.setProperty('--ux-menu-selected-color', resolveColor(opts.selectedColor));

            const items = el.querySelectorAll('.ux-menu__item, [role="menuitem"]');
            const events = createEventManager();

            items.forEach((item, index) => {
                item.setAttribute('role', 'menuitem');
                item.setAttribute('tabindex', index === 0 ? '0' : '-1');
            });

            let currentIndex = 0;

            events.on(el, 'keydown', (e) => {
                const len = items.length;
                let newIndex = currentIndex;

                if (e.key === 'ArrowDown') newIndex = (currentIndex + 1) % len;
                if (e.key === 'ArrowUp') newIndex = (currentIndex - 1 + len) % len;
                if (e.key === 'Home') newIndex = 0;
                if (e.key === 'End') newIndex = len - 1;

                if (newIndex !== currentIndex) {
                    e.preventDefault();
                    items[currentIndex].setAttribute('tabindex', '-1');
                    items[newIndex].setAttribute('tabindex', '0');
                    items[newIndex].focus();
                    currentIndex = newIndex;
                }
            });

            trackInstance(el, { events, type: 'menu' });
        },

        breadcrumb: (el, opts) => {
            el.classList.add('ux-breadcrumb');
            el.setAttribute('aria-label', 'Breadcrumb');
            const items = el.querySelectorAll('.ux-breadcrumb__item');
            if (items.length) {
                items[items.length - 1].setAttribute('aria-current', 'page');
            }
        },

        pagination: (el, opts) => {
            el.classList.add('ux-pagination');
            el.setAttribute('role', 'navigation');
            el.setAttribute('aria-label', 'Pagination');
        },

        tag: (el, opts) => {
            el.classList.add('ux-tag');
            if (opts.variant) el.classList.add(`ux-tag--${opts.variant}`);
            if (opts.size) el.classList.add(`ux-tag--${opts.size}`);
            applyColorStyles(el, opts);
        },

        popover: (el, opts) => {
            el.classList.add('ux-popover');
            const events = createEventManager();

            const open = () => {
                el.classList.add('is-open');
                el.dispatchEvent(new CustomEvent('ux:open'));
            };

            const close = () => {
                el.classList.remove('is-open');
                el.dispatchEvent(new CustomEvent('ux:close'));
            };

            el.uxOpen = open;
            el.uxClose = close;

            trackInstance(el, { events, type: 'popover' });
        },

        drawer: (el, opts) => {
            el.classList.add('ux-drawer');
            const position = opts.position || 'left';
            el.classList.add(`ux-drawer--${position}`);
            if (opts.size) el.classList.add(`ux-drawer--${opts.size}`);

            const events = createEventManager();
            const focusTrap = createFocusTrap(el, {
                returnFocus: true,
                onEscape: () => close()
            });

            const open = () => {
                el.classList.add('is-open');
                focusTrap.activate();
                el.dispatchEvent(new CustomEvent('ux:open'));
            };

            const close = () => {
                el.classList.remove('is-open');
                focusTrap.deactivate();
                el.dispatchEvent(new CustomEvent('ux:close'));
            };

            el.uxOpen = open;
            el.uxClose = close;

            trackInstance(el, { events, focusTrap, type: 'drawer' });
        },

        table: (el, opts) => {
            el.classList.add('ux-table');
            if (opts.striped) el.classList.add('ux-table--striped');
            if (opts.hoverable) el.classList.add('ux-table--hoverable');
        },

        nav: (el, opts) => {
            el.classList.add('ux-nav');
            if (opts.vertical) el.classList.add('ux-nav--vertical');

            // Custom colors
            if (opts.bg) el.style.setProperty('--ux-nav-bg', resolveColor(opts.bg));
            if (opts.color) el.style.setProperty('--ux-nav-color', resolveColor(opts.color));
            if (opts.hoverBg) el.style.setProperty('--ux-nav-hover-bg', resolveColor(opts.hoverBg));
            if (opts.hoverColor) el.style.setProperty('--ux-nav-hover-color', resolveColor(opts.hoverColor));
            if (opts.activeBg) el.style.setProperty('--ux-nav-active-bg', resolveColor(opts.activeBg));
            if (opts.activeColor) el.style.setProperty('--ux-nav-active-color', resolveColor(opts.activeColor));
        },

        sidebar: (el, opts) => {
            el.classList.add('ux-sidebar');
        },

        stepper: (el, opts) => {
            el.classList.add('ux-stepper');
        },

        divider: (el, opts) => {
            el.classList.add('ux-divider');
            if (opts.vertical) el.classList.add('ux-divider--vertical');
            el.setAttribute('role', 'separator');
        }
    };

    // ============================================
    // TOAST API
    // ============================================

    let toastContainer = null;

    const toast = (message, options = {}) => {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'ux-toast-container';
            document.body.appendChild(toastContainer);
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'ux-toast';
        if (options.type) toastEl.classList.add(`ux-toast--${options.type}`);
        toastEl.textContent = message;
        toastEl.setAttribute('role', 'alert');

        toastContainer.appendChild(toastEl);

        const duration = options.duration || 3000;
        setTimeout(() => {
            toastEl.style.animation = 'ux-toast-in 0.3s ease reverse';
            setTimeout(() => toastEl.remove(), 300);
        }, duration);

        return toastEl;
    };

    // ============================================
    // DECLARATIVE TRIGGERS (No JS Required)
    // ============================================

    const setupDeclarativeTriggers = () => {
        // Handle ux-opens="selector" - opens modal/drawer
        // Handle ux-closes (or ux-closes="selector") - closes modal/drawer
        // Handle ux-toggles="selector" - toggles dropdown/accordion item
        // Handle ux-selects="selector" ux-tab="name" - selects tab

        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[ux-opens], [ux-closes], [ux-toggles], [ux-selects]');
            if (!trigger) return;

            // ux-opens="#modal-id"
            if (trigger.hasAttribute('ux-opens')) {
                e.preventDefault();
                const targetSelector = trigger.getAttribute('ux-opens');
                const target = document.querySelector(targetSelector);
                if (target?.uxOpen) {
                    target.uxOpen();
                } else if (target) {
                    target.classList.add('is-open');
                    target.setAttribute('aria-hidden', 'false');
                    target.dispatchEvent(new CustomEvent('ux:open'));
                }
            }

            // ux-closes or ux-closes="#modal-id"
            if (trigger.hasAttribute('ux-closes')) {
                e.preventDefault();
                const targetSelector = trigger.getAttribute('ux-closes');
                let target;

                if (targetSelector) {
                    target = document.querySelector(targetSelector);
                } else {
                    // Find nearest closeable parent (modal, drawer, dropdown)
                    target = trigger.closest('.ux-modal, .ux-drawer, .ux-dropdown, [ux-enhance="modal"], [ux-enhance="drawer"], [ux-enhance="dropdown"]');
                }

                if (target?.uxClose) {
                    target.uxClose();
                } else if (target) {
                    target.classList.remove('is-open');
                    target.setAttribute('aria-hidden', 'true');
                    target.dispatchEvent(new CustomEvent('ux:close'));
                }
            }

            // ux-toggles="#accordion" ux-index="0" or ux-toggles="#dropdown"
            if (trigger.hasAttribute('ux-toggles')) {
                e.preventDefault();
                const targetSelector = trigger.getAttribute('ux-toggles');
                const target = document.querySelector(targetSelector);
                const index = trigger.getAttribute('ux-index');

                if (target?.uxToggle) {
                    if (index !== null) {
                        target.uxToggle(parseInt(index, 10));
                    } else {
                        target.uxToggle();
                    }
                } else if (target) {
                    target.classList.toggle('is-open');
                    const isOpen = target.classList.contains('is-open');
                    target.dispatchEvent(new CustomEvent(isOpen ? 'ux:open' : 'ux:close'));
                }
            }

            // ux-selects="#tabs" ux-tab="Settings"
            if (trigger.hasAttribute('ux-selects')) {
                e.preventDefault();
                const targetSelector = trigger.getAttribute('ux-selects');
                const target = document.querySelector(targetSelector);
                const tabName = trigger.getAttribute('ux-tab');
                const tabIndex = trigger.getAttribute('ux-index');

                if (target?.uxSelect) {
                    if (tabName) {
                        target.uxSelect(tabName);
                    } else if (tabIndex !== null) {
                        target.uxSelect(parseInt(tabIndex, 10));
                    }
                }
            }
        });

        // Keyboard support for triggers (Enter/Space)
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;

            const trigger = e.target.closest('[ux-opens], [ux-closes], [ux-toggles], [ux-selects]');
            if (!trigger) return;

            // Don't interfere with actual buttons
            if (trigger.tagName === 'BUTTON' || trigger.tagName === 'A') return;

            e.preventDefault();
            trigger.click();
        });
    };

    // ============================================
    // DOM PROCESSING
    // ============================================

    const PREFIX = 'ux-';

    const processElement = (el) => {
        if (el.hasAttribute('ux-enhanced')) return;

        const enhanceType = el.getAttribute('ux-enhance');
        if (!enhanceType || !enhance[enhanceType]) return;

        // Parse options from attributes
        const opts = {};
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith(PREFIX) && attr.name !== 'ux-enhance' && attr.name !== 'ux-enhanced') {
                const key = kebabToCamel(attr.name.slice(PREFIX.length));
                opts[key] = safeJsonParse(attr.value);
            }
        });

        // Check for bootloader cached config
        if (window.genx && window.genx.getConfig) {
            const cached = window.genx.getConfig(el);
            if (cached) Object.assign(opts, cached);
        }

        // Run enhancer
        enhance[enhanceType](el, opts);
        el.setAttribute('ux-enhanced', 'true');
    };

    const scan = (root = document) => {
        root.querySelectorAll('[ux-enhance]').forEach(processElement);
    };

    const createObserver = (observeMutations) => {
        let observer = null;
        let unsub = null;

        const callback = (mutations) => {
            mutations.forEach(m => {
                if (m.type === 'childList') {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.matches?.('[ux-enhance]')) processElement(node);
                            node.querySelectorAll?.('[ux-enhance]').forEach(processElement);
                        }
                    });
                }
                if (m.type === 'attributes' && m.attributeName === 'ux-enhance') {
                    processElement(m.target);
                }
            });
        };

        return {
            start() {
                if (!observeMutations) return;
                if (window.domxBridge) {
                    unsub = window.domxBridge.subscribe('uix', callback, { attributeFilter: ['ux-'] });
                } else {
                    observer = new MutationObserver(callback);
                    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
                }
            },
            stop() {
                if (unsub) { unsub(); unsub = null; }
                if (observer) { observer.disconnect(); observer = null; }
            }
        };
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    const initUIX = (config = {}) => {
        const { prefix = 'ux-', autoScan = true, observe = true } = config;

        injectStyles();
        setupDeclarativeTriggers();
        const obs = createObserver(observe);

        const api = {
            enhance: (type, el, opts = {}) => enhance[type]?.(el, opts),
            processElement,
            scan,
            toast,
            getInstance,
            destroyInstance,
            destroy: () => obs.stop()
        };

        const ready = () => {
            if (autoScan) scan();
            obs.start();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', ready);
        } else {
            ready();
        }

        return api;
    };

    // Factory export for bootloader integration
    window.uxXFactory = {
        init: initUIX,
        enhance,
        toast
    };

    // Legacy global for standalone use
    if (!window.genx) {
        window.UIX = initUIX();
    }

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initUIX, enhance, toast };
    }
})();
