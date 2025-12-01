import {Routes} from '@angular/router';
import {BlankPage} from '@/app/shared/views/blank-page/blank-page';
import {Error404} from '@/app/shared/views/error/error-404';
import {UserProfile} from '@/app/shared/views/user-profile/user-profile';
import {TenantSettings} from '@/app/shared/views/tenant-settings/tenant-settings';
import {authGuard} from '@core/guards/auth.guard';

export const VIEWS_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('./dashboards/dashboards.route').then((mod) => mod.DASHBOARDS_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./icons/icons.route').then((mod) => mod.ICONS_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./tables/tables.route').then((mod) => mod.TABLES_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./tanstack-tables/tanstack-tables.route').then((mod) => mod.TANSTACK_TABLES_ROUTES)
  },
  {
    path: 'blank-page',
    component: BlankPage,
    data: {title: "Blank Page"},
  },
  {
    path: 'user-profile',
    component: UserProfile,
    canActivate: [authGuard],
    data: {title: "User Profile"},
  },
  {
    path: 'tenant-settings',
    component: TenantSettings,
    canActivate: [authGuard],
    data: {title: "Tenant Settings"},
  },
  {
    path: '',
    loadChildren: () => import('./users/users.routes').then((mod) => mod.USERS_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./roles/roles.routes').then((mod) => mod.ROLES_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./groups/groups.routes').then((mod) => mod.GROUPS_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./role-permissions/role-permissions.routes').then((mod) => mod.ROLE_PERMISSIONS_ROUTES)
  },
  {
    path: 'error/404',
    component: Error404,
    data: {title: "Error 404"},
  },
];
