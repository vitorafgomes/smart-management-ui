import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CorrelationService } from '../correlation/correlation.service';
import { ToastService } from '../toasts/toast.service';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: ErrorHandler;
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    handler = TestBed.inject(ErrorHandler);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces an Error to the user with its message', () => {
    handler.handleError(new Error('the tenant list could not be loaded'));

    expect(toasts.toasts()).toEqual([
      {
        id: 1,
        tone: 'error',
        title: 'Something went wrong',
        message: 'the tenant list could not be loaded',
      },
    ]);
  });

  it('surfaces a non-Error throw as well', () => {
    handler.handleError('boom');

    expect(toasts.toasts()[0].message).toBe('boom');
  });

  it('logs against the correlation session id so the toast can be traced', () => {
    const sessionId = TestBed.inject(CorrelationService).sessionId;

    handler.handleError(new Error('boom'));

    expect(console.error).toHaveBeenCalledWith(
      `[session ${sessionId}] Unhandled error:`,
      expect.any(Error),
    );
  });
});
