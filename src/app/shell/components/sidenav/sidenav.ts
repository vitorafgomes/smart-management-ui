import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DynamicMenuService } from '../../dynamic-menu.service';
import { MenuItem } from '../../menu-item';
import { AppLogo } from '../app-logo/app-logo';
import { AppMenu } from '../app-menu/app-menu';

@Component({
  selector: 'app-sidenav',
  imports: [AppLogo, AppMenu],
  templateUrl: './sidenav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidenav {
  private readonly menu = inject(DynamicMenuService);

  protected readonly loading = this.menu.loading;
  protected readonly filterText = signal('');

  protected readonly filteredItems = computed(() => filterMenu(this.menu.items(), this.filterText()));
  protected readonly hasResults = computed(() => this.filteredItems().length > 0);
  protected readonly isFiltering = computed(() => this.filterText().trim().length > 0);

  protected updateFilter(event: Event): void {
    this.filterText.set((event.target as HTMLInputElement).value);
  }
}

/**
 * Keeps an item when it matches, or when one of its children does - in which case the whole
 * subtree stays so the user sees the matched entry in its own context. Section titles only
 * survive on their own match, since a title with nothing under it is noise.
 */
function filterMenu(items: readonly MenuItem[], term: string): readonly MenuItem[] {
  const search = term.trim().toLowerCase();
  if (!search) {
    return items;
  }

  const matches = (item: MenuItem) => item.label.toLowerCase().includes(search);

  return items.flatMap((item) => {
    if (matches(item)) {
      return [item];
    }

    const children = item.children?.filter(matches) ?? [];
    return children.length > 0 ? [{ ...item, children }] : [];
  });
}
