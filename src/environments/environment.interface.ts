export interface Environment {
  production: boolean;

  // API Configuration
  apiUrl: string;

  // Keycloak Configuration
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };

  // Feature Flags
  features: {
    enableAuditLogs: boolean;
    enableMultiTenant: boolean;
    enableAdvancedFilters: boolean;
    enableRealTimeNotifications: boolean;
  };

  // Application Settings
  app: {
    name: string;
    version: string;
    defaultLanguage: string;
    supportedLanguages: string[];
    defaultCurrency: string;
    defaultTimezone: string;
  };

  // Pagination Settings
  pagination: {
    defaultPageSize: number;
    pageSizeOptions: number[];
  };

  // Cache Settings
  cache: {
    ttl: number;
    maxSize: number;
  };

  // Session Settings
  session: {
    timeout: number;
    warningTime: number;
  };

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
  };

  // External Services / Telemetry
  external: {
    otelCollectorUrl: string;
    otelEnabled: boolean;
    analyticsEnabled: boolean;
  };
}
