/* eslint-env jest */
/**
 * tableX reads table settings from the bootloader's parse cache
 * (window.genx.getConfig) and falls back to attributes only without it.
 */

const tableX = require('../../src/tablex.js');

const { getTableConfig } = tableX._internals;

describe('tableX - configuration cache', () => {
    let table;

    beforeEach(() => {
        table = document.createElement('table');
        table.setAttribute('tx-per-page', '10');
    });

    afterEach(() => {
        delete window.genx;
        jest.restoreAllMocks();
    });

    it('takes the value from getConfig without reading the attribute', () => {
        window.genx = { getConfig: jest.fn(() => ({ perPage: 25 })) };
        const getAttribute = jest.spyOn(table, 'getAttribute');

        expect(getTableConfig(table, 'tx-per-page', '10')).toBe('25');
        expect(window.genx.getConfig).toHaveBeenCalledWith(table);
        expect(getAttribute).not.toHaveBeenCalled();
    });

    it('falls back to the attribute when the cache has no entry', () => {
        window.genx = { getConfig: jest.fn() };
        window.genx.getConfig.mockReturnValue(null);

        expect(getTableConfig(table, 'tx-per-page', '5')).toBe('10');
        expect(window.genx.getConfig).toHaveBeenCalled();
    });

    it('falls back to the attribute when the cache lacks the key', () => {
        window.genx = { getConfig: jest.fn(() => ({ sortable: 'true' })) };

        expect(getTableConfig(table, 'tx-per-page', '5')).toBe('10');
    });

    it('reads attributes in standalone mode, without the bootloader', () => {
        expect(getTableConfig(table, 'tx-per-page', '5')).toBe('10');
        expect(getTableConfig(table, 'tx-filter-columns')).toBeNull();
    });
});
