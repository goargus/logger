module.exports = {
  default: {
    require: [
      'support/env.ts',
      'support/**/*.ts',
      'step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      ['html', 'reports/cucumber-report.html'],
      ['json', 'reports/cucumber-report.json']
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    paths: ['features/**/*.feature'],
    worldParameters: {
      baseApiUrl: process.env.E2E_API_URL || 'http://localhost:3001',
      baseFrontendUrl: process.env.E2E_FRONTEND_URL || 'http://localhost:8081'
    }
  },

  smoke: {
    require: [
      'support/env.ts',
      'support/**/*.ts',
      'step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', ['html', 'reports/smoke-report.html']],
    paths: ['features/**/*.feature'],
    tags: '@smoke'
  },

  api: {
    require: [
      'support/env.ts',
      'support/**/*.ts',
      'step-definitions/api/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: ['progress-bar'],
    paths: ['features/api/**/*.feature']
  },

  ui: {
    require: [
      'support/env.ts',
      'support/**/*.ts',
      'step-definitions/ui/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: ['progress-bar'],
    paths: ['features/ui/**/*.feature']
  }
};
