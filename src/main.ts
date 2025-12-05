import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeOpenTelemetry } from './app/config/otel.config';
import { environment } from './environments/environment';

// Initialize OpenTelemetry for monitoring and observability
initializeOpenTelemetry({
  serviceName: 'smart-management-ui',
  serviceVersion: environment.app.version,
  environment: environment.production ? 'production' : 'development',
  collectorUrl: environment.external.otelCollectorUrl,
  enabled: environment.external.otelEnabled
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
