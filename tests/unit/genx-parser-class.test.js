/**
 * Tests for genx-parser-class parser
 */
import { describe, it, expect } from '@jest/globals';
import {
  parse,
  mapSegmentsToConfig,
  getGenXClassForPrefix,
  mapClassStringToConfig,
  // isSafeToken isn't exported earlier; test via indirect behavior
  DEFAULT_OPTIONS
} from '../../src/parsers/genx-parser-class.js';

describe('genx-parser-class', () => {
  it('returns baseConfig when element has no class', () => {
    const el = document.createElement('div');
    const base = { a: 1 };
    const res = parse(el, 'fx', base);
    expect(res.a).toBe(1);
  });

  it('parses first matching genX class using classList', () => {
    const el = document.createElement('div');
    el.className = 'other fmt-currency-USD-5 fmt-format-OTHER-7';

    const res = parse(el, 'fx');

    // CARDINALITY_ORDERS.fx = ['format','currency','decimals',...]
    expect(res.format).toBe('currency');
    expect(res.currency).toBe('USD');
    // decimals should be coerced to number by default
    expect(res.decimals).toBe(5);
  });

  it('skips overly long segments', () => {
    const el = document.createElement('div');
    const long = 'a'.repeat(DEFAULT_OPTIONS.maxSegmentLength + 20);
    el.className = `fmt-${long}-X-Y`;

    const res = parse(el, 'fx');
    // first segment maps to 'format' but should be skipped due to length
    expect(res.format).toBeUndefined();
  });

  it('respects coerceNumbers option', () => {
    const el = document.createElement('div');
    el.className = 'fmt-a-b-42';

    const coerced = parse(el, 'fx', {}, { coerceNumbers: true });
    expect(coerced.decimals).toBe(42);

    const notCoerced = parse(el, 'fx', {}, { coerceNumbers: false });
    expect(notCoerced.decimals).toBe('42');
  });

  it('prevents prototype pollution via dangerous keys', () => {
    const cfg = {};
    const order = ['__proto__', 'safeKey'];
    const segments = ['polluted', 'value'];

    mapSegmentsToConfig(cfg, order, segments, { coerceNumbers: false });

    expect(cfg.hasOwnProperty('__proto__')).toBe(false);
    expect(cfg.safeKey).toBe('value');
    expect(Object.prototype.polluted).toBeUndefined();
  });

  it('isSafeToken: rejects unsafe tokens and accepts safe ones', () => {
    const el = document.createElement('div');
    // put unsafe token as second segment of the same genX class
    el.className = 'fmt-good_token-bad!token-1';

    const res = parse(el, 'fx', {}, { coerceNumbers: false });
    // 'good_token' maps to format and should be accepted
    expect(res.format).toBe('good_token');
    // second segment is unsafe and should be rejected, so currency should be undefined
    expect(res.currency).toBeUndefined();
  });

  it('mapClassStringToConfig: maps directly from class string without split', () => {
    const cfg = {};
    const order = ['format', 'currency', 'decimals'];
    const classStr = 'fmt-currency-USD-3-extra';

    mapClassStringToConfig(cfg, order, classStr, { coerceNumbers: true });
    expect(cfg.format).toBe('currency');
    expect(cfg.currency).toBe('USD');
    expect(cfg.decimals).toBe(3);
    // 'extra' maps beyond order and should be ignored
    expect(cfg.extra).toBeUndefined();
  });

  it('micro-benchmark: parses many elements quickly (non-strict check)', () => {
    const elements = [];
    for (let i = 0; i < 1000; i++) {
      const el = document.createElement('div');
      el.className = `fmt-format-${i % 10}-${i}`;
      elements.push(el);
    }

    const start = performance.now();
    for (const el of elements) parse(el, 'fx');
    const duration = performance.now() - start;

    // Non-strict: ensure the test is informative but not flaky. Expect < 1000ms for 1000 parses.
    expect(duration).toBeLessThan(1000);
  });
});
