import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users/users-list.component').then(m => m.UsersListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./users/user-create.component').then(m => m.UserCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./users/user-edit.component').then(m => m.UserEditComponent)
  }
];