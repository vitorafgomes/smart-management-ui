import { Injectable } from '@angular/core';

import { IdentityError } from '../domain/identity-error';

export type IdentityPortName = 'users' | 'roles' | 'permissions';

/** Realistic enough that a missing loading state is visible while clicking through the app. */
const DEFAULT_LATENCY_MS = 150;

const LATENCY_KEY = 'identity-mock-latency';
const FAILURE_KEY = 'identity-mock-failure';

/**
 * The knobs on the mock adapters, and the reason they exist: ADR 0002 accepts mocked data on the
 * condition that the failure paths are actually exercised, which needs a way to make a port fail
 * on demand. Both knobs are read from `localStorage`, so an E2E test seeds them before the app
 * boots and a unit spec sets them in `beforeEach`.
 *
 * - `identity-mock-latency`: milliseconds each call takes. Specs set `0`.
 * - `identity-mock-failure`: comma-separated port names that reject, e.g. `users,roles`.
 *
 * Mock-only. Nothing here survives the swap to a real adapter.
 */
@Injectable()
export class IdentityMockConfig {
  readonly latencyMs = readLatency();

  shouldFail(port: IdentityPortName): boolean {
    return readFailingPorts().has(port);
  }

  /**
   * Every mock call goes through this: it waits, then fails if the port is armed to fail. The
   * order matters - failing after the delay is what a timing-out request does, and it is what
   * makes a spinner that never clears visible in the UI rather than only in a spec.
   */
  async settle(port: IdentityPortName): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    if (this.shouldFail(port)) {
      throw new IdentityError('unavailable', 'The identity service is unavailable.');
    }
  }
}

function readLatency(): number {
  const raw = Number(safeRead(LATENCY_KEY));
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_LATENCY_MS;
}

function readFailingPorts(): ReadonlySet<string> {
  const raw = safeRead(FAILURE_KEY);
  if (!raw) {
    return new Set();
  }

  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The mock still has to work.
    return null;
  }
}
