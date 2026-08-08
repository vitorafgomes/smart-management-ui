import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService, ToastTone } from '../toast.service';

const TONE_BADGE: Record<ToastTone, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-danger',
};

@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);

  protected badgeFor(tone: ToastTone): string {
    return TONE_BADGE[tone];
  }
}
