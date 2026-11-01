// Timing-threshold tests use perfIt / perfTest. They are skipped unless
// GENX_PERF=1 is set, so hook runs don't fail on a slow machine:
//   GENX_PERF=1 npx jest --config config/jest.config.js tests/unit
const runPerf = process.env.GENX_PERF === '1';
global.perfIt = runPerf ? global.it : global.it.skip;
global.perfTest = runPerf ? global.test : global.test.skip;
