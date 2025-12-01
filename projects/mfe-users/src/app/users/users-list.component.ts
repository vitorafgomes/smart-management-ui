import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Users Management</h2>
        <a routerLink="create" class="btn btn-primary">
          <i class="fa fa-plus me-2"></i>Add User
        </a>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="row align-items-center">
            <div class="col">
              <input type="text" class="form-control" placeholder="Search users..." [(ngModel)]="searchTerm">
            </div>
          </div>
        </div>
        <div class="card-body p-0">
          @if (isLoading) {
            <div class="d-flex justify-content-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          } @else {
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers; track user.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                          {{ user.name.charAt(0) }}
                        </div>
                        {{ user.name }}
                      </div>
                    </td>
                    <td>{{ user.email }}</td>
                    <td><span class="badge bg-info">{{ user.role }}</span></td>
                    <td>
                      <span [class]="user.active ? 'badge bg-success' : 'badge bg-secondary'">
                        {{ user.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <a [routerLink]="[user.id]" class="btn btn-sm btn-outline-primary me-1">Edit</a>
                      <button class="btn btn-sm btn-outline-danger" (click)="deleteUser(user.id)">Delete</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  searchTerm = '';
  isLoading = true;

  get filteredUsers() {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  }

  ngOnInit(): void {
    // Simulated users data
    setTimeout(() => {
      this.users = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', active: true },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', active: true },
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'Manager', active: false },
      ];
      this.isLoading = false;
    }, 500);
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(u => u.id !== id);
    }
  }
}