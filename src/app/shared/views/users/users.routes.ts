import { Routes } from '@angular/router';
import { UsersList } from './users-list';
import { UserInvite } from './user-invite';
import { UserEdit } from './user-edit';
import { authGuard } from '@core/guards/auth.guard';

export const USERS_ROUTES: Routes = [
  {
    path: 'users',
    canActivate: [authGuard],
    children: [
      { path: '', component: UsersList, data: { title: 'Users' } },
      { path: 'invite', component: UserInvite, data: { title: 'Invite User' } },
      { path: ':id/edit', component: UserEdit, data: { title: 'Edit User' } },
    ]
  }
];
