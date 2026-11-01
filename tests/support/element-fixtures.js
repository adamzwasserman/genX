/**
 * One step owns every "an element with name="value" ..." line.
 *
 * Module step files used to define their own fixtures for lines such as
 * `an element with fx-format="currency"`, while polymorphic-notation.steps.js
 * defined a catch-all `an element with {word}={string}`. Both matched, so
 * cucumber reported the scenarios as ambiguous. Module files now register
 * their fixtures with defineElement(); the single step in
 * polymorphic-notation.steps.js parses the attribute list and runs the
 * fixture registered for exactly those attributes, or builds the generic
 * span#test-element when no module registered one.
 */

const registry = [];

const TOKEN = /([\w:.-]+)=(?:\{string\}|"([^"]*)"|'([^']*)')/g;

/** Parse `name={string}` / `name="literal"` tokens out of a step pattern. */
function parsePattern(pattern) {
    const body = pattern.replace(/^an element with /, '');
    const tokens = [];
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(body)) !== null) {
        const literal = m[2] !== undefined ? m[2] : m[3];
        tokens.push({ name: m[1], literal });
    }
    const rebuilt = tokens
        .map(t => (t.literal === undefined ? `${t.name}={string}` : `${t.name}="${t.literal}"`))
        .join(' ');
    if (rebuilt !== body) {
        throw new Error(`defineElement: unsupported pattern "${pattern}"`);
    }
    return tokens;
}

/**
 * Register a fixture. The function receives the {string} values in order,
 * with `this` bound to the cucumber World, exactly as a Given would.
 */
function defineElement(pattern, fn) {
    const tokens = parsePattern(pattern);
    const key = tokens.map(t => t.name).join(' ');
    const clash = registry.find(r => r.key === key &&
        r.tokens.every((t, i) => t.literal === tokens[i].literal));
    if (clash) throw new Error(`defineElement: "${pattern}" is already defined`);
    registry.push({ pattern, key, tokens, fn });
}

/** Parse the attribute list of a concrete step line into [{name, value}]. */
function parseAttributes(text) {
    const pairs = [];
    let m;
    TOKEN.lastIndex = 0;
    const re = /([\w:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
    while ((m = re.exec(text)) !== null) {
        pairs.push({ name: m[1], value: m[2] !== undefined ? m[2] : m[3] });
    }
    return pairs;
}

/** Find the registered fixture for these attributes; literal matches win. */
function findElement(pairs) {
    const key = pairs.map(p => p.name).join(' ');
    const candidates = registry.filter(r => r.key === key &&
        r.tokens.every((t, i) => t.literal === undefined || t.literal === pairs[i].value));
    candidates.sort((a, b) =>
        b.tokens.filter(t => t.literal !== undefined).length -
        a.tokens.filter(t => t.literal !== undefined).length);
    const hit = candidates[0];
    if (!hit) return null;
    const args = pairs.filter((p, i) => hit.tokens[i].literal === undefined).map(p => p.value);
    return { fn: hit.fn, args };
}

module.exports = { defineElement, findElement, parseAttributes };
