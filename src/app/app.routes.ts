import { Routes } from '@angular/router';

import { authEnabledGuard } from '@shared-kernel/auth/auth-enabled.guard';
import { authGuard } from '@shared-kernel/auth/auth.guard';
import { publicGuard } from '@shared-kernel/auth/public.guard';

import { AuthLayout } from './shell/layouts/auth-layout/auth-layout';
import { MainLayout } from './shell/layouts/main-layout/main-layout';
import { Dashboard } from './shell/pages/dashboard/dashboard';
import { Login } from './shell/pages/login/login';
import { Register } from './shell/pages/register/register';

export const routes: Routes = [
  // `/` is the public face: an anonymous visitor gets the landing page, an authenticated one is
  // sent on to the dashboard by publicGuard. The landing is lazy so its marketing markup never
  // reaches the bundle of a user who is already signed in.
  {
    path: '',
    pathMatch: 'full',
    canActivate: [publicGuard],
    loadComponent: () => import('./shell/pages/landing/landing').then((m) => m.Landing),
    title: 'Smart Management',
  },
  {
    path: 'auth',
    component: AuthLayout,
    // authEnabledGuard runs first: when auth is switched off, these routes have nothing to
    // serve, so authGuard's own redirect to /auth/login lands here and back out to '/' rather
    // than dead-ending on an auth screen with no login behind it.
    canActivate: [authEnabledGuard, publicGuard],
    children: [
      { path: 'login', component: Login, title: 'Sign in' },
      { path: 'register', component: Register, title: 'Create account' },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
      {
        path: 'identity',
        loadChildren: () => import('@modules/identity').then((m) => m.identityRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
