import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LayoutStoreService } from '../../layout-store.service';
import { ProfileDropdown } from '../profile-dropdown/profile-dropdown';

@Component({
  selector: 'app-topbar',
  imports: [ProfileDropdown],
  templateUrl: './topbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  protected readonly layout = inject(LayoutStoreService);
}
