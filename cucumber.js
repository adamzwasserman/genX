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
        parallel: 2
    }
};
