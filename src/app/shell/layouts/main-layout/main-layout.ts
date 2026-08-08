import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastOutlet } from '@shared-kernel/toasts/toast-outlet/toast-outlet';

import { Footer } from '../../components/footer/footer';
import { Sidenav } from '../../components/sidenav/sidenav';
import { Topbar } from '../../components/topbar/topbar';
import { LayoutStoreService } from '../../layout-store.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Topbar, Sidenav, Footer, ToastOutlet],
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  protected readonly layout = inject(LayoutStoreService);
}
