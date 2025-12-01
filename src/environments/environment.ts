// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,

  // API Configuration
  apiUrl: 'http://localhost:5229' +
    '' +
    '',

  // Keycloak Configuration
  keycloak: {
    url: 'https://keycloak.vitorafgomes.net',
    realm: 'smart-management',
    clientId: 'smart-management-ui'
  },

  // Feature Flags
  features: {
    enableAuditLogs: true,
    enableMultiTenant: true,
    enableAdvancedFilters: true,
    enableRealTimeNotifications: false
  },

  // Application Settings
  app: {
    name: 'Smart Management',
    version: '1.0.0',
    defaultLanguage: 'en-US',
    supportedLanguages: ['en-US', 'pt-BR', 'es-ES'],
    defaultCurrency: 'USD',
    defaultTimezone: 'America/New_York'
  },

  // Pagination Settings
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100]
  },

  // Cache Settings
  cache: {
    ttl: 300000, // 5 minutes in milliseconds
    maxSize: 100
  },

  // Session Settings
  session: {
    timeout: 3600000, // 1 hour in milliseconds
    warningTime: 300000 // 5 minutes before timeout
  },

  // Logging
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false
  },

  // External Services
  external: {
    faroUrl: 'https://faro.vitorafgomes.net/v1/traces',
    analyticsEnabled: false
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
