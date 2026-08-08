import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { PermissionsFacade } from '../../application/permissions-facade';
import { Permission, PERMISSION_MODULES } from '../../domain/permission';
import { Pager } from '../pager/pager';

@Component({
  selector: 'app-permissions-page',
  imports: [RouterLink, Pager],
  templateUrl: './permissions-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsPage implements OnInit {
  protected readonly facade = inject(PermissionsFacade);
  protected readonly modules = PERMISSION_MODULES;
  protected readonly pendingDelete = signal<Permission | null>(null);

  private readonly searchInput = new Subject<string>();

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => void this.facade.setSearch(term));
  }

  ngOnInit(): void {
    void this.facade.load();
  }

  protected onSearch(event: Event): void {
    this.searchInput.next((event.target as HTMLInputElement).value);
  }

  protected onModuleChange(event: Event): void {
    void this.facade.setModule((event.target as HTMLSelectElement).value);
  }

  protected async confirmDelete(): Promise<void> {
    const permission = this.pendingDelete();
    if (!permission) {
      return;
    }

    await this.facade.remove(permission.id);
    this.pendingDelete.set(null);
  }
}
