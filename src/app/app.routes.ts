import {Routes} from '@angular/router';
import {MainLayout} from '@layouts/main-layout/main-layout';
import {AuthLayout} from './shared/auth/auth-layout';
import {Error404Alt} from '@/app/shared/views/error/error-404-alt';
import {Error500} from '@/app/shared/views/error/error-500';
import {Landing} from '@/app/shared/views/landing/landing';
import {TableStyleGenerator} from '@/app/shared/views/tables/table-style-generator/table-style-generator';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboards/control-center',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainLayout,
    loadChildren: () => import('./shared/views/views.route').then((mod) => mod.VIEWS_ROUTES)
  },
  {
    path: '',
    component: AuthLayout,
    loadChildren: () => import('./shared/auth/auth.routes').then((mod) => mod.AUTH_ROUTES)
  },
  {
    path: 'error/404-2',
    component: Error404Alt,
    data: {title: "Error 404 Alt"},
  },
  {
    path: 'error/500',
    component: Error500,
    data: {title: "Error 500"},
  },
  {
    path: 'landing',
    component: Landing,
    data: {title: "Landing"},
  },
  {
    path: 'tables/style-generator',
    component: TableStyleGenerator,
    data: {title: "Table Style Generator"},
  },
];
