import { Routes } from '@angular/router';

import { PermissionsFacade } from '../application/permissions-facade';
import { RolesFacade } from '../application/roles-facade';
import { UsersFacade } from '../application/users-facade';

import { IdentityLayout } from './identity-layout/identity-layout';

/**
 * The module's screens. Facades are provided here rather than in root so their state is destroyed
 * with the module, which is what keeps a stale list from flashing on the way back in. The port to
 * adapter bindings are NOT here: `ui/` may not name an adapter, so they live in the module's
 * index.ts, which is its composition root.
 */
export const IDENTITY_SCREEN_ROUTES: Routes = [
  {
    path: '',
    component: IdentityLayout,
    providers: [UsersFacade, RolesFacade, PermissionsFacade],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        title: 'Users',
        loadComponent: () => import('./users-page/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'users/new',
        title: 'New user',
        loadComponent: () => import('./user-form-page/user-form-page').then((m) => m.UserFormPage),
      },
      {
        path: 'users/:id',
        title: 'Edit user',
        loadComponent: () => import('./user-form-page/user-form-page').then((m) => m.UserFormPage),
      },
      {
        path: 'roles',
        title: 'Roles',
        loadComponent: () => import('./roles-page/roles-page').then((m) => m.RolesPage),
      },
      {
        path: 'roles/new',
        title: 'New role',
        loadComponent: () => import('./role-form-page/role-form-page').then((m) => m.RoleFormPage),
      },
      {
        path: 'roles/:id',
        title: 'Edit role',
        loadComponent: () => import('./role-form-page/role-form-page').then((m) => m.RoleFormPage),
      },
      {
        path: 'permissions',
        title: 'Permissions',
        loadComponent: () =>
          import('./permissions-page/permissions-page').then((m) => m.PermissionsPage),
      },
      {
        path: 'permissions/new',
        title: 'New permission',
        loadComponent: () =>
          import('./permission-form-page/permission-form-page').then((m) => m.PermissionFormPage),
      },
      {
        path: 'permissions/:id',
        title: 'Edit permission',
        loadComponent: () =>
          import('./permission-form-page/permission-form-page').then((m) => m.PermissionFormPage),
      },
    ],
  },
];
