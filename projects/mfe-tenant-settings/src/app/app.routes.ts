import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent)
  }
];