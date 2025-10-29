/**
 * Sample HTML fixtures for testing
 */

module.exports = {
    // FormatX fixtures
    currencyElement: '<span fx-format="currency" fx-currency="USD" fx-raw="25.00">25.00</span>',

    euroElement: '<span fx-format="currency" fx-currency="EUR" fx-locale="de-DE" fx-raw="99.99">99.99</span>',

    dateElement: '<span fx-format="date" fx-date-format="short" fx-raw="2024-03-15">2024-03-15</span>',

    percentageElement: '<span fx-format="percent" fx-raw="0.75">0.75</span>',

    phoneElement: '<span fx-format="phone" fx-phone-format="US">5551234567</span>',

    // AccessX fixtures
    accessibleButton: '<button ax-enhance="button" ax-pressed="false">Toggle</button>',

    requiredInput: '<input type="email" ax-enhance="form" ax-required="true" ax-help="Please enter a valid email address">',

    invalidInput: '<input type="email" ax-enhance="form" ax-invalid="true" ax-error="Invalid email format">',

    liveRegion: '<div ax-enhance="live" ax-priority="polite" ax-status="true">Status message</div>',

    accessibleNav: `<nav ax-enhance="nav" ax-label="Main navigation">
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>`,

    accessibleTable: `<table ax-enhance="table" ax-auto-headers="true">
        <tr>
            <td>Product</td>
            <td>Price</td>
            <td>Quantity</td>
        </tr>
        <tr>
            <td>Widget</td>
            <td>$10.00</td>
            <td>5</td>
        </tr>
    </table>`,

    // Complete page templates
    basicPage: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Page</title>
</head>
<body>
    <span fx-format="currency" fx-raw="25.00">25.00</span>
    <button ax-enhance="button">Click</button>
</body>
</html>`,

    multiModulePage: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Multi-Module Test</title>
</head>
<body>
    <span fx-format="currency" fx-currency="USD" fx-raw="1234.56">1234.56</span>
    <span fx-format="date" fx-date-format="long" fx-raw="2024-03-15">2024-03-15</span>
    <button ax-enhance="button" ax-pressed="false">Toggle</button>
    <nav ax-enhance="nav" ax-label="Main">
        <a href="/home">Home</a>
    </nav>
</body>
</html>`,

    performanceTestPage: (count) => {
        const elements = [];
        for (let i = 0; i < count; i++) {
            elements.push(`<span fx-format="currency" fx-raw="99.99">99.99</span>`);
        }
        return `<!DOCTYPE html>
<html>
<head><title>Performance Test</title></head>
<body>${elements.join('\n')}</body>
</html>`;
    }
};
