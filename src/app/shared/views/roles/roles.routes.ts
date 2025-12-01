import { Routes } from '@angular/router';
import { RolesList } from './roles-list';
import { RoleCreate } from './role-create';
import { RoleEdit } from './role-edit';
import { authGuard } from '@core/guards/auth.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: 'roles',
    canActivate: [authGuard],
    children: [
      { path: '', component: RolesList, data: { title: 'Roles' } },
      { path: 'create', component: RoleCreate, data: { title: 'Create Role' } },
      { path: ':id/edit', component: RoleEdit, data: { title: 'Edit Role' } },
    ]
  }
];
