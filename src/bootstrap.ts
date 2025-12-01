import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeFaroMonitoring } from './app/config/faro.config';

// Inicializa Grafana Faro para monitoramento e observabilidade
initializeFaroMonitoring();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
