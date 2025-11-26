/**
 * Unit tests for bindX Form Utilities
 * Tests validation, serialization, and form state management
 */

describe('bindX Form Utilities', () => {
    let bindX;
    let container;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // Load bindX
        jest.resetModules();
        delete require.cache[require.resolve('../../src/bindx.js')];
        bindX = require('../../src/bindx.js');

        // Mock genxCommon for parseBindingAttribute
        const genxCommon = require('../../src/genx-common.js');
        if (typeof global.window === 'undefined') {
            global.window = {};
        }
        global.window.genxCommon = genxCommon;
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Validation Rules', () => {
        describe('required', () => {
            it('should validate non-empty strings', () => {
                const result = bindX.validateField('hello', { required: true });
                expect(result.valid).toBe(true);
            });

            it('should reject empty strings', () => {
                const result = bindX.validateField('', { required: true });
                expect(result.valid).toBe(false);
            });

            it('should reject whitespace-only strings', () => {
                const result = bindX.validateField('   ', { required: true });
                expect(result.valid).toBe(false);
            });

            it('should reject null', () => {
                const result = bindX.validateField(null, { required: true });
                expect(result.valid).toBe(false);
            });

            it('should reject undefined', () => {
                const result = bindX.validateField(undefined, { required: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('email', () => {
            it('should validate correct email', () => {
                const result = bindX.validateField('test@example.com', { email: true });
                expect(result.valid).toBe(true);
            });

            it('should reject invalid email', () => {
                const result = bindX.validateField('invalid-email', { email: true });
                expect(result.valid).toBe(false);
            });

            it('should allow empty for optional fields', () => {
                const result = bindX.validateField('', { email: true });
                expect(result.valid).toBe(true);
            });
        });

        describe('min/max', () => {
            it('should validate min value', () => {
                const result = bindX.validateField(10, { min: 5 });
                expect(result.valid).toBe(true);
            });

            it('should reject below min', () => {
                const result = bindX.validateField(3, { min: 5 });
                expect(result.valid).toBe(false);
            });

            it('should validate max value', () => {
                const result = bindX.validateField(10, { max: 20 });
                expect(result.valid).toBe(true);
            });

            it('should reject above max', () => {
                const result = bindX.validateField(25, { max: 20 });
                expect(result.valid).toBe(false);
            });
        });

        describe('minLength/maxLength', () => {
            it('should validate minLength', () => {
                const result = bindX.validateField('hello', { minLength: 3 });
                expect(result.valid).toBe(true);
            });

            it('should reject below minLength', () => {
                const result = bindX.validateField('hi', { minLength: 5 });
                expect(result.valid).toBe(false);
            });

            it('should validate maxLength', () => {
                const result = bindX.validateField('hello', { maxLength: 10 });
                expect(result.valid).toBe(true);
            });

            it('should reject above maxLength', () => {
                const result = bindX.validateField('hello world', { maxLength: 5 });
                expect(result.valid).toBe(false);
            });
        });

        describe('pattern', () => {
            it('should validate matching pattern', () => {
                const result = bindX.validateField('abc123', { pattern: '^[a-z0-9]+$' });
                expect(result.valid).toBe(true);
            });

            it('should reject non-matching pattern', () => {
                const result = bindX.validateField('ABC', { pattern: '^[a-z]+$' });
                expect(result.valid).toBe(false);
            });
        });

        describe('url', () => {
            it('should validate correct URL', () => {
                const result = bindX.validateField('https://example.com', { url: true });
                expect(result.valid).toBe(true);
            });

            it('should reject invalid URL', () => {
                const result = bindX.validateField('not-a-url', { url: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('number', () => {
            it('should validate numbers', () => {
                const result = bindX.validateField('42', { number: true });
                expect(result.valid).toBe(true);
            });

            it('should reject non-numbers', () => {
                const result = bindX.validateField('abc', { number: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('integer', () => {
            it('should validate integers', () => {
                const result = bindX.validateField('42', { integer: true });
                expect(result.valid).toBe(true);
            });

            it('should reject decimals', () => {
                const result = bindX.validateField('42.5', { integer: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('alpha', () => {
            it('should validate alphabetic strings', () => {
                const result = bindX.validateField('abcXYZ', { alpha: true });
                expect(result.valid).toBe(true);
            });

            it('should reject numbers', () => {
                const result = bindX.validateField('abc123', { alpha: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('alphanumeric', () => {
            it('should validate alphanumeric strings', () => {
                const result = bindX.validateField('abc123XYZ', { alphanumeric: true });
                expect(result.valid).toBe(true);
            });

            it('should reject special characters', () => {
                const result = bindX.validateField('abc-123', { alphanumeric: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('phone', () => {
            it('should validate US phone format', () => {
                const result = bindX.validateField('(555) 123-4567', { phone: true });
                expect(result.valid).toBe(true);
            });

            it('should validate plain digits', () => {
                const result = bindX.validateField('5551234567', { phone: true });
                expect(result.valid).toBe(true);
            });

            it('should reject too short', () => {
                const result = bindX.validateField('123', { phone: true });
                expect(result.valid).toBe(false);
            });
        });

        describe('multiple rules', () => {
            it('should validate when all rules pass', () => {
                const result = bindX.validateField('test@example.com', {
                    required: true,
                    email: true,
                    minLength: 5
                });
                expect(result.valid).toBe(true);
            });

            it('should fail when any rule fails', () => {
                const result = bindX.validateField('ab', {
                    required: true,
                    minLength: 5
                });
                expect(result.valid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Form Serialization', () => {
        it('should serialize simple form', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="username" value="john">
                <input name="email" value="john@example.com">
            `;

            const data = bindX.serializeForm(form);
            expect(data.username).toBe('john');
            expect(data.email).toBe('john@example.com');
        });

        it('should handle nested paths', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="user.name" value="John">
                <input name="user.email" value="john@example.com">
            `;

            const data = bindX.serializeForm(form);
            expect(data.user.name).toBe('John');
            expect(data.user.email).toBe('john@example.com');
        });

        it('should serialize select elements', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <select name="country">
                    <option value="us">USA</option>
                    <option value="uk" selected>UK</option>
                </select>
            `;

            const data = bindX.serializeForm(form);
            expect(data.country).toBe('uk');
        });

        it('should serialize textarea', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <textarea name="message">Hello World</textarea>
            `;

            const data = bindX.serializeForm(form);
            expect(data.message).toBe('Hello World');
        });
    });

    describe('Form Deserialization', () => {
        it('should deserialize simple data', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="username" value="">
                <input name="email" value="">
            `;

            bindX.deserializeForm(form, {
                username: 'john',
                email: 'john@example.com'
            });

            expect(form.querySelector('[name="username"]').value).toBe('john');
            expect(form.querySelector('[name="email"]').value).toBe('john@example.com');
        });

        it('should handle nested paths', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="user.name" value="">
                <input name="user.email" value="">
            `;

            bindX.deserializeForm(form, {
                user: {
                    name: 'John',
                    email: 'john@example.com'
                }
            });

            expect(form.querySelector('[name="user.name"]').value).toBe('John');
            expect(form.querySelector('[name="user.email"]').value).toBe('john@example.com');
        });

        it('should handle checkboxes', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input type="checkbox" name="agree" value="yes">
            `;

            bindX.deserializeForm(form, { agree: true });
            expect(form.querySelector('[name="agree"]').checked).toBe(true);
        });

        it('should handle radio buttons', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input type="radio" name="gender" value="male">
                <input type="radio" name="gender" value="female">
            `;

            bindX.deserializeForm(form, { gender: 'female' });
            expect(form.querySelector('[name="gender"][value="female"]').checked).toBe(true);
        });
    });

    describe('Form State Management', () => {
        it('should track pristine state', () => {
            const form = document.createElement('form');
            container.appendChild(form);

            const state = bindX.getFormState(form);
            expect(state.pristine).toBe(true);
            expect(state.dirty).toBe(false);
        });

        it('should track dirty state', () => {
            const form = document.createElement('form');
            container.appendChild(form);

            bindX.updateFormState(form, { pristine: false, dirty: true });

            const state = bindX.getFormState(form);
            expect(state.pristine).toBe(false);
            expect(state.dirty).toBe(true);
        });

        it('should track valid state', () => {
            const form = document.createElement('form');
            container.appendChild(form);

            bindX.updateFormState(form, { valid: true, invalid: false });

            const state = bindX.getFormState(form);
            expect(state.valid).toBe(true);
            expect(state.invalid).toBe(false);
        });

        it('should add CSS classes for pristine', () => {
            const form = document.createElement('form');
            container.appendChild(form);

            bindX.updateFormState(form, { pristine: true, dirty: false });

            expect(form.classList.contains('bx-pristine')).toBe(true);
            expect(form.classList.contains('bx-dirty')).toBe(false);
        });

        it('should add CSS classes for valid', () => {
            const form = document.createElement('form');
            container.appendChild(form);

            bindX.updateFormState(form, { valid: true, invalid: false });

            expect(form.classList.contains('bx-valid')).toBe(true);
            expect(form.classList.contains('bx-invalid')).toBe(false);
        });
    });

    describe('Form Validation Integration', () => {
        it('should validate entire form', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="email" bx-model="email" bx-validate="required email">
            `;
            container.appendChild(form);

            const data = bindX.reactive({ email: 'test@example.com' });
            const result = bindX.validateForm(form, data);

            expect(result.valid).toBe(true);
        });

        it('should detect invalid fields', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="email" bx-model="email" bx-validate="required email">
            `;
            container.appendChild(form);

            const data = bindX.reactive({ email: 'invalid' });
            const result = bindX.validateForm(form, data);

            expect(result.valid).toBe(false);
            expect(result.errors.email).toBeDefined();
        });

        it('should handle JSON validation rules', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="age" bx-model="age" bx-validate='{"required":true,"min":18}'>
            `;
            container.appendChild(form);

            const data = bindX.reactive({ age: 25 });
            const result = bindX.validateForm(form, data);

            expect(result.valid).toBe(true);
        });

        it('should add error classes to invalid fields', () => {
            const form = document.createElement('form');
            const input = document.createElement('input');
            input.setAttribute('name', 'email');
            input.setAttribute('bx-model', 'email');
            input.setAttribute('bx-validate', 'required email');
            form.appendChild(input);
            container.appendChild(form);

            const data = bindX.reactive({ email: 'invalid' });
            bindX.validateForm(form, data);

            expect(input.classList.contains('bx-error')).toBe(true);
        });
    });

    describe('Form Reset', () => {
        it('should reset form to pristine state', () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="username" value="john">
            `;
            container.appendChild(form);

            // Make it dirty
            bindX.updateFormState(form, { pristine: false, dirty: true });

            // Reset
            bindX.resetForm(form);

            const state = bindX.getFormState(form);
            expect(state.pristine).toBe(true);
            expect(state.dirty).toBe(false);
        });

        it('should clear error states', () => {
            const form = document.createElement('form');
            container.appendChild(form);

            bindX.updateFormState(form, { valid: false, invalid: true });
            bindX.resetForm(form);

            const state = bindX.getFormState(form);
            expect(state.valid).toBe(true);
            expect(state.invalid).toBe(false);
        });

        it('should clear field error classes', () => {
            const form = document.createElement('form');
            const input = document.createElement('input');
            input.classList.add('bx-error');
            form.appendChild(input);
            container.appendChild(form);

            bindX.resetForm(form);

            expect(input.classList.contains('bx-error')).toBe(false);
        });
    });

    describe('Integration with scan()', () => {
        it('should process bx-form attribute', () => {
            const form = document.createElement('form');
            form.setAttribute('bx-form', '');
            form.innerHTML = `
                <input name="email" bx-model="email" bx-validate="required email">
            `;
            container.appendChild(form);

            const data = bindX.reactive({ email: '' });
            bindX.scan(container, data);

            const state = bindX.getFormState(form);
            expect(state).toBeDefined();
            expect(state.pristine).toBe(true);
        });
    });

    describe('Custom Error Messages', () => {
        it('should use custom error messages', () => {
            const input = document.createElement('input');
            input.setAttribute('bx-error-required', 'This field is mandatory');

            const result = bindX.validateField('', { required: true }, input);

            expect(result.valid).toBe(false);
            expect(result.errors[0]).toBe('This field is mandatory');
        });
    });
});
