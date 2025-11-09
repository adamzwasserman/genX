module.exports = {
    default: {
        requireModule: ['@babel/register'],
        require: [
            'tests/support/**/*.js',
            'tests/step_definitions/**/*.js'
        ],
        paths: ['tests/features/**/*.feature'],
        format: [
            'progress-bar',
            'html:tests/reports/cucumber-report.html',
            'json:tests/reports/cucumber-report.json'
        ],
        publishQuiet: true,
        parallel: 2,
        timeout: 30000
    },

    // Profile for base safety tests only (critical generic tests)
    'base-safety': {
        requireModule: ['@babel/register'],
        require: [
            'tests/support/**/*.js',
            'tests/step_definitions/**/*.js'
        ],
        paths: ['tests/features/base-module-safety.feature'],
        tags: '@critical',
        format: ['progress-bar'],
        timeout: 30000
    },

    // Profile for mutation safety tests
    'mutation-safety': {
        paths: ['tests/features/base-module-safety.feature'],
        tags: '@mutation-safety'
    },

    // Profile for performance tests
    performance: {
        requireModule: ['@babel/register'],
        require: [
            'tests/support/**/*.js',
            'tests/step_definitions/**/*.js'
        ],
        paths: ['tests/features/**/*.feature'],
        tags: '@performance',
        format: ['progress-bar'],
        timeout: 30000
    },

    // Profile for security/XSS tests
    security: {
        requireModule: ['@babel/register'],
        require: [
            'tests/support/**/*.js',
            'tests/step_definitions/**/*.js'
        ],
        paths: ['tests/features/**/*.feature'],
        tags: '@xss-prevention',
        format: ['progress-bar'],
        timeout: 30000
    },

    // Profile for module-specific features (exclude base safety)
    'module-features': {
        paths: ['tests/features/**/*.feature'],
        pathsExclude: ['tests/features/base-module-safety.feature']
    },

    // Profile for CI (critical tests only, fast)
    ci: {
        requireModule: ['@babel/register'],
        require: [
            'tests/support/**/*.js',
            'tests/step_definitions/**/*.js'
        ],
        paths: ['tests/features/**/*.feature'],
        tags: '@critical',
        format: ['progress-bar'],
        parallel: 4,
        retry: 2,
        timeout: 30000
    }
};
