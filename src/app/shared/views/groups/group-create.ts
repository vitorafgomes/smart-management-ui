import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-group-create',
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
                <li class="breadcrumb-item"><a routerLink="/groups">Groups</a></li>
                <li class="breadcrumb-item active">Create Group</li>
              </ol>
            </nav>
            <h1 class="fs-xl fw-700 mb-0">Create New Group</h1>
          </div>
        </div>

        <!-- Create Form -->
        <div class="row">
          <div class="col-lg-8">
            <form [formGroup]="groupForm" (ngSubmit)="onSubmit()">
              <!-- Basic Info Card -->
              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#folder"></use>
                    </svg>
                    Group Information
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label">Group Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="name"
                           [class.is-invalid]="isInvalid('name')"
                           placeholder="e.g., Engineering Team">
                    <div class="invalid-feedback">Group name is required.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" formControlName="description" rows="3"
                              placeholder="Describe the purpose of this group..."></textarea>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Parent Group</label>
                      <select class="form-select" formControlName="parentGroup">
                        <option value="">None (Top-level group)</option>
                        <option value="engineering">Engineering</option>
                        <option value="sales">Sales</option>
                        <option value="marketing">Marketing</option>
                        <option value="support">Support</option>
                      </select>
                      <div class="form-text">Optionally nest this group under another.</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Color</label>
                      <div class="d-flex gap-2 flex-wrap">
                        @for (color of colors; track color.value) {
                          <button type="button"
                                  class="btn btn-sm rounded-circle p-0"
                                  style="width: 32px; height: 32px;"
                                  [class]="'bg-' + color.class"
                                  [class.ring]="selectedColor === color.value"
                                  (click)="selectColor(color.value)">
                            @if (selectedColor === color.value) {
                              <svg class="sa-icon text-white" style="width: 16px; height: 16px;">
                                <use href="/assets/icons/sprite.svg#check"></use>
                              </svg>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Members Card -->
              <div class="card shadow-1 mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#users"></use>
                    </svg>
                    Initial Members
                  </h5>
                  <small class="text-muted">Optional - you can add members later</small>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label">Search Users</label>
                    <input type="text" class="form-control" placeholder="Start typing to search users...">
                  </div>

                  <div class="border rounded p-3 bg-light">
                    @if (selectedMembers.length === 0) {
                      <p class="text-muted mb-0 text-center">
                        <svg class="sa-icon me-2">
                          <use href="/assets/icons/sprite.svg#user-plus"></use>
                        </svg>
                        No members selected yet
                      </p>
                    } @else {
                      <div class="d-flex flex-wrap gap-2">
                        @for (member of selectedMembers; track member.id) {
                          <span class="badge bg-primary d-flex align-items-center gap-2 py-2 px-3">
                            {{ member.name }}
                            <button type="button" class="btn-close btn-close-white" style="font-size: 0.5rem;"
                                    (click)="removeMember(member.id)"></button>
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex justify-content-end gap-2">
                <a routerLink="/groups" class="btn btn-default">Cancel</a>
                <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                  @if (isSaving) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Create Group
                </button>
              </div>
            </form>
          </div>

          <div class="col-lg-4">
            <div class="card shadow-1">
              <div class="card-header">
                <h5 class="mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#info"></use>
                  </svg>
                  About Groups
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">
                  Groups help you organize users into teams, departments, or projects.
                </p>
                <ul class="list-unstyled small text-muted">
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    Assign permissions to groups
                  </li>
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    Create nested hierarchies
                  </li>
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    Users can belong to multiple groups
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .ring {
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2);
    }
  `
})
export class GroupCreate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  groupForm: FormGroup;
  isSaving = false;
  selectedColor = 'blue';
  selectedMembers: any[] = [];

  colors = [
    { value: 'blue', class: 'primary' },
    { value: 'green', class: 'success' },
    { value: 'orange', class: 'warning' },
    { value: 'red', class: 'danger' },
    { value: 'purple', class: 'info' },
    { value: 'gray', class: 'secondary' },
  ];

  constructor() {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentGroup: [''],
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.groupForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  removeMember(memberId: string): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== memberId);
  }

  onSubmit(): void {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const groupData = {
      ...this.groupForm.value,
      color: this.selectedColor,
      members: this.selectedMembers
    };

    setTimeout(() => {
      console.log('Group created:', groupData);
      this.isSaving = false;
      this.router.navigate(['/groups']);
    }, 1000);
  }
}
