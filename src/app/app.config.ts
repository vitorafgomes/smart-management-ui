import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { OtelErrorHandler } from './core/services/telemetry/otel-error-handler.service';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { authInterceptor, tenantInterceptor } from './core/interceptors/auth.interceptor';
import { KeycloakAuthService } from './core/services/auth/keycloak-auth.service';

/**
 * Initialize authentication on app startup
 * Tries to restore session from stored realm
 */
function initializeAuth(): () => Promise<boolean> {
  const authService = inject(KeycloakAuthService);
  return () => authService.tryRestoreSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(withInterceptors([
      authInterceptor,
      tenantInterceptor,
      mockApiInterceptor
    ])),
    provideToastr(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    // OpenTelemetry error handler for error capture
    { provide: ErrorHandler, useClass: OtelErrorHandler },
    // Initialize Keycloak authentication on app startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true
    }
  ]
};
