module.exports = {
    default: {
        require: [
            'tests/support/**/*.js',
            'tests/step_definitions/**/*.js'
        ],
        format: [
            'progress-bar',
            'html:tests/reports/cucumber-report.html',
            'json:tests/reports/cucumber-report.json'
        ],
        publishQuiet: true,
        parallel: 2
    }
};
