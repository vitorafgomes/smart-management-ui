import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    NgbNavModule,
    NgbNavOutlet,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="main-content layout-trimmed profile-page position-relative">
      <div class="profile-page-header-underlay bg-primary-gradient bg-primary-500"></div>

      <div class="container-xl position-relative">
        @if (isLoading) {
          <div class="d-flex justify-content-center align-items-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        } @else if (error) {
          <div class="alert alert-danger m-4" role="alert">
            {{ error }}
          </div>
        } @else if (tenant) {
          <div class="profile-page-header rounded-3 body-bg shadow-3 mb-4">
            <div class="p-4">
              <h2>{{ tenant.name }}</h2>
              <p class="text-muted mb-0">{{ tenant.code }}</p>
            </div>

            <div class="profile-page-nav border-top">
              <ul [(activeId)]="activeId" ngbNav #nav="ngbNav" class="nav nav-tabs-clean">
                <li ngbNavItem="info">
                  <a ngbNavLink>General Info</a>
                  <ng-template ngbNavContent>
                    <div class="p-4">
                      <h4>Organization Information</h4>
                      <p>Name: {{ tenant.name }}</p>
                      <p>Code: {{ tenant.code }}</p>
                    </div>
                  </ng-template>
                </li>
                <li ngbNavItem="email">
                  <a ngbNavLink>Email/SMTP Settings</a>
                  <ng-template ngbNavContent>
                    <div class="p-4">
                      <h4>SMTP Configuration</h4>
                      <form>
                        <div class="mb-3">
                          <label class="form-label">SMTP Host</label>
                          <input type="text" class="form-control" placeholder="smtp.example.com">
                        </div>
                        <div class="mb-3">
                          <label class="form-label">SMTP Port</label>
                          <input type="number" class="form-control" placeholder="587">
                        </div>
                        <div class="mb-3">
                          <label class="form-label">Username</label>
                          <input type="text" class="form-control">
                        </div>
                        <div class="mb-3">
                          <label class="form-label">Password</label>
                          <input type="password" class="form-control">
                        </div>
                        <div class="form-check mb-3">
                          <input type="checkbox" class="form-check-input" id="useSsl">
                          <label class="form-check-label" for="useSsl">Use SSL/TLS</label>
                        </div>
                        <button type="submit" class="btn btn-primary">Save SMTP Settings</button>
                      </form>
                    </div>
                  </ng-template>
                </li>
                <li ngbNavItem="branding">
                  <a ngbNavLink>Branding</a>
                  <ng-template ngbNavContent>
                    <div class="p-4">
                      <h4>Branding Settings</h4>
                      <p>Configure your organization's branding here.</p>
                    </div>
                  </ng-template>
                </li>
              </ul>
            </div>
          </div>

          <div class="tab-content" [ngbNavOutlet]="nav"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-page-header-underlay {
      height: 200px;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }
    .bg-primary-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  `]
})
export class TenantSettingsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  activeId = 'info';
  tenant: any = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    // Simulated tenant data - in real app, this would come from shared auth service
    setTimeout(() => {
      this.tenant = {
        id: '1',
        name: 'Demo Organization',
        code: 'demo-org'
      };
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }
}