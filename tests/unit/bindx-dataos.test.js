/**
 * Tests for bindX DATAOS Pattern
 * DOM As The Authority On State - extract initial values from DOM
 */

const {
    extractDataFromDOM,
    autoInit,
    scan,
    createReactive
} = require('../../src/bindx');

describe('DATAOS Pattern', () => {
    let container;

    beforeEach(() => {
        // Setup container for DOM tests
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe('extractDataFromDOM', () => {
        it('should extract text input values', () => {
            container.innerHTML = '<input type="text" bx-model="name" value="John">';
            const data = extractDataFromDOM(container);
            expect(data.name).toBe('John');
        });

        it('should extract number input values as numbers', () => {
            container.innerHTML = '<input type="number" bx-model="age" value="25">';
            const data = extractDataFromDOM(container);
            expect(data.age).toBe(25);
            expect(typeof data.age).toBe('number');
        });

        it('should extract checkbox state as boolean', () => {
            container.innerHTML = `
                <input type="checkbox" bx-model="active" checked>
                <input type="checkbox" bx-model="inactive">
            `;
            const data = extractDataFromDOM(container);
            expect(data.active).toBe(true);
            expect(data.inactive).toBe(false);
        });

        it('should extract checked radio button value', () => {
            container.innerHTML = `
                <input type="radio" bx-model="size" value="S">
                <input type="radio" bx-model="size" value="M" checked>
                <input type="radio" bx-model="size" value="L">
            `;
            const data = extractDataFromDOM(container);
            expect(data.size).toBe('M');
        });

        it('should extract select value', () => {
            container.innerHTML = `
                <select bx-model="color">
                    <option value="red">Red</option>
                    <option value="blue" selected>Blue</option>
                    <option value="green">Green</option>
                </select>
            `;
            const data = extractDataFromDOM(container);
            expect(data.color).toBe('blue');
        });

        it('should extract textarea value', () => {
            container.innerHTML = '<textarea bx-model="bio">Hello world</textarea>';
            const data = extractDataFromDOM(container);
            expect(data.bio).toBe('Hello world');
        });

        it('should extract range input as number', () => {
            container.innerHTML = '<input type="range" bx-model="volume" value="75">';
            const data = extractDataFromDOM(container);
            expect(data.volume).toBe(75);
        });

        it('should handle empty inputs', () => {
            container.innerHTML = '<input type="text" bx-model="empty" value="">';
            const data = extractDataFromDOM(container);
            expect(data.empty).toBe('');
        });

        it('should handle colon syntax in model attribute', () => {
            container.innerHTML = '<input type="text" bx-model="search:500" value="query">';
            const data = extractDataFromDOM(container);
            expect(data.search).toBe('query');
        });

        it('should handle multiple inputs', () => {
            container.innerHTML = `
                <input type="text" bx-model="firstName" value="John">
                <input type="text" bx-model="lastName" value="Doe">
                <input type="number" bx-model="age" value="30">
            `;
            const data = extractDataFromDOM(container);
            expect(data.firstName).toBe('John');
            expect(data.lastName).toBe('Doe');
            expect(data.age).toBe(30);
        });

        it('should return empty object for empty container', () => {
            const data = extractDataFromDOM(container);
            expect(data).toEqual({});
        });

        it('should return empty object for null root', () => {
            const data = extractDataFromDOM(null);
            expect(data).toEqual({});
        });

        it('should handle custom prefix', () => {
            container.innerHTML = '<input type="text" data-model="custom" value="test">';
            const data = extractDataFromDOM(container, 'data-');
            expect(data.custom).toBe('test');
        });
    });

    describe('autoInit', () => {
        it('should create reactive data from DOM', () => {
            container.innerHTML = `
                <input type="text" bx-model="name" value="Test">
            `;

            const instance = autoInit(container, { observe: false });

            expect(instance.data).toBeDefined();
            expect(instance.data.name).toBe('Test');
            // bindings array exists even if empty in test environment
            expect(Array.isArray(instance.bindings)).toBe(true);
        });

        it('should return stop method', () => {
            container.innerHTML = '<input type="text" bx-model="test" value="hello">';
            const instance = autoInit(container, { observe: false });

            expect(typeof instance.stop).toBe('function');
        });

        it('should return rescan method', () => {
            container.innerHTML = '<input type="text" bx-model="test" value="hello">';
            const instance = autoInit(container, { observe: false });

            expect(typeof instance.rescan).toBe('function');
        });

        it('should extract data values correctly', () => {
            container.innerHTML = `
                <input type="text" bx-model="message" value="Hello">
                <input type="number" bx-model="count" value="42">
            `;

            const instance = autoInit(container, { observe: false });

            // Core DATAOS behavior: data is extracted from DOM
            expect(instance.data.message).toBe('Hello');
            expect(instance.data.count).toBe(42);
        });
    });

    describe('scan with DATAOS fallback', () => {
        it('should auto-create data when called with null', () => {
            const consoleLog = jest.spyOn(console, 'log').mockImplementation();

            container.innerHTML = '<input type="text" bx-model="field" value="auto">';
            scan(container, null);

            // Core DATAOS behavior: logs that data was extracted from DOM
            expect(consoleLog).toHaveBeenCalledWith(
                expect.stringContaining('DATAOS pattern')
            );

            consoleLog.mockRestore();
        });

        it('should use provided data when available', () => {
            const consoleLog = jest.spyOn(console, 'log').mockImplementation();
            const data = createReactive({ field: 'provided' });
            container.innerHTML = '<input type="text" bx-model="field" value="ignored">';

            scan(container, data);

            // Should NOT log DATAOS pattern when data is provided
            expect(consoleLog).not.toHaveBeenCalledWith(
                expect.stringContaining('DATAOS pattern')
            );
            // The data should remain unchanged
            expect(data.field).toBe('provided');

            consoleLog.mockRestore();
        });
    });
});
