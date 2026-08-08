import { Routes } from '@angular/router';

import { authGuard } from '@shared-kernel/auth/auth.guard';
import { publicGuard } from '@shared-kernel/auth/public.guard';

import { AuthLayout } from './shell/layouts/auth-layout/auth-layout';
import { MainLayout } from './shell/layouts/main-layout/main-layout';
import { Dashboard } from './shell/pages/dashboard/dashboard';
import { Login } from './shell/pages/login/login';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [publicGuard],
    children: [
      { path: 'login', component: Login, title: 'Sign in' },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
