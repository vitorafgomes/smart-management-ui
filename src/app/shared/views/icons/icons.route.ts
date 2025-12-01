import {Routes} from '@angular/router';
import {System} from '@/app/shared/views/icons/system/system';
import {FontAwesome} from '@/app/shared/views/icons/font-awesome/font-awesome';
import {SmartAdmin} from '@/app/shared/views/icons/smart-admin/smart-admin';


export const ICONS_ROUTES: Routes = [
  {
    path: 'icons/system',
    component: System,
    data: {title: "System Icons"},
  },
  {
    path: 'icons/font-awesome',
    component: FontAwesome,
    data: {title: "Font Awesome Icons"},
  },
  {
    path: 'icons/smart-admin',
    component: SmartAdmin,
    data: {title: "Smart Admin Icons"},
  },
];
