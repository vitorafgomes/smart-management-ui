import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { MenuItem } from '../../menu-item';

@Component({
  selector: 'app-menu',
  imports: [RouterLink],
  templateUrl: './app-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMenu {
  private readonly router = inject(Router);

  readonly items = input.required<readonly MenuItem[]>();
  readonly expandAll = input(false);

  private readonly openLabels = signal<ReadonlySet<string>>(new Set());

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Groups holding the active route open, plus anything the user opened or a filter expanded. */
  private readonly openGroups = computed<ReadonlySet<string>>(() => {
    if (this.expandAll()) {
      return new Set(this.items().map((item) => item.label));
    }

    const open = new Set(this.openLabels());
    for (const item of this.items()) {
      if (item.children?.some((child) => this.matches(child))) {
        open.add(item.label);
      }
    }

    return open;
  });

  protected isOpen(item: MenuItem): boolean {
    return this.openGroups().has(item.label);
  }

  protected isActive(item: MenuItem): boolean {
    return this.matches(item);
  }

  protected hasActiveChild(item: MenuItem): boolean {
    return item.children?.some((child) => this.matches(child)) ?? false;
  }

  protected toggle(item: MenuItem): void {
    const open = new Set(this.openLabels());
    if (open.has(item.label)) {
      open.delete(item.label);
    } else {
      open.add(item.label);
    }
    this.openLabels.set(open);
  }

  private matches(item: MenuItem): boolean {
    if (!item.url) {
      return false;
    }

    const url = this.currentUrl().split('?')[0];
    return url === item.url || url.startsWith(`${item.url}/`);
  }
}
