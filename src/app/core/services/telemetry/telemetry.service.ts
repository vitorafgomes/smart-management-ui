import { Injectable, inject } from '@angular/core';
import { trace, context, SpanStatusCode, Span, SpanKind } from '@opentelemetry/api';
import { isOtelInitialized } from '@/app/config/otel.config';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface TelemetryEvent {
  name: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface UserContext {
  id: string;
  username?: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private readonly tracerName = 'smart-management-ui';
  private userContext: UserContext | null = null;

  /**
   * Check if OpenTelemetry is initialized
   */
  get isInitialized(): boolean {
    return isOtelInitialized();
  }

  /**
   * Get the tracer instance
   */
  private get tracer() {
    return trace.getTracer(this.tracerName);
  }

  /**
   * Set user context for all subsequent telemetry
   */
  setUser(user: UserContext): void {
    this.userContext = user;
    this.log('info', 'User context set', {
      userId: user.id,
      username: user.username || '',
      tenantId: user.tenantId || ''
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userContext = null;
  }

  /**
   * Log a message with optional attributes
   */
  log(level: LogLevel, message: string, attributes?: Record<string, string | number | boolean>): void {
    if (!this.isInitialized) return;

    const span = this.tracer.startSpan(`log.${level}`, {
      kind: SpanKind.INTERNAL,
    });

    try {
      span.setAttribute('log.level', level);
      span.setAttribute('log.message', message);

      // Add user context if available
      if (this.userContext) {
        span.setAttribute('user.id', this.userContext.id);
        if (this.userContext.username) span.setAttribute('user.username', this.userContext.username);
        if (this.userContext.tenantId) span.setAttribute('tenant.id', this.userContext.tenantId);
      }

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      // Set status based on level
      if (level === 'error') {
        span.setStatus({ code: SpanStatusCode.ERROR, message });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
    } finally {
      span.end();
    }

    // Also log to console in development
    if (typeof console !== 'undefined') {
      const logFn = level === 'trace' ? console.debug : console[level] || console.log;
      logFn(`[${level.toUpperCase()}] ${message}`, attributes || '');
    }
  }

  /**
   * Track a business event
   */
  trackEvent(event: TelemetryEvent): void {
    if (!this.isInitialized) return;

    const span = this.tracer.startSpan(`event.${event.name}`, {
      kind: SpanKind.INTERNAL,
    });

    try {
      span.setAttribute('event.name', event.name);
      span.setAttribute('event.timestamp', Date.now());

      // Add user context
      if (this.userContext) {
        span.setAttribute('user.id', this.userContext.id);
        if (this.userContext.tenantId) span.setAttribute('tenant.id', this.userContext.tenantId);
      }

      // Add event attributes
      if (event.attributes) {
        Object.entries(event.attributes).forEach(([key, value]) => {
          span.setAttribute(`event.${key}`, value);
        });
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } finally {
      span.end();
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error, attributes?: Record<string, string | number | boolean>): void {
    if (!this.isInitialized) return;

    const span = this.tracer.startSpan('error', {
      kind: SpanKind.INTERNAL,
    });

    try {
      span.setAttribute('error.type', error.name);
      span.setAttribute('error.message', error.message);
      if (error.stack) {
        span.setAttribute('error.stack', error.stack);
      }

      // Add user context
      if (this.userContext) {
        span.setAttribute('user.id', this.userContext.id);
        if (this.userContext.tenantId) span.setAttribute('tenant.id', this.userContext.tenantId);
      }

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    } finally {
      span.end();
    }
  }

  /**
   * Measure performance of an async operation
   */
  async measurePerformance<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    if (!this.isInitialized) {
      return operation();
    }

    const span = this.tracer.startSpan(`operation.${operationName}`, {
      kind: SpanKind.INTERNAL,
    });

    const startTime = performance.now();

    try {
      // Add user context
      if (this.userContext) {
        span.setAttribute('user.id', this.userContext.id);
        if (this.userContext.tenantId) span.setAttribute('tenant.id', this.userContext.tenantId);
      }

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      const result = await context.with(trace.setSpan(context.active(), span), operation);

      const duration = performance.now() - startTime;
      span.setAttribute('operation.duration_ms', duration);
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      span.setAttribute('operation.duration_ms', duration);

      if (error instanceof Error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      }

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Create a custom span for manual instrumentation
   */
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
    });

    // Add user context
    if (this.userContext) {
      span.setAttribute('user.id', this.userContext.id);
      if (this.userContext.tenantId) span.setAttribute('tenant.id', this.userContext.tenantId);
    }

    // Add custom attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }

    return span;
  }

  /**
   * Track page navigation
   */
  trackNavigation(route: string, previousRoute?: string): void {
    this.trackEvent({
      name: 'navigation',
      attributes: {
        route,
        previousRoute: previousRoute || '',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track user action (click, form submit, etc.)
   */
  trackUserAction(action: string, target: string, attributes?: Record<string, string | number | boolean>): void {
    this.trackEvent({
      name: 'user_action',
      attributes: {
        action,
        target,
        ...attributes
      }
    });
  }
}
