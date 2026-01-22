/**
 * UIX Playground - Interactive component configurator
 *
 * Creates live-preview playgrounds for UIX components with:
 * - Configurable options via dropdowns/inputs/color pickers
 * - Live preview that updates in real-time
 * - Copyable HTML code snippet
 * - Full color customization for all 30 components
 *
 * Usage:
 *   <div data-playground="button" data-options='{"variants": [...], "sizes": [...]}'>
 *     <!-- Playground UI auto-generated -->
 *   </div>
 */
(function() {
    'use strict';

    // ============================================
    // DEFAULT COLORS (Sensible visible defaults)
    // ============================================

    const COLORS = {
        primary: '#14b8a6',         // Teal primary
        primaryHover: '#0d9488',    // Darker teal
        primaryActive: '#0f766e',   // Even darker teal
        primaryLight: '#ccfbf1',    // Light teal
        secondary: '#64748b',       // Slate
        secondaryHover: '#475569',  // Darker slate
        danger: '#ef4444',          // Red
        dangerHover: '#dc2626',     // Darker red
        success: '#22c55e',         // Green
        successHover: '#16a34a',    // Darker green
        warning: '#f59e0b',         // Amber
        warningHover: '#d97706',    // Darker amber
        info: '#3b82f6',            // Blue
        infoHover: '#2563eb',       // Darker blue
        white: '#ffffff',
        dark: '#1e293b',            // Dark slate
        neutral50: '#f8fafc',
        neutral100: '#f1f5f9',
        neutral200: '#e2e8f0',
        neutral300: '#cbd5e1',
        neutral400: '#94a3b8',
        neutral500: '#64748b',
        neutral600: '#475569',
        neutral700: '#334155',
        neutral800: '#1e293b',
        neutral900: '#0f172a',
        transparent: 'transparent'
    };

    // ============================================
    // COMPONENT CONFIGURATIONS (All 30 Components)
    // ============================================

    const componentConfigs = {
        // ========================================
        // BUTTON
        // ========================================
        button: {
            name: 'Button',
            element: 'button',
            enhance: 'button',
            defaults: {
                text: 'Click me',
                variant: 'primary',
                size: '',
                block: false,
                loading: false,
                disabled: false,
                bgColor: '#14b8a6',
                textColor: '#ffffff',
                borderColor: '#14b8a6',
                hoverBg: '#0d9488',
                hoverColor: '#ffffff',
                activeBg: '#0f766e',
                activeColor: '#ffffff'
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
                        { value: 'danger', label: 'Danger' },
                        { value: 'success', label: 'Success' },
                        { value: 'warning', label: 'Warning' },
                        { value: 'info', label: 'Info' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                text: {
                    label: 'Text',
                    type: 'text',
                    placeholder: 'Button text'
                },
                block: {
                    label: 'Full width (block)',
                    type: 'checkbox'
                },
                loading: {
                    label: 'Loading state',
                    type: 'checkbox'
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                },
                hoverColor: {
                    label: 'Hover Text Color',
                    type: 'color'
                },
                activeBg: {
                    label: 'Active/Pressed Background',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active/Pressed Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="button"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.hoverColor) attrs.push(`ux-hover-color="${opts.hoverColor}"`);
                if (opts.activeBg) attrs.push(`ux-active-bg="${opts.activeBg}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.block) attrs.push(`ux-block="true"`);
                if (opts.loading) attrs.push(`ux-loading="true"`);
                const disabledAttr = opts.disabled ? ' disabled' : '';
                return `<button ${attrs.join(' ')}${disabledAttr}>${escapeHtml(opts.text || 'Click me')}</button>`;
            }
        },

        // ========================================
        // BADGE
        // ========================================
        badge: {
            name: 'Badge',
            element: 'span',
            enhance: 'badge',
            defaults: {
                text: 'Badge',
                variant: 'primary',
                size: '',
                pill: false,
                bgColor: '#ccfbf1',
                textColor: '#0f766e'
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
                        { value: 'info', label: 'Info' },
                        { value: 'neutral', label: 'Neutral' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                pill: {
                    label: 'Pill style (rounded)',
                    type: 'checkbox'
                },
                text: {
                    label: 'Text',
                    type: 'text',
                    placeholder: 'Badge text'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="badge"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.pill) attrs.push(`ux-pill="true"`);
                return `<span ${attrs.join(' ')}>${escapeHtml(opts.text || 'Badge')}</span>`;
            }
        },

        // ========================================
        // AVATAR
        // ========================================
        avatar: {
            name: 'Avatar',
            element: 'div',
            enhance: 'avatar',
            defaults: {
                initials: 'JD',
                imageUrl: 'https://i.pravatar.cc/150?img=3',
                size: '',
                square: false,
                bgColor: '#ccfbf1',
                textColor: '#0f766e',
                borderColor: '#14b8a6'
            },
            options: {
                initials: {
                    label: 'Initials',
                    type: 'text',
                    placeholder: 'JD',
                    maxLength: 2
                },
                imageUrl: {
                    label: 'Image URL (overrides initials)',
                    type: 'text',
                    placeholder: 'https://example.com/avatar.jpg'
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                square: {
                    label: 'Square shape',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const initials = (opts.initials || 'JD').toUpperCase().slice(0, 2);
                const attrs = [`ux-enhance="avatar"`];
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.square) attrs.push(`ux-square="true"`);

                // If imageUrl is provided, use an img tag inside
                if (opts.imageUrl && opts.imageUrl.trim()) {
                    return `<div ${attrs.join(' ')}><img src="${escapeHtml(opts.imageUrl)}" alt="Avatar"></div>`;
                }
                return `<div ${attrs.join(' ')}>${initials}</div>`;
            }
        },

        // ========================================
        // SPINNER
        // ========================================
        spinner: {
            name: 'Spinner',
            element: 'div',
            enhance: 'spinner',
            defaults: {
                size: '',
                color: '#14b8a6',
                trackColor: '#e2e8f0',
                label: 'Loading'
            },
            options: {
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                color: {
                    label: 'Spinner Color',
                    type: 'color'
                },
                trackColor: {
                    label: 'Track Color',
                    type: 'color'
                },
                label: {
                    label: 'Accessibility Label',
                    type: 'text',
                    placeholder: 'Loading'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="spinner"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.color) attrs.push(`ux-color="${opts.color}"`);
                if (opts.trackColor) attrs.push(`ux-track="${opts.trackColor}"`);
                if (opts.label) attrs.push(`ux-label="${escapeHtml(opts.label)}"`);
                return `<div ${attrs.join(' ')}></div>`;
            }
        },

        // ========================================
        // ALERT
        // ========================================
        alert: {
            name: 'Alert',
            element: 'div',
            enhance: 'alert',
            defaults: {
                text: 'This is an alert message.',
                variant: 'info',
                dismissible: false,
                bgColor: '#dbeafe',
                textColor: '#1d4ed8',
                borderColor: '#3b82f6'
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
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="alert"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.dismissible) attrs.push(`ux-dismissible="true"`);
                return `<div ${attrs.join(' ')}>${escapeHtml(opts.text || 'Alert message')}</div>`;
            }
        },

        // ========================================
        // PROGRESS
        // ========================================
        progress: {
            name: 'Progress',
            element: 'div',
            enhance: 'progress',
            defaults: {
                value: 50,
                max: 100,
                size: '',
                barColor: '#14b8a6',
                trackColor: '#e2e8f0'
            },
            options: {
                value: {
                    label: 'Value (%)',
                    type: 'range',
                    min: 0,
                    max: 100
                },
                max: {
                    label: 'Max Value',
                    type: 'number',
                    min: 1,
                    max: 1000
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                barColor: {
                    label: 'Bar Color',
                    type: 'color'
                },
                trackColor: {
                    label: 'Track Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="progress"`, `ux-value="${opts.value || 50}"`];
                if (opts.max && opts.max !== 100) attrs.push(`ux-max="${opts.max}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.barColor) attrs.push(`ux-color="${opts.barColor}"`);
                if (opts.trackColor) attrs.push(`ux-bg="${opts.trackColor}"`);
                return `<div ${attrs.join(' ')} style="width: 100%;"></div>`;
            }
        },

        // ========================================
        // SWITCH
        // ========================================
        switch: {
            name: 'Switch',
            element: 'label',
            enhance: 'switch',
            defaults: {
                checked: false,
                size: '',
                label: 'Toggle',
                disabled: false,
                onBgColor: '#14b8a6',
                offBgColor: '#cbd5e1',
                knobColor: '#ffffff'
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
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                label: {
                    label: 'Label',
                    type: 'text',
                    placeholder: 'Switch label'
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                onBgColor: {
                    label: 'On Background',
                    type: 'color'
                },
                offBgColor: {
                    label: 'Off Background',
                    type: 'color'
                },
                knobColor: {
                    label: 'Knob Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="switch"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.onBgColor) attrs.push(`ux-on-bg="${opts.onBgColor}"`);
                if (opts.offBgColor) attrs.push(`ux-off-bg="${opts.offBgColor}"`);
                if (opts.knobColor) attrs.push(`ux-knob-color="${opts.knobColor}"`);
                const checked = opts.checked ? ' checked' : '';
                const disabled = opts.disabled ? ' disabled' : '';
                const label = opts.label ? ` ${escapeHtml(opts.label)}` : '';
                return `<label ${attrs.join(' ')}>\n  <input type="checkbox"${checked}${disabled}>\n  <span class="ux-switch__track"></span>${label}\n</label>`;
            }
        },

        // ========================================
        // CARD
        // ========================================
        card: {
            name: 'Card',
            element: 'div',
            enhance: 'card',
            defaults: {
                title: 'Card Title',
                content: 'Card content goes here.',
                elevated: false,
                hoverable: false,
                bgColor: '#ffffff',
                borderColor: '#e2e8f0',
                headerBg: '#f8fafc',
                headerColor: '#1e293b',
                footerBg: '#f8fafc',
                shadowColor: 'rgba(0,0,0,0.1)'
            },
            options: {
                title: {
                    label: 'Title',
                    type: 'text',
                    placeholder: 'Card title'
                },
                content: {
                    label: 'Content',
                    type: 'text',
                    placeholder: 'Card content'
                },
                elevated: {
                    label: 'Elevated shadow',
                    type: 'checkbox'
                },
                hoverable: {
                    label: 'Hoverable',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                headerBg: {
                    label: 'Header Background',
                    type: 'color'
                },
                headerColor: {
                    label: 'Header Text Color',
                    type: 'color'
                },
                footerBg: {
                    label: 'Footer Background',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="card"`];
                if (opts.title) attrs.push(`ux-title="${escapeHtml(opts.title)}"`);
                if (opts.elevated) attrs.push(`ux-elevated="true"`);
                if (opts.hoverable) attrs.push(`ux-hoverable="true"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.borderColor) attrs.push(`ux-border="${opts.borderColor}"`);
                if (opts.headerBg) attrs.push(`ux-header-bg="${opts.headerBg}"`);
                if (opts.headerColor) attrs.push(`ux-header-color="${opts.headerColor}"`);
                if (opts.footerBg) attrs.push(`ux-footer-bg="${opts.footerBg}"`);
                return `<div ${attrs.join(' ')}>${escapeHtml(opts.content || 'Card content')}</div>`;
            }
        },

        // ========================================
        // SKELETON
        // ========================================
        skeleton: {
            name: 'Skeleton',
            element: 'div',
            enhance: 'skeleton',
            defaults: {
                shape: 'text',
                width: '100%',
                height: '16px',
                animated: true,
                bgColor: '#e2e8f0',
                highlightColor: '#f1f5f9'
            },
            options: {
                shape: {
                    label: 'Shape',
                    type: 'select',
                    choices: [
                        { value: 'text', label: 'Text' },
                        { value: 'circle', label: 'Circle' },
                        { value: 'rect', label: 'Rectangle' }
                    ]
                },
                width: {
                    label: 'Width',
                    type: 'text',
                    placeholder: '100%'
                },
                height: {
                    label: 'Height',
                    type: 'text',
                    placeholder: '16px'
                },
                animated: {
                    label: 'Animated',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                highlightColor: {
                    label: 'Highlight Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="skeleton"`];
                if (opts.shape) attrs.push(`ux-shape="${opts.shape}"`);
                if (!opts.animated) attrs.push(`ux-animated="false"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.highlightColor) attrs.push(`ux-highlight="${opts.highlightColor}"`);
                const width = opts.shape === 'circle' ? '48px' : (opts.width || '100%');
                const height = opts.shape === 'circle' ? '48px' : (opts.shape === 'rect' ? '80px' : (opts.height || '16px'));
                return `<div ${attrs.join(' ')} style="width: ${width}; height: ${height};"></div>`;
            }
        },

        // ========================================
        // INPUT
        // ========================================
        input: {
            name: 'Input',
            element: 'input',
            enhance: 'input',
            defaults: {
                placeholder: 'Enter text...',
                type: 'text',
                size: '',
                error: false,
                success: false,
                disabled: false,
                readonly: false,
                bgColor: '#ffffff',
                textColor: '#1e293b',
                borderColor: '#cbd5e1',
                focusColor: '#14b8a6',
                focusRing: '#ccfbf1'
            },
            options: {
                type: {
                    label: 'Input Type',
                    type: 'select',
                    choices: [
                        { value: 'text', label: 'Text' },
                        { value: 'email', label: 'Email' },
                        { value: 'password', label: 'Password' },
                        { value: 'number', label: 'Number' },
                        { value: 'tel', label: 'Telephone' },
                        { value: 'url', label: 'URL' },
                        { value: 'search', label: 'Search' },
                        { value: 'date', label: 'Date' },
                        { value: 'time', label: 'Time' }
                    ]
                },
                placeholder: {
                    label: 'Placeholder',
                    type: 'text',
                    placeholder: 'Placeholder text'
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                error: {
                    label: 'Error state',
                    type: 'checkbox'
                },
                success: {
                    label: 'Success state',
                    type: 'checkbox'
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                readonly: {
                    label: 'Read-only',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                focusColor: {
                    label: 'Focus Border Color',
                    type: 'color'
                },
                focusRing: {
                    label: 'Focus Ring Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="input"`, `type="${opts.type || 'text'}"`];
                if (opts.placeholder) attrs.push(`placeholder="${escapeHtml(opts.placeholder)}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.error) attrs.push(`ux-error="true"`);
                if (opts.success) attrs.push(`ux-success="true"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.focusColor) attrs.push(`ux-focus-color="${opts.focusColor}"`);
                if (opts.focusRing) attrs.push(`ux-focus-ring="${opts.focusRing}"`);
                const disabled = opts.disabled ? ' disabled' : '';
                const readonly = opts.readonly ? ' readonly' : '';
                return `<input ${attrs.join(' ')}${disabled}${readonly}>`;
            }
        },

        // ========================================
        // TEXTAREA
        // ========================================
        textarea: {
            name: 'Textarea',
            element: 'textarea',
            enhance: 'textarea',
            defaults: {
                placeholder: 'Enter text...',
                rows: 3,
                size: '',
                error: false,
                success: false,
                disabled: false,
                readonly: false,
                resize: 'vertical',
                bgColor: '#ffffff',
                textColor: '#1e293b',
                borderColor: '#cbd5e1',
                focusColor: '#14b8a6',
                focusRing: '#ccfbf1'
            },
            options: {
                placeholder: {
                    label: 'Placeholder',
                    type: 'text',
                    placeholder: 'Placeholder text'
                },
                rows: {
                    label: 'Rows',
                    type: 'number',
                    min: 1,
                    max: 20
                },
                resize: {
                    label: 'Resize',
                    type: 'select',
                    choices: [
                        { value: 'vertical', label: 'Vertical' },
                        { value: 'horizontal', label: 'Horizontal' },
                        { value: 'both', label: 'Both' },
                        { value: 'none', label: 'None' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                error: {
                    label: 'Error state',
                    type: 'checkbox'
                },
                success: {
                    label: 'Success state',
                    type: 'checkbox'
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                readonly: {
                    label: 'Read-only',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                focusColor: {
                    label: 'Focus Border Color',
                    type: 'color'
                },
                focusRing: {
                    label: 'Focus Ring Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="textarea"`];
                if (opts.placeholder) attrs.push(`placeholder="${escapeHtml(opts.placeholder)}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.error) attrs.push(`ux-error="true"`);
                if (opts.success) attrs.push(`ux-success="true"`);
                if (opts.resize) attrs.push(`ux-resize="${opts.resize}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.focusColor) attrs.push(`ux-focus-color="${opts.focusColor}"`);
                if (opts.focusRing) attrs.push(`ux-focus-ring="${opts.focusRing}"`);
                const disabled = opts.disabled ? ' disabled' : '';
                const readonly = opts.readonly ? ' readonly' : '';
                return `<textarea ${attrs.join(' ')} rows="${opts.rows || 3}"${disabled}${readonly}></textarea>`;
            }
        },

        // ========================================
        // SELECT
        // ========================================
        select: {
            name: 'Select',
            element: 'select',
            enhance: 'select',
            defaults: {
                size: '',
                error: false,
                success: false,
                disabled: false,
                multiple: false,
                bgColor: '#ffffff',
                textColor: '#1e293b',
                borderColor: '#cbd5e1',
                focusColor: '#14b8a6',
                focusRing: '#ccfbf1'
            },
            options: {
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                error: {
                    label: 'Error state',
                    type: 'checkbox'
                },
                success: {
                    label: 'Success state',
                    type: 'checkbox'
                },
                multiple: {
                    label: 'Multiple selection',
                    type: 'checkbox'
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                focusColor: {
                    label: 'Focus Border Color',
                    type: 'color'
                },
                focusRing: {
                    label: 'Focus Ring Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="select"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.error) attrs.push(`ux-error="true"`);
                if (opts.success) attrs.push(`ux-success="true"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.focusColor) attrs.push(`ux-focus-color="${opts.focusColor}"`);
                if (opts.focusRing) attrs.push(`ux-focus-ring="${opts.focusRing}"`);
                const disabled = opts.disabled ? ' disabled' : '';
                const multiple = opts.multiple ? ' multiple' : '';
                return `<select ${attrs.join(' ')}${disabled}${multiple}>\n  <option>Option 1</option>\n  <option>Option 2</option>\n  <option>Option 3</option>\n</select>`;
            }
        },

        // ========================================
        // CHECKBOX
        // ========================================
        checkbox: {
            name: 'Checkbox',
            element: 'label',
            enhance: 'checkbox',
            defaults: {
                label: 'Check me',
                size: '',
                checked: false,
                indeterminate: false,
                disabled: false,
                accentColor: '#14b8a6',
                labelColor: '#1e293b'
            },
            options: {
                label: {
                    label: 'Label',
                    type: 'text',
                    placeholder: 'Checkbox label'
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                checked: {
                    label: 'Checked',
                    type: 'checkbox'
                },
                indeterminate: {
                    label: 'Indeterminate',
                    type: 'checkbox'
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                accentColor: {
                    label: 'Accent Color',
                    type: 'color'
                },
                labelColor: {
                    label: 'Label Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="checkbox"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.accentColor) attrs.push(`ux-color="${opts.accentColor}"`);
                if (opts.labelColor) attrs.push(`ux-label-color="${opts.labelColor}"`);
                if (opts.indeterminate) attrs.push(`ux-indeterminate="true"`);
                const checked = opts.checked ? ' checked' : '';
                const disabled = opts.disabled ? ' disabled' : '';
                const label = opts.label ? ` ${escapeHtml(opts.label)}` : '';
                return `<label ${attrs.join(' ')}>\n  <input type="checkbox"${checked}${disabled}>${label}\n</label>`;
            }
        },

        // ========================================
        // RADIO
        // ========================================
        radio: {
            name: 'Radio',
            element: 'div',
            enhance: 'radio',
            defaults: {
                size: '',
                disabled: false,
                accentColor: '#14b8a6',
                labelColor: '#1e293b',
                orientation: 'vertical'
            },
            options: {
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                orientation: {
                    label: 'Orientation',
                    type: 'select',
                    choices: [
                        { value: 'vertical', label: 'Vertical' },
                        { value: 'horizontal', label: 'Horizontal' }
                    ]
                },
                disabled: {
                    label: 'Disabled',
                    type: 'checkbox'
                },
                accentColor: {
                    label: 'Accent Color',
                    type: 'color'
                },
                labelColor: {
                    label: 'Label Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const sizeAttr = opts.size ? ` ux-size="${opts.size}"` : '';
                const colorAttr = opts.accentColor ? ` ux-color="${opts.accentColor}"` : '';
                const labelColorAttr = opts.labelColor ? ` ux-label-color="${opts.labelColor}"` : '';
                const disabled = opts.disabled ? ' disabled' : '';
                const flexDir = opts.orientation === 'horizontal' ? 'row' : 'column';
                const gap = opts.orientation === 'horizontal' ? '1rem' : '0.5rem';
                return `<div style="display: flex; flex-direction: ${flexDir}; gap: ${gap};">\n  <label ux-enhance="radio"${sizeAttr}${colorAttr}${labelColorAttr}>\n    <input type="radio" name="demo-radio" value="a" checked${disabled}> Option A\n  </label>\n  <label ux-enhance="radio"${sizeAttr}${colorAttr}${labelColorAttr}>\n    <input type="radio" name="demo-radio" value="b"${disabled}> Option B\n  </label>\n  <label ux-enhance="radio"${sizeAttr}${colorAttr}${labelColorAttr}>\n    <input type="radio" name="demo-radio" value="c"${disabled}> Option C\n  </label>\n</div>`;
            }
        },

        // ========================================
        // TOOLTIP
        // ========================================
        tooltip: {
            name: 'Tooltip',
            element: 'span',
            enhance: 'tooltip',
            defaults: {
                text: 'Hover over me',
                tooltip: 'This is a tooltip!',
                size: '',
                position: 'top',
                bgColor: '#1e293b',
                textColor: '#ffffff'
            },
            options: {
                text: {
                    label: 'Element Text',
                    type: 'text',
                    placeholder: 'Element text'
                },
                tooltip: {
                    label: 'Tooltip Text',
                    type: 'text',
                    placeholder: 'Tooltip text'
                },
                position: {
                    label: 'Position',
                    type: 'select',
                    choices: [
                        { value: 'top', label: 'Top' },
                        { value: 'bottom', label: 'Bottom' },
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="tooltip"`, `data-tooltip="${escapeHtml(opts.tooltip || 'Tooltip')}"`];
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (opts.position) attrs.push(`ux-position="${opts.position}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                return `<span ${attrs.join(' ')} style="cursor: help; border-bottom: 1px dotted currentColor;">${escapeHtml(opts.text || 'Hover me')}</span>`;
            }
        },

        // ========================================
        // TAG
        // ========================================
        tag: {
            name: 'Tag',
            element: 'span',
            enhance: 'tag',
            defaults: {
                text: 'Tag',
                variant: 'primary',
                size: '',
                removable: false,
                bgColor: '#ccfbf1',
                textColor: '#0f766e',
                borderColor: '#14b8a6'
            },
            options: {
                text: {
                    label: 'Text',
                    type: 'text',
                    placeholder: 'Tag text'
                },
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
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' }
                    ]
                },
                removable: {
                    label: 'Removable',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="tag"`];
                if (opts.variant) attrs.push(`ux-variant="${opts.variant}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                const removeBtn = opts.removable ? '<button class="ux-tag__remove">&times;</button>' : '';
                return `<span ${attrs.join(' ')}>${escapeHtml(opts.text || 'Tag')}${removeBtn}</span>`;
            }
        },

        // ========================================
        // DIVIDER
        // ========================================
        divider: {
            name: 'Divider',
            element: 'hr',
            enhance: 'divider',
            defaults: {
                vertical: false,
                color: '#e2e8f0',
                thickness: '1px',
                spacing: '1rem',
                style: 'solid'
            },
            options: {
                vertical: {
                    label: 'Vertical',
                    type: 'checkbox'
                },
                style: {
                    label: 'Style',
                    type: 'select',
                    choices: [
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' }
                    ]
                },
                color: {
                    label: 'Color',
                    type: 'color'
                },
                thickness: {
                    label: 'Thickness',
                    type: 'text',
                    placeholder: '1px'
                },
                spacing: {
                    label: 'Spacing (margin)',
                    type: 'text',
                    placeholder: '1rem'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="divider"`];
                if (opts.vertical) attrs.push(`ux-vertical="true"`);
                if (opts.style) attrs.push(`ux-style="${opts.style}"`);
                const styles = ['border: none'];
                const thickness = opts.thickness || '1px';
                const color = opts.color || '#e2e8f0';
                const lineStyle = opts.style || 'solid';
                if (opts.vertical) {
                    styles.push(`width: ${thickness}`, `background: ${color}`, 'height: 60px', 'display: inline-block');
                } else {
                    styles.push(`border-top: ${thickness} ${lineStyle} ${color}`);
                }
                if (opts.spacing) {
                    if (opts.vertical) {
                        styles.push(`margin: 0 ${opts.spacing}`);
                    } else {
                        styles.push(`margin: ${opts.spacing} 0`);
                    }
                }
                const styleAttr = ` style="${styles.join('; ')}"`;
                return `<hr ${attrs.join(' ')}${styleAttr}>`;
            }
        },

        // ========================================
        // TABLE
        // ========================================
        table: {
            name: 'Table',
            element: 'table',
            enhance: 'table',
            defaults: {
                striped: false,
                hoverable: false,
                bordered: false,
                compact: false,
                headerBg: '#f8fafc',
                headerColor: '#1e293b',
                stripedBg: '#e2e8f0',
                hoverBg: '#f1f5f9',
                borderColor: '#e2e8f0'
            },
            options: {
                striped: {
                    label: 'Striped rows',
                    type: 'checkbox'
                },
                hoverable: {
                    label: 'Hoverable rows',
                    type: 'checkbox'
                },
                bordered: {
                    label: 'Bordered',
                    type: 'checkbox'
                },
                compact: {
                    label: 'Compact',
                    type: 'checkbox'
                },
                headerBg: {
                    label: 'Header Background',
                    type: 'color'
                },
                headerColor: {
                    label: 'Header Text Color',
                    type: 'color'
                },
                stripedBg: {
                    label: 'Striped Row Background',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                // Build class list for inline styling since UIX table enhancer might not support all options
                const classes = ['ux-table'];
                if (opts.striped) classes.push('ux-table--striped');
                if (opts.hoverable) classes.push('ux-table--hoverable');
                if (opts.bordered) classes.push('ux-table--bordered');
                if (opts.compact) classes.push('ux-table--compact');

                const attrs = [`ux-enhance="table"`, `class="${classes.join(' ')}"`];
                if (opts.striped) attrs.push(`ux-striped="true"`);
                if (opts.hoverable) attrs.push(`ux-hoverable="true"`);
                if (opts.bordered) attrs.push(`ux-bordered="true"`);
                if (opts.compact) attrs.push(`ux-compact="true"`);
                if (opts.headerBg) attrs.push(`ux-header-bg="${opts.headerBg}"`);
                if (opts.headerColor) attrs.push(`ux-header-color="${opts.headerColor}"`);
                if (opts.stripedBg) attrs.push(`ux-striped-bg="${opts.stripedBg}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);

                // Build inline styles for immediate visual feedback
                const thStyle = [];
                if (opts.headerBg) thStyle.push(`background: ${opts.headerBg}`);
                if (opts.headerColor) thStyle.push(`color: ${opts.headerColor}`);
                const thStyleAttr = thStyle.length > 0 ? ` style="${thStyle.join('; ')}"` : '';

                const borderStyle = opts.bordered ? `border: 1px solid ${opts.borderColor || '#e2e8f0'}` : '';
                const cellPadding = opts.compact ? '0.5rem 0.75rem' : '0.75rem 1rem';
                const cellStyle = [borderStyle, `padding: ${cellPadding}`].filter(Boolean).join('; ');

                // Cell styles for odd and even rows
                const oddCellStyle = cellStyle;
                const evenCellStyle = opts.striped
                    ? `${cellStyle}; background: ${opts.stripedBg || '#e2e8f0'}`
                    : cellStyle;

                return `<table ${attrs.join(' ')} style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="${thStyle.join('; ')}; ${cellStyle}">Name</th>
      <th style="${thStyle.join('; ')}; ${cellStyle}">Status</th>
      <th style="${thStyle.join('; ')}; ${cellStyle}">Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="${oddCellStyle}">Alice</td>
      <td style="${oddCellStyle}">Active</td>
      <td style="${oddCellStyle}">Admin</td>
    </tr>
    <tr>
      <td style="${evenCellStyle}">Bob</td>
      <td style="${evenCellStyle}">Pending</td>
      <td style="${evenCellStyle}">User</td>
    </tr>
    <tr>
      <td style="${oddCellStyle}">Carol</td>
      <td style="${oddCellStyle}">Active</td>
      <td style="${oddCellStyle}">Editor</td>
    </tr>
    <tr>
      <td style="${evenCellStyle}">Dan</td>
      <td style="${evenCellStyle}">Active</td>
      <td style="${evenCellStyle}">User</td>
    </tr>
  </tbody>
</table>`;
            }
        },

        // ========================================
        // NAV
        // ========================================
        nav: {
            name: 'Nav',
            element: 'nav',
            enhance: 'nav',
            defaults: {
                vertical: false,
                bgColor: '#ffffff',
                textColor: '#64748b',
                hoverBg: '#f1f5f9',
                hoverColor: '#0f172a',
                activeBg: '#ccfbf1',
                activeColor: '#0f766e'
            },
            options: {
                vertical: {
                    label: 'Vertical layout',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                },
                hoverColor: {
                    label: 'Hover Text Color',
                    type: 'color'
                },
                activeBg: {
                    label: 'Active Background',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="nav"`];
                if (opts.vertical) attrs.push(`ux-vertical="true"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.hoverColor) attrs.push(`ux-hover-color="${opts.hoverColor}"`);
                if (opts.activeBg) attrs.push(`ux-active-bg="${opts.activeBg}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                return `<nav ${attrs.join(' ')}>\n  <a href="#" class="ux-nav__item" aria-current="page">Home</a>\n  <a href="#" class="ux-nav__item">About</a>\n  <a href="#" class="ux-nav__item">Contact</a>\n</nav>`;
            }
        },

        // ========================================
        // BREADCRUMB
        // ========================================
        breadcrumb: {
            name: 'Breadcrumb',
            element: 'nav',
            enhance: 'breadcrumb',
            defaults: {
                separator: '/',
                items: 'Home, Products, Details',
                textColor: '#64748b',
                activeColor: '#0f172a',
                hoverColor: '#14b8a6',
                separatorColor: '#94a3b8'
            },
            options: {
                separator: {
                    label: 'Separator',
                    type: 'text',
                    placeholder: '/'
                },
                items: {
                    label: 'Items (comma-separated)',
                    type: 'text',
                    placeholder: 'Home, Products, Details'
                },
                textColor: {
                    label: 'Link Color',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Item Color',
                    type: 'color'
                },
                hoverColor: {
                    label: 'Hover Color',
                    type: 'color'
                },
                separatorColor: {
                    label: 'Separator Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const items = (opts.items || 'Home, Products, Details').split(',').map(s => s.trim());
                const sep = opts.separator || '/';
                const attrs = [`ux-enhance="breadcrumb"`];
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                if (opts.hoverColor) attrs.push(`ux-hover-color="${opts.hoverColor}"`);
                if (opts.separatorColor) attrs.push(`ux-separator-color="${opts.separatorColor}"`);
                const itemsHtml = items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    if (isLast) {
                        return `  <span class="ux-breadcrumb__item">${escapeHtml(item)}</span>`;
                    }
                    return `  <a href="#" class="ux-breadcrumb__item">${escapeHtml(item)}</a>\n  <span class="ux-breadcrumb__separator">${escapeHtml(sep)}</span>`;
                }).join('\n');
                return `<nav ${attrs.join(' ')}>\n${itemsHtml}\n</nav>`;
            }
        },

        // ========================================
        // MODAL
        // ========================================
        modal: {
            name: 'Modal',
            element: 'div',
            enhance: 'modal',
            defaults: {
                title: 'Modal Title',
                size: '',
                closeOnBackdrop: true,
                closeOnEscape: true,
                backdropColor: 'rgba(0, 0, 0, 0.5)',
                bgColor: '#ffffff',
                headerBg: '#ffffff',
                headerColor: '#1e293b',
                borderColor: '#e2e8f0'
            },
            options: {
                title: {
                    label: 'Title',
                    type: 'text',
                    placeholder: 'Modal title'
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' },
                        { value: 'full', label: 'Fullscreen' }
                    ]
                },
                closeOnBackdrop: {
                    label: 'Close on backdrop click',
                    type: 'checkbox'
                },
                closeOnEscape: {
                    label: 'Close on Escape key',
                    type: 'checkbox'
                },
                backdropColor: {
                    label: 'Backdrop Color',
                    type: 'color'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                headerBg: {
                    label: 'Header Background',
                    type: 'color'
                },
                headerColor: {
                    label: 'Header Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="modal"`, `id="demo-modal"`];
                if (opts.title) attrs.push(`ux-label="${escapeHtml(opts.title)}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (!opts.closeOnBackdrop) attrs.push(`ux-close-on-backdrop="false"`);
                if (!opts.closeOnEscape) attrs.push(`ux-close-on-escape="false"`);
                if (opts.backdropColor) attrs.push(`ux-backdrop-color="${opts.backdropColor}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.headerBg) attrs.push(`ux-header-bg="${opts.headerBg}"`);
                if (opts.headerColor) attrs.push(`ux-header-color="${opts.headerColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                return `<!-- Trigger -->\n<button ux-enhance="button" ux-variant="primary" ux-opens="#demo-modal">Open Modal</button>\n\n<!-- Modal -->\n<div ${attrs.join(' ')}>\n  <div class="ux-modal__content">\n    <div class="ux-modal__header">\n      <h3>${escapeHtml(opts.title || 'Modal Title')}</h3>\n      <button class="ux-modal__close" ux-closes>&times;</button>\n    </div>\n    <div class="ux-modal__body">\n      <p>Modal content goes here.</p>\n    </div>\n    <div class="ux-modal__footer">\n      <button ux-enhance="button" ux-variant="secondary" ux-closes>Cancel</button>\n      <button ux-enhance="button" ux-variant="primary" ux-closes>Confirm</button>\n    </div>\n  </div>\n</div>`;
            }
        },

        // ========================================
        // DRAWER
        // ========================================
        drawer: {
            name: 'Drawer',
            element: 'div',
            enhance: 'drawer',
            defaults: {
                position: 'left',
                size: '',
                closeOnBackdrop: true,
                closeOnEscape: true,
                bgColor: '#ffffff',
                overlayColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: '#e2e8f0'
            },
            options: {
                position: {
                    label: 'Position',
                    type: 'select',
                    choices: [
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' },
                        { value: 'top', label: 'Top' },
                        { value: 'bottom', label: 'Bottom' }
                    ]
                },
                size: {
                    label: 'Size',
                    type: 'select',
                    choices: [
                        { value: '', label: 'Default (md)' },
                        { value: 'sm', label: 'Small' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]
                },
                closeOnBackdrop: {
                    label: 'Close on backdrop click',
                    type: 'checkbox'
                },
                closeOnEscape: {
                    label: 'Close on Escape key',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                overlayColor: {
                    label: 'Overlay Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="drawer"`, `id="demo-drawer"`];
                if (opts.position) attrs.push(`ux-position="${opts.position}"`);
                if (opts.size) attrs.push(`ux-size="${opts.size}"`);
                if (!opts.closeOnBackdrop) attrs.push(`ux-close-on-backdrop="false"`);
                if (!opts.closeOnEscape) attrs.push(`ux-close-on-escape="false"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.overlayColor) attrs.push(`ux-overlay="${opts.overlayColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                return `<!-- Trigger -->\n<button ux-enhance="button" ux-opens="#demo-drawer">Open Drawer</button>\n\n<!-- Drawer -->\n<div ${attrs.join(' ')}>\n  <div class="ux-drawer__content" style="padding: 1rem;">\n    <h3>Drawer Title</h3>\n    <p>Drawer content here.</p>\n    <button ux-enhance="button" ux-closes>Close</button>\n  </div>\n</div>`;
            }
        },

        // ========================================
        // TABS
        // ========================================
        tabs: {
            name: 'Tabs',
            element: 'div',
            enhance: 'tabs',
            defaults: {
                tabs: 'Tab 1, Tab 2, Tab 3',
                bgColor: '#ffffff',
                textColor: '#64748b',
                hoverBg: '#f1f5f9',
                hoverColor: '#14b8a6',
                activeBg: '#ffffff',
                activeColor: '#14b8a6',
                borderColor: '#14b8a6'
            },
            options: {
                tabs: {
                    label: 'Tab names (comma-separated)',
                    type: 'text',
                    placeholder: 'Tab 1, Tab 2, Tab 3'
                },
                bgColor: {
                    label: 'Tab Background',
                    type: 'color'
                },
                textColor: {
                    label: 'Tab Text Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                },
                hoverColor: {
                    label: 'Hover Text Color',
                    type: 'color'
                },
                activeBg: {
                    label: 'Active Background',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Active Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const tabNames = (opts.tabs || 'Tab 1, Tab 2, Tab 3').split(',').map(t => t.trim());
                const attrs = [`ux-enhance="tabs"`, `ux-tabs="${escapeHtml(opts.tabs || 'Tab 1, Tab 2, Tab 3')}"`];
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.hoverColor) attrs.push(`ux-hover-color="${opts.hoverColor}"`);
                if (opts.activeBg) attrs.push(`ux-active-bg="${opts.activeBg}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                const panels = tabNames.map((name) => `  <div>Content for ${escapeHtml(name)}</div>`).join('\n');
                return `<div ${attrs.join(' ')}>\n${panels}\n</div>`;
            }
        },

        // ========================================
        // ACCORDION
        // ========================================
        accordion: {
            name: 'Accordion',
            element: 'div',
            enhance: 'accordion',
            defaults: {
                multiple: false,
                borderColor: '#e2e8f0',
                bgColor: '#ffffff',
                headerBg: '#ffffff',
                headerColor: '#1e293b',
                hoverBg: '#f8fafc',
                activeBg: '#f8fafc',
                activeColor: '#14b8a6',
                contentBg: '#ffffff'
            },
            options: {
                multiple: {
                    label: 'Allow multiple open',
                    type: 'checkbox'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                headerBg: {
                    label: 'Header Background',
                    type: 'color'
                },
                headerColor: {
                    label: 'Header Text Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Header Hover Background',
                    type: 'color'
                },
                activeBg: {
                    label: 'Active Header Background',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Header Color',
                    type: 'color'
                },
                contentBg: {
                    label: 'Content Background',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="accordion"`];
                if (opts.multiple) attrs.push(`ux-multiple="true"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.headerBg) attrs.push(`ux-header-bg="${opts.headerBg}"`);
                if (opts.headerColor) attrs.push(`ux-header-color="${opts.headerColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.activeBg) attrs.push(`ux-active-bg="${opts.activeBg}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                if (opts.contentBg) attrs.push(`ux-content-bg="${opts.contentBg}"`);
                return `<div ${attrs.join(' ')}>\n  <div class="ux-accordion__item">\n    <button class="ux-accordion__header">Section 1 <span class="ux-accordion__icon">&#9662;</span></button>\n    <div class="ux-accordion__content"><div class="ux-accordion__body">Content for section 1</div></div>\n  </div>\n  <div class="ux-accordion__item">\n    <button class="ux-accordion__header">Section 2 <span class="ux-accordion__icon">&#9662;</span></button>\n    <div class="ux-accordion__content"><div class="ux-accordion__body">Content for section 2</div></div>\n  </div>\n  <div class="ux-accordion__item">\n    <button class="ux-accordion__header">Section 3 <span class="ux-accordion__icon">&#9662;</span></button>\n    <div class="ux-accordion__content"><div class="ux-accordion__body">Content for section 3</div></div>\n  </div>\n</div>`;
            }
        },

        // ========================================
        // DROPDOWN
        // ========================================
        dropdown: {
            name: 'Dropdown',
            element: 'div',
            enhance: 'dropdown',
            defaults: {
                bgColor: '#ffffff',
                textColor: '#334155',
                borderColor: '#e2e8f0',
                hoverBg: '#f1f5f9',
                hoverColor: '#0f172a',
                activeBg: '#ccfbf1',
                activeColor: '#0f766e',
                shadowColor: 'rgba(0,0,0,0.1)'
            },
            options: {
                bgColor: {
                    label: 'Menu Background',
                    type: 'color'
                },
                textColor: {
                    label: 'Menu Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Menu Border Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Item Hover Background',
                    type: 'color'
                },
                hoverColor: {
                    label: 'Item Hover Text Color',
                    type: 'color'
                },
                activeBg: {
                    label: 'Active Item Background',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Item Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="dropdown"`];
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.hoverColor) attrs.push(`ux-hover-color="${opts.hoverColor}"`);
                if (opts.activeBg) attrs.push(`ux-active-bg="${opts.activeBg}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                return `<div ${attrs.join(' ')}>\n  <button class="ux-dropdown__trigger" ux-enhance="button">Menu</button>\n  <div class="ux-dropdown__menu">\n    <a href="#" class="ux-dropdown__item">Action 1</a>\n    <a href="#" class="ux-dropdown__item">Action 2</a>\n    <a href="#" class="ux-dropdown__item">Action 3</a>\n  </div>\n</div>`;
            }
        },

        // ========================================
        // MENU
        // ========================================
        menu: {
            name: 'Menu',
            element: 'ul',
            enhance: 'menu',
            defaults: {
                bgColor: '#ffffff',
                textColor: '#334155',
                borderColor: '#e2e8f0',
                hoverBg: '#f1f5f9',
                hoverColor: '#0f172a',
                selectedBg: '#ccfbf1',
                selectedColor: '#0f766e'
            },
            options: {
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                },
                hoverColor: {
                    label: 'Hover Text Color',
                    type: 'color'
                },
                selectedBg: {
                    label: 'Selected Background',
                    type: 'color'
                },
                selectedColor: {
                    label: 'Selected Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="menu"`];
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.hoverColor) attrs.push(`ux-hover-color="${opts.hoverColor}"`);
                if (opts.selectedBg) attrs.push(`ux-selected-bg="${opts.selectedBg}"`);
                if (opts.selectedColor) attrs.push(`ux-selected-color="${opts.selectedColor}"`);
                return `<ul ${attrs.join(' ')}>\n  <li class="ux-menu__item" aria-selected="true">Dashboard</li>\n  <li class="ux-menu__item">Settings</li>\n  <li class="ux-menu__item">Profile</li>\n  <li class="ux-menu__item">Logout</li>\n</ul>`;
            }
        },

        // ========================================
        // PAGINATION
        // ========================================
        pagination: {
            name: 'Pagination',
            element: 'nav',
            enhance: 'pagination',
            defaults: {
                totalPages: 5,
                currentPage: 2,
                showPrevNext: true,
                accentColor: '#14b8a6',
                textColor: '#334155',
                bgColor: '#ffffff',
                borderColor: '#cbd5e1',
                hoverBg: '#f1f5f9'
            },
            options: {
                totalPages: {
                    label: 'Total Pages',
                    type: 'number',
                    min: 1,
                    max: 20
                },
                currentPage: {
                    label: 'Current Page',
                    type: 'number',
                    min: 1,
                    max: 20
                },
                showPrevNext: {
                    label: 'Show Prev/Next buttons',
                    type: 'checkbox'
                },
                accentColor: {
                    label: 'Active Page Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                }
            },
            render: (opts) => {
                const total = opts.totalPages || 5;
                const current = Math.min(opts.currentPage || 2, total);
                const attrs = [`ux-enhance="pagination"`];
                if (opts.accentColor) attrs.push(`ux-accent="${opts.accentColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.borderColor) attrs.push(`ux-border-color="${opts.borderColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);

                let pagesHtml = '';
                if (opts.showPrevNext) {
                    pagesHtml += '  <a href="#" class="ux-pagination__item">&laquo;</a>\n';
                }
                for (let i = 1; i <= total; i++) {
                    const isCurrent = i === current ? ' aria-current="page"' : '';
                    pagesHtml += `  <a href="#" class="ux-pagination__item"${isCurrent}>${i}</a>\n`;
                }
                if (opts.showPrevNext) {
                    pagesHtml += '  <a href="#" class="ux-pagination__item">&raquo;</a>\n';
                }
                return `<nav ${attrs.join(' ')}>\n${pagesHtml}</nav>`;
            }
        },

        // ========================================
        // POPOVER
        // ========================================
        popover: {
            name: 'Popover',
            element: 'div',
            enhance: 'popover',
            defaults: {
                content: 'Popover content here',
                position: 'bottom',
                bgColor: '#ffffff',
                textColor: '#334155',
                borderColor: '#e2e8f0',
                shadowColor: 'rgba(0,0,0,0.15)'
            },
            options: {
                content: {
                    label: 'Content',
                    type: 'text',
                    placeholder: 'Popover content'
                },
                position: {
                    label: 'Position',
                    type: 'select',
                    choices: [
                        { value: 'top', label: 'Top' },
                        { value: 'bottom', label: 'Bottom' },
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' }
                    ]
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="popover"`];
                if (opts.position) attrs.push(`ux-position="${opts.position}"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border="${opts.borderColor}"`);
                const positionStyle = opts.position === 'top' ? 'bottom: 100%; left: 0; margin-bottom: 8px;' :
                                     opts.position === 'left' ? 'right: 100%; top: 0; margin-right: 8px;' :
                                     opts.position === 'right' ? 'left: 100%; top: 0; margin-left: 8px;' :
                                     'top: 100%; left: 0; margin-top: 8px;';
                return `<div style="position: relative; display: inline-block;">\n  <button ux-enhance="button" onclick="this.nextElementSibling.classList.toggle('is-open')">Toggle Popover</button>\n  <div ${attrs.join(' ')} style="position: absolute; ${positionStyle} padding: 0.75rem; min-width: 150px;">\n    <div class="ux-popover__content">${escapeHtml(opts.content || 'Popover content here')}</div>\n  </div>\n</div>`;
            }
        },

        // ========================================
        // STEPPER
        // ========================================
        stepper: {
            name: 'Stepper',
            element: 'div',
            enhance: 'stepper',
            defaults: {
                steps: 'Step 1, Step 2, Step 3',
                currentStep: 2,
                orientation: 'horizontal',
                completedColor: '#14b8a6',
                activeColor: '#0f766e',
                pendingColor: '#cbd5e1',
                connectorColor: '#e2e8f0'
            },
            options: {
                steps: {
                    label: 'Steps (comma-separated)',
                    type: 'text',
                    placeholder: 'Step 1, Step 2, Step 3'
                },
                currentStep: {
                    label: 'Current Step',
                    type: 'number',
                    min: 1,
                    max: 10
                },
                orientation: {
                    label: 'Orientation',
                    type: 'select',
                    choices: [
                        { value: 'horizontal', label: 'Horizontal' },
                        { value: 'vertical', label: 'Vertical' }
                    ]
                },
                completedColor: {
                    label: 'Completed Step Color',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Step Color',
                    type: 'color'
                },
                pendingColor: {
                    label: 'Pending Step Color',
                    type: 'color'
                },
                connectorColor: {
                    label: 'Connector Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const stepNames = (opts.steps || 'Step 1, Step 2, Step 3').split(',').map(s => s.trim());
                const current = Math.min(opts.currentStep || 2, stepNames.length);
                const attrs = [`ux-enhance="stepper"`];
                if (opts.orientation === 'vertical') attrs.push(`ux-vertical="true"`);
                if (opts.completedColor) attrs.push(`ux-completed-color="${opts.completedColor}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                if (opts.pendingColor) attrs.push(`ux-pending-color="${opts.pendingColor}"`);
                if (opts.connectorColor) attrs.push(`ux-connector-color="${opts.connectorColor}"`);

                const stepsHtml = stepNames.map((name, i) => {
                    const stepNum = i + 1;
                    const status = stepNum < current ? 'complete' : (stepNum === current ? 'current' : 'pending');
                    const bgColor = status === 'complete' ? (opts.completedColor || '#14b8a6') :
                                   (status === 'current' ? (opts.activeColor || '#0f766e') : (opts.pendingColor || '#cbd5e1'));
                    const textColor = status === 'pending' ? '#64748b' : '#ffffff';
                    const connector = i < stepNames.length - 1 ?
                        `  <div class="ux-stepper__connector" style="flex: 1; height: 2px; background: ${opts.connectorColor || '#e2e8f0'};"></div>\n` : '';
                    return `  <div class="ux-stepper__step" data-status="${status}" style="display: flex; align-items: center; gap: 0.5rem;">\n    <div class="ux-stepper__indicator" style="width: 2rem; height: 2rem; border-radius: 50%; background: ${bgColor}; color: ${textColor}; display: flex; align-items: center; justify-content: center; font-weight: 600;">${stepNum}</div>\n    <span class="ux-stepper__label">${escapeHtml(name)}</span>\n  </div>\n${connector}`;
                }).join('');
                const flexDir = opts.orientation === 'vertical' ? 'column' : 'row';
                return `<div ${attrs.join(' ')} style="display: flex; flex-direction: ${flexDir}; align-items: ${opts.orientation === 'vertical' ? 'flex-start' : 'center'}; gap: 0.5rem;">\n${stepsHtml}</div>`;
            }
        },

        // ========================================
        // SIDEBAR
        // ========================================
        sidebar: {
            name: 'Sidebar',
            element: 'aside',
            enhance: 'sidebar',
            defaults: {
                width: '200px',
                collapsed: false,
                bgColor: '#ffffff',
                textColor: '#64748b',
                borderColor: '#e2e8f0',
                hoverBg: '#f1f5f9',
                activeBg: '#ccfbf1',
                activeColor: '#0f766e'
            },
            options: {
                width: {
                    label: 'Width',
                    type: 'text',
                    placeholder: '200px'
                },
                collapsed: {
                    label: 'Collapsed',
                    type: 'checkbox'
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                },
                borderColor: {
                    label: 'Border Color',
                    type: 'color'
                },
                hoverBg: {
                    label: 'Hover Background',
                    type: 'color'
                },
                activeBg: {
                    label: 'Active Background',
                    type: 'color'
                },
                activeColor: {
                    label: 'Active Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const attrs = [`ux-enhance="sidebar"`];
                if (opts.collapsed) attrs.push(`ux-collapsed="true"`);
                if (opts.bgColor) attrs.push(`ux-bg="${opts.bgColor}"`);
                if (opts.textColor) attrs.push(`ux-color="${opts.textColor}"`);
                if (opts.borderColor) attrs.push(`ux-border="${opts.borderColor}"`);
                if (opts.hoverBg) attrs.push(`ux-hover-bg="${opts.hoverBg}"`);
                if (opts.activeBg) attrs.push(`ux-active-bg="${opts.activeBg}"`);
                if (opts.activeColor) attrs.push(`ux-active-color="${opts.activeColor}"`);
                const width = opts.collapsed ? '60px' : (opts.width || '200px');
                const stylesParts = [`width: ${width}`, 'padding: 1rem'];
                if (opts.bgColor) stylesParts.push(`background: ${opts.bgColor}`);
                if (opts.borderColor) stylesParts.push(`border-right: 1px solid ${opts.borderColor}`);
                const styles = stylesParts.join('; ') + ';';
                const activeStyle = [
                    'display: block',
                    'padding: 0.5rem',
                    opts.activeColor ? `color: ${opts.activeColor}` : '',
                    opts.activeBg ? `background: ${opts.activeBg}` : '',
                    'border-radius: 0.375rem',
                    'margin-bottom: 0.25rem',
                    'text-decoration: none'
                ].filter(Boolean).join('; ');
                const linkStyle = [
                    'display: block',
                    'padding: 0.5rem',
                    opts.textColor ? `color: ${opts.textColor}` : '',
                    'text-decoration: none',
                    'border-radius: 0.375rem',
                    'margin-bottom: 0.25rem'
                ].filter(Boolean).join('; ');
                return `<aside ${attrs.join(' ')} style="${styles}">\n  <nav>\n    <a href="#" style="${activeStyle}">Dashboard</a>\n    <a href="#" style="${linkStyle}">Settings</a>\n    <a href="#" style="${linkStyle}">Profile</a>\n  </nav>\n</aside>`;
            }
        },

        // ========================================
        // TOAST (Preview Only)
        // ========================================
        toast: {
            name: 'Toast',
            element: 'div',
            enhance: 'toast',
            defaults: {
                message: 'This is a toast notification!',
                variant: 'info',
                duration: 3000,
                position: 'bottom-right',
                bgColor: '#1e293b',
                textColor: '#ffffff'
            },
            options: {
                message: {
                    label: 'Message',
                    type: 'text',
                    placeholder: 'Toast message'
                },
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
                position: {
                    label: 'Position',
                    type: 'select',
                    choices: [
                        { value: 'top-left', label: 'Top Left' },
                        { value: 'top-right', label: 'Top Right' },
                        { value: 'bottom-left', label: 'Bottom Left' },
                        { value: 'bottom-right', label: 'Bottom Right' }
                    ]
                },
                duration: {
                    label: 'Duration (ms)',
                    type: 'number',
                    min: 1000,
                    max: 10000
                },
                bgColor: {
                    label: 'Background Color',
                    type: 'color'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color'
                }
            },
            render: (opts) => {
                const variantBg = {
                    '': '#1e293b',
                    'success': '#16a34a',
                    'warning': '#d97706',
                    'danger': '#dc2626',
                    'info': '#2563eb'
                };
                const bg = opts.variant ? variantBg[opts.variant] : (opts.bgColor || '#1e293b');
                return `<!-- Toast is typically shown via JavaScript API -->\n<div class="ux-toast${opts.variant ? ` ux-toast--${opts.variant}` : ''}" style="display: inline-flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: ${bg}; color: ${opts.textColor || '#ffffff'}; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">\n  ${escapeHtml(opts.message || 'Toast notification')}\n</div>\n\n<!-- JavaScript API usage: -->\n<!-- UIX.toast('Your message', { type: '${opts.variant || 'info'}', duration: ${opts.duration || 3000} }); -->`;
            }
        }
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Escape HTML entities to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string} Unique ID
     */
    function generateId(prefix = 'pg') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // ============================================
    // PLAYGROUND CREATION
    // ============================================

    /**
     * Create a single playground instance
     * @param {HTMLElement} container - Container element
     * @param {string} componentType - Type of component
     * @returns {Object} Playground instance with state and updatePreview
     */
    function createPlayground(container, componentType) {
        const config = componentConfigs[componentType];
        if (!config) {
            console.warn(`UIX Playground: Unknown component type: ${componentType}`);
            return null;
        }

        // Initialize state with defaults
        const state = { ...config.defaults };
        const playgroundId = generateId('playground');

        // Track control groups for showWhen functionality
        const controlGroups = new Map();

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

        // Function to update visibility of showWhen controls
        const updateShowWhenVisibility = () => {
            controlGroups.forEach((group, key) => {
                const opt = config.options[key];
                if (opt && opt.showWhen) {
                    const shouldShow = !!state[opt.showWhen];
                    group.style.display = shouldShow ? '' : 'none';
                }
            });
        };

        // Create controls for each option
        Object.entries(config.options).forEach(([key, opt]) => {
            const controlGroup = document.createElement('div');
            controlGroup.className = 'ux-playground__control';
            controlGroup.dataset.optionKey = key;

            // Track for showWhen
            controlGroups.set(key, controlGroup);

            // Initially hide if showWhen condition not met
            if (opt.showWhen && !state[opt.showWhen]) {
                controlGroup.style.display = 'none';
            }

            const label = document.createElement('label');
            label.textContent = opt.label;
            label.className = 'ux-playground__label';

            let input;
            const inputId = `${playgroundId}-${key}`;

            if (opt.type === 'select') {
                input = document.createElement('select');
                input.className = 'ux-playground__select';
                input.id = inputId;
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
                input.id = inputId;
                input.checked = !!state[key];
                input.addEventListener('change', () => {
                    state[key] = input.checked;
                    updateShowWhenVisibility();
                    updatePreview();
                });
            } else if (opt.type === 'range') {
                const rangeWrapper = document.createElement('div');
                rangeWrapper.className = 'ux-playground__range-wrapper';

                input = document.createElement('input');
                input.type = 'range';
                input.className = 'ux-playground__range';
                input.id = inputId;
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

                controlGroup.appendChild(label);
                controlGroup.appendChild(rangeWrapper);
                controlsPanel.appendChild(controlGroup);
                label.htmlFor = inputId;
                return; // Skip the normal append
            } else if (opt.type === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.className = 'ux-playground__input ux-playground__input--number';
                input.id = inputId;
                input.min = opt.min || 0;
                input.max = opt.max || 1000;
                input.value = state[key] || 0;
                input.addEventListener('input', () => {
                    state[key] = parseInt(input.value, 10) || 0;
                    updatePreview();
                });
            } else if (opt.type === 'color') {
                const colorWrapper = document.createElement('div');
                colorWrapper.className = 'ux-playground__color-wrapper';

                input = document.createElement('input');
                input.type = 'color';
                input.className = 'ux-playground__color';
                input.id = inputId;
                // Use the default value or fallback to a visible color
                const defaultColor = state[key] || '#14b8a6';
                input.value = defaultColor.startsWith('#') ? defaultColor : '#14b8a6';

                const colorText = document.createElement('input');
                colorText.type = 'text';
                colorText.className = 'ux-playground__color-text';
                colorText.value = state[key] || '#14b8a6';
                colorText.placeholder = '#14b8a6';

                // Sync color picker and text input
                input.addEventListener('input', () => {
                    state[key] = input.value;
                    colorText.value = input.value;
                    updatePreview();
                });

                colorText.addEventListener('input', () => {
                    const val = colorText.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
                        state[key] = val;
                        input.value = val.length === 4 ?
                            `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}` : val;
                        updatePreview();
                    } else if (/^rgba?\(/.test(val) || /^[a-z]+$/i.test(val)) {
                        // Allow CSS color names and rgba
                        state[key] = val;
                        updatePreview();
                    }
                });

                colorText.addEventListener('blur', () => {
                    // Normalize on blur
                    colorText.value = state[key] || '#14b8a6';
                });

                colorWrapper.appendChild(input);
                colorWrapper.appendChild(colorText);

                controlGroup.appendChild(label);
                controlGroup.appendChild(colorWrapper);
                controlsPanel.appendChild(controlGroup);
                label.htmlFor = inputId;
                return; // Skip normal append
            } else {
                // text input (default)
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'ux-playground__input';
                input.id = inputId;
                input.placeholder = opt.placeholder || '';
                input.value = state[key] || '';
                if (opt.maxLength) input.maxLength = opt.maxLength;
                input.addEventListener('input', () => {
                    state[key] = input.value;
                    updatePreview();
                });
            }

            label.htmlFor = inputId;

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
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = code;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
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

            // Re-enhance components using UIX
            previewArea.querySelectorAll('[ux-enhance]').forEach(el => {
                const enhanceType = el.getAttribute('ux-enhance');

                // Parse options from ux- attributes
                const opts = {};
                Array.from(el.attributes).forEach(attr => {
                    if (attr.name.startsWith('ux-') && attr.name !== 'ux-enhance' && attr.name !== 'ux-enhanced') {
                        const key = attr.name.slice(3).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                        // Parse booleans and numbers
                        let val = attr.value;
                        if (val === 'true') val = true;
                        else if (val === 'false') val = false;
                        else if (!isNaN(val) && val !== '') val = Number(val);
                        opts[key] = val;
                    }
                });

                // Use uxXFactory.enhance directly (more reliable)
                if (window.uxXFactory?.enhance?.[enhanceType]) {
                    window.uxXFactory.enhance[enhanceType](el, opts);
                    el.setAttribute('ux-enhanced', 'true');
                } else if (window.UIX?.processElement) {
                    window.UIX.processElement(el);
                }
            });
        }

        // Initial render
        updatePreview();

        return { state, updatePreview };
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize all playgrounds on the page
     * @param {Document|HTMLElement} root - Root element to search
     */
    function initPlaygrounds(root = document) {
        root.querySelectorAll('[data-playground]').forEach(container => {
            const componentType = container.dataset.playground;
            createPlayground(container, componentType);
        });
    }

    /**
     * Inject playground styles
     */
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
    margin: 1rem 0;
}

.ux-playground__layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 200px;
}

@media (max-width: 768px) {
    .ux-playground__layout {
        grid-template-columns: 1fr;
    }
}

.ux-playground__controls {
    padding: 16px;
    background: var(--ux-neutral-50, #f8fafc);
    border-right: 1px solid var(--ux-neutral-200, #e2e8f0);
    max-height: 500px;
    overflow-y: auto;
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
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--ux-neutral-700, #334155);
    margin-bottom: 4px;
}

.ux-playground__select,
.ux-playground__input {
    width: 100%;
    padding: 6px 10px;
    font-size: 0.8125rem;
    border: 1px solid var(--ux-neutral-300, #cbd5e1);
    border-radius: 4px;
    background: var(--ux-neutral-0, #ffffff);
    color: inherit;
}

.ux-playground__input--number {
    width: 80px;
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
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--ux-neutral-600, #475569);
    min-width: 32px;
    text-align: right;
}

.ux-playground__color-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ux-playground__color {
    width: 40px;
    height: 32px;
    padding: 2px;
    border: 1px solid var(--ux-neutral-300, #cbd5e1);
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
}

.ux-playground__color::-webkit-color-swatch-wrapper {
    padding: 0;
}

.ux-playground__color::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
}

.ux-playground__color-text {
    flex: 1;
    padding: 6px 10px;
    font-size: 0.75rem;
    font-family: 'Inconsolata', 'Monaco', 'Menlo', monospace;
    border: 1px solid var(--ux-neutral-300, #cbd5e1);
    border-radius: 4px;
    background: var(--ux-neutral-0, #ffffff);
    color: inherit;
}

.ux-playground__color-text:focus {
    outline: none;
    border-color: var(--ux-primary-500, #14b8a6);
    box-shadow: 0 0 0 2px var(--ux-primary-100, #ccfbf1);
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
    min-height: 100px;
}

.ux-playground__code {
    margin: 0;
    padding: 12px;
    font-family: 'Inconsolata', 'Monaco', 'Menlo', monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    background: var(--ux-neutral-800, #1e293b);
    color: var(--ux-neutral-100, #f1f5f9);
    border-radius: 6px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
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

/* Scrollbar styling for controls panel */
.ux-playground__controls::-webkit-scrollbar {
    width: 6px;
}

.ux-playground__controls::-webkit-scrollbar-track {
    background: var(--ux-neutral-100, #f1f5f9);
}

.ux-playground__controls::-webkit-scrollbar-thumb {
    background: var(--ux-neutral-300, #cbd5e1);
    border-radius: 3px;
}

.ux-playground__controls::-webkit-scrollbar-thumb:hover {
    background: var(--ux-neutral-400, #94a3b8);
}

/* Table component inline styles support */
.ux-table--bordered th,
.ux-table--bordered td {
    border: 1px solid var(--ux-neutral-200, #e2e8f0);
}

.ux-table--compact th,
.ux-table--compact td {
    padding: 0.5rem 0.75rem;
}

.ux-table--striped tbody tr:nth-child(even) {
    background: var(--ux-neutral-50, #f8fafc);
}

.ux-table--hoverable tbody tr:hover {
    background: var(--ux-neutral-100, #f1f5f9);
}
`;
        document.head.appendChild(style);
    }

    /**
     * Auto-initialize playgrounds
     */
    function init() {
        injectStyles();
        initPlaygrounds();
    }

    // ============================================
    // PUBLIC API
    // ============================================

    window.UIXPlayground = {
        init,
        initPlaygrounds,
        createPlayground,
        componentConfigs,
        /**
         * Register a custom component configuration
         * @param {string} name - Component name
         * @param {Object} config - Component configuration
         */
        registerComponent: (name, config) => {
            componentConfigs[name] = config;
        },
        /**
         * Get list of all available components
         * @returns {string[]} Array of component names
         */
        getComponents: () => Object.keys(componentConfigs),
        /**
         * Get configuration for a specific component
         * @param {string} name - Component name
         * @returns {Object|undefined} Component configuration
         */
        getComponentConfig: (name) => componentConfigs[name]
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
