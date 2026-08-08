import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';

import { correlationInterceptor } from '@shared-kernel/correlation/correlation.interceptor';
import { GlobalErrorHandler } from '@shared-kernel/errors/global-error-handler';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withViewTransitions(),
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(withInterceptors([correlationInterceptor])),
  ],
};
