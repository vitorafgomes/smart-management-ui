const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'smart-admin',


  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // CommonJS packages that don't work well with ES modules
    'lodash.merge',
    'lodash-es/throttle.js',
    'lodash-es/debounce.js',
    // jsvectormap - entire package and sub-paths (CommonJS not compatible with ES modules)
    'jsvectormap',
    'jsvectormap/dist/maps/world.js',
    'jsvectormap/dist/maps/world-merc.js',
    // Node.js built-in modules
    'crypto',
    'os',
    'fs',
    'worker_threads',
    'url',
    'tty',
    'module',
    'util',
    'path',
    'perf_hooks',
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // New feature for more performance and avoiding
    // issues with node libs. Comment this out to
    // get the traditional behavior:
    ignoreUnusedDeps: true
  }
});
