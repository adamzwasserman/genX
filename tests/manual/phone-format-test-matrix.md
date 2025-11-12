# Phone Number Format Test Matrix

This document shows all permutations of input formats and output formats for the phone number formatter.

## Test Cases

### Input: `5551234567` (Raw 10 digits)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `(555) 123-4567` | Standard US format with parens |
| `us-dash` | `555-123-4567` | US format with dashes |
| `us-dot` | `555.123.4567` | US format with dots |
| `intl` | `+1 555 123 4567` | International format, assumes US country code |

---

### Input: `555-123-4567` (Already US formatted with dashes)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `(555) 123-4567` | Strip dashes, reformat to standard US |
| `us-dash` | `555-123-4567` | Already correct format |
| `us-dot` | `555.123.4567` | Strip dashes, reformat with dots |
| `intl` | `+1 555 123 4567` | Strip dashes, format international |

---

### Input: `(555) 123-4567` (Already US formatted with parens)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `(555) 123-4567` | Already correct format |
| `us-dash` | `555-123-4567` | Strip all formatting, reformat with dashes |
| `us-dot` | `555.123.4567` | Strip all formatting, reformat with dots |
| `intl` | `+1 555 123 4567` | Strip all formatting, format international |

---

### Input: `555.123.4567` (Dot separated)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `(555) 123-4567` | Strip dots, reformat to standard US |
| `us-dash` | `555-123-4567` | Strip dots, reformat with dashes |
| `us-dot` | `555.123.4567` | Already correct format |
| `intl` | `+1 555 123 4567` | Strip dots, format international |

---

### Input: `14155551234` (11 digits with country code)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `(415) 555-1234` | Strip country code (1), format remaining 10 digits |
| `us-dash` | `415-555-1234` | Strip country code (1), format with dashes |
| `us-dot` | `415.555.1234` | Strip country code (1), format with dots |
| `intl` | `+1 415 555 1234` | Keep country code, format international |

---

### Input: `  555 123 4567  ` (Extra spaces)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `(555) 123-4567` | Strip all spaces, check stripped length = 10 |
| `us-dash` | `555-123-4567` | Strip all spaces, check stripped length = 10 |
| `us-dot` | `555.123.4567` | Strip all spaces, check stripped length = 10 |
| `intl` | `+1 555 123 4567` | Strip all spaces, check stripped length = 10 |

---

### Input: `+44 20 7946 0958` (UK number - EU format)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `+44 20 7946 0958` | Not a US number, return as-is |
| `us-dash` | `+44 20 7946 0958` | Not a US number, return as-is |
| `us-dot` | `+44 20 7946 0958` | Not a US number, return as-is |
| `intl` | `+44 20 7946 0958` | EU format, already correct |

---

### Input: `+33 1 42 86 82 00` (France number - EU format)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `+33 1 42 86 82 00` | Not a US number, return as-is |
| `us-dash` | `+33 1 42 86 82 00` | Not a US number, return as-is |
| `us-dot` | `+33 1 42 86 82 00` | Not a US number, return as-is |
| `intl` | `+33 1 42 86 82 00` | EU format, already correct |

---

### Input: `  +44  20  7946  0958  ` (UK number with extra spaces)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `+44 20 7946 0958` | Not US, clean up spaces, return formatted EU |
| `us-dash` | `+44 20 7946 0958` | Not US, clean up spaces, return formatted EU |
| `us-dot` | `+44 20 7946 0958` | Not US, clean up spaces, return formatted EU |
| `intl` | `+44 20 7946 0958` | Clean up extra spaces, format EU style |

---

### Input: `004420794609 58` (UK with 00 prefix and spaces)

| Output Format | Expected Output | Notes |
|--------------|----------------|-------|
| `us` | `+44 20 7946 0958` | Convert 00 to +, clean spaces, return EU format |
| `us-dash` | `+44 20 7946 0958` | Convert 00 to +, clean spaces, return EU format |
| `us-dot` | `+44 20 7946 0958` | Convert 00 to +, clean spaces, return EU format |
| `intl` | `+44 20 7946 0958` | Convert 00 to +, clean spaces, format EU style |

---

## Current Implementation Analysis

Looking at the code in `src/fmtx.js` lines 224-229:

```javascript
case 'phone': {
    const clean = str.replace(/\D/g, '');
    const pf = rest.phoneFormat || 'us';
    if (pf === 'us' && clean.length === 10)
        return `(${clean.slice(0,3)}) ${clean.slice(3,6)}-${clean.slice(6)}`;
    if (pf === 'intl' && clean.length >= 10)
        return `+${clean.slice(0,2)} ${clean.slice(2,5)} ${clean.slice(5,8)} ${clean.slice(8)}`;
    return str;
}
```

### Issues I See:

1. **US format with 11 digits**: If input is `14155551234` (11 digits), US format check fails because `clean.length === 10` is false. Returns original string instead.

2. **International format assumption**: The intl format assumes first 2 digits are country code (`+${clean.slice(0,2)}`), which works for most countries but not for US (country code is `1`, not `14`).

3. **International format with 10 digits**: If input is `5551234567` (10 digits) with intl format, it formats as `+55 512 345 67` instead of `+1 555 123 4567`.

### My Proposed Expected Behavior

**Detection Logic:**

1. Check if input starts with `+` or `00` (international indicator)
2. If yes, treat as international/EU number
3. If no, strip all non-digits and check length to determine US vs non-US

**For US formats (`phoneFormat: 'us'`, `'us-dash'`, `'us-dot'`)**:

- If input starts with `+` or `00` and is not US (+1): return normalized EU format
- Otherwise, strip all non-digit characters
- Check stripped length
- If 11 digits starting with `1`, strip the leading `1`
- If stripped length is now 10, format accordingly:
  - `us` → `(XXX) XXX-XXXX`
  - `us-dash` → `XXX-XXX-XXXX`
  - `us-dot` → `XXX.XXX.XXXX`
- Otherwise, return original string (or normalized if EU format detected)

**For International format (`phoneFormat: 'intl'`)**:

- If input starts with `+`: clean up extra spaces, return normalized EU format
- If input starts with `00`: convert to `+`, clean up spaces, return normalized EU format
- Otherwise, strip all non-digit characters
- Check stripped length:
  - If 10 digits: assume US, prepend `+1`, format as `+1 XXX XXX XXXX`
  - If 11 digits starting with `1`: assume US, format as `+1 XXX XXX XXXX`
  - If 11+ digits not starting with `1`: assume first 1-3 digits are country code
- Otherwise, return original string

---

## Please Review and Correct

**Instructions**: Review each test case above. If the expected output is wrong, correct it. Add any additional test cases I missed.
