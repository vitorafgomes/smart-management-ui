import { Routes } from '@angular/router';
import { RolePermissionsList } from './role-permissions-list';
import { authGuard } from '@core/guards/auth.guard';

export const ROLE_PERMISSIONS_ROUTES: Routes = [
  {
    path: 'role-permissions',
    canActivate: [authGuard],
    children: [
      { path: '', component: RolePermissionsList, data: { title: 'Role Permissions' } },
    ]
  }
];
