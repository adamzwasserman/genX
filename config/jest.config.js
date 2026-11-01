module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/../tests/unit', '<rootDir>/../tests/integration'],
    testMatch: ['**/*.test.js', '**/*.spec.js'],
    // Defines perfIt / perfTest for timing-threshold tests
    setupFilesAfterEnv: ['<rootDir>/jest.perf-setup.js'],

    collectCoverageFrom: [
        '../src/**/*.js',
        '!../src/**/*.test.js',
        '!../src/**/*.spec.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    coverageDirectory: '../tests/reports/coverage',
    verbose: true,
    transform: {
        '^.+\\.js$': 'babel-jest'
    }
};
