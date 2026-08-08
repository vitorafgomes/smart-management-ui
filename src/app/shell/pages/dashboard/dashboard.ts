import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthStateService } from '@shared-kernel/auth/auth-state.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly user = inject(AuthStateService).currentUser;
}
