import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-invite',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-1">
                <li class="breadcrumb-item"><a routerLink="/users">Users</a></li>
                <li class="breadcrumb-item active">Invite User</li>
              </ol>
            </nav>
            <h1 class="fs-xl fw-700 mb-0">Invite New User</h1>
          </div>
        </div>

        <!-- Invite Form Card -->
        <div class="row">
          <div class="col-lg-8">
            <div class="card shadow-1">
              <div class="card-header">
                <h5 class="mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#user-plus"></use>
                  </svg>
                  User Information
                </h5>
              </div>
              <div class="card-body">
                <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">First Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" formControlName="firstName"
                             [class.is-invalid]="isInvalid('firstName')">
                      <div class="invalid-feedback">First name is required.</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Last Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" formControlName="lastName"
                             [class.is-invalid]="isInvalid('lastName')">
                      <div class="invalid-feedback">Last name is required.</div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Email Address <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" formControlName="email"
                           [class.is-invalid]="isInvalid('email')"
                           placeholder="user@example.com">
                    <div class="invalid-feedback">Valid email is required.</div>
                    <div class="form-text">An invitation email will be sent to this address.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" formControlName="username"
                           placeholder="Optional - will be generated from email if empty">
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Role <span class="text-danger">*</span></label>
                      <select class="form-select" formControlName="role"
                              [class.is-invalid]="isInvalid('role')">
                        <option value="">Select a role...</option>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <div class="invalid-feedback">Please select a role.</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Groups</label>
                      <select class="form-select" formControlName="groups" multiple>
                        <option value="sales">Sales Team</option>
                        <option value="marketing">Marketing</option>
                        <option value="engineering">Engineering</option>
                        <option value="support">Support</option>
                      </select>
                      <div class="form-text">Hold Ctrl/Cmd to select multiple.</div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" formControlName="sendInvite" id="sendInvite">
                      <label class="form-check-label" for="sendInvite">
                        Send invitation email immediately
                      </label>
                    </div>
                  </div>

                  <hr>

                  <div class="d-flex justify-content-end gap-2">
                    <a routerLink="/users" class="btn btn-default">Cancel</a>
                    <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                      @if (isSaving) {
                        <span class="spinner-border spinner-border-sm me-1"></span>
                      }
                      Send Invitation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card shadow-1">
              <div class="card-header">
                <h5 class="mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#info"></use>
                  </svg>
                  About Invitations
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">
                  When you invite a user, they will receive an email with instructions to set up their account.
                </p>
                <ul class="list-unstyled small text-muted">
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    Invitation expires in 7 days
                  </li>
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    User will set their own password
                  </li>
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    You can resend invitations later
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class UserInvite {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  inviteForm: FormGroup;
  isSaving = false;

  constructor() {
    this.inviteForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: [''],
      role: ['', Validators.required],
      groups: [[]],
      sendInvite: [true]
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.inviteForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    // Simulate API call
    setTimeout(() => {
      console.log('User invited:', this.inviteForm.value);
      this.isSaving = false;
      this.router.navigate(['/users']);
    }, 1000);
  }
}
