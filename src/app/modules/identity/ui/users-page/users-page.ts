import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { UsersFacade } from '../../application/users-facade';
import { fullName, User } from '../../domain/user';
import { Pager } from '../pager/pager';

@Component({
  selector: 'app-users-page',
  imports: [RouterLink, Pager],
  templateUrl: './users-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage implements OnInit {
  protected readonly facade = inject(UsersFacade);
  protected readonly pendingDelete = signal<User | null>(null);

  /**
   * Typing is an event stream, not state, which is the one case the signals convention keeps for
   * RxJS. The debounced term lands in the facade; nothing about it is held here.
   */
  private readonly searchInput = new Subject<string>();

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => void this.facade.setSearch(term));
  }

  ngOnInit(): void {
    void this.facade.load();
  }

  protected readonly fullName = fullName;

  protected onSearch(event: Event): void {
    this.searchInput.next((event.target as HTMLInputElement).value);
  }

  protected async confirmDelete(): Promise<void> {
    const user = this.pendingDelete();
    if (!user) {
      return;
    }

    // Closed either way: on failure the dialog would hide the error banner it caused.
    await this.facade.remove(user.id);
    this.pendingDelete.set(null);
  }
}
