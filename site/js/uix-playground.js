/**
 * UIX Playground - Interactive component configurator
 *
 * Creates live-preview playgrounds for UIX components with:
 * - Configurable options via dropdowns/inputs
 * - Live preview that updates in real-time
 * - Copyable HTML code snippet
 *
 * Usage:
 *   <div data-playground="button" data-options='{"variants": [...], "sizes": [...]}'>
 *     <!-- Playground UI auto-generated -->
 *   </div>
 */
(function() {
    'use strict';

    // Component configurations
    const componentConfigs = {
        button: {
            name: 'Button',
            element: 'button',
            enhance: 'button',
            defaults: {
                text: 'Click me',
                variant: 'primary',
                size: ''
            },
            options: {
                variant: {
                    label: 'Variant',
                    type: 'select',
                    choices: [
                        { value: 'primary', label: 'Primary' },
                        { value: 'secondary', label: 'Secondary' },
                        { value: 'outline', label: 'Outline' },
                        { value: 'ghost', label: 'Ghost' },
                        { value: 'danger', label: 'Danger' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                text: {
                    label: 'Text',
                    type: 'text',
                    placeholder: 'Button text'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="button"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                return `<button ${attrs.join(' ')}>${escapeHtml(opts.text || 'Click me')}</button>`;
            }
        },

        badge: {
            name: 'Badge',
            element: 'span',
            enhance: 'badge',
            defaults: {
                text: 'Badge',
                variant: 'primary',
                size: '',
                pill: false
            },
            options: {
                variant: {
                    label: 'Variant',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'primary', label: 'Primary' },
                        { value: 'success', label: 'Success' },
                        { value: 'warning', label: 'Warning' },
                        { value: 'danger', label: 'Danger' },
                        { value: 'info', label: 'Info' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                pill: {
                    label: 'Pill style',
                    type: 'checkbox'
                },
                text: {
                    label: 'Text',
                    type: 'text',
                    placeholder: 'Badge text'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="badge"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.pill) attrs.push(`ux-pill="true"`);
                return `<span ${attrs.join(' ')}>${escapeHtml(opts.text || 'Badge')}</span>`;
            }
        },

        avatar: {
            name: 'Avatar',
            element: 'div',
            enhance: 'avatar',
            defaults: {
                initials: 'JD',
                size: '',
                square: false
            },
            options: {
                initials: {
                    label: 'Initials',
                    type: 'text',
                    placeholder: 'JD',
                    maxLength: 2
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                square: {
                    label: 'Square shape',
                    type: 'checkbox'
                }
            },
            render: (opts) => {
                const initials = (opts.initials || 'JD').toUpperCase().slice(0, 2);
                const attrs = [`ux-enhance="avatar"`, `ux-initials="${initials}"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.square) attrs.push(`ux-square="true"`);
                return `<div ${attrs.join(' ')}>${initials}</div>`;
            }
        },

        spinner: {
            name: 'Spinner',
            element: 'div',
            enhance: 'spinner',
            defaults: {
                size: ''
            },
            options: {
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="spinner"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                return `<div ${attrs.join(' ')}></div>`;
            }
        },

        alert: {
            name: 'Alert',
            element: 'div',
            enhance: 'alert',
            defaults: {
                text: 'This is an alert message.',
                variant: 'info',
                dismissible: false
            },
            options: {
                variant: {
                    label: 'Variant',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'success', label: 'Success' },
                        { value: 'warning', label: 'Warning' },
                        { value: 'danger', label: 'Danger' },
                        { value: 'info', label: 'Info' }
                    ]
                },
                dismissible: {
                    label: 'Dismissible',
                    type: 'checkbox'
                },
                text: {
                    label: 'Message',
                    type: 'text',
                    placeholder: 'Alert message'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="alert"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.dismissible) attrs.push(`ux-dismissible="true"`);
                return `<div ${attrs.join(' ')}>${escapeHtml(opts.text || 'Alert message')}</div>`;
            }
        },

        progress: {
            name: 'Progress',
            element: 'div',
            enhance: 'progress',
            defaults: {
                value: 50,
                size: ''
            },
            options: {
                value: {
                    label: 'Value (%)',
                    type: 'range',
                    min: 0,
                    max: 100
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="progress"`, `ux-value="${opts.value || 50}"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                return `<div ${attrs.join(' ')} style="width: 100%;"></div>`;
            }
        },

        switch: {
            name: 'Switch',
            element: 'label',
            enhance: 'switch',
            defaults: {
                checked: false,
                size: '',
                label: 'Toggle'
            },
            options: {
                checked: {
                    label: 'Checked',
                    type: 'checkbox'
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                label: {
                    label: 'Label',
                    type: 'text',
                    placeholder: 'Switch label'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="switch"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                const checked = opts.checked ? ' checked' : '';
                const label = opts.label ? ` ${escapeHtml(opts.label)}` : '';
                return `<label ${attrs.join(' ')}>\n  <input type="checkbox"${checked}>\n  <span class="ux-switch__track"></span>${label}\n</label>`;
            }
        }
    };

    // Utility functions
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function generateId(prefix = 'pg') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // Create a single playground instance
    function createPlayground(container, componentType) {
        const config = componentConfigs[componentType];
        if (!config) {
            console.warn(`Unknown component type: ${componentType}`);
            return;
        }

        // Initialize state with defaults
        const state = { ...config.defaults };
        const playgroundId = generateId('playground');

        // Build the UI
        container.innerHTML = '';
        container.classList.add('ux-playground');

        // Create layout: controls on left, preview + code on right
        const layout = document.createElement('div');
        layout.className = 'ux-playground__layout';

        // Controls panel
        const controlsPanel = document.createElement('div');
        controlsPanel.className = 'ux-playground__controls';

        const controlsTitle = document.createElement('h4');
        controlsTitle.className = 'ux-playground__title';
        controlsTitle.textContent = 'Options';
        controlsPanel.appendChild(controlsTitle);

        // Create controls for each option
        Object.entries(config.options).forEach(([key, opt]) => {
            const controlGroup = document.createElement('div');
            controlGroup.className = 'ux-playground__control';

            const label = document.createElement('label');
            label.textContent = opt.label;
            label.className = 'ux-playground__label';

            let input;

            if (opt.type === 'select') {
                input = document.createElement('select');
                input.className = 'ux-playground__select';
                opt.choices.forEach(choice => {
                    const option = document.createElement('option');
                    option.value = choice.value;
                    option.textContent = choice.label;
                    if (choice.value === state[key]) option.selected = true;
                    input.appendChild(option);
                });
                input.addEventListener('change', () => {
                    state[key] = input.value;
                    updatePreview();
                });
            } else if (opt.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'ux-playground__checkbox';
                input.checked = !!state[key];
                input.addEventListener('change', () => {
                    state[key] = input.checked;
                    updatePreview();
                });
            } else if (opt.type === 'range') {
                const rangeWrapper = document.createElement('div');
                rangeWrapper.className = 'ux-playground__range-wrapper';

                input = document.createElement('input');
                input.type = 'range';
                input.className = 'ux-playground__range';
                input.min = opt.min || 0;
                input.max = opt.max || 100;
                input.value = state[key] || 50;

                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'ux-playground__range-value';
                valueDisplay.textContent = input.value;

                input.addEventListener('input', () => {
                    state[key] = parseInt(input.value, 10);
                    valueDisplay.textContent = input.value;
                    updatePreview();
                });

                rangeWrapper.appendChild(input);
                rangeWrapper.appendChild(valueDisplay);
                input = rangeWrapper;
            } else {
                // text input
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'ux-playground__input';
                input.placeholder = opt.placeholder || '';
                input.value = state[key] || '';
                if (opt.maxLength) input.maxLength = opt.maxLength;
                input.addEventListener('input', () => {
                    state[key] = input.value;
                    updatePreview();
                });
            }

            const inputId = `${playgroundId}-${key}`;
            if (input.tagName) {
                input.id = inputId;
                label.htmlFor = inputId;
            }

            controlGroup.appendChild(label);
            controlGroup.appendChild(input);
            controlsPanel.appendChild(controlGroup);
        });

        // Preview panel
        const previewPanel = document.createElement('div');
        previewPanel.className = 'ux-playground__preview-panel';

        const previewTitle = document.createElement('h4');
        previewTitle.className = 'ux-playground__title';
        previewTitle.textContent = 'Preview';
        previewPanel.appendChild(previewTitle);

        const previewArea = document.createElement('div');
        previewArea.className = 'ux-playground__preview';
        previewPanel.appendChild(previewArea);

        // Code panel
        const codeTitle = document.createElement('h4');
        codeTitle.className = 'ux-playground__title ux-playground__title--code';
        codeTitle.textContent = 'Code';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'ux-playground__copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => {
            const code = codeArea.textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
            });
        });
        codeTitle.appendChild(copyBtn);
        previewPanel.appendChild(codeTitle);

        const codeArea = document.createElement('pre');
        codeArea.className = 'ux-playground__code';
        previewPanel.appendChild(codeArea);

        // Assemble layout
        layout.appendChild(controlsPanel);
        layout.appendChild(previewPanel);
        container.appendChild(layout);

        // Update function
        function updatePreview() {
            const html = config.render(state);

            // Update code display
            codeArea.textContent = html;

            // Update live preview
            previewArea.innerHTML = html;

            // Re-enhance the component if UIX is available
            const el = previewArea.firstElementChild;
            if (el && window.UIX?.processElement) {
                el.removeAttribute('ux-enhanced');
                window.UIX.processElement(el);
            } else if (el && window.uxXFactory?.enhance?.[componentType]) {
                el.removeAttribute('ux-enhanced');
                // Parse options from attributes
                const opts = {};
                Array.from(el.attributes).forEach(attr => {
                    if (attr.name.startsWith('ux-') && attr.name !== 'ux-enhance') {
                        const key = attr.name.slice(3).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                        try { opts[key] = JSON.parse(attr.value); } catch { opts[key] = attr.value; }
                    }
                });
                window.uxXFactory.enhance[componentType](el, opts);
                el.setAttribute('ux-enhanced', 'true');
            }
        }

        // Initial render
        updatePreview();

        return { state, updatePreview };
    }

    // Initialize all playgrounds on the page
    function initPlaygrounds(root = document) {
        root.querySelectorAll('[data-playground]').forEach(container => {
            const componentType = container.dataset.playground;
            createPlayground(container, componentType);
        });
    }

    // Inject playground styles
    function injectStyles() {
        if (document.getElementById('ux-playground-styles')) return;

        const style = document.createElement('style');
        style.id = 'ux-playground-styles';
        style.textContent = `
.ux-playground {
    border: 1px solid var(--ux-neutral-200, #e2e8f0);
    border-radius: 8px;
    overflow: hidden;
    background: var(--ux-neutral-0, #ffffff);
}

.ux-playground__layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 200px;
}

@media (max-width: 640px) {
    .ux-playground__layout {
        grid-template-columns: 1fr;
    }
}

.ux-playground__controls {
    padding: 16px;
    background: var(--ux-neutral-50, #f8fafc);
    border-right: 1px solid var(--ux-neutral-200, #e2e8f0);
}

.ux-playground__preview-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
}

.ux-playground__title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ux-neutral-500, #64748b);
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.ux-playground__title--code {
    margin-top: 16px;
}

.ux-playground__control {
    margin-bottom: 12px;
}

.ux-playground__label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--ux-neutral-700, #334155);
    margin-bottom: 4px;
}

.ux-playground__select,
.ux-playground__input {
    width: 100%;
    padding: 6px 10px;
    font-size: 0.875rem;
    border: 1px solid var(--ux-neutral-300, #cbd5e1);
    border-radius: 4px;
    background: var(--ux-neutral-0, #ffffff);
    color: inherit;
}

.ux-playground__select:focus,
.ux-playground__input:focus {
    outline: none;
    border-color: var(--ux-primary-500, #14b8a6);
    box-shadow: 0 0 0 2px var(--ux-primary-100, #ccfbf1);
}

.ux-playground__checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--ux-primary-500, #14b8a6);
}

.ux-playground__range-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ux-playground__range {
    flex: 1;
    accent-color: var(--ux-primary-500, #14b8a6);
}

.ux-playground__range-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--ux-neutral-600, #475569);
    min-width: 32px;
    text-align: right;
}

.ux-playground__preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--ux-neutral-50, #f8fafc);
    border: 1px dashed var(--ux-neutral-300, #cbd5e1);
    border-radius: 6px;
    min-height: 80px;
}

.ux-playground__code {
    margin: 0;
    padding: 12px;
    font-family: 'Inconsolata', 'Monaco', 'Menlo', monospace;
    font-size: 0.8125rem;
    line-height: 1.5;
    background: var(--ux-neutral-800, #1e293b);
    color: var(--ux-neutral-100, #f1f5f9);
    border-radius: 6px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
}

.ux-playground__copy-btn {
    font-size: 0.6875rem;
    padding: 2px 8px;
    background: var(--ux-neutral-200, #e2e8f0);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: var(--ux-neutral-600, #475569);
    transition: all 0.15s ease;
}

.ux-playground__copy-btn:hover {
    background: var(--ux-neutral-300, #cbd5e1);
    color: var(--ux-neutral-800, #1e293b);
}
`;
        document.head.appendChild(style);
    }

    // Auto-init
    function init() {
        injectStyles();
        initPlaygrounds();
    }

    // Export API
    window.UIXPlayground = {
        init,
        initPlaygrounds,
        createPlayground,
        componentConfigs,
        registerComponent: (name, config) => {
            componentConfigs[name] = config;
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
