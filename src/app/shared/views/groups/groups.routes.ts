import { Routes } from '@angular/router';
import { GroupsList } from './groups-list';
import { GroupCreate } from './group-create';
import { authGuard } from '@core/guards/auth.guard';

export const GROUPS_ROUTES: Routes = [
  {
    path: 'groups',
    canActivate: [authGuard],
    children: [
      { path: '', component: GroupsList, data: { title: 'Groups' } },
      { path: 'create', component: GroupCreate, data: { title: 'Create Group' } },
    ]
  }
];
