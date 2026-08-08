import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  readonly id: number;
  readonly tone: ToastTone;
  readonly title: string;
  readonly message: string;
}

const AUTO_DISMISS_MS = 6_000;

/**
 * Transient user-facing notifications. The queue is state, so it is a signal and an outlet
 * component renders it - no direct DOM writing, which is what the legacy implementation did.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  private nextId = 1;

  readonly toasts = this._toasts.asReadonly();

  show(tone: ToastTone, title: string, message: string): number {
    const id = this.nextId++;
    this._toasts.update((current) => [...current, { id, tone, title, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);

    return id;
  }

  dismiss(id: number): void {
    this._toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
