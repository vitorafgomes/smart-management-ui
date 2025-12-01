import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CurrentUserStore } from '@core/stores/current-user.store';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="row">
      <div class="col-lg-8">
        <!-- Contact Information -->
        <div class="panel mb-4">
          <div class="panel-hdr">
            <h2>Contact Information</h2>
          </div>
          <div class="panel-container">
            <div class="panel-content">
              <div class="d-flex flex-column gap-3">
                <!-- Email -->
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper me-3">
                    <svg class="sa-icon text-primary" style="width: 20px; height: 20px;">
                      <use href="/assets/icons/sprite.svg#mail"></use>
                    </svg>
                  </div>
                  <div>
                    <small class="text-muted d-block">Email</small>
                    <span class="fw-500">{{ currentUserStore.email() || 'Not set' }}</span>
                    @if (currentUserStore.user()?.isEmailVerified) {
                      <span class="badge bg-success-100 text-success ms-2">Verified</span>
                    }
                  </div>
                </div>

                <!-- Phone -->
                @if (currentUserStore.user()?.phone) {
                  <div class="d-flex align-items-center">
                    <div class="icon-wrapper me-3">
                      <svg class="sa-icon text-primary" style="width: 20px; height: 20px;">
                        <use href="/assets/icons/sprite.svg#phone"></use>
                      </svg>
                    </div>
                    <div>
                      <small class="text-muted d-block">Phone</small>
                      <span class="fw-500">
                        @if (currentUserStore.user()?.phoneCountryCode) {
                          +{{ currentUserStore.user()?.phoneCountryCode }}
                        }
                        {{ currentUserStore.user()?.phone }}
                      </span>
                      @if (currentUserStore.user()?.isPhoneVerified) {
                        <span class="badge bg-success-100 text-success ms-2">Verified</span>
                      }
                    </div>
                  </div>
                }

                <!-- Mobile -->
                @if (currentUserStore.user()?.mobile) {
                  <div class="d-flex align-items-center">
                    <div class="icon-wrapper me-3">
                      <svg class="sa-icon text-primary" style="width: 20px; height: 20px;">
                        <use href="/assets/icons/sprite.svg#smartphone"></use>
                      </svg>
                    </div>
                    <div>
                      <small class="text-muted d-block">Mobile</small>
                      <span class="fw-500">{{ currentUserStore.user()?.mobile }}</span>
                    </div>
                  </div>
                }

                <!-- Location -->
                @if (currentUserStore.user()?.city || currentUserStore.user()?.stateProvince || currentUserStore.user()?.countryCode) {
                  <div class="d-flex align-items-center">
                    <div class="icon-wrapper me-3">
                      <svg class="sa-icon text-primary" style="width: 20px; height: 20px;">
                        <use href="/assets/icons/sprite.svg#map-pin"></use>
                      </svg>
                    </div>
                    <div>
                      <small class="text-muted d-block">Location</small>
                      <span class="fw-500">{{ getLocationString() }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Account Information -->
        <div class="panel mb-4">
          <div class="panel-hdr">
            <h2>Account Information</h2>
          </div>
          <div class="panel-container">
            <div class="panel-content">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Username</small>
                    <span class="fw-500">{{ currentUserStore.user()?.userName || 'Not set' }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Account Status</small>
                    @if (currentUserStore.user()?.isActive) {
                      <span class="badge bg-success">Active</span>
                    } @else {
                      <span class="badge bg-danger">Inactive</span>
                    }
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Member Since</small>
                    <span class="fw-500">{{ currentUserStore.user()?.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Last Login</small>
                    <span class="fw-500">
                      @if (currentUserStore.user()?.lastLoginAt) {
                        {{ currentUserStore.user()?.lastLoginAt | date:'medium' }}
                      } @else {
                        Never
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="panel mb-4">
          <div class="panel-hdr">
            <h2>Security</h2>
          </div>
          <div class="panel-container">
            <div class="panel-content">
              <div class="row">
                <div class="col-md-6">
                  <div class="d-flex align-items-center mb-3">
                    <svg class="sa-icon me-2" [class.text-success]="currentUserStore.user()?.twoFactorEnabled" [class.text-muted]="!currentUserStore.user()?.twoFactorEnabled" style="width: 20px; height: 20px;">
                      <use href="/assets/icons/sprite.svg#shield"></use>
                    </svg>
                    <div>
                      <span class="fw-500">Two-Factor Authentication</span>
                      @if (currentUserStore.user()?.twoFactorEnabled) {
                        <span class="badge bg-success ms-2">Enabled</span>
                        @if (currentUserStore.user()?.twoFactorMethod) {
                          <small class="text-muted ms-1">({{ currentUserStore.user()?.twoFactorMethod }})</small>
                        }
                      } @else {
                        <span class="badge bg-warning ms-2">Disabled</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Password Last Changed</small>
                    <span class="fw-500">
                      @if (currentUserStore.user()?.passwordChangedAt) {
                        {{ currentUserStore.user()?.passwordChangedAt | date:'mediumDate' }}
                      } @else {
                        Never changed
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <!-- Preferences -->
        <div class="panel mb-4">
          <div class="panel-hdr">
            <h2>Preferences</h2>
          </div>
          <div class="panel-container">
            <div class="panel-content">
              <div class="d-flex flex-column gap-3">
                <div>
                  <small class="text-muted d-block">Language</small>
                  <span class="fw-500">{{ getLanguageName(currentUserStore.user()?.preferredLanguage) }}</span>
                </div>
                <div>
                  <small class="text-muted d-block">Timezone</small>
                  <span class="fw-500">{{ currentUserStore.user()?.preferredTimezone || 'Not set' }}</span>
                </div>
                <div>
                  <small class="text-muted d-block">Currency</small>
                  <span class="fw-500">{{ currentUserStore.user()?.preferredCurrency || 'Not set' }}</span>
                </div>
                <div>
                  <small class="text-muted d-block">Date Format</small>
                  <span class="fw-500">{{ currentUserStore.user()?.preferredDateFormat || 'Default' }}</span>
                </div>
                <div>
                  <small class="text-muted d-block">Time Format</small>
                  <span class="fw-500">{{ currentUserStore.user()?.preferredTimeFormat || 'Default' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Roles & Permissions Summary -->
        <div class="panel mb-4">
          <div class="panel-hdr">
            <h2>Roles</h2>
          </div>
          <div class="panel-container">
            <div class="panel-content">
              @if (currentUserStore.roles().length > 0) {
                <div class="d-flex flex-column gap-2">
                  @for (role of currentUserStore.roles(); track role.id) {
                    <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                      <span class="fw-500">{{ role.name }}</span>
                      @if (role.permissions && role.permissions.length > 0) {
                        <span class="badge bg-primary-100 text-primary">{{ role.permissions.length }} permissions</span>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="text-muted mb-0">No roles assigned</p>
              }
            </div>
          </div>
        </div>

        <!-- Tenant Info -->
        @if (currentUserStore.tenant()) {
          <div class="panel mb-4">
            <div class="panel-hdr">
              <h2>Organization</h2>
            </div>
            <div class="panel-container">
              <div class="panel-content">
                <div class="d-flex flex-column gap-3">
                  @if (currentUserStore.tenantLogo()) {
                    <div class="text-center mb-2">
                      <img [src]="currentUserStore.tenantLogo()" alt="Organization Logo" class="img-fluid" style="max-height: 60px;">
                    </div>
                  }
                  <div>
                    <small class="text-muted d-block">Company Name</small>
                    <span class="fw-500">{{ currentUserStore.tenantName() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: rgba(var(--theme-primary-rgb), 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `
})
export class About {
  readonly currentUserStore = inject(CurrentUserStore);

  getLanguageName(code: string | undefined): string {
    if (!code) return 'Not set';

    const languages: Record<string, string> = {
      'en': 'English',
      'pt': 'Português',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'ja': '日本語',
      'zh': '中文'
    };

    return languages[code] || code;
  }

  getLocationString(): string {
    const user = this.currentUserStore.user();
    const parts = [user?.city, user?.stateProvince, user?.countryCode].filter(v => !!v);
    return parts.join(', ') || 'Not set';
  }
}
