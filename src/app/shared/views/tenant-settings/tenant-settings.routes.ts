import { Routes } from '@angular/router';
import { TenantSettings } from './tenant-settings';
import { authGuard } from '@core/guards/auth.guard';

export const TENANT_SETTINGS_ROUTES: Routes = [
  {
    path: 'tenant-settings',
    component: TenantSettings,
    canActivate: [authGuard],
    data: { title: 'Tenant Settings' }
  }
];
