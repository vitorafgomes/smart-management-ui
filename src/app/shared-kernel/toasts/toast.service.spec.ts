import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty queue', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('queues a toast with its tone and content', () => {
    service.show('success', 'Saved', 'The tenant was updated.');

    expect(service.toasts()).toEqual([
      { id: 1, tone: 'success', title: 'Saved', message: 'The tenant was updated.' },
    ]);
  });

  it('keeps several toasts in the order they arrived', () => {
    service.show('info', 'First', 'one');
    service.show('error', 'Second', 'two');

    expect(service.toasts().map((toast) => toast.title)).toEqual(['First', 'Second']);
  });

  it('removes only the dismissed toast', () => {
    const first = service.show('info', 'First', 'one');
    service.show('error', 'Second', 'two');

    service.dismiss(first);

    expect(service.toasts().map((toast) => toast.title)).toEqual(['Second']);
  });

  it('dismisses a toast on its own after the auto-hide delay', () => {
    service.show('info', 'Transient', 'goes away');

    vi.advanceTimersByTime(6_000);

    expect(service.toasts()).toEqual([]);
  });

  it('ignores a dismiss for a toast that is already gone', () => {
    const id = service.show('info', 'Transient', 'goes away');
    service.dismiss(id);

    service.dismiss(id);

    expect(service.toasts()).toEqual([]);
  });
});
