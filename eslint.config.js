// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

/**
 * Architecture enforcement: the executable form of ADR 0001 and of the layer dependency table
 * in vault/pages/conventions/modular-architecture.md. Element patterns match folder paths from
 * the right, so each is written relative to its parent. The first matching type wins, which is
 * why the four layers are declared before the module public API.
 */
const architectureSettings = {
  'boundaries/elements': [
    { type: 'domain', pattern: ['modules/*/domain', 'modules/*/domain/**'], capture: ['module'] },
    {
      type: 'application',
      pattern: ['modules/*/application', 'modules/*/application/**'],
      capture: ['module'],
    },
    {
      type: 'infrastructure',
      pattern: ['modules/*/infrastructure', 'modules/*/infrastructure/**'],
      capture: ['module'],
    },
    { type: 'ui', pattern: ['modules/*/ui', 'modules/*/ui/**'], capture: ['module'] },
    { type: 'module-public-api', pattern: 'modules/*', capture: ['module'] },
    { type: 'shared-kernel', pattern: ['app/shared-kernel', 'app/shared-kernel/**'] },
    { type: 'shell', pattern: ['src', 'app', 'app/shell', 'app/shell/**'] },
  ],
  'import/resolver': {
    typescript: { alwaysTryTypes: true },
  },
};

const sameModule = { module: '{{ from.element.captured.module }}' };
const otherModule = { module: '!{{ from.element.captured.module }}' };

const architecturePolicies = [
  // Third-party packages are not part of the architecture graph.
  { allow: { to: { module: { origin: 'external' } } } },

  // The shared kernel is self-contained: it knows nothing about any module.
  {
    from: { element: { type: 'shared-kernel' } },
    allow: { to: { element: { type: 'shared-kernel' } } },
  },

  // Domain: its own module's domain only. Pure TypeScript, no shared kernel, no other layer.
  // Framework packages are external, so they sit outside this graph - the no-restricted-imports
  // block below is what keeps Angular and RxJS out of domain/.
  {
    from: { element: { type: 'domain' } },
    allow: { to: { element: { type: 'domain', captured: sameModule } } },
  },

  // Application: its own domain, the shared kernel, and other modules' public APIs.
  {
    from: { element: { type: 'application' } },
    allow: {
      to: [
        { element: { types: ['application', 'domain'], captured: sameModule } },
        { element: { type: 'shared-kernel' } },
        { element: { type: 'module-public-api', captured: otherModule } },
      ],
    },
  },

  // Infrastructure: its own domain, the shared kernel, and other modules' public APIs.
  // It implements the ports domain declares; nothing here reaches into ui or application.
  {
    from: { element: { type: 'infrastructure' } },
    allow: {
      to: [
        { element: { types: ['infrastructure', 'domain'], captured: sameModule } },
        { element: { type: 'shared-kernel' } },
        { element: { type: 'module-public-api', captured: otherModule } },
      ],
    },
  },

  // UI: its own application and domain layers, the shared kernel, and other modules' public
  // APIs. Never infrastructure - adapters are bound by the module's public API.
  {
    from: { element: { type: 'ui' } },
    allow: {
      to: [
        { element: { types: ['ui', 'application', 'domain'], captured: sameModule } },
        { element: { type: 'shared-kernel' } },
        { element: { type: 'module-public-api', captured: otherModule } },
      ],
    },
  },

  // The public API is the module's composition root: the one place that may name both a port
  // and its adapter.
  {
    from: { element: { type: 'module-public-api' } },
    allow: {
      to: [
        {
          element: {
            types: ['domain', 'application', 'infrastructure', 'ui'],
            captured: sameModule,
          },
        },
        { element: { type: 'shared-kernel' } },
      ],
    },
  },

  // The shell composes the application: modules only through their public API.
  {
    from: { element: { type: 'shell' } },
    allow: { to: [{ element: { types: ['shell', 'shared-kernel', 'module-public-api'] } }] },
  },
];

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'vault/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    plugins: { boundaries },
    processor: angular.processInlineTemplates,
    settings: architectureSettings,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // A deep alias path does not resolve through the tsconfig mapping, so the boundaries
      // graph sees it as an external package rather than as another module's internals.
      // See vault/pages/invariants/module-boundaries.md.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@modules/[^/]+/.+',
              message:
                'A module is reached only through its public API: import @modules/<context>, never a path inside it. See vault/pages/invariants/module-boundaries.md.',
            },
          ],
        },
      ],
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{ from.element.types.[0] }} is not allowed to import {{ to.element.types.[0] }}. See vault/pages/conventions/modular-architecture.md.',
          policies: architecturePolicies,
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  {
    // Domain layer purity. The boundaries graph covers imports from other layers and modules;
    // this covers external packages, which that graph treats as always-allowed.
    // See vault/pages/invariants/domain-layer-purity.md.
    files: ['src/app/modules/*/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*', '@angular/*/**', 'rxjs', 'rxjs/*'],
              message:
                'The domain layer imports no framework: no Angular, no RxJS, no HTTP client. See vault/pages/invariants/domain-layer-purity.md.',
            },
            {
              // Repeated from the base block: flat config replaces rule options, it does not
              // merge them, so dropping this here would exempt domain/ from the alias rule.
              regex: '^@modules/[^/]+/.+',
              message:
                'A module is reached only through its public API: import @modules/<context>, never a path inside it. See vault/pages/invariants/module-boundaries.md.',
            },
          ],
        },
      ],
    },
  },
  {
    // The E2E suite drives the app from outside; it is not part of the architecture graph.
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    rules: {
      'boundaries/no-unknown-dependencies': 'off',
      'boundaries/dependencies': 'off',
    },
  },
]);
