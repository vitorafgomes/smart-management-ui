import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Runtime configuration that can be injected via Kubernetes ConfigMap
 * This allows configuration changes without rebuilding the application
 */
export interface RuntimeConfig {
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

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
  };

  // External Services
  external: {
    faroUrl: string;
    analyticsEnabled: boolean;
  };

  // MFE Configuration (for federation)
  mfe?: {
    tenantSettings?: {
      remoteEntry: string;
      exposedModule: string;
    };
    users?: {
      remoteEntry: string;
      exposedModule: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private config: RuntimeConfig | null = null;
  private readonly http = inject(HttpClient);

  /**
   * Load configuration from /assets/config/config.json
   * This file can be mounted from a Kubernetes ConfigMap
   */
  async loadConfig(): Promise<RuntimeConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      // Try to load runtime config first (from ConfigMap)
      this.config = await firstValueFrom(
        this.http.get<RuntimeConfig>('/assets/config/config.json')
      );
      console.log('[RuntimeConfig] Loaded configuration from config.json');
    } catch (error) {
      console.warn('[RuntimeConfig] Could not load config.json, using defaults');
      // Fallback to default configuration
      this.config = this.getDefaultConfig();
    }

    return this.config;
  }

  /**
   * Get the current configuration
   * Throws if config hasn't been loaded yet
   */
  get(): RuntimeConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Get a specific configuration value
   */
  getValue<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.get()[key];
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof RuntimeConfig['features']): boolean {
    return this.get().features[feature] ?? false;
  }

  /**
   * Default configuration (fallback)
   */
  private getDefaultConfig(): RuntimeConfig {
    return {
      apiUrl: 'https://api.vitorafgomes.net/identity-tenant',
      keycloak: {
        url: 'https://keycloak.vitorafgomes.net',
        realm: 'smart-management',
        clientId: 'smart-management-ui'
      },
      features: {
        enableAuditLogs: true,
        enableMultiTenant: true,
        enableAdvancedFilters: true,
        enableRealTimeNotifications: true
      },
      app: {
        name: 'Smart Management',
        version: '1.0.0',
        defaultLanguage: 'en-US',
        supportedLanguages: ['en-US', 'pt-BR', 'es-ES'],
        defaultCurrency: 'USD',
        defaultTimezone: 'America/New_York'
      },
      logging: {
        level: 'error',
        enableConsole: false,
        enableRemote: true
      },
      external: {
        faroUrl: 'https://faro.vitorafgomes.net/v1/traces',
        analyticsEnabled: true
      },
      mfe: {
        tenantSettings: {
          remoteEntry: '/mfe-tenant/remoteEntry.js',
          exposedModule: './TenantSettingsModule'
        },
        users: {
          remoteEntry: '/mfe-users/remoteEntry.js',
          exposedModule: './UsersModule'
        }
      }
    };
  }
}

/**
 * APP_INITIALIZER factory to load config before app starts
 */
export function initializeConfig(configService: RuntimeConfigService) {
  return () => configService.loadConfig();
}
