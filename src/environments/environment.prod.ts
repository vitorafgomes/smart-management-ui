import { Environment } from './environment.interface';

export const environment: Environment = {
  production: true,

  // API Configuration
  apiUrl: 'https://api.vitorafgomes.net/identity-tenant',

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
    enableRealTimeNotifications: true
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
    ttl: 600000, // 10 minutes in milliseconds
    maxSize: 200
  },

  // Session Settings
  session: {
    timeout: 3600000, // 1 hour in milliseconds
    warningTime: 300000 // 5 minutes before timeout
  },

  // Logging
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true
  },

  // External Services / Telemetry
  external: {
    otelCollectorUrl: 'https://otel.vitorafgomes.net/v1/traces',
    otelEnabled: true,
    analyticsEnabled: true
  }
};
