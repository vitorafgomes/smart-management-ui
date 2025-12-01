import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Create User</h2>
        <a routerLink=".." class="btn btn-outline-secondary">Back to List</a>
      </div>

      <div class="card">
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">First Name</label>
                <input type="text" class="form-control" [(ngModel)]="user.firstName" name="firstName" required>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-control" [(ngModel)]="user.lastName" name="lastName" required>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="user.email" name="email" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Role</label>
              <select class="form-select" [(ngModel)]="user.role" name="role">
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div class="form-check mb-3">
              <input type="checkbox" class="form-check-input" [(ngModel)]="user.active" name="active" id="active">
              <label class="form-check-label" for="active">Active</label>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary">Create User</button>
              <a routerLink=".." class="btn btn-outline-secondary">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class UserCreateComponent {
  user = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    active: true
  };

  constructor(private router: Router) {}

  onSubmit(): void {
    console.log('Creating user:', this.user);
    // Here you would call the API to create the user
    alert('User created successfully!');
    this.router.navigate(['..'], { relativeTo: this.router.routerState.root });
  }
}