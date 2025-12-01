import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { About } from '@/app/shared/views/user-profile/components/about';
import { ProfileInfo } from '@/app/shared/views/user-profile/components/profile-info';
import { CurrentUserStore } from '@core/stores/current-user.store';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, NgbNavOutlet, NgbNavModule, About, ProfileInfo],
  templateUrl: './user-profile.html',
  styles: ``
})
export class UserProfile implements OnInit {
  readonly currentUserStore = inject(CurrentUserStore);
  activeId = 'about';

  ngOnInit(): void {
    // Ensure user data is loaded
    if (!this.currentUserStore.isLoaded()) {
      this.currentUserStore.restoreFromStorage();
    }
  }
}
