import {Routes} from '@angular/router';
import {ControlCenter} from './control-center/control-center';
import {Subscription} from '@/app/shared/views/dashboards/subscription/subscription';
import {Marketing} from '@/app/shared/views/dashboards/marketing/marketing';
import {ProjectManagement} from '@/app/shared/views/dashboards/project-management/project-management';
import {authGuard} from '@core/guards/auth.guard';


export const DASHBOARDS_ROUTES: Routes = [
  {
    path: 'dashboards/control-center',
    component: ControlCenter,
    canActivate: [authGuard],
    data: {title: "Control Center"},
  },
  {
    path: 'dashboards/subscription',
    component: Subscription,
    canActivate: [authGuard],
    data: {title: "Subscription"},
  },
  {
    path: 'dashboards/marketing',
    component: Marketing,
    canActivate: [authGuard],
    data: {title: "Marketing"},
  },
  {
    path: 'dashboards/project-management',
    component: ProjectManagement,
    canActivate: [authGuard],
    data: {title: "Project Management"},
  },

];
