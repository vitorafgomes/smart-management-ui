import {Routes} from '@angular/router';
import {ControlCenter} from './control-center/control-center';
import {Subscription} from '@/app/shared/views/dashboards/subscription/subscription';
import {Marketing} from '@/app/shared/views/dashboards/marketing/marketing';
import {ProjectManagement} from '@/app/shared/views/dashboards/project-management/project-management';


export const DASHBOARDS_ROUTES: Routes = [
  {
    path: 'dashboards/control-center',
    component: ControlCenter,
    data: {title: "Control Center"},
  },
  {
    path: 'dashboards/subscription',
    component: Subscription,
    data: {title: "Subscription"},
  },
  {
    path: 'dashboards/marketing',
    component: Marketing,
    data: {title: "Marketing"},
  },
  {
    path: 'dashboards/project-management',
    component: ProjectManagement,
    data: {title: "Project Management"},
  },

];
