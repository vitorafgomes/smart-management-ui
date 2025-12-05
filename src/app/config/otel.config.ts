import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, context } from '@opentelemetry/api';

export interface OtelConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  collectorUrl: string;
  enabled: boolean;
}

let tracerProvider: WebTracerProvider | null = null;
let isInitialized = false;

/**
 * Initialize OpenTelemetry for browser/Angular application
 */
export function initializeOpenTelemetry(config: OtelConfig): void {
  if (isInitialized) {
    console.warn('[OTEL] OpenTelemetry already initialized');
    return;
  }

  if (!config.enabled) {
    console.log('[OTEL] OpenTelemetry disabled by configuration');
    return;
  }

  try {
    // Create resource with service information
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
      'deployment.environment.name': config.environment,
    });

    // Create OTLP exporter
    const exporter = new OTLPTraceExporter({
      url: config.collectorUrl,
      headers: {},
    });

    // Create tracer provider
    tracerProvider = new WebTracerProvider({
      resource,
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });

    // Register context manager for zone.js (Angular)
    tracerProvider.register({
      contextManager: new ZoneContextManager(),
    });

    // Register auto-instrumentations
    registerInstrumentations({
      instrumentations: [
        // Fetch API instrumentation
        new FetchInstrumentation({
          // Exclude Keycloak/auth endpoints from trace header propagation (CORS issue)
          propagateTraceHeaderCorsUrls: [/^(?!.*keycloak).*$/i],
          clearTimingResources: true,
          applyCustomAttributesOnSpan: (span, request, response) => {
            span.setAttribute('http.request.method', request.method || 'GET');
            if (response && 'status' in response && response.status !== undefined) {
              span.setAttribute('http.response.status_code', response.status);
            }
          },
        }),
        // XMLHttpRequest instrumentation
        new XMLHttpRequestInstrumentation({
          // Exclude Keycloak/auth endpoints from trace header propagation (CORS issue)
          propagateTraceHeaderCorsUrls: [/^(?!.*keycloak).*$/i],
        }),
        // Document load instrumentation (page load metrics)
        new DocumentLoadInstrumentation(),
        // User interaction instrumentation (clicks, etc.)
        new UserInteractionInstrumentation({
          eventNames: ['click', 'submit'],
        }),
      ],
    });

    isInitialized = true;
    console.log(`[OTEL] OpenTelemetry initialized for ${config.serviceName} v${config.serviceVersion}`);
    console.log(`[OTEL] Collector URL: ${config.collectorUrl}`);
  } catch (error) {
    console.error('[OTEL] Failed to initialize OpenTelemetry:', error);
  }
}

/**
 * Get the tracer for creating custom spans
 */
export function getTracer(name: string = 'default') {
  return trace.getTracer(name);
}

/**
 * Get the current context
 */
export function getContext() {
  return context;
}

/**
 * Check if OpenTelemetry is initialized
 */
export function isOtelInitialized(): boolean {
  return isInitialized;
}

/**
 * Shutdown OpenTelemetry (for cleanup)
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (tracerProvider) {
    await tracerProvider.shutdown();
    isInitialized = false;
    console.log('[OTEL] OpenTelemetry shut down');
  }
}
