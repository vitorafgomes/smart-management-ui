import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { RolesFacade } from '../../application/roles-facade';
import { Role } from '../../domain/role';
import { Pager } from '../pager/pager';

@Component({
  selector: 'app-roles-page',
  imports: [RouterLink, Pager],
  templateUrl: './roles-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPage implements OnInit {
  protected readonly facade = inject(RolesFacade);
  protected readonly pendingDelete = signal<Role | null>(null);

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

  protected async confirmDelete(): Promise<void> {
    const role = this.pendingDelete();
    if (!role) {
      return;
    }

    await this.facade.remove(role);
    this.pendingDelete.set(null);
  }
}
