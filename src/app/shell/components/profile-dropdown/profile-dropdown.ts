import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStateService } from '@shared-kernel/auth/auth-state.service';

@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.html',
  styleUrl: './profile-dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeIfOutside($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class ProfileDropdown {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  protected readonly open = signal(false);
  protected readonly user = this.authState.currentUser;

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected async logout(): Promise<void> {
    this.open.set(false);
    this.authState.logout();
    await this.router.navigate(['/auth/login']);
  }

  protected closeIfOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
